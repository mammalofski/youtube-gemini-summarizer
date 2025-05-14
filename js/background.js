// js/background.js

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
