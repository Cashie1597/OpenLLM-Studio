use std::fs::{self, File, OpenOptions};
use std::path::{Path, PathBuf};

pub struct LogRedirectGuards {
    #[allow(dead_code)]
    stdout_file: File,
    #[allow(dead_code)]
    stderr_file: File,
}

pub fn init_logging(app_data_dir: &Path) -> Result<(LogRedirectGuards, PathBuf), String> {
    let logs_dir = app_data_dir.join("logs");
    fs::create_dir_all(&logs_dir)
        .map_err(|e| format!("Failed to create logs directory: {}", e))?;

    let log_path = logs_dir.join("openllm-studio.log");
    let stdout_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;
    let stderr_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;

    #[cfg(target_os = "windows")]
    redirect_std_handles(&stdout_file, &stderr_file)?;

    Ok((
        LogRedirectGuards {
            stdout_file,
            stderr_file,
        },
        log_path,
    ))
}

#[cfg(target_os = "windows")]
fn redirect_std_handles(stdout_file: &File, stderr_file: &File) -> Result<(), String> {
    use std::ffi::c_void;
    use std::os::windows::io::AsRawHandle;

    type Handle = *mut c_void;

    const STD_OUTPUT_HANDLE: u32 = -11i32 as u32;
    const STD_ERROR_HANDLE: u32 = -12i32 as u32;

    #[link(name = "Kernel32")]
    extern "system" {
        fn SetStdHandle(n_std_handle: u32, handle: Handle) -> i32;
    }

    let stdout_handle = stdout_file.as_raw_handle() as Handle;
    let stderr_handle = stderr_file.as_raw_handle() as Handle;

    let stdout_ok = unsafe { SetStdHandle(STD_OUTPUT_HANDLE, stdout_handle) };
    if stdout_ok == 0 {
        return Err("Failed to redirect stdout to log file".to_string());
    }

    let stderr_ok = unsafe { SetStdHandle(STD_ERROR_HANDLE, stderr_handle) };
    if stderr_ok == 0 {
        return Err("Failed to redirect stderr to log file".to_string());
    }

    Ok(())
}
