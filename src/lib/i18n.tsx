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
  'home.level1.title': { en: 'Guess the Word', ko: '단어 맞히기', es: 'Adivina la palabra', ja: '単語当て' },
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
  'game.yourRankFmt': {
    en: 'Your Rank: #{n} | {score} pts',
    ko: '내 순위: #{n} | {score}점',
    es: 'Tu Rango: #{n} | {score} pts',
    ja: 'あなたの順位: #{n} | {score}点',
  },

  // ── Nickname (leaderboard) ──
  'nickname.title': {
    en: 'Set Your Leaderboard Nickname',
    ko: '리더보드 닉네임을 설정하세요',
    es: 'Configura tu apodo del ranking',
    ja: 'リーダーボードのニックネームを設定してください',
  },
  'nickname.body': {
    en: 'This name will be shown on the leaderboard for all your future games.',
    ko: '이 닉네임은 앞으로의 모든 게임에서 리더보드에 표시됩니다.',
    es: 'Este nombre se mostrará en el ranking para todos tus próximos juegos.',
    ja: 'このニックネームは今後すべてのゲームでリーダーボードに表示されます。',
  },
  'nickname.placeholder': { en: 'Enter a nickname', ko: '닉네임 입력', es: 'Ingresa un apodo', ja: 'ニックネームを入力' },
  'nickname.confirm': { en: 'Save & Continue', ko: '저장하고 계속하기', es: 'Guardar y continuar', ja: '保存して続ける' },
  'nickname.required': {
    en: 'Please enter a nickname.',
    ko: '닉네임을 입력해주세요.',
    es: 'Por favor ingresa un apodo.',
    ja: 'ニックネームを入力してください。',
  },
  'nickname.tooLong': {
    en: 'Nickname must be 20 characters or less.',
    ko: '닉네임은 20자 이하여야 합니다.',
    es: 'El apodo debe tener 20 caracteres o menos.',
    ja: 'ニックネームは20文字以内にしてください。',
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

  // ── Landing (CRO redesign) ──
  'landing.loginBenefit': {
    en: 'Play instantly for free. Log in with Google/Apple to save your mistakes and unlock advanced levels!',
    ko: '무료로 바로 플레이하세요. Google/Apple 로그인 시 오답 저장 & 고급 레벨 잠금 해제!',
    es: 'Juega gratis al instante. ¡Inicia sesión con Google/Apple para guardar tus errores y desbloquear niveles avanzados!',
    ja: '無料ですぐプレイ。Google/Appleでログインすると、間違いの保存と上級レベルの解放ができます！',
  },
  'landing.step1.title': {
    en: 'Train Your Ears',
    ko: '귀 트이기 훈련',
    es: 'Entrena tus Oídos',
    ja: '耳を鍛える',
  },
  'landing.step1.desc': {
    en: 'Diagnose the subtle pronunciation differences your ears have been missing — and master them the fun way.',
    ko: '무료 듣기 게임으로 내 귀가 놓치고 있던 미세한 발음 차이를 진단하고 재미있게 익힙니다.',
    es: 'Diagnostica las sutiles diferencias de pronunciación que tus oídos pasaban por alto — y domínalas jugando.',
    ja: '耳が聞き逃していた微妙な発音の違いを診断し、楽しく身につけます。',
  },
  'landing.step1.bold': {
    en: 'Free Listening Game',
    ko: '무료 듣기 게임',
    es: 'Juego de Escucha Gratuito',
    ja: '無料リスニングゲーム',
  },
  'landing.step2.title': {
    en: 'Master Concept',
    ko: '개념 마스터',
    es: 'Domina el Concepto',
    ja: '概念をマスター',
  },
  'landing.step2.desc': {
    en: 'Build rock-solid fundamentals with a guidebook PDF packed with the secrets of native pronunciation.',
    ko: '원어민 발음의 비밀을 담은 가이드북 PDF 자료로 탄탄한 기본기를 다집니다.',
    es: 'Construye una base sólida con una guía en PDF llena de los secretos de la pronunciación nativa.',
    ja: 'ネイティブ発音の秘密を詰め込んだガイドブックPDFで、確かな基礎を固めます。',
  },
  'landing.step2.sub': {
    en: 'Exclusive guidebook crafted from years of real classroom experience.',
    ko: '수년간의 실제 강의 경험으로 빚어낸 단 하나의 가이드북.',
    es: 'Guía exclusiva creada a partir de años de experiencia real en el aula.',
    ja: '長年の実際の教室経験から生まれた特別なガイドブック。',
  },
  'landing.step3.title': {
    en: 'Speak Proudly',
    ko: '당당하게 말하기',
    es: 'Habla con Orgullo',
    ja: '堂々と話す',
  },
  'landing.step3.desc': {
    en: 'Perfect natural, native-like speaking through premium 1:1 classes.',
    ko: '1:1 수업을 통해 현지인처럼 자연스러운 스피킹을 완성합니다.',
    es: 'Perfecciona un habla natural, como la de un nativo, con clases premium 1:1.',
    ja: '1:1レッスンで、ネイティブのような自然なスピーキングを完成させます。',
  },
  'landing.ctaTitle1': {
    en: 'Stop Studying Korean Just with Your Eyes.',
    ko: '눈으로만 하는 한국어 공부는 이제 그만.',
    es: 'Deja de estudiar coreano solo con los ojos.',
    ja: '目だけで学ぶ韓国語はもう終わり。',
  },
  'landing.ctaTitle2': {
    en: 'Start Speaking Proudly Today.',
    ko: '오늘부터 당당하게 말하세요.',
    es: 'Empieza a hablar con orgullo hoy.',
    ja: '今日から堂々と話しましょう。',
  },
  'landing.ctaSub': {
    en: 'Listen properly and speak proudly — with Step Korean!',
    ko: 'Step Korean과 함께 제대로 듣고, 당당하게 말하세요!',
    es: 'Escucha bien y habla con orgullo — ¡con Step Korean!',
    ja: 'Step Koreanと一緒に、しっかり聞いて堂々と話しましょう！',
  },
  'landing.ctaGuide': {
    en: 'Get Free Pronunciation Guide (PDF)',
    ko: '무료 발음 가이드 받기 (PDF)',
    es: 'Obtén la Guía de Pronunciación Gratis (PDF)',
    ja: '無料発音ガイドを受け取る (PDF)',
  },
  'landing.ctaBookLesson': {
    en: 'Book a 1:1 Class',
    ko: '1:1 수업 신청하기',
    es: 'Reservar una Clase 1:1',
    ja: '1:1レッスンを申し込む',
  },
  'landing.ctaBookLessonSub': {
    en: '(Speaking, Grammar, Pronunciation, TOPIK)',
    ko: '(말하기,문법,발음,TOPIK)',
    es: '(Conversación, Gramática, Pronunciación, TOPIK)',
    ja: '(スピーキング、文法、発音、TOPIK)',
  },

  // ── Gamification (header streak / daily progress badges) ──
  'gamification.streakFmt': { en: '{n} Day Streak', ko: '{n}일 연속', es: 'Racha de {n} días', ja: '{n}日連続' },
  'gamification.completedFmt': { en: '{n} Completed', ko: '{n}개 완료', es: '{n} completados', ja: '{n}件完了' },

  // ── Common ──
  'common.ok': { en: 'OK', ko: '확인', es: 'Aceptar', ja: 'OK' },

  // ── PWA install ──
  'install.bannerMessage': {
    en: '📱 Add the app to your home screen for easy daily practice!',
    ko: '📱 홈 화면에 앱 추가하고 매일 편하게 학습하세요!',
    es: '📱 ¡Añade la app a tu pantalla de inicio y practica cada día fácilmente!',
    ja: '📱 ホーム画面にアプリを追加して、毎日気軽に練習しましょう！',
  },
  'install.installBtn': {
    en: 'Install App',
    ko: '앱 설치하기',
    es: 'Instalar app',
    ja: 'アプリをインストール',
  },
  'install.successTitle': {
    en: '🎉 Congrats on your first lesson!',
    ko: '🎉 첫 학습 완료를 축하합니다!',
    es: '🎉 ¡Felicidades por tu primera lección!',
    ja: '🎉 初めての学習完了、おめでとうございます！',
  },
  'install.successBody': {
    en: 'Add the app to your phone so tomorrow\'s practice is just one tap away!',
    ko: '내일도 쉽게 접속해서 연습하려면 스마트폰에 앱을 추가해 보세요!',
    es: '¡Añade la app a tu teléfono para practicar mañana con solo un toque!',
    ja: '明日も気軽に練習できるよう、スマホにアプリを追加してみましょう！',
  },
  'install.installHomeBtn': {
    en: 'Add App to Home Screen',
    ko: '바탕화면에 앱 설치하기',
    es: 'Añadir app a la pantalla de inicio',
    ja: 'ホーム画面にアプリを追加',
  },
  'install.notTodayBtn': {
    en: "Don't show today",
    ko: '오늘 하루 보지 않기',
    es: 'No mostrar hoy',
    ja: '今日は表示しない',
  },
  'install.closeBtn': { en: 'Close', ko: '닫기', es: 'Cerrar', ja: '閉じる' },
  'install.iosHint': {
    en: 'On iPhone, tap the Share [↑] button in Safari, then choose "Add to Home Screen"!',
    ko: '아이폰은 사파리 하단의 공유 [↑] 버튼을 누른 뒤 \'홈 화면에 추가\'를 선택해 주세요!',
    es: 'En iPhone, toca el botón Compartir [↑] en Safari y luego elige "Añadir a pantalla de inicio"',
    ja: 'iPhoneでは、Safari下部の共有[↑]ボタンをタップし、「ホーム画面に追加」を選んでください！',
  },

  // ── Real Sound Master (레벨 카드 섹션 타이틀) ──
  'realsound.subtitle': {
    en: 'Master natural Korean pronunciation step by step',
    ko: '자연스러운 한국어 발음을 단계별로 마스터하세요',
    es: 'Domina la pronunciación coreana natural paso a paso',
    ja: '自然な韓国語の発音を段階的にマスターしよう',
  },

  // ── K-Artist Live ──
  'kartist.subtitle': {
    en: 'Build your listening skills with real conversations from your favorite artists',
    ko: '좋아하는 아티스트의 실제 대화로 리스닝 실력을 키워보세요',
    es: 'Mejora tu comprensión auditiva con conversaciones reales de tus artistas favoritos',
    ja: '好きなアーティストのリアルな会話でリスニング力を鍛えよう',
  },
  'kartist.legend': {
    en: '🅑 Beginner (word order) · 🅘 Intermediate (meaning) · 🅐 Advanced (dictation) — ⭐ shows difficulty (1–3)',
    ko: '🅑 초급(어순 맞히기) · 🅘 중급(의미 이해) · 🅐 고급(받아쓰기) — ⭐ 는 난이도(1~3)를 뜻해요',
    es: '🅑 Principiante (orden) · 🅘 Intermedio (significado) · 🅐 Avanzado (dictado) — ⭐ indica la dificultad (1–3)',
    ja: '🅑 初級（語順）· 🅘 中級（意味）· 🅐 上級（書き取り）— ⭐ は難易度（1〜3）です',
  },
  'kartist.filterArtist': { en: 'By Artist', ko: 'Artist별', es: 'Por artista', ja: 'アーティスト別' },
  'kartist.filterLevel': { en: 'By Level', ko: '레벨별', es: 'Por nivel', ja: 'レベル別' },
  'kartist.all': { en: 'All', ko: '전체', es: 'Todos', ja: 'すべて' },
  'kartist.viewAll': { en: 'View All', ko: '모두 보기', es: 'Ver todo', ja: 'すべて見る' },
  'kartist.showLess': { en: 'Show Less', ko: '접기', es: 'Ver menos', ja: '折りたたむ' },

  // ── Game Hub (통합 게임 탭) ──
  'hub.title': { en: 'Game Hub', ko: '게임 허브', es: 'Centro de juegos', ja: 'ゲームハブ' },
  'hub.subtitle': {
    en: 'K-Artist Live and Step & Step Quiz — all your listening challenges in one place',
    ko: 'K-Artist Live 와 Step & Step 퀴즈, 모든 듣기 도전을 한곳에서',
    es: 'K-Artist Live y Step & Step Quiz — todos tus retos de escucha en un solo lugar',
    ja: 'K-Artist Live と Step & Step クイズ — すべてのリスニング挑戦をひとつに',
  },
  'hub.sortLabel': { en: 'Sort', ko: '정렬', es: 'Ordenar', ja: '並び替え' },
  'hub.sortPopular': { en: 'Most Played', ko: '많이 도전한 순', es: 'Más jugados', ja: '挑戦が多い順' },
  'hub.sortNewest': { en: 'Newest', ko: '최신순', es: 'Más recientes', ja: '新着順' },
  'hub.dirAsc': { en: 'Ascending', ko: '오름차순', es: 'Ascendente', ja: '昇順' },
  'hub.dirDesc': { en: 'Descending', ko: '내림차순', es: 'Descendente', ja: '降順' },
  'hub.playsFmt': { en: '{n} plays', ko: '{n}회 도전', es: '{n} partidas', ja: '{n}回挑戦' },
  'hub.stepQuiz': { en: 'Step & Step', ko: 'Step & Step', es: 'Step & Step', ja: 'Step & Step' },
  'hub.empty': {
    en: 'No games match this filter yet. Try another one!',
    ko: '조건에 맞는 게임이 아직 없어요. 다른 필터를 선택해 보세요!',
    es: 'No hay juegos con este filtro. ¡Prueba otro!',
    ja: 'この条件に合うゲームはまだありません。他のフィルターを試してください！',
  },
  'hub.filterMode': { en: 'By Mode', ko: '모드별', es: 'Por modo', ja: 'モード別' },

  // ── B/I/A 멀티 모드 ──
  'mode.beginner': { en: 'Beginner', ko: '초급', es: 'Principiante', ja: '初級' },
  'mode.intermediate': { en: 'Intermediate', ko: '중급', es: 'Intermedio', ja: '中級' },
  'mode.advanced': { en: 'Advanced', ko: '고급', es: 'Avanzado', ja: '上級' },
  'mode.selectTitle': { en: 'Choose your mode', ko: '모드를 선택하세요', es: 'Elige tu modo', ja: 'モードを選んでください' },
  'mode.selectSub': {
    en: 'Clear every mode of this video to earn the Mastery Crown 👑',
    ko: '이 영상의 모든 모드를 클리어하면 마스터리 왕관 👑 을 획득해요',
    es: 'Supera todos los modos de este video para ganar la Corona de Maestría 👑',
    ja: 'この動画のすべてのモードをクリアするとマスタリークラウン👑を獲得！',
  },
  'mode.questionsFmt': { en: '{n} questions', ko: '{n}문항', es: '{n} preguntas', ja: '{n}問' },
  'mode.cleared': { en: '✓ Cleared', ko: '✓ 클리어', es: '✓ Superado', ja: '✓ クリア' },
  'mode.bInstruction': {
    en: 'Listen, then tap the blocks in the order you heard them',
    ko: '듣고, 들린 순서대로 블록을 탭해 문장을 완성하세요',
    es: 'Escucha y toca los bloques en el orden que los oíste',
    ja: '聞いて、聞こえた順にブロックをタップして文を完成させましょう',
  },
  'mode.bYourAnswer': { en: 'Your sentence', ko: '내가 만든 문장', es: 'Tu oración', ja: '作った文' },
  'mode.iInstruction': {
    en: 'Listen, then choose the correct meaning',
    ko: '듣고, 알맞은 의미를 고르세요',
    es: 'Escucha y elige el significado correcto',
    ja: '聞いて、正しい意味を選びましょう',
  },
  'mode.changeMode': { en: '🔀 Other modes', ko: '🔀 다른 모드 도전', es: '🔀 Otros modos', ja: '🔀 他のモードに挑戦' },
  'mode.masteryUnlocked': {
    en: '👑 Mastery achieved! You cleared every mode of this video!',
    ko: '👑 마스터리 달성! 이 영상의 모든 모드를 클리어했어요!',
    es: '👑 ¡Maestría lograda! ¡Superaste todos los modos de este video!',
    ja: '👑 マスタリー達成！この動画のすべてのモードをクリアしました！',
  },
  'upgrade.title': {
    en: "You've used today's free pass",
    ko: '오늘의 무료 이용권을 사용했어요',
    es: 'Ya usaste tu pase gratis de hoy',
    ja: '本日の無料パスを使用済みです',
  },
  'upgrade.body': {
    en: "You've used your 1 free pass for today! Upgrade to Premium to unlock all videos immediately.",
    ko: '오늘의 무료 이용권 1회를 모두 사용했어요! 프리미엄으로 업그레이드하면 모든 영상을 바로 이용할 수 있어요.',
    es: '¡Ya usaste tu 1 pase gratis de hoy! Mejora a Premium para desbloquear todos los videos al instante.',
    ja: '本日の無料パス（1回）を使い切りました！プレミアムにアップグレードすると、すべての動画をすぐに利用できます。',
  },
  'upgrade.cta': { en: 'Upgrade to Premium', ko: '프리미엄으로 업그레이드', es: 'Mejorar a Premium', ja: 'プレミアムにアップグレード' },
  'upgrade.close': { en: 'Maybe later', ko: '다음에 할게요', es: 'Más tarde', ja: 'あとで' },

  // ── Challenge Share (결과 페이지 도전장 공유) ──
  'challenge.title': {
    en: '📣 Send a challenge to a friend',
    ko: '📣 친구에게 도전장 보내기',
    es: '📣 Envía un reto a un amigo',
    ja: '📣 友達に挑戦状を送る',
  },
  'challenge.message': {
    en: '🎵 Challenge Arrived! I just scored {score} pts on the {name} Quiz ({stars} Stars Level)! Can you beat my score? Try now 🎧',
    ko: '🎵 도전장 도착! 내가 {name} 퀴즈에서 {score}점을 받았어 (난이도 별 {stars}개)! 나를 이길 수 있을까? 지금 도전해봐 🎧',
    es: '🎵 ¡Reto recibido! Conseguí {score} pts en el quiz de {name} (Nivel {stars} estrellas). ¿Puedes superarme? ¡Inténtalo ahora! 🎧',
    ja: '🎵 挑戦状が届いた！{name}クイズで{score}点を獲得したよ（難易度★{stars}）！私に勝てるかな？今すぐ挑戦してみて🎧',
  },
  'challenge.shareBtn': {
    en: '🔗 Share Challenge Link',
    ko: '🔗 도전장 링크 공유',
    es: '🔗 Compartir enlace de reto',
    ja: '🔗 挑戦状リンクを共有',
  },
  'challenge.toastMsg': {
    en: 'Challenge link copied! Share it anywhere.',
    ko: '도전장 링크가 복사되었습니다! 어디서든 공유해보세요.',
    es: '¡Enlace de reto copiado! Compártelo donde quieras.',
    ja: '挑戦状のリンクをコピーしました！どこでもシェアしてみましょう。',
  },
  'challenge.copy': { en: '📋 Copy link', ko: '📋 링크 복사', es: '📋 Copiar enlace', ja: '📋 リンクをコピー' },
  'challenge.copied': { en: '✔ Copied!', ko: '✔ 복사됨!', es: '✔ ¡Copiado!', ja: '✔ コピー済み！' },

  // ── Result Image Card ──
  'resultCard.saveBtn': { en: '📸 Save Image for IG Story', ko: '📸 인스타 스토리용 이미지 저장', es: '📸 Guardar imagen para IG Story', ja: '📸 IGストーリー用に画像を保存' },
  'resultCard.saved': { en: '✔ Saved!', ko: '✔ 저장됨!', es: '✔ ¡Guardado!', ja: '✔ 保存済み！' },
  'resultCard.tagline': { en: 'Can you beat my score?', ko: '나를 이겨볼 수 있을까?', es: '¿Puedes superar mi puntuación?', ja: '私のスコアを超えられる？' },
  'challenge.shareX': { en: 'Share on 𝕏', ko: '𝕏 로 공유', es: 'Compartir en 𝕏', ja: '𝕏 でシェア' },
  'kartist.tryQuiz': { en: 'Try the listening quiz', ko: '듣기 퀴즈 도전', es: 'Prueba el quiz de escucha', ja: 'リスニングクイズに挑戦' },
  'kartist.play': { en: 'Play →', ko: 'Play →', es: 'Jugar →', ja: 'プレイ →' },
  'kartist.comingSoon': { en: 'Coming Soon', ko: 'Coming Soon', es: 'Próximamente', ja: '近日公開' },
  'kartist.comingSoonSub': { en: 'This video is coming soon', ko: '곧 공개될 예정이에요', es: 'Este video llegará pronto', ja: 'まもなく公開予定です' },
  'kartist.empty': {
    en: 'No videos match this filter yet. Try another one!',
    ko: '조건에 맞는 영상이 아직 없어요. 다른 필터를 선택해 보세요!',
    es: 'Aún no hay videos con este filtro. ¡Prueba otro!',
    ja: 'この条件に合う動画はまだありません。他のフィルターを試してください！',
  },
  'kartist.starsAria': { en: 'Difficulty: {n} star(s)', ko: '난이도 별 {n}개', es: 'Dificultad: {n} estrella(s)', ja: '難易度 星{n}つ' },
  'kartist.masteryAria': { en: 'Mastery achieved', ko: '마스터리 달성', es: 'Maestría lograda', ja: 'マスタリー達成' },

  // ── K-pop Listening Quiz ──
  'kpop.title': { en: '🎧 K-pop Korean Listening Quiz', ko: '🎧 K-pop 한국어 듣기 퀴즈', es: '🎧 Quiz de escucha de coreano K-pop', ja: '🎧 K-pop韓国語リスニングクイズ' },
  'kpop.subtitle': {
    en: 'Listen to the clip on repeat and fill in the blank.',
    ko: '영상 구간을 반복해 듣고 빈칸을 채워보세요.',
    es: 'Escucha el clip en bucle y completa el espacio.',
    ja: '動画の区間を繰り返し聞いて空欄を埋めましょう。',
  },
  'kpop.progress': { en: 'Sentence {i} / {n}', ko: '문장 {i} / {n}', es: 'Frase {i} / {n}', ja: '文 {i} / {n}' },
  'kpop.streak': { en: '{n}-day streak', ko: '{n}일 연속', es: 'Racha de {n} días', ja: '{n}日連続' },
  'kpop.points': { en: '{n} pts', ko: '{n}점', es: '{n} pts', ja: '{n}点' },
  'kpop.loadingPlayer': { en: 'Loading player…', ko: '플레이어 불러오는 중…', es: 'Cargando reproductor…', ja: 'プレーヤーを読み込み中…' },
  'kpop.replay': { en: '🔁 Replay section', ko: '🔁 구간 다시듣기', es: '🔁 Repetir sección', ja: '🔁 区間をもう一度' },
  'kpop.loopOn': { en: '♾️ Loop ON', ko: '♾️ 무한반복 ON', es: '♾️ Bucle ON', ja: '♾️ ループON' },
  'kpop.loopOff': { en: '⏸️ Loop OFF', ko: '⏸️ 반복 OFF', es: '⏸️ Bucle OFF', ja: '⏸️ ループOFF' },
  'kpop.clozePrompt': {
    en: 'Fill in the blank with what you hear',
    ko: '들은 대로 빈칸을 채우세요',
    es: 'Completa el espacio con lo que escuchas',
    ja: '聞こえたとおりに空欄を埋めてください',
  },
  'kpop.answerPlaceholder': { en: 'Type answer', ko: '정답', es: 'Escribe la respuesta', ja: '答えを入力' },
  'kpop.check': { en: '✅ Check', ko: '✅ 확인', es: '✅ Comprobar', ja: '✅ 確認' },
  'kpop.reset': { en: '↺ Reset', ko: '↺ 다시', es: '↺ Reiniciar', ja: '↺ やり直す' },
  'kpop.hint': { en: '💡 Hint', ko: '💡 힌트', es: '💡 Pista', ja: '💡 ヒント' },
  'kpop.hintHide': { en: '💡 Hide hint', ko: '💡 힌트 숨기기', es: '💡 Ocultar pista', ja: '💡 ヒントを隠す' },
  'kpop.correctMsg': { en: 'Correct! +10 pts 🎉', ko: '정답! +10점 🎉', es: '¡Correcto! +10 pts 🎉', ja: '正解！+10点 🎉' },
  'kpop.partialMsg': {
    en: '🔺 The letters are right — check your spacing! +5 pts',
    ko: '🔺 글자는 맞았지만 띄어쓰기를 확인해 보세요! +5점',
    es: '🔺 Las letras están bien, ¡revisa los espacios! +5 pts',
    ja: '🔺 文字は合っていますが、分かち書きを確認しましょう！+5点',
  },
  'kpop.wrongMsg': { en: 'Not quite. Listen again?', ko: '아쉬워요. 다시 들어볼까요?', es: 'Casi. ¿Escuchamos de nuevo?', ja: '惜しい！もう一度聞いてみましょう' },
  'kpop.recTitle': { en: '🎤 Shadowing Recorder', ko: '🎤 원어민 섀도잉 녹음', es: '🎤 Grabadora de shadowing', ja: '🎤 シャドーイング録音' },
  'kpop.recSub': {
    en: 'Repeat after the clip and hear your own pronunciation (max 10s, never saved)',
    ko: '따라 말하고 내 발음을 바로 들어보세요 (최대 10초, 저장 안 됨)',
    es: 'Repite y escucha tu pronunciación (máx. 10 s, no se guarda)',
    ja: '真似して話して自分の発音をすぐ確認（最大10秒、保存されません）',
  },
  'kpop.recStart': { en: '● Start recording', ko: '● 녹음 시작', es: '● Grabar', ja: '● 録音開始' },
  'kpop.recStop': { en: '■ Stop', ko: '■ 정지', es: '■ Detener', ja: '■ 停止' },
  'kpop.recError': {
    en: 'Microphone permission is required. Please check your browser settings.',
    ko: '마이크 권한이 필요합니다. 브라우저 설정을 확인해주세요.',
    es: 'Se requiere permiso del micrófono. Revisa la configuración del navegador.',
    ja: 'マイクの権限が必要です。ブラウザの設定を確認してください。',
  },
  'kpop.reviewTag': { en: 'Pronunciation Point Review', ko: '발음 포인트 복습', es: 'Repaso de pronunciación', ja: '発音ポイント復習' },
  'kpop.reviewCorrect': { en: 'Correct!', ko: '정답이에요!', es: '¡Correcto!', ja: '正解です！' },
  'kpop.reviewPartial': {
    en: 'So close! Just fix the spacing',
    ko: '아까워요! 띄어쓰기만 다듬으면 완벽',
    es: '¡Casi! Solo ajusta los espacios',
    ja: '惜しい！分かち書きだけ直せば完璧',
  },
  'kpop.reviewWrong': { en: 'Try again?', ko: '다시 도전해 볼까요?', es: '¿Lo intentamos de nuevo?', ja: 'もう一度挑戦してみましょう' },
  'kpop.myAnswer': { en: 'My answer', ko: '내 답', es: 'Mi respuesta', ja: '私の答え' },
  'kpop.answerLabel': { en: 'Answer', ko: '정답', es: 'Respuesta', ja: '正解' },
  'kpop.emptyAnswer': { en: '(blank)', ko: '(빈칸)', es: '(vacío)', ja: '（空欄）' },
  'kpop.partialBox': {
    en: '🔺 The letters are right — check your spacing! Compare with the correct spacing and try typing it again. (+5 pts)',
    ko: '🔺 글자는 맞았지만 띄어쓰기를 확인해 보세요! 정답의 띄어쓰기와 비교하며 다시 입력해 보면 완벽해져요. (+5점)',
    es: '🔺 Las letras están bien, ¡revisa los espacios! Compara con la respuesta correcta e inténtalo otra vez. (+5 pts)',
    ja: '🔺 文字は合っています。正解の分かち書きと見比べて、もう一度入力してみましょう。（+5点）',
  },
  'kpop.explTitle': { en: '🔊 Pronunciation & Grammar Notes', ko: '🔊 발음·문법 해설', es: '🔊 Notas de pronunciación y gramática', ja: '🔊 発音・文法解説' },
  'kpop.listenAgain': { en: '🔁 Listen again', ko: '🔁 다시 듣기', es: '🔁 Escuchar de nuevo', ja: '🔁 もう一度聞く' },
  'kpop.nextSentence': { en: '▶ Next sentence', ko: '▶ 다음 문장 듣기', es: '▶ Siguiente frase', ja: '▶ 次の文へ' },
  'kpop.seeResults': { en: '🏁 See results', ko: '🏁 결과 보기', es: '🏁 Ver resultados', ja: '🏁 結果を見る' },
  'kpop.doneTitle': { en: 'You finished every sentence!', ko: '모든 문장을 완료했어요!', es: '¡Completaste todas las frases!', ja: 'すべての文を完了しました！' },
  'kpop.doneSummary': {
    en: '{correct} of {total} correct · {percent}% success rate',
    ko: '총 {total}개 중 {correct}개 정답 · 성공률 {percent}%',
    es: '{correct} de {total} correctas · {percent}% de acierto',
    ja: '全{total}問中{correct}問正解 · 成功率{percent}%',
  },
  'kpop.restart': { en: '↺ Restart from the beginning', ko: '↺ 처음부터 다시 도전', es: '↺ Reintentar desde el inicio', ja: '↺ 最初からもう一度' },
  'kpop.shareText': {
    en: 'I caught {correct}/{total} Korean sentences from a {artist} video 🎧 ({percent}%) Can you beat me? {url}',
    ko: '{artist} 영상에서 한국어 문장 {total}개 중 {correct}개를 받아쓰기 성공! (성공률 {percent}%) 나를 이겨보세요: {url}',
    es: '¡Capté {correct}/{total} frases en coreano de un video de {artist} 🎧 ({percent}%)! ¿Puedes superarme? {url}',
    ja: '{artist}の動画で韓国語{total}文中{correct}文を聞き取れた🎧（{percent}%）私に勝てる？ {url}',
  },
  'kpop.saveCard': { en: '📸 Share result card', ko: '📸 결과 카드 공유', es: '📸 Compartir tarjeta', ja: '📸 結果カードをシェア' },
  'kpop.cardSaved': { en: '✔ Card saved!', ko: '✔ 카드 저장됨!', es: '✔ ¡Tarjeta guardada!', ja: '✔ カード保存済み！' },
  'kpop.copyLink': { en: '📋 Copy link', ko: '📋 링크 복사', es: '📋 Copiar enlace', ja: '📋 リンクをコピー' },
  'kpop.copied': { en: '✔ Copied!', ko: '✔ 복사됨!', es: '✔ ¡Copiado!', ja: '✔ コピー済み！' },
  'kpop.shareX': { en: 'Share on 𝕏', ko: '𝕏 로 공유', es: 'Compartir en 𝕏', ja: '𝕏 でシェア' },
  'kpop.reviewListTitle': { en: '📚 Review all sentences', ko: '📚 전체 문장 복습', es: '📚 Repasar todas las frases', ja: '📚 全文を復習' },
  'kpop.loginRequired': {
    en: 'The full review list is only available for logged-in users.',
    ko: '전체 문장 복습 리스트는 로그인한 사용자만 볼 수 있어요.',
    es: 'La lista de repaso completa solo está disponible para usuarios registrados.',
    ja: '全文復習リストはログインユーザーのみ閲覧できます。',
  },
  'kpop.loginCta': { en: 'Log in to review', ko: '로그인하고 복습하기', es: 'Inicia sesión para repasar', ja: 'ログインして復習する' },
  'kpop.listenCarefully': {
    en: '🎧 Listen carefully!',
    ko: '🎧 자막 없이 귀로만 들어보세요!',
    es: '🎧 ¡Escucha con atención!',
    ja: '🎧 耳を澄まして聞いてみましょう！',
  },
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
