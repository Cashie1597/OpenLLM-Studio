use crate::error::AppError;
use ed25519_dalek::{Signature, Verifier, VerifyingKey, SIGNATURE_LENGTH};
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};

/// License type enumeration
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum LicenseType {
    Subscription,
    Lifetime,
}

impl LicenseType {
    fn to_string(&self) -> &str {
        match self {
            LicenseType::Subscription => "subscription",
            LicenseType::Lifetime => "lifetime",
        }
    }

    fn from_string(s: &str) -> Result<Self, AppError> {
        match s {
            "subscription" => Ok(LicenseType::Subscription),
            "lifetime" => Ok(LicenseType::Lifetime),
            _ => Err(AppError::InvalidLicense("Invalid license type".to_string())),
        }
    }
}

/// License information structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LicenseInfo {
    pub license_type: LicenseType,
    pub expiration_date: Option<i64>,
    pub created_at: i64,
    pub validated_at: i64,
    pub is_valid: bool,
}

/// License Manager for validating and managing Pro tier licenses
pub struct LicenseManager {
    public_key: VerifyingKey,
}

impl LicenseManager {
    /// Create a new LicenseManager with the public key for signature verification
    ///
    /// The public key is hardcoded for offline validation without internet dependency.
    /// In production, this would be the actual Ed25519 public key from the license server.
    pub fn new() -> Result<Self, AppError> {
        // Hardcoded public key for offline validation
        // In production, this would be the actual public key from your license server
        // For now, using a placeholder that can be replaced with the real key
        let public_key_bytes = [
            0x3d, 0x40, 0x17, 0xc3, 0xe8, 0x43, 0x89, 0x5a,
            0x92, 0xb7, 0x0a, 0xa7, 0x4d, 0x1b, 0x7e, 0xbc,
            0x9c, 0x98, 0x2c, 0xcf, 0x2e, 0xc4, 0x96, 0x8c,
            0xc0, 0xcd, 0x55, 0xf1, 0x2a, 0xf4, 0x66, 0x0c,
        ];

        let public_key = VerifyingKey::from_bytes(&public_key_bytes)
            .map_err(|e| AppError::InvalidLicense(format!("Invalid public key: {}", e)))?;

        Ok(Self { public_key })
    }

    /// Validate a license key using Ed25519 cryptographic signature
    ///
    /// License key format: <license_data>:<signature_hex>
    /// License data format: <type>:<expiration_timestamp>
    ///
    /// # Arguments
    /// * `key` - The license key string to validate
    ///
    /// # Returns
    /// * `Result<LicenseInfo, AppError>` - License information if valid, error otherwise
    pub fn validate_license(&self, key: &str) -> Result<LicenseInfo, AppError> {
        // Parse license key format: <license_data>:<signature_hex>
        let parts: Vec<&str> = key.split(':').collect();
        if parts.len() != 3 {
            return Err(AppError::InvalidLicense(
                "Invalid license key format".to_string(),
            ));
        }

        let license_type_str = parts[0];
        let expiration_str = parts[1];
        let signature_hex = parts[2];

        // Parse license type
        let license_type = LicenseType::from_string(license_type_str)?;

        // Parse expiration date (0 for lifetime licenses)
        let expiration_date = expiration_str
            .parse::<i64>()
            .map_err(|_| AppError::InvalidLicense("Invalid expiration date".to_string()))?;

        // Reconstruct the signed data
        let license_data = format!("{}:{}", license_type_str, expiration_str);

        // Decode signature from hex
        let signature_bytes = hex::decode(signature_hex)
            .map_err(|_| AppError::InvalidLicense("Invalid signature format".to_string()))?;

        if signature_bytes.len() != SIGNATURE_LENGTH {
            return Err(AppError::InvalidLicense(
                "Invalid signature length".to_string(),
            ));
        }

        // Convert to fixed-size array
        let mut sig_array = [0u8; SIGNATURE_LENGTH];
        sig_array.copy_from_slice(&signature_bytes);
        let signature = Signature::from_bytes(&sig_array);

        // Verify signature
        self.public_key
            .verify(license_data.as_bytes(), &signature)
            .map_err(|_| AppError::InvalidLicense("Invalid signature".to_string()))?;

        // Check expiration for subscription licenses
        let now = chrono::Utc::now().timestamp();
        let is_valid = match license_type {
            LicenseType::Lifetime => true,
            LicenseType::Subscription => expiration_date > now,
        };

        let expiration_date_opt = if expiration_date == 0 {
            None
        } else {
            Some(expiration_date)
        };

        Ok(LicenseInfo {
            license_type,
            expiration_date: expiration_date_opt,
            created_at: now,
            validated_at: now,
            is_valid,
        })
    }

    /// Store validated license in database
    ///
    /// # Arguments
    /// * `conn` - SQLite database connection
    /// * `key` - The license key string
    /// * `info` - Validated license information
    ///
    /// # Returns
    /// * `Result<(), AppError>` - Success or database error
    pub fn store_license(
        &self,
        conn: &Connection,
        key: &str,
        info: &LicenseInfo,
    ) -> Result<(), AppError> {
        // Hash the key for storage (don't store plaintext keys)
        let key_hash = self.hash_key(key);

        conn.execute(
            "INSERT OR REPLACE INTO licenses 
             (key_hash, license_type, expiration_date, created_at, validated_at) 
             VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![
                key_hash,
                info.license_type.to_string(),
                info.expiration_date,
                info.created_at,
                info.validated_at,
            ],
        )?;

        Ok(())
    }

    /// Check if Pro tier is enabled (valid license exists)
    ///
    /// # Arguments
    /// * `conn` - SQLite database connection
    ///
    /// # Returns
    /// * `bool` - True if a valid license exists, false otherwise
    pub fn is_pro_enabled(&self, conn: &Connection) -> bool {
        match self.get_license_info(conn) {
            Ok(Some(info)) => info.is_valid,
            _ => false,
        }
    }

    /// Get current license information from database
    ///
    /// # Arguments
    /// * `conn` - SQLite database connection
    ///
    /// # Returns
    /// * `Result<Option<LicenseInfo>, AppError>` - License info if exists, None if no license
    pub fn get_license_info(&self, conn: &Connection) -> Result<Option<LicenseInfo>, AppError> {
        let mut stmt = conn.prepare(
            "SELECT license_type, expiration_date, created_at, validated_at 
             FROM licenses 
             ORDER BY validated_at DESC 
             LIMIT 1",
        )?;

        let result = stmt.query_row([], |row| {
            let license_type_str: String = row.get(0)?;
            let expiration_date: Option<i64> = row.get(1)?;
            let created_at: i64 = row.get(2)?;
            let validated_at: i64 = row.get(3)?;

            Ok((license_type_str, expiration_date, created_at, validated_at))
        });

        match result {
            Ok((license_type_str, expiration_date, created_at, validated_at)) => {
                let license_type = LicenseType::from_string(&license_type_str)?;

                // Check if still valid
                let now = chrono::Utc::now().timestamp();
                let is_valid = match license_type {
                    LicenseType::Lifetime => true,
                    LicenseType::Subscription => {
                        expiration_date.map(|exp| exp > now).unwrap_or(false)
                    }
                };

                Ok(Some(LicenseInfo {
                    license_type,
                    expiration_date,
                    created_at,
                    validated_at,
                    is_valid,
                }))
            }
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(AppError::from(e)),
        }
    }

    /// Deactivate the current license
    ///
    /// # Arguments
    /// * `conn` - SQLite database connection
    ///
    /// # Returns
    /// * `Result<(), AppError>` - Success or database error
    pub fn deactivate_license(&self, conn: &Connection) -> Result<(), AppError> {
        conn.execute("DELETE FROM licenses", [])?;
        Ok(())
    }

    /// Hash a license key using SHA-256
    ///
    /// # Arguments
    /// * `key` - The license key to hash
    ///
    /// # Returns
    /// * `String` - Hex-encoded hash
    fn hash_key(&self, key: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(key.as_bytes());
        hex::encode(hasher.finalize())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup_test_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();

        conn.execute(
            "CREATE TABLE licenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                key_hash TEXT NOT NULL UNIQUE,
                license_type TEXT NOT NULL CHECK(license_type IN ('subscription', 'lifetime')),
                expiration_date INTEGER,
                created_at INTEGER NOT NULL,
                validated_at INTEGER NOT NULL
            )",
            [],
        )
        .unwrap();

        conn
    }

    #[test]
    fn test_license_type_serialization() {
        assert_eq!(LicenseType::Subscription.to_string(), "subscription");
        assert_eq!(LicenseType::Lifetime.to_string(), "lifetime");
    }

    #[test]
    fn test_license_type_deserialization() {
        assert_eq!(
            LicenseType::from_string("subscription").unwrap(),
            LicenseType::Subscription
        );
        assert_eq!(
            LicenseType::from_string("lifetime").unwrap(),
            LicenseType::Lifetime
        );
        assert!(LicenseType::from_string("invalid").is_err());
    }

    #[test]
    fn test_validate_invalid_format() {
        let manager = LicenseManager::new().unwrap();
        let result = manager.validate_license("invalid");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_invalid_signature() {
        let manager = LicenseManager::new().unwrap();
        let key = "lifetime:0:0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
        let result = manager.validate_license(key);
        assert!(result.is_err());
    }

    #[test]
    fn test_store_and_retrieve_license() {
        let conn = setup_test_db();
        let manager = LicenseManager::new().unwrap();

        let info = LicenseInfo {
            license_type: LicenseType::Lifetime,
            expiration_date: None,
            created_at: chrono::Utc::now().timestamp(),
            validated_at: chrono::Utc::now().timestamp(),
            is_valid: true,
        };

        manager
            .store_license(&conn, "test:key:signature", &info)
            .unwrap();

        let retrieved = manager.get_license_info(&conn).unwrap();
        assert!(retrieved.is_some());
        let retrieved_info = retrieved.unwrap();
        assert_eq!(retrieved_info.license_type, LicenseType::Lifetime);
        assert!(retrieved_info.is_valid);
    }

    #[test]
    fn test_is_pro_enabled() {
        let conn = setup_test_db();
        let manager = LicenseManager::new().unwrap();

        // No license initially
        assert!(!manager.is_pro_enabled(&conn));

        // Add valid lifetime license
        let info = LicenseInfo {
            license_type: LicenseType::Lifetime,
            expiration_date: None,
            created_at: chrono::Utc::now().timestamp(),
            validated_at: chrono::Utc::now().timestamp(),
            is_valid: true,
        };

        manager
            .store_license(&conn, "test:key:signature", &info)
            .unwrap();

        assert!(manager.is_pro_enabled(&conn));
    }

    #[test]
    fn test_deactivate_license() {
        let conn = setup_test_db();
        let manager = LicenseManager::new().unwrap();

        let info = LicenseInfo {
            license_type: LicenseType::Lifetime,
            expiration_date: None,
            created_at: chrono::Utc::now().timestamp(),
            validated_at: chrono::Utc::now().timestamp(),
            is_valid: true,
        };

        manager
            .store_license(&conn, "test:key:signature", &info)
            .unwrap();
        assert!(manager.is_pro_enabled(&conn));

        manager.deactivate_license(&conn).unwrap();
        assert!(!manager.is_pro_enabled(&conn));
    }

    #[test]
    fn test_expired_subscription() {
        let conn = setup_test_db();
        let manager = LicenseManager::new().unwrap();

        // Create expired subscription (expiration in the past)
        let past_timestamp = chrono::Utc::now().timestamp() - 86400; // 1 day ago
        let info = LicenseInfo {
            license_type: LicenseType::Subscription,
            expiration_date: Some(past_timestamp),
            created_at: chrono::Utc::now().timestamp(),
            validated_at: chrono::Utc::now().timestamp(),
            is_valid: false,
        };

        manager
            .store_license(&conn, "test:key:signature", &info)
            .unwrap();

        let retrieved = manager.get_license_info(&conn).unwrap().unwrap();
        assert!(!retrieved.is_valid);
        assert!(!manager.is_pro_enabled(&conn));
    }

    #[test]
    fn test_valid_subscription() {
        let conn = setup_test_db();
        let manager = LicenseManager::new().unwrap();

        // Create valid subscription (expiration in the future)
        let future_timestamp = chrono::Utc::now().timestamp() + 86400 * 30; // 30 days from now
        let info = LicenseInfo {
            license_type: LicenseType::Subscription,
            expiration_date: Some(future_timestamp),
            created_at: chrono::Utc::now().timestamp(),
            validated_at: chrono::Utc::now().timestamp(),
            is_valid: true,
        };

        manager
            .store_license(&conn, "test:key:signature", &info)
            .unwrap();

        let retrieved = manager.get_license_info(&conn).unwrap().unwrap();
        assert!(retrieved.is_valid);
        assert!(manager.is_pro_enabled(&conn));
    }
}
