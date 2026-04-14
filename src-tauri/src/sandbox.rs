pub struct SandboxExecutor;

impl SandboxExecutor {
    pub fn new() -> Self {
        Self
    }

    pub async fn execute(&self, _code: String) -> Result<String, String> {
        Ok("Executed in sandbox".to_string())
    }
}
