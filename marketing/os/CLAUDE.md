# Step Korean 마케팅 OS

이 프로젝트는 Step Korean(Stepping Stones Korean)의 마케팅을 01~12 폴더 순서로 운영한다.
작업을 시작하기 전에 항상 이 파일과 관련 폴더의 .md 파일을 먼저 읽는다.

## 브랜드 한 줄
교과서 한국어 말고, 한국 사람이 진짜 쓰는 한국어를 한 계단씩.
(영어) Catch real Korean, one step at a time.

## 운영자
- 공인 한국어 튜터, 1:1 온라인 수업 운영
- 이메일: steppingstoneskorean@gmail.com

## 채널과 링크
| 채널 | 링크 | 역할 |
| --- | --- | --- |
| K-Listen (K-pop 받아쓰기 게임) | https://k-listen-master.vercel.app/games | 유입 훅, 랜딩 1순위 |
| Payhip 스토어 | https://payhip.com/StepKorean | 무료 워크시트(리드) + 유료 수업 |
| YouTube | https://www.youtube.com/@steppingstones.Korean | 신뢰, 숏폼 원본 |
| Instagram | https://instagram.com/stepping.stones.korean/ | 릴스 테스트 |
| TikTok | https://tiktok.com/@stepping.stones.korean | 숏폼 테스트 |

## 상품
| 상품 | 가격 | 비고 |
| --- | --- | --- |
| 말하기 수업 (Speaking) | $8~ | 전환 1순위 상품 |
| 문법 수업 (Grammar) | $12~ | |
| 발음 수업 (Pronunciation) | $15~ | |
| TOPIK 수업 | $20~ | |
| 팟캐스트 워크시트·단어표 (초·중·고급 EP별) | 무료 | 리드 마그넷 |

## 현재 상황 (2026-11 기준)
- Payhip 판매: 0건 → 첫 판매가 최우선 목표
- 유료 광고: 하지 않음. 오가닉(릴스·TikTok·유튜브 쇼츠)으로 먼저 테스트
- Meta 계정: 있음 (광고 라이브러리, Business Suite 인사이트, 예약 게시에 사용)
- 수강생 후기: 요청하면 받을 수 있음 (사용 동의 필수)

## 작업 규칙
1. 앞 폴더 결과를 읽고 다음 폴더를 쓴다. 예: 04 브리프는 01~03을 모두 읽고 작성.
2. 모든 소재에는 소재 ID(C01, C02 …)를 붙이고 파일명·게시물 기록에 남긴다.
   형식: `C01_A_자막_reel_v1` (소재ID_페르소나_앵글_포맷_버전)
3. 색·로고·톤은 반드시 `01_brand/brand_guide.md`를 따른다.
4. 광고·게시물 카피는 영어 기본, 일본어 버전은 페르소나 E용. 내부 문서는 한국어.
5. 결과를 쓸 때 사실과 가설을 구분한다. 가설에는 `[가설]`을 붙인다.

## 금지 사항
- 실제 아이돌의 이름·사진·영상·음성을 광고·게시물 소재에 쓰지 않는다. "K-pop live" 같은 일반 표현과 K-Listen 게임 UI만 보여준다.
- 지어낸 후기, 지어낸 수강생 수, 확인되지 않은 성과 수치를 쓰지 않는다.
- 경쟁사 광고·상세페이지 문구를 그대로 복제하지 않는다. 구조와 앵글만 참고한다.
- "보장", "100%", "한 달 만에 원어민" 같은 과장 표현을 쓰지 않는다.

## 톤
- 친근한 공부 친구. 가르치려 들지 않고, 같이 한 계단 올라가는 느낌.
- 짧은 문장, 쉬운 영어. 학습자가 실제로 겪는 장면으로 시작한다.

## 이 저장소에서 운영하는 방법 (2026-11 연결)
- 위치: `k_listen_master/marketing/os/`. **저장소가 공개**라 아래는 gitignore — PC 에만 둔다.
  `03_customer/voc_bank.md` · `03_customer/reviews.md` · `02_competitor/ad_swipe/` · `10_daily/*`(README 제외) · `11_dashboard/*.csv` · `12_period/review_2*.md`.
  이 파일들의 원문(고객 이름·후기·숫자)을 공개 파일·커밋 메시지·게시물에 옮겨 적지 않는다(동의받은 후기만 소재에).
- 슬래시 명령: `/mkt-brand-audit` `/mkt-competitor` `/mkt-brief` `/mkt-make-creative C01` `/mkt-daily` `/mkt-review` (저장소 루트에서 실행).
- 소재 → 게시: `/mkt-make-creative` 가 `marketing/posts/<날짜>-<소재ID>-…/post.json`(draft) 을 만든다 → 오너 승인 → 매일 10시 텔레그램 업로드 패키지(소재 ID·플랫폼별 UTM 포함)로 오너에게 전달 → **오너가 직접 업로드**. API 자동 게시 금지(AI 생성 표시가 붙어 신뢰가 떨어짐).
- 장표 디자인: `scripts/social/render-slides.mjs` 의 `"design": "stepkorean"` 테마가 brand_guide.md(흰 배경·Step Blue/Purple/Red·레벨 배지·로고)를 따른다. 이미지는 실제 앱 화면(`scripts/social/capture.mjs`) 또는 장표 — AI 생성 이미지 쓰지 않음.
- UTM: `node scripts/marketing/utm.mjs <소재ID>_v<버전> <ig|fb|tiktok|yt|threads> [대상URL]` — 09_tracking 규칙 그대로 링크 생성.
- 앱 쪽 추적: GA(동의 기반)가 UTM 을 자동 기록. K-Listen 게임 결과 화면의 "다음 계단: 1:1 말하기" 버튼 → Payhip(UTM). Meta 픽셀은 쿠키 동의 후에만 로드(`VITE_META_PIXEL_ID`).
- 게시물 원칙은 `marketing/playbook.md` 의 Content principles(누가·언제·변화, 질문형 훅, 한 포인트)도 함께 따른다.
