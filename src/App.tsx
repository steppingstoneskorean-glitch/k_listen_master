import { Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from '@/lib/i18n'
import { AuthProvider } from '@/lib/auth'
import Layout from '@/components/layout/Layout'
import StartPage from '@/pages/StartPage'
import HomePage from '@/pages/HomePage'
import GamePage from '@/pages/GamePage'
import DictationPage from '@/pages/DictationPage'
import ErrorHistoryPage from '@/pages/ErrorHistoryPage'
import MaterialsPage from '@/pages/MaterialsPage'
import NotFoundPage from '@/pages/NotFoundPage'

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <Routes>
          {/* Full-screen (no header/footer) */}
          <Route path="/" element={<StartPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/dictation" element={<DictationPage />} />

          {/* Layout-wrapped pages */}
          <Route element={<Layout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/errors" element={<ErrorHistoryPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Legacy redirect */}
          <Route path="/index" element={<Navigate to="/home" replace />} />
        </Routes>
      </AuthProvider>
    </LangProvider>
  )
}
