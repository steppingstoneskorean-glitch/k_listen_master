import { Routes, Route, Navigate } from 'react-router-dom'
import { LangProvider } from '@/lib/i18n'
import { AuthProvider } from '@/lib/auth'
import { GamificationProvider } from '@/lib/gamification'
import { UserProfileProvider } from '@/lib/userProfile'
import { VideoAccessProvider } from '@/lib/accessControl'
import { PwaInstallProvider } from '@/lib/pwaInstall'
import Layout from '@/components/layout/Layout'
import RequireAuth from '@/components/RequireAuth'
import CookieConsent from '@/components/CookieConsent'
import StartPage from '@/pages/StartPage'
import HomePage from '@/pages/HomePage'
import GamePage from '@/pages/GamePage'
import DictationPage from '@/pages/DictationPage'
import ShadowingPage from '@/pages/ShadowingPage'
import ReviewPage from '@/pages/ReviewPage'
import MaterialsPage from '@/pages/MaterialsPage'
import PrivacyPolicy from '@/pages/PrivacyPolicy'
import AboutPage from '@/pages/AboutPage'
import TermsPage from '@/pages/TermsPage'
import GrammarListPage from '@/pages/GrammarListPage'
import GrammarArticlePage from '@/pages/GrammarArticlePage'
import NotFoundPage from '@/pages/NotFoundPage'
import KpopQuiz from '@/components/KpopQuiz'
import GameHubPage from '@/pages/GameHubPage'
import QuizStudioPage from '@/pages/QuizStudioPage'
import QuizBuilderPage from '@/pages/QuizBuilderPage'
import ProfilePage from '@/pages/ProfilePage'

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <GamificationProvider>
          <UserProfileProvider>
          <VideoAccessProvider>
          <PwaInstallProvider>
            <Routes>
              {/* Public — 로그인 없이 접근 가능 */}
              <Route path="/login" element={<StartPage />} />
              <Route element={<Layout />}>
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/terms" element={<TermsPage />} />
              </Route>

              {/* Protected — 로그인 필수 */}
              <Route element={<RequireAuth />}>
                {/* Full-screen pages (no header/footer) */}
                <Route path="/game" element={<GamePage />} />
                <Route path="/dictation" element={<DictationPage />} />
                <Route path="/shadowing" element={<ShadowingPage />} />

                {/* Layout-wrapped pages */}
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/home" element={<Navigate to="/" replace />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/review" element={<ReviewPage />} />
                  <Route path="/errors" element={<Navigate to="/review" replace />} />
                  <Route path="/materials" element={<MaterialsPage />} />
                  <Route path="/games" element={<GameHubPage />} />
                  <Route path="/kpop-quiz/:videoId" element={<KpopQuiz />} />
                  <Route path="/quiz-studio" element={<QuizStudioPage />} />
                  <Route path="/quiz-builder" element={<QuizBuilderPage />} />
                  <Route path="/grammar" element={<GrammarListPage />} />
                  <Route path="/grammar/:slug" element={<GrammarArticlePage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>

              {/* Legacy redirects */}
              <Route path="/index" element={<Navigate to="/" replace />} />
            </Routes>
            <CookieConsent />
          </PwaInstallProvider>
          </VideoAccessProvider>
          </UserProfileProvider>
        </GamificationProvider>
      </AuthProvider>
    </LangProvider>
  )
}
