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
  
  // Check for thumbnails on non-watch pages
  if (!window.location.pathname.includes('/watch')) {
    checkAndAddThumbnailButtons();
  }
});

// Observe DOM changes more aggressively
observer.observe(document, { subtree: true, childList: true });

// Add a periodic check for the button on video pages
setInterval(() => {
  if (window.location.pathname.includes('/watch') && !document.getElementById('gemini-button')) {
    checkAndAddButton();
  }
  // Also check for thumbnail buttons on non-watch pages
  if (!window.location.pathname.includes('/watch')) {
    checkAndAddThumbnailButtons();
  }
}, 2000);

// Main initialization function
function initExtension() {
  // Check if we're on a video page or other YouTube pages
  if (window.location.pathname.includes('/watch')) {
    // Add a small delay to ensure YouTube's UI is fully loaded
    setTimeout(checkAndAddButton, 1500);
  } else {
    // We're on home, search, channel, or other pages with thumbnails
    setTimeout(checkAndAddThumbnailButtons, 1500);
  }
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

// Function to send a message to the background script to open Gemini and paste the prompt
function openGeminiInNewTab() {
  const videoUrl = window.location.href;
  const textToCopy = `Summarize and write the keypoints to learn and remember from the following video ${videoUrl}`;

  chrome.runtime.sendMessage({ action: "openGeminiAndPaste", prompt: textToCopy }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('YouTube Gemini Assistant: Error sending message to background script:', chrome.runtime.lastError.message);
      // Fallback or error handling if needed, e.g., revert to old behavior or notify user
      // For now, just log it.
      // As a simple fallback, we can try the old method:
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('YouTube Gemini Assistant: Text copied to clipboard (fallback)!');
        window.open('https://gemini.google.com/app', '_blank');
      }).catch(err => {
        console.error('YouTube Gemini Assistant: Failed to copy text (fallback): ', err);
        window.open('https://gemini.google.com/app', '_blank'); // Still try to open Gemini
      });
    } else {
      console.log('YouTube Gemini Assistant: Message sent to background script.');
      // response object might be useful if your background script sends one
    }
  });
}

// Function to check and add buttons to video thumbnails on YouTube's main pages
function checkAndAddThumbnailButtons() {
  // Selectors for different types of video renderers on YouTube
  const thumbnailSelectors = [
    'ytd-rich-item-renderer',      // Home page, search results (grid view)
    'ytd-video-renderer',           // Search results (list view), channel videos
    'ytd-grid-video-renderer',     // Channel page grid view
    'ytd-compact-video-renderer'   // Sidebar recommendations, playlist items
  ];
  
  thumbnailSelectors.forEach(selector => {
    const thumbnails = document.querySelectorAll(selector);
    
    thumbnails.forEach(thumbnail => {
      // Skip if we've already added a button to this thumbnail
      if (thumbnail.hasAttribute('data-gemini-button-added')) {
        return;
      }
      
      // Find the video link to extract the URL
      const videoLink = thumbnail.querySelector('a#thumbnail, a#video-title, a.yt-simple-endpoint, a.yt-lockup-view-model__content-image, a.yt-lockup-metadata-view-model__title');
      
      if (!videoLink) {
        console.log('YouTube Gemini Assistant: No video link found in', selector);
        return; // No video link found, skip this thumbnail
      }
      
      // Extract video URL
      let videoUrl = videoLink.href;
      
      // Skip if this is not a valid video URL
      if (!videoUrl || !videoUrl.includes('/watch?v=')) {
        return;
      }
      
      // Convert relative URL to absolute if needed
      if (videoUrl.startsWith('/')) {
        videoUrl = 'https://www.youtube.com' + videoUrl;
      }
      
      // Find the three-dot menu button to insert our button next to it
      let menuButton = null;
      
      // Try different locations based on the thumbnail type
      if (selector === 'ytd-rich-item-renderer') {
        // New YouTube layout - find the menu button container
        menuButton = thumbnail.querySelector('.yt-lockup-metadata-view-model__menu-button, button-view-model');
        // Fallback to older layouts
        if (!menuButton) {
          menuButton = thumbnail.querySelector('#menu, ytd-menu-renderer');
        }
      } else if (selector === 'ytd-video-renderer') {
        menuButton = thumbnail.querySelector('#menu, ytd-menu-renderer, #menu-container');
      } else if (selector === 'ytd-grid-video-renderer') {
        menuButton = thumbnail.querySelector('#menu, ytd-menu-renderer');
      } else if (selector === 'ytd-compact-video-renderer') {
        menuButton = thumbnail.querySelector('#menu, ytd-menu-renderer');
      }
      
      if (!menuButton) {
        console.log('YouTube Gemini Assistant: Could not find menu button for', selector);
        return; // Couldn't find the menu button
      }
      
      // Create the Gemini button for thumbnails (icon only)
      const geminiThumbnailButton = document.createElement('button');
      geminiThumbnailButton.className = 'gemini-thumbnail-button';
      geminiThumbnailButton.setAttribute('aria-label', 'Ask Gemini about this video');
      geminiThumbnailButton.setAttribute('title', 'Ask Gemini');
      geminiThumbnailButton.innerHTML = `
        <span class="gemini-thumbnail-icon">G</span>
      `;
      
      // Add click event
      geminiThumbnailButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openGeminiWithThumbnailUrl(videoUrl);
      });
      
      // Insert the button BEFORE the menu button (so it appears to the left)
      try {
        menuButton.parentNode.insertBefore(geminiThumbnailButton, menuButton);
        console.log('YouTube Gemini Assistant: Added thumbnail button for', videoUrl);
      } catch (error) {
        console.error('YouTube Gemini Assistant: Error inserting button:', error);
        return;
      }
      
      // Mark this thumbnail as processed
      thumbnail.setAttribute('data-gemini-button-added', 'true');
    });
  });
}

// Function to open Gemini with a video URL from a thumbnail
function openGeminiWithThumbnailUrl(videoUrl) {
  const textToCopy = `tell me everything there is to take out from this video in a short and concise summary ${videoUrl}`;

  chrome.runtime.sendMessage({ action: "openGeminiAndPaste", prompt: textToCopy }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('YouTube Gemini Assistant: Error sending message to background script:', chrome.runtime.lastError.message);
      // Fallback
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('YouTube Gemini Assistant: Text copied to clipboard (fallback)!');
        window.open('https://gemini.google.com/app', '_blank');
      }).catch(err => {
        console.error('YouTube Gemini Assistant: Failed to copy text (fallback): ', err);
        window.open('https://gemini.google.com/app', '_blank');
      });
    } else {
      console.log('YouTube Gemini Assistant: Message sent to background script for thumbnail.');
    }
  });
}