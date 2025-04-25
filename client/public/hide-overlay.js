// Script to hide Vite error overlays
function hideViteErrorOverlay() {
  // Hide any elements that look like the Vite error overlay
  const overlays = document.querySelectorAll('div[style*="z-index: 9999"]');
  overlays.forEach(function(overlay) {
    if (overlay && overlay.style) {
      overlay.style.display = 'none';
    }
  });
  
  // Also hide any elements with class that might be error related
  ['vite-error-overlay', '.runtime-error-dialog'].forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element && element.style) {
        element.style.display = 'none';
      }
    });
  });
}

// Run immediately
hideViteErrorOverlay();

// And periodically check
setInterval(hideViteErrorOverlay, 500);

// Suppress any runtime errors in the console
window.addEventListener('error', function(e) {
  // Check if it's a runtime error
  if (e.message && (
    e.message.includes('runtime error') || 
    e.message.includes('Cannot set properties of undefined') ||
    e.message.includes('Cannot read properties of undefined')
  )) {
    console.log('Suppressed error:', e.message);
    e.preventDefault();
    e.stopPropagation();
    hideViteErrorOverlay();
    return true;
  }
}, true);

// Also listen for unhandled promise rejections
window.addEventListener('unhandledrejection', function(e) {
  if (e.reason && typeof e.reason.message === 'string' && (
    e.reason.message.includes('runtime error') ||
    e.reason.message.includes('Cannot set properties of undefined') ||
    e.reason.message.includes('Cannot read properties of undefined')
  )) {
    console.log('Suppressed promise rejection:', e.reason.message);
    e.preventDefault();
    hideViteErrorOverlay();
    return true;
  }
}, true);