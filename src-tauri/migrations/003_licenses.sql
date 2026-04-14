-- License management table for Pro tier validation
-- Stores license keys with cryptographic validation

CREATE TABLE licenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key_hash TEXT NOT NULL UNIQUE,
    license_type TEXT NOT NULL CHECK(license_type IN ('subscription', 'lifetime')),
    expiration_date INTEGER,
    created_at INTEGER NOT NULL,
    validated_at INTEGER NOT NULL
);

-- Index for efficient license lookup by hash
CREATE INDEX idx_licenses_key_hash ON licenses(key_hash);

-- Index for checking expired subscriptions
CREATE INDEX idx_licenses_expiration ON licenses(expiration_date);
