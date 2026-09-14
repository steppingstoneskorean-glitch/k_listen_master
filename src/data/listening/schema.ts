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
 *   pause         책 PAUSE  · 경음화/미파 (제23·24·25·27항)
 *   carry         책 CARRY  · 연음 (제13·14·15항)
 *   change        책 CHANGE · 아래 ChangeType 으로 세분
 *   sound-contrast 지각축   · 최소대립쌍 (불/뿔/풀) — 기존 minimalPairs 시스템과 연동
 *
 * 층② 읽기 규칙(7종성·겹받침·ㅢ)과 casual 층(reduction·omission)은 Phase 1 범위 밖.
 */
export type Phenomenon = 'pause' | 'carry' | 'change' | 'sound-contrast'

/**
 * CHANGE 하위 유형 — 책의 4 changes + ㅎ약화.
 *   soften      비음화(장애음)  제18항   국물[궁물]·합니다[함니다]   ┐
 *   flow        유음화/ㄹ비음화 제20/19  신라[실라](ㄹ이김)·정리[정니](ㄹ물러섬) ├ 동화
 *   front-shift 구개음화        제17항   같이[가치]·굳이[구지]        ┘
 *   breath      격음화(자음축약) 제12항   좋다[조타]·축하[추카]        ┐ 축약/결합
 *   h-weaken    ㅎ탈락          제12-4   좋아요[조아요]·놓아[노아]     ┘
 * ※ soften/flow/front-shift = 동화, breath/h-weaken = 축약·탈락 (파생 메타, 별도 저장 X)
 */
export type ChangeType = 'soften' | 'flow' | 'front-shift' | 'breath' | 'h-weaken'

/**
 * 규칙 식별용 **내부 불투명 코드** (rules.json 의 키). 예: 'r24'.
 * ⚠ 사용자에게 절대 노출하지 않는다 — '제24항' 같은 라벨은 rules.json 에만 두고,
 *   학습자에게는 note/question 처럼 평이한 말로만 설명한다.
 * PAUSE 조건(r23/24/25/27)·Flow ㄹ방향(r19/r20) 등 하위 분기를 이 코드로 구분한다.
 */
export type RuleId = string

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
  /** 학습자 설명(왜 이렇게 들리나). 다단계 연쇄 과정도 여기에. */
  note?: string
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
  /** 선택 — 실제 정답률로 사후 보정. 초기엔 비워둠. */
  difficulty?: number
}

/**
 * 대비쌍(변별 데이터셋) — "두 발음이 왜 달라지는가" + 그 판단을 새 단어에 전이시키는 스킬.
 * 단순 쌍 테이블이 아니라 학습자의 판단 능력을 훈련시키는 메타데이터.  (Phase 1.5)
 */
export interface ContrastSet {
  id: number
  /** 내부 학습 분류(시스템용, 학습자 비노출). 예: '경음화 적용 여부'. */
  axis: string
  /** 학습자에게 보이는 유일한 텍스트 — 판별 질문. 전문용어 없이. 예: '어미가 붙은 용언인가?'. */
  question: string
  members: ContrastMember[]
  note?: string
}

export interface ContrastMember {
  /** 재생할 항목(오디오/transcript)의 id. */
  ref: number
  /** 발화한 규칙 — 내부 코드(rules.json 키, 사용자 비노출). null = 적용 안 됨(신문). applies 는 파생값. */
  firedRule: RuleId | null
  /** 들리는 형태. */
  surface: string
  /**
   * 학습자가 해당 멤버에 대해 흔히 예상/생성하는 오답 표면형 (예: 신문 → '신꾼').
   * 정답성(correctness) 데이터가 아니라 오개념(misconception) 데이터다.
   * ⚠ 채점에서 절대 정답으로 인정하지 말 것 — distractor·진단 신호 전용.
   */
  commonError?: string
}
