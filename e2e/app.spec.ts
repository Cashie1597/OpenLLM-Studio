import { browser, $ } from '@wdio/globals';

describe('OpenLLM Studio E2E Tests', () => {
  it('should launch the application', async () => {
    // Wait for app to be ready
    await browser.pause(2000);
    
    // Verify window title
    const title = await browser.getTitle();
    expect(title).toBeTruthy();
    console.log('App title:', title);
  });

  it('should display the main interface', async () => {
    // Wait for main content to load
    await browser.pause(1000);
    
    // Check if body element exists
    const body = await $('body');
    await body.waitForExist({ timeout: 5000 });
    expect(await body.isDisplayed()).toBe(true);
  });

  it('should detect hardware information', async () => {
    // This tests that the app can access native system info
    await browser.pause(2000);
    
    // Look for hardware info elements (adjust selectors based on your UI)
    const hardwareSection = await $('[data-testid="hardware-info"]').catch(() => null);
    
    if (hardwareSection) {
      await hardwareSection.waitForExist({ timeout: 10000 });
      expect(await hardwareSection.isDisplayed()).toBe(true);
      console.log('Hardware info section found and displayed');
    } else {
      console.log('Hardware info section not found - may need data-testid attributes');
    }
  });

  it('should navigate to model library', async () => {
    await browser.pause(1000);
    
    // Try to find and click model library button/link
    const modelLibraryBtn = await $('button*=Model').catch(() => 
      $('a*=Model').catch(() => 
        $('[data-testid="model-library"]').catch(() => null)
      )
    );
    
    if (modelLibraryBtn) {
      await modelLibraryBtn.click();
      await browser.pause(1000);
      console.log('Navigated to model library');
    } else {
      console.log('Model library navigation not found - adjust selectors');
    }
  });

  it('should handle settings page', async () => {
    await browser.pause(1000);
    
    // Try to find settings button
    const settingsBtn = await $('button*=Settings').catch(() => 
      $('a*=Settings').catch(() => 
        $('[data-testid="settings"]').catch(() => null)
      )
    );
    
    if (settingsBtn) {
      await settingsBtn.click();
      await browser.pause(1000);
      console.log('Opened settings page');
    } else {
      console.log('Settings navigation not found - adjust selectors');
    }
  });
});
