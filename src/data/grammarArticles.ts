// src/data/grammarArticles.ts
// 문법·표현 해설 아티클 데이터 (/grammar, /grammar/:slug)
//   · 원천은 hardcodedQuizzes.ts 에 있는 선생님의 실제 퀴즈 해설 — 각 글이 해당 퀴즈로
//     연결되어 "읽기 → 듣기 연습" 동선을 만든다 (내부 링크는 SEO 에도 유리).
//   · 본문은 영어(글로벌 학습자 대상) + 한국어 예문. UI 언어와 무관하게 고정.

export interface ArticleExample {
  ko: string
  en: string
  note?: string
}

/** 한 섹션 안에서 문단과 예문 묶음을 원하는 순서로 교차 배치하기 위한 블록 */
export type ArticleBlock =
  | { text: string }                 // 문단
  | { examples: ArticleExample[] }   // 예문 묶음(불릿)

export interface ArticleSection {
  heading: string
  /** 문단 → 예문(한 번) 순서로만 렌더되는 기존 방식. 신규 글은 blocks 를 권장. */
  paragraphs?: string[]
  examples?: ArticleExample[]
  /** 있으면 paragraphs/examples 대신 이 순서대로 렌더 — 문단·예문을 여러 번 교차 배치 가능 */
  blocks?: ArticleBlock[]
}

export interface GrammarArticle {
  slug: string
  title: string
  pattern: string
  meaning: string
  level: 'beginner' | 'intermediate'
  summary: string
  sections: ArticleSection[]
  /** 이 문법이 실제로 나오는 K-Artist Live 퀴즈 */
  quiz?: { videoId: string; label: string; sentence: string }
  related: string[]
}

export const GRAMMAR_ARTICLES: GrammarArticle[] = [
  {
    slug: 'lets-do-it-ja',
    title: 'Korean -자 Ending: How to Say "Let\'s..." Like a Native',
    pattern: 'Verb + -자',
    meaning: "Let's (do something)",
    level: 'beginner',
    summary:
      'The casual -자 ending is how Korean friends suggest doing something together. Learn how to form it, when it is safe to use, and hear BTS use it in a real live video.',
    sections: [
      {
        heading: 'What -자 does',
        blocks: [
          { text: 'Attach -자 to a verb stem and you get the Korean equivalent of "let\'s". It is one of the first endings you will actually hear in K-pop lives, variety shows, and casual talk between friends.' },
          { examples: [
            { ko: '먹다 → 먹자', en: "Let's eat" },
            { ko: '가다 → 가자', en: "Let's go" },
            { ko: '놀다 → 놀자', en: "Let's hang out" },
          ] },
          { text: 'Because -자 is casual speech (반말), it is used with friends, people younger than you, or people you are close to. To make the same suggestion politely, Koreans switch to -아/어요 or -(으)ㄹ까요? instead.' },
          { examples: [
            { ko: '같이 먹어요.', en: "Let's eat together. (polite)" },
            { ko: '같이 먹을까요?', en: 'Shall we eat together? (polite)' },
          ] },
        ],
      },
      {
        heading: 'How to form it',
        blocks: [
          { text: 'Take the verb stem (the dictionary form minus 다) and add -자. There are no sound changes to worry about — this one is refreshingly simple.' },
          { examples: [
            { ko: '만나다 → 만나자', en: "Let's meet" },
            { ko: '공부하다 → 공부하자', en: "Let's study" },
            { ko: '시작하다 → 시작하자', en: "Let's start" },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'You will very often hear 같이 (together) right before the verb: 같이 먹자 (let\'s eat together). Adding 같이 makes the invitation feel warmer, even though -자 already implies doing something together.' },
          { examples: [
            { ko: '피자 같이 먹자!', en: "Let's have pizza together!" },
            { ko: '주말에 영화 보자.', en: "Let's watch a movie this weekend." },
            { ko: '이따가 전화하자.', en: "Let's talk on the phone later." },
          ] },
          { text: 'One caution: never use -자 with someone you should speak politely to — a teacher, a stranger, someone older. It will sound rude rather than friendly.' },
        ],
      },
    ],
    quiz: { videoId: 'wu6bA3zK_us', label: 'BTS live', sentence: '야,야. 피자 같이 먹자' },
    related: ['ill-do-it-lgeyo', 'if-when-myeon', 'meal-expressions-jal-meokgetseumnida'],
  },
  {
    slug: 'ill-do-it-lgeyo',
    title: '-(으)ㄹ게요: The Korean "I\'ll..." That Shows You Care',
    pattern: 'Verb + -(으)ㄹ게요',
    meaning: "I'll... (promise / offer made on the spot)",
    level: 'beginner',
    summary:
      'Why do idols say 할게요 instead of 할 거예요? -(으)ㄹ게요 is a promise made for the listener\'s benefit. Learn the difference and hear it in BTS and ATEEZ lives.',
    sections: [
      {
        heading: 'What -(으)ㄹ게요 does',
        blocks: [
          { text: '-(으)ㄹ게요 expresses a decision, promise, or offer that the speaker makes at the moment of speaking, usually in response to the listener or the situation. That "in response to you" nuance is the key: 먼저 갈게요 means "I\'ll head out first (letting you know, considering you)".' },
          { text: 'This is different from -(으)ㄹ 거예요, which states a plan neutrally. Compare the same action said two ways:' },
          { examples: [
            { ko: '운동할 거예요.', en: "I'm going to work out. (a neutral plan)" },
            { ko: '운동할게요.', en: "I'll work out. (a promise / reacting to you)" },
          ] },
          { text: 'Korean speakers pick between them constantly without thinking — and it is one of the details that makes your Korean sound natural.' },
        ],
      },
      {
        heading: 'How to form it',
        blocks: [
          { text: 'Verb stems ending in a vowel or ㄹ take -ㄹ게요; stems ending in other consonants take -을게요. In casual speech, drop 요: 갈게, 먹을게.' },
          { examples: [
            { ko: '하다 → 할게요', en: "I'll do it" },
            { ko: '가다 → 갈게요', en: "I'll go" },
            { ko: '먹다 → 먹을게요', en: "I'll eat" },
            { ko: '기다리다 → 기다릴게요', en: "I'll wait" },
            { ko: '잡다 → 잡을게요', en: "I'll grab (it)" },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'Listen for it whenever an idol reacts to a comment or coordinates with members: 자리 잡을게요 (I\'ll grab us seats), 신호 주시면 할게요 (I\'ll start when you give the signal). The pattern always involves the listener somehow — that is what separates it from a plain future tense.' },
          { examples: [
            { ko: '제가 할게요.', en: "I'll do it (don't worry)." },
            { ko: '먼저 갈게요.', en: "I'll head out first." },
            { ko: '오늘부터 운동할게요.', en: "I'll start working out today (I promise)." },
          ] },
          { text: 'Pronunciation tip: -ㄹ게요 is pronounced [ㄹ께요] — 할게요 sounds like 할께요. The spelling stays 게, but the sound is tense.' },
        ],
      },
    ],
    quiz: { videoId: 'wu6bA3zK_us', label: 'BTS live', sentence: '자, 저희 먼저 자리 잡을게요.' },
    related: ['polite-promise-dorok', 'lets-do-it-ja', 'i-wish-eumyeon-joketda'],
  },
  {
    slug: 'i-wish-eumyeon-joketda',
    title: '-았/었으면 좋겠다: How to Say "I Wish" in Korean',
    pattern: 'Verb/Adjective + -았/었으면 좋겠다',
    meaning: 'I wish... / I hope... / It would be nice if...',
    level: 'intermediate',
    summary:
      'Korean uses a past-tense form to express wishes about the future — and it confuses almost every learner. Here is why 좋겠다 works that way, with examples from a BTS live.',
    sections: [
      {
        heading: 'What -았/었으면 좋겠다 does',
        blocks: [
          { text: 'This pattern expresses a wish or hope. Literally it reads "if (it) had happened, it would be good" — Korean borrows the past tense to mark the situation as imagined rather than real, similar to how English says "I wish it WERE weekend."' },
          { examples: [
            { ko: '시험에 합격했으면 좋겠어요.', en: 'I hope I pass the exam.' },
          ] },
          { text: 'The good news: you do not need to analyze it every time. Treat -았/었으면 좋겠다 as a single chunk meaning "I wish / I hope," and it will serve you in almost any situation.' },
        ],
      },
      {
        heading: 'How to form it',
        blocks: [
          { text: 'Conjugate the verb or adjective into its past base (-았/었), add -으면 (if), then 좋겠다. In polite speech: 좋겠어요.' },
          { examples: [
            { ko: '비가 안 왔으면 좋겠어요.', en: "I hope it doesn't rain." },
            { ko: '날씨가 좋았으면 좋겠어요.', en: 'I hope the weather is nice.' },
            { ko: '얼른 만났으면 좋겠어요.', en: 'I wish we could meet soon.' },
            { ko: '콘서트에 갔으면 좋겠어요.', en: 'I wish I could go to the concert.' },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'In the BTS live this article comes from, the members are drawing teams for a game and one says 같은 팀이 걸렸으면 좋겠다 — "I hope we end up on the same team." (같은 팀이 걸리다 is itself a useful chunk: "to be drawn onto the same team.")' },
          { examples: [
            { ko: '같은 팀이 걸렸으면 좋겠다.', en: 'I hope we end up on the same team.' },
          ] },
          { text: 'You may also hear the present-tense version -(으)면 좋겠다 (좋으면 좋겠다). The past-tense version is slightly stronger and more common in speech, but both are correct and natural.' },
        ],
      },
    ],
    quiz: { videoId: 'wu6bA3zK_us', label: 'BTS live', sentence: '지민아, 같은 팀이 걸렸으면 좋겠다.' },
    related: ['if-when-myeon', 'it-seems-geot-gatda', 'ill-do-it-lgeyo'],
  },
  {
    slug: 'it-seems-geot-gatda',
    title: '것 같다: The Softener Koreans Use in Every Conversation',
    pattern: 'Verb/Adjective + -(으)ㄴ/는/(으)ㄹ 것 같다',
    meaning: 'I think... / It seems... / It looks like...',
    level: 'beginner',
    summary:
      '것 같다 is everywhere in spoken Korean — not because Koreans are unsure, but because it softens opinions. Learn the three tense forms and hear them in real K-pop lives.',
    sections: [
      {
        heading: 'What 것 같다 does',
        blocks: [
          { text: '것 같다 expresses a guess, opinion, or impression — "I think..." / "it seems...".' },
          { examples: [
            { ko: '비 오는 것 같아요.', en: "I think it's raining." },
          ] },
          { text: 'But its real job in conversation is softening. Saying 맛있는 것 같아요 ("it seems tasty") instead of 맛있어요 ("it\'s tasty") makes an opinion sound less assertive and more polite — which is why you hear it constantly, even when the speaker is completely sure.' },
        ],
      },
      {
        heading: 'Three forms, three times',
        blocks: [
          { text: 'The form before 것 같다 tells you the time of the guess: -는 것 같다 for present actions, -(으)ㄴ 것 같다 for completed actions or adjective states, and -(으)ㄹ 것 같다 for the future or pure speculation.' },
          { examples: [
            { ko: '비 오는 것 같아요.', en: "I think it's raining. (now)" },
            { ko: '이미 진 것 같은데!?', en: 'I think we already lost! (completed)' },
            { ko: '많이 바쁜 것 같아요.', en: 'They seem very busy. (state)' },
            { ko: '재미있을 것 같아요.', en: 'It looks like it will be fun. (future)' },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'In fast speech, 것 contracts: 것 같아요 → 거 같아요. You will see both spellings in subtitles; 거 같아요 reflects the actual sound. Jin says 마음이 편안해지고 따뜻해지는 거 같아요 ("I feel like my heart gets calm and warm") — a classic present-tense 것 같다 wrapped in natural pronunciation.' },
          { examples: [
            { ko: '마음이 편안해지고 따뜻해지는 거 같아요.', en: 'I feel like my heart gets calm and warm.' },
          ] },
          { text: 'Try this habit: whenever you state an opinion in Korean, ask yourself if a native would soften it with 것 같아요. More often than not, the answer is yes.' },
        ],
      },
    ],
    quiz: { videoId: 'ADw_zMarJdk', label: 'Jin (RunSeokjin) live', sentence: '너무 재미있을 것 같습니다.' },
    related: ['background-neunde', 'turning-verbs-into-nouns', 'i-wish-eumyeon-joketda'],
  },
  {
    slug: 'if-when-myeon',
    title: '-(으)면: Korean If-Clauses Made Simple',
    pattern: 'Verb/Adjective + -(으)면',
    meaning: 'if... / when...',
    level: 'beginner',
    summary:
      'One ending covers both "if" and "when" in Korean. Learn how -(으)면 works, how to tell the two meanings apart, and hear Jin use it in a live broadcast.',
    sections: [
      {
        heading: 'What -(으)면 does',
        blocks: [
          { text: '-(으)면 attaches to the first clause of a sentence and marks it as a condition: 시간이 있으면 만나요 = "If you have time, let\'s meet." Korean does not distinguish "if" from "when" here — 봄이 오면 can mean "when spring comes" (certain) or "if spring comes" (hypothetical). Context does the work English grammar does.' },
          { examples: [
            { ko: '시간이 있으면 만나요.', en: "Let's meet if you have time." },
            { ko: '한국에 가면 뭐 하고 싶어요?', en: 'What do you want to do when you go to Korea?' },
          ] },
        ],
      },
      {
        heading: 'How to form it',
        blocks: [
          { text: 'Stems ending in a vowel or ㄹ take -면; stems ending in other consonants take -으면.' },
          { examples: [
            { ko: '있다 → 있으면', en: 'if there is / if you have' },
            { ko: '오다 → 오면', en: 'if (it) comes' },
            { ko: '먹다 → 먹으면', en: 'if (you) eat' },
            { ko: '만들다 → 만들면', en: 'if (you) make' },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'Jin says 우리 아미 여러분들하고 있으면 마음이 편안해지고 따뜻해지는 거 같아요 — "When I\'m with you ARMY, I feel calm and warm." Note how -(으)면 here is clearly "when(ever)," not a hypothetical "if." This whenever-meaning is extremely common in everyday speech.' },
          { text: 'A useful contrast: -(으)면 states a condition, while -(으)니까 states a reason.' },
          { examples: [
            { ko: '비가 오면 안 갈 거예요.', en: "If it rains, I won't go. (condition)" },
            { ko: '비가 오니까 안 갈 거예요.', en: "Because it's raining, I won't go. (reason)" },
          ] },
        ],
      },
    ],
    quiz: { videoId: 'ADw_zMarJdk', label: 'Jin (RunSeokjin) live', sentence: '우리 아미 여러분들하고 있으면' },
    related: ['i-wish-eumyeon-joketda', 'because-geodeun', 'lets-do-it-ja'],
  },
  {
    slug: 'after-doing-go-naseo',
    title: '-고 나서: Saying "After Doing..." in Korean',
    pattern: 'Verb + -고 나서',
    meaning: 'after doing...',
    level: 'beginner',
    summary:
      'Sequence two actions clearly with -고 나서. Learn how it differs from plain -고, and hear Jin use it while talking about his movie-watching habits.',
    sections: [
      {
        heading: 'What -고 나서 does',
        blocks: [
          { text: '-고 나서 links two actions and stresses that the first one finishes before the second begins: 밥을 먹고 나서 공부했어요 = "I studied after eating." The 나서 part comes from 나다, adding a sense of completion — "having finished eating, I studied."' },
          { text: 'Plain -고 also sequences actions (밥을 먹고 공부했어요), but it is looser — it can just list actions. Use -고 나서 when the "after finishing" order matters.' },
        ],
      },
      {
        heading: 'How to form it',
        blocks: [
          { text: 'Attach -고 나서 to any verb stem. No sound changes.' },
          { examples: [
            { ko: '먹다 → 먹고 나서', en: 'after eating' },
            { ko: '보다 → 보고 나서', en: 'after watching' },
            { ko: '끝나다 → 끝나고 나서', en: 'after (it) ends' },
            { ko: '운동하다 → 운동하고 나서', en: 'after working out' },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'Jin says 영화 다 보고 나서 인증 샷 같은 거 찍거든요 — "After finishing a movie, I take a proof-shot photo, you see." Notice 다 (all/completely) before the verb, reinforcing the completion that -고 나서 already implies: "after watching it all the way through."' },
          { examples: [
            { ko: '밥을 먹고 나서 공부했어요.', en: 'I studied after eating.' },
            { ko: '숙제를 하고 나서 놀 거예요.', en: "I'll play after doing my homework." },
            { ko: '콘서트가 끝나고 나서 뭐 했어요?', en: 'What did you do after the concert ended?' },
          ] },
          { text: '인증샷 (proof shot) is itself a fun word to know: the photo you take to prove you did something — finished a movie, visited a café, attended a concert.' },
        ],
      },
    ],
    quiz: { videoId: 'ADw_zMarJdk', label: 'Jin (RunSeokjin) live', sentence: '영화 다 보고 나서 인증 샷 같은 거 찍거든요' },
    related: ['because-geodeun', 'if-when-myeon', 'korean-word-order-sov'],
  },
  {
    slug: 'because-geodeun',
    title: '-거든(요): The Storytelling Ending Textbooks Skip',
    pattern: 'Verb/Adjective + -거든(요)',
    meaning: 'because... / you see... / the thing is...',
    level: 'intermediate',
    summary:
      '-거든요 gives a reason the listener did not know — "you see, ...". It is everywhere in K-pop lives and dramas but rarely taught well. Learn its two jobs with ATEEZ examples.',
    sections: [
      {
        heading: 'What -거든(요) does',
        blocks: [
          { text: '-거든(요) marks information as new to the listener, usually as a reason or background for what you just said or are about to say: 어제 늦게 잤거든 — "(the thing is) I went to bed late last night." The nuance is "you don\'t know this yet, so I\'m telling you."' },
          { text: 'It also works as a story-opener. Koreans often start an anecdote with -거든요 and then continue: 제가 어제 영화를 봤거든요. 그런데... ("So I watched a movie yesterday, right? And then..."). The listener hears -거든요 and knows more is coming.' },
        ],
      },
      {
        heading: 'How to form it',
        blocks: [
          { text: 'Attach -거든 (casual) or -거든요 (polite) to any verb or adjective stem, in any tense: 먹거든요, 먹었거든요, 먹을 거거든요.' },
          { examples: [
            { ko: '운동을 진짜 열심히 했거든.', en: 'I worked out really hard, you see.' },
            { ko: '사실 나는 아침을 잘 안 먹거든.', en: "Actually, I don't usually eat breakfast, you see." },
            { ko: '지금 좀 바쁘거든요.', en: "I'm a bit busy right now, you see." },
          ] },
        ],
      },
      {
        heading: 'One warning about tone',
        blocks: [
          { text: 'Said with flat or rising-sharp intonation in an argument, -거든(요) can sound defensive or snappy — like "well, actually...!". In friendly conversation with soft intonation it is perfectly warm. Listen to how idols say it in lives: the tone is what carries the feeling.' },
          { text: 'In the ATEEZ clip for this article, a member explains his fitness results with 운동을 진짜 열심히 했거든 — sharing background the fans would not know. That is -거든 doing exactly its job.' },
        ],
      },
    ],
    quiz: { videoId: 'rBDBC82UmKo', label: 'ATEEZ live', sentence: '운동을 진짜 열심히 했거든' },
    related: ['background-neunde', 'after-doing-go-naseo', 'it-seems-geot-gatda'],
  },
  {
    slug: 'background-neunde',
    title: '-는데: The Most Versatile Ending in Korean Conversation',
    pattern: 'Verb + -는데 / Adjective + -(으)ㄴ데',
    meaning: '...but / ...and / (softener, background-setter)',
    level: 'intermediate',
    summary:
      'Contrast, background, soft disagreement, trailing off — -는데 does it all. Untangle the four main uses with examples from BTS and ATEEZ lives.',
    sections: [
      {
        heading: 'Why -는데 is everywhere',
        blocks: [
          { text: '-는데 connects or ends sentences while doing one of four jobs: (1) contrast — "but"; (2) background — setting the scene for what comes next; (3) softening — making a statement less blunt; (4) trailing off — leaving the conclusion for the listener to infer. The exact meaning depends on context, which is why translating it word-for-word never quite works.' },
        ],
      },
      {
        heading: 'How to form it',
        blocks: [
          { text: 'Verbs (and 있다/없다) take -는데. Adjectives take -(으)ㄴ데. 이다 becomes -인데. Past tense of anything: -았/었는데.' },
          { examples: [
            { ko: '비 오는데 우산 있어요?', en: "It's raining — do you have an umbrella? (background)" },
            { ko: '먹고 싶은데 시간이 없어요.', en: 'I want to eat, but I have no time. (contrast)' },
            { ko: '이미 진 것 같은데!?', en: 'I think we already lost though!? (soft + trailing)' },
            { ko: '저희가 \'멋\'이라는 노래가 있는데', en: "We have this song called '멋' (The Real), and... (scene-setting)" },
          ] },
        ],
      },
      {
        heading: 'The scene-setting habit',
        blocks: [
          { text: 'Watch how idols introduce anything new: 저희가 ~가 있는데... ("So we have this ~, and..."). The -는데 clause hands the listener background, then the real point follows. Korean conversation constantly stacks background → point in this way, and -는데 is the hinge.' },
          { text: 'When -는데(요) ends a sentence, it often invites a response: 좀 비싼데요... ("It\'s a bit expensive though...") implicitly asks "what do you think we should do?". Learning to hear that invitation is a real listening-comprehension milestone.' },
        ],
      },
    ],
    quiz: { videoId: 'rBDBC82UmKo', label: 'ATEEZ live', sentence: "그래서 저희가 '멋'이라는 노래가 있는데" },
    related: ['because-geodeun', 'it-seems-geot-gatda', 'turning-verbs-into-nouns'],
  },
  {
    slug: 'turning-verbs-into-nouns',
    title: '것을=걸, 것이=게: How Korean Turns Verbs into Nouns',
    pattern: 'Verb + -(으)ㄴ/는 것 (것을=걸, 것이=게, 것은=건)',
    meaning: 'the thing that... / ...ing / the fact that...',
    level: 'intermediate',
    summary:
      'Master the 것 nominalizer and its contractions 걸·게·건, and suddenly half of spoken Korean gets easier to parse. Includes real examples from K-pop lives.',
    sections: [
      {
        heading: 'What 것 does',
        blocks: [
          { text: '것 (thing) turns a verb clause into a noun so it can act as a subject or object. -는 것 covers present or general actions ("the act of doing"); -(으)ㄴ 것 covers past or completed actions ("the thing that happened / what (someone) did").' },
          { text: 'In speech, 것 + particle contracts almost every time: 것을 → 걸, 것이 → 게, 것은 → 건. Written subtitles may show either form, but your ears will meet 걸/게/건 far more often than the full forms.' },
        ],
      },
      {
        heading: 'The contractions in action',
        blocks: [
          { examples: [
            { ko: 'BTS 영상을 보는 게 좋아요.', en: 'I like watching BTS videos. (것이 → 게)' },
            { ko: '팝콘 먹는 게 제일 맛있죠.', en: 'Eating popcorn is the best. (것이 → 게)' },
            { ko: '네가 온 걸 봤어.', en: 'I saw that you came. (것을 → 걸)' },
            { ko: '잃어버린 걸 찾았어요.', en: 'I found what I had lost. (것을 → 걸)' },
            { ko: '부산에 온 걸 환영해!', en: 'Welcome to Busan! — lit. "I welcome the fact that you came to Busan."' },
          ] },
        ],
      },
      {
        heading: 'Why this unlocks listening',
        blocks: [
          { text: '부산에 온 걸 환영해 looks opaque until you see the skeleton: [부산에 온 것]을 환영해 — "(I) welcome [the coming-to-Busan]". Once you can spot 걸/게/건 and mentally expand them back to 것+particle, long spoken sentences stop sounding like word soup.' },
          { text: 'Related patterns worth knowing: -는 게 좋겠다 ("it would be good to..." — advice) and -(으)ㄴ 것 같다 ("it seems that..." — see our 것 같다 article). Both are built on this same nominalizer.' },
        ],
      },
    ],
    quiz: { videoId: 'wQvbvIJttDc', label: 'K-Artist live', sentence: '부산에 온 걸 환영해' },
    related: ['it-seems-geot-gatda', 'background-neunde', 'sound-changes-fast-speech'],
  },
  {
    slug: 'polite-promise-dorok',
    title: '-도록 하겠습니다: Polite Determination in Formal Korean',
    pattern: 'Verb + -도록 하겠습니다',
    meaning: "I'll make sure to... / I'll do my best to...",
    level: 'intermediate',
    summary:
      'The formal promise idols make on camera — 열심히 하도록 하겠습니다. Learn when this ending fits, how it compares to -(으)ㄹ게요, and hear Jin use it live.',
    sections: [
      {
        heading: 'What -도록 하겠습니다 does',
        blocks: [
          { text: '-도록 하겠습니다 is a formal, slightly ceremonial way to declare your intention: 열심히 공부하도록 하겠습니다 — "I will make sure to study hard." It combines -도록 (so that / to the extent that) with -겠습니다 (formal volitional), producing a promise that sounds committed and public.' },
          { text: 'You will hear it in speeches, broadcasts, workplace announcements, and — constantly — from idols addressing fans: 더 좋은 모습 보여드리도록 하겠습니다 ("We will make sure to show you an even better side of us").' },
        ],
      },
      {
        heading: 'Formality ladder',
        blocks: [
          { text: 'Compare three ways to promise the same thing, from casual to ceremonial. All are correct; the difference is the setting.' },
          { examples: [
            { ko: '열심히 할게.', en: "I'll work hard. (casual, to a friend)" },
            { ko: '열심히 할게요.', en: "I'll work hard. (polite, everyday)" },
            { ko: '열심히 하도록 하겠습니다.', en: 'I will make sure to work hard. (formal, public)' },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'Jin opens a segment with 열심히 한번 달려 보도록 하겠습니다 — roughly "I\'ll give it a good run." Note the stacked verbs: 달려 보다 (try running) + -도록 하겠습니다. The 한번 ("once / a shot") softens it into "let\'s give this a try," a very broadcast-flavored sentence.' },
          { text: 'Everyday tip: as a learner you rarely need to produce this form, but recognizing it instantly tells you the register — the speaker is being formal and audience-aware.' },
        ],
      },
    ],
    quiz: { videoId: 'ADw_zMarJdk', label: 'Jin (RunSeokjin) live', sentence: '열심히 한번 달려 보도록 하겠습니다.' },
    related: ['ill-do-it-lgeyo', 'meal-expressions-jal-meokgetseumnida', 'background-neunde'],
  },
  {
    slug: 'sound-changes-fast-speech',
    title: 'Why 지금 Sounds Like 짐: Korean Sound Changes in Fast Speech',
    pattern: '먹는[멍는] · 지금→짐 · weak ㅎ',
    meaning: 'pronunciation rules for real listening',
    level: 'intermediate',
    summary:
      'Textbook audio and real K-pop lives sound like different languages. Three sound changes — nasal assimilation, syllable reduction, ㅎ weakening — explain most of the gap.',
    sections: [
      {
        heading: 'Rule 1: ㄱ before ㄴ/ㅁ becomes ㅇ (nasal assimilation)',
        blocks: [
          { text: 'When a syllable ending in ㄱ meets ㄴ or ㅁ, the ㄱ turns into ㅇ [ng]. This is not slang — it is a mandatory rule of Korean phonology, applied even in careful speech.' },
          { examples: [
            { ko: '먹는 게 → [멍는 게]', en: 'eating (the act of)' },
            { ko: '한국말 → [한궁말]', en: 'Korean language' },
            { ko: '국물 → [궁물]', en: 'soup broth' },
          ] },
        ],
      },
      {
        heading: 'Rule 2: common words get squeezed',
        blocks: [
          { text: 'High-frequency words shrink in fast speech. The spelling never changes — only the sound. When an ATEEZ member asks 형 지금 다 먹은 거야?, the 지금 flies by as something closer to [짐].' },
          { examples: [
            { ko: '지금 → [짐]', en: 'now' },
            { ko: '그런데 → 근데', en: 'but / by the way' },
            { ko: '것을 → 걸, 것이 → 게', en: 'contractions of the 것 nominalizer' },
          ] },
          { text: 'For listeners, the fix is exposure: once you have heard 근데 and 짐 a few dozen times in real speech, your brain maps them back to the full forms automatically.' },
        ],
      },
      {
        heading: 'Rule 3: ㅎ weakens or disappears',
        blocks: [
          { text: 'When ㅎ is not at the beginning of a word, native speakers often barely pronounce it. In the BTS live, 조용한 방 ("the quietest room") is a perfect specimen — listen for how little "h" you actually hear.' },
          { examples: [
            { ko: '조용한 → [조용안]', en: 'quiet' },
            { ko: '전화 → [저놔]', en: 'phone call' },
            { ko: '못 해요 → [모태요]', en: "can't do" },
          ] },
          { text: 'These three rules will not make you sound native by themselves, but they will transform your listening: most of what feels "too fast" in K-pop lives is actually these systematic changes, not speed.' },
        ],
      },
    ],
    quiz: { videoId: 'wu6bA3zK_us', label: 'BTS live', sentence: '나는 제일 조용한 방, 내가 선택한 거야.' },
    related: ['turning-verbs-into-nouns', 'korean-word-order-sov', 'it-seems-geot-gatda'],
  },
  {
    slug: 'korean-word-order-sov',
    title: 'Korean Word Order: SOV Rules and Why Natives Break Them',
    pattern: 'Subject – Object – Verb (+ particles)',
    meaning: 'how Korean sentences are built — and rearranged',
    level: 'beginner',
    summary:
      'Korean is SOV — verb last — but real conversation reshuffles constantly. The secret is particles. Learn why 청소도 안 합니다, 깍두기는 is perfectly grammatical.',
    sections: [
      {
        heading: 'The default: verb comes last',
        blocks: [
          { text: 'The neutral Korean sentence runs Subject – Object – Verb: 저는 (S) 피자를 (O) 먹어요 (V) — "I eat pizza." Unlike English, the verb anchors the end of the sentence, and everything before it is marked by particles: 은/는 (topic), 이/가 (subject), 을/를 (object).' },
        ],
      },
      {
        heading: 'Why natives can scramble it',
        blocks: [
          { text: 'Because particles — not position — carry the grammar, spoken Korean moves pieces around freely for emphasis or afterthought. In the BTS live, a member says 청소도 안 합니다, 깍두기는 — the subject arrives after the verb, as an afterthought tag. Fully natural, fully grammatical.' },
          { text: 'This "verb first, subject appended later" pattern is extremely common in speech: 어디 갔어, 그 사람? ("Where did they go, that person?"). Your listening improves the moment you stop expecting textbook order.' },
          { examples: [
            { ko: '저는 피자를 먹어요.', en: 'I eat pizza. (neutral SOV)' },
            { ko: '피자를 저는 안 먹어요.', en: "Pizza, I don't eat. (object fronted for contrast)" },
            { ko: '청소도 안 합니다, 깍두기는.', en: "Doesn't even clean, the kkakdugi. (subject as afterthought)" },
          ] },
        ],
      },
      {
        heading: 'Particles get dropped too',
        blocks: [
          { text: 'Casual speech omits particles whose meaning is obvious. 어디에 갔어요? becomes 어디 갔어요? — the destination particle 에 vanishes because context makes it clear. BTS members ask exactly this: 진 형 어디 갔어요? ("Where did Jin-hyung go?").' },
          { examples: [
            { ko: '어디(에) 갔어요?', en: 'Where did (he) go?' },
            { ko: '밥(을) 먹었어?', en: 'Did you eat?' },
            { ko: '나(는) 먼저 갈게.', en: "I'll head out first." },
          ] },
          { text: 'Rule of thumb for learners: keep particles when writing or when clarity matters; expect them to disappear when listening to casual speech.' },
        ],
      },
    ],
    quiz: { videoId: 'wu6bA3zK_us', label: 'BTS live', sentence: '자, 청소도 안 합니다, 깍두기는.' },
    related: ['sound-changes-fast-speech', 'lets-do-it-ja', 'turning-verbs-into-nouns'],
  },
  {
    slug: 'meal-expressions-jal-meokgetseumnida',
    title: '잘 먹겠습니다 & 잘 먹었습니다: Korea\'s Meal-Time Ritual Explained',
    pattern: '잘 먹겠습니다 · 잘 먹었습니다',
    meaning: 'the phrases said before and after every meal',
    level: 'beginner',
    summary:
      'Before every meal Koreans say 잘 먹겠습니다; after it, 잘 먹었습니다. Neither translates directly into English. Learn what the pair really means, who you are thanking, and how to respond.',
    sections: [
      {
        heading: 'The pair: before and after',
        blocks: [
          { text: 'Before eating, Koreans say 잘 먹겠습니다 — literally "I will eat well," functionally "thank you for this meal." After eating comes the matching 잘 먹었습니다 — "I ate well," meaning "thanks, that was great." English has no true equivalent, which is why subtitles usually settle for "let\'s eat!" or just leave it out.' },
          { examples: [
            { ko: '잘 먹겠습니다!', en: 'Thanks for the meal! (before eating)' },
            { ko: '잘 먹었습니다!', en: 'That was delicious, thank you! (after eating)' },
          ] },
          { text: 'Grammatically the pair is a nice contrast in one phrase: -겠습니다 marks intention (about to eat), -었습니다 marks past tense (finished eating). Same verb 먹다, two tenses, one complete ritual.' },
        ],
      },
      {
        heading: 'Who are you thanking?',
        blocks: [
          { text: 'The phrase thanks whoever made the meal possible — the person who cooked, paid, or shared the food. At a family table it honors the cook; at a company dinner it acknowledges whoever is treating; among friends splitting the bill, it simply opens the meal politely. Even eating alone on camera, idols and mukbang creators say it out of habit — the ritual is that deeply ingrained.' },
          { text: 'That is exactly what happens in the ATEEZ live this article comes from: food arrives, and before anything else — 잘 먹겠습니다! It is one of the most reliable phrases you will ever hear in Korean content: any meal scene, any show, any live.' },
        ],
      },
      {
        heading: 'How to respond, and phrases nearby',
        blocks: [
          { text: 'If someone says 잘 먹겠습니다 to you (you cooked or you\'re paying), the natural replies are 맛있게 드세요 ("enjoy your meal") or 많이 드세요 ("eat plenty / help yourself"). Both are warm, standard, and safe in almost any situation.' },
          { examples: [
            { ko: '맛있게 드세요.', en: 'Enjoy your meal. (host → eater)' },
            { ko: '많이 드세요.', en: 'Help yourself / eat plenty. (host → eater)' },
            { ko: '잘 먹었어! 다음엔 내가 살게.', en: "Thanks for the food! Next time it's on me. (casual)" },
          ] },
          { text: 'One caution for learners: 잘 먹었습니다 is said to people, not to the void — if your host is present, say it to them with a small nod. And if a friend treats you casually, the relaxed version 잘 먹었어! works: same ritual, casual ending.' },
        ],
      },
    ],
    quiz: { videoId: 'rBDBC82UmKo', label: 'ATEEZ live', sentence: '잘 먹겠습니다!' },
    related: ['polite-promise-dorok', 'lets-do-it-ja', 'because-geodeun'],
  },
  {
    slug: 'know-how-to-l-jul-alda',
    title: 'Korean -(으)ㄹ 줄 알다: How to Say "I Know How To..."',
    pattern: 'Verb + -(으)ㄹ 줄 알다 / 모르다',
    meaning: 'to know / not know how to (do something)',
    level: 'intermediate',
    summary:
      'Korean has a dedicated pattern for skills — knowing *how* to do something, not just knowing a fact. Learn -(으)ㄹ 줄 알다/모르다, dodge the "I thought..." trap, and hear it in a real live.',
    sections: [
      {
        heading: 'What -(으)ㄹ 줄 알다 does',
        blocks: [
          { text: '-(으)ㄹ 줄 알다 means "to know how to do" an action, while -(으)ㄹ 줄 모르다 means "to not know how to."' },
          { examples: [
            { ko: '수영할 줄 알아요.', en: 'I know how to swim.' },
            { ko: '운전할 줄 몰라요.', en: "I don't know how to drive." },
          ] },
          { text: 'Here, 줄 is a bound noun that roughly means "the way" or "the method," so the whole expression literally reads "to know the way to do something."' },
          { text: 'This is different from plain 알다, which means "to know a fact, person, or piece of information."' },
          { examples: [
            { ko: '저 사람을 알아요.', en: 'I know that person.' },
          ] },
          { text: 'But when you talk about knowing how to DO something, you need the -(으)ㄹ 줄 알다 pattern:' },
          { examples: [
            { ko: '김치를 만들 줄 알아요.', en: 'I know how to make kimchi.' },
          ] },
          { text: 'Mixing up 알다 and -(으)ㄹ 줄 알다 is one of the most common mistakes learners make.' },
        ],
      },
      {
        heading: 'Watch the "I thought..." trap',
        blocks: [
          { text: 'In the PAST tense, -(으)ㄹ 줄 알았다 takes on a second, completely different meaning: "I thought / assumed that something would happen."' },
          { examples: [
            { ko: '비가 올 줄 알았어.', en: 'I thought it would rain.' },
            { ko: '네가 올 줄 몰랐어.', en: "I didn't expect you to come." },
          ] },
          { text: 'Tense is your clue: present tense = a skill, past tense about a whole situation = an expectation.' },
        ],
      },
      {
        heading: 'How to form it',
        blocks: [
          { text: 'Verb stems ending in a vowel or ㄹ take -ㄹ 줄; other consonant stems take -을 줄. Then add 알다 (know) or 모르다 (not know), conjugated normally.' },
          { examples: [
            { ko: '하다 → 할 줄 알아요', en: 'I know how to do it' },
            { ko: '읽다 → 읽을 줄 알아요', en: 'I know how to read (it)' },
            { ko: '쓰다 → 쓸 줄 몰라요', en: "I don't know how to write / use (it)" },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'In the live this article comes from, someone asks 이거 할 줄 아는 사람 있어? — "Is there anyone who knows how to do this?" Notice 할 줄 아는 사람: the pattern becomes a modifier ("a person who knows how to do it") by adding -는 사람.' },
          { examples: [
            { ko: '이거 할 줄 아는 사람 있어?', en: 'Is there anyone who knows how to do this?' },
            { ko: '나 할 줄 몰라.', en: "I don't know how (casual)." },
          ] },
          { text: 'Casual forms simply drop the polite 요: 할 줄 알아 / 할 줄 몰라. And it combines happily with other verbs — 할 줄 알게 됐어요 = "I\'ve come to know how (I learned)."' },
          { examples: [
            { ko: '한국 음식 만들 줄 알아요?', en: 'Do you know how to make Korean food?' },
          ] },
        ],
      },
    ],
    quiz: { videoId: '9D-8kb6RIK4', label: 'BTS', sentence: '이거 할 줄 아는 사람 있어?' },
    related: ['ill-do-it-lgeyo', 'noun-making-eum', 'it-seems-geot-gatda'],
  },
  {
    slug: 'even-kkaji',
    title: '-까지: The Korean "Even" That Raises the Stakes',
    pattern: 'Noun / Adverb + -까지',
    meaning: 'even... / up to... / all the way to...',
    level: 'beginner',
    summary:
      '-까지 marks an endpoint ("up to, until") — but in conversation it more often means "even," flagging something beyond what you expected. Learn both jobs and hear it in a real live.',
    sections: [
      {
        heading: 'Two jobs: "up to" and "even"',
        blocks: [
          { text: 'The literal job of -까지 is to mark a limit or endpoint in space, time, or degree — "up to / until / all the way to." It often pairs with -부터 ("from").' },
          { examples: [
            { ko: '서울에서 부산까지', en: 'from Seoul all the way to Busan' },
            { ko: '아침부터 저녁까지', en: 'from morning to night' },
            { ko: '밤 12시까지 일했어요.', en: 'I worked until midnight.' },
          ] },
          { text: 'But in everyday speech, -까지 just as often means "even" — adding something that goes beyond expectation. The nuance is "and this too, which is more than I expected."' },
          { examples: [
            { ko: '요리까지 했어요.', en: 'They even cooked (on top of everything else).' },
          ] },
        ],
      },
      {
        heading: '-까지 vs -도',
        blocks: [
          { text: 'Both -도 and -까지 can translate as "also / even," but -까지 is stronger. -도 simply adds ("too"); -까지 says "even this, surprisingly."' },
          { examples: [
            { ko: '요리도 해 줬어요.', en: 'They cooked too.' },
            { ko: '요리까지 해 줬어요.', en: "They even cooked for me (I didn't expect that much)." },
          ] },
          { text: 'Reach for -까지 when you want to signal that a line was crossed — usually with gratitude or astonishment.' },
          { examples: [
            { ko: '너까지 그러면 어떡해?', en: 'If even you act like that, what am I supposed to do?' },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'In the live this article comes from, a member says 형, 요리까지 해 주고 감동이에요 — "Hyung, you even cooked for us, I\'m so touched." The -까지 is doing pure emotional work: the cooking was above and beyond, and that is exactly why it is moving.' },
          { examples: [
            { ko: '요리까지 해 주고 감동이에요.', en: "You even cooked for us — I'm touched." },
          ] },
          { text: 'You will also hear it stacked with 는 for emphasis: 이렇게까지 = "to this extent."' },
          { examples: [
            { ko: '이렇게까지 안 해도 돼요.', en: "You don't have to go this far." },
            { ko: '마지막까지 최선을 다할게요.', en: "I'll do my best to the very end." },
          ] },
        ],
      },
    ],
    quiz: { videoId: '9D-8kb6RIK4', label: 'BTS', sentence: '형, 요리까지 해 주고 감동이에요.' },
    related: ['doing-for-someone-a-eo-juda', 'background-neunde', 'korean-word-order-sov'],
  },
  {
    slug: 'doing-for-someone-a-eo-juda',
    title: '-아/어 주다: Doing Something *For* Someone in Korean',
    pattern: 'Verb + -아/어 주다',
    meaning: 'to do something for someone (as a favor / kindness)',
    level: 'beginner',
    summary:
      'Add -아/어 주다 to a verb and it becomes a favor — done for someone else\'s benefit. It also turns blunt commands into warm requests. Learn the form, the 주다/드리다 politeness split, and hear it live.',
    sections: [
      {
        heading: 'What -아/어 주다 adds',
        blocks: [
          { text: 'On its own, 하다 just means "to do." Add -아/어 주다 and it becomes "to do FOR someone" — the 주다 ("to give") layer marks the action as a kindness aimed at another person.' },
          { examples: [
            { ko: '돕다 → 도와주다', en: 'to help (do for someone)' },
            { ko: '사다 → 사 주다', en: 'to buy for someone' },
            { ko: '만들다 → 만들어 주다', en: 'to make for someone' },
          ] },
          { text: 'That is also why it softens requests. 하세요 ("do it") can sound like an order; 해 주세요 ("do it for me, please") sounds like a warm request.' },
          { examples: [
            { ko: '기다려 주세요.', en: 'Please wait (for me).' },
            { ko: '말해 주세요.', en: 'Please tell me.' },
          ] },
        ],
      },
      {
        heading: 'How to form it (and 주다 vs 드리다)',
        blocks: [
          { text: 'Attach -아 주다 to stems whose last vowel is ㅏ or ㅗ, and -어 주다 to everything else; 하다 becomes 해 주다.' },
          { examples: [
            { ko: '잡다 → 잡아 주다', en: 'to hold / grab for someone' },
            { ko: '읽다 → 읽어 주다', en: 'to read for someone' },
            { ko: '하다 → 해 주다', en: 'to do for someone' },
          ] },
          { text: 'When the favor is for someone you should honor — an elder, a customer — swap 주다 for the humble 드리다.' },
          { examples: [
            { ko: '도와주다 → 도와드리다', en: 'to help (humble, for an elder)' },
            { ko: '도와드릴게요.', en: "I'll help you (respectfully)." },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'In the live this article comes from, a member asks 정국아, 뭐 도와줄 거 없어? — "Jungkook, is there anything I can help with?" 도와주다 is 돕다 ("help") + -아/어 주다, so the favor meaning is baked right in.' },
          { examples: [
            { ko: '정국아, 뭐 도와줄 거 없어?', en: 'Jungkook, is there anything I can help with?' },
          ] },
          { text: 'A subtle point: -아/어 주다 always implies a direction — someone benefits. If you are just describing your own neutral action, drop it: 밥 먹었어요 ("I ate") takes no 주다, because no one else is on the receiving end.' },
          { examples: [
            { ko: '사진 좀 찍어 주세요.', en: 'Please take a photo for me.' },
            { ko: '다시 한번 말해 줄래요?', en: 'Could you say that one more time (for me)?' },
          ] },
        ],
      },
    ],
    quiz: { videoId: '9D-8kb6RIK4', label: 'BTS', sentence: '정국아, 뭐 도와줄 거 없어?' },
    related: ['even-kkaji', 'ill-do-it-lgeyo', 'polite-promise-dorok'],
  },
  {
    slug: 'noun-making-eum',
    title: '-(으)ㅁ: Turning Korean Verbs and Adjectives into Nouns',
    pattern: 'Verb / Adjective stem + -(으)ㅁ',
    meaning: 'the quality / act / fact of ~ (makes a noun)',
    level: 'intermediate',
    summary:
      'How does 소중하다 ("to be precious") become 소중함 ("preciousness")? The -(으)ㅁ ending turns actions and qualities into nouns. Learn the rule, how it differs from -기 and 것, and hear it in a live.',
    sections: [
      {
        heading: 'What -(으)ㅁ does',
        blocks: [
          { text: 'Attach -(으)ㅁ to a verb or adjective stem and it becomes a noun — usually naming the quality, feeling, or result.' },
          { examples: [
            { ko: '소중하다 → 소중함', en: 'to be precious → preciousness' },
            { ko: '아프다 → 아픔', en: 'to hurt → pain' },
            { ko: '웃다 → 웃음', en: 'to laugh → laughter' },
            { ko: '믿다 → 믿음', en: 'to believe → faith' },
          ] },
          { text: 'Many everyday Korean nouns are frozen -(으)ㅁ forms — you already know several without realizing it.' },
          { examples: [
            { ko: '꾸다 → 꿈', en: 'to dream → a dream' },
            { ko: '살다 → 삶', en: 'to live → life' },
            { ko: '기쁘다 → 기쁨', en: 'to be glad → joy' },
          ] },
        ],
      },
      {
        heading: '-(으)ㅁ vs -기 vs 것',
        blocks: [
          { text: 'Korean has three main ways to nominalize, and they are not interchangeable. -(으)ㅁ names a state or result and feels bookish; -기 names an activity and is common in casual speech and lists; 것/거 makes "the thing that..." and rules spoken sentences (see our 것 nominalizer article).' },
          { examples: [
            { ko: '중요함', en: 'importance (state → -ㅁ)' },
            { ko: '일찍 자기', en: 'going to bed early (activity → -기)' },
            { ko: '내가 만든 거', en: 'the thing I made (concrete → 것)' },
          ] },
          { text: 'Rough guide: quality or result → -ㅁ, activity → -기, a concrete "thing" → 것.' },
        ],
      },
      {
        heading: 'How to form it',
        blocks: [
          { text: 'Stems ending in a vowel or ㄹ take -ㅁ; stems ending in other consonants take -음.' },
          { examples: [
            { ko: '가다 → 감', en: 'going' },
            { ko: '살다 → 삶', en: 'life' },
            { ko: '먹다 → 먹음', en: 'eating' },
            { ko: '있다 → 있음', en: 'being / having' },
          ] },
          { text: 'The same ending powers Korea\'s clipped memo and caption style, where whole sentences are compressed into a noun ending.' },
          { examples: [
            { ko: '회의 있음', en: '"Meeting: yes." (notice-style)' },
            { ko: '도착했음', en: '"Arrived." (memo-style)' },
          ] },
        ],
      },
      {
        heading: 'In real conversation',
        blocks: [
          { text: 'In the live this article comes from, a member reflects: 배운 게 멤버의 소중함이었어 — "What I learned was the preciousness of the members." 소중하다 (to be precious) becomes the noun 소중함, which then takes 이었어 (was).' },
          { examples: [
            { ko: '배운 게 멤버의 소중함이었어.', en: 'What I learned was the preciousness of the members.' },
          ] },
          { text: 'Make it a habit: when you meet an unfamiliar noun ending in -ㅁ or -음, strip the ending and look for the verb or adjective underneath. The meaning is usually right there.' },
          { examples: [
            { ko: '그립다 → 그리움', en: 'to miss → longing' },
            { ko: '느끼다 → 느낌', en: 'to feel → a feeling' },
            { ko: '죽다 → 죽음', en: 'to die → death' },
          ] },
        ],
      },
    ],
    quiz: { videoId: '9D-8kb6RIK4', label: 'BTS', sentence: '배운 게 멤버의 소중함이었어.' },
    related: ['turning-verbs-into-nouns', 'know-how-to-l-jul-alda', 'it-seems-geot-gatda'],
  },
]

export function getArticle(slug: string): GrammarArticle | undefined {
  return GRAMMAR_ARTICLES.find(a => a.slug === slug)
}
