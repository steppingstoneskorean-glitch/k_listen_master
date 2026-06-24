import { createContext, useContext, useState, ReactNode } from 'react'

export type Lang = 'en' | 'ko' | 'es' | 'ja'

export const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
]

type TKey = keyof typeof TRANSLATIONS

const TRANSLATIONS = {
  // ── Start page ──
  'start.tagline': {
    en: 'Stop feeling nervous. Speak like a local.',
    ko: '긴장 말고, 현지인처럼 말하세요.',
    es: 'Deja de sentirte nervioso. Habla como un local.',
    ja: '緊張せず、ネイティブのように話しましょう。',
  },
  'start.login': { en: 'Log In', ko: '로그인', es: 'Iniciar Sesión', ja: 'ログイン' },
  'start.guest': { en: 'Play as Guest', ko: '게스트로 시작', es: 'Jugar como Invitado', ja: 'ゲストとしてプレイ' },

  // ── Auth ──
  'auth.email': { en: 'Email', ko: '이메일', es: 'Correo', ja: 'メール' },
  'auth.password': { en: 'Password', ko: '비밀번호', es: 'Contraseña', ja: 'パスワード' },
  'auth.displayName': { en: 'Display Name', ko: '닉네임', es: 'Nombre de usuario', ja: 'ニックネーム' },
  'auth.signIn': { en: 'Sign In', ko: '로그인', es: 'Iniciar Sesión', ja: 'サインイン' },
  'auth.signUp': { en: 'Sign Up', ko: '회원가입', es: 'Registrarse', ja: '新規登録' },
  'auth.toSignUp': {
    en: "Don't have an account? Sign Up",
    ko: '계정이 없으신가요? 회원가입',
    es: '¿No tienes cuenta? Regístrate',
    ja: 'アカウントをお持ちでないですか？登録',
  },
  'auth.toSignIn': {
    en: 'Already have an account? Sign In',
    ko: '이미 계정이 있으신가요? 로그인',
    es: '¿Ya tienes cuenta? Inicia Sesión',
    ja: 'すでにアカウントをお持ちですか？ログイン',
  },
  'auth.verifyNotice': {
    en: 'Verification email sent. Please verify your email before logging in.',
    ko: '인증 이메일을 보냈습니다. 이메일 인증 후 로그인하세요.',
    es: 'Correo de verificación enviado. Verifique su correo antes de iniciar sesión.',
    ja: '確認メールを送信しました。ログイン前にメールを確認してください。',
  },
  'auth.emailNotVerified': {
    en: 'Please verify your email first. Check your inbox.',
    ko: '먼저 이메일을 인증해주세요. 받은 편지함을 확인하세요.',
    es: 'Por favor, verifica tu correo primero.',
    ja: 'まずメールを確認してください。',
  },
  'auth.back': { en: 'Back', ko: '뒤로', es: 'Volver', ja: '戻る' },

  // ── Navigation ──
  'nav.freeMaterials': { en: 'Free Materials', ko: '무료 자료', es: 'Materiales Gratuitos', ja: '無料教材' },
  'nav.reviewErrors': { en: 'Review Errors', ko: '오답 확인', es: 'Revisar Errores', ja: '誤答確認' },
  'nav.logout': { en: 'Log Out', ko: '로그아웃', es: 'Cerrar Sesión', ja: 'ログアウト' },
  'nav.login': { en: 'Log In', ko: '로그인', es: 'Iniciar Sesión', ja: 'ログイン' },

  // ── Level selection (Home) ──
  'home.chooseLevel': {
    en: 'Choose your training level',
    ko: '레벨을 선택하세요',
    es: 'Elige tu nivel de entrenamiento',
    ja: 'レベルを選択してください',
  },
  'home.comingSoon': { en: 'Coming Soon', ko: '준비 중', es: 'Próximamente', ja: '近日公開' },
  'home.startNow': { en: 'Start Now →', ko: '지금 시작하기 →', es: 'Empezar →', ja: '今すぐ始める →' },
  'home.scrollMore': { en: 'Scroll for more ↓', ko: '스크롤하여 더 알아보기 ↓', es: 'Desplaza para más ↓', ja: 'スクロールで詳細を見る ↓' },

  // ── Error history ──
  'errors.title': { en: 'Error History', ko: '오답 기록', es: 'Historial de Errores', ja: '誤答履歴' },
  'errors.empty': {
    en: 'No errors recorded yet. Keep playing!',
    ko: '아직 오답 기록이 없습니다. 계속 플레이하세요!',
    es: 'Aún no hay errores registrados. ¡Sigue jugando!',
    ja: 'まだ誤答記録はありません。プレイを続けましょう！',
  },
  'errors.missed': { en: 'missed', ko: '번 틀림', es: 'errores', ja: '回ミス' },
  'errors.lastMissed': { en: 'Last missed', ko: '마지막 오답', es: 'Último error', ja: '最後のミス' },
  'errors.clear': { en: 'Clear All', ko: '전체 삭제', es: 'Borrar Todo', ja: 'すべて削除' },
  'errors.status.needsReview': { en: 'Urgent Review', ko: '긴급 복습', es: 'Revisión Urgente', ja: '緊急復習' },
  'errors.status.improving': { en: 'Improving', ko: '향상 중', es: 'Mejorando', ja: '上達中' },
  'errors.status.watch': { en: 'Watch', ko: '주의', es: 'Atención', ja: '注意' },
  'errors.correct': { en: 'Correct', ko: '정답', es: 'Correcto', ja: '正解' },
  'errors.yourAnswer': { en: 'You answered', ko: '내 답', es: 'Tu respuesta', ja: 'あなたの答え' },

  // ── Guest modal ──
  'guest.title': {
    en: 'Log in to save your score',
    ko: '기록을 저장하려면 로그인하세요',
    es: 'Inicia sesión para guardar tu puntuación',
    ja: 'スコアを保存するにはログインしてください',
  },
  'guest.body': {
    en: 'Log in to save your score and view the global leaderboard.',
    ko: '로그인하면 점수를 저장하고 전체 랭킹을 확인할 수 있습니다.',
    es: 'Inicia sesión para guardar tu puntuación y ver el ranking global.',
    ja: 'ログインしてスコアを保存し、グローバルランキングを確認しましょう。',
  },
  'guest.loginBtn': { en: 'Log In / Sign Up', ko: '로그인 / 회원가입', es: 'Iniciar Sesión / Registrarse', ja: 'ログイン / 新規登録' },
  'guest.continueBtn': { en: 'Continue as Guest', ko: '게스트로 계속', es: 'Continuar como Invitado', ja: 'ゲストとして続ける' },
  'guest.score': { en: 'Your Score', ko: '내 점수', es: 'Tu Puntuación', ja: 'あなたのスコア' },

  // ── Game / Result ──
  'game.restart': { en: '🔄 Restart', ko: '🔄 다시 시작', es: '🔄 Reiniciar', ja: '🔄 もう一度' },
  'game.home': { en: 'Home', ko: '홈', es: 'Inicio', ja: 'ホーム' },
  'game.leaderboard': { en: '🌍 Global Ranking', ko: '🌍 전체 랭킹', es: '🌍 Clasificación Global', ja: '🌍 グローバルランキング' },
  'game.live': { en: 'LIVE', ko: 'LIVE', es: 'EN VIVO', ja: 'ライブ' },

  // ── Materials ──
  'materials.title': { en: 'Free Materials', ko: '무료 자료', es: 'Materiales Gratuitos', ja: '無料教材' },
  'materials.desc': {
    en: 'View-only access to curated Korean learning materials.',
    ko: '엄선된 한국어 학습 자료를 무료로 보실 수 있습니다.',
    es: 'Acceso de solo lectura a materiales de aprendizaje de coreano.',
    ja: '厳選された韓国語学習教材の閲覧専用アクセス。',
  },
  'materials.open': { en: 'Open in Notion', ko: 'Notion에서 열기', es: 'Abrir en Notion', ja: 'Notionで開く' },
} as const

interface LangCtx {
  lang: Lang
  t: (key: TKey) => string
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangCtx>(null!)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('klisten_lang') as Lang | null
    return stored && LANGS.some(l => l.code === stored) ? stored : 'en'
  })

  const t = (key: TKey): string => {
    const entry = TRANSLATIONS[key]
    return entry ? entry[lang] ?? entry['en'] : key
  }

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('klisten_lang', l)
  }

  return <LangContext.Provider value={{ lang, t, setLang }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

// Inline language switcher used in Header and StartPage
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang()
  const [open, setOpen] = useState(false)
  const current = LANGS.find(l => l.code === lang)!

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:border-gray-500 transition-colors"
      >
        <span>{current.flag}</span>
        {!compact && <span className="text-xs font-medium">{current.label}</span>}
        <span className="text-gray-600 text-xs">▾</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-50 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl min-w-[140px]">
            {LANGS.map(l => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  l.code === lang ? 'bg-indigo-500/20 text-indigo-300' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
                {l.code === lang && <span className="ml-auto text-indigo-400 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
