// JobTracker Pro - Background Service Worker

console.log('JobTracker Pro: Background service worker initialized');

// Listen for auth messages from web pages (localhost or Vercel)
chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
  console.log('🧪 JobTracker Pro: Received external message:', request);
  console.log('🧪 From sender:', sender);
  
  if (request.type === 'TEST') {
    console.log('✅ Test message received in background!');
    sendResponse({ success: true, message: 'Background received your test!' });
    return true;
  }
  
  if (request.type === 'SAVE_AUTH') {
    // Save auth token to chrome.storage
    chrome.storage.local.set({
      supabase_token: request.token,
      user_id: request.userId
    }, () => {
      console.log('✅ Auth saved to chrome.storage from', sender.url);
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('JobTracker Pro: Received message:', request);
  
  if (request.action === 'saveJob') {
    console.log('JobTracker Pro: Saving job:', request.jobData);
    sendResponse({ success: true });
  }
  
  return true;
});

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('JobTracker Pro: Extension installed/updated', details.reason);
  
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: 'http://localhost:3000/login'
    });
  }
});