use std::fmt;

/// Application error types for OpenLLM Studio
///
/// This enum represents all possible error categories that can occur
/// during application operations, including network errors, Ollama API errors,
/// database errors, and parsing errors.
#[derive(Debug)]
pub enum AppError {
    /// Network-related errors (connection failures, timeouts, DNS issues)
    NetworkError(String),
    
    /// Ollama API errors (model not found, insufficient disk space, API errors)
    OllamaError(String),
    
    /// Database errors (SQLite errors, constraint violations, transaction failures)
    DatabaseError(String),
    
    /// Parsing errors (JSON parsing, invalid data format)
    ParseError(String),
    
    /// Hardware detection errors (command execution failures, parsing failures)
    HardwareError(String),
    
    /// HuggingFace API errors (search failures, download errors, authentication errors)
    HfError(String),
    
    /// Download management errors (concurrent download conflicts, cancellation errors)
    DownloadError(String),

    /// Embedded runtime or local model store errors
    RuntimeError(String),
    
    /// License validation errors (invalid key, expired license, signature verification failures)
    InvalidLicense(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::NetworkError(msg) => {
                write!(f, "Network Error: {}", msg)
            }
            AppError::OllamaError(msg) => {
                write!(f, "Ollama Error: {}", msg)
            }
            AppError::DatabaseError(msg) => {
                write!(f, "Database Error: {}", msg)
            }
            AppError::ParseError(msg) => {
                write!(f, "Parse Error: {}", msg)
            }
            AppError::HardwareError(msg) => {
                write!(f, "Hardware Detection Error: {}", msg)
            }
            AppError::HfError(msg) => {
                write!(f, "HuggingFace Error: {}", msg)
            }
            AppError::DownloadError(msg) => {
                write!(f, "Download Error: {}", msg)
            }
            AppError::RuntimeError(msg) => {
                write!(f, "Runtime Error: {}", msg)
            }
            AppError::InvalidLicense(msg) => {
                write!(f, "License Error: {}", msg)
            }
        }
    }
}

impl std::error::Error for AppError {}

// Conversion from reqwest::Error to AppError
impl From<reqwest::Error> for AppError {
    fn from(error: reqwest::Error) -> Self {
        if error.is_timeout() {
            AppError::NetworkError(format!("Request timeout: {}", error))
        } else if error.is_connect() {
            AppError::NetworkError(format!("Connection failed: {}", error))
        } else if error.is_status() {
            // HTTP status errors are considered Ollama API errors
            AppError::OllamaError(format!("API error: {}", error))
        } else {
            // Other reqwest errors default to network errors
            AppError::NetworkError(format!("Network error: {}", error))
        }
    }
}

// Conversion from serde_json::Error to AppError
impl From<serde_json::Error> for AppError {
    fn from(error: serde_json::Error) -> Self {
        AppError::ParseError(format!("JSON parsing error: {}", error))
    }
}

// Conversion from rusqlite::Error to AppError
impl From<rusqlite::Error> for AppError {
    fn from(error: rusqlite::Error) -> Self {
        AppError::DatabaseError(format!("SQLite error: {}", error))
    }
}

// Conversion from std::io::Error to AppError
impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::HardwareError(format!("IO error: {}", error))
    }
}

// Conversion from regex::Error to AppError
impl From<regex::Error> for AppError {
    fn from(error: regex::Error) -> Self {
        AppError::ParseError(format!("Regex error: {}", error))
    }
}
