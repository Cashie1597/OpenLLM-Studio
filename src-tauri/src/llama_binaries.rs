use crate::error::AppError;
use crate::models::GpuBackend;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;
use tokio::io::AsyncWriteExt;

/// Binary variant types for different GPU backends
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BinaryVariant {
    Cpu,
    Cuda12_4,
    Cuda13_1,
    Vulkan,
    Sycl,
    Metal,
}

impl BinaryVariant {
    /// Get the download URL for this binary variant based on OS
    pub fn download_url(&self) -> String {
        self.download_urls()
            .into_iter()
            .next()
            .unwrap_or_else(|| format!("{}/cpu/cpu.zip", "https://pub-db624e2b2bb447f2b29b8cd6b57e4518.r2.dev"))
    }

    pub fn download_urls(&self) -> Vec<String> {
        let base_url = "https://pub-db624e2b2bb447f2b29b8cd6b57e4518.r2.dev";
        let os = std::env::consts::OS;
        let arch = std::env::consts::ARCH;
        
        match os {
            "windows" => self.windows_url(base_url),
            "macos" => self.macos_url(base_url, arch),
            "linux" => self.linux_url(base_url, arch),
            _ => vec![format!("{}/cpu/cpu.zip", base_url)],
        }
    }

    fn windows_url(&self, base_url: &str) -> Vec<String> {
        match self {
            BinaryVariant::Cpu => vec![format!("{}/windows/cpu/cpu.zip", base_url)],
            BinaryVariant::Cuda12_4 => vec![format!("{}/windows/nvidia/cuda-12.4/cuda-12.4.zip", base_url)],
            BinaryVariant::Cuda13_1 => vec![format!("{}/windows/nvidia/cuda-13.1/cuda-13.1.zip", base_url)],
            BinaryVariant::Vulkan => vec![format!("{}/windows/amd/vulkan/vulkan.zip", base_url)],
            BinaryVariant::Sycl => vec![
                format!("{}/windows/intel/sycl/sycl.zip", base_url),
                format!("{}/windows/intel/sycl.zip", base_url),
                format!("{}/windows/intel/intel.zip", base_url),
            ],
            BinaryVariant::Metal => vec![format!("{}/windows/cpu/cpu.zip", base_url)], // Metal not for Windows
        }
    }

    fn macos_url(&self, base_url: &str, arch: &str) -> Vec<String> {
        let arch_suffix = if arch == "aarch64" { "arm64" } else { "x64" };
        match self {
            BinaryVariant::Cpu => vec![format!("{}/macos/cpu/cpu-{}.zip", base_url, arch_suffix)],
            BinaryVariant::Metal => vec![format!("{}/macos/metal/metal-{}.zip", base_url, arch_suffix)],
            _ => vec![format!("{}/macos/cpu/cpu-{}.zip", base_url, arch_suffix)], // CUDA/Vulkan not for macOS
        }
    }

    fn linux_url(&self, base_url: &str, arch: &str) -> Vec<String> {
        let arch_suffix = if arch == "aarch64" { "arm64" } else { "x64" };
        match self {
            BinaryVariant::Cpu => vec![format!("{}/linux/cpu/cpu-{}.zip", base_url, arch_suffix)],
            BinaryVariant::Cuda12_4 => vec![format!("{}/linux/nvidia/cuda-12.4/cuda-12.4-{}.zip", base_url, arch_suffix)],
            BinaryVariant::Cuda13_1 => vec![format!("{}/linux/nvidia/cuda-13.1/cuda-13.1-{}.zip", base_url, arch_suffix)],
            BinaryVariant::Vulkan => vec![format!("{}/linux/amd/vulkan/vulkan-{}.zip", base_url, arch_suffix)],
            BinaryVariant::Metal => vec![format!("{}/linux/cpu/cpu-{}.zip", base_url, arch_suffix)], // Metal not for Linux
            BinaryVariant::Sycl => vec![format!("{}/linux/cpu/cpu-{}.zip", base_url, arch_suffix)],
        }
    }

    /// Get the expected file size in bytes (for progress calculation)
    pub fn expected_size_bytes(&self) -> u64 {
        match self {
            BinaryVariant::Cpu => 120_000_000,
            BinaryVariant::Cuda12_4 => 200_000_000,
            BinaryVariant::Cuda13_1 => 200_000_000,
            BinaryVariant::Vulkan => 180_000_000,
            BinaryVariant::Sycl => 220_000_000,
            BinaryVariant::Metal => 150_000_000,
        }
    }

    /// Get display name for UI
    pub fn display_name(&self) -> &'static str {
        match self {
            BinaryVariant::Cpu => "CPU Only",
            BinaryVariant::Cuda12_4 => "NVIDIA GPU (CUDA 12.4)",
            BinaryVariant::Cuda13_1 => "NVIDIA GPU (CUDA 13.1)",
            BinaryVariant::Vulkan => "Vulkan (AMD)",
            BinaryVariant::Sycl => "Intel GPU (SYCL)",
            BinaryVariant::Metal => "Apple Metal",
        }
    }

    /// Check if this variant is available for the current OS
    pub fn is_available_for_os(&self) -> bool {
        let os = std::env::consts::OS;
        match (self, os) {
            (BinaryVariant::Metal, "macos") => true,
            (BinaryVariant::Metal, _) => false,
            (BinaryVariant::Sycl, "windows") => true,
            (BinaryVariant::Sycl, _) => false,
            (BinaryVariant::Cuda12_4 | BinaryVariant::Cuda13_1, "macos") => false,
            (BinaryVariant::Vulkan, "macos") => false,
            _ => true,
        }
    }
}

/// Recommended binary based on detected hardware and OS
pub fn recommend_binary(gpu_backend: &GpuBackend, os: &str) -> BinaryVariant {
    match (gpu_backend, os) {
        // Windows
        (GpuBackend::Nvidia, "windows") => BinaryVariant::Cuda12_4,
        (GpuBackend::Amd, "windows") => BinaryVariant::Vulkan,
        (GpuBackend::Intel, "windows") => BinaryVariant::Sycl,
        (_, "windows") => BinaryVariant::Cpu,
        
        // macOS - use Metal for Apple Silicon, CPU for Intel
        (GpuBackend::AppleMetal, "macos") => BinaryVariant::Metal,
        (_, "macos") => BinaryVariant::Cpu,
        
        // Linux
        (GpuBackend::Nvidia, "linux") => BinaryVariant::Cuda12_4,
        (GpuBackend::Amd, "linux") => BinaryVariant::Vulkan,
        (_, "linux") => BinaryVariant::Cpu,
        
        // Fallback
        _ => BinaryVariant::Cpu,
    }
}

/// Status of binary download/installation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BinaryStatus {
    pub variant: BinaryVariant,
    pub installed: bool,
    pub version: Option<String>,
    pub path: Option<PathBuf>,
}

/// Download progress event
#[derive(Debug, Clone, Serialize)]
pub struct DownloadProgress {
    pub variant: BinaryVariant,
    pub bytes_downloaded: u64,
    pub total_bytes: u64,
    pub percentage: f32,
}

/// Extract a zip file to the target directory (blocking operation)
fn extract_zip_blocking(zip_path: &PathBuf, target_dir: &PathBuf) -> Result<(), AppError> {
    use std::fs::File;
    use std::io::Read;
    use std::io::Write;
    use zip::ZipArchive;

    println!("[extract_zip] Extracting {} to {}", zip_path.to_string_lossy(), target_dir.to_string_lossy());

    let file = File::open(zip_path)
        .map_err(|e| AppError::DownloadError(format!("Failed to open zip: {}", e)))?;

    let mut archive = ZipArchive::new(file)
        .map_err(|e| AppError::DownloadError(format!("Failed to read zip: {}", e)))?;

    println!("[extract_zip] Archive contains {} files", archive.len());

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).unwrap();
        let outpath = match file.enclosed_name() {
            Some(path) => target_dir.join(path),
            None => continue,
        };

        println!("[extract_zip] Extracting: {} -> {}", file.name(), outpath.to_string_lossy());

        if file.name().ends_with('/') {
            std::fs::create_dir_all(&outpath).ok();
        } else {
            if let Some(p) = outpath.parent() {
                std::fs::create_dir_all(p).ok();
            }
            let mut outfile = File::create(&outpath)
                .map_err(|e| AppError::DownloadError(format!("Failed to create file: {}", e)))?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer).ok();
            outfile.write_all(&buffer).ok();
        }
    }

    println!("[extract_zip] Extraction complete");
    Ok(())
}

/// Manager for llama.cpp binaries
pub struct LlamaBinaryManager {
    app_data_dir: PathBuf,
}

impl LlamaBinaryManager {
    pub fn new(app_data_dir: PathBuf) -> Self {
        Self { app_data_dir }
    }

    /// Get the directory where binaries are stored
    pub fn binaries_dir(&self) -> PathBuf {
        self.app_data_dir.join("llama-binaries")
    }

    /// Check if a binary variant is already installed
    pub async fn is_installed(&self, variant: &BinaryVariant) -> bool {
        // Check the expected subdirectory path (e.g., llama-binaries/vulkan/llama-server.exe)
        let binary_path = self.get_binary_path(variant);
        if binary_path.exists() {
            println!("[LlamaBinaryManager] {:?} found at: {}", variant, binary_path.to_string_lossy());
            return true;
        }
        
        // Fallback: check flat directory for previously-downloaded binaries
        let executable_name = match std::env::consts::OS {
            "windows" => "llama-server.exe",
            _ => "llama-server",
        };
        let flat_path = self.binaries_dir().join(executable_name);
        if flat_path.exists() {
            println!("[LlamaBinaryManager] {:?} found at flat path: {}", variant, flat_path.to_string_lossy());
            return true;
        }
        
        println!("[LlamaBinaryManager] {:?} NOT found. Checked: {} and {}", variant, binary_path.to_string_lossy(), flat_path.to_string_lossy());
        false
    }

    /// Get the path to the main llama-server executable (subdirectory path)
    pub fn get_binary_path(&self, variant: &BinaryVariant) -> PathBuf {
        let os = std::env::consts::OS;
        
        let dir_name = match variant {
            BinaryVariant::Cpu => "cpu",
            BinaryVariant::Cuda12_4 => "cuda-12.4",
            BinaryVariant::Cuda13_1 => "cuda-13.1",
            BinaryVariant::Vulkan => "vulkan",
            BinaryVariant::Sycl => "sycl",
            BinaryVariant::Metal => "metal",
        };
        
        let executable_name = match os {
            "windows" => "llama-server.exe",
            "macos" => "llama-server",
            "linux" => "llama-server",
            _ => "llama-server",
        };
        
        self.binaries_dir().join(dir_name).join(executable_name)
    }

    /// Download and extract a binary variant
    pub async fn download_binary(
        &self,
        variant: BinaryVariant,
        progress_callback: impl Fn(DownloadProgress) + Send + 'static,
    ) -> Result<PathBuf, AppError> {
        let urls = variant.download_urls();
        
        // Determine the variant subdirectory name
        let dir_name = match &variant {
            BinaryVariant::Cpu => "cpu",
            BinaryVariant::Cuda12_4 => "cuda-12.4",
            BinaryVariant::Cuda13_1 => "cuda-13.1",
            BinaryVariant::Vulkan => "vulkan",
            BinaryVariant::Sycl => "sycl",
            BinaryVariant::Metal => "metal",
        };
        
        // Extract into variant-specific subdirectory (e.g., llama-binaries/vulkan/)
        let variant_dir = self.binaries_dir().join(dir_name);

        println!("[LlamaBinaryManager] Downloading {:?} using candidate URLs: {:?}", variant, urls);
        println!("[LlamaBinaryManager] Target directory: {}", variant_dir.to_string_lossy());

        // Create target directory
        fs::create_dir_all(&variant_dir).await
            .map_err(|e| AppError::DownloadError(format!("Failed to create directory: {}", e)))?;

        // Download the zip file
        let mut last_error = None;
        let mut response = None;
        for url in &urls {
            match reqwest::get(url).await {
                Ok(candidate_response) if candidate_response.status().is_success() => {
                    println!("[LlamaBinaryManager] Selected download URL: {}", url);
                    response = Some(candidate_response);
                    break;
                }
                Ok(candidate_response) => {
                    let error = format!("{} returned {}", url, candidate_response.status());
                    println!("[LlamaBinaryManager] {}", error);
                    last_error = Some(error);
                }
                Err(e) => {
                    let error = format!("{} failed: {}", url, e);
                    println!("[LlamaBinaryManager] {}", error);
                    last_error = Some(error);
                }
            }
        }
        let response = response.ok_or_else(|| {
            AppError::DownloadError(format!(
                "Failed to start download from all candidate URLs: {}",
                last_error.unwrap_or_else(|| "unknown error".to_string())
            ))
        })?;

        let total_size = response.content_length().unwrap_or(variant.expected_size_bytes());
        let mut downloaded: u64 = 0;

        // Stream the response and write to file
        let zip_path = variant_dir.join("download.zip");
        let mut file = fs::File::create(&zip_path).await
            .map_err(|e| AppError::DownloadError(format!("Failed to create file: {}", e)))?;

        let mut stream = response.bytes_stream();
        use futures_util::StreamExt;

        while let Some(chunk) = stream.next().await {
            let chunk = chunk.map_err(|e| AppError::DownloadError(format!("Download error: {}", e)))?;
            file.write_all(&chunk).await
                .map_err(|e| AppError::DownloadError(format!("Write error: {}", e)))?;
            downloaded += chunk.len() as u64;

            progress_callback(DownloadProgress {
                variant: variant.clone(),
                bytes_downloaded: downloaded,
                total_bytes: total_size,
                percentage: (downloaded as f32 / total_size as f32) * 100.0,
            });
        }

        // Extract the zip file into the variant subdirectory (blocking operation)
        let zip_path_clone = zip_path.clone();
        let variant_dir_clone = variant_dir.clone();
        tokio::task::spawn_blocking(move || {
            extract_zip_blocking(&zip_path_clone, &variant_dir_clone)
        }).await.map_err(|e| AppError::DownloadError(format!("Task join error: {}", e)))??;

        // Clean up zip file
        fs::remove_file(&zip_path).await.ok();

        let binary_path = self.get_binary_path(&variant);
        println!("[LlamaBinaryManager] Download complete. Binary should be at: {}", binary_path.to_string_lossy());
        println!("[LlamaBinaryManager] Binary exists: {}", binary_path.exists());

        Ok(binary_path)
    }

    /// Get status of all binary variants available for current OS
    pub async fn get_all_statuses(&self) -> Vec<BinaryStatus> {
        let all_variants = [
            BinaryVariant::Cpu,
            BinaryVariant::Cuda12_4,
            BinaryVariant::Cuda13_1,
            BinaryVariant::Vulkan,
            BinaryVariant::Sycl,
            BinaryVariant::Metal,
        ];

        // Filter to only show variants available for this OS
        let available_variants: Vec<_> = all_variants
            .into_iter()
            .filter(|v| v.is_available_for_os())
            .collect();

        let mut statuses = Vec::new();
        for variant in available_variants {
            let installed = self.is_installed(&variant).await;
            let path = if installed {
                Some(self.get_binary_path(&variant))
            } else {
                None
            };

            statuses.push(BinaryStatus {
                variant,
                installed,
                version: None,
                path,
            });
        }

        statuses
    }
}
