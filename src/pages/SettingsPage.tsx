import { useState, useEffect, useMemo } from 'react';
import { CustomTitleBar } from '../components/CustomTitleBar';
import { HardwareInfoSection } from '../components/HardwareInfoSection';
import { OptimizationSettingsSection } from '../components/OptimizationSettingsSection';
import { HfTokenSection } from '../components/HfTokenSection';
import { EnvironmentVariablesSection } from '../components/EnvironmentVariablesSection';
import { LicenseManager } from '../components/LicenseManager';
import { PerformanceDashboard } from '../components/PerformanceDashboard';
import { RuntimeSection } from '../components/RuntimeSection';
import { useHardwareInfo } from '../hooks/useHardwareInfo';
import { useOptimizationSettings } from '../hooks/useOptimizationSettings';
import { useHfToken } from '../hooks/useHfToken';
import { useAppStore } from '../store/appStore';
import type { OptimizationSettings } from '../lib/types';

type SettingsTab = 'general' | 'performance' | 'integrations' | 'security' | 'about';

interface OpenRouterModel {
  id: string;
  name: string;
  pricing: {
    prompt: string;
    completion: string;
  };
}

const tabs: { id: SettingsTab; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
  { id: 'performance', label: 'Performance', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { id: 'integrations', label: 'Integrations', icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
  { id: 'security', label: 'Security', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { id: 'about', label: 'About', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export function SettingsPage() {
  const { hardwareInfo, isDetecting, redetect } = useHardwareInfo();
  const { settings, isSaving, saveSettings, reloadSettings, isLoading } = useOptimizationSettings();
  const { token, username, isValidating, validateToken, clearToken } = useHfToken();
  const {
    addToast,
    openRouterApiKey,
    setOpenRouterApiKey,
    claudeApiKey,
    setClaudeApiKey,
    openAiApiKey,
    setOpenAiApiKey,
    wizardProvider,
    setWizardProvider,
    openRouterModel,
    setOpenRouterModel,
    claudeModel,
    setClaudeModel,
    openAiModel,
    setOpenAiModel,
  } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [pendingSettings, setPendingSettings] = useState<OptimizationSettings | null>(null);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);
  const [openRouterApiKeyInput, setOpenRouterApiKeyInput] = useState(openRouterApiKey || '');
  const [claudeApiKeyInput, setClaudeApiKeyInput] = useState(claudeApiKey || '');
  const [openAiApiKeyInput, setOpenAiApiKeyInput] = useState(openAiApiKey || '');
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    setOpenRouterApiKeyInput(openRouterApiKey || '');
  }, [openRouterApiKey]);

  useEffect(() => {
    setClaudeApiKeyInput(claudeApiKey || '');
  }, [claudeApiKey]);

  useEffect(() => {
    setOpenAiApiKeyInput(openAiApiKey || '');
  }, [openAiApiKey]);

  // Fetch OpenRouter models
  useEffect(() => {
    const fetchOpenRouterModels = async () => {
      setLoadingModels(true);
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        const data = await response.json();
        setOpenRouterModels(data.data || []);
      } catch (error) {
        console.error('Failed to fetch OpenRouter models:', error);
        addToast('Failed to load OpenRouter models', 'error');
      } finally {
        setLoadingModels(false);
      }
    };

    if (activeTab === 'integrations') {
      fetchOpenRouterModels();
    }
  }, [activeTab, addToast]);

  // Sync pending settings when settings load
  useEffect(() => {
    if (settings && !pendingSettings) {
      setPendingSettings(settings);
    }
  }, [settings]);

  const handleSettingsChange = (newSettings: OptimizationSettings) => {
    setPendingSettings(newSettings);
  };

  const handleSaveSettings = async () => {
    if (pendingSettings) {
      try {
        await saveSettings(pendingSettings);
        setPendingSettings(null);
        addToast('Settings saved successfully', 'success');
      } catch (err) {
        console.error('Failed to save settings:', err);
        addToast('Failed to save settings', 'error');
      }
    }
  };

  const handleResetSettings = async () => {
    await redetect();
    await reloadSettings();
    setPendingSettings(null);
    addToast('Settings reset to defaults', 'info');
  };

  const handleValidateToken = async (tokenValue: string) => {
    await validateToken(tokenValue);
  };

  const handleRedetect = async () => {
    await redetect();
    addToast('Hardware detected successfully', 'success');
  };

  const handleSaveOpenRouterKey = () => {
    const nextValue = openRouterApiKeyInput.trim() || null;
    setOpenRouterApiKey(nextValue);
    addToast(nextValue ? 'OpenRouter API key saved' : 'OpenRouter API key cleared', 'success');
  };

  const handleSaveClaudeKey = () => {
    const nextValue = claudeApiKeyInput.trim() || null;
    setClaudeApiKey(nextValue);
    addToast(nextValue ? 'Claude API key saved' : 'Claude API key cleared', 'success');
  };

  const handleSaveOpenAiKey = () => {
    const nextValue = openAiApiKeyInput.trim() || null;
    setOpenAiApiKey(nextValue);
    addToast(nextValue ? 'OpenAI API key saved' : 'OpenAI API key cleared', 'success');
  };

  const currentSettings = pendingSettings || settings;
  const openRouterModelOptions = useMemo(() => {
    const freeModels = openRouterModels.filter((model) => model.id.includes(':free'));
    const paidModels = openRouterModels.filter((model) => !model.id.includes(':free')).slice(0, 20);
    return { freeModels, paidModels };
  }, [openRouterModels]);

  return (
    <div className="h-screen flex flex-col bg-[#0A0A0A]">
      <CustomTitleBar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-56 border-r border-[#2A2A2A] flex flex-col bg-[#111111]">
          <div className="p-4">
            <h1 className="text-lg font-semibold text-white">Settings</h1>
          </div>
          
          <nav className="flex-1 px-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-1 ${
                  activeTab === tab.id
                    ? 'bg-[#1C1C1C] text-white border border-[#333333]'
                    : 'text-[#B1ADA1] hover:text-white hover:bg-[#1C1C1C]'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-[#0A0A0A]">
          <div className="max-w-3xl mx-auto p-8">
            
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">General Settings</h2>
                  <p className="text-[#B1ADA1] text-sm">Configure your OpenLLM Studio preferences</p>
                </div>

                {/* License */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-base font-medium text-white mb-4">License</h3>
                  <LicenseManager />
                </div>

                {/* Hardware Info */}
                <HardwareInfoSection
                  hardwareInfo={hardwareInfo}
                  onRedetect={handleRedetect}
                  isDetecting={isDetecting}
                />

                {/* Runtime Engine */}
                <RuntimeSection />

                {/* Optimization Settings */}
                {!isLoading && currentSettings && (
                  <OptimizationSettingsSection
                    settings={currentSettings}
                    hardwareInfo={hardwareInfo}
                    onChange={handleSettingsChange}
                    onSave={handleSaveSettings}
                    onReset={handleResetSettings}
                    isSaving={isSaving}
                  />
                )}
              </div>
            )}

            {/* Performance Tab */}
            {activeTab === 'performance' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Performance</h2>
                  <p className="text-[#B1ADA1] text-sm">Monitor and optimize your system performance</p>
                </div>

                <div className="glass-coral rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-medium text-white">Performance Dashboard</h3>
                      <p className="text-sm text-[#B1ADA1] mt-1">Real-time system monitoring</p>
                    </div>
                    <button
                      onClick={() => setShowPerformanceDashboard(!showPerformanceDashboard)}
                      className="px-4 py-2 bg-[#C15F3C] hover:bg-[#A84E2F] text-white rounded-xl text-sm font-medium transition-all"
                    >
                      {showPerformanceDashboard ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {showPerformanceDashboard && <PerformanceDashboard />}
                </div>
              </div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Integrations</h2>
                  <p className="text-[#B1ADA1] text-sm">Connect with external services</p>
                </div>

                <HfTokenSection
                  token={token}
                  username={username}
                  onValidate={handleValidateToken}
                  onClear={clearToken}
                  isValidating={isValidating}
                />

                <div className="glass rounded-2xl p-6">
                  <h3 className="text-base font-medium text-white mb-2">AI Wizard Provider</h3>
                  <p className="text-sm text-[#B1ADA1] mb-4">
                    Choose which cloud provider the AI wizard uses for recommendations. This does not affect the conversation page.
                  </p>
                  <select
                    value={wizardProvider}
                    onChange={(e) => setWizardProvider(e.target.value as 'openrouter' | 'claude' | 'openai')}
                    className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#C15F3C] transition-all appearance-none cursor-pointer"
                  >
                    <option value="openrouter">OpenRouter</option>
                    <option value="claude">Anthropic Claude</option>
                    <option value="openai">OpenAI</option>
                  </select>
                </div>

                {/* OpenRouter API */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#1F1F1F] flex items-center justify-center border border-[#333333]">
                      <svg className="w-6 h-6 text-[#C15F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-white">OpenRouter</h3>
                      <p className="text-sm text-[#B1ADA1]">Access multiple AI models through one API</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#B1ADA1] block mb-2">API Key</label>
                      <input
                        type="password"
                        value={openRouterApiKeyInput}
                        onChange={(e) => setOpenRouterApiKeyInput(e.target.value)}
                        placeholder="sk-or-v1-..."
                        className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333333] rounded-xl text-white placeholder-[#B1ADA1] focus:outline-none focus:border-[#C15F3C] transition-all"
                      />
                      <p className="text-xs text-[#B1ADA1] mt-2">
                        Get your key at <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-[#C15F3C] hover:underline">openrouter.ai/keys</a>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveOpenRouterKey}
                        className="px-4 py-2.5 bg-[#C15F3C] hover:bg-[#A84E2F] text-white rounded-xl text-sm font-medium transition-all"
                      >
                        Save Key
                      </button>
                      <button
                        onClick={() => {
                          setOpenRouterApiKeyInput('');
                          setOpenRouterApiKey(null);
                          addToast('OpenRouter API key cleared', 'info');
                        }}
                        className="px-4 py-2.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-white rounded-xl text-sm font-medium transition-all"
                      >
                        Clear
                      </button>
                    </div>

                    <div>
                      <label className="text-sm text-[#B1ADA1] block mb-2">Wizard Model</label>
                      <select
                        value={openRouterModel}
                        onChange={(e) => setOpenRouterModel(e.target.value)}
                        disabled={loadingModels}
                        className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#C15F3C] transition-all appearance-none cursor-pointer disabled:opacity-50"
                      >
                        {loadingModels ? (
                          <option>Loading models...</option>
                        ) : openRouterModelOptions.freeModels.length === 0 && openRouterModelOptions.paidModels.length === 0 ? (
                          <option value={openRouterModel}>{openRouterModel}</option>
                        ) : (
                          <>
                            <optgroup label="Free Models">
                              {openRouterModelOptions.freeModels.map(model => (
                                  <option key={model.id} value={model.id}>
                                    {model.name}
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="Paid Models">
                              {openRouterModelOptions.paidModels.map(model => (
                                  <option key={model.id} value={model.id}>
                                    {model.name}
                                  </option>
                                ))}
                            </optgroup>
                          </>
                        )}
                      </select>
                      <p className="text-xs text-[#B1ADA1] mt-2">Model used by the AI wizard for recommendations</p>
                    </div>
                  </div>
                </div>

                {/* Claude API */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#1F1F1F] flex items-center justify-center border border-[#333333]">
                      <svg className="w-6 h-6 text-[#C15F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-white">Anthropic Claude</h3>
                      <p className="text-sm text-[#B1ADA1]">Direct access to Claude models</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#B1ADA1] block mb-2">API Key</label>
                      <input
                        type="password"
                        value={claudeApiKeyInput}
                        onChange={(e) => setClaudeApiKeyInput(e.target.value)}
                        placeholder="sk-ant-..."
                        className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333333] rounded-xl text-white placeholder-[#B1ADA1] focus:outline-none focus:border-[#C15F3C] transition-all"
                      />
                      <p className="text-xs text-[#B1ADA1] mt-2">
                        Get your key at <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-[#C15F3C] hover:underline">console.anthropic.com</a>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveClaudeKey}
                        className="px-4 py-2.5 bg-[#C15F3C] hover:bg-[#A84E2F] text-white rounded-xl text-sm font-medium transition-all"
                      >
                        Save Key
                      </button>
                      <button
                        onClick={() => {
                          setClaudeApiKeyInput('');
                          setClaudeApiKey(null);
                          addToast('Claude API key cleared', 'info');
                        }}
                        className="px-4 py-2.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-white rounded-xl text-sm font-medium transition-all"
                      >
                        Clear
                      </button>
                    </div>

                    <div>
                      <label className="text-sm text-[#B1ADA1] block mb-2">Wizard Model</label>
                      <select
                        value={claudeModel}
                        onChange={(e) => setClaudeModel(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#C15F3C] transition-all appearance-none cursor-pointer"
                      >
                        <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                        <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5</option>
                        <option value="claude-opus-4-6">Claude Opus 4.6</option>
                      </select>
                      <p className="text-xs text-[#B1ADA1] mt-2">Model used by the AI wizard for recommendations</p>
                    </div>
                  </div>
                </div>

                {/* OpenAI API */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#1F1F1F] flex items-center justify-center border border-[#333333]">
                      <svg className="w-6 h-6 text-[#C15F3C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-white">OpenAI</h3>
                      <p className="text-sm text-[#B1ADA1]">Access GPT-4, GPT-3.5, and more</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-[#B1ADA1] block mb-2">API Key</label>
                      <input
                        type="password"
                        value={openAiApiKeyInput}
                        onChange={(e) => setOpenAiApiKeyInput(e.target.value)}
                        placeholder="sk-..."
                        className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333333] rounded-xl text-white placeholder-[#B1ADA1] focus:outline-none focus:border-[#C15F3C] transition-all"
                      />
                      <p className="text-xs text-[#B1ADA1] mt-2">
                        Get your key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#C15F3C] hover:underline">platform.openai.com/api-keys</a>
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleSaveOpenAiKey}
                        className="px-4 py-2.5 bg-[#C15F3C] hover:bg-[#A84E2F] text-white rounded-xl text-sm font-medium transition-all"
                      >
                        Save Key
                      </button>
                      <button
                        onClick={() => {
                          setOpenAiApiKeyInput('');
                          setOpenAiApiKey(null);
                          addToast('OpenAI API key cleared', 'info');
                        }}
                        className="px-4 py-2.5 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-white rounded-xl text-sm font-medium transition-all"
                      >
                        Clear
                      </button>
                    </div>

                    <div>
                      <label className="text-sm text-[#B1ADA1] block mb-2">Wizard Model</label>
                      <select
                        value={openAiModel}
                        onChange={(e) => setOpenAiModel(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1F1F1F] border border-[#333333] rounded-xl text-white focus:outline-none focus:border-[#C15F3C] transition-all appearance-none cursor-pointer"
                      >
                        <option value="gpt-5.4">GPT-5.4</option>
                        <option value="gpt-5.4-mini">GPT-5.4 Mini</option>
                        <option value="gpt-5-latest">GPT-5 Latest</option>
                      </select>
                      <p className="text-xs text-[#B1ADA1] mt-2">Model used by the AI wizard for recommendations</p>
                    </div>
                  </div>
                </div>

                <EnvironmentVariablesSection />
              </div>
            )}

            {/* Security Tab */}


            {activeTab === 'security' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Security & Privacy</h2>
                  <p className="text-[#B1ADA1] text-sm">Configure security and compliance settings</p>
                </div>

                {/* Air-gapped mode */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white">Air-Gapped Mode</h3>
                      <p className="text-sm text-[#B1ADA1] mt-1">Disable all external network requests</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-[#2A2A2A] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C15F3C]"></div>
                    </label>
                  </div>
                </div>

                {/* Sandbox */}
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-medium text-white">Sandbox Execution</h3>
                      <p className="text-sm text-[#B1ADA1] mt-1">Run generated code in isolated environment</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-[#2A2A2A] rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#C15F3C]"></div>
                    </label>
                  </div>
                </div>

                {/* Compliance buttons */}
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-base font-medium text-white mb-4">Compliance Reports</h3>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-white rounded-xl text-sm transition-all">
                      Export Audit Logs
                    </button>
                    <button className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-white rounded-xl text-sm transition-all">
                      Generate GDPR Report
                    </button>
                    <button className="px-4 py-2 bg-[#1F1F1F] hover:bg-[#2A2A2A] border border-[#333333] text-white rounded-xl text-sm transition-all">
                      Generate HIPAA Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">About</h2>
                  <p className="text-[#B1ADA1] text-sm">Information about OpenLLM Studio</p>
                </div>

                <div className="glass rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#C15F3C] to-[#D47A5A] flex items-center justify-center glow-crail">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-1">OpenLLM Studio</h3>
                  <p className="text-[#B1ADA1] text-sm mb-4">Version 1.0.0</p>
                  <p className="text-[#B1ADA1] text-sm max-w-md mx-auto">
                    Your private AI assistant running entirely on your machine. 
                    No data leaves your computer.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
