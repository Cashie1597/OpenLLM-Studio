// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

// Module declarations
pub mod audit_logger;
pub mod app_logging;
pub mod backend_router;
pub mod coding_agent;
pub mod commands;
pub mod compliance;
pub mod db;
pub mod download_manager;
pub mod error;
pub mod gdpr_reporter;
pub mod hardware;
pub mod hipaa_reporter;
pub mod huggingface;
pub mod license;
pub mod llama_binaries;
pub mod local_runtime;
pub mod loop_detector;
pub mod lora_trainer;
pub mod memory_optimizer;
pub mod metrics;
pub mod model_recommender;
pub mod model_router;
pub mod models;
pub mod model_store;
pub mod optimization;
pub mod personalization;
pub mod quantization;
pub mod rag;
pub mod sandbox;
pub mod self_check;
pub mod team_config;
pub mod telemetry;
pub mod test_generator;

#[cfg(test)]
mod tests;

use tauri::Manager;
use tauri::tray::TrayIconBuilder;
use tauri::menu::{Menu, MenuItem};

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Enable console output on Windows
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
    }

    let _ = rustls::crypto::ring::default_provider().install_default();
    
    println!("=== TAURI APP STARTING ===");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(
                    "sqlite:openllm_studio.db",
                    vec![
                        tauri_plugin_sql::Migration {
                            version: 1,
                            description: "create initial tables",
                            sql: include_str!("../migrations/001_initial_schema.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        tauri_plugin_sql::Migration {
                            version: 2,
                            description: "create optimization settings table",
                            sql: include_str!("../migrations/002_optimization_settings.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        tauri_plugin_sql::Migration {
                            version: 3,
                            description: "create licenses table",
                            sql: include_str!("../migrations/003_licenses.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                        tauri_plugin_sql::Migration {
                            version: 4,
                            description: "create hardware_info table",
                            sql: include_str!("../migrations/004_hardware_info.sql"),
                            kind: tauri_plugin_sql::MigrationKind::Up,
                        },
                    ],
                )
                .build(),
        )
        .setup(|app| {
            // Get the app data directory
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to get app data directory");
            
            // Create the directory if it doesn't exist
            std::fs::create_dir_all(&app_data_dir)
                .expect("Failed to create app data directory");

            #[cfg(not(debug_assertions))]
            {
                let (log_redirects, log_path) = app_logging::init_logging(&app_data_dir)
                    .expect("Failed to initialize file logging");
                app.manage(log_redirects);
                println!("[SETUP] Log file: {}", log_path.to_string_lossy());
            }

            #[cfg(debug_assertions)]
            println!("[SETUP] Dev mode logging stays on the terminal");

            println!("[SETUP] App data directory: {}", app_data_dir.to_string_lossy());
            
            // Store the database path in app state for easy access
            let db_path = app_data_dir.join("openllm_studio.db");
            println!("[SETUP] Database path: {}", db_path.to_string_lossy());
            app.manage(db_path);

            let model_root = app_data_dir.join("models");
            std::fs::create_dir_all(&model_root)
                .expect("Failed to create model root");

            let runtime_root = app.path()
                .resource_dir()
                .unwrap_or_else(|_| app_data_dir.clone())
                .join("llama");
            
            println!("[SETUP] Model root: {}", model_root.to_string_lossy());
            println!("[SETUP] Runtime root: {}", runtime_root.to_string_lossy());
            
            app.manage(local_runtime::RuntimeManager::new(model_root, runtime_root));
            
            // Create and store download manager
            let download_manager = download_manager::DownloadManager::new();
            app.manage(download_manager);
            
            // Setup system tray with the same icon as the titlebar
            let quit_item = MenuItem::with_id(app, "quit", "Quit OpenLLM Studio", true, None::<&str>)?;
            let show_item = MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;
            
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("OpenLLM Studio")
                .menu(&menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "quit" => {
                            app.exit(0);
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        _ => {}
                    }
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            commands::get_db_path,
            commands::check_ollama_health,
            commands::list_models,
            commands::get_loaded_model,
            commands::get_conversations,
            commands::create_conversation,
            commands::update_conversation,
            commands::delete_conversation,
            commands::get_messages,
            commands::pull_model,
            commands::pull_model_with_retry,
            commands::send_chat_message,
            commands::stop_chat_generation,
            commands::delete_model,
            commands::save_message,
            commands::detect_hardware,
            commands::detect_hardware_cached,
            commands::search_hf_models,
            commands::get_hf_model_files,
            commands::get_hf_model_details,
            commands::download_hf_model,
            commands::cancel_hf_download,
            commands::pause_hf_download,
            commands::validate_hf_token,
            commands::get_optimization_settings,
            commands::save_optimization_settings,
            commands::test_ollama_registration,
            commands::ollama_chat,
            commands::validate_license,
            commands::is_pro_enabled,
            commands::get_license_info,
            commands::deactivate_license,
            commands::get_model_recommendations,
            commands::get_recommended_binary,
            commands::get_binary_statuses,
            commands::download_binary,
            commands::is_binary_installed,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
