use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InferenceBackend {
    LlamaCpp,
    VLLM,
}

pub struct BackendRouter;

impl BackendRouter {
    pub fn new() -> Self {
        Self
    }

    pub async fn switch_backend(&self, _backend: InferenceBackend) -> Result<(), String> {
        Ok(())
    }
}
