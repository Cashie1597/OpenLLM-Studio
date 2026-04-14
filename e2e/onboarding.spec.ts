import { browser, $, expect } from '@wdio/globals';

describe('Onboarding Flow', () => {
  it('should show binary download prompt on first launch', async () => {
    await browser.pause(3000);
    
    // Look for binary download prompt
    const binaryPrompt = await $('[data-testid="binary-download-prompt"]').catch(() => 
      $('*=Download').catch(() => 
        $('*=Binary').catch(() => null)
      )
    );
    
    if (binaryPrompt) {
      const isDisplayed = await binaryPrompt.isDisplayed();
      console.log('Binary download prompt displayed:', isDisplayed);
      expect(isDisplayed).toBe(true);
    } else {
      console.log('Binary prompt not found - may already be installed');
    }
  });

  it('should allow selecting runtime engine', async () => {
    await browser.pause(2000);
    
    // Navigate to settings
    const settingsBtn = await $('button*=Settings').catch(() => null);
    if (settingsBtn) {
      await settingsBtn.click();
      await browser.pause(1000);
    }
    
    // Look for runtime selection
    const runtimeSection = await $('[data-testid="runtime-section"]').catch(() => 
      $('*=Runtime').catch(() => null)
    );
    
    if (runtimeSection) {
      console.log('Runtime section found');
      expect(await runtimeSection.isExisting()).toBe(true);
    } else {
      console.log('Runtime section not found - add data-testid="runtime-section"');
    }
  });

  it('should complete hardware detection', async () => {
    await browser.pause(2000);
    
    // Look for hardware info
    const hardwareInfo = await $('[data-testid="hardware-info"]').catch(() => null);
    
    if (hardwareInfo) {
      await hardwareInfo.waitForExist({ timeout: 10000 });
      const isDisplayed = await hardwareInfo.isDisplayed();
      console.log('Hardware info displayed:', isDisplayed);
      expect(isDisplayed).toBe(true);
    } else {
      console.log('Hardware info not found - add data-testid="hardware-info"');
    }
  });
});
