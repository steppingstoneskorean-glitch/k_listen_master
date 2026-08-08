// src/data/legalTerms.ts
// 이용약관 다국어 콘텐츠. 한국어(ko)가 법적 정본, 나머지는 편의 번역.
import type { LegalDoc, LegalLang } from '@/components/LegalDocView'

export const TERMS: Record<LegalLang, LegalDoc> = {
  ko: {
    title: '이용약관 (Terms of Service)',
    convenience: '본 문서의 정본(正本)은 한국어이며, 영어·일본어·스페인어 번역은 이해를 돕기 위한 참고용입니다. 해석상 차이가 있을 경우 한국어본이 우선합니다.',
    intro: "본 약관은 Step Korean(이하 '회사')이 제공하는 K-Listen Master 및 관련 서비스(이하 '서비스')의 이용 조건을 규정합니다.",
    sections: [
      {
        title: '제1조 (목적 및 서비스의 내용)',
        blocks: [
          { p: '서비스는 K-pop 라이브 영상과 자체 제작 오디오를 활용한 한국어 듣기 학습 게임, 받아쓰기, 따라 말하기(섀도잉), 문법 해설, 오답 복습, 학습 자료 열람 기능을 무료로 제공합니다. 따라 말하기 기능은 이용자의 마이크로 음성을 녹음해 원어민 발음과 비교하며, 녹음은 이용자 기기에서만 처리되고 회사 서버로 전송·저장되지 않습니다. 회사는 서비스의 품질 향상을 위해 기능을 추가·변경하거나 일부 기능을 중단할 수 있습니다.' },
        ],
      },
      {
        title: '제2조 (약관의 효력 및 변경)',
        blocks: [
          { ul: [
            '본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.',
            '회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 시행 최소 7일 전(이용자에게 불리한 변경은 30일 전)부터 본 페이지를 통해 공지합니다.',
            '변경된 약관 시행 이후에도 서비스를 계속 이용하는 경우 변경에 동의한 것으로 봅니다.',
          ] },
        ],
      },
      {
        title: '제3조 (이용 계약 및 계정)',
        blocks: [
          { ul: [
            '서비스 이용을 위해서는 구글(Google) 또는 애플(Apple) 소셜 로그인이 필요합니다.',
            '서비스는 만 14세 이상의 이용자를 대상으로 합니다.',
            '계정의 관리 책임은 이용자 본인에게 있으며, 계정을 타인에게 양도·대여할 수 없습니다.',
            "이용자는 언제든지 서비스 화면 하단의 '계정 삭제'를 통해 직접 회원 탈퇴할 수 있으며, 탈퇴 시 계정과 그에 연결된 데이터가 파기됩니다(자세한 사항은 개인정보처리방침 제5조).",
          ] },
        ],
      },
      {
        title: '제4조 (이용자의 의무)',
        blocks: [
          { p: '이용자는 다음 행위를 해서는 안 됩니다.' },
          { ul: [
            '점수 조작 등 비정상적인 방법으로 리더보드에 기록을 등록하는 행위',
            '욕설·혐오 표현·타인 사칭 등 부적절한 닉네임을 사용하는 행위(공개 순위표에 게시되므로 회사는 부적절한 닉네임·기록을 사전 통지 없이 삭제할 수 있습니다)',
            '서비스의 정상적인 운영을 방해하거나 서버·데이터에 무단으로 접근하는 행위',
            '서비스 콘텐츠를 회사의 허락 없이 복제·배포·상업적으로 이용하는 행위',
          ] },
        ],
      },
      {
        title: '제5조 (지식재산권)',
        blocks: [
          { ul: [
            '서비스 내 자체 제작 콘텐츠(퀴즈 문항, 해설, 녹음 오디오, UI 등)에 대한 권리는 회사에 있습니다.',
            'K-pop 영상은 유튜브(YouTube) 공식 플레이어를 통해 임베드 방식으로 재생되며, 해당 영상에 대한 권리는 각 권리자에게 있습니다. 회사는 영상을 복제·저장·재배포하지 않습니다.',
            '권리자의 요청이 있는 경우 해당 영상을 활용한 퀴즈는 지체 없이 내립니다.',
          ] },
        ],
      },
      {
        title: '제6조 (광고의 게재)',
        blocks: [
          { p: '현재 서비스에는 광고가 게재되지 않으며, 회사는 향후 서비스 화면에 구글 애드센스(Google AdSense) 등 제3자 광고를 게재할 수 있습니다. 광고 게재 시, 광고를 통한 제3자와의 거래는 이용자와 해당 광고주 간의 문제이며 회사는 이에 대해 책임을 지지 않습니다. 쿠키 및 맞춤형 광고에 관한 사항은 개인정보처리방침을 따릅니다.' },
        ],
      },
      {
        title: '제7조 (면책)',
        blocks: [
          { ul: [
            "서비스는 무료로 '있는 그대로(as-is)' 제공되며, 회사는 특정 학습 성과를 보증하지 않습니다.",
            '천재지변, 외부 서비스(유튜브, Firebase 등)의 장애 등 회사의 합리적 통제를 벗어난 사유로 인한 서비스 중단에 대해 회사는 책임을 지지 않습니다.',
            '이용자 기기(localStorage)에 저장된 오답 기록은 브라우저 데이터 삭제 시 복구할 수 없습니다.',
          ] },
        ],
      },
      {
        title: '제8조 (준거법 및 분쟁 해결)',
        blocks: [
          { p: '본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련한 분쟁은 상호 협의로 해결하되 협의가 이루어지지 않는 경우 관련 법령에 따른 관할 법원에 제소할 수 있습니다. 문의: {email}' },
        ],
      },
    ],
    effectiveLabel: '시행일',
    effectiveDate: '2026-08-08',
  },

  en: {
    title: 'Terms of Service',
    convenience: 'This English text is a convenience translation. The authoritative version of these Terms is the Korean version; in the event of any discrepancy, the Korean version prevails.',
    intro: "These Terms govern the use of K-Listen Master and related services (the “Service”) provided by Step Korean (the “Company”).",
    sections: [
      {
        title: 'Article 1 (Purpose and Scope of Service)',
        blocks: [
          { p: 'The Service provides, free of charge, Korean listening games, dictation, shadowing (repeat-after-me), grammar explanations, error review, and access to study materials, built around K-pop live videos and self-produced audio. The shadowing feature records your voice via your microphone to compare it with native pronunciation; the recording is processed only on your own device and is never transmitted to or stored on the Company’s servers. The Company may add, change, or discontinue features to improve the Service.' },
        ],
      },
      {
        title: 'Article 2 (Effect and Amendment of the Terms)',
        blocks: [
          { ul: [
            'These Terms take effect once posted within the Service.',
            'The Company may amend these Terms within the bounds of applicable law. Amendments will be announced on this page at least 7 days before they take effect (at least 30 days in advance for changes unfavorable to users).',
            'If you continue to use the Service after an amendment takes effect, you are deemed to have agreed to the amendment.',
          ] },
        ],
      },
      {
        title: 'Article 3 (Service Agreement and Account)',
        blocks: [
          { ul: [
            'Using the Service requires signing in with a Google or Apple social account.',
            'The Service is intended for users aged 14 or older.',
            'You are responsible for managing your own account and may not transfer or lend it to others.',
            "You may withdraw (delete your account) at any time via “Delete account” at the bottom of the Service; upon withdrawal, your account and its associated data are destroyed (see Article 5 of the Privacy Policy for details).",
          ] },
        ],
      },
      {
        title: 'Article 4 (User Obligations)',
        blocks: [
          { p: 'Users must not engage in the following:' },
          { ul: [
            'Registering leaderboard records by abnormal means such as score manipulation.',
            'Using inappropriate nicknames such as profanity, hate speech, or impersonation (as these are posted on the public leaderboard, the Company may remove inappropriate nicknames or records without prior notice).',
            'Interfering with the normal operation of the Service, or accessing servers or data without authorization.',
            'Reproducing, distributing, or commercially using the Service’s content without the Company’s permission.',
          ] },
        ],
      },
      {
        title: 'Article 5 (Intellectual Property)',
        blocks: [
          { ul: [
            'Rights to the Company’s self-produced content (quiz items, explanations, recorded audio, UI, etc.) belong to the Company.',
            'K-pop videos are played by embedding via the official YouTube player, and rights to those videos belong to their respective owners. The Company does not copy, store, or redistribute the videos.',
            'Upon request from a rights holder, quizzes using the relevant video will be taken down without delay.',
          ] },
        ],
      },
      {
        title: 'Article 6 (Advertising)',
        blocks: [
          { p: 'The Service currently displays no advertising. The Company may, in the future, display third-party advertising such as Google AdSense within the Service. If advertising is displayed, any dealings with third parties through such advertising are between the user and the advertiser, and the Company bears no responsibility for them. Matters regarding cookies and personalized advertising follow the Privacy Policy.' },
        ],
      },
      {
        title: 'Article 7 (Disclaimer)',
        blocks: [
          { ul: [
            'The Service is provided free of charge on an “as-is” basis, and the Company does not guarantee any particular learning outcome.',
            'The Company is not liable for service interruptions due to causes beyond its reasonable control, such as force majeure or failures of external services (YouTube, Firebase, etc.).',
            'Error records stored on your device (localStorage) cannot be recovered once your browser data is cleared.',
          ] },
        ],
      },
      {
        title: 'Article 8 (Governing Law and Dispute Resolution)',
        blocks: [
          { p: 'These Terms are interpreted under the laws of the Republic of Korea. Disputes related to use of the Service shall be resolved through mutual consultation; if no agreement is reached, a claim may be filed with the competent court under applicable law. Contact: {email}' },
        ],
      },
    ],
    effectiveLabel: 'Effective date',
    effectiveDate: '2026-08-08',
  },

  ja: {
    title: '利用規約 (Terms of Service)',
    convenience: 'この日本語テキストは便宜上の翻訳です。本規約の正本は韓国語版であり、相違がある場合は韓国語版が優先します。',
    intro: 'この規約は、Step Korean（以下「当社」）が提供する K-Listen Master および関連サービス（以下「本サービス」）の利用条件を定めます。',
    sections: [
      {
        title: '第1条（目的およびサービスの内容）',
        blocks: [
          { p: '本サービスは、K-pop のライブ映像と自社制作の音声を用いた韓国語リスニング学習ゲーム、ディクテーション、シャドーイング（追いかけ発話）、文法解説、復習、学習資料の閲覧機能を無料で提供します。シャドーイング機能は、利用者のマイクで音声を録音してネイティブの発音と比較しますが、録音は利用者の端末内でのみ処理され、当社サーバーへ送信・保存されることはありません。当社はサービスの品質向上のため、機能を追加・変更したり、一部機能を中止したりすることがあります。' },
        ],
      },
      {
        title: '第2条（規約の効力および変更）',
        blocks: [
          { ul: [
            '本規約は、サービス画面に掲示することで効力が生じます。',
            '当社は関連法令に違反しない範囲で規約を変更でき、変更する場合は施行の少なくとも7日前（利用者に不利な変更は30日前）から本ページで告知します。',
            '変更後の規約の施行後も本サービスを継続して利用する場合、変更に同意したものとみなします。',
          ] },
        ],
      },
      {
        title: '第3条（利用契約およびアカウント）',
        blocks: [
          { ul: [
            '本サービスの利用には、Google または Apple のソーシャルログインが必要です。',
            '本サービスは満14歳以上の利用者を対象とします。',
            'アカウントの管理責任は利用者本人にあり、アカウントを第三者に譲渡・貸与することはできません。',
            '利用者はいつでもサービス画面下部の「アカウント削除」から自ら退会でき、退会時にはアカウントおよびそれに紐づくデータが破棄されます（詳細はプライバシーポリシー第5条）。',
          ] },
        ],
      },
      {
        title: '第4条（利用者の義務）',
        blocks: [
          { p: '利用者は次の行為をしてはなりません。' },
          { ul: [
            'スコア操作など不正な方法でリーダーボードに記録を登録する行為。',
            '暴言・ヘイト表現・なりすましなど不適切なニックネームを使用する行為（公開ランキングに掲示されるため、当社は不適切なニックネーム・記録を事前通知なく削除できます）。',
            'サービスの正常な運営を妨げ、またはサーバー・データに不正アクセスする行為。',
            'サービスのコンテンツを当社の許可なく複製・配布・商業利用する行為。',
          ] },
        ],
      },
      {
        title: '第5条（知的財産権）',
        blocks: [
          { ul: [
            'サービス内の自社制作コンテンツ（クイズ問題、解説、録音音声、UI 等）に関する権利は当社に帰属します。',
            'K-pop 映像は YouTube 公式プレーヤーを通じた埋め込み方式で再生され、当該映像の権利は各権利者に帰属します。当社は映像を複製・保存・再配布しません。',
            '権利者からの要請がある場合、当該映像を用いたクイズは速やかに取り下げます。',
          ] },
        ],
      },
      {
        title: '第6条（広告の掲載）',
        blocks: [
          { p: '現在、本サービスに広告は掲載されていません。当社は今後、Google AdSense 等の第三者広告をサービス画面に掲載することがあります。広告掲載時、広告を通じた第三者との取引は利用者と当該広告主との間の問題であり、当社は責任を負いません。クッキーおよびパーソナライズ広告に関する事項はプライバシーポリシーに従います。' },
        ],
      },
      {
        title: '第7条（免責）',
        blocks: [
          { ul: [
            '本サービスは無料で「現状のまま（as-is）」提供され、当社は特定の学習成果を保証しません。',
            '天災、外部サービス（YouTube、Firebase 等）の障害など、当社の合理的な支配を超える事由によるサービス中断について、当社は責任を負いません。',
            '利用者の端末（localStorage）に保存された復習記録は、ブラウザデータの削除時に復元できません。',
          ] },
        ],
      },
      {
        title: '第8条（準拠法および紛争解決）',
        blocks: [
          { p: '本規約は大韓民国の法令に従って解釈され、サービス利用に関する紛争は相互協議により解決します。協議が調わない場合は、関連法令に基づく管轄裁判所に提訴することができます。お問い合わせ: {email}' },
        ],
      },
    ],
    effectiveLabel: '施行日',
    effectiveDate: '2026-08-08',
  },

  es: {
    title: 'Términos de servicio (Terms of Service)',
    convenience: 'Este texto en español es una traducción de cortesía. La versión vinculante de estos Términos es la versión en coreano; en caso de discrepancia, prevalecerá la versión en coreano.',
    intro: 'Estos Términos regulan las condiciones de uso de K-Listen Master y los servicios relacionados (el «Servicio») proporcionados por Step Korean (la «Empresa»).',
    sections: [
      {
        title: 'Artículo 1 (Objeto y contenido del Servicio)',
        blocks: [
          { p: 'El Servicio ofrece de forma gratuita juegos de comprensión auditiva de coreano, dictado, shadowing (repetición), explicaciones de gramática, repaso de errores y acceso a materiales de estudio, basados en vídeos en directo de K-pop y audio de producción propia. La función de shadowing graba tu voz con el micrófono para compararla con la pronunciación nativa; la grabación se procesa únicamente en tu dispositivo y nunca se transmite ni se almacena en los servidores de la Empresa. La Empresa puede añadir, modificar o suspender funciones para mejorar el Servicio.' },
        ],
      },
      {
        title: 'Artículo 2 (Vigencia y modificación de los Términos)',
        blocks: [
          { ul: [
            'Estos Términos entran en vigor al publicarse dentro del Servicio.',
            'La Empresa puede modificar los Términos dentro de los límites de la legislación aplicable; los cambios se anunciarán en esta página al menos 7 días antes de su entrada en vigor (al menos 30 días antes en el caso de cambios desfavorables para el usuario).',
            'Si continúas usando el Servicio tras la entrada en vigor de una modificación, se entenderá que la has aceptado.',
          ] },
        ],
      },
      {
        title: 'Artículo 3 (Contrato de uso y cuenta)',
        blocks: [
          { ul: [
            'Para usar el Servicio es necesario iniciar sesión con una cuenta social de Google o Apple.',
            'El Servicio está dirigido a usuarios mayores de 14 años.',
            'La responsabilidad de gestionar la cuenta recae en el propio usuario, que no podrá cederla ni prestarla a terceros.',
            'Puedes darte de baja (eliminar tu cuenta) en cualquier momento mediante «Eliminar cuenta» en la parte inferior del Servicio; al darte de baja, tu cuenta y los datos asociados se destruyen (véase el Artículo 5 de la Política de privacidad).',
          ] },
        ],
      },
      {
        title: 'Artículo 4 (Obligaciones del usuario)',
        blocks: [
          { p: 'El usuario no debe realizar las siguientes acciones:' },
          { ul: [
            'Registrar marcas en la tabla de clasificación por medios anómalos, como la manipulación de puntuaciones.',
            'Usar apodos inapropiados, como insultos, expresiones de odio o suplantación de identidad (al publicarse en la clasificación pública, la Empresa puede eliminar apodos o registros inapropiados sin previo aviso).',
            'Interferir en el funcionamiento normal del Servicio o acceder sin autorización a servidores o datos.',
            'Reproducir, distribuir o usar comercialmente el contenido del Servicio sin permiso de la Empresa.',
          ] },
        ],
      },
      {
        title: 'Artículo 5 (Propiedad intelectual)',
        blocks: [
          { ul: [
            'Los derechos sobre el contenido de producción propia de la Empresa (preguntas de los cuestionarios, explicaciones, audio grabado, interfaz, etc.) pertenecen a la Empresa.',
            'Los vídeos de K-pop se reproducen mediante inserción a través del reproductor oficial de YouTube, y los derechos sobre dichos vídeos pertenecen a sus respectivos titulares. La Empresa no copia, almacena ni redistribuye los vídeos.',
            'A solicitud del titular de los derechos, los cuestionarios que utilicen el vídeo correspondiente se retirarán sin demora.',
          ] },
        ],
      },
      {
        title: 'Artículo 6 (Publicidad)',
        blocks: [
          { p: 'Actualmente el Servicio no muestra publicidad. En el futuro, la Empresa podrá mostrar publicidad de terceros, como Google AdSense, dentro del Servicio. Si se muestra publicidad, cualquier trato con terceros a través de ella es un asunto entre el usuario y el anunciante, y la Empresa no se responsabiliza de ello. Las cuestiones relativas a las cookies y la publicidad personalizada se rigen por la Política de privacidad.' },
        ],
      },
      {
        title: 'Artículo 7 (Exención de responsabilidad)',
        blocks: [
          { ul: [
            'El Servicio se ofrece gratuitamente «tal cual» (as-is), y la Empresa no garantiza ningún resultado de aprendizaje concreto.',
            'La Empresa no se responsabiliza de las interrupciones del Servicio por causas fuera de su control razonable, como fuerza mayor o fallos de servicios externos (YouTube, Firebase, etc.).',
            'Los registros de errores guardados en tu dispositivo (localStorage) no se pueden recuperar una vez borrados los datos del navegador.',
          ] },
        ],
      },
      {
        title: 'Artículo 8 (Ley aplicable y resolución de conflictos)',
        blocks: [
          { p: 'Estos Términos se interpretan conforme a la legislación de la República de Corea. Los conflictos relacionados con el uso del Servicio se resolverán mediante acuerdo mutuo; de no alcanzarse, podrá presentarse una demanda ante el tribunal competente según la legislación aplicable. Contacto: {email}' },
        ],
      },
    ],
    effectiveLabel: 'Fecha de entrada en vigor',
    effectiveDate: '2026-08-08',
  },
}
