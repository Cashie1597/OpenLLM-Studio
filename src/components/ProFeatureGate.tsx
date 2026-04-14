import { ReactNode, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface ProFeatureGateProps {
  children: ReactNode;
  featureName: string;
  fallback?: ReactNode;
}

export function ProFeatureGate({ children, featureName, fallback }: ProFeatureGateProps) {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkProStatus();
  }, []);

  const checkProStatus = async () => {
    try {
      const dbPath = await invoke<string>('get_db_path');
      const proEnabled = await invoke<boolean>('is_pro_enabled', { dbPath });
      setIsPro(proEnabled);
    } catch (err) {
      console.error('Failed to check Pro status:', err);
      setIsPro(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-32" />;
  }

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
        <div className="bg-[#1C1C1C] border border-[#333333] p-6 rounded-lg shadow-xl max-w-md text-center">
          <div className="inline-block px-3 py-1 bg-gradient-to-r from-[#C15F3C] to-[#D47A5A] text-white text-sm font-semibold rounded-full mb-4">
            PRO
          </div>
          <h3 className="text-xl font-bold mb-2 text-white">
            {featureName}
          </h3>
          <p className="text-[#B1ADA1] mb-4">
            This feature requires a Pro license to unlock.
          </p>
          <div className="space-y-2">
            <a
              href="https://openllm.studio/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-2 bg-[#C15F3C] text-white rounded-lg hover:bg-[#A84E2F] transition"
            >
              Try Pro - $9/month
            </a>
            <button
              onClick={() => window.location.href = '/settings'}
              className="block w-full px-4 py-2 border border-[#333333] text-white rounded-lg hover:bg-[#1F1F1F] transition"
            >
              I have a license key
            </button>
          </div>
        </div>
      </div>
      <div className="pointer-events-none opacity-30">
        {children}
      </div>
    </div>
  );
}

export function ProBadge() {
  return (
    <span className="inline-block px-2 py-0.5 bg-gradient-to-r from-[#C15F3C] to-[#D47A5A] text-white text-xs font-semibold rounded">
      PRO
    </span>
  );
}
