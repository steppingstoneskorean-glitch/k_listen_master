# Android TWA 출시 가이드 (K-Listen Master)

이 웹앱은 **PWA + TWA(Trusted Web Activity)** 로 출시한다.
TWA는 실제 Chrome 엔진으로 사이트를 띄우므로, 팝업 소셜 로그인(구글/애플)·
마이크(Shadowing)·YouTube/Notion 임베드가 브라우저와 100% 동일하게 동작한다.
별도의 네이티브 코드베이스는 없다 — Vercel에 배포하면 앱도 함께 갱신된다.

---

## 1. Digital Asset Links (`public/.well-known/assetlinks.json`)

TWA가 주소창 없는 전체화면으로 뜨려면, 웹 도메인이 "이 안드로이드 앱을 신뢰한다"고
선언해야 한다. 그 선언 파일이 `assetlinks.json` 이다.

- 배포 위치(자동): Vite가 `public/` 를 `dist/` 로 복사 → Vercel이
  `https://k-listen-master.vercel.app/.well-known/assetlinks.json` 로 서빙.
- **채워야 할 값 2개** (현재 placeholder):
  1. `package_name` — 안드로이드 앱 패키지명. 예: `app.klisten.twa`
     (한 번 정하면 스토어에서 영구 고정되니 신중히).
  2. `sha256_cert_fingerprints` — **앱 서명 인증서의 SHA-256 지문**.
     Play Console → 해당 앱 → **테스트 및 릴리스 → 앱 서명** →
     "앱 서명 키 인증서"의 SHA-256 지문을 복사(콜론 포함 대문자 HEX).
     Play 앱 서명을 쓰면 이 값이 최종 기준이다.

> ⚠️ 배포 후 실제로 `.../.well-known/assetlinks.json` URL이 200으로 열리는지
> 브라우저에서 반드시 확인할 것. (Vite가 dot-폴더를 복사하지 못하는 환경이면
> `vercel.json` 에 정적 라우트를 추가하거나 Vercel `public/` 규칙으로 강제한다.)

## 2. TWA 프로젝트 생성 — 둘 중 하나

Flutter 스캐폴드는 삭제됐다. TWA 안드로이드 프로젝트는 이 리포와 **별도로** 생성한다.

### (A) PWABuilder — 가장 쉬움 (권장)
1. https://www.pwabuilder.com 접속 → 배포 URL 입력.
2. manifest/service worker 점수 확인(이미 [vite.config.ts](vite.config.ts)에 구성됨).
3. **Package for Stores → Android** → 패키지명 입력 → `.aab` + `assetlinks.json` 다운로드.
4. 다운로드된 `assetlinks.json` 의 지문/패키지명을 위 1번 파일에 반영 후 재배포.

### (B) Bubblewrap CLI — 세밀한 제어
```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://k-listen-master.vercel.app/manifest.webmanifest
bubblewrap build      # .aab 생성 + 서명 키(keystore) 생성
```
- 생성된 keystore의 SHA-256 지문:
  ```bash
  keytool -list -v -keystore android.keystore -alias android
  ```
- 이 지문을 `assetlinks.json` 에 넣고 재배포.

## 3. Play Console 업로드
- `.aab` 업로드 → **Play 앱 서명** 사용(권장) → 이 경우 Play가 재서명하므로
  **Play Console의 앱 서명 키 지문**을 `assetlinks.json` 의 최종 값으로 쓴다.
- 데이터 안전(Data safety) 폼: **마이크(음성 녹음, 로컬 전용·미전송)**,
  계정(이메일), 분석(동의 기반 GA) 항목을 정직하게 기재.

## 4. 남은 출시 체크(이 리포와 별개로 진행 권장)
- [x] `#3` 인앱 계정 삭제 경로 — 푸터 '계정 삭제' → `AccountDeleteModal`.
      ⚠️ **`firestore.rules` 를 반드시 재배포**해야 실제로 동작한다:
      `firebase deploy --only firestore:rules` (기존 `allow delete: if false` 가
      남아 있으면 데이터가 안 지워지고 인증 계정만 삭제돼 고아 데이터가 생긴다).
- [x] 개인정보처리방침에 마이크/음성 녹음 고지 추가 (§3), 인앱 삭제 안내 (§5).
- [ ] `assetlinks.json` 실제 URL 200 확인
