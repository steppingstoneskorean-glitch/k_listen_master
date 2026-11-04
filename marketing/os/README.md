# Step Korean 마케팅 OS — 시작 가이드

## 1. 위치
k_listen_master/marketing/os/ 에 합쳐져 있다. 공개 저장소라 고객 원문·후기·성과 숫자·매일 리포트는 gitignore (CLAUDE.md "이 저장소에서 운영하는 방법" 참고).
저장소 루트에서 Claude Code 를 열고 아래 슬래시 명령을 쓴다.

## 2. 폴더 구조
| 폴더 | 단계 | 하는 일 | 핵심 파일 |
| --- | --- | --- | --- |
| 01_brand | 분석 | 자산·USP·컬러·로고 | brand_guide.md, usp.md |
| 02_competitor | 분석 | 경쟁사 상세페이지·광고 수집 | competitors.md, ad_swipe/ |
| 03_customer | 분석 | 페르소나·VOC·후기 | personas.md, voc_bank.md, review_request.md |
| 04_brief | 기획 | 컨셉·메시지·스토리보드 | brief_2611.md |
| 05_ad_image | 제작 | 정적 이미지 소재 | README.md (프롬프트 틀) |
| 06_ad_video | 제작 | 릴스·숏폼 | README.md (대본 틀) |
| 07_carousel | 제작 | 팟캐스트 → 카드뉴스 | README.md |
| 08_landing | 제작 | 페르소나별 랜딩 | README.md |
| 09_tracking | 측정 | UTM·픽셀·명명 규칙 | tracking_plan.md |
| 10_daily | 운영 | 매일 인사이트 요약 | YYYY-MM-DD.md |
| 11_dashboard | 운영 | 소재별 성과 기록 | content_log.csv |
| 12_period | 최적화 | 2주·월간 리뷰, 위닝 판정 | review_template.md |

## 3. 슬래시 명령 (저장소 .claude/commands, 이름 앞에 mkt-)
| 명령 | 하는 일 |
| --- | --- |
| /mkt-brand-audit | 01 브랜드 분석 실행·갱신 |
| /mkt-competitor | 02 경쟁사 수집·분석 |
| /mkt-brief | 01~03을 읽고 04 브리프 작성 |
| /mkt-make-creative C01 | 소재 ID 하나를 이미지·영상·카피로 제작 |
| /mkt-daily | 오늘 인사이트 CSV 요약 → 10_daily |
| /mkt-review | 2주 리뷰, 위닝 판정, 다음 드롭 제안 → 12_period |

## 4. 8주 로드맵 (오가닉 우선)
1. 1주차: 01~03 분석, 수강생 후기 요청 발송 (03_customer/review_request.md)
2. 2주차: 04 브리프 확정, 08 랜딩 1개 + 무료 워크시트 이메일 수집, 픽셀·UTM 설치
3. 3~4주차: C01~C09를 주 3~4개씩 릴스·TikTok 게시
4. 5주차: /review로 상위 컨셉 2~3개 판정, 후기로 C10 제작
5. 6~7주차: 상위 컨셉 변형 3개씩 + 새 컨셉 3~4개, 리드에게 첫 수업 오퍼 메일
6. 8주차: 유료 광고 시작 조건 점검

## 5. 유료 광고 시작 조건 (모두 충족 시)
- [ ] 첫 유료 수업 판매
- [ ] 후기 3개 이상 (사용 동의 받음)
- [ ] 오가닉에서 계정 평균보다 확실히 나은 컨셉 3개 이상
- [ ] 랜딩 픽셀에 방문 데이터가 쌓임
