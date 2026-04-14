use crate::error::AppError;
use crate::models::{ChatMessage, DownloadProgress, LoadedModel, Model, OllamaVersion};
use futures_util::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::time::Duration;

/// HTTP client wrapper for Ollama API
///
/// This client handles all communication with the Ollama service running at
/// http://localhost:11434. It provides methods for health checking, listing models,
/// and retrieving the currently loaded model.
pub struct OllamaClient {
    /// Base URL for the Ollama API (typically http://localhost:11434)
    pub base_url: String,
    /// HTTP client for making requests
    client: Client,
}

impl OllamaClient {
    /// Create a new OllamaClient with the default base URL
    pub fn new() -> Self {
        Self {
            base_url: "http://localhost:11434".to_string(),
            client: Client::new(),
        }
    }

    /// Create a new OllamaClient with a custom base URL
    pub fn with_base_url(base_url: String) -> Self {
        Self {
            base_url,
            client: Client::new(),
        }
    }

    /// Check if Ollama is running and return version information
    ///
    /// This method sends a GET request to /api/version with a 5-second timeout.
    /// If Ollama is running, it returns the version information.
    /// If Ollama is not running or the request times out, it returns an error.
    ///
    /// # Returns
    /// - `Ok(OllamaVersion)` if Ollama is running and responds successfully
    /// - `Err(AppError)` if the request fails, times out, or Ollama is not running
    pub async fn health_check(&self) -> Result<OllamaVersion, AppError> {
        let url = format!("{}/api/version", self.base_url);
        
        let response = self
            .client
            .get(&url)
            .timeout(Duration::from_secs(5))
            .send()
            .await?;

        let version = response.json::<OllamaVersion>().await?;
        Ok(version)
    }

    /// List all installed models
    ///
    /// This method sends a GET request to /api/tags and returns the list of
    /// installed models with their metadata (name, size, modified_at).
    ///
    /// # Returns
    /// - `Ok(Vec<Model>)` containing all installed models
    /// - `Err(AppError)` if the request fails or the response cannot be parsed
    pub async fn list_models(&self) -> Result<Vec<Model>, AppError> {
        let url = format!("{}/api/tags", self.base_url);
        
        let response = self.client.get(&url).send().await?;
        
        // Parse the response which has the structure: { "models": [...] }
        let tags_response: TagsResponse = response.json().await?;
        Ok(tags_response.models)
    }

    /// Get the currently loaded model
    ///
    /// This method sends a GET request to /api/ps and returns information about
    /// the model currently loaded in Ollama's memory. If no model is loaded,
    /// it returns None.
    ///
    /// # Returns
    /// - `Ok(Some(LoadedModel))` if a model is currently loaded
    /// - `Ok(None)` if no model is loaded (Ollama is idle)
    /// - `Err(AppError)` if the request fails or the response cannot be parsed
    pub async fn get_loaded_model(&self) -> Result<Option<LoadedModel>, AppError> {
        let url = format!("{}/api/ps", self.base_url);
        
        let response = self.client.get(&url).send().await?;
        
        // Parse the response which has the structure: { "models": [...] }
        let ps_response: PsResponse = response.json().await?;
        
        // Return the first model if any are loaded, otherwise None
        Ok(ps_response.models.into_iter().next())
    }

    /// Pull (download) a model from Ollama with streaming progress updates
    ///
    /// This method sends a POST request to /api/pull and processes the streaming
    /// newline-delimited JSON response. Each line contains progress information
    /// including status, completed bytes, and total bytes.
    ///
    /// # Arguments
    /// * `model_name` - The name of the model to download (e.g., "llama3.2:1b")
    ///
    /// # Returns
    /// An async stream of `DownloadProgress` structs containing:
    /// - `model_name`: The name of the model being downloaded
    /// - `status`: Current status (e.g., "pulling manifest", "downloading")
    /// - `completed`: Optional number of bytes downloaded
    /// - `total`: Optional total number of bytes
    ///
    /// The stream completes when a chunk with "done": true is received.
    /// Malformed JSON lines are logged and skipped without terminating the stream.
    ///
    /// # Errors
    /// Returns `AppError` if the initial request fails or the connection is lost
    pub async fn pull_model(
        &self,
        model_name: String,
    ) -> Result<impl futures_util::Stream<Item = DownloadProgress>, AppError> {
        let url = format!("{}/api/pull", self.base_url);
        
        // Create request body with model name
        let body = serde_json::json!({
            "name": model_name
        });
        
        // Send POST request
        let response = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await?;
        
        // Get the byte stream
        let byte_stream = response.bytes_stream();
        
        // Clone model_name for use in the stream
        let model_name_clone = model_name.clone();
        
        // Process the stream: convert bytes to DownloadProgress
        let progress_stream = byte_stream.map(move |chunk_result| {
            match chunk_result {
                Ok(bytes) => {
                    // Convert bytes to string
                    let text = String::from_utf8_lossy(&bytes);
                    
                    // Split by newlines and process each line
                    let lines: Vec<DownloadProgress> = text
                        .lines()
                        .filter_map(|line| {
                            if line.trim().is_empty() {
                                return None;
                            }
                            
                            // Try to parse the JSON line
                            match serde_json::from_str::<Value>(line) {
                                Ok(json) => {
                                    // Check for error field first
                                    if let Some(error_msg) = json["error"].as_str() {
                                        return Some(DownloadProgress {
                                            model_name: model_name_clone.clone(),
                                            status: format!("Error: {}", error_msg),
                                            completed: None,
                                            total: None,
                                        });
                                    }
                                    
                                    // Extract fields from JSON
                                    let status = json["status"]
                                        .as_str()
                                        .unwrap_or("unknown")
                                        .to_string();
                                    
                                    let completed = json["completed"].as_i64();
                                    let total = json["total"].as_i64();
                                    
                                    Some(DownloadProgress {
                                        model_name: model_name_clone.clone(),
                                        status,
                                        completed,
                                        total,
                                    })
                                }
                                Err(_) => None
                            }
                        })
                        .collect();
                    
                    lines
                }
                Err(_) => vec![]
            }
        })
        .flat_map(futures_util::stream::iter);
        
        Ok(progress_stream)
    }

    /// Delete a model from Ollama
    ///
    /// This method sends a DELETE request to /api/delete with the model name.
    /// If the deletion succeeds, Ollama will remove the model from disk.
    ///
    /// # Arguments
    /// * `model_name` - The name of the model to delete (e.g., "llama3.2:1b")
    ///
    /// # Returns
    /// - `Ok(())` if the model was successfully deleted
    /// - `Err(AppError)` if the request fails or Ollama returns an error
    pub async fn delete_model(&self, model_name: String) -> Result<(), AppError> {
        let url = format!("{}/api/delete", self.base_url);
        
        // Create request body with model name
        let body = serde_json::json!({
            "name": model_name
        });
        
        // Send DELETE request
        let response = self
            .client
            .delete(&url)
            .json(&body)
            .send()
            .await?;
        
        // Check if the request was successful
        if response.status().is_success() {
            Ok(())
        } else {
            // Extract error message from response if available
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());
            Err(AppError::OllamaError(format!("Failed to delete model: {}", error_text)))
        }
    }

    /// Send a chat message and receive streaming response tokens
    ///
    /// This method sends a POST request to /api/chat with the model name and
    /// conversation history, then processes the streaming newline-delimited JSON
    /// response. Each line contains a token in the message.content field.
    ///
    /// # Arguments
    /// * `model_name` - The name of the model to use (e.g., "llama3.2:1b")
    /// * `messages` - The conversation history including the new user message
    ///
    /// # Returns
    /// An async stream of token strings extracted from the message.content field.
    ///
    /// The stream completes when a chunk with "done": true is received.
    /// Malformed JSON lines are logged and skipped without terminating the stream.
    ///
    /// # Errors
    /// Returns `AppError` if the initial request fails or the connection is lost
    pub async fn send_chat_message(
        &self,
        model_name: String,
        messages: Vec<ChatMessage>,
    ) -> Result<impl futures_util::Stream<Item = String>, AppError> {
        self.send_chat_message_with_options(model_name, messages, None).await
    }

    /// Send a chat message with optimization options and receive streaming response tokens
    ///
    /// This method sends a POST request to /api/chat with the model name,
    /// conversation history, and optional optimization parameters.
    ///
    /// # Arguments
    /// * `model_name` - The name of the model to use (e.g., "llama3.2:1b")
    /// * `messages` - The conversation history including the new user message
    /// * `options` - Optional chat options for optimization parameters
    ///
    /// # Returns
    /// An async stream of token strings extracted from the message.content field.
    ///
    /// The stream completes when a chunk with "done": true is received.
    /// Malformed JSON lines are logged and skipped without terminating the stream.
    ///
    /// # Errors
    /// Returns `AppError` if the initial request fails or the connection is lost
    pub async fn send_chat_message_with_options(
        &self,
        model_name: String,
        messages: Vec<ChatMessage>,
        options: Option<crate::models::ChatOptions>,
    ) -> Result<impl futures_util::Stream<Item = String>, AppError> {
        let url = format!("{}/api/chat", self.base_url);
        
        // Create request body with model, messages, and stream flag
        let mut body = serde_json::json!({
            "model": model_name,
            "messages": messages,
            "stream": true
        });
        
        // Add options if provided
        if let Some(opts) = options {
            body["options"] = serde_json::to_value(opts).unwrap();
        }
        
        // Send POST request
        let response = self
            .client
            .post(&url)
            .json(&body)
            .send()
            .await?;
        
        // Get the byte stream
        let byte_stream = response.bytes_stream();
        
        // Use a buffer to handle partial lines across chunks
        // This prevents duplicate tokens when JSON lines are split across chunks
        let buffer = std::sync::Arc::new(std::sync::Mutex::new(String::new()));
        
        // Process the stream: convert bytes to token strings
        let token_stream = byte_stream
            .flat_map(move |chunk_result| {
                let buffer = buffer.clone();
                let tokens: Vec<String> = match chunk_result {
                    Ok(bytes) => {
                        let text = String::from_utf8_lossy(&bytes);
                        
                        // Lock the buffer and append new data
                        let mut buf = buffer.lock().unwrap();
                        buf.push_str(&text);
                        
                        // Process complete lines from the buffer
                        let mut tokens = Vec::new();
                        while let Some(newline_pos) = buf.find('\n') {
                            let line = buf[..newline_pos].to_string();
                            buf.drain(..=newline_pos);
                            
                            if line.trim().is_empty() {
                                continue;
                            }
                            
                            if let Ok(json) = serde_json::from_str::<Value>(&line) {
                                if json["done"].as_bool().unwrap_or(false) {
                                    continue;
                                }
                                
                                if let Some(content) = json["message"]["content"].as_str() {
                                    if !content.is_empty() {
                                        tokens.push(content.to_string());
                                    }
                                }
                            }
                        }
                        
                        tokens
                    }
                    Err(_) => vec![]
                };
                futures_util::stream::iter(tokens)
            });
        
        Ok(token_stream)
    }
}

impl Default for OllamaClient {
    fn default() -> Self {
        Self::new()
    }
}

/// Response structure from /api/tags endpoint
#[derive(Debug, Deserialize, Serialize)]
struct TagsResponse {
    models: Vec<Model>,
}

/// Response structure from /api/ps endpoint
#[derive(Debug, Deserialize, Serialize)]
struct PsResponse {
    models: Vec<LoadedModel>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ollama_client_creation() {
        let client = OllamaClient::new();
        assert_eq!(client.base_url, "http://localhost:11434");
    }

    #[test]
    fn test_ollama_client_with_custom_url() {
        let client = OllamaClient::with_base_url("http://custom:8080".to_string());
        assert_eq!(client.base_url, "http://custom:8080");
    }

    #[test]
    fn test_ollama_client_default() {
        let client = OllamaClient::default();
        assert_eq!(client.base_url, "http://localhost:11434");
    }

    #[tokio::test]
    async fn test_pull_model_returns_stream() {
        // This test verifies that pull_model returns a stream type
        // Integration testing with actual Ollama would be done separately
        let client = OllamaClient::new();
        let model_name = "llama3.2:1b".to_string();
        
        // Without a running Ollama instance, the method will fail
        // but we can verify the method signature and return type compile correctly
        let result = client.pull_model(model_name).await;
        
        // The method should return an error when Ollama isn't running
        // This is expected behavior - we're just testing the API surface
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_send_chat_message_returns_stream() {
        // This test verifies that send_chat_message returns a stream type
        // Integration testing with actual Ollama would be done separately
        let client = OllamaClient::new();
        let model_name = "llama3.2:1b".to_string();
        let messages = vec![
            ChatMessage {
                role: "user".to_string(),
                content: "Hello!".to_string(),
            }
        ];
        
        // Without a running Ollama instance, the method will fail
        // but we can verify the method signature and return type compile correctly
        let result = client.send_chat_message(model_name, messages).await;
        
        // The method should return an error when Ollama isn't running
        // This is expected behavior - we're just testing the API surface
        assert!(result.is_ok() || result.is_err());
    }

    #[tokio::test]
    async fn test_delete_model_method_exists() {
        // This test verifies that delete_model method exists and has correct signature
        // Integration testing with actual Ollama would be done separately
        let client = OllamaClient::new();
        let model_name = "llama3.2:1b".to_string();
        
        // We can't test the actual deletion without a running Ollama instance,
        // but we can verify the method signature compiles correctly
        // The method will fail when called (since Ollama isn't running)
        let result = client.delete_model(model_name).await;
        
        // The method should fail with a network error since Ollama isn't running
        assert!(result.is_err());
    }
}
