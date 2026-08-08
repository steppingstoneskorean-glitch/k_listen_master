// src/data/legalPrivacy.ts
// 개인정보처리방침 다국어 콘텐츠. 한국어(ko)가 법적 정본, 나머지는 편의 번역.
import type { LegalDoc, LegalLang } from '@/components/LegalDocView'

const AD_SETTINGS = 'https://www.google.com/settings/ads'

export const PRIVACY: Record<LegalLang, LegalDoc> = {
  ko: {
    title: '개인정보처리방침 (Privacy Policy)',
    convenience: '본 문서의 정본(正本)은 한국어이며, 영어·일본어·스페인어 번역은 이해를 돕기 위한 참고용입니다. 해석상 차이가 있을 경우 한국어본이 우선합니다.',
    intro: "Step Korean(이하 '회사')은 이용자의 개인정보를 소중히 다루며, 「개인정보 보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다. 본 서비스(k-listen-master.vercel.app)는 별도의 자체 회원가입 절차 없이 구글(Google) 및 애플(Apple) 소셜 로그인을 통해 이용할 수 있으며, 서비스 이용을 위해서는 로그인이 필요합니다.",
    sections: [
      {
        title: '제1조 (수집하는 개인정보 항목 및 방법)',
        blocks: [
          { p: '회사는 서비스 제공에 필요한 최소한의 정보만을 아래와 같이 수집합니다. 별도의 입력 절차 없이, 이용자가 소셜 로그인을 하거나 서비스를 이용하는 과정에서 자동으로 생성·수집됩니다.' },
          { sub: '1. 소셜 로그인 시 (선택)' },
          { ul: ['구글/애플 계정 식별 정보: 이메일 주소, 이름, 프로필 사진', '서비스 내부 고유 식별자(UID)'] },
          { sub: '2. 서비스 이용 시 (로그인 계정에 저장)' },
          { ul: [
            '리더보드 닉네임(이용자가 직접 입력하며, 순위표에 공개적으로 게시됩니다)',
            '게임 점수 및 리더보드 기록',
            '학습 진행 정보: 접속 일자, 연속 학습일(스트릭), 일일 완료 영상 수',
            '(선택) 광고성 이메일 수신 동의 여부 및 동의 일시 — 로그인 시 별도 체크박스를 통해 동의한 경우에만 수집됩니다',
          ] },
          { sub: '3. 이용자 기기에만 저장되는 정보 (회사 서버 미수집)' },
          { ul: [
            '오답 단어·문장 기록(오답 노트)은 회사 서버로 전송되지 않고, 이용자 브라우저의 로컬 저장소(localStorage)에만 보관됩니다. 브라우저 데이터를 삭제하면 함께 삭제됩니다.',
            '섀도잉(따라 말하기) 기능에서 녹음한 이용자의 음성은 원어민 발음과의 비교(자가 학습) 목적으로만 사용되며, 이용자 기기 내에서만 임시로 재생됩니다. 회사 서버나 제3자로 전송·저장되지 않으며, 다음 문장으로 넘어가거나 페이지를 벗어나면 즉시 삭제됩니다. 이 기능은 이용자가 마이크 사용을 허용한 경우에만 동작합니다.',
          ] },
        ],
      },
      {
        title: '제2조 (개인정보의 이용 목적)',
        blocks: [
          { p: '수집한 개인정보는 다음의 목적을 위해서만 이용되며, 목적이 변경될 경우 사전에 동의를 받습니다.' },
          { ul: [
            '소셜 로그인을 통한 이용자 식별 및 로그인 상태 유지',
            '사용자 맞춤형 게임 성적, 학습 진행(스트릭) 및 리더보드 순위 기능 제공',
            '서비스 운영·개선 및 부정 이용(점수 위조 등) 방지',
            '(별도 동의 시) 신규 수업 안내, 학습 자료 업로드 안내 등 광고성 정보 이메일 발송 — 광고성 이메일은 수신에 별도 동의한 이용자에게만 발송되며, 이용자는 언제든지 관리자 이메일 또는 메일 내 수신거부 방법을 통해 동의를 철회할 수 있습니다. 동의를 거부하더라도 서비스 이용에는 제한이 없습니다.',
          ] },
        ],
      },
      {
        title: '제3조 (개인정보 처리의 위탁 및 국외 이전)',
        blocks: [
          { p: '회사는 안정적인 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있으며, 해당 업무는 국외에서 처리됩니다.' },
          { table: {
            headers: ['수탁자 / 이전받는 자', '위탁 업무', '이전 항목', '이전 국가'],
            rows: [
              ['Google LLC (Firebase / Google Cloud / Google Analytics)', '회원 인증, 데이터베이스 저장·운영, 서비스 호스팅, 웹 이용 통계 분석', '제1조의 로그인 식별 정보, 닉네임, 점수·학습 기록, 쿠키 기반 서비스 이용 기록', '미국'],
              ['Apple Inc.', '애플 계정 소셜 로그인 인증', '이메일 주소, 이름', '미국'],
            ],
          } },
          { note: '이전 일시 및 방법: 서비스 이용 시점에 정보통신망을 통해 수시로 이전됩니다. 보유·이용 기간: 제5조에 따른 회원 탈퇴 또는 삭제 요청 시까지. 이용자는 개인정보의 국외 이전을 거부할 수 있으나, 이 경우 로그인 기반 기능(점수 저장, 리더보드 등)의 이용이 제한될 수 있습니다.' },
        ],
      },
      {
        title: '제4조 (쿠키의 운용, 웹 분석 및 광고 서비스 안내)',
        blocks: [
          { ul: [
            '본 웹사이트는 서비스 이용 현황 분석을 위해 구글 애널리틱스(Google Analytics)를 사용합니다. 구글 애널리틱스는 쿠키를 통해 방문 페이지, 이용 시간, 기기·브라우저 정보 등을 수집하며, 이 정보는 통계적 분석 목적으로만 사용되고(IP 주소는 익명화 처리됩니다) 개인을 식별하는 데 사용되지 않습니다. 수집된 정보는 Google LLC(미국)의 서버에서 처리됩니다.',
            "분석 쿠키는 최초 방문 시 표시되는 쿠키 동의 배너에서 이용자가 **'동의'를 선택한 경우에만** 로드·작동합니다. 동의 전에는 어떠한 분석 스크립트도 실행되지 않으며, 이용자는 화면 하단 푸터의 '쿠키 설정(Cookie Settings)'을 통해 언제든지 동의를 철회하거나 변경할 수 있습니다.",
            '현재 본 웹사이트는 광고를 게재하고 있지 않습니다. 향후 구글 애드센스(Google AdSense) 등 제3자 광고를 도입할 경우, 구글 등 제3자 파트너가 쿠키를 사용하여 이용자의 본 사이트 및 타 사이트 방문 기록을 기반으로 맞춤형 광고를 제공할 수 있으며, 광고 도입 시 본 방침을 통해 사전에 안내합니다.',
            `이용자는 [구글 광고 설정](${AD_SETTINGS}) 페이지에서 맞춤형 광고 게재를 차단할 수 있으며, 웹 브라우저의 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만 쿠키 저장을 거부할 경우 일부 서비스 이용에 어려움이 있을 수 있습니다.`,
          ] },
        ],
      },
      {
        title: '제5조 (개인정보의 보유 기간 및 파기)',
        blocks: [
          { ul: [
            '수집된 개인정보는 원칙적으로 이용자가 서비스를 이용하는 동안 보관·이용됩니다.',
            "이용자는 언제든지 화면 하단 푸터의 **'계정 삭제(Delete account)'**를 통해 직접 회원 탈퇴할 수 있습니다. 계정 삭제 시 로그인 계정과 그에 연결된 모든 데이터(닉네임·점수·학습 기록 등)가 **지체 없이 영구 파기**되며, 이 작업은 되돌릴 수 없습니다.",
            '직접 삭제가 어려운 경우, 이용자가 관리자 이메일({email})을 통해 개인정보 삭제를 요청하면 회사는 지체 없이 해당 정보를 파기합니다.',
            '소셜 계정의 연동 해제는 해당 소셜 제공자와의 인증 연결만 끊을 뿐 회사 서버에 저장된 데이터를 자동으로 삭제하지 않으므로, 데이터의 완전한 삭제를 원하실 경우 위 이메일로 삭제를 요청해 주시기 바랍니다.',
            '파기 방법: 전자적 파일 형태로 저장된 개인정보(Firebase 등)는 기록을 재생·복원할 수 없는 기술적 방법을 사용하여 영구 삭제합니다.',
          ] },
        ],
      },
      {
        title: '제6조 (이용자 및 법정대리인의 권리와 행사 방법)',
        blocks: [
          { p: '이용자는 언제든지 자신의 개인정보에 대해 다음 권리를 행사할 수 있습니다.' },
          { ul: ['개인정보 열람 요구', '오류 등이 있을 경우 정정 요구', '삭제 요구', '처리 정지 요구'] },
          { p: '권리 행사는 관리자 이메일({email})로 요청하실 수 있으며, 회사는 지체 없이 조치합니다.' },
        ],
      },
      {
        title: '제7조 (만 14세 미만 아동의 개인정보)',
        blocks: [
          { p: '본 서비스는 만 14세 이상의 이용자를 대상으로 하며, 만 14세 미만 아동의 회원가입 및 이용을 허용하지 않습니다. 회사는 만 14세 미만 아동의 개인정보를 고의로 수집하지 않으며, 수집된 사실이 확인되는 경우 지체 없이 해당 정보를 파기합니다.' },
        ],
      },
      {
        title: '제8조 (개인정보 보호책임자)',
        blocks: [
          { p: '개인정보 처리에 관한 업무를 총괄하고, 개인정보 처리와 관련한 이용자의 문의·불만·피해 구제를 처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.' },
          { ul: ['운영자: Step Korean', '이메일: {email}'] },
        ],
      },
      {
        title: '제9조 (개인정보처리방침의 변경)',
        blocks: [
          { p: '본 개인정보처리방침의 내용 추가·삭제 및 수정이 있을 경우, 변경 사항을 시행 최소 7일 전부터 본 페이지를 통해 공지합니다. 다만 이용자 권리에 중대한 변경이 있는 경우에는 최소 30일 전에 공지합니다.' },
        ],
      },
    ],
    effectiveLabel: '시행일',
    effectiveDate: '2026-08-08',
    footer: '본 방침은 관련 법령 및 서비스 변경에 따라 개정될 수 있습니다.',
  },

  en: {
    title: 'Privacy Policy',
    convenience: 'This English text is a convenience translation. The authoritative version of this Policy is the Korean version; in the event of any discrepancy, the Korean version prevails.',
    intro: 'Step Korean (the “Company”) values your personal information and complies with applicable laws including the Personal Information Protection Act (PIPA) of Korea. This Service (k-listen-master.vercel.app) can be used via Google and Apple social login without a separate sign-up process, and login is required to use the Service.',
    sections: [
      {
        title: 'Article 1 (Personal Data Collected and Method)',
        blocks: [
          { p: 'The Company collects only the minimum information necessary to provide the Service, as below. It is generated and collected automatically when you sign in socially or use the Service, without any separate input step.' },
          { sub: '1. On social login (optional)' },
          { ul: ['Google/Apple account identifiers: email address, name, profile photo', 'Internal unique identifier (UID)'] },
          { sub: '2. While using the Service (stored on your logged-in account)' },
          { ul: [
            'Leaderboard nickname (entered by you and publicly posted on the ranking board)',
            'Game scores and leaderboard records',
            'Learning progress: access dates, learning streak, number of videos completed per day',
            '(Optional) Whether you consented to marketing emails and the time of consent — collected only if you opt in via a separate checkbox at login',
          ] },
          { sub: '3. Information stored only on your device (not collected by the Company)' },
          { ul: [
            'Your record of missed words/sentences (error notes) is not sent to the Company’s servers; it is kept only in your browser’s local storage (localStorage). Clearing your browser data deletes it.',
            'Voice you record in the shadowing feature is used only to compare with native pronunciation (self-study) and is played back only temporarily on your device. It is not transmitted to or stored on the Company’s servers or any third party, and is deleted immediately when you move to the next sentence or leave the page. This feature works only if you allow microphone access.',
          ] },
        ],
      },
      {
        title: 'Article 2 (Purpose of Use)',
        blocks: [
          { p: 'Collected personal data is used only for the following purposes; if the purpose changes, we will obtain prior consent.' },
          { ul: [
            'Identifying users via social login and maintaining login state',
            'Providing personalized game results, learning progress (streak), and leaderboard ranking features',
            'Operating and improving the Service, and preventing abuse (e.g., score forgery)',
            '(With separate consent) Sending marketing emails such as new lesson announcements and study-material updates — such emails are sent only to users who separately opted in, and you may withdraw consent at any time via the admin email or the unsubscribe method in the email. Declining does not restrict your use of the Service.',
          ] },
        ],
      },
      {
        title: 'Article 3 (Outsourcing and Overseas Transfer of Personal Data)',
        blocks: [
          { p: 'To provide a stable Service, the Company entrusts personal-data processing as below, and such processing is carried out overseas.' },
          { table: {
            headers: ['Processor / Recipient', 'Entrusted work', 'Items transferred', 'Country'],
            rows: [
              ['Google LLC (Firebase / Google Cloud / Google Analytics)', 'User authentication, database storage & operation, hosting, web usage analytics', 'The login identifiers, nickname, score/learning records, and cookie-based usage records in Article 1', 'USA'],
              ['Apple Inc.', 'Apple account social login authentication', 'Email address, name', 'USA'],
            ],
          } },
          { note: 'Timing and method of transfer: transferred from time to time via the network at the point of Service use. Retention/use period: until account withdrawal or a deletion request under Article 5. You may refuse the overseas transfer of your personal data, but in that case login-based features (score saving, leaderboard, etc.) may be restricted.' },
        ],
      },
      {
        title: 'Article 4 (Cookies, Web Analytics, and Advertising)',
        blocks: [
          { ul: [
            'This website uses Google Analytics to analyze Service usage. Google Analytics collects, via cookies, information such as pages visited, time spent, and device/browser details; this information is used only for statistical analysis (IP addresses are anonymized) and is not used to identify individuals. The collected information is processed on Google LLC (USA) servers.',
            "Analytics cookies load and operate **only if you select “Agree”** on the cookie consent banner shown on your first visit. No analytics script runs before consent, and you may withdraw or change consent at any time via “Cookie Settings” in the footer at the bottom of the screen.",
            'This website currently displays no advertising. If third-party advertising such as Google AdSense is introduced in the future, third-party partners such as Google may use cookies to provide personalized ads based on your visits to this and other sites; we will give prior notice through this Policy when advertising is introduced.',
            `You can block personalized ads on the [Google Ads Settings](${AD_SETTINGS}) page, and you can refuse or delete cookies via your web browser settings. However, refusing cookies may cause some difficulty using parts of the Service.`,
          ] },
        ],
      },
      {
        title: 'Article 5 (Retention Period and Destruction)',
        blocks: [
          { ul: [
            'In principle, collected personal data is retained and used while you use the Service.',
            'You may withdraw at any time via **“Delete account”** in the footer at the bottom of the screen. On account deletion, your login account and all associated data (nickname, scores, learning records, etc.) are **destroyed permanently without delay**, and this action cannot be undone.',
            'If direct deletion is difficult, you may request deletion of your personal data via the admin email ({email}), and the Company will destroy it without delay.',
            'Disconnecting a social account only severs the authentication link with that provider and does not automatically delete data stored on the Company’s servers; for complete deletion, please request it via the email above.',
            'Method of destruction: personal data stored as electronic files (Firebase, etc.) is permanently deleted using technical means that make records unrecoverable.',
          ] },
        ],
      },
      {
        title: 'Article 6 (Rights of Users and Legal Representatives, and How to Exercise Them)',
        blocks: [
          { p: 'You may exercise the following rights regarding your personal data at any time.' },
          { ul: ['Request to access personal data', 'Request to correct errors', 'Request to delete', 'Request to suspend processing'] },
          { p: 'You may exercise these rights by request to the admin email ({email}), and the Company will act without delay.' },
        ],
      },
      {
        title: 'Article 7 (Personal Data of Children Under 14)',
        blocks: [
          { p: 'This Service is intended for users aged 14 or older and does not permit sign-up or use by children under 14. The Company does not knowingly collect personal data from children under 14, and will destroy such data without delay if collection is confirmed.' },
        ],
      },
      {
        title: 'Article 8 (Data Protection Officer)',
        blocks: [
          { p: 'To oversee personal-data processing and handle user inquiries, complaints, and remedies related to it, the Company designates a data protection officer as below.' },
          { ul: ['Operator: Step Korean', 'Email: {email}'] },
        ],
      },
      {
        title: 'Article 9 (Changes to This Policy)',
        blocks: [
          { p: 'If content of this Privacy Policy is added, deleted, or modified, we will announce the changes on this page at least 7 days before they take effect. However, for changes materially affecting user rights, we will announce them at least 30 days in advance.' },
        ],
      },
    ],
    effectiveLabel: 'Effective date',
    effectiveDate: '2026-08-08',
    footer: 'This Policy may be revised in line with applicable laws and changes to the Service.',
  },

  ja: {
    title: 'プライバシーポリシー (Privacy Policy)',
    convenience: 'この日本語テキストは便宜上の翻訳です。本方針の正本は韓国語版であり、相違がある場合は韓国語版が優先します。',
    intro: 'Step Korean（以下「当社」）は利用者の個人情報を大切に扱い、韓国「個人情報保護法」等の関連法令を遵守します。本サービス（k-listen-master.vercel.app）は別途の会員登録手続きなく、Google および Apple のソーシャルログインで利用でき、サービスの利用にはログインが必要です。',
    sections: [
      {
        title: '第1条（収集する個人情報の項目および方法）',
        blocks: [
          { p: '当社はサービス提供に必要な最小限の情報のみを以下のとおり収集します。別途の入力手続きなく、利用者がソーシャルログインを行う際、またはサービスを利用する過程で自動的に生成・収集されます。' },
          { sub: '1. ソーシャルログイン時（任意）' },
          { ul: ['Google／Apple アカウントの識別情報：メールアドレス、氏名、プロフィール画像', 'サービス内部の固有識別子（UID）'] },
          { sub: '2. サービス利用時（ログインアカウントに保存）' },
          { ul: [
            'リーダーボードのニックネーム（利用者が自ら入力し、ランキングに公開表示されます）',
            'ゲームスコアおよびリーダーボード記録',
            '学習進捗情報：アクセス日、連続学習日数（ストリーク）、1日の完了動画数',
            '（任意）広告メール受信の同意有無および同意日時 — ログイン時に別途のチェックボックスで同意した場合にのみ収集されます',
          ] },
          { sub: '3. 利用者の端末にのみ保存される情報（当社サーバー未収集）' },
          { ul: [
            '誤答した単語・文の記録（復習ノート）は当社サーバーへ送信されず、利用者のブラウザのローカルストレージ（localStorage）にのみ保存されます。ブラウザデータを削除すると併せて削除されます。',
            'シャドーイング機能で録音した利用者の音声は、ネイティブ発音との比較（自己学習）のみを目的として使用され、利用者の端末内で一時的に再生されるだけです。当社サーバーや第三者へ送信・保存されることはなく、次の文へ進むかページを離れると直ちに削除されます。この機能は利用者がマイクの使用を許可した場合にのみ動作します。',
          ] },
        ],
      },
      {
        title: '第2条（個人情報の利用目的）',
        blocks: [
          { p: '収集した個人情報は次の目的のためにのみ利用し、目的が変更される場合は事前に同意を得ます。' },
          { ul: [
            'ソーシャルログインによる利用者の識別およびログイン状態の維持',
            '利用者向けのゲーム成績、学習進捗（ストリーク）およびリーダーボード順位機能の提供',
            'サービスの運営・改善および不正利用（スコア偽造等）の防止',
            '（別途同意時）新規レッスンの案内、学習資料アップロードの案内等の広告メール送信 — 広告メールは受信に別途同意した利用者にのみ送信され、利用者はいつでも管理者メールまたはメール内の配信停止方法により同意を撤回できます。同意を拒否してもサービスの利用に制限はありません。',
          ] },
        ],
      },
      {
        title: '第3条（個人情報処理の委託および国外移転）',
        blocks: [
          { p: '当社は安定的なサービス提供のため、以下のとおり個人情報処理業務を委託しており、当該業務は国外で処理されます。' },
          { table: {
            headers: ['受託者 / 移転先', '委託業務', '移転項目', '移転先国'],
            rows: [
              ['Google LLC (Firebase / Google Cloud / Google Analytics)', '会員認証、データベースの保存・運用、サービスホスティング、ウェブ利用統計分析', '第1条のログイン識別情報、ニックネーム、スコア・学習記録、クッキーに基づく利用記録', '米国'],
              ['Apple Inc.', 'Apple アカウントのソーシャルログイン認証', 'メールアドレス、氏名', '米国'],
            ],
          } },
          { note: '移転の日時および方法：サービス利用時点で情報通信網を通じて随時移転されます。保有・利用期間：第5条に基づく退会または削除請求時まで。利用者は個人情報の国外移転を拒否できますが、その場合ログインに基づく機能（スコア保存、リーダーボード等）の利用が制限されることがあります。' },
        ],
      },
      {
        title: '第4条（クッキーの運用、ウェブ分析および広告サービスの案内）',
        blocks: [
          { ul: [
            '本ウェブサイトは、サービス利用状況の分析のため Google アナリティクス（Google Analytics）を使用します。Google アナリティクスはクッキーを通じて、訪問ページ、利用時間、端末・ブラウザ情報等を収集しますが、この情報は統計的分析目的のみに使用され（IP アドレスは匿名化処理されます）、個人の識別には使用されません。収集された情報は Google LLC（米国）のサーバーで処理されます。',
            '分析クッキーは、初回訪問時に表示されるクッキー同意バナーで利用者が **「同意」を選択した場合にのみ** 読み込み・動作します。同意前はいかなる分析スクリプトも実行されず、利用者は画面下部フッターの「クッキー設定（Cookie Settings）」からいつでも同意を撤回・変更できます。',
            '現在、本ウェブサイトは広告を掲載していません。今後 Google AdSense 等の第三者広告を導入する場合、Google 等の第三者パートナーがクッキーを使用し、本サイトおよび他サイトの閲覧履歴に基づくパーソナライズ広告を提供することがあります。広告導入時には本方針を通じて事前に案内します。',
            `利用者は [Google 広告設定](${AD_SETTINGS}) ページでパーソナライズ広告の表示をブロックでき、ウェブブラウザの設定でクッキーの保存を拒否・削除できます。ただしクッキーの保存を拒否した場合、一部サービスの利用に支障が生じることがあります。`,
          ] },
        ],
      },
      {
        title: '第5条（個人情報の保有期間および破棄）',
        blocks: [
          { ul: [
            '収集した個人情報は、原則として利用者がサービスを利用する間、保管・利用されます。',
            '利用者はいつでも画面下部フッターの **「アカウント削除（Delete account）」** から自ら退会できます。アカウント削除時、ログインアカウントおよびそれに紐づくすべてのデータ（ニックネーム・スコア・学習記録等）が **遅滞なく永久に破棄** され、この操作は取り消せません。',
            '直接の削除が難しい場合、利用者が管理者メール（{email}）を通じて個人情報の削除を請求すれば、当社は遅滞なく当該情報を破棄します。',
            'ソーシャルアカウントの連携解除は当該ソーシャル提供者との認証接続を断つのみで、当社サーバーに保存されたデータを自動的に削除しません。データの完全な削除を希望される場合は、上記メールへ削除をご請求ください。',
            '破棄方法：電子ファイル形態で保存された個人情報（Firebase 等）は、記録を再生・復元できない技術的方法を用いて永久に削除します。',
          ] },
        ],
      },
      {
        title: '第6条（利用者および法定代理人の権利と行使方法）',
        blocks: [
          { p: '利用者はいつでも自らの個人情報について次の権利を行使できます。' },
          { ul: ['個人情報の閲覧請求', '誤り等がある場合の訂正請求', '削除請求', '処理停止請求'] },
          { p: '権利の行使は管理者メール（{email}）へ請求でき、当社は遅滞なく措置します。' },
        ],
      },
      {
        title: '第7条（満14歳未満の児童の個人情報）',
        blocks: [
          { p: '本サービスは満14歳以上の利用者を対象とし、満14歳未満の児童の会員登録および利用を許可しません。当社は満14歳未満の児童の個人情報を故意に収集せず、収集の事実が確認された場合は遅滞なく当該情報を破棄します。' },
        ],
      },
      {
        title: '第8条（個人情報保護責任者）',
        blocks: [
          { p: '個人情報処理に関する業務を統括し、個人情報処理に関する利用者の問い合わせ・苦情・被害救済を処理するため、以下のとおり個人情報保護責任者を指定しています。' },
          { ul: ['運営者：Step Korean', 'メール：{email}'] },
        ],
      },
      {
        title: '第9条（プライバシーポリシーの変更）',
        blocks: [
          { p: '本プライバシーポリシーの内容の追加・削除および修正がある場合、変更事項を施行の少なくとも7日前から本ページで告知します。ただし利用者の権利に重大な変更がある場合は少なくとも30日前に告知します。' },
        ],
      },
    ],
    effectiveLabel: '施行日',
    effectiveDate: '2026-08-08',
    footer: '本方針は関連法令およびサービスの変更に応じて改定されることがあります。',
  },

  es: {
    title: 'Política de privacidad (Privacy Policy)',
    convenience: 'Este texto en español es una traducción de cortesía. La versión vinculante de esta Política es la versión en coreano; en caso de discrepancia, prevalecerá la versión en coreano.',
    intro: 'Step Korean (la «Empresa») valora tu información personal y cumple la legislación aplicable, incluida la Ley de Protección de Información Personal (PIPA) de Corea. Este Servicio (k-listen-master.vercel.app) puede usarse mediante inicio de sesión social de Google y Apple sin un proceso de registro aparte, y se requiere iniciar sesión para usar el Servicio.',
    sections: [
      {
        title: 'Artículo 1 (Datos personales recopilados y método)',
        blocks: [
          { p: 'La Empresa recopila únicamente la información mínima necesaria para prestar el Servicio, como se indica a continuación. Se genera y recopila automáticamente cuando inicias sesión social o usas el Servicio, sin ningún paso de introducción de datos aparte.' },
          { sub: '1. Al iniciar sesión social (opcional)' },
          { ul: ['Identificadores de la cuenta de Google/Apple: dirección de correo, nombre, foto de perfil', 'Identificador único interno (UID)'] },
          { sub: '2. Al usar el Servicio (almacenado en tu cuenta con sesión iniciada)' },
          { ul: [
            'Apodo de la tabla de clasificación (lo introduces tú y se publica públicamente en el ranking)',
            'Puntuaciones de juego y registros de la clasificación',
            'Progreso de aprendizaje: fechas de acceso, racha de aprendizaje, número de vídeos completados por día',
            '(Opcional) Si consentiste recibir correos de marketing y la fecha del consentimiento — se recopila solo si te suscribes mediante una casilla aparte al iniciar sesión',
          ] },
          { sub: '3. Información almacenada solo en tu dispositivo (no recopilada por la Empresa)' },
          { ul: [
            'Tu registro de palabras/frases falladas (notas de errores) no se envía a los servidores de la Empresa; se guarda solo en el almacenamiento local (localStorage) de tu navegador. Al borrar los datos del navegador, se elimina.',
            'La voz que grabas en la función de shadowing se usa únicamente para compararla con la pronunciación nativa (autoaprendizaje) y solo se reproduce temporalmente en tu dispositivo. No se transmite ni se almacena en los servidores de la Empresa ni en terceros, y se elimina de inmediato al pasar a la siguiente frase o salir de la página. Esta función solo funciona si permites el acceso al micrófono.',
          ] },
        ],
      },
      {
        title: 'Artículo 2 (Finalidad del uso)',
        blocks: [
          { p: 'Los datos personales recopilados se usan solo para las siguientes finalidades; si la finalidad cambia, obtendremos el consentimiento previo.' },
          { ul: [
            'Identificar a los usuarios mediante inicio de sesión social y mantener la sesión iniciada',
            'Ofrecer resultados de juego personalizados, progreso de aprendizaje (racha) y funciones de clasificación',
            'Operar y mejorar el Servicio y prevenir el uso indebido (p. ej., falsificación de puntuaciones)',
            '(Con consentimiento aparte) Enviar correos de marketing, como avisos de nuevas lecciones y de materiales de estudio — se envían solo a usuarios que se suscribieron aparte, y puedes retirar el consentimiento en cualquier momento mediante el correo del administrador o el método de cancelación del propio correo. Rechazarlo no restringe tu uso del Servicio.',
          ] },
        ],
      },
      {
        title: 'Artículo 3 (Encargo y transferencia internacional de datos)',
        blocks: [
          { p: 'Para prestar un Servicio estable, la Empresa encarga el tratamiento de datos personales como se indica a continuación, y dicho tratamiento se realiza en el extranjero.' },
          { table: {
            headers: ['Encargado / Destinatario', 'Trabajo encargado', 'Datos transferidos', 'País'],
            rows: [
              ['Google LLC (Firebase / Google Cloud / Google Analytics)', 'Autenticación de usuarios, almacenamiento y operación de la base de datos, alojamiento, analítica web', 'Los identificadores de inicio de sesión, el apodo, los registros de puntuación/aprendizaje y los registros de uso basados en cookies del Artículo 1', 'EE. UU.'],
              ['Apple Inc.', 'Autenticación de inicio de sesión social con cuenta de Apple', 'Dirección de correo, nombre', 'EE. UU.'],
            ],
          } },
          { note: 'Momento y método de la transferencia: se transfiere de forma periódica a través de la red en el momento del uso del Servicio. Periodo de conservación/uso: hasta la baja o una solicitud de eliminación conforme al Artículo 5. Puedes rechazar la transferencia internacional de tus datos, pero en ese caso las funciones basadas en inicio de sesión (guardado de puntuaciones, clasificación, etc.) pueden quedar restringidas.' },
        ],
      },
      {
        title: 'Artículo 4 (Cookies, analítica web y publicidad)',
        blocks: [
          { ul: [
            'Este sitio web usa Google Analytics para analizar el uso del Servicio. Google Analytics recopila, mediante cookies, información como las páginas visitadas, el tiempo de uso y datos del dispositivo/navegador; esta información se usa solo con fines de análisis estadístico (las direcciones IP se anonimizan) y no se usa para identificar a personas. La información recopilada se procesa en servidores de Google LLC (EE. UU.).',
            'Las cookies de analítica se cargan y funcionan **solo si seleccionas «Aceptar»** en el banner de consentimiento de cookies que se muestra en tu primera visita. No se ejecuta ningún script de analítica antes del consentimiento, y puedes retirar o cambiar el consentimiento en cualquier momento mediante «Configuración de cookies» en el pie de página.',
            'Actualmente este sitio web no muestra publicidad. Si en el futuro se introduce publicidad de terceros, como Google AdSense, socios externos como Google podrán usar cookies para ofrecer anuncios personalizados según tus visitas a este y otros sitios; avisaremos con antelación mediante esta Política cuando se introduzca la publicidad.',
            `Puedes bloquear los anuncios personalizados en la página de [Configuración de anuncios de Google](${AD_SETTINGS}), y puedes rechazar o eliminar las cookies mediante la configuración de tu navegador. No obstante, rechazar las cookies puede dificultar el uso de algunas partes del Servicio.`,
          ] },
        ],
      },
      {
        title: 'Artículo 5 (Periodo de conservación y destrucción)',
        blocks: [
          { ul: [
            'En principio, los datos personales recopilados se conservan y utilizan mientras uses el Servicio.',
            'Puedes darte de baja en cualquier momento mediante **«Eliminar cuenta»** en el pie de página. Al eliminar la cuenta, tu cuenta de inicio de sesión y todos los datos asociados (apodo, puntuaciones, registros de aprendizaje, etc.) se **destruyen de forma permanente y sin demora**, y esta acción no se puede deshacer.',
            'Si la eliminación directa resulta difícil, puedes solicitar la eliminación de tus datos mediante el correo del administrador ({email}), y la Empresa los destruirá sin demora.',
            'Desconectar una cuenta social solo corta el vínculo de autenticación con ese proveedor y no elimina automáticamente los datos almacenados en los servidores de la Empresa; para una eliminación completa, solicítala mediante el correo anterior.',
            'Método de destrucción: los datos personales almacenados como archivos electrónicos (Firebase, etc.) se eliminan de forma permanente con medios técnicos que impiden recuperar los registros.',
          ] },
        ],
      },
      {
        title: 'Artículo 6 (Derechos de los usuarios y representantes legales, y su ejercicio)',
        blocks: [
          { p: 'Puedes ejercer los siguientes derechos sobre tus datos personales en cualquier momento.' },
          { ul: ['Solicitud de acceso a los datos', 'Solicitud de corrección de errores', 'Solicitud de eliminación', 'Solicitud de suspensión del tratamiento'] },
          { p: 'Puedes ejercer estos derechos solicitándolo al correo del administrador ({email}), y la Empresa actuará sin demora.' },
        ],
      },
      {
        title: 'Artículo 7 (Datos personales de menores de 14 años)',
        blocks: [
          { p: 'Este Servicio está dirigido a usuarios mayores de 14 años y no permite el registro ni el uso por menores de 14 años. La Empresa no recopila conscientemente datos de menores de 14 años y, si se confirma tal recopilación, los destruirá sin demora.' },
        ],
      },
      {
        title: 'Artículo 8 (Responsable de protección de datos)',
        blocks: [
          { p: 'Para supervisar el tratamiento de datos personales y atender las consultas, reclamaciones y reparaciones de los usuarios relacionadas con él, la Empresa designa un responsable de protección de datos como se indica a continuación.' },
          { ul: ['Operador: Step Korean', 'Correo: {email}'] },
        ],
      },
      {
        title: 'Artículo 9 (Cambios en esta Política)',
        blocks: [
          { p: 'Si se añade, elimina o modifica el contenido de esta Política de privacidad, anunciaremos los cambios en esta página al menos 7 días antes de su entrada en vigor. No obstante, para cambios que afecten de forma sustancial a los derechos de los usuarios, los anunciaremos al menos 30 días antes.' },
        ],
      },
    ],
    effectiveLabel: 'Fecha de entrada en vigor',
    effectiveDate: '2026-08-08',
    footer: 'Esta Política puede revisarse conforme a la legislación aplicable y a los cambios del Servicio.',
  },
}
