export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8 text-gray-300">
      <div>
        <h1 className="text-2xl font-black text-white">개인정보처리방침 (Privacy Policy)</h1>
        <p className="text-xs text-gray-600 mt-2">
          Step Korean(이하 &apos;회사&apos;)은 이용자의 개인정보를 소중히 다루며, 관련 법령을 준수합니다.
          본 서비스는 별도의 자체 회원가입 절차 없이 구글(Google) 및 애플(Apple) 소셜 로그인만을 통해 운영됩니다.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제1조 (수집하는 개인정보 항목)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          회사는 구글 및 애플 소셜 로그인을 통해 서비스 이용 시 아래와 같은 정보를 수집합니다.
        </p>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>소셜 로그인 제공 식별 정보: 이메일 주소, 이름, 프로필 사진</li>
          <li>서비스 이용 기록: 게임 점수, 오답 단어 및 문장 기록</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제2조 (개인정보의 이용 목적)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          수집한 개인정보는 다음의 목적을 위해 이용됩니다.
        </p>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>사용자 맞춤형 게임 성적 및 오답 노트(오류 리뷰) 기능 제공</li>
          <li>신규 수업 안내, PDF 교재 업로드 안내 등 정보성 및 광고성 이메일 발송</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제3조 (쿠키의 운용 및 광고 서비스 안내)</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>본 웹사이트는 구글 애드센스(Google AdSense) 등 제3자 광고 업체의 맞춤형 광고를 게재할 수 있습니다.</li>
          <li>구글 등 제3자 파트너는 쿠키를 사용하여 유저의 본 사이트 및 타 사이트 방문 기록을 기반으로 맞춤형 광고를 제공합니다.</li>
          <li>
            유저는{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              구글 광고 설정
            </a>
            {' '}페이지에서 맞춤형 광고 게재를 차단할 수 있습니다.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제4조 (개인정보의 보유 및 이용기간)</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>수집된 개인정보는 원칙적으로 본 서비스가 지속되는 동안(서비스 종료 시까지) 보관 및 이용됩니다.</li>
          <li>
            단, 이용자가 관리자 이메일(
            <span className="text-gray-500">[대표님 이메일 주소 기입 대기 공간]</span>
            )을 통해 개인정보 삭제를 요청하거나, 소셜 계정 연동을 해제하는 경우 해당 정보를 지체 없이 파기합니다.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제5조 (개인정보의 파기절차 및 방법)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          이용자의 삭제 요청이 접수되면, 파이어베이스(Firebase) 등 전자적 파일 형태로 저장된 개인정보는
          기록을 재생하거나 복원할 수 없는 기술적 방법을 사용하여 즉시 영구 삭제 처리합니다.
        </p>
      </section>

      <p className="text-xs text-gray-600 pt-4 border-t border-gray-800">
        본 개인정보처리방침은 {new Date().getFullYear()}년 기준으로 작성되었습니다.
      </p>
    </div>
  )
}
