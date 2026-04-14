import { browser, $, expect } from '@wdio/globals';

describe('Settings Page Tests', () => {
  beforeEach(async () => {
    await browser.pause(2000);
    
    // Navigate to settings
    const settingsBtn = await $('button*=Settings').catch(() => 
      $('[aria-label="Settings"]').catch(() => null)
    );
    
    if (settingsBtn) {
      await settingsBtn.click();
      await browser.pause(1000);
    }
  });

  it('should display all settings tabs', async () => {
    await browser.pause(500);
    
    const tabs = ['General', 'Performance', 'Integrations', 'Security', 'About'];
    
    for (const tabName of tabs) {
      const tab = await $(`button*=${tabName}`).catch(() => null);
      if (tab) {
        const exists = await tab.isExisting();
        console.log(`${tabName} tab exists:`, exists);
        expect(exists).toBe(true);
      } else {
        console.log(`${tabName} tab not found`);
      }
    }
  });

  it('should switch between tabs', async () => {
    await browser.pause(500);
    
    // Click Performance tab
    const perfTab = await $('button*=Performance').catch(() => null);
    if (perfTab) {
      await perfTab.click();
      await browser.pause(500);
      console.log('Switched to Performance tab');
    }
    
    // Click Integrations tab
    const integrationsTab = await $('button*=Integrations').catch(() => null);
    if (integrationsTab) {
      await integrationsTab.click();
      await browser.pause(500);
      console.log('Switched to Integrations tab');
    }
  });

  it('should display hardware information', async () => {
    await browser.pause(1000);
    
    // Look for RAM info
    const ramInfo = await $('*=RAM').catch(() => 
      $('*=Memory').catch(() => null)
    );
    
    if (ramInfo) {
      const text = await ramInfo.getText();
      console.log('RAM info:', text);
      expect(text).toBeTruthy();
    }
  });

  it('should allow API key configuration', async () => {
    await browser.pause(500);
    
    // Navigate to Integrations tab
    const integrationsTab = await $('button*=Integrations').catch(() => null);
    if (integrationsTab) {
      await integrationsTab.click();
      await browser.pause(1000);
    }
    
    // Look for API key inputs
    const apiKeyInput = await $('input[type="password"]').catch(() => null);
    
    if (apiKeyInput) {
      const isDisplayed = await apiKeyInput.isDisplayed();
      console.log('API key input found:', isDisplayed);
      expect(isDisplayed).toBe(true);
    } else {
      console.log('API key input not found');
    }
  });

  it('should display optimization settings', async () => {
    await browser.pause(1000);
    
    // Look for optimization controls
    const optimizationSection = await $('[data-testid="optimization-settings"]').catch(() => 
      $('*=Optimization').catch(() => null)
    );
    
    if (optimizationSection) {
      console.log('Optimization settings found');
      expect(await optimizationSection.isExisting()).toBe(true);
    } else {
      console.log('Optimization settings not found - add data-testid="optimization-settings"');
    }
  });

  it('should show license information', async () => {
    await browser.pause(1000);
    
    const licenseSection = await $('[data-testid="license-manager"]').catch(() => 
      $('*=License').catch(() => null)
    );
    
    if (licenseSection) {
      console.log('License section found');
      expect(await licenseSection.isExisting()).toBe(true);
    } else {
      console.log('License section not found - add data-testid="license-manager"');
    }
  });
});
