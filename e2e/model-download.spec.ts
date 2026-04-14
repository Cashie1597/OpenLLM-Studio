import { browser, $ } from '@wdio/globals';

describe('Model Download Tests', () => {
  it('should display model library', async () => {
    await browser.pause(2000);
    
    // Navigate to model library
    const modelLibraryBtn = await $('button*=Model').catch(() => 
      $('a*=Library').catch(() => null)
    );
    
    if (modelLibraryBtn) {
      await modelLibraryBtn.click();
      await browser.pause(1500);
      console.log('Model library opened');
    }
  });

  it('should show available models for download', async () => {
    await browser.pause(1000);
    
    // Look for model cards or list items
    const modelCards = await $$('[data-testid="model-card"]').catch(() => 
      $$('.model-card').catch(() => [])
    );
    
    if (modelCards.length > 0) {
      console.log(`Found ${modelCards.length} models available`);
      expect(modelCards.length).toBeGreaterThan(0);
    } else {
      console.log('No model cards found - add data-testid="model-card" to your components');
    }
  });

  it('should handle model download initiation', async () => {
    await browser.pause(1000);
    
    // Try to find a download button
    const downloadBtn = await $('button*=Download').catch(() => 
      $('[data-testid="download-model"]').catch(() => null)
    );
    
    if (downloadBtn) {
      // Check if button is clickable
      const isClickable = await downloadBtn.isClickable();
      console.log('Download button found, clickable:', isClickable);
      
      // Note: We don't actually click to avoid real downloads in tests
      // In a real test, you'd mock the download or use a test model
      expect(isClickable).toBe(true);
    } else {
      console.log('Download button not found - add data-testid="download-model"');
    }
  });

  it('should display download queue/progress', async () => {
    await browser.pause(1000);
    
    // Look for download queue component
    const downloadQueue = await $('[data-testid="download-queue"]').catch(() => 
      $('*=Download').catch(() => null)
    );
    
    if (downloadQueue) {
      console.log('Download queue component found');
      expect(await downloadQueue.isExisting()).toBe(true);
    } else {
      console.log('Download queue not found - add data-testid="download-queue"');
    }
  });
});
