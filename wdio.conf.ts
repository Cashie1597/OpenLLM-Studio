import type { Options } from '@wdio/types';
import { join } from 'path';

export const config: Options.Testrunner = {
  runner: 'local',
  specs: ['./e2e/**/*.spec.ts'],
  exclude: [],
  maxInstances: 1,
  capabilities: [
    {
      'tauri:options': {
        application: process.platform === 'win32' 
          ? join(process.cwd(), 'src-tauri', 'target', 'release', 'openllm-studio.exe')
          : process.platform === 'darwin'
          ? join(process.cwd(), 'src-tauri', 'target', 'release', 'bundle', 'macos', 'openllm-studio.app')
          : join(process.cwd(), 'src-tauri', 'target', 'release', 'openllm-studio'),
      },
    } as any,
  ],
  logLevel: 'info',
  bail: 0,
  baseUrl: 'http://localhost',
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    ui: 'bdd',
    timeout: 60000,
  },
};
