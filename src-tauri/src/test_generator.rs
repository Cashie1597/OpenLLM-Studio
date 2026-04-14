pub struct TestGenerator;

impl TestGenerator {
    pub fn new() -> Self {
        Self
    }

    pub async fn generate_tests(&self, _code: String) -> Result<String, String> {
        Ok("// Generated tests".to_string())
    }
}
