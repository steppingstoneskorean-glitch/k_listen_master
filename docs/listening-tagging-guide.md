# 리스닝 태깅 가이드 (Phase 1)

책의 **PAUSE · CARRY · CHANGE** 프레임워크를 앱 데이터로 옮기기 위한 태깅 규칙.
타입 정의: [`src/data/listening/schema.ts`](../src/data/listening/schema.ts)

> 원칙: **학습자 taxonomy(책 용어) = 1차 축**, 표준발음법 = `rule` 메타.
> 목표: 문장 하나를 **30초~1분**에 태깅.

---

## 1. 현상(phenomenon) 4개 + change 하위 5개

| phenomenon | 뜻 (메커니즘) | 예 |
|---|---|---|
| `pause` | 받침 stop을 잠깐 잡았다 놓음 (경음화·미파) | 학교[학꾜] · 신고[신꼬] · 할 수[할쑤] |
| `carry` | 받침이 뒤 음절 초성으로 **자리만 옮김** | 한국어[한구거] · 밥을[바블] · 꽃 위[꼬뒤] |
| `change` | 이웃을 만나 **다른 소리로 바뀜** (아래 5종) | — |
| `sound-contrast` | 표기대로인데 **두 음소가 안 갈림** (지각) | 불/뿔/풀 |

**change 하위(`changeType`)**

| changeType | 표준용어 | 항 | 예 |
|---|---|---|---|
| `soften` | 비음화(장애음) | 제18 | 국물[궁물] · 합니다[함니다] |
| `flow` | 유음화 / ㄹ비음화 | 제20 / 제19 | 신라[실라](ㄹ이김) · 정리[정니](ㄹ물러섬) |
| `front-shift` | 구개음화 | 제17 | 같이[가치] · 굳이[구지] |
| `breath` | 격음화(자음축약) | 제12 | 좋다[조타] · 축하[추카] |
| `h-weaken` | ㅎ탈락 | 제12-4 | 좋아요[조아요] · 놓아[노아] |

---

## 2. 판정 규칙 (경계 3개)

1. **carry vs change** — 자음이 *자리만 옮겼나*(carry) vs *다른 소리가 됐나*(change).
2. **soften vs flow** — 바뀐 게 *장애음(ㄱㄷㅂ)이 비음으로*(soften) vs *ㄹ이 얽힌 것*(flow).
   - flow 안: ㄴ이 ㄹ로 = ㄹ이김(제20) · ㄹ이 ㄴ으로 = ㄹ물러섬(제19). 방향은 `surface`+`rule`로 구분.
3. **breath vs h-weaken** — ㅎ이 뒤 자음과 *합쳐 거센소리*(breath) vs 뒤 모음 앞에서 *사라짐*(h-weaken).

> 하나의 위치가 여러 규칙에 걸리면(예: 같이[가치] = carry+front-shift) 결정적으로 못 알아듣게 하는 쪽을 primary로, 나머지는 별도 annotation.

---

## 3. 2단(다단계) 변화 태깅 규칙 ★

- **한 위치의 연쇄** → annotation **1개**. written→heard(surface)만 잡고, 중간 과정은 `note`에.
  - 예: `앞문` → [압](층② 읽기규칙, v1 미태깅) → [암문](soften)
    → `{ phenomenon:'change', changeType:'soften', span:앞, surface:'암문', note:'받침이 ㅁ을 만나 …' }`
- **다른 위치의 독립 현상** → annotation **여러 개**.
  - 예: `독립`[동닙] = ㄱ→ㅇ(soften, 제18) + ㄹ→ㄴ(flow/ㄹ물러섬, 제19) → annotation 2개.

---

## 4. note 템플릿 (일관성 + 속도)

빈칸만 채우면 됩니다.

- **carry**: `받침 {받침}이 뒤로 이어져 [{surface}]처럼 들립니다.`
- **soften**: `{받침}이 뒤 비음을 만나 [{surface}]로 부드러워집니다.`
- **flow(ㄹ이김)**: `{앞}이 ㄹ에 이끌려 [{surface}]로 흐릅니다.`
- **flow(ㄹ물러섬)**: `ㄹ이 물러나 [{surface}]로 들립니다.`
- **front-shift**: `{받침}+이/히가 앞으로 옮겨 [{surface}]처럼 들립니다.`
- **breath**: `ㅎ이 뒤 소리와 합쳐 [{surface}]로 거세집니다.`
- **h-weaken**: `ㅎ이 모음 앞에서 사라져 [{surface}]로 들립니다.`
- **pause**: `받침을 잠깐 잡았다 놓아 [{surface}]로 굳어집니다.`

---

## 5. 태깅 절차 (문장당)

1. transcript 를 소리 내어 읽는다.
2. 표기와 다르게 들리는 지점을 찾는다 → `span`.
3. 무슨 현상? → `phenomenon` (+ `change`면 `changeType`).
4. 실제로 어떻게 들리나? → `surface`.
5. 왜? → `note` (위 템플릿).
6. (선택) 경계 사례면 `rule` 기입. 청크 나누기 → `chunks`.

> `rule` 은 대부분 자동 도출 가능 — 애매할 때만 손으로.
> reduction/omission/register 는 Phase 1에 **없음**(전부 표준층).
