// YouTube Gemini Assistant - Content Script

// Wait for the YouTube page to fully load
document.addEventListener('DOMContentLoaded', initExtension);
window.addEventListener('load', initExtension);
window.addEventListener('yt-navigate-finish', initExtension); // YouTube specific navigation event

// Initialize when URL changes (for YouTube's SPA behavior)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    initExtension();
  }
  
  // Also check if we're on a watch page and the button doesn't exist yet
  if (window.location.pathname.includes('/watch') && !document.getElementById('gemini-button')) {
    checkAndAddButton();
  }
});

// Observe DOM changes more aggressively
observer.observe(document, { subtree: true, childList: true });

// Add a periodic check for the button on video pages
setInterval(() => {
  if (window.location.pathname.includes('/watch') && !document.getElementById('gemini-button')) {
    checkAndAddButton();
  }
}, 2000);

// Main initialization function
function initExtension() {
  // Only run on video pages
  if (!window.location.pathname.includes('/watch')) return;
  
  // Add a small delay to ensure YouTube's UI is fully loaded
  setTimeout(checkAndAddButton, 1500);
}

// Check if our button exists and add it if not
function checkAndAddButton() {
  // If button already exists, do nothing
  if (document.getElementById('gemini-button')) return;
  
  // Try different possible selectors for the like button container
  // YouTube often changes its DOM structure, so we need to be adaptable
  const possibleSelectors = [
    'ytd-segmented-like-dislike-button-renderer', // Original selector
    '#top-level-buttons-computed', // Alternative container
    '#menu-container ytd-toggle-button-renderer', // Another possible location
    'ytd-menu-renderer #top-level-buttons-computed', // More specific path
    '#actions-inner #top-level-buttons-computed', // Modern YouTube layout
    '#actions #segmented-like-button' // Newest YouTube layout (2025)
  ];
  
  let likeButton = null;
  
  // Try each selector until we find one that works
  for (const selector of possibleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      likeButton = element;
      console.log('YouTube Gemini Assistant: Found like button with selector:', selector);
      break;
    }
  }
  
  if (!likeButton) {
    // If we can't find the like button yet, we'll retry next interval
    console.log('YouTube Gemini Assistant: Like button not found, will retry later');
    return;
  }
  
  // Create our Gemini button
  const geminiButton = document.createElement('button');
  geminiButton.id = 'gemini-button';
  geminiButton.className = 'gemini-button';
  geminiButton.innerHTML = `
    <span class="gemini-icon">G</span>
    <span class="gemini-tooltip">Open with Gemini</span>
  `;
  
  // Add click event to open Gemini in a new tab
  geminiButton.addEventListener('click', openGeminiInNewTab);
  
  // Insert our button after the like/dislike button container
  try {
    // First try to append to the parent if it's a buttons container
    likeButton.parentNode.appendChild(geminiButton);
  } catch (e) {
    try {
      // If that fails, try inserting after the like button
      likeButton.parentNode.insertBefore(geminiButton, likeButton.nextSibling);
    } catch (e) {
      // Last resort, just append to the like button itself
      likeButton.appendChild(geminiButton);
    }
  }
  
  console.log('YouTube Gemini Assistant: Successfully added button');
}

// Function to open Gemini in a new tab and copy text
function openGeminiInNewTab() {
  const videoUrl = window.location.href;
  const textToCopy = `Summarize and write the keypoints to learn and remember from the following video ${videoUrl}`;

  navigator.clipboard.writeText(textToCopy).then(() => {
    console.log('YouTube Gemini Assistant: Text copied to clipboard!');
    // Open Gemini in a new tab after successful copy
    window.open('https://gemini.google.com/app', '_blank');
  }).catch(err => {
    console.error('YouTube Gemini Assistant: Failed to copy text: ', err);
    // Still open Gemini in a new tab even if copy fails
    window.open('https://gemini.google.com/app', '_blank');
  });
}