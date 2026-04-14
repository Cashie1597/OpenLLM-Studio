import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface TestResult {
  name: string;
  description: string;
  success: boolean;
  message: string;
}

export function OllamaRegistrationTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [filePath, setFilePath] = useState('C:\\Users\\saadq\\.ollama\\models\\qwen2.5-0.5b-instruct-q5_k_m.gguf');

  const testCases = [
    { name: "qwen2:q5_k_m", desc: "Simple format with known model" },
    { name: "qwen2.5:0.5b", desc: "With dots in version" },
    { name: "qwen2.5-0.5b-instruct:q5_k_m", desc: "Full name with dots" },
    { name: "qwen25-05b-instruct:q5_k_m", desc: "No dots in version" },
    { name: "custom-qwen:latest", desc: "Custom name" },
    { name: "qwen2", desc: "Just model name, no tag" },
    { name: "qwen2:latest", desc: "Model with latest tag" },
  ];

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    const testResults: TestResult[] = [];

    for (const testCase of testCases) {
      try {
        const result = await invoke<string>('test_ollama_registration', {
          filePath: filePath,
          modelName: testCase.name
        });
        
        testResults.push({
          name: testCase.name,
          description: testCase.desc,
          success: true,
          message: result
        });
        
        setResults([...testResults]);
        
        // If we found a working format, stop testing
        console.log(`✅ Found working format: ${testCase.name}`);
        break;
        
      } catch (error) {
        testResults.push({
          name: testCase.name,
          description: testCase.desc,
          success: false,
          message: String(error)
        });
        
        setResults([...testResults]);
      }
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setTesting(false);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg">
      <h2 className="text-xl font-bold mb-4">Ollama Registration Test</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">GGUF File Path:</label>
        <input
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          className="w-full px-3 py-2 bg-[#1F1F1F] rounded border border-[#333333] focus:border-[#C15F3C] focus:outline-none text-white"
          placeholder="Path to GGUF file"
        />
      </div>

      <button
        onClick={runTests}
        disabled={testing}
        className="px-4 py-2 bg-[#C15F3C] hover:bg-[#A84E2F] disabled:bg-[#2A2A2A] rounded font-medium transition-colors text-white"
      >
        {testing ? 'Testing...' : 'Run Registration Tests'}
      </button>

      {results.length > 0 && (
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold mb-2">Test Results:</h3>
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-3 rounded border ${
                result.success
                  ? 'bg-green-900/20 border-green-600'
                  : 'bg-red-900/20 border-red-600'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {result.success ? '✅' : '❌'}
                </span>
                <div className="flex-1">
                  <div className="font-mono text-sm font-semibold">
                    {result.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {result.description}
                  </div>
                  <div className={`text-sm mt-2 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.message}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {results.some(r => r.success) && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-600 rounded">
              <div className="font-semibold text-green-400">
                🎉 Found working model name format!
              </div>
              <div className="text-sm mt-2">
                Use this format: <span className="font-mono font-bold">
                  {results.find(r => r.success)?.name}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
