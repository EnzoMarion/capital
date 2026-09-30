import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, {
            scope: import.meta.env.BASE_URL,
        }).catch(error => {
            console.error('Impossible d’activer le mode hors connexion.', error);
        });
    });
}

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </StrictMode>
);
