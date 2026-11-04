소재 ID: $ARGUMENTS
마케팅 OS 소재 제작. 작업 폴더는 marketing/os/ 이고, 결과물은 기존 SNS 파이프라인(marketing/posts → 승인 → 매일 텔레그램)으로 나간다.
marketing/os/CLAUDE.md, 01_brand/brand_guide.md, 최신 04_brief/brief_*.md, marketing/playbook.md(Content principles)를 읽고 해당 소재 ID를 제작해라.

1. 기획 메모: marketing/os/<05_ad_image|06_ad_video|07_carousel>/<소재ID>/plan.md
   - 이미지면 05_ad_image/README.md 프롬프트 틀로 1:1, 4:5, 9:16 구성과 카피
   - 영상이면 06_ad_video/README.md 대본 틀로 15초 대본과 자막
   - 캐러셀이면 07_carousel/README.md 장 구성으로 5~7장 문구
   - 검수 체크리스트(brand_guide.md 소재 체크 + 각 README 체크) 통과 여부 표시
2. 게시물 초안: marketing/posts/<오늘 YYYY-MM-DD>-<소재ID 소문자>-<짧은슬러그>/post.json (status "draft")
   - "design": "stepkorean", "level": "ㄱ"|"ㄴ"|"ㄷ"|"ㄱㄴㄷ", "logo": "circle"(수업·랜딩) | "headphone"(듣기·K-Listen·팟캐스트)
   - "creative": { "id": "C05", "name": "C05_C_카페_carousel_v1", "persona", "angle", "format" }
   - instagram.slides 는 scripts/social/render-slides.mjs 의 슬라이드 타입(hook/phrase/compare/blank/shot/cta …)으로
   - 캡션 영어 기본(페르소나 E면 일본어), 해시태그 5개 이내, 링크는 `node scripts/marketing/utm.mjs <소재ID>_v1 ig` 로 만든 UTM 링크 ("link in bio" 문구 + post.json "links" 에 플랫폼별 UTM 저장)
   - schedule: 기존 승인 슬롯 다음 날부터, 주 3~4회(월·수·금·일 22:00 KST)
3. 렌더: `node scripts/social/render-slides.mjs marketing/posts/<slug>` → 장표를 직접 보고 넘침·줄바꿈 수정
4. 검토 페이지: `node scripts/social/review.mjs marketing/posts/<slug>` → SendUserFile(display "render")
5. marketing/os/11_dashboard/content_log.csv 에 date 를 비운 채 한 줄 추가 (creative_id, persona, angle, format, platform, level_badge, hook, link_utm_content)

금지: 아이돌 실명·사진·영상·음성, 지어낸 후기·수치, 경쟁사 문구 복제, 과장 표현. 게시는 오너가 직접 — API 게시 금지.
승인("승인")을 받으면 status "approved" 로 바꾸고 이 게시물 폴더와 public/social/<slug>/ 만 pathspec 커밋·푸시한다.
