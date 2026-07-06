// KpopQuiz.jsx 는 순수 JS 컴포넌트라 allowJs 없이 tsc 가 타입을 못 찾는다.
// 빌드(tsc -b)를 통과시키기 위한 앰비언트 모듈 선언.
declare module '@/components/KpopQuiz' {
  const KpopQuiz: (props: {
    isLoggedIn?: boolean;
    user?: { email?: string | null } | null;
  }) => import('react').JSX.Element;
  export default KpopQuiz;
}
