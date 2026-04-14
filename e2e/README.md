# E2E Testing for OpenLLM Studio

## Overview

This E2E test suite uses **WebdriverIO** to test the Tauri desktop application in a real native environment. The tests launch the actual app and verify:

- ✅ Native system access (RAM, VRAM detection)
- ✅ File system operations (downloads to real directories)
- ✅ UI interactions (navigation, forms, buttons)
- ✅ Full application workflow

## Prerequisites

1. **Build the Tauri app first:**
   ```bash
   npm run build:tauri
   ```

2. **Tauri WebDriver support** - Tauri automatically includes WebDriver support in release builds

## Running Tests

### Run all E2E tests:
```bash
npm run test:e2e
```

### Build and test in one command:
```bash
npm run test:e2e:build
```

## Test Structure

```
e2e/
├── app.spec.ts           # Basic app launch and navigation
├── hardware.spec.ts      # Hardware detection (RAM, VRAM)
├── model-download.spec.ts # Model library and downloads
└── chat.spec.ts          # Chat interface functionality
```

## Adding Data Test IDs

For more reliable tests, add `data-testid` attributes to your components:

```tsx
// Example in your React components:
<div data-testid="hardware-info">
  <span data-testid="ram-info">RAM: {ramAmount}</span>
  <span data-testid="vram-info">VRAM: {vramAmount}</span>
</div>

<button data-testid="download-model" onClick={handleDownload}>
  Download
</button>

<div data-testid="chat-input">
  <textarea placeholder="Type a message..." />
</div>
```

## Configuration

Edit `wdio.conf.ts` to customize:
- Test timeout values
- Log levels
- Reporter options
- Capabilities

## Troubleshooting

### App doesn't launch
- Ensure you've built the release version: `npm run build:tauri`
- Check the path in `wdio.conf.ts` matches your build output

### Tests can't find elements
- Add `data-testid` attributes to your components
- Use browser DevTools to inspect element selectors
- Increase wait timeouts if elements load slowly

### WebDriver connection fails
- Tauri includes WebDriver support automatically in release builds
- Make sure no other instance of the app is running

## Writing New Tests

```typescript
import { browser, $, expect } from '@wdio/globals';

describe('My Feature', () => {
  it('should do something', async () => {
    // Wait for app to be ready
    await browser.pause(1000);
    
    // Find element
    const element = await $('[data-testid="my-element"]');
    
    // Interact
    await element.click();
    
    // Assert
    expect(await element.isDisplayed()).toBe(true);
  });
});
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Build Tauri App
  run: npm run build:tauri

- name: Run E2E Tests
  run: npm run test:e2e
```
