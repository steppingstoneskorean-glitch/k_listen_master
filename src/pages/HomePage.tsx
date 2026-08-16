import TodayPlan from '@/components/TodayPlan'

// 홈 = '오늘의 계획'.  로그인/게스트 모두 이 화면에 도달하므로(비로그인은 /login),
// 마케팅 랜딩(히어로/3-STEP/CTA)은 걷어내고 오늘 할 일을 순서대로 보여준다.
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-indigo-50 pb-6">
      <TodayPlan />
    </div>
  )
}
