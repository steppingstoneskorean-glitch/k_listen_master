import { Outlet } from 'react-router-dom'
import InstallBanner from '@/components/InstallBanner'
import Header from './Header'
import BottomNav from './BottomNav'

// 앱 셸 — 라이트 테마.  상단 슬림바 + 콘텐츠 + 하단 고정 탭바.
//   · app-shell: 하단 탭바(+ safe-area) 만큼 하단 여백을 확보 (index.css).
//   · 기존 다크 Footer/긴 상단 nav 는 제거하고 링크는 프로필 탭으로 이관.
export default function Layout() {
  return (
    <div className="app-shell flex min-h-screen flex-col bg-white text-slate-900">
      <InstallBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
