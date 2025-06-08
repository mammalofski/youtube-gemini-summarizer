// js/background.js

// Handle extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  // Get current tab URL
  const currentUrl = tab.url;
  
  // Create prompt for webpage summarization
  const promptText = `summarize the following webpage and write the key points to learn and remember from reading this page: ${currentUrl}`;
  
  // Open Gemini and send the prompt
  chrome.tabs.create({ url: "https://gemini.google.com/app" }, (newTab) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
      if (tabId === newTab.id && changeInfo.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        
        chrome.scripting.executeScript({
          target: { tabId: newTab.id },
          files: ["js/gemini_injector.js"]
        }, () => {
          setTimeout(() => {
            chrome.tabs.sendMessage(newTab.id, { action: "pasteAndSubmit", prompt: promptText });
          }, 500);
        });
      }
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openGeminiAndPaste") {
    const promptText = request.prompt;

    chrome.tabs.create({ url: "https://gemini.google.com/app" }, (newTab) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
        if (tabId === newTab.id && changeInfo.status === 'complete') {
          // Remove listener to avoid multiple injections
          chrome.tabs.onUpdated.removeListener(listener);

          // Inject the script into the Gemini tab
          chrome.scripting.executeScript({
            target: { tabId: newTab.id },
            files: ["js/gemini_injector.js"]
          }, () => {
            // After injecting, send the prompt to the injected script
            // We need a slight delay to ensure the injector script's listener is ready
            setTimeout(() => {
              chrome.tabs.sendMessage(newTab.id, { action: "pasteAndSubmit", prompt: promptText });
            }, 500);
          });
        }
      });
    });
    return true; // Indicates that the response will be sent asynchronously
  }
});
