use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeSnippet {
    pub file_path: String,
    pub content: String,
    pub score: f64,
}

pub struct RAGSystem;

impl RAGSystem {
    pub fn new() -> Self {
        Self
    }

    pub async fn index_project(&self, _path: String) -> Result<(), String> {
        Ok(())
    }

    pub async fn search(&self, _query: String) -> Result<Vec<CodeSnippet>, String> {
        Ok(vec![])
    }
}
