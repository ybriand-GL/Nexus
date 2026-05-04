import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './assets/brand/nexus/04_codex/design-tokens.css'
import './styles/nexus-theme.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
