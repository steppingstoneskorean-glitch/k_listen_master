// src/components/KpopQuiz.jsx
// ─────────────────────────────────────────────────────────────────────────────
// K-Listen Master — K-pop 영상 기반 외국인 대상 한국어 듣기 퀴즈 모듈
//
// ⚠️ 이 파일은 독립적인 컴포넌트입니다. 기존 파일은 import(읽기)만 하고 수정하지 않습니다.
//    라우팅: /kpop-quiz/:videoId (App.tsx 에 연결됨) — videoId별로 퀴즈 필터링
//
// 포함 기능
//   1) 멀티 문장 배열(quizList) 순차 진행 + 유튜브 구간 반복 플레이어 (useRef)
//   2) 미세 속도 조절 (0.5 🐌 / 0.75 🐢 / 1.0 🐰)
//   3) 빈칸 뚫기(Cloze) + 정답(초록)/세모(노랑)/오답(빨강 Shake) 3단계 판정
//      · 세모: 띄어쓰기를 제외한 글자가 모두 일치할 때 (중간 점수)
//   4) 문장 사이 '발음 포인트 복습' 창 → '다음 문장 듣기' 로 흐름 제어
//   5) Web Audio(MediaRecorder) 섀도잉 녹음기 (로컬 메모리 전용)
//   6) LocalStorage 학습 기록장 (Streak + 누적 점수)
//   7) 성적 기반 바이럴 공유 (총 N개 중 M개 · 성공률 %)
//   8) 최종 완료 창 + '로그인 사용자 전용' 전체 복습 리스트 (조건부 렌더링)
//   9) 운영자용 퀴즈 데이터 생성기 (아코디언 + JSON Export)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { ARTISTS, LIVE_VIDEOS } from '@/data/kArtistLive';

// 운영자 아티스트 태깅 옵션 ('__all__' 제외 — 필터 시스템과 동일 소스)
const ARTIST_OPTIONS = ARTISTS.filter((a) => a !== '__all__');

// ── 샘플 데이터: 멀티 문장 배열 (두 번째 문제는 해설 숨김 테스트용) ────────────
const quizList = [
{
  "id": "bts_01",
  "videoId": "wu6bA3zK_us",
  "startTime": 78.5,
  "endTime": 80,
  "fullSentence": "야,야. 피자 같이 먹자",
  "blankWord": "같이 먹자",
  "explanation": "Verb+자 = Let's V\ncommonly used with friends or people you are close to.\n놀자, 먹자, 마시자, 만나자, 공부하자 ...",
  "hasHardcodedSubs": true
},
{
  "id": "bts_02",
  "videoId": "wu6bA3zK_us",
  "startTime": 290,
  "endTime": 295,
  "fullSentence": "나도 말은 그렇게 했는데.. 혼자 자면 좋지",
  "blankWord": "혼자 자면",
  "explanation": "",
  "hasHardcodedSubs": true
},
  {
  "id": "bts_03",
  "videoId": "wu6bA3zK_us",
  "startTime": 784,
  "endTime": 787,
  "fullSentence": "나는 제일 조용한 방, 내가 선택한 거야.",
  "blankWord": "조용한 방",
  "explanation": "The ㅎ sound is often very weak or disappears in natural speech when it is not at the beginning of a word. Instead of pronouncing ㅎ clearly, many native speakers produce little or no h sound.\n",
  "hasHardcodedSubs": true
},
{
  "id": "bts_04",
  "videoId": "wu6bA3zK_us",
  "startTime": 836.5,
  "endTime": 840,
  "fullSentence": "지민아, 같은 팀이 걸렸으면 좋겠다.  그럼요, 형님.",
  "blankWord": "좋겠다",
  "explanation": "Verb + -았/었으면 좋겠다 = I wish... / I hope... / It would be nice if...\n시험에 합격했으면 좋겠어요, 날씨가 좋았으면 좋겠....\n\n*같은 팀이 걸리다 be on the same team",
  "hasHardcodedSubs": true
},
{
  "id": "bts_05",
  "videoId": "wu6bA3zK_us",
  "startTime": 859,
  "endTime": 862,
  "fullSentence": "자, 청소도 안 합니다, 깍두기는.",
  "blankWord": "청소도",
  "explanation": "Korean usually follows the **SOV (Subject–Object–Verb)** word order. However, in everyday conversation, the word order is often flexible. As long as the particles (은/는, 이/가, 을/를, etc.) are correct, speakers can move words around to emphasize different parts of the sentence or to sound more natural.\n\n*깍두기 is a special role often used in children's games when there is an odd number of players or when someone is much younger or less experienced. A ​깍두기 may switch between teams, help both sides, or play without affecting the final result. The exact role depends on the game, but the purpose is to let everyone join and have fun.",
  "hasHardcodedSubs": true
},
{
  "id": "bts_06",
  "videoId": "wu6bA3zK_us",
  "startTime": 889.5,
  "endTime": 892.5,
  "fullSentence": "이기는 사람이 하는 거야.",
  "blankWord": "이기는",
  "explanation": "Verb + -(으)ㄴ/는 사람이 하는 거야 = The person who (does something) is the one who does it.\nOften used to explain a rule or decide who will do something.\n\n지는 사람이 청소 하는 거야.\n이기는 사람이 치킨 먹는 거야. ",
  "hasHardcodedSubs": true
},
{
  "id": "bts_07",
  "videoId": "wu6bA3zK_us",
  "startTime": 1068,
  "endTime": 1070,
  "fullSentence": "자, 저희 먼저 자리 잡을게요.",
  "blankWord": "잡을게요.",
  "explanation": "Verb + -(으)ㄹ게요 = I'll...\nIt is used when the speaker makes a decision, promise, or offer at the moment of speaking, often in response to the listener.\n제가 할게요, 먼저 갈게요, 오늘부터 운동할게요...\n\n*자리를 잡다 = to find a seat, to take a seat ...",
  "hasHardcodedSubs": true
},
{
  "id": "bts_08",
  "videoId": "wu6bA3zK_us",
  "startTime": 1118,
  "endTime": 1121,
  "fullSentence": "진 형 어디 갔어요?   진 형, 밑에!",
  "blankWord": "어디 갔어요",
  "explanation": "In Korean, 에 is often omitted in everyday conversation when talking about destinations. Native speakers naturally say 어디 갔어요? instead of 어디에 갔어요? because the meaning is already clear from the context.",
  "hasHardcodedSubs": true
},
{
  "id": "bts_09",
  "videoId": "wu6bA3zK_us",
  "startTime": 1378,
  "endTime": 1380,
  "fullSentence": "이미 진 것 같은데!?!",
  "blankWord": "같은",
  "explanation": "Verb/Adjective + -(으)ㄴ/는 것 같다 = I think... / It seems like... / It looks like...\nUsed to express a guess, opinion, or impression.\nBTS는 멋있는 것 같아요...\n\nVerb/Adjective + -는데(요)\nSoftens the statement, provides background or context, and often invites the listener's response or implies that more is coming.\n맛있는데요? (It's good.. what do you think?)....\n",
  "hasHardcodedSubs": true
},
{
  "id": "bts_10",
  "videoId": "wu6bA3zK_us",
  "startTime": 1462,
  "endTime": 1465,
  "fullSentence": "야, 종료! 종료! 이건 우리가 이겼어",
  "blankWord": "우리가 이겼어",
  "explanation": "*이기다 win   이겼다 won\n  (지다  lost   졌다  lost)\n\n우리 팀이 이겼어요, 누가 이겼어요? 이번에는 우리가 졌어요...",
  "hasHardcodedSubs": true
},
{
  "id": "runseokjin_01",
  "videoId": "ADw_zMarJdk",
  "startTime": 12,
  "endTime": 13,
  "fullSentence": "옆에 있는 아미 분들과 같이",
  "blankWord": "옆에 있는",
  "explanation": "있는 = that is / which is / located somewhere.\n\n옆에 있는 친구, 집에 있는 강아지..",
  "hasHardcodedSubs": true
},
{
  "id": "runseokjin_02",
  "videoId": "ADw_zMarJdk",
  "startTime": 13,
  "endTime": 15,
  "fullSentence": "같이 '슈퍼 참치'하면서 놀면 너무 재미있을 것 같습니다.",
  "blankWord": "재미있을 것",
  "explanation": "Verb + -(으)ㄹ 것 같다 = I think... / It seems like... / It looks like... / Probably... \n\n 내일은 날씨가 좋을 것 같아요.",
  "hasHardcodedSubs": true
}
];

const STORAGE_KEY = 'kpop_quiz_stats_v1';
const SITE_URL = 'https://step-korean.com'; // 공유 링크 (배포 도메인에 맞게 교체)
const MAX_RECORD_MS = 10_000; // 최대 녹음 10초

// ── 유튜브 IFrame API 로더 (전역 콜백 안전 처리) ─────────────────────────────
let ytApiPromise = null;
function loadYouTubeApi() {
  if (ytApiPromise) return ytApiPromise;

  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve(window.YT);
    };
    if (!document.getElementById('youtube-iframe-api')) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  });
  return ytApiPromise;
}

// ── 날짜 유틸 (YYYY-MM-DD 로컬 기준) ─────────────────────────────────────────
function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function dayDiff(aKey, bKey) {
  const a = new Date(aKey + 'T00:00:00');
  const b = new Date(bKey + 'T00:00:00');
  return Math.round((b - a) / 86_400_000);
}

const SPEEDS = [
  { rate: 0.5, emoji: '🐌', label: '느리게' },
  { rate: 0.75, emoji: '🐢', label: '보통' },
  { rate: 1.0, emoji: '🐰', label: '원속도' },
];

const STATUS_ICON = { correct: '⭕', partial: '🔺', wrong: '❌' };

// 평소엔 완전히 고정, hover 시에만 살짝 떠오르는 공통 버튼 스타일
const liftBtn =
  'transition-transform duration-200 ease-out will-change-transform ' +
  'transform-gpu translate-y-0 hover:-translate-y-1 active:translate-y-0';

export default function KpopQuiz({ isLoggedIn: isLoggedInProp, user: userProp }) {
  // 관리자 전용 이메일: 이 계정으로 로그인했을 때만 Admin UI 렌더링
  const ADMIN_EMAIL = 'steppingstoneskorean@gmail.com';

  // UI 텍스트는 중앙 번역 시스템(kpop.* 키) 사용 — 딕테이션 원문은 한국어 고정
  const { t } = useLang();

  // 라우트 파라미터에서 videoId 추출
  const { videoId: routeVideoId } = useParams();

  // 로그인 상태: 외부 주입(prop) 우선, 없으면 Firebase Auth 컨텍스트 참조
  const authCtx = useAuth();
  const currentUser = userProp !== undefined ? userProp : authCtx && authCtx.user;
  const isLoggedIn =
    isLoggedInProp !== undefined ? isLoggedInProp : Boolean(currentUser);

  // 이메일이 ADMIN_EMAIL 과 완벽히 일치할 때만 true (로그아웃/일반 유저는 false)
  const isAdmin = Boolean(currentUser && currentUser.email === ADMIN_EMAIL);

  // ── 멀티 퀴즈 진행 state ───────────────────────────────────────────────────
  // routeVideoId에 맞는 퀴즈만 필터링
  const filteredQuizList = routeVideoId ? quizList.filter(q => q.videoId === routeVideoId) : quizList;
  // 현재 영상의 정보 (난이도 등) 가져오기
  const currentVideo = LIVE_VIDEOS.find(v => v.videoId === routeVideoId);
  const [list, setList] = useState(filteredQuizList);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]); // index별 'correct'|'partial'|'wrong'
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'done'
  const quiz = list[index];

  // ── 플레이어 관련 refs/state ───────────────────────────────────────────────
  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const loopTimerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [speed, setSpeed] = useState(1.0);

  // ── Cloze / 채점 state ─────────────────────────────────────────────────────
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'correct' | 'partial' | 'wrong'
  const [showReview, setShowReview] = useState(false); // 발음 포인트 복습 창

  // ── 학습 기록 state ────────────────────────────────────────────────────────
  const [stats, setStats] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      /* ignore */
    }
    return { streak: 0, score: 0, lastStudy: null };
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 1) 유튜브 플레이어 초기화 + 구간 반복
  // ─────────────────────────────────────────────────────────────────────────
  const isLoopingRef = useRef(isLooping);
  useEffect(() => {
    isLoopingRef.current = isLooping;
  }, [isLooping]);

  useEffect(() => {
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !playerHostRef.current) return;

      playerRef.current = new YT.Player(playerHostRef.current, {
        videoId: quiz.videoId,
        playerVars: {
          start: quiz.startTime,
          // end 는 지정하지 않는다: 문장이 바뀌면 구간도 바뀌므로
          // 구간 종료는 아래 interval 이 초정밀로 처리
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            setPlayerReady(true);
            e.target.seekTo(quiz.startTime, true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
      setPlayerReady(false);
    };
    // videoId 가 바뀌면(다른 영상의 퀴즈) 플레이어 재생성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.videoId]);

  // 구간 감시: endTime 도달 시 startTime 으로 되감기 (초정밀 반복)
  useEffect(() => {
    if (!playerReady) return;
    if (loopTimerRef.current) clearInterval(loopTimerRef.current);

    loopTimerRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p || !p.getCurrentTime) return;
      const t = p.getCurrentTime();
      if (t >= quiz.endTime) {
        if (isLoopingRef.current) {
          p.seekTo(quiz.startTime, true);
        } else if (p.pauseVideo) {
          p.pauseVideo();
        }
      }
    }, 120);

    return () => {
      if (loopTimerRef.current) clearInterval(loopTimerRef.current);
    };
  }, [playerReady, quiz.startTime, quiz.endTime]);

  // 배속 유지: 플레이어 준비/재생성 시에도 현재 배속 적용
  useEffect(() => {
    if (playerReady && playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(speed);
    }
  }, [playerReady, speed]);

  const replaySegment = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    p.seekTo(quiz.startTime, true);
    p.playVideo();
  }, [quiz.startTime]);

  // ─────────────────────────────────────────────────────────────────────────
  // 2) 미세 속도 조절
  // ─────────────────────────────────────────────────────────────────────────
  const changeSpeed = useCallback((rate) => {
    setSpeed(rate);
    if (playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(rate);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 6) LocalStorage 동기화 (학습 기록장)
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch {
      /* ignore quota / private mode */
    }
  }, [stats]);

  const recordStudy = useCallback((gainedScore) => {
    setStats((prev) => {
      const today = todayKey();
      let streak = prev.streak || 0;
      if (prev.lastStudy === today) {
        // 오늘 이미 기록됨 → streak 유지
      } else if (prev.lastStudy && dayDiff(prev.lastStudy, today) === 1) {
        streak += 1;
      } else {
        streak = 1;
      }
      return {
        streak,
        score: (prev.score || 0) + gainedScore,
        lastStudy: today,
      };
    });
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 3) Cloze 채점: 정답(O) / 세모(🔺 띄어쓰기만 오류) / 오답(X)
  // ─────────────────────────────────────────────────────────────────────────
  const checkAnswer = useCallback(() => {
    const raw = answer.trim();
    const target = quiz.blankWord.trim();
    // 모든 공백 제거 후 비교 → 글자는 같은데 띄어쓰기만 다른 경우 감지
    const stripSpaces = (s) => s.replace(/\s+/g, '');

    let verdict;
    if (raw === target) {
      verdict = 'correct';
      recordStudy(10);
    } else if (stripSpaces(raw) === stripSpaces(target)) {
      verdict = 'partial'; // 🔺 중간 점수
      recordStudy(5);
    } else {
      verdict = 'wrong';
    }

    setStatus(verdict);
    // 현재 문장의 결과 기록 (재시도 시 최신 판정으로 덮어씀)
    setResults((prev) => {
      const copy = [...prev];
      copy[index] = verdict;
      return copy;
    });
    // 제출 후 '발음 포인트 복습' 창 오픈 (다음 문장으로 넘어가는 관문)
    setShowReview(true);
  }, [answer, quiz.blankWord, recordStudy, index]);

  const resetAttempt = useCallback(() => {
    setAnswer('');
    setStatus('idle');
    setShowReview(false);
  }, []);

  // 퀴즈가 바뀌면(다음 문장/운영자 미리보기) 시도 상태 초기화
  useEffect(() => {
    resetAttempt();
  }, [quiz.id, resetAttempt]);

  // ─────────────────────────────────────────────────────────────────────────
  // 4) 문장 전환 / 최종 완료 흐름 제어
  // ─────────────────────────────────────────────────────────────────────────
  const isLast = index >= list.length - 1;

  const goNext = useCallback(() => {
    setShowReview(false);
    const p = playerRef.current;

    if (isLast) {
      setPhase('done');
      if (p && p.pauseVideo) p.pauseVideo();
      return;
    }

    const next = list[index + 1];
    setIndex(index + 1);
    if (p) {
      if (next.videoId !== quiz.videoId) {
        // 다른 영상이면 videoId effect 가 플레이어를 재생성
      } else if (p.seekTo) {
        p.seekTo(next.startTime, true);
        p.playVideo();
      }
    }
  }, [isLast, list, index, quiz.videoId]);

  const restartAll = useCallback(() => {
    setIndex(0);
    setResults([]);
    setPhase('quiz');
    resetAttempt();
    const p = playerRef.current;
    if (p && p.seekTo) {
      p.seekTo(list[0].startTime, true);
      p.playVideo();
    }
  }, [list, resetAttempt]);

  // 운영자 미리보기: 입력한 퀴즈 1개짜리 세트로 교체
  const previewQuiz = useCallback((data) => {
    setList([data]);
    setIndex(0);
    setResults([]);
    setPhase('quiz');
    const p = playerRef.current;
    if (p && p.seekTo && p.getVideoData) {
      p.seekTo(data.startTime, true);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 7) 성적 기반 바이럴 공유
  // ─────────────────────────────────────────────────────────────────────────
  const total = list.length;
  const correctCount = results.filter((r) => r === 'correct').length;
  const percent = total ? Math.round((correctCount / total) * 100) : 0;
  const shareText = t('kpop.shareText')
    .replace('{total}', String(total))
    .replace('{correct}', String(correctCount))
    .replace('{percent}', String(percent))
    .replace('{url}', SITE_URL);

  // fullSentence 를 blankWord 기준으로 분해 (prefix / suffix)
  const blankIdx = quiz.fullSentence.indexOf(quiz.blankWord);
  const prefix = blankIdx >= 0 ? quiz.fullSentence.slice(0, blankIdx) : quiz.fullSentence;
  const suffix =
    blankIdx >= 0 ? quiz.fullSentence.slice(blankIdx + quiz.blankWord.length) : '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-slate-800">
      {/* 컴포넌트 스코프 애니메이션 (index.css 수정 없이 주입) */}
      <style>{`
        @keyframes kq-shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-5px); }
          40%, 60% { transform: translateX(5px); }
        }
        .kq-shake { animation: kq-shake 0.5s cubic-bezier(.36,.07,.19,.97) both; }
        @keyframes kq-pop {
          0% { transform: scale(.92); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .kq-pop { animation: kq-pop .18s ease-out both; }
        @keyframes kq-pulse-rec { 0%,100%{ opacity:1 } 50%{ opacity:.35 } }
        .kq-rec-dot { animation: kq-pulse-rec 1s infinite; }
      `}</style>

      {/* ── 상단: 학습 기록 뱃지 + 진행 상황 ────────────────────────────── */}
      <header className="mb-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <div className="min-w-0 text-center sm:text-left">
          <h1 className="text-balance break-keep text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {t('kpop.title')}
          </h1>
          <p className="text-balance break-keep text-sm text-slate-500">{t('kpop.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700 shadow-sm">
            📄{' '}
            {t('kpop.progress')
              .replace('{i}', String(Math.min(index + 1, total)))
              .replace('{n}', String(total))}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-orange-100 px-3 py-1.5 text-sm font-bold text-orange-700 shadow-sm">
            🔥 {t('kpop.streak').replace('{n}', String(stats.streak))}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700 shadow-sm">
            ⭐ {t('kpop.points').replace('{n}', String(stats.score))}
          </span>
        </div>
      </header>

      {/* ── 유튜브 플레이어 (done 단계에서는 숨김만 — 파괴하지 않음) ──────── */}
      <section
        className={`overflow-hidden rounded-2xl bg-black shadow-lg ${
          phase === 'done' ? 'hidden' : ''
        }`}
      >
        <div className="relative aspect-video w-full">
          <div ref={playerHostRef} className="absolute inset-0 h-full w-full" />
          {!playerReady && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/70">
              {t('kpop.loadingPlayer')}
            </div>
          )}
          {/* 하드코딩 자막 블라인드: Frosted Glass 오버레이
              - 비율(%) 기반 높이라 모바일에서도 하단 영역을 동일하게 가림
              - pointer-events-none: 유튜브 기본 컨트롤 바 클릭을 방해하지 않음
              - 움직임은 은은히 비치되 텍스트는 판독 불가 (bg-black/40 + backdrop-blur-md) */}
          {quiz.hasHardcodedSubs && playerReady && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-[22%] items-center justify-center bg-black/40 backdrop-blur-md"
            >
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-white/60 sm:text-sm">
                <span>🔒</span>
                {t('kpop.listenCarefully')}
              </p>
            </div>
          )}
        </div>
      </section>

      {phase === 'quiz' && (
        <>
          {/* ── 컨트롤 바: 반복 / 다시듣기 / 속도 ─────────────────────────── */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={replaySegment}
                className={`${liftBtn} rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800`}
              >
                {t('kpop.replay')}
              </button>
              <button
                onClick={() => setIsLooping((v) => !v)}
                className={`${liftBtn} rounded-xl px-4 py-2 text-sm font-semibold shadow ${
                  isLooping
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {isLooping ? t('kpop.loopOn') : t('kpop.loopOff')}
              </button>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {SPEEDS.map((s) => (
                <button
                  key={s.rate}
                  onClick={() => changeSpeed(s.rate)}
                  title={`${s.label} (${s.rate}x)`}
                  className={`${liftBtn} rounded-lg px-3 py-1.5 text-sm font-bold ${
                    speed === s.rate
                      ? 'bg-white text-slate-900 shadow'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="mr-1 text-base">{s.emoji}</span>
                  {s.rate}x
                </button>
              ))}
            </div>
          </div>

          {/* ── Cloze 빈칸 뚫기 ───────────────────────────────────────────── */}
          <section
            className={`mt-6 rounded-2xl border-2 bg-white p-5 shadow-sm transition-colors ${
              status === 'correct'
                ? 'border-emerald-400'
                : status === 'partial'
                ? 'border-amber-400'
                : status === 'wrong'
                ? 'border-red-400'
                : 'border-slate-200'
            } ${status === 'wrong' ? 'kq-shake' : ''}`}
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('kpop.clozePrompt')}
            </p>
            {/* 딕테이션 원문 + 입력창: 크롬 자동 번역 차단 (translate="no" + notranslate) */}
            <div
              translate="no"
              className="notranslate flex flex-wrap items-center gap-1 text-lg leading-relaxed"
            >
              <span>{prefix}</span>
              <input
                translate="no"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value);
                  if (status !== 'idle') setStatus('idle');
                }}
                onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                placeholder={t('kpop.answerPlaceholder')}
                className={`notranslate min-w-[7rem] rounded-lg border-2 px-3 py-1 text-center font-bold outline-none transition-colors ${
                  status === 'correct'
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                    : status === 'partial'
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : status === 'wrong'
                    ? 'border-red-400 bg-red-50 text-red-700'
                    : 'border-slate-300 focus:border-indigo-400'
                }`}
              />
              <span>{suffix}</span>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                onClick={checkAnswer}
                disabled={!answer.trim()}
                className={`${liftBtn} rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {t('kpop.check')}
              </button>
              <button
                onClick={resetAttempt}
                className={`${liftBtn} rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 shadow hover:bg-slate-200`}
              >
                {t('kpop.reset')}
              </button>
              {status === 'correct' && (
                <span className="kq-pop text-sm font-bold text-emerald-600">
                  {t('kpop.correctMsg')}
                </span>
              )}
              {status === 'partial' && (
                <span className="kq-pop text-sm font-bold text-amber-600">
                  {t('kpop.partialMsg')}
                </span>
              )}
              {status === 'wrong' && (
                <span className="kq-pop text-sm font-bold text-red-500">
                  {t('kpop.wrongMsg')}
                </span>
              )}
            </div>
          </section>

          {/* ── 섀도잉 녹음기 ─────────────────────────────────────────────── */}
          <ShadowingRecorder liftBtn={liftBtn} />
        </>
      )}

      {/* ── 최종 완료 창 (로그인 전용 복습 리스트 포함) ────────────────────── */}
      {phase === 'done' && (
        <FinalResult
          list={list}
          results={results}
          total={total}
          correctCount={correctCount}
          percent={percent}
          isLoggedIn={isLoggedIn}
          shareText={shareText}
          liftBtn={liftBtn}
          onRestart={restartAll}
        />
      )}

      {/* ── 운영자용 데이터 생성기: 관리자 이메일 일치 시에만 DOM 에 존재 ── */}
      {isAdmin && (
        <AdminQuizBuilder liftBtn={liftBtn} onPreview={previewQuiz} currentQuiz={quiz} />
      )}

      {/* ── 발음 포인트 복습 창 (문장 전환 관문) ──────────────────────────── */}
      {showReview && phase === 'quiz' && (
        <ReviewModal
          status={status}
          quiz={quiz}
          answer={answer}
          isLast={isLast}
          liftBtn={liftBtn}
          onReplay={() => {
            setShowReview(false);
            replaySegment();
          }}
          onNext={goNext}
          onClose={() => setShowReview(false)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 발음 포인트 복습 창: 채점 결과 + 해설 + '다음 문장 듣기' 흐름 제어
// ─────────────────────────────────────────────────────────────────────────────
function ReviewModal({ status, quiz, answer, isLast, liftBtn, onReplay, onNext, onClose }) {
  const { t } = useLang();
  const isCorrect = status === 'correct';
  const isPartial = status === 'partial';
  // explanation 이 비어 있으면 해설 영역 자체를 렌더링하지 않음 (조건부 숨김)
  const hasExplanation = Boolean(quiz.explanation && quiz.explanation.trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="kq-pop max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-500">
          {t('kpop.reviewTag')}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xl">{isCorrect ? '🎯' : isPartial ? '🔺' : '📝'}</span>
          <h3 className="text-lg font-extrabold text-slate-900">
            {isCorrect
              ? t('kpop.reviewCorrect')
              : isPartial
              ? t('kpop.reviewPartial')
              : t('kpop.reviewWrong')}
          </h3>
        </div>

        {/* 전체 문장 (빈칸 단어 하이라이트) — 한국어 원문 보호 */}
        <p
          translate="no"
          className="notranslate mt-3 rounded-xl bg-indigo-50 p-3 text-sm leading-relaxed text-indigo-900"
        >
          {quiz.fullSentence.split(quiz.blankWord).map((part, i, arr) => (
            <span key={i}>
              {part}
              {i < arr.length - 1 && (
                <mark className="rounded bg-indigo-200 px-1 font-bold text-indigo-900">
                  {quiz.blankWord}
                </mark>
              )}
            </span>
          ))}
        </p>

        <dl className="mt-3 space-y-2 rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-slate-400">{t('kpop.myAnswer')}</dt>
            <dd
              translate="no"
              className={`notranslate ${
                isCorrect
                  ? 'font-bold text-emerald-600'
                  : isPartial
                  ? 'font-bold text-amber-600'
                  : 'font-bold text-red-500'
              }`}
            >
              {answer.trim() || t('kpop.emptyAnswer')}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-slate-400">{t('kpop.answerLabel')}</dt>
            <dd translate="no" className="notranslate font-bold text-slate-900">
              {quiz.blankWord}
            </dd>
          </div>
        </dl>

        {isPartial && (
          <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm font-semibold leading-relaxed text-amber-800">
              {t('kpop.partialBox')}
            </p>
          </div>
        )}

        {hasExplanation && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-amber-600">
              {t('kpop.explTitle')}
            </p>
            {/* pre-wrap: 해설의 줄바꿈을 그대로 살려 자연스럽게 아래로 정렬 */}
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900">
              {quiz.explanation}
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onReplay}
            className={`${liftBtn} rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200`}
          >
            {t('kpop.listenAgain')}
          </button>
          <button
            onClick={onNext}
            className={`${liftBtn} rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700`}
          >
            {isLast ? t('kpop.seeResults') : t('kpop.nextSentence')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 최종 완료 창: 성적 요약 + 성적 기반 공유 + (로그인 전용) 전체 복습 리스트
// ─────────────────────────────────────────────────────────────────────────────
function FinalResult({
  list,
  results,
  total,
  correctCount,
  percent,
  isLoggedIn,
  shareText,
  liftBtn,
  onRestart,
}) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const shareToX = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="kq-pop mt-6 space-y-6">
      {/* 성적 요약 */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-2 text-balance break-keep text-xl font-extrabold text-slate-900">
          {t('kpop.doneTitle')}
        </h2>
        <p className="mt-2 text-balance break-keep text-sm font-semibold text-slate-500">
          {t('kpop.doneSummary')
            .replace('{total}', String(total))
            .replace('{correct}', String(correctCount))
            .replace('{percent}', String(percent))}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={onRestart}
            className={`${liftBtn} rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800`}
          >
            {t('kpop.restart')}
          </button>
        </div>
      </section>

      {/* 성적 기반 바이럴 공유 */}
      <section className="rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 p-5 text-white shadow-lg">
        <p className="text-sm font-semibold opacity-90">{t('kpop.shareTitle')}</p>
        <p className="mt-1 text-base font-bold leading-snug">“{shareText}”</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={copyShare}
            className={`${liftBtn} rounded-xl bg-white/95 px-4 py-2 text-sm font-bold text-indigo-700 shadow hover:bg-white`}
          >
            {copied ? t('kpop.copied') : t('kpop.copyLink')}
          </button>
          <button
            onClick={shareToX}
            className={`${liftBtn} rounded-xl bg-black px-4 py-2 text-sm font-bold text-white shadow hover:bg-slate-900`}
          >
            {t('kpop.shareX')}
          </button>
        </div>
      </section>

      {/* 전체 문장 복습 리스트 — 로그인 사용자 전용 */}
      {isLoggedIn ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">{t('kpop.reviewListTitle')}</h3>
          <ul className="mt-3 space-y-3">
            {list.map((q, i) => {
              const hasExp = Boolean(q.explanation && q.explanation.trim());
              return (
                <li key={q.id} className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-start gap-2">
                    <span className="text-lg leading-6">
                      {STATUS_ICON[results[i]] || '➖'}
                    </span>
                    <div className="min-w-0">
                      {/* 복습 리스트의 한국어 원문도 자동 번역 차단 */}
                      <p translate="no" className="notranslate text-sm leading-relaxed text-slate-800">
                        {q.fullSentence.split(q.blankWord).map((part, j, arr) => (
                          <span key={j}>
                            {part}
                            {j < arr.length - 1 && (
                              <b className="text-indigo-700">{q.blankWord}</b>
                            )}
                          </span>
                        ))}
                      </p>
                      {/* 해설이 있을 때만 노출 + 줄바꿈 유지(pre-wrap) */}
                      {hasExp && (
                        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-amber-50 p-2 text-xs leading-relaxed text-amber-800">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <section className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-2xl">🔒</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {t('kpop.loginRequired')}
          </p>
          <a
            href="/login"
            className={`${liftBtn} mt-4 inline-block rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700`}
          >
            {t('kpop.loginCta')}
          </a>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Audio 기반 섀도잉 녹음기 (서버 전송 없음, 로컬 blob URL 만 사용)
// ─────────────────────────────────────────────────────────────────────────────
function ShadowingRecorder({ liftBtn }) {
  const { t } = useLang();
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const stopTimerRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const rec = new MediaRecorder(stream);
      mediaRecorderRef.current = rec;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        setRecording(false);
      };

      rec.start();
      setRecording(true);
      stopTimerRef.current = setTimeout(() => {
        if (rec.state === 'recording') rec.stop();
      }, MAX_RECORD_MS);
    } catch {
      setError(t('kpop.recError'));
      setRecording(false);
    }
  }, [t]);

  const stopRecording = useCallback(() => {
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    const rec = mediaRecorderRef.current;
    if (rec && rec.state === 'recording') rec.stop();
  }, []);

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">{t('kpop.recTitle')}</h3>
          <p className="text-xs text-slate-500">{t('kpop.recSub')}</p>
        </div>
        {recording && (
          <span className="flex items-center gap-1.5 text-sm font-bold text-red-500">
            <span className="kq-rec-dot h-2.5 w-2.5 rounded-full bg-red-500" />
            REC
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!recording ? (
          <button
            onClick={startRecording}
            className={`${liftBtn} rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-600`}
          >
            {t('kpop.recStart')}
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className={`${liftBtn} rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-900`}
          >
            {t('kpop.recStop')}
          </button>
        )}

        {audioUrl && !recording && (
          <audio src={audioUrl} controls className="h-9 max-w-full" />
        )}
      </div>

      {error && <p className="mt-2 text-sm font-medium text-red-500">{error}</p>}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 운영자용 퀴즈 데이터 생성기 (아코디언 + JSON Export)
// ─────────────────────────────────────────────────────────────────────────────
function AdminQuizBuilder({ liftBtn, onPreview, currentQuiz }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    id: currentQuiz.id,
    videoUrl: `https://youtu.be/${currentQuiz.videoId}?t=${currentQuiz.startTime}`,
    startTime: currentQuiz.startTime,
    endTime: currentQuiz.endTime,
    fullSentence: currentQuiz.fullSentence,
    blankWord: currentQuiz.blankWord,
    explanation: currentQuiz.explanation,
    hasHardcodedSubs: Boolean(currentQuiz.hasHardcodedSubs),
  });
  const [copied, setCopied] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // URL 에서 videoId 추출 (youtu.be / watch?v= / embed 모두 지원)
  const extractVideoId = (url) => {
    if (!url) return '';
    const patterns = [
      /(?:youtu\.be\/)([\w-]{11})/,
      /(?:v=)([\w-]{11})/,
      /(?:embed\/)([\w-]{11})/,
    ];
    for (const re of patterns) {
      const m = url.match(re);
      if (m) return m[1];
    }
    if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
    return '';
  };

  const buildData = () => ({
    id: form.id.trim() || 'quiz_unnamed',
    videoId: extractVideoId(form.videoUrl),
    startTime: Number(form.startTime) || 0,
    endTime: Number(form.endTime) || 0,
    fullSentence: form.fullSentence,
    blankWord: form.blankWord,
    explanation: form.explanation,
    hasHardcodedSubs: Boolean(form.hasHardcodedSubs),
  });

  const json = JSON.stringify(buildData(), null, 2);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const field =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400';

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-700">
          🛠️ 운영자 도구 · 퀴즈 데이터 생성기
        </span>
        <span
          className={`text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-500">
              퀴즈 ID
              <input className={`mt-1 ${field}`} value={form.id} onChange={set('id')} />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              영상 URL 또는 ID
              <input
                className={`mt-1 ${field}`}
                value={form.videoUrl}
                onChange={set('videoUrl')}
                placeholder="https://youtu.be/..."
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              시작 시간 (초)
              <input
                type="number"
                className={`mt-1 ${field}`}
                value={form.startTime}
                onChange={set('startTime')}
              />
            </label>
            <label className="text-xs font-semibold text-slate-500">
              종료 시간 (초)
              <input
                type="number"
                className={`mt-1 ${field}`}
                value={form.endTime}
                onChange={set('endTime')}
              />
            </label>
            <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
              전체 문장 (fullSentence)
              <input
                className={`mt-1 ${field}`}
                value={form.fullSentence}
                onChange={set('fullSentence')}
              />
            </label>
            <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
              빈칸 단어 (blankWord)
              <input
                className={`mt-1 ${field}`}
                value={form.blankWord}
                onChange={set('blankWord')}
              />
            </label>
            <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
              해설 (explanation) — 줄바꿈 입력 가능, 비워두면 해설창 숨김
              <textarea
                rows={3}
                className={`mt-1 ${field} whitespace-pre-wrap`}
                value={form.explanation}
                onChange={set('explanation')}
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.hasHardcodedSubs}
                onChange={(e) =>
                  setForm((f) => ({ ...f, hasHardcodedSubs: e.target.checked }))
                }
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
              />
              영상에 박힌 자막 있음 (hasHardcodedSubs) — 체크 시 하단 블라인드 오버레이 표시
            </label>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onPreview(buildData())}
              disabled={!extractVideoId(form.videoUrl)}
              className={`${liftBtn} rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 disabled:opacity-40`}
            >
              ▶ 이 퀴즈로 미리보기
            </button>
            <button
              onClick={copyJson}
              className={`${liftBtn} rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800`}
            >
              {copied ? '✔ JSON 복사됨' : '📋 JSON 복사'}
            </button>
          </div>

          <p className="mt-4 mb-1 text-xs font-semibold text-slate-500">
            Export (JSON) — quizList 배열에 그대로 추가
          </p>
          <textarea
            readOnly
            value={json}
            rows={10}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-700 outline-none"
          />
          {!extractVideoId(form.videoUrl) && (
            <p className="mt-2 text-xs font-medium text-amber-600">
              ⚠️ 유효한 영상 URL/ID 를 입력하면 videoId 가 자동 추출됩니다.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
