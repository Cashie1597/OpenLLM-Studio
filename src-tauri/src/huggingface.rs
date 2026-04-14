use crate::error::AppError;
use crate::model_store::{self, LocalModelManifest};
use crate::models::{DownloadProgress, HfDownloadProgress, HfDownloadStatus, HfModel, HfModelDetails, HfModelFile};
use futures_util::StreamExt;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};
use tauri::Emitter;
use tokio::fs::File;
use tokio::io::AsyncWriteExt;
use tokio_util::sync::CancellationToken;

/// HuggingFace API client for model search, file listing, and downloads
pub struct HfClient {
    client: reqwest::Client,
    token: Option<String>,
}

impl HfClient {
    /// Create a new HuggingFace client with optional authentication token
    pub fn new(token: Option<String>) -> Self {
        Self {
            client: reqwest::Client::builder()
                .no_proxy()
                .connect_timeout(Duration::from_secs(8))
                .timeout(Duration::from_secs(20))
                .build()
                .unwrap_or_else(|_| reqwest::Client::new()),
            token,
        }
    }

    /// Search for GGUF models on HuggingFace
    pub async fn search_models(
        &self,
        query: &str,
        page: usize,
    ) -> Result<Vec<HfModel>, AppError> {
        let skip = page * 20;
        let url = format!(
            "https://huggingface.co/api/models?library=gguf&search={}&limit=20&skip={}",
            urlencoding::encode(query),
            skip
        );

        let mut request = self.client.get(&url);
        if let Some(token) = &self.token {
            request = request.header("Authorization", format!("Bearer {}", token));
        }

        let response = request.send().await?;
        
        // Handle rate limiting
        if response.status() == 429 {
            let retry_after = response
                .headers()
                .get("retry-after")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(60);
            
            return Err(AppError::HfError(format!(
                "Rate limit exceeded. Please retry after {} seconds",
                retry_after
            )));
        }
        
        if !response.status().is_success() {
            return Err(AppError::HfError(format!(
                "Search failed with status: {}",
                response.status()
            )));
        }

        let models: Vec<serde_json::Value> = response.json().await?;
        
        let parsed_models = models
            .into_iter()
            .filter_map(|m| {
                let tags: Vec<String> = m["tags"]
                    .as_array()
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(|s| s.to_string()))
                            .collect()
                    })
                    .unwrap_or_default();

                let library_name = m["library_name"].as_str().unwrap_or_default();
                let has_gguf_tag = tags.iter().any(|tag| tag.eq_ignore_ascii_case("gguf"));
                let is_gguf_repo = has_gguf_tag || library_name.eq_ignore_ascii_case("gguf");

                if !is_gguf_repo {
                    return None;
                }

                Some(HfModel {
                    id: m["id"].as_str().unwrap_or("Unknown").to_string(),
                    downloads: m["downloads"].as_i64().unwrap_or(0),
                    likes: m["likes"].as_i64().unwrap_or(0),
                    last_modified: m["lastModified"]
                        .as_str()
                        .unwrap_or("Unknown")
                        .to_string(),
                    tags,
                })
            })
            .collect();

        Ok(parsed_models)
    }

    /// Get list of files for a model repository
    pub async fn get_model_files(&self, repo_id: &str) -> Result<Vec<HfModelFile>, AppError> {
        let url = format!("https://huggingface.co/api/models/{}/tree/main", repo_id);

        let mut request = self.client.get(&url);
        if let Some(token) = &self.token {
            request = request.header("Authorization", format!("Bearer {}", token));
        }

        let response = request.send().await?;
        
        // Handle rate limiting
        if response.status() == 429 {
            let retry_after = response
                .headers()
                .get("retry-after")
                .and_then(|v| v.to_str().ok())
                .and_then(|s| s.parse::<u64>().ok())
                .unwrap_or(60);
            
            return Err(AppError::HfError(format!(
                "Rate limit exceeded. Please retry after {} seconds",
                retry_after
            )));
        }
        
        if !response.status().is_success() {
            return Err(AppError::HfError(format!(
                "Failed to get model files with status: {}",
                response.status()
            )));
        }

        let files: Vec<serde_json::Value> = response.json().await?;
        
        let mut gguf_files: Vec<HfModelFile> = files
            .into_iter()
            .filter(|f| {
                f["path"]
                    .as_str()
                    .map(|p| p.ends_with(".gguf"))
                    .unwrap_or(false)
            })
            .map(|f| {
                let filename = f["path"].as_str().unwrap_or("unknown.gguf").to_string();
                let size = f["size"].as_i64().unwrap_or(0);
                let quantization = Self::parse_quantization(&filename);
                let estimated_ram_gb = (size as f64 / 1_073_741_824.0) * 1.2;

                HfModelFile {
                    filename,
                    size,
                    quantization,
                    estimated_ram_gb,
                }
            })
            .collect();

        // Sort by quantization quality (Q8_0 first, Q2_K last)
        gguf_files.sort_by(|a, b| {
            let order_a = Self::quantization_order(&a.quantization);
            let order_b = Self::quantization_order(&b.quantization);
            order_a.cmp(&order_b)
        });

        Ok(gguf_files)
    }

    pub async fn get_model_details(&self, repo_id: &str) -> Result<HfModelDetails, AppError> {
        let url = format!("https://huggingface.co/api/models/{}", repo_id);

        let mut request = self.client.get(&url);
        if let Some(token) = &self.token {
            request = request.header("Authorization", format!("Bearer {}", token));
        }

        let response = request.send().await?;
        if !response.status().is_success() {
            return Err(AppError::HfError(format!(
                "Failed to get model details with status: {}",
                response.status()
            )));
        }

        let model: serde_json::Value = response.json().await?;
        let tags: Vec<String> = model["tags"]
            .as_array()
            .map(|arr| {
                arr.iter()
                    .filter_map(|value| value.as_str().map(|s| s.to_string()))
                    .collect()
            })
            .unwrap_or_default();

        Ok(HfModelDetails {
            id: model["id"].as_str().unwrap_or(repo_id).to_string(),
            author: model["author"].as_str().map(|s| s.to_string()),
            description: model["cardData"]["summary"]
                .as_str()
                .map(|s| s.to_string())
                .or_else(|| model["description"].as_str().map(|s| s.to_string())),
            downloads: model["downloads"].as_i64().unwrap_or(0),
            likes: model["likes"].as_i64().unwrap_or(0),
            last_modified: model["lastModified"].as_str().unwrap_or_default().to_string(),
            tags,
            pipeline_tag: model["pipeline_tag"].as_str().map(|s| s.to_string()),
            license: model["cardData"]["license"]
                .as_str()
                .map(|s| s.to_string())
                .or_else(|| model["license"].as_str().map(|s| s.to_string())),
        })
    }

    /// Parse quantization type from filename
    fn parse_quantization(filename: &str) -> Option<String> {
        let patterns = [
            "Q8_0", "Q6_K", "Q5_K_M", "Q5_K_S", "Q5_1", "Q5_0", "Q4_K_M", "Q4_K_S", "Q4_1",
            "Q4_0", "Q3_K_L", "Q3_K_M", "Q3_K_S", "Q2_K", "F32", "F16",
        ];

        let upper_filename = filename.to_uppercase();
        for pattern in patterns {
            if upper_filename.contains(pattern) {
                return Some(pattern.to_string());
            }
        }
        None
    }

    /// Get sort order for quantization (lower is better quality)
    fn quantization_order(quant: &Option<String>) -> i32 {
        match quant.as_deref() {
            Some("F32") => 0,
            Some("F16") => 1,
            Some("Q8_0") => 2,
            Some("Q6_K") => 3,
            Some("Q5_K_M") => 4,
            Some("Q5_K_S") => 5,
            Some("Q5_1") => 6,
            Some("Q5_0") => 7,
            Some("Q4_K_M") => 8,
            Some("Q4_K_S") => 9,
            Some("Q4_1") => 10,
            Some("Q4_0") => 11,
            Some("Q3_K_L") => 12,
            Some("Q3_K_M") => 13,
            Some("Q3_K_S") => 14,
            Some("Q2_K") => 15,
            _ => 99,
        }
    }

    /// Validate HuggingFace token
    pub async fn validate_token(&self, token: &str) -> Result<String, AppError> {
        println!("[HF] Starting token validation...");
        println!("[HF] Token length: {}", token.len());
        println!("[HF] Token prefix: {}...", &token[..token.len().min(10)]);
        
        let url = "https://huggingface.co/api/whoami-v2";
        println!("[HF] Sending request to: {}", url);
        
        let response = match self
            .client
            .get(url)
            .header("Authorization", format!("Bearer {}", token))
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await
        {
            Ok(resp) => {
                println!("[HF] Request successful, status: {}", resp.status());
                resp
            }
            Err(e) => {
                println!("[HF] Request failed: {:?}", e);
                if e.is_timeout() {
                    return Err(AppError::HfError("Request timeout. Please check your internet connection.".to_string()));
                } else if e.is_connect() {
                    return Err(AppError::HfError("Connection error. Please check your internet connection.".to_string()));
                } else {
                    return Err(AppError::HfError(format!("Network error: {}", e)));
                }
            }
        };

        let status = response.status();
        println!("[HF] Response status code: {}", status);
        
        // Get response body for better error messages
        let response_text = match response.text().await {
            Ok(text) => {
                println!("[HF] Response body: {}", text);
                text
            }
            Err(e) => {
                println!("[HF] Failed to read response body: {:?}", e);
                return Err(AppError::HfError(format!("Failed to read response: {}", e)));
            }
        };
        
        if status == 401 {
            println!("[HF] Authentication failed - invalid token");
            // Parse error message from response
            if let Ok(error_json) = serde_json::from_str::<serde_json::Value>(&response_text) {
                if let Some(error_msg) = error_json["error"].as_str() {
                    return Err(AppError::HfError(format!(
                        "Authentication failed: {}. Please verify your token at https://huggingface.co/settings/tokens",
                        error_msg
                    )));
                }
            }
            return Err(AppError::HfError(
                "Invalid token. Please check your HuggingFace token and try again. Make sure the token is active and has READ permissions.".to_string()
            ));
        }

        if !status.is_success() {
            println!("[HF] Request failed with status: {}", status);
            return Err(AppError::HfError(format!(
                "Token validation failed with status: {}. Response: {}",
                status, response_text
            )));
        }

        println!("[HF] Parsing response JSON...");
        let data: serde_json::Value = match serde_json::from_str(&response_text) {
            Ok(json) => {
                println!("[HF] Successfully parsed JSON");
                json
            }
            Err(e) => {
                println!("[HF] Failed to parse JSON: {:?}", e);
                return Err(AppError::HfError(format!("Failed to parse response: {}", e)));
            }
        };
        
        println!("[HF] JSON data: {:?}", data);
        
        // Try multiple fields for username
        let username = data["name"]
            .as_str()
            .or_else(|| {
                println!("[HF] 'name' field not found, trying 'fullname'");
                data["fullname"].as_str()
            })
            .or_else(|| {
                println!("[HF] 'fullname' field not found, trying 'username'");
                data["username"].as_str()
            })
            .unwrap_or_else(|| {
                println!("[HF] No username field found, using 'Unknown'");
                "Unknown"
            })
            .to_string();

        println!("[HF] Extracted username: {}", username);
        Ok(username)
    }

    /// Download a model file from HuggingFace
    pub async fn download_model(
        &self,
        repo_id: &str,
        filename: &str,
        model_name: &str,
        app_handle: tauri::AppHandle,
        cancel_token: CancellationToken,
    ) -> Result<PathBuf, AppError> {
        let url = format!(
            "https://huggingface.co/{}/resolve/main/{}",
            repo_id, filename
        );

        let temp_dir = std::env::temp_dir();
        let temp_path = temp_dir.join(format!("{}.tmp", filename));
        let download_client = reqwest::Client::builder()
            .no_proxy()
            .connect_timeout(Duration::from_secs(15))
            .tcp_keepalive(Some(Duration::from_secs(30)))
            .build()?;

        let mut downloaded: u64 = 0;
        let mut total_bytes: u64 = 0;
        let start_time = Instant::now();

        for attempt in 1..=3 {
            if cancel_token.is_cancelled() {
                let _ = tokio::fs::remove_file(&temp_path).await;
                return Err(AppError::DownloadError("Download cancelled".to_string()));
            }

            let mut resume_from = 0u64;
            if let Ok(metadata) = tokio::fs::metadata(&temp_path).await {
                resume_from = metadata.len();
            }

            println!("[HF] Download attempt {} for {} starting at byte {}", attempt, filename, resume_from);

            let mut request = download_client.get(&url);
            if let Some(token) = &self.token {
                request = request.header("Authorization", format!("Bearer {}", token));
            }
            if resume_from > 0 {
                request = request.header("Range", format!("bytes={}-", resume_from));
            }

            let response = match request.send().await {
                Ok(response) => response,
                Err(error) => {
                    if attempt < 3 {
                        let _ = app_handle.emit(
                            "hf-download-status",
                            HfDownloadStatus {
                                model_name: model_name.to_string(),
                                status: format!("Connection interrupted, retrying... ({}/3)", attempt + 1),
                            },
                        );
                        tokio::time::sleep(Duration::from_secs(attempt as u64)).await;
                        continue;
                    }
                    return Err(AppError::NetworkError(format!(
                        "Network error starting download: {}. You can retry and resume the download.",
                        error
                    )));
                }
            };

            if response.status() == 429 {
                let retry_after = response
                    .headers()
                    .get("retry-after")
                    .and_then(|v| v.to_str().ok())
                    .and_then(|s| s.parse::<u64>().ok())
                    .unwrap_or(60);
                
                return Err(AppError::HfError(format!(
                    "Rate limit exceeded. Please retry after {} seconds",
                    retry_after
                )));
            }

            if !(response.status().is_success() || response.status() == reqwest::StatusCode::PARTIAL_CONTENT) {
                return Err(AppError::HfError(format!(
                    "Download failed with status: {}",
                    response.status()
                )));
            }

            let response_start = if response.status() == reqwest::StatusCode::PARTIAL_CONTENT {
                resume_from
            } else {
                0
            };

            let response_bytes = response.content_length().unwrap_or(0);
            total_bytes = response_bytes.saturating_add(response_start);
            downloaded = response_start;

            let mut file = if response_start > 0 {
                tokio::fs::OpenOptions::new()
                    .append(true)
                    .open(&temp_path)
                    .await?
            } else {
                File::create(&temp_path).await?
            };

            let mut stream = response.bytes_stream();
            let mut last_emit = Instant::now();
            let mut stream_failed = false;

            while let Some(chunk_result) = stream.next().await {
                if cancel_token.is_cancelled() {
                    let _ = tokio::fs::remove_file(&temp_path).await;
                    return Err(AppError::DownloadError("Download cancelled".to_string()));
                }

                let chunk = match chunk_result {
                    Ok(chunk) => chunk,
                    Err(error) => {
                        stream_failed = true;
                        println!("[HF] Streaming error on attempt {}: {}", attempt, error);
                        break;
                    }
                };

                if let Err(error) = file.write_all(&chunk).await {
                    return Err(AppError::DownloadError(format!(
                        "Failed to write to disk: {}. Please check available disk space.",
                        error
                    )));
                }

                downloaded += chunk.len() as u64;

                if last_emit.elapsed() > Duration::from_millis(500) {
                    let elapsed = start_time.elapsed().as_secs_f64();
                    let speed_mbps = if elapsed > 0.0 {
                        (downloaded as f64 / 1_048_576.0) / elapsed
                    } else {
                        0.0
                    };
                    let percentage = if total_bytes > 0 {
                        (downloaded as f64 / total_bytes as f64) * 100.0
                    } else {
                        0.0
                    };
                    let eta_seconds = if speed_mbps > 0.0 && total_bytes > 0 {
                        Some((((total_bytes - downloaded) as f64 / 1_048_576.0) / speed_mbps) as u64)
                    } else {
                        None
                    };

                    let progress = HfDownloadProgress {
                        model_name: model_name.to_string(),
                        repo_id: repo_id.to_string(),
                        filename: filename.to_string(),
                        bytes_downloaded: downloaded,
                        total_bytes,
                        speed_mbps,
                        percentage,
                        eta_seconds,
                    };

                    let _ = app_handle.emit("hf-download-progress", &progress);
                    let _ = app_handle.emit(
                        "download-progress",
                        DownloadProgress {
                            model_name: model_name.to_string(),
                            status: "downloading".to_string(),
                            completed: Some(downloaded as i64),
                            total: Some(total_bytes as i64),
                        },
                    );
                    last_emit = Instant::now();
                }
            }

            file.flush().await?;
            drop(file);

            if stream_failed {
                if attempt < 3 {
                    let _ = app_handle.emit(
                        "hf-download-status",
                        HfDownloadStatus {
                            model_name: model_name.to_string(),
                            status: format!("Connection interrupted, retrying... ({}/3)", attempt + 1),
                        },
                    );
                    tokio::time::sleep(Duration::from_secs(attempt as u64)).await;
                    continue;
                }

                return Err(AppError::NetworkError(
                    "Network error during download. Retrying later will resume from the downloaded bytes.".to_string(),
                ));
            }

            break;
        }

        let _ = app_handle.emit(
            "hf-download-status",
            HfDownloadStatus {
                model_name: model_name.to_string(),
                status: "Validating GGUF file...".to_string(),
            },
        );
        let _ = app_handle.emit(
            "download-progress",
            DownloadProgress {
                model_name: model_name.to_string(),
                status: "validating".to_string(),
                completed: Some(downloaded as i64),
                total: Some(total_bytes as i64),
            },
        );
        
        // Validate GGUF
        println!("[HF] Validating GGUF file: {}", filename);
        if let Err(e) = Self::validate_gguf_header(&temp_path).await {
            let _ = tokio::fs::remove_file(&temp_path).await;
            let _ = app_handle.emit(
                "hf-download-status",
                HfDownloadStatus {
                    model_name: model_name.to_string(),
                    status: "Validation failed".to_string(),
                },
            );
            return Err(e);
        }
        println!("[HF] GGUF validation successful");

        let _ = app_handle.emit(
            "hf-download-status",
            HfDownloadStatus {
                model_name: model_name.to_string(),
                status: "Installing model...".to_string(),
            },
        );
        let _ = app_handle.emit(
            "download-progress",
            DownloadProgress {
                model_name: model_name.to_string(),
                status: "installing".to_string(),
                completed: Some(downloaded as i64),
                total: Some(total_bytes as i64),
            },
        );

        let models_root = model_store::models_root_for_app(&app_handle)?;
        let model_dir = model_store::ensure_model_dir(&models_root, model_name)?;
        let final_path = model_dir.join(filename);
        
        // Handle file move errors
        println!("[HF] Moving file to: {}", final_path.display());
        if let Err(e) = tokio::fs::rename(&temp_path, &final_path).await {
            let _ = tokio::fs::remove_file(&temp_path).await;
            let _ = app_handle.emit(
                "hf-download-status",
                HfDownloadStatus {
                    model_name: model_name.to_string(),
                    status: "Failed to move file".to_string(),
                },
            );
            return Err(AppError::DownloadError(format!(
                "Failed to move file into the local model store: {}. Please check permissions.",
                e
            )));
        }
        println!("[HF] File moved successfully");

        let manifest = LocalModelManifest {
            name: model_name.to_string(),
            file_name: filename.to_string(),
            file_path: final_path.to_string_lossy().to_string(),
            size: total_bytes as i64,
            modified_at: chrono::Utc::now().to_rfc3339(),
            source_repo: Some(repo_id.to_string()),
            source_filename: Some(filename.to_string()),
        };
        model_store::write_manifest(&model_dir, &manifest)?;

        let _ = app_handle.emit(
            "hf-download-status",
            HfDownloadStatus {
                model_name: model_name.to_string(),
                status: "Complete! Model ready to use".to_string(),
            },
        );
        let _ = app_handle.emit(
            "download-progress",
            DownloadProgress {
                model_name: model_name.to_string(),
                status: "success".to_string(),
                completed: Some(total_bytes as i64),
                total: Some(total_bytes as i64),
            },
        );

        Ok(final_path)
    }

    /// Validate GGUF file header
    async fn validate_gguf_header(path: &Path) -> Result<(), AppError> {
        let mut file = File::open(path).await?;
        let mut magic = [0u8; 4];
        
        use tokio::io::AsyncReadExt;
        file.read_exact(&mut magic).await?;

        // GGUF magic number is "GGUF" in ASCII
        if &magic != b"GGUF" {
            tokio::fs::remove_file(path).await?;
            return Err(AppError::HfError(format!(
                "Invalid GGUF file: expected 'GGUF', got '{}'",
                String::from_utf8_lossy(&magic)
            )));
        }

        Ok(())
    }

    pub async fn resolve_model_download(
        &self,
        model_name: &str,
        preferred_quantization: Option<&str>,
    ) -> Result<(String, String), AppError> {
        let query = Self::catalog_query(model_name);
        let repos = self.search_models(&query, 0).await?;
        let mut fallback: Option<(String, String)> = None;

        for repo in repos {
            let files = self.get_model_files(&repo.id).await?;
            if files.is_empty() {
                continue;
            }

            if let Some(selected) = preferred_quantization {
                if let Some(file) = files
                    .iter()
                    .find(|file| file.quantization.as_deref() == Some(selected))
                {
                    return Ok((repo.id, file.filename.clone()));
                }

                if fallback.is_none() {
                    fallback = Self::preferred_fallback_file(&repo.id, &files);
                }

                continue;
            }

            if let Some(file) = Self::preferred_fallback_file(&repo.id, &files) {
                return Ok(file);
            }
        }

        if let Some(file) = fallback {
            return Ok(file);
        }

        Err(AppError::HfError(format!(
            "Couldn't find a GGUF download for '{}'",
            model_name
        )))
    }

    fn catalog_query(model_name: &str) -> String {
        let normalized = model_name.replace(':', " ");
        format!("{} gguf instruct", normalized)
    }

    fn preferred_fallback_file(repo_id: &str, files: &[HfModelFile]) -> Option<(String, String)> {
        let preferred = [
            "Q4_K_M",
            "Q4_K_S",
            "Q5_K_M",
            "Q5_K_S",
            "Q6_K",
            "Q8_0",
            "Q3_K_M",
            "Q3_K_S",
            "Q2_K",
        ];

        if let Some(file) = preferred.iter().find_map(|wanted| {
            files
                .iter()
                .find(|file| file.quantization.as_deref() == Some(*wanted))
        }) {
            return Some((repo_id.to_string(), file.filename.clone()));
        }

        files
            .iter()
            .find(|file| file.quantization.is_some())
            .map(|file| (repo_id.to_string(), file.filename.clone()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_quantization() {
        assert_eq!(
            HfClient::parse_quantization("llama-2-7b.Q4_K_M.gguf"),
            Some("Q4_K_M".to_string())
        );
        assert_eq!(
            HfClient::parse_quantization("model.Q8_0.gguf"),
            Some("Q8_0".to_string())
        );
        assert_eq!(HfClient::parse_quantization("model.gguf"), None);
    }

    #[test]
    fn test_quantization_order() {
        assert!(HfClient::quantization_order(&Some("Q8_0".to_string()))
            < HfClient::quantization_order(&Some("Q4_K_M".to_string())));
        assert!(HfClient::quantization_order(&Some("Q4_K_M".to_string()))
            < HfClient::quantization_order(&Some("Q2_K".to_string())));
    }
}
