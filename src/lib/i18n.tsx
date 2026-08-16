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

  // ── Cookie consent ──
  'cookie.message': {
    en: 'We use Google Analytics cookies to understand usage and improve the service. Analytics runs only if you accept.',
    ko: '서비스 개선을 위한 이용 통계 분석(구글 애널리틱스)에 쿠키를 사용합니다. 동의하신 경우에만 분석이 작동합니다.',
    es: 'Usamos cookies de Google Analytics para entender el uso y mejorar el servicio. El análisis solo se activa si aceptas.',
    ja: 'サービス改善のための利用状況分析（Google アナリティクス）にクッキーを使用します。同意された場合のみ分析が有効になります。',
  },
  'cookie.accept': { en: 'Accept', ko: '동의', es: 'Aceptar', ja: '同意する' },
  'cookie.decline': { en: 'Decline', ko: '거부', es: 'Rechazar', ja: '拒否する' },
  'cookie.settings': { en: 'Cookie Settings', ko: '쿠키 설정', es: 'Configuración de cookies', ja: 'クッキー設定' },
  'cookie.privacy': { en: 'Privacy Policy', ko: '개인정보처리방침', es: 'Política de privacidad', ja: 'プライバシーポリシー' },

  // ── Login trust / permission explanation ──
  // ── Shadowing mode ──
  'shadowing.entryTitle': { en: 'Shadowing', ko: '섀도잉 (따라 말하기)', es: 'Shadowing', ja: 'シャドーイング' },
  'shadowing.entryDesc': {
    en: 'Listen, record yourself, and compare with the native audio by ear.',
    ko: '듣고, 내 목소리를 녹음해서, 원어민 음원과 귀로 직접 비교해보세요.',
    es: 'Escucha, grábate y compara con el audio nativo de oído.',
    ja: '聞いて、自分の声を録音し、ネイティブ音声と耳で聞き比べましょう。',
  },
  'shadowing.subtitle': {
    en: 'Listen, record yourself, and compare your voice with the native audio by ear.',
    ko: '듣고, 내 목소리를 녹음해서, 원어민 음원과 귀로 직접 비교해보세요.',
    es: 'Escucha, grábate y compara tu voz con el audio nativo de oído.',
    ja: '聞いて、自分の声を録音し、ネイティブ音声と耳で聞き比べましょう。',
  },
  'shadowing.record': { en: 'Record my voice', ko: '내 목소리 녹음', es: 'Grabar mi voz', ja: '自分の声を録音' },
  'shadowing.listenNative': { en: 'Hear native', ko: '원어민 발음 듣기', es: 'Escuchar nativo', ja: 'ネイティブ発音' },
  'shadowing.recordPrompt': {
    en: 'Listen a few times, then record yourself and compare.',
    ko: '여러 번 듣고, 내 목소리를 녹음해 비교해보세요.',
    es: 'Escucha varias veces, luego grábate y compara.',
    ja: '何度か聞いて、自分の声を録音して比べてみましょう。',
  },
  'shadowing.micBlocked': {
    en: 'Microphone access was blocked. Allow the mic in your browser settings to record, or just listen and self-check.',
    ko: '마이크 접근이 차단됐어요. 브라우저 설정에서 마이크를 허용하면 녹음할 수 있어요. 그냥 듣고 스스로 평가해도 됩니다.',
    es: 'Se bloqueó el acceso al micrófono. Permítelo en la configuración del navegador para grabar, o solo escucha y autoevalúate.',
    ja: 'マイクへのアクセスがブロックされました。ブラウザ設定でマイクを許可すると録音できます。聞いて自己評価するだけでもOKです。',
  },
  'shadowing.needPractice': { en: 'Needs practice · save', ko: '더 연습 · 복습 저장', es: 'A practicar · guardar', ja: '要練習 · 保存' },
  'shadowing.gotIt': { en: 'Got it · next', ko: '잘 됐어요 · 다음', es: '¡Listo! · siguiente', ja: 'できた · 次へ' },
  'shadowing.practiced': { en: 'sentences practiced', ko: '문장 연습 완료', es: 'frases practicadas', ja: '文の練習完了' },
  'shadowing.practiceThis': { en: 'Practice this sentence', ko: '이 문장 연습', es: 'Practicar esta frase', ja: 'この文を練習' },
  'shadowing.reviewSaved': { en: 'saved to review', ko: '복습에 저장됨', es: 'guardadas para repaso', ja: '復習に保存' },
  // ── Shadowing compare panel ──
  'shadowing.native': { en: 'Native', ko: '원어민', es: 'Nativo', ja: 'ネイティブ' },
  'shadowing.you': { en: 'You', ko: '나', es: 'Tú', ja: 'あなた' },
  'shadowing.alternate': { en: 'Alternate', ko: '번갈아 재생', es: 'Alternar', ja: '交互再生' },
  'shadowing.stopAlternate': { en: 'Stop', ko: '정지', es: 'Detener', ja: '停止' },
  'shadowing.analyzing': { en: 'Analyzing…', ko: '분석 중…', es: 'Analizando…', ja: '分析中…' },
  'shadowing.waveform': { en: 'Waveform (rhythm)', ko: '파형 (리듬)', es: 'Onda (ritmo)', ja: '波形（リズム）' },
  'shadowing.pitch': { en: 'Intonation (pitch)', ko: '억양 (피치)', es: 'Entonación (tono)', ja: 'イントネーション（ピッチ）' },
  'shadowing.length': { en: 'Length', ko: '길이', es: 'Duración', ja: '長さ' },
  'shadowing.rhythmMatch': { en: 'Rhythm match', ko: '리듬 유사도', es: 'Coincidencia de ritmo', ja: 'リズム一致' },
  'shadowing.intonationMatch': { en: 'Intonation match', ko: '억양 유사도', es: 'Coincidencia de entonación', ja: 'イントネーション一致' },
  'shadowing.compareCaveat': {
    en: 'Approximate rhythm & intonation comparison — not a pronunciation grade. Compare with your ears too.',
    ko: '리듬·억양의 근사 비교예요 — 정확한 발음 평가는 아닙니다. 귀로도 함께 비교하세요.',
    es: 'Comparación aproximada de ritmo y entonación, no una calificación de pronunciación. Compara también con el oído.',
    ja: 'リズム・イントネーションのおおよその比較で、発音評価ではありません。耳でも聞き比べましょう。',
  },
  'shadowing.compareUnavailable': {
    en: "Couldn't analyze the audio on this device — you can still compare by ear.",
    ko: '이 기기에서는 오디오 분석을 못 했어요 — 귀로는 여전히 비교할 수 있습니다.',
    es: 'No se pudo analizar el audio en este dispositivo; aún puedes comparar de oído.',
    ja: 'この端末では音声を分析できませんでした — 耳では比較できます。',
  },
  'shadowing.startBeginner': { en: 'Start · Beginner', ko: '시작 · 초급', es: 'Empezar · Principiante', ja: '開始 · 初級' },
  'shadowing.startIntermediate': { en: 'Start · Intermediate', ko: '시작 · 중급', es: 'Empezar · Intermedio', ja: '開始 · 中級' },
  'shadowing.startAdvanced': { en: 'Start · Advanced', ko: '시작 · 고급', es: 'Empezar · Avanzado', ja: '開始 · 上級' },
  // 초급(최소 대립쌍 비교) 전용
  'shadowing.pairTapHint': { en: 'Tap a word to hear it', ko: '단어를 눌러 각각 들어보세요', es: 'Toca una palabra para oírla', ja: '単語をタップして聞いてみましょう' },
  'shadowing.pairAlternate': { en: 'Play alternately', ko: '번갈아 듣기', es: 'Reproducir alternando', ja: '交互に聞く' },
  'shadowing.pairStop': { en: 'Stop', ko: '정지', es: 'Detener', ja: '停止' },
  'shadowing.pairRecordPrompt': {
    en: 'Listen to the two sounds back to back, feel the difference, then say them aloud.',
    ko: '두 소리를 번갈아 듣고, 차이를 느끼며 소리 내어 따라 말해보세요.',
    es: 'Escucha los dos sonidos seguidos, siente la diferencia y dilos en voz alta.',
    ja: '2つの音を交互に聞いて違いを感じ、声に出して言ってみましょう。',
  },
  'shadowing.speak': { en: 'Tap & speak', ko: '눌러서 따라 말하기', es: 'Toca y habla', ja: 'タップして話す' },
  'shadowing.stop': { en: 'Done recording', ko: '녹음 완료', es: 'Terminar grabación', ja: '録音完了' },
  'shadowing.listening': { en: 'Recording…', ko: '녹음 중…', es: 'Grabando…', ja: '録音中…' },
  'shadowing.replay': { en: 'Play', ko: '다시 듣기', es: 'Reproducir', ja: '再生' },
  'shadowing.yourSpeech': { en: 'You said', ko: '내가 말한 것', es: 'Dijiste', ja: 'あなたの発話' },
  'shadowing.myVoice': { en: 'Hear my voice', ko: '내 목소리 듣기', es: 'Escuchar mi voz', ja: '自分の声を聞く' },
  'shadowing.savedToReview': { en: 'Saved to Review Errors', ko: '오답노트에 저장됨', es: 'Guardado en repaso', ja: '復習ノートに保存' },
  'shadowing.scoreCaveat': {
    en: 'This score reflects how well speech recognition understood you — not a precise pronunciation grade. Judge for yourself by comparing the native audio with your own recording.',
    ko: '이 점수는 음성인식이 알아들은 정도예요 — 정확한 발음 평가가 아닙니다. 원어민 음원과 내 목소리를 직접 들어보며 스스로 판단하세요.',
    es: 'Esta puntuación refleja cuánto te entendió el reconocimiento de voz, no una evaluación precisa de pronunciación. Compara el audio nativo con tu grabación y juzga por ti mismo.',
    ja: 'このスコアは音声認識がどれだけ聞き取れたかの目安で、正確な発音評価ではありません。ネイティブ音声と自分の録音を聞き比べて判断してください。',
  },
  'shadowing.compareHint': {
    en: '👂 Compare: native vs your voice',
    ko: '👂 원어민 ↔ 내 목소리 비교하기',
    es: '👂 Compara: nativo vs tu voz',
    ja: '👂 ネイティブ ↔ 自分の声を聞き比べ',
  },
  'shadowing.next': { en: 'Next', ko: '다음', es: 'Siguiente', ja: '次へ' },
  'shadowing.selfCheck': { en: 'Show the answer', ko: '문장 확인하기', es: 'Mostrar la respuesta', ja: '答えを見る' },
  'shadowing.done': { en: 'Session complete!', ko: '연습 완료!', es: '¡Sesión completada!', ja: 'セッション完了！' },
  'shadowing.avgScore': { en: 'Average pronunciation match', ko: '평균 발음 일치도', es: 'Coincidencia media de pronunciación', ja: '平均発音一致度' },
  'shadowing.again': { en: 'Practice again', ko: '다시 연습', es: 'Practicar de nuevo', ja: 'もう一度練習' },
  'shadowing.home': { en: 'Home', ko: '홈', es: 'Inicio', ja: 'ホーム' },
  'shadowing.unsupported': {
    en: "Speech scoring needs Chrome or Edge. You can still listen and self-check here.",
    ko: '발음 채점은 크롬·엣지에서 동작해요. 여기서도 듣고 스스로 확인할 수 있습니다.',
    es: 'La puntuación de voz requiere Chrome o Edge. Aún puedes escuchar y autoevaluarte aquí.',
    ja: '発音採点は Chrome・Edge で動作します。ここでも聞いて自己確認できます。',
  },

  'login.trust.summary': {
    en: 'You sign in with Google or Apple so we can show your name and save your scores and learning streak.',
    ko: '이름 표시와 점수·학습일 기록을 위해 구글·애플 계정으로 로그인합니다.',
    es: 'Inicias sesión con Google o Apple para mostrar tu nombre y guardar tus puntuaciones y racha.',
    ja: '名前の表示とスコア・学習記録の保存のために、Google・Apple アカウントでログインします。',
  },

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
  // ── Support (Ko-fi) ──
  'support.cta': {
    en: 'Enjoying the quiz? Help me make more quizzes with a coffee! ☕',
    ko: '퀴즈가 즐거우셨나요? 커피 한 잔으로 더 많은 퀴즈를 만들 수 있어요! ☕',
    es: '¿Te gusta el quiz? ¡Ayúdame a crear más quizzes con un café! ☕',
    ja: 'コーヒーでクイズ制作を応援！☕',
  },

  'auth.marketingConsent': {
    en: '(Optional) I agree to receive emails about new lessons and learning materials.',
    ko: '(선택) 신규 수업·학습 자료 소식 등 광고성 이메일 수신에 동의합니다.',
    es: '(Opcional) Acepto recibir correos sobre nuevas lecciones y materiales de aprendizaje.',
    ja: '（任意）新しいレッスンや学習資料に関するメールの受信に同意します。',
  },

  // ── Navigation ──
  'nav.game': { en: 'Games', ko: '게임', es: 'Juegos', ja: 'ゲーム' },
  'nav.grammar': { en: 'Grammar', ko: '문법 해설', es: 'Gramática', ja: '文法解説' },

  // ── Footer links ──
  'footer.about': { en: 'About', ko: '소개', es: 'Acerca de', ja: 'サービス紹介' },
  'footer.terms': { en: 'Terms of Service', ko: '이용약관', es: 'Términos de servicio', ja: '利用規約' },
  'footer.privacy': { en: 'Privacy Policy', ko: '개인정보처리방침', es: 'Política de privacidad', ja: 'プライバシーポリシー' },

  // ── Grammar articles (/grammar) ──
  'grammar.listTitle': {
    en: 'Grammar & Expressions',
    ko: '문법 & 표현',
    es: 'Gramática y Expresiones',
    ja: '文法と表現',
  },
  'grammar.listIntro': {
    en: 'Every guide below grew out of a real K-pop live moment — the same clips used in our listening quizzes. Read the explanation, then jump into the quiz to hear the grammar in an idol\'s actual voice.',
    ko: '아래 글은 모두 실제 K-pop 라이브의 한 장면에서 출발했습니다 — 듣기 퀴즈에 쓰인 바로 그 클립입니다. 해설을 읽고, 퀴즈로 넘어가 아이돌의 실제 목소리로 그 문법을 들어보세요.',
    es: 'Cada guía nació de un momento real de un directo de K-pop: los mismos clips de nuestros quizzes de escucha. Lee la explicación y luego pasa al quiz para escuchar la gramática con la voz real del idol.',
    ja: '以下のガイドはすべて、実際のK-popライブの一場面から生まれました — リスニングクイズで使われているまさにそのクリップです。解説を読んだら、クイズに進んでアイドルの実際の声でその文法を聞いてみましょう。',
  },
  'grammar.filterAll': { en: 'All', ko: '전체', es: 'Todos', ja: 'すべて' },
  'grammar.filterBeginner': { en: 'Beginner', ko: '초급', es: 'Principiante', ja: '初級' },
  'grammar.filterIntermediate': { en: 'Intermediate', ko: '중급', es: 'Intermedio', ja: '中級' },
  'grammar.guidesCount': {
    en: '{n} guides',
    ko: '{n}개의 글',
    es: '{n} guías',
    ja: '{n}件',
  },
  'grammar.keepLearning': {
    en: 'Keep learning',
    ko: '이어서 학습하기',
    es: 'Sigue aprendiendo',
    ja: '続けて学ぶ',
  },
  'grammar.hearIt': {
    en: '🎧 Hear it in a real video',
    ko: '🎧 실제 영상으로 들어보기',
    es: '🎧 Escúchalo en un video real',
    ja: '🎧 実際の動画で聞いてみよう',
  },
  'grammar.tryQuiz': {
    en: 'Try the {label} listening quiz with this exact line →',
    ko: '이 문장이 나오는 {label} 듣기 퀴즈에 도전해 보세요 →',
    es: 'Haz el quiz de escucha de {label} con esta misma frase →',
    ja: 'このセリフが出てくる{label}のリスニングクイズに挑戦 →',
  },
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
  'home.level2.rounds': { en: '5 questions · Dictation', ko: '5문제 · 받아쓰기', es: '5 preguntas · Dictado', ja: '5問 · ディクテーション' },
  'home.level3.label': { en: 'ADVANCED', ko: '고급', es: 'AVANZADO', ja: '上級' },
  'home.level3.title': { en: 'Media & Professional', ko: '미디어 & 전문', es: 'Medios y Profesional', ja: 'メディア＆プロ' },
  'home.level3.desc': {
    en: 'Master connected speech from news briefings, business meetings, and variety shows.',
    ko: '뉴스 브리핑, 비즈니스 회의, 예능 — 연결 발화를 마스터하세요.',
    es: 'Domina el habla conectada de informativos, reuniones de negocios y programas de variedades.',
    ja: 'ニュース、ビジネス会議、バラエティ番組 — 連続発話をマスターしましょう。',
  },
  'home.level3.rounds': { en: '5 questions · Dictation', ko: '5문제 · 받아쓰기', es: '5 preguntas · Dictado', ja: '5問 · ディクテーション' },

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
  'game.pronTip': { en: 'Pronunciation tip', ko: '발음 팁', es: 'Consejo de pronunciación', ja: '発音のコツ' },
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
    en: 'During the beta, every feature is free — all levels open and your progress saved.',
    ko: '베타 기간 동안 모든 기능을 무료로 이용할 수 있어요. 모든 레벨 개방 & 학습 기록 저장!',
    es: 'Durante la beta, todas las funciones son gratis: todos los niveles abiertos y tu progreso guardado.',
    ja: 'ベータ期間中はすべての機能が無料。全レベル開放＆学習記録も保存されます！',
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

  // ── Today's Mission dashboard (home) ──
  'mission.title': { en: "Today's Mission", ko: '오늘의 미션', es: 'Misión de hoy', ja: '今日のミッション' },
  'mission.goalLabel': { en: 'Daily goal', ko: '오늘 목표', es: 'Meta diaria', ja: '今日の目標' },
  'mission.goalDone': { en: 'Daily goal complete! 🎉', ko: '오늘 목표 달성! 🎉', es: '¡Meta diaria completa! 🎉', ja: '今日の目標達成！🎉' },
  'mission.editGoal': { en: 'Edit goal', ko: '목표 수정', es: 'Editar meta', ja: '目標を編集' },
  'mission.streakSafe': { en: "Nice — today's streak is secured!", ko: '좋아요 — 오늘 연속 기록을 지켰어요!', es: '¡Bien! La racha de hoy está asegurada.', ja: 'いいね — 今日の連続記録を守りました！' },
  'mission.streakAtRisk': { en: 'Practice today to keep your {n}-day streak', ko: '오늘 학습하면 {n}일 연속을 이어가요', es: 'Practica hoy para mantener tu racha de {n} días', ja: '今日学習して{n}日連続を続けましょう' },
  'mission.startStreak': { en: 'Finish one lesson to start a streak', ko: '오늘 첫 학습으로 연속 기록을 시작하세요', es: 'Completa una lección para iniciar una racha', ja: '最初の学習で連続記録を始めましょう' },
  'mission.freezeAvail': { en: 'Freeze ×{n}', ko: '프리즈 {n}개', es: 'Congelar ×{n}', ja: 'フリーズ×{n}' },
  'mission.freezeUsed': { en: 'A freeze covered your missed day 🧊', ko: '🧊 빠진 하루를 프리즈로 지켰어요', es: 'Un congelador cubrió tu día perdido 🧊', ja: '🧊 休んだ日をフリーズで守りました' },
  'mission.freezeTip': { en: 'A missed day is auto-forgiven while you have a freeze.', ko: '프리즈가 있으면 하루 빠져도 스트릭이 자동으로 유지돼요.', es: 'Un día perdido se perdona automáticamente si tienes un congelador.', ja: 'フリーズがあれば1日休んでも連続記録は自動で維持されます。' },
  'mission.cardNew': { en: 'New lesson', ko: '새 학습', es: 'Nueva lección', ja: '新しい学習' },
  'mission.cardNewDesc': { en: 'Pick a level to start', ko: '초·중·고급 중 선택', es: 'Elige un nivel', ja: '初・中・上級から選ぶ' },
  'mission.cardReview': { en: 'Review', ko: '복습', es: 'Repaso', ja: '復習' },
  'mission.cardReviewDesc': { en: '{n} cards to review', ko: '복습할 카드 {n}개', es: '{n} tarjetas por repasar', ja: '復習カード{n}枚' },
  'mission.cardReviewEmpty': { en: 'All caught up', ko: '복습할 카드 없음', es: 'Todo al día', ja: '復習は完了' },
  'mission.cardShadow': { en: 'Shadowing', ko: '섀도잉', es: 'Shadowing', ja: 'シャドーイング' },
  'mission.cardShadowDesc': { en: 'Listen and repeat aloud', ko: '듣고 따라 말하기', es: 'Escucha y repite', ja: '聞いて繰り返す' },
  'mission.reminderOn': { en: 'Reminder on · daily {h}:00', ko: '리마인더 켜짐 · 매일 {h}시', es: 'Recordatorio activado · {h}:00 diario', ja: 'リマインダーON · 毎日{h}時' },
  'mission.reminderOff': { en: 'Get an evening reminder', ko: '저녁 리마인더 받기', es: 'Recibir un recordatorio nocturno', ja: '夜のリマインダーを受け取る' },

  // ── Daily goal editor ──
  'goal.title': { en: 'Set your daily goal', ko: '하루 목표 설정', es: 'Fija tu meta diaria', ja: '1日の目標を設定' },
  'goal.desc': { en: 'How many lesson sets will you finish each day?', ko: '하루에 완료할 학습 세트 수를 정하세요.', es: '¿Cuántos sets de lecciones completarás al día?', ja: '1日に完了する学習セット数を決めましょう。' },
  'goal.unit': { en: 'sets / day', ko: '세트 / 일', es: 'sets / día', ja: 'セット / 日' },
  'goal.tip': { en: 'Start light — raise it once the habit sticks.', ko: '부담 없이 시작해서 익숙해지면 늘려보세요.', es: 'Empieza ligero y súbela cuando el hábito se afiance.', ja: '無理なく始めて、慣れたら増やしましょう。' },
  'goal.save': { en: 'Save', ko: '저장', es: 'Guardar', ja: '保存' },

  // ── Reminder (FCM push) settings ──
  'reminder.title': { en: 'Study reminder', ko: '학습 리마인더', es: 'Recordatorio de estudio', ja: '学習リマインダー' },
  'reminder.desc': { en: 'On days you have not met your goal, we send a nudge at your chosen time.', ko: '목표를 아직 못 채운 날, 설정한 시각에 알림을 보내드려요.', es: 'Los días que no cumplas tu meta, te avisamos a la hora elegida.', ja: '目標未達成の日に、設定した時刻にお知らせします。' },
  'reminder.time': { en: 'Reminder time', ko: '알림 시각', es: 'Hora del recordatorio', ja: '通知時刻' },
  'reminder.enable': { en: 'Turn on reminder', ko: '리마인더 켜기', es: 'Activar recordatorio', ja: 'リマインダーをON' },
  'reminder.disable': { en: 'Turn off reminder', ko: '리마인더 끄기', es: 'Desactivar recordatorio', ja: 'リマインダーをOFF' },
  'reminder.enabling': { en: 'Turning on…', ko: '켜는 중…', es: 'Activando…', ja: 'オンにしています…' },
  'reminder.enabledMsg': { en: 'Reminder is on!', ko: '리마인더가 켜졌어요!', es: '¡Recordatorio activado!', ja: 'リマインダーがONになりました！' },
  'reminder.note': { en: 'Sent at most once a day, and only if your goal is unmet.', ko: '알림은 목표 미달성 시에만, 하루 한 번 발송돼요.', es: 'Se envía como máximo una vez al día, solo si tu meta no se cumple.', ja: '目標未達成の日のみ、1日1回だけ送信されます。' },
  'reminder.denied': { en: 'Notifications are blocked. Allow them in your browser settings, then try again.', ko: '브라우저에서 알림이 차단되어 있어요. 설정에서 알림을 허용한 뒤 다시 시도해 주세요.', es: 'Las notificaciones están bloqueadas. Actívalas en la configuración del navegador e inténtalo de nuevo.', ja: '通知がブロックされています。ブラウザ設定で許可してから再試行してください。' },
  'reminder.unsupported': { en: 'Push notifications are not supported here. Add the app to your home screen and try again.', ko: '이 브라우저는 푸시 알림을 지원하지 않아요. 앱을 홈 화면에 추가한 뒤 사용해 주세요.', es: 'Aquí no se admiten notificaciones push. Añade la app a tu pantalla de inicio e inténtalo.', ja: 'この環境ではプッシュ通知に対応していません。アプリをホーム画面に追加してお試しください。' },
  'reminder.noVapid': { en: 'Reminders are not fully configured yet. Please check back soon.', ko: '리마인더 설정이 아직 완료되지 않았어요. 곧 다시 확인해 주세요.', es: 'Los recordatorios aún no están configurados. Vuelve pronto.', ja: 'リマインダーの設定がまだ完了していません。少し後にお試しください。' },
  'reminder.error': { en: "Couldn't turn on the reminder. Please try again later.", ko: '리마인더를 켜지 못했어요. 잠시 후 다시 시도해 주세요.', es: 'No se pudo activar el recordatorio. Inténtalo más tarde.', ja: 'リマインダーをオンにできませんでした。後で再試行してください。' },

  // ── Personal Review (spaced repetition) ──
  'review.navLabel': { en: 'Review', ko: '개인 복습', es: 'Repaso', ja: '復習' },
  'review.title': { en: 'Personal Review', ko: '개인 복습', es: 'Repaso personal', ja: '個人復習' },
  'review.subtitle': { en: 'Meet the words you missed again — spaced out so they stick.', ko: '틀린 표현을 간격을 두고 다시 만나 오래 기억하세요.', es: 'Reencuentra las palabras que fallaste, espaciadas para recordarlas.', ja: '間違えた表現を間隔をあけて再会し、長く記憶しましょう。' },
  'review.dueFmt': { en: '{n} cards due', ko: '복습할 카드 {n}개', es: '{n} tarjetas pendientes', ja: '復習カード{n}枚' },
  'review.allClear': { en: 'Nothing to review right now. Great work!', ko: '지금은 복습할 카드가 없어요. 잘하고 있어요!', es: 'Nada que repasar ahora. ¡Buen trabajo!', ja: '今は復習するカードがありません。よくできました！' },
  'review.start': { en: 'Start review →', ko: '복습 시작 →', es: 'Empezar repaso →', ja: '復習を始める →' },
  'review.reveal': { en: 'Show answer', ko: '정답 보기', es: 'Ver respuesta', ja: '答えを見る' },
  'review.gradeAgain': { en: 'Again', ko: '다시', es: 'Otra vez', ja: 'もう一度' },
  'review.gradeGood': { en: 'Good', ko: '알맞음', es: 'Bien', ja: '普通' },
  'review.gradeEasy': { en: 'Easy', ko: '쉬움', es: 'Fácil', ja: '簡単' },
  'review.gradePrompt': { en: 'How well did you remember?', ko: '얼마나 잘 기억했나요?', es: '¿Qué tan bien lo recordaste?', ja: 'どれくらい覚えていましたか？' },
  'review.promptWord': { en: 'Do you remember this expression?', ko: '이 표현을 기억하나요?', es: '¿Recuerdas esta expresión?', ja: 'この表現を覚えていますか？' },
  'review.promptContext': { en: 'What word fills the blank?', ko: '빈칸에 들어갈 표현은?', es: '¿Qué palabra va en el espacio?', ja: '空欄に入る表現は？' },
  'review.promptShadow': { en: 'Say this sentence aloud, then check.', ko: '이 문장을 소리 내어 따라 말하고 확인하세요.', es: 'Di esta frase en voz alta y comprueba.', ja: 'この文を声に出して言ってから確認しましょう。' },
  'review.answer': { en: 'Answer', ko: '정답', es: 'Respuesta', ja: '正解' },
  'review.sessionDone': { en: 'Review complete!', ko: '복습 완료!', es: '¡Repaso completo!', ja: '復習完了！' },
  'review.reviewedFmt': { en: '{n} cards reviewed', ko: '카드 {n}개 복습', es: '{n} tarjetas repasadas', ja: 'カード{n}枚を復習' },
  'review.finish': { en: 'Finish', ko: '마치기', es: 'Terminar', ja: '終了' },
  'review.allRecords': { en: 'All error records', ko: '전체 오답 기록', es: 'Todos los errores', ja: 'すべての誤答記録' },
  'review.progressFmt': { en: '{done} / {total}', ko: '{done} / {total}', es: '{done} / {total}', ja: '{done} / {total}' },

  // ── Common ──
  'common.ok': { en: 'OK', ko: '확인', es: 'Aceptar', ja: 'OK' },
  'common.cancel': { en: 'Cancel', ko: '취소', es: 'Cancelar', ja: 'キャンセル' },

  // ── Account deletion (인앱 회원 탈퇴 — GDPR/Play/Apple) ──
  'account.delete': { en: 'Delete account', ko: '계정 삭제', es: 'Eliminar cuenta', ja: 'アカウント削除' },
  'account.deleteTitle': { en: 'Delete your account?', ko: '계정을 삭제할까요?', es: '¿Eliminar tu cuenta?', ja: 'アカウントを削除しますか？' },
  'account.deleteBody': {
    en: 'This permanently deletes your account and all associated data (streak, nickname, progress). This cannot be undone. Local review notes stored on this device are cleared separately from your browser.',
    ko: '계정과 관련된 모든 데이터(스트릭·닉네임·학습 기록)가 영구 삭제됩니다. 되돌릴 수 없습니다. 이 기기에 저장된 오답노트는 브라우저 데이터에서 별도로 삭제됩니다.',
    es: 'Esto elimina permanentemente tu cuenta y todos los datos asociados (racha, apodo, progreso). No se puede deshacer. Las notas de repaso locales de este dispositivo se borran por separado desde tu navegador.',
    ja: 'アカウントと関連データ（連続記録・ニックネーム・学習履歴）が完全に削除されます。元に戻せません。この端末に保存された復習ノートはブラウザから別途削除されます。',
  },
  'account.deleteAck': {
    en: 'I understand this is permanent.',
    ko: '영구 삭제됨을 이해했습니다.',
    es: 'Entiendo que es permanente.',
    ja: '完全に削除されることを理解しました。',
  },
  'account.deleteConfirm': { en: 'Delete permanently', ko: '영구 삭제', es: 'Eliminar', ja: '完全に削除' },
  'account.deleting': { en: 'Deleting…', ko: '삭제 중…', es: 'Eliminando…', ja: '削除中…' },
  'account.deleteError': {
    en: 'Could not delete your account. You may need to sign in again, then retry.',
    ko: '계정을 삭제하지 못했습니다. 다시 로그인한 뒤 재시도해 주세요.',
    es: 'No se pudo eliminar tu cuenta. Es posible que debas iniciar sesión de nuevo y reintentar.',
    ja: 'アカウントを削除できませんでした。再度ログインしてからもう一度お試しください。',
  },

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
  'hub.title': { en: 'Listening Games', ko: '듣기 게임', es: 'Juegos de escucha', ja: 'リスニングゲーム' },
  'hub.subtitle': {
    en: 'Take on word-match, dictation, and video listening quizzes by level',
    ko: '레벨별 단어 맞히기와 받아쓰기, 영상 듣기 퀴즈에 도전하세요',
    es: 'Enfréntate a juegos de palabras, dictado y quizzes de video por nivel',
    ja: 'レベル別に単語当て・ディクテーション・動画リスニングに挑戦しよう',
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

  // ── Bottom tab bar ──
  'nav.home': { en: 'Home', ko: '홈', es: 'Inicio', ja: 'ホーム' },
  'nav.review': { en: 'Review', ko: '복습', es: 'Repaso', ja: '復習' },
  'nav.profile': { en: 'Profile', ko: '프로필', es: 'Perfil', ja: 'プロフィール' },

  // ── Today's Plan (홈 · 오늘의 계획) ──
  'plan.title': { en: "Today's Plan", ko: '오늘의 계획', es: 'Plan de hoy', ja: '今日のプラン' },
  'plan.chooseTitle': { en: 'Choose your level', ko: '레벨을 골라주세요', es: 'Elige tu nivel', ja: 'レベルを選ぼう' },
  'plan.levelPrompt': { en: 'Level for today', ko: '오늘 학습할 레벨', es: 'Nivel de hoy', ja: '今日のレベル' },
  'plan.beginnerSub': { en: 'Beginner — pick a star level to start', ko: '초급 세부 레벨 — 별 개수를 골라 시작', es: 'Principiante — elige nivel de estrellas', ja: '初級 — 星の数を選んで開始' },
  'plan.beginnerSubHint': { en: 'Higher levels continue after', ko: '이후 레벨은 이어서 진행돼요', es: 'Los niveles siguientes continúan después', ja: '以降のレベルは続けて進みます' },
  'plan.blankSub': { en: 'Pick how many blanks to fill', ko: '빈칸 개수를 골라 시작', es: 'Elige cuántos espacios llenar', ja: '空欄の数を選んで開始' },
  'plan.blank1': { en: '1 blank · Easy', ko: '빈칸 1개 · EASY', es: '1 espacio · Fácil', ja: '空欄1つ · EASY' },
  'plan.blank2': { en: '2 blanks · Hard', ko: '빈칸 2개 · HARD', es: '2 espacios · Difícil', ja: '空欄2つ · HARD' },
  'plan.gameLevelFmt': { en: 'Level {n}', ko: '레벨 {n}', es: 'Nivel {n}', ja: 'レベル {n}' },
  'plan.gameLevel4': { en: 'Level 4 · Boss', ko: '레벨 4 · 보스', es: 'Nivel 4 · Jefe', ja: 'レベル4 · ボス' },
  'plan.stepVideo': { en: 'Finish 1 video', ko: '영상 1개 완료', es: 'Termina 1 video', ja: '動画を1本完了' },
  'plan.stepVideoDesc': { en: 'Pick a video from the K-Stars list and finish one quiz', ko: 'K-Stars 목록에서 원하는 영상을 골라 퀴즈 1개 완료', es: 'Elige un video de K-Stars y completa un quiz', ja: 'K-Starsの一覧から動画を選んでクイズを1つ完了' },
  'plan.stepGameDesc': { en: 'Catch the sounds at your chosen level', ko: '선택한 레벨로 소리를 잡아요', es: 'Atrapa los sonidos en tu nivel', ja: '選んだレベルで音を捉えよう' },
  'plan.badgeNow': { en: 'Now', ko: '지금', es: 'Ahora', ja: '今' },
  'plan.badgeDone': { en: 'Done', ko: '완료', es: 'Hecho', ja: '完了' },
  'plan.badgeLocked': { en: 'Locked', ko: '잠김', es: 'Bloqueado', ja: 'ロック' },
  'plan.ctaGame': { en: 'Start', ko: '시작하기', es: 'Empezar', ja: '始める' },
  'plan.ctaVideo': { en: 'Pick a video', ko: '영상 고르기', es: 'Elegir video', ja: '動画を選ぶ' },
  'plan.ctaReview': { en: 'Review', ko: '복습하기', es: 'Repasar', ja: '復習する' },
  'plan.optional': { en: 'Optional · anytime', ko: '옵션 · 언제든', es: 'Opcional · cuando quieras', ja: '任意 · いつでも' },
  'plan.nextFmt': { en: 'Next: {s}', ko: '다음: {s}', es: 'Siguiente: {s}', ja: '次: {s}' },
  'plan.allDone': { en: "Today's plan complete! 🎉", ko: '오늘의 계획 완료! 🎉', es: '¡Plan de hoy completo! 🎉', ja: '今日のプラン完了！🎉' },
  'plan.allDoneSub': { en: 'Great work — see you tomorrow.', ko: '잘했어요 — 내일 또 만나요.', es: '¡Buen trabajo! Hasta mañana.', ja: 'お疲れさま — また明日。' },
  'plan.changeLevel': { en: 'Change level', ko: '레벨 변경', es: 'Cambiar nivel', ja: 'レベル変更' },
  'plan.startShort': { en: 'Start', ko: '시작', es: 'Inicio', ja: '開始' },

  // ── Profile (/profile) ──
  'profile.sectionLearning': { en: 'Learning', ko: '학습 설정', es: 'Aprendizaje', ja: '学習設定' },
  'profile.sectionMore': { en: 'More', ko: '더보기', es: 'Más', ja: 'もっと見る' },
  'profile.sectionAccount': { en: 'Account', ko: '계정', es: 'Cuenta', ja: 'アカウント' },
  'profile.editGoal': { en: 'Edit daily goal', ko: '하루 목표 수정', es: 'Editar meta diaria', ja: '1日の目標を編集' },
  'profile.reminder': { en: 'Study reminder', ko: '학습 리마인더', es: 'Recordatorio de estudio', ja: '学習リマインダー' },
  'profile.language': { en: 'Language', ko: '언어', es: 'Idioma', ja: '言語' },
  'profile.youtube': { en: 'YouTube channel', ko: '유튜브 채널', es: 'Canal de YouTube', ja: 'YouTubeチャンネル' },
  'profile.streakLabel': { en: 'Streak', ko: '연속', es: 'Racha', ja: '連続' },
  'profile.planLabel': { en: 'Today', ko: '오늘 계획', es: 'Hoy', ja: '今日' },

  // ── On-screen Korean keyboard ──
  'kbd.open': { en: 'Open Korean keyboard', ko: '한국어 타자기 열기', es: 'Abrir teclado coreano', ja: '韓国語キーボードを開く' },
  'kbd.close': { en: 'Close Korean keyboard', ko: '한국어 타자기 닫기', es: 'Cerrar teclado coreano', ja: '韓国語キーボードを閉じる' },
  'kbd.title': { en: 'Korean keyboard', ko: '한국어 타자기', es: 'Teclado coreano', ja: '韓国語キーボード' },
  'kbd.shiftHint': { en: 'double consonants', ko: '쌍자음', es: 'consonantes dobles', ja: '濃音' },
  'kbd.space': { en: 'space', ko: '공백', es: 'espacio', ja: '空白' },
  'kbd.done': { en: 'Done', ko: '입력 완료', es: 'Listo', ja: '完了' },
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
