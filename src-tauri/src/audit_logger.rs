use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEvent {
    pub event_type: String,
    pub details: String,
    pub timestamp: i64,
}

pub struct AuditLogger;

impl AuditLogger {
    pub fn new() -> Self {
        Self
    }

    pub fn log_event(&self, _event: AuditEvent) -> Result<(), String> {
        Ok(())
    }
}
