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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { useLang } from '@/lib/i18n';
import { ARTISTS, LIVE_VIDEOS, MODE_ORDER } from '@/data/kArtistLive';
import { loadPublishedQuizzes, loadModeStars } from '@/lib/quizStore';
import { mergeQuizzes } from '@/lib/quizResolve';
import { HARDCODED_QUIZZES } from '@/data/hardcodedQuizzes';
import { recordModeClear, getVideoProgress } from '@/lib/mastery';
import { ModeChip } from '@/components/kartist/ui';

// 레거시(mode 없음) 문항은 'A'(딕테이션)로 간주
const modeOf = (q) => (q && q.mode) || 'A';

// B 모드용 셔플 (Fisher–Yates)
function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
import ChallengeShare from '@/components/ChallengeShare';

// 운영자 아티스트 태깅 옵션 ('__all__' 제외 — 필터 시스템과 동일 소스)
const ARTIST_OPTIONS = ARTISTS.filter((a) => a !== '__all__');

// ── 샘플 데이터: 멀티 문장 배열 (두 번째 문제는 해설 숨김 테스트용) ────────────
// explanation 은 다국어 객체 { en, ja, es, zh, vi } — 한국어 원문/예문은 어떤 언어에서도 번역하지 않는다.
// 문자열 형태(레거시/Firestore 배포본)와 공존해야 하므로 렌더링 쪽은 pickExplanation() 을 거친다.
const quizList = HARDCODED_QUIZZES;

// explanation 다국어 객체에서 현재 UI 언어에 맞는 텍스트를 고른다.
//   · 한국어 학습자 대상 콘텐츠라 'ko' UI 및 미번역 언어는 영어로 폴백한다.
//   · 문자열(레거시 데이터 / Firestore 배포본 — api/generate-quiz.js 는 string 을 반환)도
//     그대로 받아 그대로 반환해 하위 호환을 지킨다.
function pickExplanation(explanation, lang) {
  if (!explanation) return '';
  if (typeof explanation === 'string') return explanation;
  return explanation[lang] || explanation.en || '';
}

const STORAGE_KEY = 'kpop_quiz_stats_v1';
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
  // routeVideoId에 맞는 퀴즈만 필터링 (하드코딩 fallback)
  const filteredQuizList = routeVideoId ? quizList.filter(q => q.videoId === routeVideoId) : quizList;
  // 현재 영상의 정보 (난이도 등) 가져오기
  const currentVideo = LIVE_VIDEOS.find(v => v.videoId === routeVideoId);

  // 전체 문항(전 모드) — 모드별로 그룹핑해 세션을 구성한다
  const [allItems, setAllItems] = useState(filteredQuizList);
  const [activeMode, setActiveMode] = useState(null); // 'B' | 'I' | 'A' | null(선택 화면)
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]); // index별 'correct'|'partial'|'wrong'
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'done'
  const [mastery, setMastery] = useState(false); // 이번 세션에서 마스터리 달성 여부
  const [modeStars, setModeStars] = useState(null); // Firestore 운영자 설정 별점
  const [remoteChecked, setRemoteChecked] = useState(false); // 배포본 조회 완료 여부 (로딩/CS 구분)

  // 모드별 문항 맵 + 실제 문항이 존재하는 모드 목록
  const modeMap = useMemo(() => {
    const map = { B: [], I: [], A: [] };
    for (const q of allItems) map[modeOf(q)].push(q);
    return map;
  }, [allItems]);
  const availableGameModes = MODE_ORDER.filter((m) => modeMap[m].length > 0);

  const list = activeMode ? modeMap[activeMode] : [];
  const quiz = list[index];

  // 모드가 1개뿐이면 선택 화면 없이 자동 진입 / 선택된 모드가 사라지면 선택 화면으로 복귀
  useEffect(() => {
    if (!activeMode && availableGameModes.length === 1) {
      setActiveMode(availableGameModes[0]);
    } else if (activeMode && modeMap[activeMode].length === 0) {
      setActiveMode(null);
      setIndex(0);
    }
  }, [activeMode, availableGameModes, modeMap]);

  // 배포본(published)과 하드코딩을 "모드 단위"로 병합한다.
  //   · 배포된 모드는 배포본이 우선, 배포되지 않은 모드는 하드코딩 폴백
  //   → B 만 새로 배포해도 기존 A(하드코딩)가 사라지지 않아 모드 선택 화면이 정상 표시된다
  useEffect(() => {
    if (!routeVideoId) return;
    let cancelled = false;
    loadPublishedQuizzes(routeVideoId)
      .then((published) => {
        if (cancelled) return;
        const merged = mergeQuizzes(routeVideoId, published);
        if (merged.length === 0) return;
        setAllItems(merged);
        setActiveMode(null); // 새 데이터 기준으로 모드 재선택(1개면 자동 진입)
        setIndex(0);
        setResults([]);
        setPhase('quiz');
      })
      .catch(() => { /* 오프라인/규칙 오류 시 하드코딩 fallback 유지 */ })
      .finally(() => { if (!cancelled) setRemoteChecked(true); });
    loadModeStars(routeVideoId)
      .then((ms) => { if (!cancelled) setModeStars(ms); })
      .catch(() => { /* 별점 미설정 시 코드 기본값 사용 */ });
    return () => { cancelled = true; };
  }, [routeVideoId]);

  // 모드 선택 → 해당 모드 첫 문항으로 세션 시작
  // (실제 재생은 activeMode 확정 후 아래 자동재생 effect 가 처리한다)
  const selectMode = useCallback((m) => {
    setActiveMode(m);
    setIndex(0);
    setResults([]);
    setPhase('quiz');
    setMastery(false);
  }, []);

  // ── 플레이어 관련 refs/state ───────────────────────────────────────────────
  const playerHostRef = useRef(null);
  const playerRef = useRef(null);
  const loopTimerRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const [speed, setSpeed] = useState(0.75);

  // ── Cloze / 채점 state ─────────────────────────────────────────────────────
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'correct' | 'partial' | 'wrong'
  const [showReview, setShowReview] = useState(false); // 발음 포인트 복습 창
  const [hintShown, setHintShown] = useState(false); // 힌트 공개 여부 (모든 유저에게 제공)
  // B 모드: 셔플된 블록 중 선택한 인덱스 순서 / I 모드: 선택한 보기 인덱스
  const [picked, setPicked] = useState([]);
  const [chosenIdx, setChosenIdx] = useState(null);

  // B 모드: 문항이 바뀔 때마다 블록을 새로 셔플 (원본 순서 = 정답 순서)
  const shuffledBlocks = useMemo(() => {
    if (!quiz || modeOf(quiz) !== 'B' || !Array.isArray(quiz.blocks)) return null;
    return shuffleArr(quiz.blocks.map((text, i) => ({ text, key: `${i}-${text}` })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz && quiz.id]);

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

  // 모드 선택 화면에서도 영상 미리보기가 뜨도록 quiz 가 없으면 라우트 videoId 로 폴백
  const playerVideoId = (quiz && quiz.videoId) || routeVideoId;
  const playerStartTime = quiz ? quiz.startTime : (allItems[0] && allItems[0].startTime) || 0;
  // 문항이 하나도 없으면 위 early-return 으로 플레이어 host 가 DOM 에 없다.
  // 배포본이 늦게 도착하는 영상(하드코딩 0개)을 위해, host 가 생기는 순간 effect 를 다시 돌린다.
  const hasAnyItems = availableGameModes.length > 0;

  useEffect(() => {
    if (!playerVideoId || !hasAnyItems) return; // host div 가 아직 없음 (로딩/Coming Soon 화면)
    let cancelled = false;

    loadYouTubeApi().then((YT) => {
      if (cancelled || !playerHostRef.current) return;

      playerRef.current = new YT.Player(playerHostRef.current, {
        videoId: playerVideoId,
        playerVars: {
          start: playerStartTime,
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
            // 구간만 맞춰두고 재생은 하지 않는다.
            // (모드 선택 전 자동재생 방지 — 실제 재생은 activeMode 확정 후 아래 effect 가 담당)
            e.target.seekTo(playerStartTime, true);
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
    // videoId 가 바뀌거나(다른 영상) 문항이 처음 도착하면 플레이어 (재)생성
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerVideoId, hasAnyItems]);

  // 모드가 선택되고(activeMode 확정) 플레이어가 준비되면 첫 구간부터 자동 재생.
  //   · 모드 선택 화면(activeMode=null)에서는 재생하지 않는다 → 선택 전 자동재생 방지
  //   · 문항 이동(index 변경)은 여기서 다루지 않는다 (goNext 가 별도 처리)
  useEffect(() => {
    if (!activeMode || !playerReady) return;
    const p = playerRef.current;
    if (p && p.seekTo) {
      p.seekTo(playerStartTime, true);
      if (p.playVideo) p.playVideo();
    }
    // playerStartTime 은 의도적으로 deps 에서 제외 (문항 이동 시 재재생 방지)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMode, playerReady]);

  // 구간 감시: endTime 도달 시 startTime 으로 되감기 (초정밀 반복)
  useEffect(() => {
    if (!playerReady || !quiz) return;
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
  }, [playerReady, quiz?.startTime, quiz?.endTime]);

  // 문항별 자동 배속: 새 문항으로 넘어가면 저장된 initialSpeed 로 재설정
  // (미지정 시 K-Artist Live 기본값 0.75 — 원어민 속도가 빨라 학습자 배려)
  useEffect(() => {
    if (!quiz) return;
    setSpeed(quiz.initialSpeed || 0.75);
  }, [quiz?.id]);

  // 배속 유지: 플레이어 준비/재생성 시에도 현재 배속 적용
  useEffect(() => {
    if (playerReady && playerRef.current && playerRef.current.setPlaybackRate) {
      playerRef.current.setPlaybackRate(speed);
    }
  }, [playerReady, speed]);

  const replaySegment = useCallback(() => {
    const p = playerRef.current;
    if (!p || !quiz) return;
    p.seekTo(quiz.startTime, true);
    p.playVideo();
  }, [quiz?.startTime]);

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
    if (!quiz) return;
    const m = modeOf(quiz);
    let verdict;

    if (m === 'B') {
      // 블록 배열: 선택 순서가 원본(정답) 순서와 일치하면 정답
      const built = picked.map((i) => (shuffledBlocks ? shuffledBlocks[i].text : '')).join(' ');
      verdict = built === (quiz.blocks || []).join(' ') ? 'correct' : 'wrong';
      if (verdict === 'correct') recordStudy(10);
    } else if (m === 'I') {
      // 의미 고르기: 선택 보기 == correctIndex
      verdict = chosenIdx === quiz.correctIndex ? 'correct' : 'wrong';
      if (verdict === 'correct') recordStudy(10);
    } else {
      const raw = answer.trim();
      const target = (quiz.blankWord || '').trim();
      // 모든 공백 제거 후 비교 → 글자는 같은데 띄어쓰기만 다른 경우 감지
      const stripSpaces = (s) => s.replace(/\s+/g, '');

      if (raw === target) {
        verdict = 'correct';
        recordStudy(10);
      } else if (stripSpaces(raw) === stripSpaces(target)) {
        verdict = 'partial'; // 🔺 중간 점수
        recordStudy(5);
      } else {
        verdict = 'wrong';
      }
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
  }, [answer, quiz, picked, chosenIdx, shuffledBlocks, recordStudy, index]);

  const resetAttempt = useCallback(() => {
    setAnswer('');
    setStatus('idle');
    setShowReview(false);
    setHintShown(false);
    setPicked([]);
    setChosenIdx(null);
  }, []);

  // 퀴즈가 바뀌면(다음 문장/운영자 미리보기) 시도 상태 초기화
  useEffect(() => {
    resetAttempt();
  }, [quiz?.id, resetAttempt]);

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
  }, [isLast, list, index, quiz?.videoId]);

  const restartAll = useCallback(() => {
    setIndex(0);
    setResults([]);
    setPhase('quiz');
    setMastery(false);
    resetAttempt();
    const p = playerRef.current;
    if (p && p.seekTo && list[0]) {
      p.seekTo(list[0].startTime, true);
      p.playVideo();
    }
  }, [list, resetAttempt]);

  // 다른 모드 도전: 모드 선택 화면으로 복귀
  const changeMode = useCallback(() => {
    setActiveMode(null);
    setIndex(0);
    setResults([]);
    setPhase('quiz');
    setMastery(false);
    resetAttempt();
  }, [resetAttempt]);

  // 운영자 미리보기: 입력한 퀴즈 1개짜리 세트로 교체 (A 모드)
  const previewQuiz = useCallback((data) => {
    setAllItems([{ ...data, mode: 'A' }]);
    setActiveMode('A');
    setIndex(0);
    setResults([]);
    setPhase('quiz');
    const p = playerRef.current;
    if (p && p.seekTo && p.getVideoData) {
      p.seekTo(data.startTime, true);
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // 마스터리: 세션 완료(60% 이상 정답) 시 해당 모드 클리어 기록.
  // 영상이 제공하는 모든 모드를 클리어하면 masteryAchieved → 👑
  // ─────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'done' || !routeVideoId || !activeMode || list.length === 0) return;
    const correct = results.filter((r) => r === 'correct').length;
    if (correct / list.length < 0.6) return; // 클리어 기준: 정답률 60% 이상
    // 마스터리 기준 = 이 영상에 실제로 존재하는 모드 전부 (배포본 ∪ 하드코딩)
    const progress = recordModeClear(routeVideoId, activeMode, availableGameModes);
    setMastery(progress.masteryAchieved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ─────────────────────────────────────────────────────────────────────────
  // 7) 성적 기반 바이럴 공유
  //    · Wordle 방식: 정답을 스포일하지 않는 문항별 이모지 그리드 (⭕🔺❌)
  //    · Duolingo 방식: 스트릭(🔥)을 카드에 노출해 공유 동기 강화
  // ─────────────────────────────────────────────────────────────────────────
  const total = list.length;
  const correctCount = results.filter((r) => r === 'correct').length;
  const percent = total ? Math.round((correctCount / total) * 100) : 0;
  const artistName = (currentVideo && currentVideo.artist) || 'K-pop';
  // 5문항씩 줄바꿈 — 트윗/카톡에서 그리드 모양 유지
  const emojiGrid = Array.from({ length: Math.ceil(results.length / 5) }, (_, r) =>
    results.slice(r * 5, r * 5 + 5).map((v) => STATUS_ICON[v] || '⬜').join(''),
  ).join('\n');
  const shareUrl = `${window.location.origin}/kpop-quiz/${routeVideoId || ''}`;
  const shareText =
    t('kpop.shareText')
      .replace('{artist}', artistName)
      .replace('{total}', String(total))
      .replace('{correct}', String(correctCount))
      .replace('{percent}', String(percent))
      .replace('{url}', shareUrl) + (emojiGrid ? `\n\n${emojiGrid}` : '');

  // 아직 퀴즈가 전혀 없음:
  //   · 배포본 조회가 끝나기 전(하드코딩도 없음) → 로딩 표시 (무한 "Loading player" 방지)
  //   · 조회가 끝났는데도 없음 → 미배포 영상 (Coming Soon)
  if (availableGameModes.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-slate-500">
        <p className="text-4xl">{remoteChecked ? '🎬' : '⏳'}</p>
        <p className="mt-3 text-sm font-semibold">
          {remoteChecked ? t('kartist.comingSoonSub') : t('kpop.loadingPlayer')}
        </p>
      </div>
    );
  }

  const currentMode = quiz ? modeOf(quiz) : null;

  // A 모드: fullSentence 를 blankWord 기준으로 분해 (prefix / suffix)
  const blankIdx =
    quiz && quiz.blankWord ? quiz.fullSentence.indexOf(quiz.blankWord) : -1;
  const prefix = quiz
    ? blankIdx >= 0
      ? quiz.fullSentence.slice(0, blankIdx)
      : quiz.fullSentence
    : '';
  const suffix =
    quiz && blankIdx >= 0
      ? quiz.fullSentence.slice(blankIdx + quiz.blankWord.length)
      : '';

  // B 모드: 현재 조립 중인 문장 / I·B 공용 리뷰 표시 텍스트
  const builtSentence = picked
    .map((i) => (shuffledBlocks ? shuffledBlocks[i].text : ''))
    .join(' ');
  const answerText =
    currentMode === 'B'
      ? builtSentence
      : currentMode === 'I'
      ? (quiz && Array.isArray(quiz.options) && chosenIdx != null ? quiz.options[chosenIdx] : '')
      : answer;
  const correctText = quiz
    ? currentMode === 'B'
      ? (quiz.blocks || []).join(' ')
      : currentMode === 'I'
      ? (Array.isArray(quiz.options) ? quiz.options[quiz.correctIndex] : '')
      : quiz.blankWord || ''
    : '';

  // 모드 선택 카드에 표시할 정보 (문항 수 · 별점 · 클리어 여부)
  const videoProgress = routeVideoId ? getVideoProgress(routeVideoId) : { clearedModes: [], masteryAchieved: false };
  // 별점: Firestore modeStars(운영자 설정) > 코드 availableModes > 기본 1
  const declaredStars = (m) => {
    const fromDoc = modeStars && modeStars[m];
    if (fromDoc) return fromDoc;
    const info = currentVideo && currentVideo.availableModes
      ? currentVideo.availableModes.find((x) => x.mode === m)
      : null;
    return info ? info.stars : 1;
  };

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
          {activeMode && total > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-indigo-100 px-3 py-1.5 text-sm font-bold text-indigo-700 shadow-sm">
              <ModeChip mode={activeMode} /> 📄{' '}
              {t('kpop.progress')
                .replace('{i}', String(Math.min(index + 1, total)))
                .replace('{n}', String(total))}
            </span>
          )}
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
          {quiz && quiz.hasHardcodedSubs && playerReady && (
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

      {/* ── 모드 선택 화면 (B/I/A 중 2개 이상 제공 시) ─────────────────────── */}
      {!activeMode && (
        <section className="mt-6 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-center text-lg font-extrabold text-slate-900">
            {t('mode.selectTitle')}
          </h2>
          <p className="mt-1 text-center text-xs font-semibold text-slate-500">
            {t('mode.selectSub')}
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {MODE_ORDER.map((m) => {
              const has = modeMap[m].length > 0;
              const stars = declaredStars(m);
              const cleared = videoProgress.clearedModes.includes(m);
              const name =
                m === 'B' ? t('mode.beginner') : m === 'I' ? t('mode.intermediate') : t('mode.advanced');
              return (
                <button
                  key={m}
                  type="button"
                  disabled={!has}
                  onClick={() => has && selectMode(m)}
                  className={`${liftBtn} flex flex-col items-center gap-1.5 rounded-2xl border-2 p-4 text-center ${
                    has
                      ? 'cursor-pointer border-slate-200 bg-white shadow-sm hover:border-indigo-300 hover:shadow-md'
                      : 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-50'
                  }`}
                >
                  <ModeChip mode={m} />
                  <span className="text-sm font-extrabold text-slate-900">{name}</span>
                  {stars > 0 && <span className="text-xs">{'⭐'.repeat(stars)}</span>}
                  <span className="text-[11px] font-semibold text-slate-400">
                    {has
                      ? t('mode.questionsFmt').replace('{n}', String(modeMap[m].length))
                      : t('kartist.comingSoon')}
                  </span>
                  {cleared && (
                    <span className="text-[11px] font-bold text-emerald-600">{t('mode.cleared')}</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {activeMode && phase === 'quiz' && quiz && (
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

          {/* ── B 모드: 절 단위 블록 배열 ─────────────────────────────────── */}
          {currentMode === 'B' && (
            <section
              className={`mt-6 rounded-2xl border-2 bg-white p-5 shadow-sm transition-colors ${
                status === 'correct'
                  ? 'border-emerald-400'
                  : status === 'wrong'
                  ? 'border-red-400'
                  : 'border-slate-200'
              } ${status === 'wrong' ? 'kq-shake' : ''}`}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('mode.bInstruction')}
              </p>

              {/* 조립 중인 문장 (탭한 순서, 칩 탭 시 되돌리기) */}
              <div
                translate="no"
                className="notranslate flex min-h-[3rem] flex-wrap items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-3"
              >
                {picked.length === 0 && (
                  <span className="text-xs text-slate-400">{t('mode.bYourAnswer')}</span>
                )}
                {picked.map((sIdx, ord) => (
                  <button
                    key={`${sIdx}-${ord}`}
                    type="button"
                    disabled={status !== 'idle'}
                    onClick={() => setPicked((prev) => prev.filter((_, k) => k !== ord))}
                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-70"
                  >
                    {shuffledBlocks ? shuffledBlocks[sIdx].text : ''}
                  </button>
                ))}
              </div>

              {/* 셔플된 블록 후보 */}
              <div translate="no" className="notranslate mt-4 flex flex-wrap gap-2">
                {(shuffledBlocks || []).map((blk, i) => {
                  const used = picked.includes(i);
                  return (
                    <button
                      key={blk.key}
                      type="button"
                      disabled={used || status !== 'idle'}
                      onClick={() => setPicked((prev) => [...prev, i])}
                      className={`${liftBtn} rounded-xl border-2 px-4 py-2 text-base font-bold ${
                        used
                          ? 'border-slate-100 bg-slate-100 text-slate-300'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-indigo-400'
                      }`}
                    >
                      {blk.text}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={checkAnswer}
                  disabled={
                    status !== 'idle' ||
                    !shuffledBlocks ||
                    picked.length !== shuffledBlocks.length
                  }
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
                  <span className="kq-pop text-sm font-bold text-emerald-600">{t('kpop.correctMsg')}</span>
                )}
                {status === 'wrong' && (
                  <span className="kq-pop text-sm font-bold text-red-500">{t('kpop.wrongMsg')}</span>
                )}
              </div>
            </section>
          )}

          {/* ── I 모드: 의미 고르기 (4지선다) ─────────────────────────────── */}
          {currentMode === 'I' && (
            <section
              className={`mt-6 rounded-2xl border-2 bg-white p-5 shadow-sm transition-colors ${
                status === 'correct'
                  ? 'border-emerald-400'
                  : status === 'wrong'
                  ? 'border-red-400'
                  : 'border-slate-200'
              } ${status === 'wrong' ? 'kq-shake' : ''}`}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('mode.iInstruction')}
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(quiz.options || []).map((opt, i) => {
                  const isChosen = chosenIdx === i;
                  const revealed = status !== 'idle';
                  const isAnswer = i === quiz.correctIndex;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={revealed}
                      onClick={() => setChosenIdx(i)}
                      className={`${liftBtn} rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold ${
                        revealed && isAnswer
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : revealed && isChosen && !isAnswer
                          ? 'border-red-400 bg-red-50 text-red-600'
                          : isChosen
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <span className="mr-2 font-black">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  onClick={checkAnswer}
                  disabled={status !== 'idle' || chosenIdx == null}
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
                  <span className="kq-pop text-sm font-bold text-emerald-600">{t('kpop.correctMsg')}</span>
                )}
                {status === 'wrong' && (
                  <span className="kq-pop text-sm font-bold text-red-500">{t('kpop.wrongMsg')}</span>
                )}
              </div>
            </section>
          )}

          {/* ── A 모드: Cloze 빈칸 뚫기 ───────────────────────────────────── */}
          {currentMode === 'A' && (
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
                style={{ width: `${Math.max((quiz.blankWord || '').length, 1) * 1.15 + 2.2}em` }}
                className={`notranslate rounded-lg border-2 px-3 py-1 text-center font-bold outline-none transition-colors placeholder:text-xs placeholder:font-normal placeholder:tracking-tight placeholder:text-slate-400 ${
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
              {quiz.hint && quiz.hint.trim() && (
                <button
                  onClick={() => setHintShown((v) => !v)}
                  className={`${liftBtn} rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 shadow hover:bg-amber-100`}
                >
                  {hintShown ? t('kpop.hintHide') : t('kpop.hint')}
                </button>
              )}
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

            {hintShown && quiz.hint && quiz.hint.trim() && (
              <p className="kq-pop mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
                💡 {quiz.hint}
              </p>
            )}
          </section>
          )}

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
          artist={artistName}
          stars={activeMode ? declaredStars(activeMode) : 0}
          streak={stats.streak}
          mastery={mastery}
          onChangeMode={availableGameModes.length > 1 ? changeMode : null}
          liftBtn={liftBtn}
          onRestart={restartAll}
          videoId={routeVideoId || quiz?.videoId}
        />
      )}

      {/* ── 운영자용 데이터 생성기: 관리자 이메일 일치 시에만 DOM 에 존재 ── */}
      {isAdmin && quiz && (
        <AdminQuizBuilder liftBtn={liftBtn} onPreview={previewQuiz} currentQuiz={quiz} />
      )}

      {/* ── 발음 포인트 복습 창 (문장 전환 관문) ──────────────────────────── */}
      {showReview && phase === 'quiz' && quiz && (
        <ReviewModal
          status={status}
          quiz={quiz}
          answer={answerText}
          correctText={correctText}
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
function ReviewModal({ status, quiz, answer, correctText, isLast, liftBtn, onReplay, onNext, onClose }) {
  const { t, lang } = useLang();
  const isCorrect = status === 'correct';
  const isPartial = status === 'partial';
  // B/I 모드는 blankWord 가 없으므로 문장 하이라이트 없이 전체 문장만 표시
  const highlightWord = quiz.blankWord && quiz.fullSentence.includes(quiz.blankWord) ? quiz.blankWord : null;
  // explanation 은 다국어 객체 — 현재 UI 언어에 맞는 텍스트를 고른다 (pickExplanation)
  const explanationText = pickExplanation(quiz.explanation, lang);
  // explanation 이 비어 있으면 해설 영역 자체를 렌더링하지 않음 (조건부 숨김)
  const hasExplanation = Boolean(explanationText && explanationText.trim());

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
          {highlightWord ? (
            quiz.fullSentence.split(highlightWord).map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <mark className="rounded bg-indigo-200 px-1 font-bold text-indigo-900">
                    {highlightWord}
                  </mark>
                )}
              </span>
            ))
          ) : (
            <span>{quiz.fullSentence}</span>
          )}
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
              {(answer || '').trim() || t('kpop.emptyAnswer')}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="font-semibold text-slate-400">{t('kpop.answerLabel')}</dt>
            <dd translate="no" className="notranslate font-bold text-slate-900">
              {correctText || quiz.blankWord}
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
              {explanationText}
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
// 결과 포토카드 이미지 생성 (1080×1080 정사각 카드 — 인스타 피드/스토리 공용)
//   · Wordle: 스포일러 없는 이모지 그리드 / Duolingo: 스트릭·성적 스탯
// ─────────────────────────────────────────────────────────────────────────────
function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 카드 상단 배너용: 위쪽 모서리만 둥근 사각형 경로 (아래쪽은 카드 본문과 이어지도록 직각)
function topRoundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
}

// 크로스오리진 이미지 로드 (유튜브 썸네일은 CORS 허용 — canvas 오염 없이 사용 가능)
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('썸네일 로드 실패'));
    img.src = src;
  });
}

async function createResultCardBlob({ artist, stars, percent, correctCount, total, results, streak, videoId }) {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // 배경: 브랜드 그라디언트 (indigo → fuchsia) + 글로우
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#4f46e5');
  bg.addColorStop(1, '#c026d3');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.82, H * 0.12, 0, W * 0.82, H * 0.12, 520);
  glow.addColorStop(0, 'rgba(255,255,255,0.28)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 흰색 라운드 포토카드
  const pad = 70;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, pad, pad, W - pad * 2, H - pad * 2, 48);
  ctx.fill();
  ctx.restore();

  // 영상 썸네일 배너 (카드 최상단, 로드 실패 시 조용히 건너뜀)
  let thumbImg = null;
  if (videoId) {
    try {
      const img = await loadImage(`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
      // 존재하지 않는 videoId는 120x90 회색 기본 이미지로 응답(200 OK)하므로 걸러낸다
      if (img.naturalWidth !== 120 || img.naturalHeight !== 90) thumbImg = img;
    } catch {
      thumbImg = null;
    }
  }

  const cx = W / 2;
  ctx.textAlign = 'center';

  let contentTop = 175; // 썸네일이 없으면 기존 레이아웃 그대로 사용
  const compact = Boolean(thumbImg); // 썸네일이 들어가면 아래 텍스트 블록을 축소해 한 장에 맞춘다

  if (thumbImg) {
    const thumbW = W - pad * 2;
    const thumbH = 380; // 썸네일 배너 높이 (기존 300 → 380 으로 소폭 확대)
    ctx.save();
    topRoundRectPath(ctx, pad, pad, thumbW, thumbH, 48);
    ctx.clip();
    // object-fit: cover — 중앙 기준으로 배너를 꽉 채운다
    const scale = Math.max(thumbW / thumbImg.width, thumbH / thumbImg.height);
    const dw = thumbImg.width * scale;
    const dh = thumbImg.height * scale;
    ctx.drawImage(thumbImg, pad + (thumbW - dw) / 2, pad + (thumbH - dh) / 2, dw, dh);
    ctx.restore();
    contentTop = pad + thumbH + 34;
  }

  // 브랜드
  ctx.fillStyle = '#6366f1';
  ctx.font = `800 ${compact ? 30 : 40}px system-ui, sans-serif`;
  const brandY = compact ? contentTop + 30 : contentTop;
  ctx.fillText('🎤 K-LISTEN MASTER', cx, brandY);

  // 아티스트 뱃지 (폭은 글자 길이에 맞춰 자동)
  // 난이도 별점을 아티스트명 옆에 표시 (⭐ 컬러 이모지라 뱃지 색과 무관하게 노란색으로 렌더링)
  ctx.font = `800 ${compact ? 28 : 38}px system-ui, sans-serif`;
  const starIcons = '⭐'.repeat(Math.max(0, Math.min(5, Number(stars) || 0)));
  const badgeText = starIcons
    ? `${String(artist).toUpperCase()}  ${starIcons}`
    : String(artist).toUpperCase();
  const badgeW = ctx.measureText(badgeText).width + (compact ? 70 : 90);
  const badgeTop = brandY + (compact ? 18 : 45);
  const badgeH = compact ? 52 : 72;
  ctx.fillStyle = '#eef2ff';
  roundRectPath(ctx, cx - badgeW / 2, badgeTop, badgeW, badgeH, badgeH / 2);
  ctx.fill();
  ctx.fillStyle = '#4f46e5';
  const badgeBaseline = badgeTop + (compact ? 36 : 49);
  ctx.fillText(badgeText, cx, badgeBaseline);
  const badgeBottom = badgeTop + badgeH;

  // 성공률 대형 숫자
  ctx.fillStyle = '#0f172a';
  ctx.font = `900 ${compact ? 140 : 210}px system-ui, sans-serif`;
  const percentY = badgeBottom + (compact ? 128 : 271);
  ctx.fillText(`${percent}%`, cx, percentY);
  ctx.fillStyle = '#64748b';
  ctx.font = `600 ${compact ? 32 : 44}px system-ui, sans-serif`;
  const subtitleY = percentY + (compact ? 45 : 70);
  ctx.fillText(`${correctCount} / ${total} Korean sentences`, cx, subtitleY);

  // 이모지 그리드 (5문항씩 한 줄)
  const icons = results.map((v) => STATUS_ICON[v] || '⬜');
  ctx.font = `${compact ? 46 : 62}px system-ui, sans-serif`;
  const rowGap = compact ? 62 : 88;
  let y = subtitleY + (compact ? 70 : 100);
  for (let r = 0; r < Math.ceil(icons.length / 5); r += 1) {
    ctx.fillText(icons.slice(r * 5, r * 5 + 5).join(' '), cx, y);
    y += rowGap;
  }

  // 스트릭 (Duolingo 스타일 — 1일 초과일 때만)
  if (streak > 1) {
    ctx.fillStyle = '#ea580c';
    ctx.font = `700 ${compact ? 34 : 46}px system-ui, sans-serif`;
    ctx.fillText(`🔥 ${streak}-day streak`, cx, y + (compact ? 22 : 30));
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
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
  artist,
  stars,
  streak,
  mastery,
  onChangeMode,
  liftBtn,
  onRestart,
  videoId,
}) {
  const { t, lang } = useLang();
  const [cardBusy, setCardBusy] = useState(false);
  const [cardSaved, setCardSaved] = useState(false);

  // 포토카드 공유: 모바일은 OS 공유 시트(navigator.share), 데스크톱은 PNG 다운로드
  const shareCard = async () => {
    setCardBusy(true);
    try {
      const blob = await createResultCardBlob({ artist, stars, percent, correctCount, total, results, streak, videoId });
      const file = new File([blob], 'k-listen-result.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'k-listen-result.png';
        a.click();
        URL.revokeObjectURL(url);
        setCardSaved(true);
        setTimeout(() => setCardSaved(false), 1800);
      }
    } catch {
      /* 사용자가 공유 시트를 닫은 경우 등 — 무시 */
    }
    setCardBusy(false);
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
        {/* 마스터리 달성: 모든 제공 모드 클리어 → 왕관 축하 배너 */}
        {mastery && (
          <p
            className="kq-pop mx-auto mt-3 max-w-md rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-bold text-yellow-700"
            style={{ textShadow: '0 0 8px rgba(250, 204, 21, 0.35)' }}
          >
            {t('mode.masteryUnlocked')}
          </p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            onClick={onRestart}
            className={`${liftBtn} rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800`}
          >
            {t('kpop.restart')}
          </button>
          {onChangeMode && (
            <button
              onClick={onChangeMode}
              className={`${liftBtn} rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700`}
            >
              {t('mode.changeMode')}
            </button>
          )}
        </div>
      </section>

      {/* 성적 기반 바이럴 공유 — 도전장 공유 + 결과 포토카드 저장을 한 카드로 통합 */}
      <ChallengeShare
        label={artist}
        score={percent}
        stars={stars}
        gamePath={`/kpop-quiz/${videoId || ''}`}
        correctCount={correctCount}
        total={total}
        thumbnailUrl={videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined}
        variant="light"
        extraButton={
          <button
            onClick={shareCard}
            disabled={cardBusy}
            className={`${liftBtn} rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-900 shadow hover:bg-amber-300 disabled:opacity-60`}
          >
            {cardSaved ? t('kpop.cardSaved') : cardBusy ? '…' : t('kpop.saveCard')}
          </button>
        }
      />

      {/* 전체 문장 복습 리스트 — 로그인 사용자 전용 */}
      {isLoggedIn ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">{t('kpop.reviewListTitle')}</h3>
          <ul className="mt-3 space-y-3">
            {list.map((q, i) => {
              const explanationText = pickExplanation(q.explanation, lang);
              const hasExp = Boolean(explanationText && explanationText.trim());
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
                          {explanationText}
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
    fullSentence: currentQuiz.fullSentence || '',
    blankWord: currentQuiz.blankWord || '',
    // 운영자 빌더는 Firestore 배포 스키마(string)를 그대로 편집한다 — 다국어 객체면 en 텍스트로 평탄화해 시딩
    explanation: pickExplanation(currentQuiz.explanation, 'en'),
    hint: currentQuiz.hint || '',
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
    hint: form.hint,
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
            <label className="text-xs font-semibold text-slate-500 sm:col-span-2">
              힌트 (hint) — 정답을 직접 노출하지 않는 단서, 비워두면 힌트 버튼 숨김
              <input className={`mt-1 ${field}`} value={form.hint} onChange={set('hint')} />
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
