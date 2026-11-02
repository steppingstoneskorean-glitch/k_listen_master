import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'

/**
 * 라우트 가드.
 * - 인증 상태 확인 중(loading)에는 스피너 표시
 * - 미로그인 시 /login 으로 리다이렉트 (원래 가려던 경로를 state.from 에 보존)
 * - allowGuest=true 인 라우트는 게스트(로그인 없이 '체험')도 통과시킨다.
 *   K-content 맛보기 경로(/games·/kpop-quiz·/game)에만 부여해, 홈·프로필 등
 *   계정 데이터가 필요한 화면은 여전히 로그인 필수로 유지한다.
 */
export default function RequireAuth({ allowGuest = false }: { allowGuest?: boolean }) {
  const { user, isGuest, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-gray-700 border-t-indigo-400 animate-spin" />
      </div>
    )
  }

  if (!user && !(allowGuest && isGuest)) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
