import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang, LANGS } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useGamification } from '@/lib/gamification'
import { openCookieSettings } from '@/lib/cookieConsent'
import { loadPlan, orderedDoneCount, ORDERED_STEPS } from '@/lib/todayPlan'
import GoalEditModal from '@/components/GoalEditModal'
import ReminderSettings from '@/components/ReminderSettings'
import AccountDeleteModal from '@/components/AccountDeleteModal'

const PAYHIP_URL = import.meta.env.VITE_PAYHIP_URL ?? 'https://payhip.com/StepKorean'
const YOUTUBE_URL = 'https://www.youtube.com/@steppingstones.Korean'

// 계정/학습 설정/더보기를 한곳에 모은 프로필 탭.
//   기존 상단 nav(문법/무료자료/수업교재)·푸터(약관/개인정보/쿠키/삭제)를 여기로 이관.

function Row({ icon, label, onClick, to, href, danger, right }: {
  icon: string
  label: string
  onClick?: () => void
  to?: string
  href?: string
  danger?: boolean
  right?: ReactNode
}) {
  const base = `flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-colors ${
    danger ? 'text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'
  }`
  const inner = (
    <>
      <span className="w-5 text-center text-base">{icon}</span>
      <span className="flex-1 break-keep">{label}</span>
      {right ?? <span className="text-slate-300">›</span>}
    </>
  )
  if (to) return <Link to={to} className={base}>{inner}</Link>
  if (href) return <a href={href} target="_blank" rel="noopener noreferrer" className={base}>{inner}</a>
  return <button type="button" onClick={onClick} className={`${base} w-full text-left`}>{inner}</button>
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <p className="mb-1.5 mt-5 px-1 text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">{title}</p>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">{children}</div>
    </>
  )
}

export default function ProfilePage() {
  const { t, lang, setLang } = useLang()
  const { user, logout } = useAuth()
  const { progress } = useGamification()
  const navigate = useNavigate()

  const [showGoal, setShowGoal] = useState(false)
  const [showReminder, setShowReminder] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showLang, setShowLang] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)

  const plan = loadPlan()
  const name = user?.displayName || user?.email?.split('@')[0] || 'Guest'
  const initial = name.charAt(0).toUpperCase()
  const currentLang = LANGS.find(l => l.code === lang)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      {showGoal && <GoalEditModal onClose={() => setShowGoal(false)} />}
      {showReminder && <ReminderSettings onClose={() => setShowReminder(false)} />}
      {showDelete && <AccountDeleteModal onClose={() => setShowDelete(false)} />}
      {showComingSoon && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={() => setShowComingSoon(false)}>
          <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="text-lg font-bold text-slate-900">{t('materials.comingSoon')}</p>
            <button type="button" onClick={() => setShowComingSoon(false)} className="mt-5 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              {t('common.ok')}
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50">
        <section className="mx-auto w-full max-w-lg px-4 pt-5">
          {/* 프로필 헤더 */}
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 text-xl font-black text-white" style={{ height: '3.25rem', width: '3.25rem' }}>
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-slate-900">{name}</p>
              {user?.email && <p className="truncate text-xs text-slate-400">{user.email}</p>}
            </div>
          </div>

          {/* 통계 */}
          <div className="mt-3 grid grid-cols-3 gap-2.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <div className="text-lg font-black text-slate-900">🔥 {progress.currentStreak}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">{t('profile.streakLabel')}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <div className="text-lg font-black text-slate-900 tabular-nums">{progress.completedVideosToday}/{progress.dailyGoal}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">{t('mission.goalLabel')}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <div className="text-lg font-black text-slate-900 tabular-nums">{orderedDoneCount(plan)}/{ORDERED_STEPS.length}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">{t('profile.planLabel')}</div>
            </div>
          </div>

          {/* 학습 설정 */}
          <Section title={t('profile.sectionLearning')}>
            <Row icon="🎯" label={t('profile.editGoal')} onClick={() => setShowGoal(true)}
              right={<span className="text-xs font-bold text-slate-400">{progress.dailyGoal}</span>} />
            <Row icon="🔔" label={t('profile.reminder')} onClick={() => setShowReminder(true)}
              right={<span className={`text-xs font-bold ${progress.reminderEnabled ? 'text-emerald-500' : 'text-slate-300'}`}>{progress.reminderEnabled ? 'ON' : 'OFF'}</span>} />
            <Row icon="🌐" label={t('profile.language')} onClick={() => setShowLang(s => !s)}
              right={<span className="text-xs font-bold text-slate-400">{currentLang?.flag} {currentLang?.label}</span>} />
            {showLang && (
              <div className="bg-slate-50 px-3 py-2">
                <div className="grid grid-cols-2 gap-2">
                  {LANGS.map(l => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => { setLang(l.code); setShowLang(false) }}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                        l.code === lang ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{l.flag}</span><span>{l.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Section>

          {/* 더보기 */}
          <Section title={t('profile.sectionMore')}>
            <Row icon="📘" label={t('nav.grammar')} to="/grammar" />
            <Row icon="📂" label={t('nav.freeMaterials')} onClick={() => setShowComingSoon(true)} />
            <Row icon="🎓" label={t('nav.lessonsGuide')} href={PAYHIP_URL} />
            <Row icon="▶️" label={t('profile.youtube')} href={YOUTUBE_URL} />
          </Section>

          {/* 계정 */}
          <Section title={t('profile.sectionAccount')}>
            <Row icon="📄" label={t('footer.terms')} to="/terms" />
            <Row icon="🔒" label={t('footer.privacy')} to="/privacy" />
            <Row icon="🍪" label={t('cookie.settings')} onClick={openCookieSettings} />
            {user && <Row icon="🗑️" label={t('account.delete')} danger onClick={() => setShowDelete(true)} right={<span />} />}
            <Row icon="🚪" label={t('nav.logout')} danger onClick={handleLogout} right={<span />} />
          </Section>

          <p className="mt-5 text-center text-[11px] text-slate-400">© {new Date().getFullYear()} Step Korean. All rights reserved.</p>
        </section>
      </div>
    </>
  )
}
