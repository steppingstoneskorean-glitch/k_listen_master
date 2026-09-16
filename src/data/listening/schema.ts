// src/data/listening/schema.ts
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen — 리스닝 인텔리전스 데이터셋 스키마 (Phase 1)
//   · 책의 프레임워크(PAUSE · CARRY · CHANGE)를 학습자용 1차 축으로 삼고,
//     표준발음법 항은 분석용 메타데이터(rule)로 분리한다.
//   · 출시된 DictationSentence(src/data/sentences.ts)와는 별개의 신규 구조다.
//     기존 받아쓰기 게임은 건드리지 않는다.
//   · learner taxonomy ≠ linguistic taxonomy — 책의 교육적 재편성(예: 정리[정니]를
//     ㄹFlow에 두는 것)이 훈련 축이고, 문법 분류는 rule 로만 기록한다.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 듣기 현상 — 학습자용 1차 축 (층③ 연결 규칙 + 지각축).
 *   pause          책 PAUSE  · 경음화/미파 (제23·24·25·27항)
 *   carry          책 CARRY  · 연음 (제13·14·15항)
 *   change         책 CHANGE · 동화·축약 (아래 ChangeType)
 *   h-weaken       ㅎ약화(탈락) 제12-4 · 좋아요[조아요] — '탈락'이라 change와 메커니즘이 달라 독립 현상
 *   reading        읽기층(층②) · 옆 소리 없이 혼자 정해짐 (7종성/대표음·겹받침). 꽃[꼳]·값[갑]
 *   sound-contrast 지각축   · 최소대립쌍 (불/뿔/풀) — 기존 minimalPairs 시스템과 연동
 *
 * 화면 라벨(내부→표시): pause 막힘 · carry 넘김 · change/h-weaken 바뀜 · reading 읽기 (labels.ts).
 * casual 층(reduction·omission)은 Phase 1 범위 밖.
 */
export type Phenomenon = 'pause' | 'carry' | 'change' | 'h-weaken' | 'reading' | 'sound-contrast'

/**
 * CHANGE 하위 유형 — 책의 4 changes(동화·축약). ㅎ약화(탈락)는 별도 phenomenon 으로 분리됨.
 *   soften      비음화(장애음)  제18항   국물[궁물]·합니다[함니다]
 *   flow        유음화/ㄹ비음화 제20/19  신라[실라](ㄹ이김)·정리[정니](ㄹ물러섬)
 *   front-shift 구개음화        제17항   같이[가치]·굳이[구지]
 *   breath      격음화(자음축약) 제12항   좋다[조타]·축하[추카]
 */
export type ChangeType = 'soften' | 'flow' | 'front-shift' | 'breath'

/**
 * 규칙 식별용 **내부 불투명 코드** (rules.json 의 키). 예: 'r24'.
 * ⚠ 사용자에게 절대 노출하지 않는다 — '제24항' 같은 라벨은 rules.json 에만 두고,
 *   학습자에게는 note/question 처럼 평이한 말로만 설명한다.
 * PAUSE 조건(r23/24/25/27)·Flow ㄹ방향(r19/r20) 등 하위 분기를 이 코드로 구분한다.
 */
export type RuleId = string

/** 대비 축 분류 코드 — axes.json 의 키(내부 전용, 번역 안 함). 예: 'ax.gyeongeumhwa'. */
export type AxisId = string

/**
 * 학습자용 표시 텍스트의 i18n 키. 실제 언어는 번역셋(strings.json)에서 학습자 언어로.
 * 한국어 음성형(transcript·surface·commonError)과 달리, 설명(question·note)은 번역 대상이다.
 * 예: 'q.gyeongeumhwa.eomi'.
 */
export type StringId = string

/** 학습자 언어(모국어 L1 대용) 코드 — commonError 를 L1별로 나눈다. 예: 'ja' 'en' 'es'. */
export type LangId = string

/**
 * 한 문장 안에서 "어디서 무슨 현상이 일어나는가".
 *   · 한 위치의 연쇄(앞문: 앞→[압]→[암])는 annotation 1개 — 최종 surface + note.
 *   · 다른 위치의 독립 현상(독립: ㄱ→ㅇ + ㄹ→ㄴ)은 annotation 여러 개.
 */
export interface Annotation {
  phenomenon: Phenomenon
  /** phenomenon === 'change' 일 때. */
  changeType?: ChangeType
  /** 선택 — 내부 규칙 코드(rules.json 키, 사용자 비노출). 대부분 도출 가능, 경계 사례만 수동 기입. */
  rule?: RuleId
  /** transcript 의 문자 인덱스 [start, end). canonical = transcript.slice(start, end). */
  span: [number, number]
  /** 실제 들리는 형태. 예: '궁물' '신꼬' '실라' '정니'. */
  surface: string
  /** 학습자 설명(왜 이렇게 들리나) — i18n 키(StringId). 학습자 언어로 표시. */
  note?: StringId
  /**
   * 보조로 함께 얽힌 규칙(주로 읽기층 ↔ 연결층). 층을 뭉개지 않으려는 내부 메타 — 학습자 비노출.
   * 예: 꽃 위[꼬뒤]는 carry(r15) + 대표음(r08) → alsoInvolves: ['r08'].
   */
  alsoInvolves?: RuleId[]
  /** 편집용 메모(비교·대비 등 교사/편집자용). 내부 전용, 번역·노출 안 함 — note(학습자용)와 분리. */
  editorNote?: string
}

/**
 * 학습자가 이 항목에 대해 실제로 내는 **확인된** 오답(오개념) — L1별.
 *   · 한국어 음성형(원문). 번역 안 함. 정답 surface 와 달라야 함.
 *   · 확인된 것만 채우고 없으면 생략(추측 금지). 사용 로그(lastUserAnswer)에서 채워질 수 있음.
 *   · ⚠ 채점에서 절대 정답 불인정 — distractor·진단 전용.
 *   예: 신문 → { surface: '싱뭉', l1: 'ja' } (일본어 화자 ㄴ받침 곤란).
 */
export interface CommonError {
  surface: string
  /** 이 오류를 내는 학습자 언어. 생략 = 특정 L1 무관(일반). */
  l1?: LangId
  /** 선택 — 왜 그런지(학습자 언어 설명, StringId). */
  note?: StringId
}

/**
 * 태깅된 리스닝 항목 — "무엇을 듣는가".
 * 출시된 DictationSentence 와 독립. span 은 transcript 기준.
 */
export interface DictationItem {
  id: number
  level: 'intermediate' | 'advanced'
  audioUrl: string
  transcript: string
  speed: 'slow' | 'normal' | 'fast'
  /** 의미 단위 청크. 예: ['저는', '밥을 먹어요']. annotations 와는 다른 레이어. */
  chunks: string[]
  annotations: Annotation[]
  /** 선택 — 확인된 L1별 오답(오개념). 없으면 생략. */
  commonErrors?: CommonError[]
  /** 선택 — 실제 정답률로 사후 보정. 초기엔 비워둠. */
  difficulty?: number
}

/**
 * 대비쌍(변별 데이터셋) — "두 발음이 왜 달라지는가" + 그 판단을 새 단어에 전이시키는 스킬.
 * 단순 쌍 테이블이 아니라 학습자의 판단 능력을 훈련시키는 메타데이터.  (Phase 1.5)
 */
export interface ContrastSet {
  id: number
  /** 내부 학습 분류 — axes.json 의 키(AxisId). 학습자 비노출, 번역 안 함. 예: 'ax.gyeongeumhwa'. */
  axis: AxisId
  /** 학습자용 판별 질문 — i18n 키(StringId). 실제 텍스트는 번역셋. 예: 'q.gyeongeumhwa.eomi'. */
  question: StringId
  members: ContrastMember[]
  /** 학습자용 설명 — i18n 키(StringId). */
  note?: StringId
}

/**
 * 순수 연결 — 어느 항목이 어떤 규칙으로 대비되는가. 음성/오답 값은 항목에서 파생한다.
 *   surface     : firedRule≠null → ref 항목의 그 rule annotation.surface, null → 항목 transcript
 *   distractor  : ref 항목의 commonErrors(학습자 L1 필터) 또는 상대 멤버
 */
export interface ContrastMember {
  /** 재생/참조할 항목의 id. */
  ref: number
  /** 발화한 규칙 — 내부 코드(rules.json 키). null = 적용 안 됨. surface·annotation 을 잇는 조인 키. */
  firedRule: RuleId | null
}
