# 대비쌍 설계 (ContrastSet) — Phase 1.5

변별(discrimination) 데이터셋. K-Listen의 진짜 해자 후보.
타입: [`src/data/listening/schema.ts`](../src/data/listening/schema.ts).

> **핵심 전환:** "이 규칙을 가르친다" → **"비슷하게 들리는 둘을 구별하게 만든다."**

---

## 3층 책임 분리 (겹침 없음)

| 파일/레지스트리 | 책임 | 예 |
|---|---|---|
| `items.json` | **음성·음운 사실** (정답 + 오답 모두 항목 소유) | transcript, surface, span, rule, **commonErrors** |
| `contrast-sets.json` | **학습 설계** (순수 관계) | axis, question, members(ref+firedRule) |
| `rules.json` · `axes.json` | 내부 코드 사전 | r24→제24항, ax.gyeongeumhwa |
| `strings.json` (번역 xlsx) | **표시 언어** | q.*, note.* → ko/en/es/ja |

**음성 값은 항목에만 산다.** ContrastMember는 값을 복제하지 않고 파생한다:
- `surface`: `firedRule≠null` → ref 항목의 그 rule annotation.surface · `null` → 항목 transcript
- `distractor`: ref 항목의 `commonErrors`(학습자 L1 필터) 또는 상대 멤버

---

## 노출 레이어 — 전문용어는 사용자에게 절대 안 보인다

| 필드 | 누가 이해 | 예 | 노출 |
|---|---|---|---|
| `firedRule` / `axis` | 컴퓨터 / 시스템 | `r24` / `ax.gyeongeumhwa` | ❌ |
| `question` (StringId) | 학습자 | "동작이나 상태를 나타내는 말에 뒤가 붙었나요?" | ✅ |
| `surface` / `commonError` | 학습자가 듣는/틀리는 소리 | 신꼬 / 싱뭉 | ✅ (한국어 원문) |

**규칙:** 한국어 음성형(transcript·surface·commonError) = 원문(언어 무관) · 설명(question·note) = **StringId**(학습자 언어로 번역).

---

## 축은 "적용 여부"가 아니라 "어느 규칙이 발화했나"

`firedRule: RuleId | null` — `null`이면 "적용 안 됨"이 파생됨(저장 X).

| 쌍 | firedRule (좌 / 우) | 무엇을 가르나 |
|---|---|---|
| 신고[신꼬] / 신문[신문] | `r24` / `null` | 경음화 적용 여부 |
| 같이[가치] / 잔디[잔디] | `r17` / `null` | 구개음화 적용 여부 |
| 신라[실라] / 정리[정니] | `r20` / `r19` | Flow 방향 |

---

## `commonError` = 항목 소유 · L1별 · 확인된 것만

- **의미:** 학습자가 그 항목을 실제로 내는 **틀린 소리**(한국어 원문). 정답 아님 — 채점서 불인정, distractor·진단 전용.
- **항목에 산다**(대비가 아니라): 신문→싱뭉은 경음화 축과 무관한 **항목 고유 L1 오류**.
- **L1별:** `{ surface, l1?, note? }`. 일본어 화자는 ㄴ받침이 어려워 신문→싱뭉/싱문.
- **확인된 것만:** 추측 금지, 없으면 생략. 사용 로그(`lastUserAnswer`)에서 자동으로 채워질 수 있음.

---

## 예시 (신고 / 신문)

```jsonc
// items.json
{ "id":1, "transcript":"신고", "annotations":[
    { "phenomenon":"pause", "rule":"r24", "span":[0,2], "surface":"신꼬", "note":"note.item.singo" }] }
{ "id":2, "transcript":"신문", "annotations":[],
    "commonErrors":[ {"surface":"싱뭉","l1":"ja"}, {"surface":"싱문","l1":"ja"} ] }

// contrast-sets.json  (member = 순수 연결)
{ "id":1, "axis":"ax.gyeongeumhwa", "question":"q.gyeongeumhwa.eomi",
  "members":[ {"ref":1,"firedRule":"r24"}, {"ref":2,"firedRule":null} ],
  "note":"note.contrast.singo_sinmun" }

// strings.json  (표시 언어)
"q.gyeongeumhwa.eomi": { "ko":"동작이나 상태를 나타내는 말에 뒤가 붙었나요?", "en":"…" }
```

---

## 두 문제 방식 (`kind`는 저장 안 함 — 런타임 모드)

| 방식 | distractor 출처 | commonError 필요? |
|---|---|---|
| **discriminate** (소리→어느 멤버) | 상대 멤버(항상 있음) | ❌ |
| **predict** (표기→발음) | commonError(확인된 것) | ✅ (없으면 미해금) |

같은 ContrastSet이 둘 다 생성 → `kind`는 트레이너가 런타임에 선택.

---

## 동결 상태 & 남은 디테일

- 스키마 잠금(검증기 통과). ID 규약: rule=`rN`, axis=`ax.*`, StringId=`q.*`/`note.*`, romanization=`gyeongeumhwa`.
- 미결(구현 시): `firedRule`이 항목 annotation 을 못 찾는 다중-annotation 항목의 span 타이브레이크(현재 rule 로 매칭).
- `sound-contrast`(음소 변별, 층①)와 ContrastSet(규칙 변별, 층③)은 나중에 변별 UI 공유 가능.
