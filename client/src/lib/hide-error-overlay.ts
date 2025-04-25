/**
 * This script helps hide the Vite runtime error overlay
 */

// Function to hide the error overlay when it appears
function hideErrorOverlay() {
  // Find all error overlays by their characteristic properties
  const overlays = document.querySelectorAll('div[style*="z-index: 9999"]');
  
  // Hide each overlay
  overlays.forEach(overlay => {
    if (overlay instanceof HTMLElement) {
      overlay.style.display = 'none';
    }
  });
}

// Run on page load
export function setupErrorOverlayFix() {
  // Initial check
  setTimeout(hideErrorOverlay, 1000);
  
  // Set up a periodic check to hide any error overlays
  setInterval(hideErrorOverlay, 2000);
  
  // Add an event listener to hide error overlays when they might appear
  window.addEventListener('error', () => {
    setTimeout(hideErrorOverlay, 0);
    setTimeout(hideErrorOverlay, 100);
  });
}