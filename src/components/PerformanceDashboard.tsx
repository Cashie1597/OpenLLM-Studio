export function PerformanceDashboard() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-[#1F1F1F] border border-[#333333] rounded-xl">
          <div className="text-sm text-[#B1ADA1]">Tokens/sec</div>
          <div className="text-2xl font-bold text-white">0</div>
        </div>
        <div className="p-4 bg-[#1F1F1F] border border-[#333333] rounded-xl">
          <div className="text-sm text-[#B1ADA1]">VRAM Usage</div>
          <div className="text-2xl font-bold text-white">0%</div>
        </div>
        <div className="p-4 bg-[#1F1F1F] border border-[#333333] rounded-xl">
          <div className="text-sm text-[#B1ADA1]">GPU Temp</div>
          <div className="text-2xl font-bold text-white">0°C</div>
        </div>
        <div className="p-4 bg-[#1F1F1F] border border-[#333333] rounded-xl">
          <div className="text-sm text-[#B1ADA1]">CPU Usage</div>
          <div className="text-2xl font-bold text-white">0%</div>
        </div>
      </div>
    </div>
  );
}
