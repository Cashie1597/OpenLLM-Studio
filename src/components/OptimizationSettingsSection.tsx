import type { OptimizationSettings, HardwareInfo } from '../lib/types';

interface OptimizationSettingsSectionProps {
  settings: OptimizationSettings | null;
  hardwareInfo: HardwareInfo | null;
  onChange: (settings: OptimizationSettings) => void;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
}

export function OptimizationSettingsSection({
  settings,
  hardwareInfo,
  onChange,
  onSave,
  onReset,
  isSaving,
}: OptimizationSettingsSectionProps) {
  if (!settings) {
    return null;
  }

  const handleChange = (key: keyof OptimizationSettings, value: number | boolean) => {
    onChange({ ...settings, [key]: value });
  };

  const estimateVramUsage = () => {
    if (!hardwareInfo) return 0;
    
    const baseModelVram = 4.0;
    const contextVram = (settings.num_ctx / 2048) * 1.0;
    const total = baseModelVram + contextVram;
    
    return settings.flash_attention ? total * 0.8 : total;
  };

  const vramUsage = estimateVramUsage();
  const vramExceeded = hardwareInfo && vramUsage > hardwareInfo.vram_gb;
  const isCpuOnly = hardwareInfo?.gpu_backend === 'cpu_only';

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-base font-medium text-white">Optimization Settings</h3>
        <p className="text-sm text-[#B1ADA1] mt-1">Fine-tune model performance</p>
      </div>

      <div className="space-y-6">
        {/* Context Length */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm text-[#B1ADA1]">Context Length</label>
            <span className="text-sm text-white font-medium bg-[#1F1F1F] px-2 py-1 rounded-lg">
              {settings.num_ctx.toLocaleString()} tokens
            </span>
          </div>
          <input
            type="range"
            min="2048"
            max="131072"
            step="2048"
            value={settings.num_ctx}
            onChange={(e) => handleChange('num_ctx', parseInt(e.target.value))}
            className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#C15F3C] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
          />
          <p className="text-xs text-[#B1ADA1] mt-2">
            Conversation history the model can process
          </p>
        </div>

        {/* GPU Layer Allocation */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm text-[#B1ADA1]">GPU Layer Allocation</label>
            <span className="text-sm text-white font-medium bg-[#1F1F1F] px-2 py-1 rounded-lg">
              {isCpuOnly ? 'CPU Only' : settings.num_gpu === 0 ? 'CPU Only' : 'Auto'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={settings.num_gpu}
            onChange={(e) => handleChange('num_gpu', parseInt(e.target.value))}
            disabled={isCpuOnly}
            className="w-full h-2 bg-[#2A2A2A] rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D47A5A] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
          />
          <p className="text-xs text-[#B1ADA1] mt-2">
            {isCpuOnly
              ? 'GPU acceleration not available'
              : 'Model layers on GPU (0 = CPU only)'}
          </p>
        </div>

        {/* Flash Attention */}
        <div className="flex items-center justify-between py-4 border-t border-[#2A2A2A]">
          <div>
            <label className="text-sm text-[#B1ADA1] block">Flash Attention</label>
            <p className="text-xs text-[#B1ADA1] mt-1">Reduces memory usage by ~20%</p>
          </div>
          <button
            onClick={() => handleChange('flash_attention', !settings.flash_attention)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.flash_attention ? 'bg-[#C15F3C]' : 'bg-[#2A2A2A]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                settings.flash_attention ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* VRAM Estimation */}
        {hardwareInfo && (
          <div className="pt-4 border-t border-[#2A2A2A]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm text-[#B1ADA1]">Estimated VRAM Usage</span>
              <span className={`text-sm font-medium ${vramExceeded ? 'text-[#c45c5c]' : 'text-white'}`}>
                {vramUsage.toFixed(1)} GB / {hardwareInfo.vram_gb.toFixed(1)} GB
              </span>
            </div>
            <div className="w-full bg-[#2A2A2A] rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  vramExceeded ? 'bg-[#c45c5c]' : 'bg-gradient-to-r from-[#C15F3C] to-[#D47A5A]'
                }`}
                style={{ width: `${Math.min((vramUsage / hardwareInfo.vram_gb) * 100, 100)}%` }}
              />
            </div>
            {vramExceeded && (
              <div className="mt-4 p-4 bg-[#1F1F1F] border border-[#c45c5c] rounded-xl">
                <p className="text-[#c45c5c] text-xs font-medium mb-2">
                  ⚠️ VRAM usage exceeds available memory
                </p>
                <p className="text-[#B1ADA1] text-xs">
                  Reduce context length or enable Flash Attention
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recommended Quantization */}
        {settings.recommended_quantization && (
          <div className="flex justify-between items-center py-3 border-t border-[#2A2A2A]">
            <span className="text-sm text-[#B1ADA1]">Recommended Quantization</span>
            <span className="text-sm text-white font-medium bg-[#1F1F1F] px-2 py-1 rounded-lg">
              {settings.recommended_quantization}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-[#2A2A2A]">
          <button
            onClick={onSave}
            disabled={isSaving || (vramExceeded ?? false)}
            className="flex-1 px-4 py-2.5 bg-[#C15F3C] hover:bg-[#A84E2F] text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>
          <button
            onClick={onReset}
            disabled={isSaving}
            className="px-4 py-2.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-white rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}