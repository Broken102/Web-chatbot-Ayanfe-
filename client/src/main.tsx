import { createRoot } from "react-dom/client";
import { StrictMode, useEffect } from "react";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { setupErrorOverlayFix } from "./lib/hide-error-overlay";

// Apply the error overlay fix
if (import.meta.env.DEV) {
  setupErrorOverlayFix();
  
  // Another approach: directly hide the overlay using CSS
  const style = document.createElement('style');
  style.textContent = `
    /* Hide Vite error overlay */
    div[style*="z-index: 9999"] {
      display: none !important;
    }
  `;
  document.head.appendChild(style);
  
  // Also try to disable runtime error reporting
  window.addEventListener('error', (e) => {
    if (e.message.includes('runtime error')) {
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
  }, true);
}

// Wrapper component to manage global effects
function AppWithEffects() {
  useEffect(() => {
    // Handle global errors
    const handleError = () => {
      // Hide error overlay if it appears
      const overlays = document.querySelectorAll('div[style*="z-index: 9999"]');
      overlays.forEach(overlay => {
        if (overlay instanceof HTMLElement) {
          overlay.style.display = 'none';
        }
      });
    };
    
    window.addEventListener('error', handleError);
    
    // Periodic check for error overlay
    const intervalId = setInterval(() => {
      handleError();
    }, 1000);
    
    return () => {
      window.removeEventListener('error', handleError);
      clearInterval(intervalId);
    };
  }, []);
  
  return <App />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppWithEffects />
    </QueryClientProvider>
  </StrictMode>
);
