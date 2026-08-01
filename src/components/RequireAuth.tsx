import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

/**
 * 로그인한 사용자만 통과시키는 라우트 가드.
 * - 인증 상태 확인 중(loading)에는 스피너 표시
 * - 미로그인 시 /login 으로 리다이렉트 (원래 가려던 경로를 state.from 에 보존)
 */
export default function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-gray-700 border-t-indigo-400 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
