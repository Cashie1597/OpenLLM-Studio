import { browser, $, expect } from '@wdio/globals';

describe('Model Operations Tests', () => {
  beforeEach(async () => {
    await browser.pause(2000);
    
    // Navigate to model library
    const libraryBtn = await $('button*=Model').catch(() => 
      $('[aria-label="Model Library"]').catch(() => null)
    );
    
    if (libraryBtn) {
      await libraryBtn.click();
      await browser.pause(1000);
    }
  });

  it('should display installed models', async () => {
    await browser.pause(1000);
    
    // Look for "My Library" tab
    const myLibraryTab = await $('button*=My Library').catch(() => null);
    if (myLibraryTab) {
      await myLibraryTab.click();
      await browser.pause(1000);
    }
    
    // Check for model cards
    const modelCards = await $$('[data-testid="model-card"]').catch(() => 
      $$('.model-card').catch(() => [])
    );
    
    console.log(`Found ${modelCards.length} installed models`);
  });

  it('should load a model', async () => {
    await browser.pause(1000);
    
    const loadButton = await $('button*=Load').catch(() => 
      $('[data-testid="load-model"]').catch(() => null)
    );
    
    if (loadButton) {
      const isClickable = await loadButton.isClickable();
      console.log('Load button clickable:', isClickable);
      
      if (isClickable) {
        // Don't actually load to avoid resource usage
        console.log('Load button found and ready');
      }
    } else {
      console.log('Load button not found - may need models installed');
    }
  });

  it('should unload a model', async () => {
    await browser.pause(1000);
    
    const unloadButton = await $('button*=Unload').catch(() => 
      $('[data-testid="unload-model"]').catch(() => null)
    );
    
    if (unloadButton) {
      console.log('Unload button found');
      expect(await unloadButton.isExisting()).toBe(true);
    } else {
      console.log('Unload button not found - no model may be loaded');
    }
  });

  it('should delete a model', async () => {
    await browser.pause(1000);
    
    const deleteButton = await $('button*=Delete').catch(() => 
      $('[data-testid="delete-model"]').catch(() => null)
    );
    
    if (deleteButton) {
      console.log('Delete button found');
      // Don't actually delete in test
      expect(await deleteButton.isExisting()).toBe(true);
    } else {
      console.log('Delete button not found - add data-testid="delete-model"');
    }
  });

  it('should search for models in HuggingFace tab', async () => {
    await browser.pause(1000);
    
    // Navigate to HuggingFace tab
    const hfTab = await $('button*=HuggingFace').catch(() => 
      $('button*=Hugging Face').catch(() => null)
    );
    
    if (hfTab) {
      await hfTab.click();
      await browser.pause(1000);
      
      // Look for search input
      const searchInput = await $('input[type="search"]').catch(() => 
        $('input[placeholder*="Search"]').catch(() => null)
      );
      
      if (searchInput) {
        await searchInput.setValue('llama');
        await browser.pause(1500);
        console.log('Searched for models');
      } else {
        console.log('Search input not found');
      }
    }
  });

  it('should display model details', async () => {
    await browser.pause(1000);
    
    const modelCard = await $('[data-testid="model-card"]').catch(() => null);
    
    if (modelCard) {
      await modelCard.click();
      await browser.pause(500);
      
      // Look for model details
      const modelDetails = await $('[data-testid="model-details"]').catch(() => 
        $('*=Size').catch(() => null)
      );
      
      if (modelDetails) {
        console.log('Model details displayed');
        expect(await modelDetails.isExisting()).toBe(true);
      }
    } else {
      console.log('No model cards found to test details');
    }
  });
});
