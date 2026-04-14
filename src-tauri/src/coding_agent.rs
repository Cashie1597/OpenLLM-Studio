use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentResponse {
    pub content: String,
    pub tool_calls: Vec<ToolCall>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub tool: String,
    pub args: serde_json::Value,
    pub result: Option<String>,
}

pub struct CodingAgent;

impl CodingAgent {
    pub fn new() -> Self {
        Self
    }

    pub async fn execute_task(&self, task: String) -> Result<AgentResponse, String> {
        Ok(AgentResponse {
            content: format!("Executed: {}", task),
            tool_calls: vec![],
        })
    }
}
