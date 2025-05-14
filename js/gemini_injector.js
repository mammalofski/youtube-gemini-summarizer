// js/gemini_injector.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "pasteAndSubmit") {
    const promptText = request.prompt;
    pasteAndSubmit(promptText);
    return true;
  }
});

function pasteAndSubmit(prompt) {
  // Function to find the rich-textarea and the submit button
  const findElements = () => {
    const richTextArea = document.querySelector('rich-textarea div[contenteditable="true"]');
    // Attempt to find the submit button. This selector might need adjustment
    // if Gemini's UI changes. We look for a button that might contain an send icon.
    let submitButton = document.querySelector('button[aria-label*="Send"], button[aria-label*="Submit"], button:has(span.material-symbols-common.send)');
    
    // More generic selectors if the specific ones fail
    if (!submitButton) {
        const buttons = document.querySelectorAll('button');
        for (let btn of buttons) {
            // Check for common keywords in aria-label or inner text
            const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase();
            const textContent = btn.textContent?.toLowerCase();
            if ((ariaLabel && (ariaLabel.includes('send') || ariaLabel.includes('submit'))) ||
                (textContent && (textContent.includes('send') || textContent.includes('submit')))) {
                submitButton = btn;
                break;
            }
        }
    }
     // Last resort, try to find a button with a send icon path if available
    if (!submitButton) {
        submitButton = document.querySelector('button path[d*="M2.01"]'); // Common path for send icons
        if (submitButton) submitButton = submitButton.closest('button');
    }


    return { richTextArea, submitButton };
  };

  // Try to find elements immediately
  let { richTextArea, submitButton } = findElements();

  // If elements are not found immediately, use a MutationObserver to wait for them
  if (!richTextArea || !submitButton) {
    const observer = new MutationObserver((mutationsList, obs) => {
      const result = findElements();
      richTextArea = result.richTextArea;
      submitButton = result.submitButton;

      if (richTextArea && submitButton) {
        obs.disconnect(); // Stop observing once elements are found
        performActions(richTextArea, submitButton, prompt);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    performActions(richTextArea, submitButton, prompt);
  }
}

function performActions(richTextArea, submitButton, prompt) {
  if (richTextArea) {
    // It's a contenteditable div, so we set its innerText or textContent
    richTextArea.focus();
    document.execCommand('insertText', false, prompt); // More robust way to insert text

    // Slight delay to ensure the UI updates after pasting
    setTimeout(() => {
      if (submitButton) {
        submitButton.click();
        console.log('Gemini Injector: Prompt pasted and submitted.');
      } else {
        console.error('Gemini Injector: Submit button not found after pasting.');
        // Fallback: try to simulate Enter key on the textarea
        const enterEvent = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true
        });
        richTextArea.dispatchEvent(enterEvent);
        console.log('Gemini Injector: Attempted to submit with Enter key.');
      }
    }, 200); // 200ms delay
  } else {
    console.error('Gemini Injector: rich-textarea not found.');
  }
}
