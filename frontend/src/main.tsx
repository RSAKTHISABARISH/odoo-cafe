import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload?')) {
      updateSW(true)
    }
  },
})

// Auto-clear corrupted local storage from previous crashed session
if (!localStorage.getItem('cafeflow_seeded_v1')) {
  localStorage.clear();
  localStorage.setItem('cafeflow_seeded_v1', 'true');
  window.location.reload(); // Force reload to rehydrate stores properly
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
