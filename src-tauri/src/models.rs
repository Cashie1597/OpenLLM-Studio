use serde::{Deserialize, Serialize};

/// Ollama version information returned from /api/version endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaVersion {
    pub version: String,
}

/// Model information returned from /api/tags endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Model {
    pub name: String,
    pub size: i64,
    pub modified_at: String,
}

/// Conversation stored in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub model_name: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

/// Message stored in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub created_at: String,
}

/// Chat message format for Ollama API requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// Download progress event emitted during model downloads
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadProgress {
    pub model_name: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub completed: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total: Option<i64>,
}

/// Currently loaded model information from /api/ps endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoadedModel {
    pub name: String,
    pub size: i64,
}

/// Hardware information detected from the system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardwareInfo {
    pub gpu_name: String,
    pub gpu_backend: GpuBackend,
    pub vram_gb: f64,
    pub ram_gb: f64,
    pub cpu_cores: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disk_space_gb: Option<f64>,
    /// True if GPU uses shared system RAM (integrated GPUs) rather than dedicated VRAM
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_shared_memory: Option<bool>,
}

/// GPU backend type for hardware acceleration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum GpuBackend {
    Nvidia,
    Amd,
    Intel,
    #[serde(rename = "apple_metal")]
    AppleMetal,
    #[serde(rename = "cpu_only")]
    CpuOnly,
}

/// HuggingFace model metadata from search results
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HfModel {
    pub id: String,
    pub downloads: i64,
    pub likes: i64,
    #[serde(rename = "lastModified")]
    pub last_modified: String,
    pub tags: Vec<String>,
}

/// HuggingFace model details for the selected repository page
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HfModelDetails {
    pub id: String,
    pub author: Option<String>,
    pub description: Option<String>,
    pub downloads: i64,
    pub likes: i64,
    #[serde(rename = "lastModified")]
    pub last_modified: String,
    pub tags: Vec<String>,
    pub pipeline_tag: Option<String>,
    pub license: Option<String>,
}

/// HuggingFace model file variant (quantization)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HfModelFile {
    pub filename: String,
    pub size: i64,
    pub quantization: Option<String>,
    pub estimated_ram_gb: f64,
}

/// HuggingFace download progress event
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HfDownloadProgress {
    pub model_name: String,
    pub repo_id: String,
    pub filename: String,
    pub bytes_downloaded: u64,
    pub total_bytes: u64,
    pub speed_mbps: f64,
    pub percentage: f64,
    pub eta_seconds: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HfDownloadStatus {
    pub model_name: String,
    pub status: String,
}

/// Optimization settings for Ollama chat requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OptimizationSettings {
    pub num_ctx: i32,
    pub num_gpu: i32,
    pub num_batch: i32,
    pub num_thread: i32,
    pub flash_attention: bool,
    pub recommended_quantization: String,
}

/// Chat options for Ollama API requests
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_predict: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_ctx: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_gpu: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_batch: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_thread: Option<i32>,
}


#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ollama_version_serialization() {
        let version = OllamaVersion {
            version: "0.1.27".to_string(),
        };
        
        let json = serde_json::to_string(&version).unwrap();
        let deserialized: OllamaVersion = serde_json::from_str(&json).unwrap();
        
        assert_eq!(version.version, deserialized.version);
    }

    #[test]
    fn test_model_serialization() {
        let model = Model {
            name: "llama3.2:1b".to_string(),
            size: 1300000000,
            modified_at: "2024-01-15T10:30:00Z".to_string(),
        };
        
        let json = serde_json::to_string(&model).unwrap();
        let deserialized: Model = serde_json::from_str(&json).unwrap();
        
        assert_eq!(model.name, deserialized.name);
        assert_eq!(model.size, deserialized.size);
        assert_eq!(model.modified_at, deserialized.modified_at);
    }

    #[test]
    fn test_conversation_serialization() {
        let conversation = Conversation {
            id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            model_name: "llama3.2:1b".to_string(),
            title: "Test Conversation".to_string(),
            created_at: "2024-01-15T10:30:00Z".to_string(),
            updated_at: "2024-01-15T10:30:00Z".to_string(),
        };
        
        let json = serde_json::to_string(&conversation).unwrap();
        let deserialized: Conversation = serde_json::from_str(&json).unwrap();
        
        assert_eq!(conversation.id, deserialized.id);
        assert_eq!(conversation.model_name, deserialized.model_name);
        assert_eq!(conversation.title, deserialized.title);
        assert_eq!(conversation.created_at, deserialized.created_at);
        assert_eq!(conversation.updated_at, deserialized.updated_at);
    }

    #[test]
    fn test_message_serialization() {
        let message = Message {
            id: "550e8400-e29b-41d4-a716-446655440001".to_string(),
            conversation_id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            role: "user".to_string(),
            content: "Hello, world!".to_string(),
            created_at: "2024-01-15T10:30:00Z".to_string(),
        };
        
        let json = serde_json::to_string(&message).unwrap();
        let deserialized: Message = serde_json::from_str(&json).unwrap();
        
        assert_eq!(message.id, deserialized.id);
        assert_eq!(message.conversation_id, deserialized.conversation_id);
        assert_eq!(message.role, deserialized.role);
        assert_eq!(message.content, deserialized.content);
        assert_eq!(message.created_at, deserialized.created_at);
    }

    #[test]
    fn test_chat_message_serialization() {
        let chat_message = ChatMessage {
            role: "user".to_string(),
            content: "Hello!".to_string(),
        };
        
        let json = serde_json::to_string(&chat_message).unwrap();
        let deserialized: ChatMessage = serde_json::from_str(&json).unwrap();
        
        assert_eq!(chat_message.role, deserialized.role);
        assert_eq!(chat_message.content, deserialized.content);
    }

    #[test]
    fn test_download_progress_serialization() {
        let progress = DownloadProgress {
            model_name: "llama3.2:1b".to_string(),
            status: "downloading".to_string(),
            completed: Some(1048576),
            total: Some(1300000000),
        };
        
        let json = serde_json::to_string(&progress).unwrap();
        let deserialized: DownloadProgress = serde_json::from_str(&json).unwrap();
        
        assert_eq!(progress.model_name, deserialized.model_name);
        assert_eq!(progress.status, deserialized.status);
        assert_eq!(progress.completed, deserialized.completed);
        assert_eq!(progress.total, deserialized.total);
    }

    #[test]
    fn test_download_progress_optional_fields() {
        let progress = DownloadProgress {
            model_name: "llama3.2:1b".to_string(),
            status: "pulling manifest".to_string(),
            completed: None,
            total: None,
        };
        
        let json = serde_json::to_string(&progress).unwrap();
        let deserialized: DownloadProgress = serde_json::from_str(&json).unwrap();
        
        assert_eq!(progress.model_name, deserialized.model_name);
        assert_eq!(progress.status, deserialized.status);
        assert_eq!(progress.completed, None);
        assert_eq!(progress.total, None);
    }

    #[test]
    fn test_loaded_model_serialization() {
        let loaded_model = LoadedModel {
            name: "llama3.2:1b".to_string(),
            size: 1300000000,
        };
        
        let json = serde_json::to_string(&loaded_model).unwrap();
        let deserialized: LoadedModel = serde_json::from_str(&json).unwrap();
        
        assert_eq!(loaded_model.name, deserialized.name);
        assert_eq!(loaded_model.size, deserialized.size);
    }

    #[test]
    fn test_message_unicode_content() {
        let message = Message {
            id: "550e8400-e29b-41d4-a716-446655440001".to_string(),
            conversation_id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            role: "user".to_string(),
            content: "Hello 👋 世界 🌍".to_string(),
            created_at: "2024-01-15T10:30:00Z".to_string(),
        };
        
        let json = serde_json::to_string(&message).unwrap();
        let deserialized: Message = serde_json::from_str(&json).unwrap();
        
        assert_eq!(message.content, deserialized.content);
    }

    #[test]
    fn test_message_special_characters() {
        let message = Message {
            id: "550e8400-e29b-41d4-a716-446655440001".to_string(),
            conversation_id: "550e8400-e29b-41d4-a716-446655440000".to_string(),
            role: "user".to_string(),
            content: "Test \"quotes\" and 'apostrophes' and \\backslashes\\ and \nnewlines".to_string(),
            created_at: "2024-01-15T10:30:00Z".to_string(),
        };
        
        let json = serde_json::to_string(&message).unwrap();
        let deserialized: Message = serde_json::from_str(&json).unwrap();
        
        assert_eq!(message.content, deserialized.content);
    }
}
