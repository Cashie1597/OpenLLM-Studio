use crate::models::{GpuBackend, HardwareInfo, OptimizationSettings};

/// Calculator for optimal Ollama parameters based on hardware
pub struct OptimizationCalculator;

impl OptimizationCalculator {
    /// Calculate optimal settings based on detected hardware
    pub fn calculate(hardware: &HardwareInfo) -> OptimizationSettings {
        let num_ctx = Self::calculate_context_window(hardware.vram_gb);
        let recommended_quantization = Self::recommend_quantization(hardware.vram_gb);
        let num_batch = Self::calculate_batch_size(&hardware.gpu_backend);
        let num_gpu = Self::calculate_gpu_layers(&hardware.gpu_backend);
        let num_thread = hardware.cpu_cores as i32;
        let flash_attention = false; // Default to off, user can enable

        OptimizationSettings {
            num_ctx,
            num_gpu,
            num_batch,
            num_thread,
            flash_attention,
            recommended_quantization,
        }
    }

    /// Calculate optimal context window based on VRAM
    /// Formula: (vram_gb - 2.0) * 2048 tokens, reserving 2GB for system
    fn calculate_context_window(vram_gb: f64) -> i32 {
        let available_vram = (vram_gb - 2.0).max(0.0);
        let tokens = (available_vram * 2048.0) as i32;
        tokens.clamp(2048, 131072) // Min 2K, max 128K
    }

    /// Recommend quantization level based on VRAM
    fn recommend_quantization(vram_gb: f64) -> String {
        match vram_gb {
            v if v >= 8.0 => "Q5_K_M or Q8_0".to_string(),
            v if v >= 4.0 => "Q4_K_M".to_string(),
            _ => "Q2_K or Q3_K_S".to_string(),
        }
    }

    /// Calculate batch size based on GPU backend
    fn calculate_batch_size(gpu_backend: &GpuBackend) -> i32 {
        match gpu_backend {
            GpuBackend::CpuOnly => 128,
            _ => 512,
        }
    }

    /// Calculate GPU layer allocation
    fn calculate_gpu_layers(gpu_backend: &GpuBackend) -> i32 {
        match gpu_backend {
            GpuBackend::CpuOnly => 0,
            _ => 1, // Ollama auto-detects optimal layer count
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_context_window_high_vram() {
        let ctx = OptimizationCalculator::calculate_context_window(12.0);
        assert_eq!(ctx, (10.0 * 2048.0) as i32); // 12 - 2 = 10GB available
    }

    #[test]
    fn test_context_window_medium_vram() {
        let ctx = OptimizationCalculator::calculate_context_window(6.0);
        assert_eq!(ctx, (4.0 * 2048.0) as i32); // 6 - 2 = 4GB available
    }

    #[test]
    fn test_context_window_low_vram() {
        let ctx = OptimizationCalculator::calculate_context_window(1.0);
        assert_eq!(ctx, 2048); // Clamped to minimum
    }

    #[test]
    fn test_context_window_max_clamp() {
        let ctx = OptimizationCalculator::calculate_context_window(100.0);
        assert_eq!(ctx, 131072); // Clamped to maximum
    }

    #[test]
    fn test_quantization_high_vram() {
        let quant = OptimizationCalculator::recommend_quantization(12.0);
        assert_eq!(quant, "Q5_K_M or Q8_0");
    }

    #[test]
    fn test_quantization_medium_vram() {
        let quant = OptimizationCalculator::recommend_quantization(6.0);
        assert_eq!(quant, "Q4_K_M");
    }

    #[test]
    fn test_quantization_low_vram() {
        let quant = OptimizationCalculator::recommend_quantization(2.0);
        assert_eq!(quant, "Q2_K or Q3_K_S");
    }

    #[test]
    fn test_batch_size_gpu() {
        let batch = OptimizationCalculator::calculate_batch_size(&GpuBackend::Nvidia);
        assert_eq!(batch, 512);
    }

    #[test]
    fn test_batch_size_cpu() {
        let batch = OptimizationCalculator::calculate_batch_size(&GpuBackend::CpuOnly);
        assert_eq!(batch, 128);
    }

    #[test]
    fn test_gpu_layers_gpu() {
        let layers = OptimizationCalculator::calculate_gpu_layers(&GpuBackend::Nvidia);
        assert_eq!(layers, 1);
    }

    #[test]
    fn test_gpu_layers_cpu() {
        let layers = OptimizationCalculator::calculate_gpu_layers(&GpuBackend::CpuOnly);
        assert_eq!(layers, 0);
    }

    #[test]
    fn test_full_calculation() {
        let hardware = HardwareInfo {
            gpu_name: "NVIDIA GeForce RTX 3060".to_string(),
            gpu_backend: GpuBackend::Nvidia,
            vram_gb: 12.0,
            ram_gb: 32.0,
            cpu_cores: 16,
            disk_space_gb: Some(500.0),
        };

        let settings = OptimizationCalculator::calculate(&hardware);

        assert_eq!(settings.num_ctx, (10.0 * 2048.0) as i32);
        assert_eq!(settings.num_gpu, 1);
        assert_eq!(settings.num_batch, 512);
        assert_eq!(settings.num_thread, 16);
        assert_eq!(settings.flash_attention, false);
        assert_eq!(settings.recommended_quantization, "Q5_K_M or Q8_0");
    }
}
