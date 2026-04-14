import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface LicenseInfo {
  license_type: 'subscription' | 'lifetime';
  expiration_date: number | null;
  created_at: number;
  validated_at: number;
  is_valid: boolean;
}

export function LicenseManager() {
  const [licenseKey, setLicenseKey] = useState('');
  const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadLicenseInfo();
  }, []);

  const loadLicenseInfo = async () => {
    try {
      const dbPath = await invoke<string>('get_db_path');
      const info = await invoke<LicenseInfo | null>('get_license_info', { dbPath });
      setLicenseInfo(info);
    } catch (err) {
      console.error('Failed to load license info:', err);
    }
  };

  const handleValidate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const dbPath = await invoke<string>('get_db_path');
      const info = await invoke<LicenseInfo>('validate_license', {
        dbPath,
        licenseKey: licenseKey.trim()
      });
      
      setLicenseInfo(info);
      setSuccess('License activated successfully!');
      setLicenseKey('');
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your Pro license?')) return;
    
    setLoading(true);
    setError('');
    
    try {
      const dbPath = await invoke<string>('get_db_path');
      await invoke('deactivate_license', { dbPath });
      setLicenseInfo(null);
      setSuccess('License deactivated successfully');
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      {licenseInfo ? (
        <div className="bg-[#1F1F1F] border border-[#333333] p-4 rounded-lg space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium text-white">Status:</span>
            <span className={licenseInfo.is_valid ? 'text-[#5a9a6e]' : 'text-[#c45c5c]'}>
              {licenseInfo.is_valid ? 'Active' : 'Expired'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-white">Type:</span>
            <span className="capitalize text-[#B1ADA1]">{licenseInfo.license_type}</span>
          </div>
          
          {licenseInfo.expiration_date && (
            <div className="flex justify-between items-center">
              <span className="font-medium text-white">Expires:</span>
              <span className="text-[#B1ADA1]">{formatDate(licenseInfo.expiration_date)}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="font-medium text-white">Activated:</span>
            <span className="text-[#B1ADA1]">{formatDate(licenseInfo.created_at)}</span>
          </div>
          
          <div className="pt-2">
            <h3 className="font-medium mb-2 text-white">Enabled Features:</h3>
            <ul className="list-disc list-inside text-sm space-y-1 text-[#B1ADA1]">
              <li>Hardware-Aware Model Wizard</li>
              <li>Coding Super-Agent</li>
              <li>Performance Dashboard</li>
              <li>Personalization Engine</li>
              <li>Compliance Suite</li>
            </ul>
          </div>
          
          <button
            onClick={handleDeactivate}
            disabled={loading}
            className="w-full mt-4 px-4 py-2 bg-[#c45c5c] text-white rounded-lg hover:bg-[#b44c4c] disabled:opacity-50 transition-all"
          >
            Deactivate License
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[#B1ADA1]">
            Enter your Pro license key to unlock premium features.
          </p>
          
          <div>
            <input
              type="text"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              placeholder="lifetime:0:abc123..."
              className="w-full px-3 py-2 bg-[#1F1F1F] border border-[#333333] rounded-lg text-white placeholder-[#B1ADA1] focus:outline-none focus:border-[#C15F3C]"
              disabled={loading}
            />
          </div>
          
          <button
            onClick={handleValidate}
            disabled={loading || !licenseKey.trim()}
            className="w-full px-4 py-2 bg-[#C15F3C] text-white rounded-lg hover:bg-[#A84E2F] disabled:opacity-50 transition-all"
          >
            {loading ? 'Validating...' : 'Activate License'}
          </button>
          
          <a
            href="https://openllm.studio/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-sm text-[#C15F3C] hover:underline"
          >
            Purchase a Pro License
          </a>
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-[#1F1F1F] border border-[#c45c5c] text-[#c45c5c] rounded-lg">
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-[#1F1F1F] border border-[#5a9a6e] text-[#5a9a6e] rounded-lg">
          {success}
        </div>
      )}
    </div>
  );
}
