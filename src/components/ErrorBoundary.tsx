// src/components/ErrorBoundary.tsx
// 앱 전역 예외 방어막. 렌더 중 예외가 나면 앱 전체가 언마운트되어 화이트스크린이
// 되는 것을 막고, 새로고침 안내가 있는 폴백 화면을 보여준다.
//   · 최상위(main.tsx)에서 App 전체를 감싸므로, 폴백은 i18n/컨텍스트에 의존하지 않고
//     정적 이중언어(EN/KO) 문구를 쓴다(컨텍스트 자체가 깨졌을 수도 있으므로).

import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}
interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 프로덕션에서도 콘솔에 남겨 원인 파악에 도움을 준다(외부 전송 없음).
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#0f172a',
          background: '#f8fafc',
        }}
      >
        <div style={{ fontSize: '40px' }}>😵‍💫</div>
        <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '14px', color: '#475569', margin: 0, maxWidth: '320px', lineHeight: 1.6 }}>
          The app hit an unexpected error. Please reload the page.
          <br />
          예기치 못한 오류가 발생했습니다. 페이지를 새로고침해 주세요.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '8px',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: '#4f46e5',
            color: '#fff',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Reload / 새로고침
        </button>
      </div>
    )
  }
}
