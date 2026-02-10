import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill for crypto.randomUUID (Fixes white screen on older Android WebViews)
if (!window.crypto || !window.crypto.randomUUID) {
  console.warn('Polyfilling crypto.randomUUID');
  // @ts-ignore
  window.crypto = window.crypto || {};
  // @ts-ignore
  window.crypto.randomUUID = function() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW Registered', reg.scope))
      .catch(err => console.error('SW Registration Failed', err));
  });
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Mounting Error:", error);
  const debug = document.getElementById('debug-overlay');
  if (debug) {
    debug.style.display = 'block';
    debug.innerHTML += `<div style="color:red;"><strong>Mount Failure:</strong> ${error}</div>`;
  }
}