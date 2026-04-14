use crate::error::AppError;
use crate::models::Model;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tauri::Manager;

pub const MANIFEST_FILE: &str = "manifest.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LocalModelManifest {
    pub name: String,
    pub file_name: String,
    pub file_path: String,
    pub size: i64,
    pub modified_at: String,
    pub source_repo: Option<String>,
    pub source_filename: Option<String>,
}

pub fn models_root_for_app(app_handle: &tauri::AppHandle) -> Result<PathBuf, AppError> {
    let root = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| AppError::RuntimeError(format!("Failed to resolve app data dir: {}", e)))?
        .join("models");

    std::fs::create_dir_all(&root)?;
    Ok(root)
}

pub fn ensure_model_dir(root: &Path, model_name: &str) -> Result<PathBuf, AppError> {
    std::fs::create_dir_all(root)?;
    let model_dir = root.join(sanitize_model_name(model_name));
    std::fs::create_dir_all(&model_dir)?;
    Ok(model_dir)
}

pub fn write_manifest(model_dir: &Path, manifest: &LocalModelManifest) -> Result<(), AppError> {
    let manifest_path = model_dir.join(MANIFEST_FILE);
    let manifest_json = serde_json::to_vec_pretty(manifest)?;
    std::fs::write(manifest_path, manifest_json)?;
    Ok(())
}

pub fn list_installed_models(root: &Path) -> Result<Vec<Model>, AppError> {
    if !root.exists() {
        return Ok(Vec::new());
    }

    let mut models = Vec::new();
    for entry in std::fs::read_dir(root)? {
        let entry = entry?;
        if !entry.file_type()?.is_dir() {
            continue;
        }

        let manifest_path = entry.path().join(MANIFEST_FILE);
        if !manifest_path.exists() {
            continue;
        }

        let manifest: LocalModelManifest = serde_json::from_slice(&std::fs::read(&manifest_path)?)?;
        models.push(Model {
            name: manifest.name,
            size: manifest.size,
            modified_at: manifest.modified_at,
        });
    }

    models.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
    Ok(models)
}

pub fn get_manifest(root: &Path, model_name: &str) -> Result<Option<LocalModelManifest>, AppError> {
    if !root.exists() {
        return Ok(None);
    }

    for entry in std::fs::read_dir(root)? {
        let entry = entry?;
        if !entry.file_type()?.is_dir() {
            continue;
        }

        let manifest_path = entry.path().join(MANIFEST_FILE);
        if !manifest_path.exists() {
            continue;
        }

        let manifest: LocalModelManifest = serde_json::from_slice(&std::fs::read(&manifest_path)?)?;
        if manifest.name == model_name {
            return Ok(Some(manifest));
        }
    }

    Ok(None)
}

pub fn delete_model(root: &Path, model_name: &str) -> Result<(), AppError> {
    if !root.exists() {
        return Ok(());
    }

    for entry in std::fs::read_dir(root)? {
        let entry = entry?;
        if !entry.file_type()?.is_dir() {
            continue;
        }

        let manifest_path = entry.path().join(MANIFEST_FILE);
        if !manifest_path.exists() {
            continue;
        }

        let manifest: LocalModelManifest = serde_json::from_slice(&std::fs::read(&manifest_path)?)?;
        if manifest.name == model_name {
            std::fs::remove_dir_all(entry.path())?;
            return Ok(());
        }
    }

    Ok(())
}

pub fn sanitize_model_name(model_name: &str) -> String {
    model_name
        .chars()
        .map(|ch| match ch {
            'a'..='z' | 'A'..='Z' | '0'..='9' => ch,
            _ => '_',
        })
        .collect()
}
