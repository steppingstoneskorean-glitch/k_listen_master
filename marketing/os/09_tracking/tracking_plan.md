# 추적 계획

## 명명 규칙
`소재ID_페르소나_앵글_포맷_버전` 예: `C01_A_자막_reel_v1`
11_dashboard/content_log.csv에 게시마다 한 줄씩 기록.

## UTM
| 파라미터 | 값 |
| --- | --- |
| utm_source | ig / fb / tiktok / yt |
| utm_medium | organic (광고 시작 후 paid) |
| utm_campaign | 2611_drop1 |
| utm_content | C01_v1 |

예: `https://k-listen-master.vercel.app/?utm_source=ig&utm_medium=organic&utm_campaign=2611_drop1&utm_content=C01_v1`

링크 넣는 곳: 프로필 링크, 스토리 링크 스티커, 유튜브 설명란 첫 줄, TikTok 프로필.

## Meta 픽셀 (광고 안 해도 지금 설치)
- 랜딩과 K-Listen에 설치 → 나중에 리타깃 모수
- 이벤트: `PlayGame`(게임 시작) · `Lead`(이메일 가입) · `InitiateCheckout`(수업 결제 클릭)

## 1주차 확인
- [ ] Payhip에서 픽셀 연동 가능 여부
- [ ] Payhip 주문에 UTM이 남는지
- [ ] 안 되면 랜딩의 결제 클릭을 전환으로 대체
