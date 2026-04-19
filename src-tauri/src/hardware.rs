use crate::error::AppError;
use crate::models::{GpuBackend, HardwareInfo};
use regex::Regex;
use std::process::Stdio;
use std::time::Duration;
use tokio::process::Command;

/// Hardware detector for cross-platform GPU, RAM, and CPU detection
pub struct HardwareDetector {
    platform: Platform,
}

#[derive(Debug, Clone)]
enum Platform {
    Windows,
    MacOS,
    Linux,
}

impl HardwareDetector {
    /// Create a new hardware detector for the current platform
    pub fn new() -> Self {
        let platform = match std::env::consts::OS {
            "windows" => Platform::Windows,
            "macos" => Platform::MacOS,
            "linux" => Platform::Linux,
            _ => Platform::Linux, // Default to Linux for unknown platforms
        };

        Self { platform }
    }

    /// Detect all hardware information
    pub async fn detect(&self) -> Result<HardwareInfo, AppError> {
        let (gpu_name, gpu_backend, vram_gb, is_shared_memory) = self.detect_gpu().await?;
        let ram_gb = self.detect_ram().await?;
        let cpu_cores = self.detect_cpu_cores();
        let disk_space_gb = self.detect_disk_space().await?;

        Ok(HardwareInfo {
            gpu_name,
            gpu_backend,
            vram_gb,
            ram_gb,
            cpu_cores,
            disk_space_gb: Some(disk_space_gb),
            is_shared_memory: Some(is_shared_memory),
        })
    }

    /// Detect GPU information based on platform
    async fn detect_gpu(&self) -> Result<(String, GpuBackend, f64, bool), AppError> {
        match self.platform {
            Platform::Windows => self.detect_windows_gpu().await,
            Platform::MacOS => self.detect_macos_gpu().await,
            Platform::Linux => self.detect_linux_gpu().await,
        }
    }

    /// Detect RAM based on platform
    async fn detect_ram(&self) -> Result<f64, AppError> {
        match self.platform {
            Platform::Windows => self.detect_windows_ram().await,
            Platform::MacOS => self.detect_macos_ram().await,
            Platform::Linux => self.detect_linux_ram().await,
        }
    }

    /// Detect CPU core count
    fn detect_cpu_cores(&self) -> usize {
        std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(4) // Default to 4 cores if detection fails
    }

    /// Detect available disk space
    async fn detect_disk_space(&self) -> Result<f64, AppError> {
        match self.platform {
            Platform::Windows => self.detect_windows_disk_space().await,
            Platform::MacOS => self.detect_macos_disk_space().await,
            Platform::Linux => self.detect_linux_disk_space().await,
        }
    }

    async fn detect_windows_disk_space(&self) -> Result<f64, AppError> {
        // Use Get-CimInstance instead of wmic (wmic removed in Win11 25H2)
        let query = "Get-CimInstance Win32_LogicalDisk -Filter 'DriveType=3' | Select-Object DeviceID,FreeSpace,Size | Format-Table -HideTableHeaders";
        match self
            .execute_command(
                "powershell",
                &["-NoProfile", "-NonInteractive", "-Command", query],
            )
            .await
        {
            Ok(output) => {
                let system_drive = std::env::var("SystemDrive").unwrap_or_else(|_| "C:".to_string());
                let system_drive_lower = system_drive.to_lowercase();

                for line in output.lines() {
                    let line = line.trim();
                    if line.is_empty() {
                        continue;
                    }
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 3 {
                        let drive_id = parts[0].to_lowercase();
                        if drive_id == system_drive_lower {
                            if let Ok(free_bytes) = parts[1].parse::<f64>() {
                                return Ok((free_bytes / 1_073_741_824.0 * 100.0).round() / 100.0);
                            }
                        }
                    }
                }

                // If system drive not found, try first entry
                for line in output.lines() {
                    let line = line.trim();
                    if line.is_empty() {
                        continue;
                    }
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 2 {
                        if let Ok(free_bytes) = parts[1].parse::<f64>() {
                            return Ok((free_bytes / 1_073_741_824.0 * 100.0).round() / 100.0);
                        }
                    }
                }
            }
            Err(_) => {}
        }
        Ok(100.0) // Default fallback
    }

    async fn detect_macos_disk_space(&self) -> Result<f64, AppError> {
        match self.execute_command("df", &["-k", "/"]).await {
            Ok(output) => {
                let lines: Vec<&str> = output.lines().collect();
                if lines.len() > 1 {
                    let parts: Vec<&str> = lines[1].split_whitespace().collect();
                    if parts.len() >= 4 {
                        if let Ok(available_kb) = parts[3].parse::<f64>() {
                            return Ok((available_kb / 1_048_576.0 * 100.0).round() / 100.0);
                        }
                    }
                }
            }
            Err(_) => {}
        }
        Ok(100.0) // Default fallback
    }

    async fn detect_linux_disk_space(&self) -> Result<f64, AppError> {
        match self.execute_command("df", &["-BG", "/"]).await {
            Ok(output) => {
                let lines: Vec<&str> = output.lines().collect();
                if lines.len() > 1 {
                    let parts: Vec<&str> = lines[1].split_whitespace().collect();
                    if parts.len() >= 4 {
                        let available_str = parts[3].trim_end_matches('G');
                        if let Ok(available_gb) = available_str.parse::<f64>() {
                            return Ok(available_gb);
                        }
                    }
                }
            }
            Err(_) => {}
        }
        Ok(100.0) // Default fallback
    }

    /// Windows GPU detection
    /// Detection order:
    /// 1. nvidia-smi (most accurate for NVIDIA)
    /// 2. Registry qwMemorySize (accurate VRAM for all vendors, no 4GB cap)
    /// 3. Get-CimInstance Win32_VideoController (fallback, AdapterRAM capped at 4GB)
    /// 4. Name-only fallback
    /// For multi-GPU systems, prefers dedicated GPU over integrated.
    async fn detect_windows_gpu(&self) -> Result<(String, GpuBackend, f64, bool), AppError> {
        println!("[HW] Starting Windows GPU detection...");

        let mut detected_gpus: Vec<(String, GpuBackend, f64, bool)> = Vec::new();

        // 1. Try nvidia-smi first (most accurate for NVIDIA)
        println!("[HW] Attempting nvidia-smi...");
        match self
            .execute_command(
                "nvidia-smi",
                &["--query-gpu=name,memory.total", "--format=csv,noheader"],
            )
            .await
        {
            Ok(output) => {
                println!("[HW] nvidia-smi output: {}", output);
                for line in output.lines() {
                    let line = line.trim();
                    if line.is_empty() {
                        continue;
                    }
                    let parts: Vec<&str> = line.split(',').collect();
                    if parts.len() >= 2 {
                        let name = parts[0].trim().to_string();
                        let vram_mb: f64 = parts[1]
                            .trim()
                            .split_whitespace()
                            .next()
                            .and_then(|s| s.parse().ok())
                            .unwrap_or(0.0);
                        let vram_gb = vram_mb / 1024.0;
                        println!("[HW] NVIDIA GPU detected: {} with {} GB VRAM", name, vram_gb);
                        detected_gpus.push((name, GpuBackend::Nvidia, vram_gb, false));
                    }
                }
            }
            Err(e) => {
                println!("[HW] nvidia-smi not available: {}", e);
            }
        }

        // 2. Try registry qwMemorySize (uint64, no 4GB cap)
        if detected_gpus.is_empty() {
            println!("[HW] Attempting registry GPU detection (qwMemorySize)...");
            let reg_query = r#"Get-ChildItem "HKLM:\SYSTEM\CurrentControlSet\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}" -ErrorAction SilentlyContinue | Where-Object { $_.PSChildName -match '^\d{4}$' } | ForEach-Object { $props = Get-ItemProperty $_.PSPath -ErrorAction SilentlyContinue; if ($props.'DriverDesc' -or $props.'HardwareInformation.StringDescription') { $name = if ($props.'HardwareInformation.StringDescription') { [System.Text.Encoding]::Unicode.GetString($props.'HardwareInformation.StringDescription').TrimEnd([char]0) } else { $props.'DriverDesc' }; $vram = 0; if ($props.'HardwareInformation.qwMemorySize') { $vram = [BitConverter]::ToUInt64([BitConverter]::GetBytes($props.'HardwareInformation.qwMemorySize'), 0) }; Write-Output "$name|$vram" } }"#;
            match self
                .execute_command(
                    "powershell",
                    &["-NoProfile", "-NonInteractive", "-Command", reg_query],
                )
                .await
            {
                Ok(output) => {
                    println!("[HW] Registry GPU output: {}", output);
                    for line in output.lines() {
                        let line = line.trim();
                        if line.is_empty() {
                            continue;
                        }
                        let parts: Vec<&str> = line.split('|').collect();
                        if parts.len() >= 2 {
                            let name = parts[0].trim().to_string();
                            let vram_bytes: f64 = parts[1].trim().parse().unwrap_or(0.0);
                            let vram_gb = (vram_bytes / 1_073_741_824.0 * 100.0).round() / 100.0;
                            let is_shared = is_integrated_gpu(&name);
                            let backend = classify_windows_gpu_backend(&name, vram_gb);
                            println!("[HW] Registry GPU: {} with {} GB VRAM (shared={})", name, vram_gb, is_shared);
                            detected_gpus.push((name, backend, vram_gb, is_shared));
                        }
                    }
                }
                Err(e) => {
                    println!("[HW] Registry GPU detection failed: {}", e);
                }
            }
        }

        // 3. Fallback: Get-CimInstance Win32_VideoController (replaces wmic)
        if detected_gpus.is_empty() {
            println!("[HW] Attempting Get-CimInstance GPU detection...");
            let cim_query = "Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM, AdapterDACType | Format-Table -HideTableHeaders";
            match self
                .execute_command(
                    "powershell",
                    &["-NoProfile", "-NonInteractive", "-Command", cim_query],
                )
                .await
            {
                Ok(output) => {
                    println!("[HW] CIM GPU output: {}", output);
                    for line in output.lines() {
                        let line = line.trim();
                        if line.is_empty() {
                            continue;
                        }
                        let parts: Vec<&str> = line.split_whitespace().collect();
                        if parts.len() >= 2 {
                            let mut vram_bytes: f64 = 0.0;
                            let mut name_parts_end = parts.len();

                            for (i, &part) in parts.iter().enumerate() {
                                if let Ok(val) = part.parse::<f64>() {
                                    if val > 1_000_000.0 {
                                        vram_bytes = val;
                                        name_parts_end = i;
                                        break;
                                    }
                                }
                            }

                            let name = if name_parts_end > 0 {
                                parts[..name_parts_end].join(" ")
                            } else {
                                line.to_string()
                            };

                            let is_shared = is_integrated_gpu(&name);
                            let vram_gb = (vram_bytes / 1_073_741_824.0 * 100.0).round() / 100.0;
                            let backend = classify_windows_gpu_backend(&name, vram_gb);
                            println!("[HW] CIM GPU: {} with {} GB VRAM (shared={})", name, vram_gb, is_shared);
                            detected_gpus.push((name, backend, vram_gb, is_shared));
                        }
                    }
                }
                Err(e) => {
                    println!("[HW] CIM GPU query failed: {}", e);
                }
            }
        }

        // 4. Final fallback: name-only CIM query
        if detected_gpus.is_empty() {
            println!("[HW] Attempting name-only GPU detection...");
            let name_query = "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name";
            match self
                .execute_command(
                    "powershell",
                    &["-NoProfile", "-NonInteractive", "-Command", name_query],
                )
                .await
            {
                Ok(output) => {
                    println!("[HW] Name-only GPU output: {}", output);
                    for line in output.lines() {
                        let name = line.trim().to_string();
                        if name.is_empty() {
                            continue;
                        }
                        let is_shared = is_integrated_gpu(&name);
                        let backend = classify_windows_gpu_backend(&name, 0.0);
                        println!("[HW] Name-only GPU: {} (shared={})", name, is_shared);
                        detected_gpus.push((name, backend, 0.0, is_shared));
                    }
                }
                Err(e) => {
                    println!("[HW] Name-only GPU query failed: {}", e);
                }
            }
        }

        // Rank GPUs: prefer dedicated over integrated, then by VRAM descending
        if !detected_gpus.is_empty() {
            detected_gpus.sort_by(|a, b| {
                let shared_ord = a.3.cmp(&b.3);
                if shared_ord != std::cmp::Ordering::Equal {
                    return shared_ord;
                }
                b.2.partial_cmp(&a.2).unwrap_or(std::cmp::Ordering::Equal)
            });

            let best = detected_gpus.into_iter().next().unwrap();
            println!("[HW] Selected best GPU: {} ({} GB, shared={})", best.0, best.2, best.3);
            return Ok(best);
        }

        println!("[HW] Warning: GPU detection failed, falling back to CPU-only mode");
        Ok(("CPU Only".to_string(), GpuBackend::CpuOnly, 0.0, false))
    }

    /// Windows RAM detection
    async fn detect_windows_ram(&self) -> Result<f64, AppError> {
        // Use Get-CimInstance instead of wmic (wmic removed in Win11 25H2)
        let powershell_queries = [
            "Get-CimInstance Win32_ComputerSystem | Select-Object -ExpandProperty TotalPhysicalMemory",
            "(Get-ComputerInfo).CsTotalPhysicalMemory",
        ];

        for query in powershell_queries {
            match self
                .execute_command(
                    "powershell",
                    &["-NoProfile", "-NonInteractive", "-Command", query],
                )
                .await
            {
                Ok(output) => {
                    if let Some(bytes) = parse_windows_ram_output(&output) {
                        return Ok((bytes / 1_073_741_824.0 * 100.0).round() / 100.0);
                    } else {
                        eprintln!("Warning: Failed to parse RAM value from PowerShell output: {}", output);
                    }
                }
                Err(e) => {
                    eprintln!("Warning: PowerShell RAM detection failed: {}", e);
                }
            }
        }

        eprintln!("Falling back to default RAM value: 8GB");
        Ok(8.0) // Default to 8GB if detection fails
    }

    /// macOS GPU detection
    async fn detect_macos_gpu(&self) -> Result<(String, GpuBackend, f64, bool), AppError> {
        match self
            .execute_command("system_profiler", &["SPDisplaysDataType"])
            .await
        {
            Ok(output) => {
                let chipset_regex = Regex::new(r"Chipset Model:\s*(.+)")?;
                let name = chipset_regex
                    .captures(&output)
                    .and_then(|cap| cap.get(1))
                    .map(|m| m.as_str().trim().to_string())
                    .unwrap_or_else(|| {
                        eprintln!("Warning: Could not parse GPU name from system_profiler");
                        "Unknown GPU".to_string()
                    });

                let is_apple_silicon = name.contains("Apple M1")
                    || name.contains("Apple M2")
                    || name.contains("Apple M3")
                    || name.contains("Apple M4");

                let backend = if is_apple_silicon {
                    GpuBackend::AppleMetal
                } else if name.contains("NVIDIA") {
                    GpuBackend::Nvidia
                } else if name.contains("AMD") || name.contains("Radeon") {
                    GpuBackend::Amd
                } else {
                    eprintln!("Warning: Unknown GPU type, falling back to CPU-only");
                    GpuBackend::CpuOnly
                };

                // Apple Silicon uses shared memory
                let is_shared = is_apple_silicon;

                let vram_regex = Regex::new(r"VRAM.*:\s*(\d+)\s*([GM])B")?;
                let vram_gb = vram_regex
                    .captures(&output)
                    .and_then(|cap| {
                        let value: f64 = cap.get(1)?.as_str().parse().ok()?;
                        let unit = cap.get(2)?.as_str();
                        Some(if unit == "G" { value } else { value / 1024.0 })
                    })
                    .unwrap_or_else(|| {
                        eprintln!("Warning: Could not parse VRAM from system_profiler");
                        0.0
                    });

                return Ok((name, backend, vram_gb, is_shared));
            }
            Err(e) => {
                eprintln!("Warning: system_profiler failed: {}", e);
            }
        }

        eprintln!("Warning: GPU detection failed, falling back to CPU-only mode");
        Ok(("CPU Only".to_string(), GpuBackend::CpuOnly, 0.0, false))
    }

    /// macOS RAM detection
    async fn detect_macos_ram(&self) -> Result<f64, AppError> {
        match self.execute_command("sysctl", &["hw.memsize"]).await {
            Ok(output) => {
                if let Some(value_str) = output.split(':').nth(1) {
                    if let Ok(bytes) = value_str.trim().parse::<f64>() {
                        return Ok((bytes / 1_073_741_824.0 * 100.0).round() / 100.0);
                    } else {
                        eprintln!("Warning: Failed to parse RAM value: {}", value_str);
                    }
                } else {
                    eprintln!("Warning: Unexpected sysctl output format: {}", output);
                }
            }
            Err(e) => {
                eprintln!("Warning: RAM detection failed: {}", e);
            }
        }

        eprintln!("Falling back to default RAM value: 8GB");
        Ok(8.0) // Default to 8GB if detection fails
    }

    /// Linux GPU detection
    async fn detect_linux_gpu(&self) -> Result<(String, GpuBackend, f64, bool), AppError> {
        // Try nvidia-smi first
        match self
            .execute_command(
                "nvidia-smi",
                &["--query-gpu=name,memory.total", "--format=csv,noheader"],
            )
            .await
        {
            Ok(output) => {
                let parts: Vec<&str> = output.trim().split(',').collect();
                if parts.len() >= 2 {
                    let name = parts[0].trim().to_string();
                    let vram_mb: f64 = parts[1]
                        .trim()
                        .split_whitespace()
                        .next()
                        .and_then(|s| s.parse().ok())
                        .unwrap_or(0.0);
                    let vram_gb = vram_mb / 1024.0;
                    return Ok((name, GpuBackend::Nvidia, vram_gb, false));
                } else {
                    eprintln!("Warning: nvidia-smi returned unexpected format: {}", output);
                }
            }
            Err(e) => {
                eprintln!("nvidia-smi not available: {}", e);
            }
        }

        // Try rocm-smi
        match self
            .execute_command("rocm-smi", &["--showproductname", "--showmeminfo", "vram"])
            .await
        {
            Ok(output) => {
                let name_regex = Regex::new(r"GPU\[\d+\]\s*:\s*(.+)")?;
                let vram_regex = Regex::new(r"VRAM Total Memory.*:\s*(\d+)")?;

                let name = name_regex
                    .captures(&output)
                    .and_then(|cap| cap.get(1))
                    .map(|m| m.as_str().trim().to_string())
                    .unwrap_or_else(|| {
                        eprintln!("Warning: Could not parse AMD GPU name");
                        "AMD GPU".to_string()
                    });

                let vram_mb: f64 = vram_regex
                    .captures(&output)
                    .and_then(|cap| cap.get(1))
                    .and_then(|m| m.as_str().parse().ok())
                    .unwrap_or_else(|| {
                        eprintln!("Warning: Could not parse AMD GPU VRAM");
                        0.0
                    });

                let vram_gb = vram_mb / 1024.0;
                return Ok((name, GpuBackend::Amd, vram_gb, false));
            }
            Err(e) => {
                eprintln!("rocm-smi not available: {}", e);
            }
        }

        // Fallback to CPU-only
        eprintln!("Warning: No GPU detected, falling back to CPU-only mode");
        Ok(("CPU Only".to_string(), GpuBackend::CpuOnly, 0.0, false))
    }

    /// Linux RAM detection
    async fn detect_linux_ram(&self) -> Result<f64, AppError> {
        match tokio::fs::read_to_string("/proc/meminfo").await {
            Ok(content) => {
                let mem_total_regex = Regex::new(r"MemTotal:\s*(\d+)\s*kB")?;
                if let Some(cap) = mem_total_regex.captures(&content) {
                    if let Some(kb_str) = cap.get(1) {
                        if let Ok(kb) = kb_str.as_str().parse::<f64>() {
                            return Ok((kb / 1_048_576.0 * 100.0).round() / 100.0);
                        } else {
                            eprintln!("Warning: Failed to parse RAM value: {}", kb_str.as_str());
                        }
                    }
                } else {
                    eprintln!("Warning: Could not find MemTotal in /proc/meminfo");
                }
            }
            Err(e) => {
                eprintln!("Warning: Failed to read /proc/meminfo: {}", e);
            }
        }

        eprintln!("Falling back to default RAM value: 8GB");
        Ok(8.0) // Default to 8GB if detection fails
    }

    /// Execute a command with timeout (hidden window on Windows)
    #[cfg(target_os = "windows")]
    async fn execute_command(&self, cmd: &str, args: &[&str]) -> Result<String, AppError> {
        use std::os::windows::process::CommandExt;
        
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        
        let output = tokio::time::timeout(
            Duration::from_secs(10),
            Command::new(cmd)
                .args(args)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .creation_flags(CREATE_NO_WINDOW)
                .output(),
        )
        .await
        .map_err(|_| AppError::HardwareError("Command timeout".to_string()))?
        .map_err(|e| AppError::HardwareError(format!("Command execution failed: {}", e)))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(AppError::HardwareError(format!(
                "Command failed: {}",
                stderr
            )))
        }
    }

    /// Execute a command with timeout (non-Windows)
    #[cfg(not(target_os = "windows"))]
    async fn execute_command(&self, cmd: &str, args: &[&str]) -> Result<String, AppError> {
        let output = tokio::time::timeout(
            Duration::from_secs(10),
            Command::new(cmd)
                .args(args)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output(),
        )
        .await
        .map_err(|_| AppError::HardwareError("Command timeout".to_string()))?
        .map_err(|e| AppError::HardwareError(format!("Command execution failed: {}", e)))?;

        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout).to_string())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(AppError::HardwareError(format!(
                "Command failed: {}",
                stderr
            )))
        }
    }
}

fn parse_windows_ram_output(output: &str) -> Option<f64> {
    output
        .lines()
        .map(str::trim)
        .find(|line| !line.is_empty() && line.chars().all(|ch| ch.is_ascii_digit()))
        .and_then(|line| line.parse::<f64>().ok())
}

/// Check if a GPU name corresponds to an integrated GPU (uses shared system RAM)
fn is_integrated_gpu(name: &str) -> bool {
    let lowercase_name = name.to_lowercase();

    // Intel integrated GPUs
    if lowercase_name.contains("intel")
        && (lowercase_name.contains("uhd")
            || lowercase_name.contains("iris")
            || lowercase_name.contains("hd graphics")
            || lowercase_name.contains("xe graphics")
            || lowercase_name.contains("graphics"))
        && !lowercase_name.contains("arc") // Arc is dedicated
    {
        return true;
    }

    // AMD integrated (APU) GPUs — e.g. "AMD Radeon(TM) Graphics"
    if lowercase_name.contains("amd")
        && (lowercase_name.contains("radeon(tm)")
            || lowercase_name.contains("radeon graphics")
            || lowercase_name.contains("radeon vega")
            || lowercase_name.contains("radeon vII"))
        && !lowercase_name.contains("rx") // RX series is dedicated
    {
        return true;
    }

    // Microsoft Basic Display Adapter (no real GPU)
    if lowercase_name.contains("microsoft basic display") {
        return true;
    }

    false
}

fn classify_windows_gpu_backend(name: &str, _vram_gb: f64) -> GpuBackend {
    let lowercase_name = name.to_lowercase();

    if lowercase_name.contains("nvidia")
        || lowercase_name.contains("geforce")
        || lowercase_name.contains("quadro")
        || lowercase_name.contains("rtx")
    {
        return GpuBackend::Nvidia;
    }

    if lowercase_name.contains("amd") || lowercase_name.contains("radeon") {
        return GpuBackend::Amd;
    }

    if lowercase_name.contains("intel")
        || lowercase_name.contains("arc")
        || lowercase_name.contains("iris")
        || lowercase_name.contains("uhd graphics")
        || lowercase_name.contains("hd graphics")
    {
        return GpuBackend::Intel;
    }

    GpuBackend::CpuOnly
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hardware_detector_creation() {
        let detector = HardwareDetector::new();
        assert!(matches!(
            detector.platform,
            Platform::Windows | Platform::MacOS | Platform::Linux
        ));
    }

    #[test]
    fn test_cpu_cores_detection() {
        let detector = HardwareDetector::new();
        let cores = detector.detect_cpu_cores();
        assert!(cores > 0);
        assert!(cores <= 256);
    }

    #[test]
    fn test_parse_windows_ram_output() {
        let output = "TotalPhysicalMemory\r\n34042683392\r\n\r\n";
        assert_eq!(parse_windows_ram_output(output), Some(34_042_683_392.0));
    }

    #[test]
    fn test_classify_windows_gpu_backend_detects_intel_arc() {
        assert!(matches!(
            classify_windows_gpu_backend("Intel Arc A770 Graphics", 16.0),
            GpuBackend::Intel
        ));
    }

    #[test]
    fn test_classify_windows_gpu_backend_detects_intel_iris() {
        assert!(matches!(
            classify_windows_gpu_backend("Intel Iris Xe Graphics", 1.0),
            GpuBackend::Intel
        ));
    }

    #[test]
    fn test_is_integrated_gpu_intel_iris() {
        assert!(is_integrated_gpu("Intel Iris Xe Graphics"));
    }

    #[test]
    fn test_is_integrated_gpu_intel_uhd() {
        assert!(is_integrated_gpu("Intel UHD Graphics 630"));
    }

    #[test]
    fn test_is_integrated_gpu_intel_arc_dedicated() {
        assert!(!is_integrated_gpu("Intel Arc A770 Graphics"));
    }

    #[test]
    fn test_is_integrated_gpu_nvidia_dedicated() {
        assert!(!is_integrated_gpu("NVIDIA GeForce RTX 4070"));
    }

    #[test]
    fn test_is_integrated_gpu_amd_apu() {
        assert!(is_integrated_gpu("AMD Radeon(TM) Graphics"));
    }

    #[test]
    fn test_is_integrated_gpu_amd_rx_dedicated() {
        assert!(!is_integrated_gpu("AMD Radeon RX 6800 XT"));
    }

    #[test]
    fn test_classify_windows_gpu_backend_amd_always_amd() {
        assert!(matches!(
            classify_windows_gpu_backend("AMD Radeon RX 6800 XT", 0.0),
            GpuBackend::Amd
        ));
    }
}
