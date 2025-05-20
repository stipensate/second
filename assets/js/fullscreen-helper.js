// Helper functions to better control fullscreen mode and hide cursor
function preventFullscreenExit() {
  // Create a barrier div covering the top of the screen
  const topBarrier = document.createElement('div');
  topBarrier.className = 'top-barrier';
  topBarrier.style.position = 'fixed';
  topBarrier.style.top = '-10px';
  topBarrier.style.left = '0';
  topBarrier.style.width = '100%';
  topBarrier.style.height = '200px';
  topBarrier.style.backgroundColor = 'transparent';
  topBarrier.style.zIndex = '2147483647';
  topBarrier.style.pointerEvents = 'auto';
  
  // Create another div that visually covers browser control area
  const fakeHeader = document.createElement('div');
  fakeHeader.className = 'fake-header';
  fakeHeader.style.position = 'fixed';
  fakeHeader.style.top = '0';
  fakeHeader.style.left = '0';
  fakeHeader.style.width = '100%';
  fakeHeader.style.height = '150px';
  fakeHeader.style.backgroundColor = '#000';
  fakeHeader.style.zIndex = '2147483646';
  
  // Create an extremely aggressive top barrier specifically for the browser close button
  const closeButtonBlocker = document.createElement('div');
  closeButtonBlocker.className = 'close-button-blocker';
  closeButtonBlocker.style.position = 'fixed';
  closeButtonBlocker.style.top = '-50px';  
  closeButtonBlocker.style.right = '0';
  closeButtonBlocker.style.width = '100px';
  closeButtonBlocker.style.height = '150px';
  closeButtonBlocker.style.backgroundColor = 'transparent';
  closeButtonBlocker.style.zIndex = '2147483647';
  closeButtonBlocker.style.pointerEvents = 'auto';
  
  // Barrier specifically for the window controls (minimize, maximize, close)
  const windowControlsBlocker = document.createElement('div');
  windowControlsBlocker.className = 'window-controls-blocker';
  windowControlsBlocker.style.position = 'fixed';
  windowControlsBlocker.style.top = '0';
  windowControlsBlocker.style.right = '0';
  windowControlsBlocker.style.width = '200px';
  windowControlsBlocker.style.height = '50px';
  windowControlsBlocker.style.backgroundColor = 'transparent';
  windowControlsBlocker.style.zIndex = '2147483647';
  windowControlsBlocker.style.pointerEvents = 'auto';
  
  // Add elements to the body if they don't exist yet
  if (!document.querySelector('.top-barrier')) {
    document.body.appendChild(topBarrier);
  }
  
  if (!document.querySelector('.fake-header')) {
    document.body.appendChild(fakeHeader);
  }
  
  if (!document.querySelector('.close-button-blocker')) {
    document.body.appendChild(closeButtonBlocker);
  }
  
  if (!document.querySelector('.window-controls-blocker')) {
    document.body.appendChild(windowControlsBlocker);
  }
  
  // Add event listeners to the barriers
  topBarrier.addEventListener('mouseenter', forceFullscreenOnBarrierHover);
  topBarrier.addEventListener('mousemove', forceFullscreenOnBarrierHover);
  closeButtonBlocker.addEventListener('mouseenter', forceFullscreenOnBarrierHover);
  closeButtonBlocker.addEventListener('mousemove', forceFullscreenOnBarrierHover);
  windowControlsBlocker.addEventListener('mouseenter', forceFullscreenOnBarrierHover);
  windowControlsBlocker.addEventListener('mousemove', forceFullscreenOnBarrierHover);
  
  // Only add cursor hiding styles when in fullscreen mode
  const style = document.createElement('style');
  style.innerHTML = `
    /* Only hide cursor when in fullscreen mode */
    .fullscreen-active * {
      cursor: none !important;
    }
    
    .fullscreen-active html, 
    .fullscreen-active body {
      cursor: none !important;
    }
    
    /* Ensure that hover states don't change cursor */
    .fullscreen-active *:hover {
      cursor: none !important;
    }
    
    /* Also handle all standard cursor styles */
    .fullscreen-active .pointer, 
    .fullscreen-active [style*="cursor: pointer"], 
    .fullscreen-active [style*="cursor:pointer"] {
      cursor: none !important;
    }
    
    .fullscreen-active .default, 
    .fullscreen-active [style*="cursor: default"], 
    .fullscreen-active [style*="cursor:default"] {
      cursor: none !important;
    }
    
    .fullscreen-active .text, 
    .fullscreen-active [style*="cursor: text"], 
    .fullscreen-active [style*="cursor:text"] {
      cursor: none !important;
    }
    
    /* Ensure that even newly added elements get the cursor: none property */
    @keyframes disableCursorForNewElements {
      from { cursor: none !important; }
      to { cursor: none !important; }
    }
    
    .fullscreen-active * {
      animation: disableCursorForNewElements 0.001s forwards;
    }
  `;
  
  if (!document.querySelector('style#cursor-hider')) {
    style.id = 'cursor-hider';
    document.head.appendChild(style);
  }
  
  // Only hide cursor if in fullscreen mode, otherwise show normal cursor
  if (isInFullscreen()) {
    hideCursorOnAllElements();
    document.body.classList.add('fullscreen-active');
  } else {
    showCursorOnAllElements();
    document.body.classList.remove('fullscreen-active');
  }
}

// Function to hide cursor on all elements
function hideCursorOnAllElements() {
  const allElements = document.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    allElements[i].style.cursor = 'none';
  }
  
  // Also hide on the root elements
  document.documentElement.style.cursor = 'none';
  document.body.style.cursor = 'none';
}

// Function to show cursor on all elements
function showCursorOnAllElements() {
  const allElements = document.getElementsByTagName('*');
  for (let i = 0; i < allElements.length; i++) {
    allElements[i].style.cursor = '';
  }
  
  // Also show on the root elements
  document.documentElement.style.cursor = '';
  document.body.style.cursor = '';
}

// Function to check if in fullscreen mode
function isInFullscreen() {
  return document.fullscreenElement || 
         document.webkitFullscreenElement || 
         document.mozFullScreenElement || 
         document.msFullscreenElement;
}

// Function to force fullscreen on barrier hover
function forceFullscreenOnBarrierHover(e) {
  // Prevent default actions
  e.preventDefault();
  e.stopPropagation();
  
  // Force fullscreen again
  forceFullscreen();
  
  // Prevent propagation
  return false;
}

// Function to force entering fullscreen mode
function forceFullscreen() {
  const elem = document.documentElement;
  
  try {
    if (elem.requestFullscreen) {
      elem.requestFullscreen({navigationUI: 'hide'});
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen({navigationUI: 'hide'});
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen({navigationUI: 'hide'});
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen({navigationUI: 'hide'});
    }
    
    // Hide cursor AFTER entering fullscreen
    setTimeout(() => {
      document.body.classList.add('fullscreen-active');
      hideCursorOnAllElements();
    }, 100);
    
    // Also try to lock the pointer if possible (for additional cursor hiding)
    tryPointerLock();
  } catch(err) {
    // Some browsers may not support all options
    console.error('Error attempting fullscreen:', err);
    
    // Try the basic version without options as fallback
    try {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } catch(e) {
      // Ignore if this also fails
    }
  }
}

// Function to attempt to lock the pointer
function tryPointerLock() {
  const elem = document.documentElement;
  
  try {
    if (elem.requestPointerLock) {
      elem.requestPointerLock();
    } else if (elem.mozRequestPointerLock) {
      elem.mozRequestPointerLock();
    } else if (elem.webkitRequestPointerLock) {
      elem.webkitRequestPointerLock();
    }
  } catch(err) {
    // Some browsers may not allow this
    console.error('Error attempting pointer lock:', err);
  }
}

// Handle mouse movement near the top of the screen
function setupMouseTracking() {
  document.addEventListener('mousemove', function(e) {
    // If in fullscreen mode and mouse is getting close to the top or corners, force fullscreen again
    if (isInFullscreen() && 
        (e.clientY < 150 || 
        (e.clientY < 50 && e.clientX > window.innerWidth - 200) || // top right corner
        (e.clientY < 50 && e.clientX < 200))) {  // top left corner
      
      try {
        // Try to block the event from reaching browser UI
        e.preventDefault();
        e.stopPropagation();
        
        // Force fullscreen again
        forceFullscreen();
        
        // Ensure cursor remains hidden in fullscreen
        document.body.classList.add('fullscreen-active');
        hideCursorOnAllElements();
      } catch(err) {
        // Some browsers may not allow this
      }
    }
  });
    // Also track mouse button events
  document.addEventListener('mousedown', function(e) {
    // If in fullscreen mode and mouse click is near the top, prevent it
    if (isInFullscreen() && e.clientY < 150) {
      e.preventDefault();
      e.stopPropagation();
      forceFullscreen();
      return false;
    }
  });
}

// Prevent Escape key from exiting fullscreen
function preventEscapeKey() {
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      e.preventDefault();
      e.stopPropagation();
      
      // Force fullscreen again after a short delay
      setTimeout(forceFullscreen, 100);
      return false;
    }
    
    // Also handle F11 which can toggle fullscreen
    if (e.key === 'F11' || e.keyCode === 122) {
      e.preventDefault();
      e.stopPropagation();
      
      // Force our own fullscreen
      forceFullscreen();
      return false;
    }
  }, true);
}

// Set up event listeners to re-enter fullscreen if exited
function setupFullscreenChangeListeners() {
  // Standard fullscreen change event
  document.addEventListener('fullscreenchange', function() {
    if (!document.fullscreenElement) {
      // Try to re-enter fullscreen immediately
      setTimeout(forceFullscreen, 100);
    } else {
      // Make sure cursor is hidden when in fullscreen
      hideCursorOnAllElements();
      document.body.classList.add('fullscreen-active');
    }
  });
  
  // Handle browser-specific prefixes for fullscreen
  document.addEventListener('webkitfullscreenchange', function() {
    if (!document.webkitFullscreenElement) {
      setTimeout(forceFullscreen, 100);
    } else {
      hideCursorOnAllElements();
      document.body.classList.add('fullscreen-active');
    }
  });
  
  document.addEventListener('mozfullscreenchange', function() {
    if (!document.mozFullScreenElement) {
      setTimeout(forceFullscreen, 100);
    } else {
      hideCursorOnAllElements();
      document.body.classList.add('fullscreen-active');
    }
  });
  
  document.addEventListener('MSFullscreenChange', function() {
    if (!document.msFullscreenElement) {
      setTimeout(forceFullscreen, 100);
    } else {
      hideCursorOnAllElements();
      document.body.classList.add('fullscreen-active');
    }
  });
}

// Call this function to set up the fullscreen protection
function setupFullscreenProtection() {
  // Initial setup - Don't force fullscreen right away, let user see cursor first
  preventFullscreenExit();
  setupMouseTracking();
  preventEscapeKey();
  setupFullscreenChangeListeners();
  
  // Show cursor initially - ensure cursor is visible on page load
  showCursorOnAllElements();
  document.body.classList.remove('fullscreen-active');
  
  // Add an additional check every 500ms to ensure protection stays active 
  setInterval(function() {
    preventFullscreenExit();
    
    // Only hide cursor if in fullscreen mode
    if (isInFullscreen()) {
      hideCursorOnAllElements();
      document.body.classList.add('fullscreen-active');
    } else {
      // Show cursor when not in fullscreen
      showCursorOnAllElements();
      document.body.classList.remove('fullscreen-active');
    }
    
    // Check if we're in fullscreen, if not, don't force it automatically
    // Let user decide when to go fullscreen via click
  }, 500);
  
  // Do NOT force fullscreen on initial load - we want to show cursor first
  // User needs to click to enter fullscreen
}

// Monitor document changes to ensure our cursor hiding is applied to new elements
function setupMutationObserver() {
  // Create an observer instance
  const observer = new MutationObserver(function(mutations) {
    // Process any newly added nodes for cursor hiding
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        hideCursorOnAllElements();
      }
    });
  });
  
  // Start observing the document with the configured parameters
  observer.observe(document.documentElement, { 
    childList: true, 
    subtree: true 
  });
}

// Auto-run on load
document.addEventListener('DOMContentLoaded', function() {
  setupFullscreenProtection();
  setupMutationObserver();
  
  // Ensure cursor is visible initially - crucial for initial page load
  showCursorOnAllElements();
  document.body.classList.remove('fullscreen-active');
});

// Track click events but don't immediately force fullscreen on every click
// Let the user be in control of when to enter fullscreen
document.addEventListener('click', function(e) {
  // Only force fullscreen on first click or when clicking specific elements
  // This gives user control over when to enter fullscreen
  if (!isInFullscreen()) {
    forceFullscreen();
    // Cursor will be hidden by the forceFullscreen function
  }
});

// Run on first interaction (which is often required for fullscreen)
document.addEventListener('mousedown', function() {
  // Don't force fullscreen immediately on first interaction
  // Let the user decide when to enter fullscreen via click
}, { once: true });

// Run when the tab gets focus - check if we're already in fullscreen and hide cursor if so
window.addEventListener('focus', function() {
  if (isInFullscreen()) {
    // Ensure cursor remains hidden if we're in fullscreen
    document.body.classList.add('fullscreen-active');
    hideCursorOnAllElements();
  } else {
    // Show cursor if not in fullscreen
    document.body.classList.remove('fullscreen-active');
    showCursorOnAllElements();
  }
});


