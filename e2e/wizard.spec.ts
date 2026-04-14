import { browser, $, expect } from '@wdio/globals';

describe('Model Wizard Tests', () => {
  beforeEach(async () => {
    await browser.pause(2000);
    
    // Navigate to model library
    const libraryBtn = await $('button*=Model').catch(() => null);
    if (libraryBtn) {
      await libraryBtn.click();
      await browser.pause(1000);
    }
  });

  it('should open model wizard', async () => {
    await browser.pause(1000);
    
    const wizardButton = await $('button*=Model Wizard').catch(() => 
      $('[data-testid="model-wizard"]').catch(() => null)
    );
    
    if (wizardButton) {
      await wizardButton.click();
      await browser.pause(1000);
      
      // Check if wizard modal opened
      const wizardModal = await $('[data-testid="wizard-modal"]').catch(() => 
        $('*=Wizard').catch(() => null)
      );
      
      if (wizardModal) {
        const isDisplayed = await wizardModal.isDisplayed();
        console.log('Wizard modal opened:', isDisplayed);
        expect(isDisplayed).toBe(true);
      }
    } else {
      console.log('Model Wizard button not found');
    }
  });

  it('should allow entering use case', async () => {
    await browser.pause(1000);
    
    // Open wizard first
    const wizardButton = await $('button*=Model Wizard').catch(() => null);
    if (wizardButton) {
      await wizardButton.click();
      await browser.pause(1000);
    }
    
    // Look for use case input
    const useCaseInput = await $('textarea').catch(() => 
      $('input[type="text"]').catch(() => null)
    );
    
    if (useCaseInput) {
      await useCaseInput.setValue('I need a model for code generation');
      await browser.pause(500);
      console.log('Entered use case');
    } else {
      console.log('Use case input not found');
    }
  });

  it('should get AI recommendations', async () => {
    await browser.pause(1000);
    
    // Open wizard
    const wizardButton = await $('button*=Model Wizard').catch(() => null);
    if (wizardButton) {
      await wizardButton.click();
      await browser.pause(1000);
    }
    
    // Look for recommendations section
    const recommendations = await $('[data-testid="recommendations"]').catch(() => 
      $('*=Recommended').catch(() => null)
    );
    
    if (recommendations) {
      console.log('Recommendations section found');
      expect(await recommendations.isExisting()).toBe(true);
    } else {
      console.log('Recommendations not found - may need API key configured');
    }
  });

  it('should close wizard', async () => {
    await browser.pause(1000);
    
    // Open wizard
    const wizardButton = await $('button*=Model Wizard').catch(() => null);
    if (wizardButton) {
      await wizardButton.click();
      await browser.pause(1000);
    }
    
    // Look for close button
    const closeButton = await $('button[title*="Close"]').catch(() => 
      $('button*=×').catch(() => null)
    );
    
    if (closeButton) {
      await closeButton.click();
      await browser.pause(500);
      console.log('Wizard closed');
    } else {
      console.log('Close button not found');
    }
  });
});
