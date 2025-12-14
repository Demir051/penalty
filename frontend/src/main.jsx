import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import GlobalLoader from './components/GlobalLoader';

// Get basename from environment variable if deploying to subdirectory
const basename = import.meta.env.VITE_BASENAME || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <GlobalLoader />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);



