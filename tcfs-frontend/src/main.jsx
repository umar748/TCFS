import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const API_URL = import.meta.env.VITE_API_URL || '';

if (API_URL) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    if (typeof input === 'string' && input.startsWith('/api')) {
      const fullUrl = `${API_URL}${input}`;
      console.debug('Fetch rewrite:', input, '->', fullUrl);
      return originalFetch(fullUrl, init);
    }
    return originalFetch(input, init);
  };
} else {
  console.warn('VITE_API_URL is not configured. API calls will use relative paths.');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
