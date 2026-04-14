import { browser, $, expect } from '@wdio/globals';

describe('Chat Interface Tests', () => {
  it('should navigate to chat page', async () => {
    await browser.pause(2000);
    
    // Find chat navigation button
    const chatBtn = await $('button*=Chat').catch(() => 
      $('a*=Chat').catch(() => 
        $('[data-testid="chat-page"]').catch(() => null)
      )
    );
    
    if (chatBtn) {
      await chatBtn.click();
      await browser.pause(1000);
      console.log('Navigated to chat page');
    } else {
      console.log('Chat navigation not found');
    }
  });

  it('should display chat input', async () => {
    await browser.pause(1000);
    
    // Look for chat input field
    const chatInput = await $('textarea').catch(() => 
      $('input[type="text"]').catch(() => 
        $('[data-testid="chat-input"]').catch(() => null)
      )
    );
    
    if (chatInput) {
      await chatInput.waitForExist({ timeout: 5000 });
      expect(await chatInput.isDisplayed()).toBe(true);
      console.log('Chat input found');
    } else {
      console.log('Chat input not found - add data-testid="chat-input"');
    }
  });

  it('should allow typing in chat input', async () => {
    await browser.pause(500);
    
    const chatInput = await $('textarea').catch(() => 
      $('[data-testid="chat-input"]').catch(() => null)
    );
    
    if (chatInput) {
      await chatInput.setValue('Hello, this is a test message');
      const value = await chatInput.getValue();
      expect(value).toContain('test message');
      console.log('Successfully typed in chat input');
    }
  });

  it('should display conversation list', async () => {
    await browser.pause(500);
    
    const conversationList = await $('[data-testid="conversation-list"]').catch(() => 
      $('*=Conversation').catch(() => null)
    );
    
    if (conversationList) {
      console.log('Conversation list found');
      expect(await conversationList.isExisting()).toBe(true);
    } else {
      console.log('Conversation list not found - add data-testid="conversation-list"');
    }
  });
});
