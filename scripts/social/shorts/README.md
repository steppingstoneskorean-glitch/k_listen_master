# 팟캐스트 클립형 쇼츠 틀

에피소드 설정 JSON 하나로 쇼츠(1080×1920, 30fps, H.264 + AAC)를 만든다.
형식은 오너와 정한 것 그대로다. 퀴즈 요소는 없다.

화면 구성은 위에서 아래로 이렇다.
- 에피소드 머리글
- 장면 그림
- 노래방식 한국어 자막과 영어
- 흐린 단어칩
- 플레이어 바: 원본 에피소드 속 실제 시간을 보여 주고, 목소리가 끝나면 일시정지 아이콘으로 바뀐다.
- 마지막 화면: 로고, `Full episode → Link in bio`, 아이디

## 매주 쓰는 순서
1. **클립 고르기.** 원본 팟캐스트 영상(`assets/팟캐스트영상/…`, 커밋 안 함)에서 15~20초 구간을 고른다. 자막 원문은 `scripts/ingest-out/*.txt`에 있다.
2. **그림 준비.** Claude가 장면별 ChatGPT 프롬프트를 준다. 오너가 이미지를 만들어 `public/social/<slug>/img/scene-01.png …`로 넣는다.
3. **설정 파일 작성.** `marketing/shorts/<slug>.json`을 쓴다. 예시는 `marketing/shorts/2026-11-12-shorts-kkoreureuk.json`이다.
4. **확인용 정지 화면 만들기.**
   ```
   node scripts/social/shorts/make-short.mjs marketing/shorts/<slug>.json --stills 0.5,7,15
   ```
5. **영상 만들기.**
   ```
   node scripts/social/shorts/make-short.mjs marketing/shorts/<slug>.json
   ```
   결과는 `public/social/<slug>/reel.mp4`와 `cover.jpg`다.

## 설정 형식
| 키 | 뜻 |
|---|---|
| `slug` | `public/social/<slug>/` 폴더 이름 |
| `episode` | `{ level, ep, title, topic }`: 머리글과 플레이어 문구 |
| `source` | 원본 영상(또는 오디오) 경로 |
| `clips` | `[[시작, 끝], …]` 원본 기준 초. 이어 붙여서 쓴다. **마지막 끝은 말이 끝난 뒤로 여유 있게** 잡는다. 말 도중에 끝나면 경고가 뜬다. |
| `scenes` | `[{ image, until, tint }]` 그림 전환 시각(영상 기준 초). 마지막 장면은 `until`을 생략한다. tint: `night` `purple` `warm` `teal` `rose` `green` `gray` |
| `lines` | `[{ from, to, ko, en, key?, at? }]` 자막 한 덩어리 |
| `chips` | `[{ ko, en, from, to, key? }]` 흐린 단어칩. 효과음은 없다. |
| `handle` | 기본값은 `@step.korean` |
| `cta` | 기본값은 `["Full episode", "Link in bio"]` |
| `hold` | 목소리가 끝난 뒤 멈춰 있는 시간. 기본값 1.5초 |
| `endCard` | 마지막 화면 길이. 기본값 3.5초 |
| `coverAt` | 표지로 쓸 시각. 기본값 3.5초 |

`lines` 작성법:
- `ko`에서 `/`는 줄바꿈이다.
- `to: "end"`는 마지막 줄이라는 뜻이다.
- `key`에 단어를 넣으면, 그 단어가 들릴 때 노란색으로 강조된다.

## 자동으로 정해지는 것
- **노래방 단어 시각:** 목소리 크기를 보고 추정한다. 줄바꿈(`/`)은 0.3초 이상 쉬는 곳에 맞추고, 덩어리 안에서는 음절 수 비율로 나눈다. 어긋나면 그 줄에 `at: [단어별 시각…]`을 직접 넣는다. 실행 로그에 단어별 시각이 찍히니 그걸 보고 고치면 된다.
- **영상 길이:** 목소리가 끝난 시각 + 0.2초 + `hold` + `endCard`.
- **오디오:**
  - 목소리는 말하는 구간 평균을 -15 dBFS로 맞춘다.
  - 배경음과 효과음은 직접 합성해서 저작권 문제가 없다. 배경음은 목소리보다 약 20 dB 작은 패드이고, 효과음은 마지막 화면 전환 때 '휙' 하나뿐이다.
- 작업 파일은 OS 임시 폴더 `short-<slug>/`에 생긴다.

## 하지 않는 것
빈칸·정답 공개, A/B 선택 카드, "Comment A or B", '딩' 같은 자극 효과음. 스톡 사진.
