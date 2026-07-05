import { Outlet } from 'react-router-dom'
import InstallBanner from '@/components/InstallBanner'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-white">
      <InstallBanner />
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
