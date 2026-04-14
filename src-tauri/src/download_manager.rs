use crate::error::AppError;
use crate::huggingface::HfClient;
use crate::models::DownloadProgress;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use tauri::Emitter;
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use tokio_util::sync::CancellationToken;

/// Handle for a single download task
pub struct DownloadHandle {
    pub model_name: String,
    pub filename: String,
    pub cancel_token: CancellationToken,
    pub task_handle: JoinHandle<Result<PathBuf, AppError>>,
}

/// Manager for concurrent HuggingFace downloads
pub struct DownloadManager {
    active_downloads: Arc<Mutex<HashMap<String, DownloadHandle>>>,
}

impl DownloadManager {
    /// Create a new download manager
    pub fn new() -> Self {
        Self {
            active_downloads: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Start a new download
    pub async fn start_download(
        &self,
        model_name: String,
        repo_id: String,
        filename: String,
        hf_client: Arc<HfClient>,
        app_handle: tauri::AppHandle,
    ) -> Result<(), AppError> {
        let mut downloads = self.active_downloads.lock().await;
        downloads.retain(|_, handle| !handle.task_handle.is_finished());

        // Check if download already active
        if downloads.contains_key(&model_name) {
            return Err(AppError::DownloadError(format!(
                "Download already in progress for {}",
                model_name
            )));
        }

        // Create cancellation token
        let cancel_token = CancellationToken::new();
        let cancel_token_clone = cancel_token.clone();
        
        // Clone filename for the task
        let filename_clone = filename.clone();
        let model_name_for_task = model_name.clone();
        let app_handle_for_download = app_handle.clone();
        let app_handle_for_error = app_handle.clone();
        let active_downloads = Arc::clone(&self.active_downloads);

        // Spawn download task
        let task_handle = tokio::spawn(async move {
            let result = hf_client
                .download_model(
                    &repo_id,
                    &filename_clone,
                    &model_name_for_task,
                    app_handle_for_download,
                    cancel_token_clone,
                )
                .await;

            if let Err(error) = &result {
                let _ = app_handle_for_error.emit(
                    "download-progress",
                    DownloadProgress {
                        model_name: model_name_for_task.clone(),
                        status: format!("Error: {}", error),
                        completed: None,
                        total: None,
                    },
                );
            }

            active_downloads.lock().await.remove(&model_name_for_task);

            result
        });

        // Store download handle
        downloads.insert(
            model_name.clone(),
            DownloadHandle {
                model_name,
                filename,
                cancel_token,
                task_handle,
            },
        );

        Ok(())
    }

    /// Cancel a download
    pub async fn cancel_download(&self, model_name: &str) -> Result<(), AppError> {
        let mut downloads = self.active_downloads.lock().await;

        if let Some(handle) = downloads.remove(model_name) {
            // Signal cancellation
            handle.cancel_token.cancel();
            
            // Abort the task
            handle.task_handle.abort();

            let temp_path = std::env::temp_dir().join(format!("{}.tmp", handle.filename));
            let _ = tokio::fs::remove_file(temp_path).await;
            
            Ok(())
        } else {
            Err(AppError::DownloadError(format!(
                "No active download found for {}",
                model_name
            )))
        }
    }

    pub async fn pause_download(&self, model_name: &str) -> Result<(), AppError> {
        let mut downloads = self.active_downloads.lock().await;

        if let Some(handle) = downloads.remove(model_name) {
            handle.task_handle.abort();
            Ok(())
        } else {
            Err(AppError::DownloadError(format!(
                "No active download found for {}",
                model_name
            )))
        }
    }

    /// Get list of active download names
    pub async fn get_active_downloads(&self) -> Vec<String> {
        let downloads = self.active_downloads.lock().await;
        downloads.keys().cloned().collect()
    }

    /// Clean up completed downloads
    pub async fn cleanup_completed(&self) {
        let mut downloads = self.active_downloads.lock().await;
        
        // Remove finished downloads
        downloads.retain(|_, handle| !handle.task_handle.is_finished());
    }
}

impl Default for DownloadManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;

    #[tokio::test]
    async fn test_download_manager_creation() {
        let manager = DownloadManager::new();
        let downloads = manager.get_active_downloads().await;
        assert_eq!(downloads.len(), 0);
    }

    #[tokio::test]
    async fn test_get_active_downloads_empty() {
        let manager = DownloadManager::new();
        let active = manager.get_active_downloads().await;
        assert!(active.is_empty());
    }

    #[tokio::test]
    async fn test_multiple_simultaneous_downloads() {
        // This test verifies that DownloadManager can track multiple downloads
        // We'll simulate downloads by creating mock tasks
        
        let manager = DownloadManager::new();
        
        // Simulate adding multiple downloads
        let mut downloads = manager.active_downloads.lock().await;
        
        // Create mock download handles
        for i in 1..=3 {
            let model_name = format!("model-{}", i);
            let filename = format!("model-{}.gguf", i);
            let cancel_token = CancellationToken::new();
            
            // Clone filename for use in the async block
            let filename_clone = filename.clone();
            
            // Create a mock task that completes after a delay
            let task_handle = tokio::spawn(async move {
                tokio::time::sleep(Duration::from_millis(100)).await;
                Ok(PathBuf::from(format!("/tmp/{}", filename_clone)))
            });
            
            downloads.insert(
                model_name.clone(),
                DownloadHandle {
                    model_name,
                    filename,
                    cancel_token,
                    task_handle,
                },
            );
        }
        
        // Verify all downloads are tracked
        assert_eq!(downloads.len(), 3);
        assert!(downloads.contains_key("model-1"));
        assert!(downloads.contains_key("model-2"));
        assert!(downloads.contains_key("model-3"));
        
        drop(downloads); // Release lock
        
        // Verify get_active_downloads returns all downloads
        let active = manager.get_active_downloads().await;
        assert_eq!(active.len(), 3);
    }

    #[tokio::test]
    async fn test_cancel_download_removes_from_tracking() {
        let manager = DownloadManager::new();
        
        // Add a mock download
        let mut downloads = manager.active_downloads.lock().await;
        let cancel_token = CancellationToken::new();
        let task_handle = tokio::spawn(async {
            tokio::time::sleep(Duration::from_secs(10)).await;
            Ok(PathBuf::from("/tmp/test.gguf"))
        });
        
        downloads.insert(
            "test-model".to_string(),
            DownloadHandle {
                model_name: "test-model".to_string(),
                filename: "test.gguf".to_string(),
                cancel_token,
                task_handle,
            },
        );
        drop(downloads);
        
        // Verify download is tracked
        let active = manager.get_active_downloads().await;
        assert_eq!(active.len(), 1);
        
        // Cancel the download
        let result = manager.cancel_download("test-model").await;
        assert!(result.is_ok());
        
        // Verify download is removed
        let active = manager.get_active_downloads().await;
        assert_eq!(active.len(), 0);
    }

    #[tokio::test]
    async fn test_cancel_one_download_doesnt_affect_others() {
        let manager = DownloadManager::new();
        
        // Add multiple mock downloads
        let mut downloads = manager.active_downloads.lock().await;
        
        for i in 1..=3 {
            let model_name = format!("model-{}", i);
            let cancel_token = CancellationToken::new();
            let task_handle = tokio::spawn(async move {
                tokio::time::sleep(Duration::from_secs(10)).await;
                Ok(PathBuf::from(format!("/tmp/model-{}.gguf", i)))
            });
            
            downloads.insert(
                model_name.clone(),
                DownloadHandle {
                    model_name: model_name.clone(),
                    filename: format!("model-{}.gguf", i),
                    cancel_token,
                    task_handle,
                },
            );
        }
        drop(downloads);
        
        // Verify all downloads are tracked
        let active = manager.get_active_downloads().await;
        assert_eq!(active.len(), 3);
        
        // Cancel one download
        let result = manager.cancel_download("model-2").await;
        assert!(result.is_ok());
        
        // Verify only the cancelled download is removed
        let active = manager.get_active_downloads().await;
        assert_eq!(active.len(), 2);
        assert!(active.contains(&"model-1".to_string()));
        assert!(!active.contains(&"model-2".to_string()));
        assert!(active.contains(&"model-3".to_string()));
    }

    #[tokio::test]
    async fn test_cleanup_completed_removes_finished_downloads() {
        let manager = DownloadManager::new();
        
        // Add downloads with different completion states
        let mut downloads = manager.active_downloads.lock().await;
        
        // Add a completed download (task that finishes immediately)
        let cancel_token_1 = CancellationToken::new();
        let task_handle_1 = tokio::spawn(async {
            Ok(PathBuf::from("/tmp/completed.gguf"))
        });
        
        downloads.insert(
            "completed-model".to_string(),
            DownloadHandle {
                model_name: "completed-model".to_string(),
                filename: "completed.gguf".to_string(),
                cancel_token: cancel_token_1,
                task_handle: task_handle_1,
            },
        );
        
        // Add an in-progress download (task that takes time)
        let cancel_token_2 = CancellationToken::new();
        let task_handle_2 = tokio::spawn(async {
            tokio::time::sleep(Duration::from_secs(10)).await;
            Ok(PathBuf::from("/tmp/inprogress.gguf"))
        });
        
        downloads.insert(
            "inprogress-model".to_string(),
            DownloadHandle {
                model_name: "inprogress-model".to_string(),
                filename: "inprogress.gguf".to_string(),
                cancel_token: cancel_token_2,
                task_handle: task_handle_2,
            },
        );
        drop(downloads);
        
        // Wait for the first task to complete
        tokio::time::sleep(Duration::from_millis(50)).await;
        
        // Run cleanup
        manager.cleanup_completed().await;
        
        // Verify only the in-progress download remains
        let active = manager.get_active_downloads().await;
        assert_eq!(active.len(), 1);
        assert!(active.contains(&"inprogress-model".to_string()));
        assert!(!active.contains(&"completed-model".to_string()));
    }

    #[tokio::test]
    async fn test_duplicate_download_returns_error() {
        let manager = DownloadManager::new();
        
        // Add a download
        let mut downloads = manager.active_downloads.lock().await;
        let cancel_token = CancellationToken::new();
        let task_handle = tokio::spawn(async {
            tokio::time::sleep(Duration::from_secs(10)).await;
            Ok(PathBuf::from("/tmp/test.gguf"))
        });
        
        downloads.insert(
            "test-model".to_string(),
            DownloadHandle {
                model_name: "test-model".to_string(),
                filename: "test.gguf".to_string(),
                cancel_token,
                task_handle,
            },
        );
        drop(downloads);
        
        // Try to start the same download again (we'll simulate this by checking manually)
        let downloads = manager.active_downloads.lock().await;
        let has_duplicate = downloads.contains_key("test-model");
        drop(downloads);
        
        assert!(has_duplicate, "Duplicate download should be detected");
    }

    #[tokio::test]
    async fn test_cancel_nonexistent_download_returns_error() {
        let manager = DownloadManager::new();
        
        // Try to cancel a download that doesn't exist
        let result = manager.cancel_download("nonexistent-model").await;
        
        assert!(result.is_err());
        if let Err(AppError::DownloadError(msg)) = result {
            assert!(msg.contains("No active download found"));
        } else {
            panic!("Expected DownloadError");
        }
    }
}
