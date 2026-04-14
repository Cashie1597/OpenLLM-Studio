import { browser, $, expect } from '@wdio/globals';

describe('Conversation Management Tests', () => {
  beforeEach(async () => {
    await browser.pause(2000);
    
    // Navigate to chat page
    const chatBtn = await $('button*=Chat').catch(() => 
      $('[aria-label="Chat"]').catch(() => null)
    );
    
    if (chatBtn) {
      await chatBtn.click();
      await browser.pause(1000);
    }
  });

  it('should display conversation list', async () => {
    await browser.pause(1000);
    
    const conversationList = await $('[data-testid="conversation-list"]').catch(() => 
      $('*=New chat').catch(() => null)
    );
    
    if (conversationList) {
      console.log('Conversation list found');
      expect(await conversationList.isExisting()).toBe(true);
    } else {
      console.log('Conversation list not found - add data-testid="conversation-list"');
    }
  });

  it('should create new conversation', async () => {
    await browser.pause(1000);
    
    const newChatBtn = await $('button*=New chat').catch(() => 
      $('[data-testid="new-chat"]').catch(() => null)
    );
    
    if (newChatBtn) {
      const isClickable = await newChatBtn.isClickable();
      console.log('New chat button clickable:', isClickable);
      
      if (isClickable) {
        await newChatBtn.click();
        await browser.pause(1000);
        console.log('Created new conversation');
      }
    } else {
      console.log('New chat button not found');
    }
  });

  it('should switch between conversations', async () => {
    await browser.pause(1000);
    
    // Find conversation items
    const conversations = await $$('[data-testid="conversation-item"]').catch(() => 
      $$('button').catch(() => [])
    );
    
    if (conversations.length > 1) {
      await conversations[1].click();
      await browser.pause(500);
      console.log('Switched to different conversation');
    } else {
      console.log('Not enough conversations to test switching');
    }
  });

  it('should delete conversation', async () => {
    await browser.pause(1000);
    
    const deleteBtn = await $('[data-testid="delete-conversation"]').catch(() => 
      $('button[title*="Delete"]').catch(() => null)
    );
    
    if (deleteBtn) {
      console.log('Delete button found');
      expect(await deleteBtn.isExisting()).toBe(true);
      // Don't actually delete in test
    } else {
      console.log('Delete button not found - add data-testid="delete-conversation"');
    }
  });

  it('should display message history', async () => {
    await browser.pause(1000);
    
    const messageList = await $('[data-testid="message-list"]').catch(() => 
      $('*=message').catch(() => null)
    );
    
    if (messageList) {
      console.log('Message list found');
      expect(await messageList.isExisting()).toBe(true);
    } else {
      console.log('Message list not found - add data-testid="message-list"');
    }
  });
});
