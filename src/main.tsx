import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: no StrictMode — fabric.js owns an imperative <canvas> and its async
// dispose() races with StrictMode's mount/unmount/remount effect cycle.
createRoot(document.getElementById('root')!).render(<App />)
