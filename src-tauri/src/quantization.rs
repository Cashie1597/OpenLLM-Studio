use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QuantizationLevel {
    Q2K, Q3KS, Q4KM, Q5KM, Q6K, Q8_0, F16, F32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuantizationOption {
    pub level: QuantizationLevel,
    pub vram_required_gb: f64,
    pub estimated_tokens_per_sec: f64,
    pub quality_score: f64,
    pub fits_in_memory: bool,
}

pub struct QuantizationEngine;

impl QuantizationEngine {
    pub fn new() -> Self {
        Self
    }

    pub fn calculate_options(
        &self,
        model_size_gb: f64,
        available_vram_gb: f64,
    ) -> Vec<QuantizationOption> {
        let multipliers = vec![
            (QuantizationLevel::Q2K, 0.25, 0.5, 40.0),
            (QuantizationLevel::Q3KS, 0.35, 0.6, 35.0),
            (QuantizationLevel::Q4KM, 0.5, 0.75, 30.0),
            (QuantizationLevel::Q5KM, 0.65, 0.85, 25.0),
            (QuantizationLevel::Q6K, 0.75, 0.9, 22.0),
            (QuantizationLevel::Q8_0, 0.85, 0.95, 20.0),
            (QuantizationLevel::F16, 1.0, 1.0, 18.0),
            (QuantizationLevel::F32, 2.0, 1.0, 15.0),
        ];

        multipliers
            .into_iter()
            .map(|(level, mult, quality, speed)| {
                let vram_req = model_size_gb * mult + 2.0;
                QuantizationOption {
                    level,
                    vram_required_gb: vram_req,
                    estimated_tokens_per_sec: speed,
                    quality_score: quality,
                    fits_in_memory: vram_req <= available_vram_gb,
                }
            })
            .collect()
    }
}
