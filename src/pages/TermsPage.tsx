const EFFECTIVE_DATE = '2026-07-20'
const ADMIN_EMAIL = 'steppingstoneskorean@gmail.com'

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8 text-gray-300">
      <div>
        <h1 className="text-2xl font-black text-white">이용약관 (Terms of Service)</h1>
        <p className="text-xs text-gray-600 mt-2">
          본 약관은 Step Korean(이하 &apos;회사&apos;)이 제공하는 K-Listen Master 및 관련 서비스(이하
          &apos;서비스&apos;)의 이용 조건을 규정합니다.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제1조 (목적 및 서비스의 내용)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          서비스는 K-pop 라이브 영상과 자체 제작 오디오를 활용한 한국어 듣기 학습 게임, 받아쓰기,
          오답 복습, 학습 자료 열람 기능을 무료로 제공합니다. 회사는 서비스의 품질 향상을 위해
          기능을 추가·변경하거나 일부 기능을 중단할 수 있습니다.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제2조 (약관의 효력 및 변경)</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.</li>
          <li>회사는 관련 법령을 위배하지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 시행
            최소 7일 전(이용자에게 불리한 변경은 30일 전)부터 본 페이지를 통해 공지합니다.</li>
          <li>변경된 약관 시행 이후에도 서비스를 계속 이용하는 경우 변경에 동의한 것으로 봅니다.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제3조 (이용 계약 및 계정)</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>서비스는 구글(Google) 또는 애플(Apple) 소셜 로그인을 통해 이용할 수 있으며, 일부
            기능은 로그인 없이 게스트로 이용할 수 있습니다.</li>
          <li>서비스는 만 14세 이상의 이용자를 대상으로 합니다.</li>
          <li>계정의 관리 책임은 이용자 본인에게 있으며, 계정을 타인에게 양도·대여할 수 없습니다.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제4조 (이용자의 의무)</h2>
        <p className="text-sm leading-relaxed text-gray-400">이용자는 다음 행위를 해서는 안 됩니다.</p>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>점수 조작 등 비정상적인 방법으로 리더보드에 기록을 등록하는 행위</li>
          <li>욕설·혐오 표현·타인 사칭 등 부적절한 닉네임을 사용하는 행위(공개 순위표에 게시되므로
            회사는 부적절한 닉네임·기록을 사전 통지 없이 삭제할 수 있습니다)</li>
          <li>서비스의 정상적인 운영을 방해하거나 서버·데이터에 무단으로 접근하는 행위</li>
          <li>서비스 콘텐츠를 회사의 허락 없이 복제·배포·상업적으로 이용하는 행위</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제5조 (지식재산권)</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>서비스 내 자체 제작 콘텐츠(퀴즈 문항, 해설, 녹음 오디오, UI 등)에 대한 권리는 회사에
            있습니다.</li>
          <li>K-pop 영상은 유튜브(YouTube) 공식 플레이어를 통해 임베드 방식으로 재생되며, 해당
            영상에 대한 권리는 각 권리자에게 있습니다. 회사는 영상을 복제·저장·재배포하지 않습니다.</li>
          <li>권리자의 요청이 있는 경우 해당 영상을 활용한 퀴즈는 지체 없이 내립니다.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제6조 (광고의 게재)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          회사는 서비스 화면에 구글 애드센스(Google AdSense) 등 제3자 광고를 게재할 수 있습니다.
          광고를 통한 제3자와의 거래는 이용자와 해당 광고주 간의 문제이며, 회사는 이에 대해 책임을
          지지 않습니다. 쿠키 및 맞춤형 광고에 관한 사항은 개인정보처리방침을 따릅니다.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제7조 (면책)</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>서비스는 무료로 &apos;있는 그대로(as-is)&apos; 제공되며, 회사는 특정 학습 성과를
            보증하지 않습니다.</li>
          <li>천재지변, 외부 서비스(유튜브, Firebase 등)의 장애 등 회사의 합리적 통제를 벗어난
            사유로 인한 서비스 중단에 대해 회사는 책임을 지지 않습니다.</li>
          <li>이용자 기기(localStorage)에 저장된 오답 기록은 브라우저 데이터 삭제 시 복구할 수
            없습니다.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제8조 (준거법 및 분쟁 해결)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          본 약관은 대한민국 법령에 따라 해석되며, 서비스 이용과 관련한 분쟁은 상호 협의로 해결하되
          협의가 이루어지지 않는 경우 관련 법령에 따른 관할 법원에 제소할 수 있습니다. 문의:
          {' '}<span className="text-gray-500">{ADMIN_EMAIL}</span>
        </p>
      </section>

      <p className="text-xs text-gray-600 pt-4 border-t border-gray-800">시행일: {EFFECTIVE_DATE}</p>
    </div>
  )
}
