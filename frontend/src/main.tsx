import React from 'react';
import ReactDOM from 'react-dom/client';
import { setupAxios } from './api/axios';
import App from './App';
import './index.css';

setupAxios();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
