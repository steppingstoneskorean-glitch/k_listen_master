마케팅 OS 10 매일 리포트. 작업 폴더는 marketing/os/ (10_daily·11_dashboard 는 gitignore — 커밋하지 않는다).
10_daily 폴더의 오늘 날짜 raw_*.csv를 읽어라. 없으면 가장 최근 파일을 쓰고 그 사실을 알려라.
10_daily/README.md의 /daily 결과 형식대로 10_daily/YYYY-MM-DD.md를 작성해라.
- 게시물을 11_dashboard/content_log.csv의 creative_id와 매칭 (게시 날짜·캡션 첫 줄 기준. marketing/posts/*/post.json 의 creative.id 와 marketing/daily/*.md 전달 기록도 참고)
- 계정 평균 대비 2배 이상 튄 게시물 표시
- 댓글 중 질문·수업 문의를 뽑아 답변 초안 (친근한 공부 친구 톤)
- 11_dashboard/content_log.csv 수치 갱신 (game_plays 는 GA 의 utm_content 별 game_start 가 있으면 사용)
$ARGUMENTS
