export function EnvironmentVariablesSection() {
  return (
    <div className="bg-[#1C1C1C] border border-[#2A2A2A] rounded-lg p-6">
      <h2 className="text-white font-semibold text-lg mb-4">Runtime Notes</h2>

      <div className="space-y-4">
        <div className="px-3 py-2 bg-[#C15F3C]/10 border border-[#C15F3C]/20 rounded">
          <p className="text-[#B1ADA1] text-sm">
            OpenLLM Studio now runs on its own embedded llama.cpp runtime. These defaults are tuned automatically for standalone desktop use.
          </p>
        </div>

        <div className="py-3 border-b border-[#2A2A2A]">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="text-white font-medium">Parallel Slots</h3>
              <p className="text-[#B1ADA1] text-sm mt-1">
                Request parallelism stays conservative so laptops do not thrash RAM or VRAM during active chats.
              </p>
            </div>
            <span className="text-[#C15F3C] font-mono text-sm">Auto</span>
          </div>
          <p className="text-[#B1ADA1] text-xs">
            This favors stable interactive performance over raw concurrency.
          </p>
        </div>

        <div className="py-3 border-b border-[#2A2A2A]">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="text-white font-medium">Loaded Models</h3>
              <p className="text-[#B1ADA1] text-sm mt-1">
                The app keeps one active model loaded at a time to avoid memory spikes when switching between conversations.
              </p>
            </div>
            <span className="text-[#C15F3C] font-mono text-sm">1</span>
          </div>
          <p className="text-[#B1ADA1] text-xs">
            This keeps the standalone experience predictable across low-memory and high-memory machines.
          </p>
        </div>

        <div className="py-3">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="text-white font-medium">Flash Attention</h3>
              <p className="text-[#B1ADA1] text-sm mt-1">
                Controlled via Optimization Settings. It can reduce VRAM usage with little or no quality impact.
              </p>
            </div>
            <span className="text-[#C15F3C] font-mono text-sm">Configurable</span>
          </div>
          <p className="text-[#B1ADA1] text-xs">
            Runtime changes apply the next time a model is started.
          </p>
        </div>
      </div>
    </div>
  );
}
