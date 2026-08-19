import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

// 빌드 스탬프 — 배포마다 번들 해시가 바뀌어 서비스 워커와 index.html(보안 헤더 포함)이
// 확실히 재캐시되도록 한다. (CSP 등 헤더만 바꾼 배포가 SW 캐시에 막혀 안 닿는 문제 방지)
const BUILD_STAMP = '2026-08-19-auth-frame-ancestors'
console.info(`[k-listen] build ${BUILD_STAMP}`)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
