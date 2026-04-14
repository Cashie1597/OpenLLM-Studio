use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub tokens_per_sec: f64,
    pub vram_used_gb: f64,
    pub vram_total_gb: f64,
    pub gpu_temp_celsius: f64,
    pub cpu_usage_percent: f64,
    pub ram_used_gb: f64,
    pub ram_total_gb: f64,
    pub timestamp: i64,
}

pub struct MetricsCollector;

impl MetricsCollector {
    pub fn new() -> Self {
        Self
    }

    pub async fn collect(&self) -> Result<PerformanceMetrics, String> {
        Ok(PerformanceMetrics {
            tokens_per_sec: 0.0,
            vram_used_gb: 0.0,
            vram_total_gb: 0.0,
            gpu_temp_celsius: 0.0,
            cpu_usage_percent: 0.0,
            ram_used_gb: 0.0,
            ram_total_gb: 0.0,
            timestamp: chrono::Utc::now().timestamp(),
        })
    }
}
