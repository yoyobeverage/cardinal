// Vite entry point. Mounts the App into #root in index.html.
// StrictMode is on - double-invokes effects in dev only to catch
// missing cleanups; no behavior change in production.

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
