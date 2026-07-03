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
  'auth.disposableEmail': {
    en: 'Please use a valid email address.',
    ko: '유효한 이메일 주소를 사용해주세요.',
    es: 'Por favor, usa una dirección de correo válida.',
    ja: '有効なメールアドレスをご使用ください。',
  },
  'auth.back': { en: 'Back', ko: '뒤로', es: 'Volver', ja: '戻る' },
  'auth.continueWithGoogle': {
    en: 'Continue with Google',
    ko: 'Google로 계속하기',
    es: 'Continuar con Google',
    ja: 'Googleで続ける',
  },
  'auth.continueWithApple': {
    en: 'Continue with Apple',
    ko: 'Apple로 계속하기',
    es: 'Continuar con Apple',
    ja: 'Appleで続ける',
  },
  'auth.orDivider': { en: 'or', ko: '또는', es: 'o', ja: 'または' },
  'auth.guestNotice': {
    en: 'Game records will not be saved, and you cannot review errors later.',
    ko: '게임 기록을 남길 수 없고, 오답을 후에 확인할 수 없습니다.',
    es: 'No se guardarán los récords del juego y no podrás revisar los errores más tarde.',
    ja: 'ゲーム記録は保存されず、後で誤答を確認することはできません。',
  },

  // ── Navigation ──
  'nav.game': { en: 'Games', ko: '게임', es: 'Juegos', ja: 'ゲーム' },
  'nav.freeMaterials': { en: 'Free Materials', ko: '무료 자료', es: 'Materiales Gratuitos', ja: '無料教材' },
  'nav.reviewErrors': { en: 'Review Errors', ko: '오답 확인', es: 'Revisar Errores', ja: '誤答確認' },
  'nav.lessonsGuide': { en: 'Lessons & Text book', ko: '수업 & 교재', es: 'Lecciones y Libro de texto', ja: '授業＆ 教材' },
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
  'home.pitchLine1': {
    en: 'Stop feeling nervous when speaking Korean.',
    ko: '한국어로 말할 때 긴장하지 마세요.',
    es: 'Deja de sentirte nervioso al hablar coreano.',
    ja: '韓国語を話すときの緊張をなくしましょう。',
  },
  'home.pitchLine2': {
    en: 'Speak like a local.',
    ko: '현지인처럼 말하세요.',
    es: 'Habla como un local.',
    ja: 'ネイティブのように話せます。',
  },
  'home.pitchDesc': {
    en: 'Whether you are a beginner struggling to hear or an advanced learner blocked by pronunciation barriers — start practicing with Step Korean to open your ears and perfect your accent.',
    ko: '듣기가 힘든 초급자든, 발음 장벽을 넘지 못한 고급 학습자든 — Step Korean으로 연습을 시작해 귀를 열고 발음을 완성해보세요.',
    es: 'Ya seas un principiante que lucha por escuchar o un aprendiz avanzado bloqueado por barreras de pronunciación — empieza a practicar con Step Korean para abrir tus oídos y perfeccionar tu acento.',
    ja: '聞き取りに苦労している初級者でも、発音の壁に阻まれた上級者でも — Step Koreanで練習を始め、耳を開いて発音を磨きましょう。',
  },
  'home.level1.label': { en: 'BEGINNER', ko: '초급', es: 'PRINCIPIANTE', ja: '初級' },
  'home.level1.title': { en: 'Ear-Opening Room', ko: '듣기 게임', es: 'Sala Auditiva', ja: '耳開きルーム' },
  'home.level1.desc': {
    en: '불 vs 뿔, 살 vs 쌀 — catch subtle phonetic differences through card-tap drills.',
    ko: '불 vs 뿔, 살 vs 쌀 — 카드 탭 훈련으로 미묘한 발음 차이를 잡아보세요.',
    es: '불 vs 뿔, 살 vs 쌀 — detecta diferencias fonéticas sutiles con ejercicios de tarjetas.',
    ja: '불 vs 뿔, 살 vs 쌀 — カードタップ練習で微妙な音の違いを聞き分けましょう。',
  },
  'home.level1.rounds': { en: 'Level 1–4 · Card tap', ko: '레벨 1–4 · 카드 탭', es: 'Nivel 1–4 · Tarjetas', ja: 'レベル 1–4 · カードタップ' },
  'home.level2.label': { en: 'INTERMEDIATE', ko: '중급', es: 'INTERMEDIO', ja: '中級' },
  'home.level2.title': { en: 'Real-Life Dictation', ko: '실생활 받아쓰기', es: 'Dictado de la Vida Real', ja: '実生活ディクテーション' },
  'home.level2.desc': {
    en: 'Restaurants, subways, phone calls — type exactly what you hear in everyday situations.',
    ko: '식당, 지하철, 전화 통화 — 일상 상황에서 들리는 내용을 정확하게 입력하세요.',
    es: 'Restaurantes, metro, llamadas — escribe exactamente lo que escuchas en situaciones cotidianas.',
    ja: 'レストラン、地下鉄、電話通話 — 日常の場面で聞こえた内容をそのまま入力してください。',
  },
  'home.level2.rounds': { en: '10 questions · Dictation', ko: '10문제 · 받아쓰기', es: '10 preguntas · Dictado', ja: '10問 · ディクテーション' },
  'home.level3.label': { en: 'ADVANCED', ko: '고급', es: 'AVANZADO', ja: '上級' },
  'home.level3.title': { en: 'Media & Professional', ko: '미디어 & 전문', es: 'Medios y Profesional', ja: 'メディア＆プロ' },
  'home.level3.desc': {
    en: 'Master connected speech from news briefings, business meetings, and variety shows.',
    ko: '뉴스 브리핑, 비즈니스 회의, 예능 — 연결 발화를 마스터하세요.',
    es: 'Domina el habla conectada de informativos, reuniones de negocios y programas de variedades.',
    ja: 'ニュース、ビジネス会議、バラエティ番組 — 連続発話をマスターしましょう。',
  },
  'home.level3.rounds': { en: '10 questions · Dictation', ko: '10문제 · 받아쓰기', es: '10 preguntas · Dictado', ja: '10問 · ディクテーション' },

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
  'game.levelFmt': { en: 'Level {n}', ko: '레벨 {n}', es: 'Nivel {n}', ja: 'レベル {n}' },
  'game.restart': { en: '🔄 Restart', ko: '🔄 다시 시작', es: '🔄 Reiniciar', ja: '🔄 もう一度' },
  'game.home': { en: 'Home', ko: '홈', es: 'Inicio', ja: 'ホーム' },
  'game.leaderboard': { en: '🌍 Global Ranking', ko: '🌍 전체 랭킹', es: '🌍 Clasificación Global', ja: '🌍 グローバルランキング' },
  'game.live': { en: 'LIVE', ko: 'LIVE', es: 'EN VIVO', ja: 'ライブ' },

  // ── In-game play ──
  'game.listenInstruction': {
    en: 'Select the word you hear',
    ko: '들리는 단어를 선택하세요',
    es: 'Selecciona la palabra que escuchas',
    ja: '聞こえた単語を選んでください',
  },
  'game.listenAgain': {
    en: 'Listen\nagain',
    ko: '다시\n듣기',
    es: 'Escuchar\nde nuevo',
    ja: 'もう一度\n聞く',
  },
  'game.correctNow': { en: 'If correct now', ko: '지금 맞추면', es: 'Si aciertas ahora', ja: '今正解で' },
  'game.pts': { en: 'pts', ko: '점', es: 'pts', ja: '点' },
  'game.replayPenalty': { en: 'Replay', ko: '재생', es: 'Repetir', ja: '再生' },
  'game.answerLabel': { en: 'Correct ✓', ko: '정답 ✓', es: 'Correcto ✓', ja: '正解 ✓' },
  'game.feedbackCorrect': { en: 'Correct! 🎯', ko: '정확해요! 🎯', es: '¡Correcto! 🎯', ja: '正解！🎯' },
  'game.feedbackWrong': { en: 'Incorrect 💔', ko: '틀렸어요 💔', es: 'Incorrecto 💔', ja: '不正解 💔' },

  // ── Level clear ──
  'game.levelClearFmt': {
    en: 'Level {n} Clear!',
    ko: '레벨 {n} 클리어!',
    es: '¡Nivel {n} superado!',
    ja: 'レベル {n} クリア！',
  },
  'game.levelClearSub': {
    en: 'Choose your next action',
    ko: '다음 행동을 선택하세요',
    es: 'Elige tu próxima acción',
    ja: '次のアクションを選んでください',
  },
  'game.currentScore': { en: 'Current Score', ko: '현재 점수', es: 'Puntuación actual', ja: '現在のスコア' },
  'game.reviewWrongFmt': {
    en: '📝 Review Wrong Answers ({n})',
    ko: '📝 틀린 문제 복습하기 ({n}개)',
    es: '📝 Revisar incorrectas ({n})',
    ja: '📝 間違えた問題を復習 ({n}問)',
  },
  'game.nextLevelFmt': {
    en: 'Level {n} →',
    ko: '레벨 {n} 진행하기 →',
    es: 'Nivel {n} →',
    ja: 'レベル {n} へ →',
  },
  'game.finalResultBtn': {
    en: 'Final Results →',
    ko: '최종 결과 보기 →',
    es: 'Resultados finales →',
    ja: '最終結果を見る →',
  },

  // ── Review mode ──
  'game.reviewMode': { en: 'Review Mode', ko: '복습 모드', es: 'Modo repaso', ja: '復習モード' },
  'game.reviewTitle': {
    en: 'Pronunciation Comparison',
    ko: '발음 비교 연습',
    es: 'Comparación de pronunciación',
    ja: '発音比較練習',
  },
  'game.correctIndicator': { en: '→ Correct:', ko: '→ 정답:', es: '→ Correcto:', ja: '→ 正解：' },
  'game.tapInstruction': {
    en: 'Tap each word to hear the pronunciation',
    ko: '각 단어를 탭해서 발음을 들어보세요',
    es: 'Toca cada palabra para escuchar la pronunciación',
    ja: '各単語をタップして発音を聞いてみましょう',
  },
  'game.wordCorrect': { en: '✓ Correct', ko: '✓ 정답', es: '✓ Correcto', ja: '✓ 正解' },
  'game.wordWrong': { en: '× Wrong', ko: '× 오답', es: '× Incorrecto', ja: '× 不正解' },
  'game.tap': { en: 'Tap', ko: '탭', es: 'Tocar', ja: 'タップ' },
  'game.reviewComplete': {
    en: '✅ Review Complete → Next Level',
    ko: '✅ 복습 완료 → 다음 레벨 진행하기',
    es: '✅ Repaso completo → Siguiente nivel',
    ja: '✅ 復習完了 → 次のレベルへ',
  },
  'game.next': { en: 'Next →', ko: '다음 →', es: 'Siguiente →', ja: '次へ →' },

  // ── Result ──
  'game.winTitle': { en: 'Level 4 Clear!', ko: '레벨 4 클리어!', es: '¡Nivel 4 superado!', ja: 'レベル 4 クリア！' },
  'game.loseTitle': { en: 'Game Over', ko: '게임 오버', es: 'Fin del juego', ja: 'ゲームオーバー' },
  'game.winSub': {
    en: 'You passed all levels!',
    ko: '모든 레벨을 통과했습니다!',
    es: '¡Superaste todos los niveles!',
    ja: 'すべてのレベルをクリアしました！',
  },
  'game.eliminatedFmt': {
    en: 'Eliminated at Level {n}',
    ko: '레벨 {n}에서 탈락했습니다',
    es: 'Eliminado en el nivel {n}',
    ja: 'レベル {n} で敗退しました',
  },
  'game.tiedRankFmt': { en: 'Tied #{n}', ko: '공동 {n}등', es: 'Empate #{n}', ja: '同率 {n}位' },
  'game.rankFmt': { en: '#{n}', ko: '{n}등', es: '#{n}', ja: '{n}位' },
  'game.othersFmt': { en: '+{n} others', ko: '그 외 {n}명', es: '+{n} más', ja: '他{n}名' },
  'game.noRecords': {
    en: 'No records yet',
    ko: '아직 기록이 없습니다',
    es: 'Sin registros aún',
    ja: 'まだ記録がありません',
  },

  // ── Dictation game ──
  'dictation.listenAgain': { en: 'Listen Again', ko: '다시 듣기', es: 'Escuchar de nuevo', ja: 'もう一度聞く' },
  'dictation.autoPlaying': { en: 'Playing…', ko: '재생 중…', es: 'Reproduciendo…', ja: '再生中…' },
  'dictation.typeAnswer': { en: 'Type what you hear', ko: '들은 내용을 입력하세요', es: 'Escribe lo que escuchas', ja: '聞こえた内容を入力してください' },
  'dictation.submit': { en: 'Submit →', ko: '제출 →', es: 'Enviar →', ja: '提出 →' },
  'dictation.correct': { en: 'Correct! 🎯', ko: '정답입니다! 🎯', es: '¡Correcto! 🎯', ja: '正解！🎯' },
  'dictation.incorrect': { en: 'Incorrect 💔', ko: '틀렸습니다 💔', es: 'Incorrecto 💔', ja: '不正解 💔' },
  'dictation.correctAnswer': { en: 'Answer:', ko: '정답:', es: 'Respuesta:', ja: '正解：' },
  'dictation.question': { en: 'Question', ko: '문제', es: 'Pregunta', ja: '問題' },
  'dictation.score': { en: 'Score', ko: '점수', es: 'Puntaje', ja: 'スコア' },
  'dictation.correct10': { en: 'Correct', ko: '정답', es: 'Aciertos', ja: '正解数' },
  'dictation.result': { en: 'Results', ko: '결과', es: 'Resultados', ja: '結果' },
  'dictation.playAgain': { en: '🔄 Play Again', ko: '🔄 다시 하기', es: '🔄 Jugar de nuevo', ja: '🔄 もう一度' },
  'dictation.backHome': { en: 'Home', ko: '홈', es: 'Inicio', ja: 'ホーム' },
  'dictation.outOf': { en: 'out of', ko: '/ ', es: 'de', ja: '/' },
  'dictation.hint': { en: 'Hint', ko: '힌트', es: 'Pista', ja: 'ヒント' },
  'dictation.penaltyHint': {
    en: '-100 pts per replay',
    ko: '다시 듣기마다 -100점',
    es: '-100 pts por repetición',
    ja: '再生ごとに-100点',
  },
  'dictation.totalScore': { en: 'Total Score', ko: '총 점수', es: 'Puntaje total', ja: '合計スコア' },
  'dictation.rank': { en: 'Rank', ko: '순위', es: 'Rango', ja: '順位' },

  // ── Dictation level select ──
  'dictation.selectLevel': { en: 'Choose Difficulty', ko: '레벨 선택', es: 'Elegir dificultad', ja: '難易度選択' },
  'dictation.level1Label': { en: 'Level 1', ko: 'Level 1', es: 'Nivel 1', ja: 'レベル 1' },
  'dictation.level2Label': { en: 'Level 2', ko: 'Level 2', es: 'Nivel 2', ja: 'レベル 2' },
  'dictation.level1Desc': { en: 'One-word blank', ko: '한 단어 빈칸', es: 'Espacio de una palabra', ja: '1語の空欄' },
  'dictation.level2Desc': { en: 'Two-word blank', ko: '두 단어 빈칸', es: 'Espacio de dos palabras', ja: '2語の空欄' },
  'dictation.level1Detail': { en: 'Hide 1 word unit', ko: '1개 어절 가리기', es: 'Ocultar 1 unidad', ja: '1語節を隠す' },
  'dictation.level2Detail': { en: 'Hide 2 word units', ko: '2개 어절 가리기', es: 'Ocultar 2 unidades', ja: '2語節を隠す' },

  // ── Materials ──
  'materials.title': { en: 'Free Materials', ko: '무료 자료', es: 'Materiales Gratuitos', ja: '無料教材' },
  'materials.desc': {
    en: 'View-only access to curated Korean learning materials.',
    ko: '엄선된 한국어 학습 자료를 무료로 보실 수 있습니다.',
    es: 'Acceso de solo lectura a materiales de aprendizaje de coreano.',
    ja: '厳選された韓国語学習教材の閲覧専用アクセス。',
  },
  'materials.open': { en: 'Open in Notion', ko: 'Notion에서 열기', es: 'Abrir en Notion', ja: 'Notionで開く' },
  'materials.comingSoon': { en: 'Coming soon.', ko: '준비 중입니다.', es: 'Próximamente.', ja: '準備中です。' },

  // ── Common ──
  'common.ok': { en: 'OK', ko: '확인', es: 'Aceptar', ja: 'OK' },
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
