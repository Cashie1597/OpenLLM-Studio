pub struct SelfCheckSystem;

impl SelfCheckSystem {
    pub fn new() -> Self {
        Self
    }

    pub fn validate_code(&self, _code: &str) -> Result<(), String> {
        Ok(())
    }
}
