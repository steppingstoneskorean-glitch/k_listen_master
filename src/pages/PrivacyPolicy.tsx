const EFFECTIVE_DATE = '2026-07-20'
const ADMIN_EMAIL = 'steppingstoneskorean@gmail.com'

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-8 text-gray-300">
      <div>
        <h1 className="text-2xl font-black text-white">개인정보처리방침 (Privacy Policy)</h1>
        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
          Step Korean(이하 &apos;회사&apos;)은 이용자의 개인정보를 소중히 다루며,
          「개인정보 보호법」 및 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다.
          본 서비스(k-listen-master.vercel.app)는 별도의 자체 회원가입 절차 없이 구글(Google) 및 애플(Apple) 소셜
          로그인을 통해 이용할 수 있으며, 로그인 없이 게스트로도 일부 기능을 이용할 수 있습니다.
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제1조 (수집하는 개인정보 항목 및 방법)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          회사는 서비스 제공에 필요한 최소한의 정보만을 아래와 같이 수집합니다. 별도의 입력 절차 없이,
          이용자가 소셜 로그인을 하거나 서비스를 이용하는 과정에서 자동으로 생성·수집됩니다.
        </p>
        <div className="flex flex-col gap-3 mt-1">
          <div>
            <p className="text-sm font-semibold text-gray-300">1. 소셜 로그인 시 (선택)</p>
            <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1 mt-1">
              <li>구글/애플 계정 식별 정보: 이메일 주소, 이름, 프로필 사진</li>
              <li>서비스 내부 고유 식별자(UID)</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-300">2. 서비스 이용 시 (로그인 계정에 저장)</p>
            <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1 mt-1">
              <li>리더보드 닉네임(이용자가 직접 입력하며, 순위표에 공개적으로 게시됩니다)</li>
              <li>게임 점수 및 리더보드 기록</li>
              <li>학습 진행 정보: 접속 일자, 연속 학습일(스트릭), 일일 완료 영상 수</li>
              <li>(선택) 광고성 이메일 수신 동의 여부 및 동의 일시 — 로그인 시 별도 체크박스를
                통해 동의한 경우에만 수집됩니다</li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-300">3. 이용자 기기에만 저장되는 정보 (회사 서버 미수집)</p>
            <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1 mt-1">
              <li>오답 단어·문장 기록(오답 노트)은 회사 서버로 전송되지 않고, 이용자
                브라우저의 로컬 저장소(localStorage)에만 보관됩니다. 브라우저 데이터를 삭제하면
                함께 삭제됩니다.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제2조 (개인정보의 이용 목적)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          수집한 개인정보는 다음의 목적을 위해서만 이용되며, 목적이 변경될 경우 사전에 동의를 받습니다.
        </p>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>소셜 로그인을 통한 이용자 식별 및 로그인 상태 유지</li>
          <li>사용자 맞춤형 게임 성적, 학습 진행(스트릭) 및 리더보드 순위 기능 제공</li>
          <li>서비스 운영·개선 및 부정 이용(점수 위조 등) 방지</li>
          <li>
            (별도 동의 시) 신규 수업 안내, 학습 자료 업로드 안내 등 광고성 정보 이메일 발송 —
            광고성 이메일은 수신에 별도 동의한 이용자에게만 발송되며, 이용자는 언제든지 관리자
            이메일 또는 메일 내 수신거부 방법을 통해 동의를 철회할 수 있습니다. 동의를 거부하더라도
            서비스 이용에는 제한이 없습니다.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제3조 (개인정보 처리의 위탁 및 국외 이전)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          회사는 안정적인 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있으며,
          해당 업무는 국외에서 처리됩니다.
        </p>
        <div className="overflow-x-auto mt-1">
          <table className="w-full text-xs text-left text-gray-400 border-collapse">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500">
                <th className="py-2 pr-3 font-semibold">수탁자 / 이전받는 자</th>
                <th className="py-2 pr-3 font-semibold">위탁 업무</th>
                <th className="py-2 pr-3 font-semibold">이전 항목</th>
                <th className="py-2 font-semibold">이전 국가</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-800/60">
                <td className="py-2 pr-3 align-top">Google LLC (Firebase / Google Cloud / Google Analytics)</td>
                <td className="py-2 pr-3 align-top">회원 인증, 데이터베이스 저장·운영, 서비스 호스팅, 웹 이용 통계 분석</td>
                <td className="py-2 pr-3 align-top">제1조의 로그인 식별 정보, 닉네임, 점수·학습 기록, 쿠키 기반 서비스 이용 기록</td>
                <td className="py-2 align-top">미국</td>
              </tr>
              <tr>
                <td className="py-2 pr-3 align-top">Apple Inc.</td>
                <td className="py-2 pr-3 align-top">애플 계정 소셜 로그인 인증</td>
                <td className="py-2 pr-3 align-top">이메일 주소, 이름</td>
                <td className="py-2 align-top">미국</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs leading-relaxed text-gray-500 mt-2">
          이전 일시 및 방법: 서비스 이용 시점에 정보통신망을 통해 수시로 이전됩니다.
          보유·이용 기간: 제5조에 따른 회원 탈퇴 또는 삭제 요청 시까지.
          이용자는 개인정보의 국외 이전을 거부할 수 있으나, 이 경우 로그인 기반 기능(점수 저장,
          리더보드 등)의 이용이 제한될 수 있습니다.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제4조 (쿠키의 운용, 웹 분석 및 광고 서비스 안내)</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>
            본 웹사이트는 서비스 이용 현황 분석을 위해 구글 애널리틱스(Google Analytics)를
            사용합니다. 구글 애널리틱스는 쿠키를 통해 방문 페이지, 이용 시간, 기기·브라우저 정보
            등을 수집하며, 이 정보는 통계적 분석 목적으로만 사용되고 개인을 식별하는 데 사용되지
            않습니다. 수집된 정보는 Google LLC(미국)의 서버에서 처리됩니다.
          </li>
          <li>본 웹사이트는 구글 애드센스(Google AdSense) 등 제3자 광고 업체의 맞춤형 광고를 게재할 수 있습니다.</li>
          <li>구글 등 제3자 파트너는 쿠키를 사용하여 이용자의 본 사이트 및 타 사이트 방문 기록을 기반으로 맞춤형 광고를 제공합니다.</li>
          <li>
            이용자는{' '}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              구글 광고 설정
            </a>
            {' '}페이지에서 맞춤형 광고 게재를 차단할 수 있으며, 웹 브라우저의 설정을 통해 쿠키
            저장을 거부하거나 삭제할 수 있습니다. 다만 쿠키 저장을 거부할 경우 일부 서비스 이용에
            어려움이 있을 수 있습니다.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제5조 (개인정보의 보유 기간 및 파기)</h2>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>수집된 개인정보는 원칙적으로 이용자가 서비스를 이용하는 동안 보관·이용됩니다.</li>
          <li>
            이용자가 관리자 이메일(
            <span className="text-gray-500">{ADMIN_EMAIL}</span>
            )을 통해 개인정보 삭제를 요청하는 경우, 회사는 지체 없이 해당 정보를 파기합니다.
          </li>
          <li>
            소셜 계정의 연동 해제는 해당 소셜 제공자와의 인증 연결만 끊을 뿐 회사 서버에 저장된
            데이터를 자동으로 삭제하지 않으므로, 데이터의 완전한 삭제를 원하실 경우 위 이메일로
            삭제를 요청해 주시기 바랍니다.
          </li>
          <li>
            파기 방법: 전자적 파일 형태로 저장된 개인정보(Firebase 등)는 기록을 재생·복원할 수 없는
            기술적 방법을 사용하여 영구 삭제합니다.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제6조 (이용자 및 법정대리인의 권리와 행사 방법)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          이용자는 언제든지 자신의 개인정보에 대해 다음 권리를 행사할 수 있습니다.
        </p>
        <ul className="list-disc list-inside text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1">
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리 정지 요구</li>
        </ul>
        <p className="text-sm leading-relaxed text-gray-400 mt-1">
          권리 행사는 관리자 이메일(<span className="text-gray-500">{ADMIN_EMAIL}</span>)로 요청하실 수
          있으며, 회사는 지체 없이 조치합니다.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제7조 (만 14세 미만 아동의 개인정보)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          본 서비스는 만 14세 이상의 이용자를 대상으로 하며, 만 14세 미만 아동의 회원가입 및 이용을
          허용하지 않습니다. 회사는 만 14세 미만 아동의 개인정보를 고의로 수집하지 않으며, 수집된
          사실이 확인되는 경우 지체 없이 해당 정보를 파기합니다.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제8조 (개인정보 보호책임자)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          개인정보 처리에 관한 업무를 총괄하고, 개인정보 처리와 관련한 이용자의 문의·불만·피해 구제를
          처리하기 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
        </p>
        <ul className="list-none text-sm leading-relaxed text-gray-400 pl-2 flex flex-col gap-1 mt-1">
          <li>· 운영자: Step Korean</li>
          <li>· 이메일: <span className="text-gray-500">{ADMIN_EMAIL}</span></li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold text-white">제9조 (개인정보처리방침의 변경)</h2>
        <p className="text-sm leading-relaxed text-gray-400">
          본 개인정보처리방침의 내용 추가·삭제 및 수정이 있을 경우, 변경 사항을 시행 최소 7일 전부터
          본 페이지를 통해 공지합니다. 다만 이용자 권리에 중대한 변경이 있는 경우에는 최소 30일 전에
          공지합니다.
        </p>
      </section>

      <p className="text-xs text-gray-600 pt-4 border-t border-gray-800 leading-relaxed">
        시행일: {EFFECTIVE_DATE}
        <br />
        본 방침은 관련 법령 및 서비스 변경에 따라 개정될 수 있습니다.
      </p>
    </div>
  )
}
