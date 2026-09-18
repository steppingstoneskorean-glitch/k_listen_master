import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLang, LANGS } from '@/lib/i18n'
import { useAuth } from '@/lib/auth'
import { useGamification } from '@/lib/gamification'
import { openCookieSettings } from '@/lib/cookieConsent'
import { AI_SCORE_ENABLED, hasShadowConsent, setShadowConsent } from '@/lib/shadowConsent'
import { loadPlan, orderedDoneCount, ORDERED_STEPS, getLevelPref, setPlanLevel } from '@/lib/todayPlan'
import type { LevelKey } from '@/data/gameLevels'
import { useUserProfile, type GoalPreset } from '@/lib/userProfile'
import ReminderSettings from '@/components/ReminderSettings'
import NicknameModal from '@/components/NicknameModal'
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
  const { nickname, saveNickname, goal, saveGoal } = useUserProfile()
  const navigate = useNavigate()

  const [showReminder, setShowReminder] = useState(false)
  const [showNickname, setShowNickname] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showLang, setShowLang] = useState(false)
  const [showComingSoon, setShowComingSoon] = useState(false)
  const [aiConsent, setAiConsent] = useState(hasShadowConsent())
  const [level, setLevelState] = useState<LevelKey | null>(() => getLevelPref()?.level ?? null)
  const [showLevel, setShowLevel] = useState(false)
  const [showGoal, setShowGoal] = useState(false)
  const [customGoal, setCustomGoal] = useState('')

  const LEVELS: LevelKey[] = ['beginner', 'intermediate', 'advanced']
  const levelName = (l: LevelKey) =>
    l === 'beginner' ? t('mode.beginner') : l === 'intermediate' ? t('mode.intermediate') : t('mode.advanced')

  const GOAL_PRESETS: { id: Exclude<GoalPreset, 'custom'>; key: 'goal.preset.drama' | 'goal.preset.kpop' | 'goal.preset.travel' | 'goal.preset.topik' | 'goal.preset.work' }[] = [
    { id: 'drama', key: 'goal.preset.drama' },
    { id: 'kpop', key: 'goal.preset.kpop' },
    { id: 'travel', key: 'goal.preset.travel' },
    { id: 'topik', key: 'goal.preset.topik' },
    { id: 'work', key: 'goal.preset.work' },
  ]
  const goalLabel = (): string => {
    if (!goal) return ''
    if (goal.preset === 'custom') return goal.text || ''
    return t(GOAL_PRESETS.find(p => p.id === goal.preset)?.key ?? 'goal.label')
  }

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
      {showReminder && <ReminderSettings onClose={() => setShowReminder(false)} />}
      {showNickname && (
        <NicknameModal
          defaultName={nickname ?? ''}
          onClose={() => setShowNickname(false)}
          onSubmit={async name => { await saveNickname(name); setShowNickname(false) }}
        />
      )}
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

          {/* 통계 — '오늘 목표'는 '오늘 계획'과 혼동되어 제거 */}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <div className="text-lg font-black text-slate-900">🔥 {progress.currentStreak}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">{t('profile.streakLabel')}</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3 text-center">
              <div className="text-lg font-black text-slate-900 tabular-nums">{orderedDoneCount(plan)}/{ORDERED_STEPS.length}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">{t('profile.planLabel')}</div>
            </div>
          </div>

          {/* 학습 설정 */}
          <Section title={t('profile.sectionLearning')}>
            <Row icon="🎚️" label={t('profile.levelLabel')} onClick={() => setShowLevel(s => !s)}
              right={<span className="text-xs font-bold text-slate-400">{level ? levelName(level) : '—'}</span>} />
            {showLevel && (
              <div className="bg-slate-50 px-3 py-2">
                <div className="grid grid-cols-3 gap-2">
                  {LEVELS.map(l => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => { setPlanLevel(l, 1); setLevelState(l); setShowLevel(false) }}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                        l === level ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {levelName(l)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Row icon="🎯" label={t('goal.label')} onClick={() => setShowGoal(s => !s)}
              right={<span className="max-w-[9rem] truncate text-xs font-bold text-slate-400">{goal ? goalLabel() : t('goal.setPrompt')}</span>} />
            {showGoal && (
              <div className="flex flex-col gap-2 bg-slate-50 px-3 py-2">
                {GOAL_PRESETS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { void saveGoal({ preset: p.id }); setShowGoal(false) }}
                    className={`rounded-xl border px-3 py-2 text-left text-sm font-semibold transition-colors ${
                      goal?.preset === p.id ? 'border-indigo-300 bg-indigo-50 text-indigo-600' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t(p.key)}
                  </button>
                ))}
                <div className="flex gap-2">
                  <input
                    value={customGoal}
                    onChange={e => setCustomGoal(e.target.value)}
                    maxLength={40}
                    placeholder={t('goal.customPlaceholder')}
                    className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    disabled={!customGoal.trim()}
                    onClick={() => { void saveGoal({ preset: 'custom', text: customGoal.trim() }); setCustomGoal(''); setShowGoal(false) }}
                    className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {t('goal.preset.custom')}
                  </button>
                </div>
              </div>
            )}
            <Row icon="🏷️" label={t('profile.editNickname')} onClick={() => setShowNickname(true)}
              right={<span className="max-w-[8rem] truncate text-xs font-bold text-slate-400">{nickname ?? '—'}</span>} />
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
            {AI_SCORE_ENABLED && (
              <Row
                icon="🎤"
                label={t('profile.aiScoreConsent')}
                onClick={() => { const v = !aiConsent; setShadowConsent(v); setAiConsent(v) }}
                right={<span className={`text-xs font-bold ${aiConsent ? 'text-emerald-500' : 'text-slate-300'}`}>{aiConsent ? 'ON' : 'OFF'}</span>}
              />
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
