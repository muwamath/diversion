import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// GitHub Pages SPA: restore the original path from 404.html redirect
const spa = new URLSearchParams(location.search).get('__spa')
if (spa) {
  const decoded = decodeURIComponent(spa)
  history.replaceState(null, '', import.meta.env.BASE_URL + decoded)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
