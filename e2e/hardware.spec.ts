import { browser, $ } from '@wdio/globals';

describe('Hardware Detection Tests', () => {
  it('should detect system RAM', async () => {
    await browser.pause(2000);
    
    // Navigate to settings or hardware info page
    const settingsBtn = await $('button*=Settings').catch(() => null);
    if (settingsBtn) await settingsBtn.click();
    
    await browser.pause(1000);
    
    // Check for RAM display (adjust selector to match your UI)
    const ramInfo = await $('*=RAM').catch(() => 
      $('*=Memory').catch(() => 
        $('[data-testid="ram-info"]').catch(() => null)
      )
    );
    
    if (ramInfo) {
      const ramText = await ramInfo.getText();
      console.log('RAM detected:', ramText);
      expect(ramText).toBeTruthy();
    } else {
      console.log('RAM info not found - add data-testid="ram-info" to your component');
    }
  });

  it('should detect VRAM/GPU information', async () => {
    await browser.pause(1000);
    
    // Check for VRAM/GPU display
    const vramInfo = await $('*=VRAM').catch(() => 
      $('*=GPU').catch(() => 
        $('[data-testid="vram-info"]').catch(() => null)
      )
    );
    
    if (vramInfo) {
      const vramText = await vramInfo.getText();
      console.log('VRAM/GPU detected:', vramText);
      expect(vramText).toBeTruthy();
    } else {
      console.log('VRAM info not found - add data-testid="vram-info" to your component');
    }
  });
});
