// File: src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@app/App';
import '@shared/styles/globals.css';

// React.StrictMode causes double renders in development, slowing down the app
// Remove it in production or make it conditional for better performance
const isDevelopment = import.meta.env.DEV;

const app = (
  <BrowserRouter>
    <App />
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  isDevelopment ? app : <React.StrictMode>{app}</React.StrictMode>
);
