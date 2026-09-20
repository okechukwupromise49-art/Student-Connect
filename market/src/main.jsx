import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { Toaster } from "react-hot-toast";
import './index.css';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CallProvider } from './CallProvider';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <CallProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="dark"
        />
        <App />
      </BrowserRouter>
      </CallProvider>
  
  </React.StrictMode>
);