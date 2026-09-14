# 대비쌍 설계 (ContrastSet) — Phase 1.5

변별(discrimination) 데이터셋. K-Listen의 진짜 해자 후보.
타입: [`src/data/listening/schema.ts`](../src/data/listening/schema.ts) 의 `ContrastSet`.

> **핵심 전환:** "이 규칙을 가르친다" → **"비슷하게 들리는 둘을 구별하게 만든다."**
> 책의 ⚠ 블록이 곧 이 데이터셋이다.

---

## 레이어 모델

| 구조 | 저장하는 것 |
|---|---|
| `DictationItem` | 무엇을 듣는가 |
| `Annotation` | 어디서 무슨 현상이 일어나는가 |
| `ContrastSet` | 왜 두 발음이 갈리는가 |
| `question` | 그 차이를 **새 단어에도 적용**하게 하는 판단 스킬 |
| `commonError` | 학습자가 흔히 하는 **잘못된 일반화(오개념)** |

### 노출 레이어 — 전문용어는 사용자에게 절대 안 보인다

| 필드 | 누가 이해하는 것 | 예 | 사용자 노출 |
|---|---|---|---|
| `firedRule` | 컴퓨터 | `r24` (=제24항, rules.json) | ❌ |
| `axis` | 학습 시스템 | 경음화 적용 여부 | ❌ |
| `question` | 학습자 | 어미가 붙은 용언인가? | ✅ (유일) |
| `surface` | 학습자가 듣는 소리 | 신꼬 | ✅ |

규칙 코드(`r24`)와 라벨(`제24항`)은 [`rules.json`](../src/data/listening/rules.json)에만 있고, 화면엔 절대 안 나간다. 학습자는 전문용어를 몰라도 `question`·`surface`만으로 학습한다.

---

## 축은 "적용 여부"가 아니라 "어느 규칙이 발화했나"

`applies: boolean` 은 틀린다 — 아래 2·3행에서 깨짐. 그래서 **`firedRule: RuleId | null`**.

| 쌍 | firedRule (좌 / 우) | 무엇을 가르나 |
|---|---|---|
| 신고[신꼬] / 신문[신문] | `r24` / `null` | 경음화 적용 여부 |
| 같이[가치] / 잔디[잔디] | `r17` / `null` | 구개음화 적용 여부 |
| 꽃이[꼬치] / 꽃 위[꼬뒤] | `r13` / `r15` | 연음 vs 대표음 후 연음 |
| 신라[실라] / 정리[정니] | `r20` / `r19` | Flow 방향(ㄹ이김 vs ㄹ물러섬) |

(코드→라벨: [`rules.json`](../src/data/listening/rules.json) — `r24`=제24항 …, 내부 전용)

`applies` 는 `firedRule === null` 의 파생값 → 저장하지 않는다.

> **왜 `surface`/`firedRule` 는 저장하나(canonical 과 달리):** 부정 멤버(신문)는 규칙이 안 발화해 `annotations: []` → 파생할 곳이 없다. ContrastSet 이 직접 들고 있어야 self-contained.

---

## `commonError` = 오개념 데이터 (정답성 아님)

- 의미: 학습자가 그 멤버에 대해 **흔히 예상/생성하는 오답 표면형** (예: 신문 → `신꾼`).
- ⚠ **채점에서 절대 정답으로 인정 금지.** 2AFC distractor·진단 신호 전용.
- 대비는 비대칭 — 함정은 언제나 한쪽(신문). 책 오디오 규칙("틀린 것 먼저, 자연스러운 것 나중")도 이 비대칭에 기댄다.
- 장기 가치: 쌓이면 개인 약점이 "틀린 단어 목록"이 아니라 **"경음화를 과잉적용하는 경향"** 같은 *체계적 오개념 진단*이 된다.

---

## 예시

```ts
const 신고_신문: ContrastSet = {
  id: 1,
  axis: '경음화 적용 여부',
  question: '어미가 붙은 용언인가?',
  members: [
    { ref: 101, firedRule: 'r24', surface: '신꼬' },              // 신고 (용언)
    { ref: 102, firedRule: null,  surface: '신문', commonError: '신꾼' }, // 신문 (명사)
  ],
}
```

---

## 동결 상태 & 남은 디테일

- **필드 추가 없음.** 5~10개 실제 대비쌍으로 axis/question/firedRule/commonError 작동만 검증.
- 미결(1.5에서 확정): `ref` 가 *item* 을 가리키나 *item + 특정 annotation(span)* 을 가리키나 — item 이 annotation 여러 개를 가질 수 있으므로(독립).
- `sound-contrast`(음소 변별, 층①)와 ContrastSet(규칙 변별, 층③)은 사촌 — 나중에 변별 퀴즈 UI 공유 가능, 데이터 층은 다름.
