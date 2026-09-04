import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { SiteSettingsProvider } from './context/SiteSettingsContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <SiteSettingsProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </SiteSettingsProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
