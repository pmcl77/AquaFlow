import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Tell TypeScript that 'process' exists globally to avoid build errors
declare global {
  interface Window {
    process: {
      env: {
        API_KEY: string;
      };
    };
  }
}
declare var process: {
  env: {
    API_KEY: string;
  };
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Register Service Worker for PWA / Local App support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registered', reg))
      .catch(err => console.log('SW registration failed', err));
  });
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);