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
import { loadPublishedQuizzes } from '@/lib/quizStore';
import { ClickableKorean, ExpressionModal, useExpressionExplainer } from '@/components/ExpressionExplainer';
import ChallengeShare from '@/components/ChallengeShare';

// 운영자 아티스트 태깅 옵션 ('__all__' 제외 — 필터 시스템과 동일 소스)
const ARTIST_OPTIONS = ARTISTS.filter((a) => a !== '__all__');

// ── 샘플 데이터: 멀티 문장 배열 (두 번째 문제는 해설 숨김 테스트용) ────────────
// explanation 은 다국어 객체 { en, ja, es, zh, vi } — 한국어 원문/예문은 어떤 언어에서도 번역하지 않는다.
// 문자열 형태(레거시/Firestore 배포본)와 공존해야 하므로 렌더링 쪽은 pickExplanation() 을 거친다.
const quizList = [
{
  "id": "bts_01",
  "videoId": "wu6bA3zK_us",
  "startTime": 78.5,
  "endTime": 80,
  "fullSentence": "야,야. 피자 같이 먹자",
  "blankWord": "같이 먹자",
  "explanation": {
    "en": "Verb+자 = Let's V\ncommonly used with friends or people you are close to.\n놀자, 먹자, 마시자, 만나자, 공부하자 ...",
    "ja": "Verb+자 = 〜しよう\n親しい友人や近い関係の人によく使われます。\n놀자, 먹자, 마시자, 만나자, 공부하자 ...",
    "es": "Verb+자 = Vamos a V\nSe usa comúnmente con amigos o personas cercanas.\n놀자, 먹자, 마시자, 만나자, 공부하자 ...",
    "zh": "Verb+자 = 我们…吧\n常用于关系亲近的朋友之间。\n놀자, 먹자, 마시자, 만나자, 공부하자 ...",
    "vi": "Verb+자 = Cùng làm... nào\nThường dùng với bạn bè hoặc người thân thiết.\n놀자, 먹자, 마시자, 만나자, 공부하자 ..."
  },
  "hasHardcodedSubs": true
},
{
  "id": "bts_02",
  "videoId": "wu6bA3zK_us",
  "startTime": 290,
  "endTime": 295,
  "fullSentence": "나도 말은 그렇게 했는데.. 혼자 자면 좋지",
  "blankWord": "혼자 자면",
  "explanation": {
    "en": "",
    "ja": "",
    "es": "",
    "zh": "",
    "vi": ""
  },
  "hasHardcodedSubs": true
},
{
  "id": "bts_03",
  "videoId": "wu6bA3zK_us",
  "startTime": 784,
  "endTime": 787,
  "fullSentence": "나는 제일 조용한 방, 내가 선택한 거야.",
  "blankWord": "조용한 방",
  "explanation": {
    "en": "The ㅎ sound is often very weak or disappears in natural speech when it is not at the beginning of a word. Instead of pronouncing ㅎ clearly, many native speakers produce little or no h sound.\n",
    "ja": "ㅎの音は、単語の最初にない場合、自然な発話ではとても弱くなったり消えたりすることがよくあります。ㅎをはっきり発音する代わりに、多くのネイティブスピーカーはほとんど、または全くh音を出しません。\n",
    "es": "El sonido ㅎ suele ser muy débil o desaparece en el habla natural cuando no está al principio de una palabra. En lugar de pronunciar ㅎ claramente, muchos hablantes nativos producen poco o ningún sonido h.\n",
    "zh": "当ㅎ不在单词开头时，在自然口语中它的发音往往很弱，甚至会完全消失。许多母语者不会清楚地发出ㅎ音，几乎听不到或完全听不到h的音。\n",
    "vi": "Âm ㅎ thường rất yếu hoặc biến mất trong lời nói tự nhiên khi nó không đứng ở đầu từ. Thay vì phát âm rõ ㅎ, nhiều người bản xứ phát âm rất nhẹ hoặc gần như không phát âm âm h.\n"
  },
  "hasHardcodedSubs": true
},
{
  "id": "bts_04",
  "videoId": "wu6bA3zK_us",
  "startTime": 836.5,
  "endTime": 840,
  "fullSentence": "지민아, 같은 팀이 걸렸으면 좋겠다.  그럼요, 형님.",
  "blankWord": "좋겠다",
  "explanation": {
    "en": "Verb + -았/었으면 좋겠다 = I wish... / I hope... / It would be nice if...\n시험에 합격했으면 좋겠어요, 날씨가 좋았으면 좋겠....\n\n*같은 팀이 걸리다 be on the same team",
    "ja": "Verb + -았/었으면 좋겠다 = 〜だといいな… / 〜を願っています… / 〜だったら嬉しいです…\n시험에 합격했으면 좋겠어요, 날씨가 좋았으면 좋겠....\n\n*같은 팀이 걸리다 同じチームになる",
    "es": "Verb + -았/었으면 좋겠다 = Ojalá... / Espero que... / Sería bueno si...\n시험에 합격했으면 좋겠어요, 날씨가 좋았으면 좋겠....\n\n*같은 팀이 걸리다 estar en el mismo equipo",
    "zh": "Verb + -았/었으면 좋겠다 = 希望…… / 但愿…… / 要是……就好了\n시험에 합격했으면 좋겠어요, 날씨가 좋았으면 좋겠....\n\n*같은 팀이 걸리다 分到同一组/同一队",
    "vi": "Verb + -았/었으면 좋겠다 = Ước gì... / Mong rằng... / Sẽ tốt nếu như...\n시험에 합격했으면 좋겠어요, 날씨가 좋았으면 좋겠....\n\n*같은 팀이 걸리다 ở cùng một đội"
  },
  "hasHardcodedSubs": true
},
{
  "id": "bts_05",
  "videoId": "wu6bA3zK_us",
  "startTime": 859,
  "endTime": 862,
  "fullSentence": "자, 청소도 안 합니다, 깍두기는.",
  "blankWord": "청소도",
  "explanation": {
    "en": "Korean usually follows the **SOV (Subject–Object–Verb)** word order. However, in everyday conversation, the word order is often flexible. As long as the particles (은/는, 이/가, 을/를, etc.) are correct, speakers can move words around to emphasize different parts of the sentence or to sound more natural.\n\n*깍두기 is a special role often used in children's games when there is an odd number of players or when someone is much younger or less experienced. A ​깍두기 may switch between teams, help both sides, or play without affecting the final result. The exact role depends on the game, but the purpose is to let everyone join and have fun.",
    "ja": "韓国語は通常、**SOV（主語＋目的語＋動詞）**の語順に従います。しかし、日常会話では語順はかなり柔軟です。助詞（은/는, 이/가, 을/를 など）さえ正しければ、話し手は文の異なる部分を強調したり、より自然に聞こえるようにするために語順を入れ替えることができます。\n\n*깍두기は、参加人数が奇数のときや、誰かがかなり年下だったり経験が浅かったりするときに、子どもの遊びでよく使われる特別な役割です。깍두기はチームを行き来したり、両方のチームを助けたり、最終結果に影響を与えずに遊んだりすることができます。正確な役割は遊びによって異なりますが、その目的はみんなが参加して楽しめるようにすることです。",
    "es": "El coreano generalmente sigue el orden de palabras **SOV (Sujeto–Objeto–Verbo)**. Sin embargo, en la conversación cotidiana, el orden de las palabras suele ser flexible. Mientras las partículas (은/는, 이/가, 을/를, etc.) sean correctas, los hablantes pueden mover las palabras para enfatizar distintas partes de la oración o para sonar más natural.\n\n*깍두기 es un rol especial que se usa a menudo en los juegos infantiles cuando hay un número impar de jugadores o cuando alguien es mucho más joven o tiene menos experiencia. Un 깍두기 puede cambiar de equipo, ayudar a ambos bandos o jugar sin afectar el resultado final. El rol exacto depende del juego, pero el propósito es que todos puedan participar y divertirse.",
    "zh": "韩语通常遵循**主谓宾（SOV，主语－宾语－谓语）**的语序。不过，在日常对话中，语序其实相当灵活。只要助词（은/는、이/가、을/를 等）使用正确，说话者就可以调换词语顺序，以强调句子的不同部分，或让句子听起来更自然。\n\n*깍두기是韩国儿童游戏中常见的一种特殊角色，通常在人数为单数，或有人明显更年幼、经验较少时使用。깍두기可以在两队之间自由切换、同时帮助双方，或者单纯参与游戏而不影响最终结果。具体角色因游戏而异，但目的都是让每个人都能加入并玩得开心。",
    "vi": "Tiếng Hàn thường theo trật tự từ **SOV (Chủ ngữ–Tân ngữ–Động từ)**. Tuy nhiên, trong hội thoại hàng ngày, trật tự từ khá linh hoạt. Miễn là các trợ từ (은/는, 이/가, 을/를, v.v.) được dùng đúng, người nói có thể đảo vị trí các từ để nhấn mạnh các phần khác nhau của câu hoặc để nghe tự nhiên hơn.\n\n*깍두기 là một vai trò đặc biệt thường xuất hiện trong các trò chơi trẻ em khi số người chơi là số lẻ, hoặc khi có ai đó nhỏ tuổi hơn hoặc ít kinh nghiệm hơn hẳn. Một 깍두기 có thể chuyển qua lại giữa các đội, giúp đỡ cả hai bên, hoặc chơi mà không ảnh hưởng đến kết quả cuối cùng. Vai trò cụ thể tùy thuộc vào trò chơi, nhưng mục đích là để ai cũng có thể tham gia và vui vẻ."
  },
  "hasHardcodedSubs": true
},
{
  "id": "bts_06",
  "videoId": "wu6bA3zK_us",
  "startTime": 889.5,
  "endTime": 892.5,
  "fullSentence": "이기는 사람이 하는 거야.",
  "blankWord": "이기는",
  "explanation": {
    "en": "Verb + -(으)ㄴ/는 사람이 하는 거야 = The person who (does something) is the one who does it.\nOften used to explain a rule or decide who will do something.\n\n지는 사람이 청소 하는 거야.\n이기는 사람이 치킨 먹는 거야. ",
    "ja": "Verb + -(으)ㄴ/는 사람이 하는 거야 = （何かを）する人がやることになっている。\nルールを説明したり、誰が何をするか決めたりするときによく使われます。\n\n지는 사람이 청소 하는 거야.\n이기는 사람이 치킨 먹는 거야. ",
    "es": "Verb + -(으)ㄴ/는 사람이 하는 거야 = La persona que (hace algo) es la que lo hace.\nSe usa a menudo para explicar una regla o decidir quién hará algo.\n\n지는 사람이 청소 하는 거야.\n이기는 사람이 치킨 먹는 거야. ",
    "zh": "Verb + -(으)ㄴ/는 사람이 하는 거야 = （做某事的）那个人就负责做这件事。\n常用于说明规则，或决定由谁来做某件事。\n\n지는 사람이 청소 하는 거야.\n이기는 사람이 치킨 먹는 거야. ",
    "vi": "Verb + -(으)ㄴ/는 사람이 하는 거야 = Người (làm việc gì đó) chính là người phải làm việc đó.\nThường dùng để giải thích một quy tắc hoặc quyết định ai sẽ làm việc gì.\n\n지는 사람이 청소 하는 거야.\n이기는 사람이 치킨 먹는 거야. "
  },
  "hasHardcodedSubs": true
},
{
  "id": "bts_07",
  "videoId": "wu6bA3zK_us",
  "startTime": 1068,
  "endTime": 1070,
  "fullSentence": "자, 저희 먼저 자리 잡을게요.",
  "blankWord": "잡을게요.",
  "explanation": {
    "en": "Verb + -(으)ㄹ게요 = I'll...\nIt is used when the speaker makes a decision, promise, or offer at the moment of speaking, often in response to the listener.\n제가 할게요, 먼저 갈게요, 오늘부터 운동할게요...\n\n*자리를 잡다 = to find a seat, to take a seat ...",
    "ja": "Verb + -(으)ㄹ게요 = 〜します\n話す瞬間に、話し手が決定・約束・申し出をするときに使われ、聞き手への返答としてもよく使われます。\n제가 할게요, 먼저 갈게요, 오늘부터 운동할게요...\n\n*자리를 잡다 = 席を取る、席を確保する ...",
    "es": "Verb + -(으)ㄹ게요 = Lo haré...\nSe usa cuando el hablante toma una decisión, promesa u oferta en el momento de hablar, a menudo en respuesta al oyente.\n제가 할게요, 먼저 갈게요, 오늘부터 운동할게요...\n\n*자리를 잡다 = encontrar un asiento, tomar un asiento ...",
    "zh": "Verb + -(으)ㄹ게요 = 我会……\n用于说话者在说话的那一刻做出决定、承诺或提议，常常是对听者的回应。\n제가 할게요, 먼저 갈게요, 오늘부터 운동할게요...\n\n*자리를 잡다 = 占座位、找座位 ...",
    "vi": "Verb + -(으)ㄹ게요 = Tôi sẽ...\nDùng khi người nói đưa ra quyết định, lời hứa hoặc lời đề nghị ngay tại thời điểm nói, thường là để đáp lại người nghe.\n제가 할게요, 먼저 갈게요, 오늘부터 운동할게요...\n\n*자리를 잡다 = tìm chỗ ngồi, giữ chỗ ..."
  },
  "hasHardcodedSubs": true
},
{
  "id": "bts_08",
  "videoId": "wu6bA3zK_us",
  "startTime": 1118,
  "endTime": 1121,
  "fullSentence": "진 형 어디 갔어요?   진 형, 밑에!",
  "blankWord": "어디 갔어요",
  "explanation": {
    "en": "In Korean, 에 is often omitted in everyday conversation when talking about destinations. Native speakers naturally say 어디 갔어요? instead of 어디에 갔어요? because the meaning is already clear from the context.",
    "ja": "韓国語では、目的地について話すとき、日常会話で에がよく省略されます。文脈から意味がすでに明らかなので、ネイティブスピーカーは自然に어디에 갔어요？ではなく어디 갔어요？と言います。",
    "es": "En coreano, la partícula 에 se omite a menudo en la conversación cotidiana al hablar de destinos. Los hablantes nativos dicen naturalmente 어디 갔어요? en lugar de 어디에 갔어요? porque el significado ya queda claro por el contexto.",
    "zh": "在韩语中，谈到目的地时，日常对话里经常会省略에。因为从语境中已经能明白意思，母语者会很自然地说어디 갔어요？，而不是어디에 갔어요？。",
    "vi": "Trong tiếng Hàn, trợ từ 에 thường bị lược bỏ trong hội thoại hàng ngày khi nói về điểm đến. Người bản xứ thường tự nhiên nói 어디 갔어요? thay vì 어디에 갔어요? vì ý nghĩa đã rõ ràng từ ngữ cảnh."
  },
  "hasHardcodedSubs": true
},
{
  "id": "bts_09",
  "videoId": "wu6bA3zK_us",
  "startTime": 1378,
  "endTime": 1380,
  "fullSentence": "이미 진 것 같은데!?!",
  "blankWord": "같은",
  "explanation": {
    "en": "Verb/Adjective + -(으)ㄴ/는 것 같다 = I think... / It seems like... / It looks like...\nUsed to express a guess, opinion, or impression.\nBTS는 멋있는 것 같아요...\n\nVerb/Adjective + -는데(요)\nSoftens the statement, provides background or context, and often invites the listener's response or implies that more is coming.\n맛있는데요? (It's good.. what do you think?)....\n",
    "ja": "Verb/Adjective + -(으)ㄴ/는 것 같다 = 〜だと思う… / 〜のようだ… / 〜みたいだ…\n推測、意見、印象を表すときに使われます。\nBTS는 멋있는 것 같아요...\n\nVerb/Adjective + -는데(요)\n発言を柔らかくしたり、背景や文脈を示したり、聞き手の反応を促したり、続きがあることを示唆したりします。\n맛있는데요? （美味しいけど…どう思う？）….\n",
    "es": "Verb/Adjective + -(으)ㄴ/는 것 같다 = Creo que... / Parece que... / Se ve que...\nSe usa para expresar una suposición, opinión o impresión.\nBTS는 멋있는 것 같아요...\n\nVerb/Adjective + -는데(요)\nSuaviza la afirmación, aporta contexto o trasfondo, y a menudo invita a la respuesta del oyente o sugiere que hay más por decir.\n맛있는데요? (Está rico... ¿qué opinas?)....\n",
    "zh": "Verb/Adjective + -(으)ㄴ/는 것 같다 = 我觉得…… / 好像…… / 看起来……\n用于表达推测、意见或印象。\nBTS는 멋있는 것 같아요...\n\nVerb/Adjective + -는데(요)\n使语气变得柔和，提供背景或语境，常常是在邀请对方回应，或暗示后面还有话要说。\n맛있는데요? （很好吃……你觉得呢？）….\n",
    "vi": "Verb/Adjective + -(으)ㄴ/는 것 같다 = Tôi nghĩ là... / Có vẻ như... / Trông có vẻ...\nDùng để diễn đạt một phỏng đoán, ý kiến hoặc ấn tượng.\nBTS는 멋있는 것 같아요...\n\nVerb/Adjective + -는데(요)\nLàm câu nói nhẹ nhàng hơn, cung cấp bối cảnh, và thường mời gọi phản hồi của người nghe hoặc ngụ ý còn điều gì đó sắp nói tiếp.\n맛있는데요? (Ngon đấy... bạn thấy sao?)....\n"
  },
  "hasHardcodedSubs": true
},
{
  "id": "bts_10",
  "videoId": "wu6bA3zK_us",
  "startTime": 1462,
  "endTime": 1465,
  "fullSentence": "야, 종료! 종료! 이건 우리가 이겼어",
  "blankWord": "우리가 이겼어",
  "explanation": {
    "en": "*이기다 win   이겼다 won\n  (지다  lost   졌다  lost)\n\n우리 팀이 이겼어요, 누가 이겼어요? 이번에는 우리가 졌어요...",
    "ja": "*이기다 勝つ   이겼다 勝った\n  (지다  負ける   졌다  負けた)\n\n우리 팀이 이겼어요, 누가 이겼어요? 이번에는 우리가 졌어요...",
    "es": "*이기다 ganar   이겼다 ganó\n  (지다  perder   졌다  perdió)\n\n우리 팀이 이겼어요, 누가 이겼어요? 이번에는 우리가 졌어요...",
    "zh": "*이기다 赢   이겼다 赢了\n  (지다  输   졌다  输了)\n\n우리 팀이 이겼어요, 누가 이겼어요? 이번에는 우리가 졌어요...",
    "vi": "*이기다 thắng   이겼다 đã thắng\n  (지다  thua   졌다  đã thua)\n\n우리 팀이 이겼어요, 누가 이겼어요? 이번에는 우리가 졌어요..."
  },
  "hasHardcodedSubs": true
},
{
  "id": "runseokjin_01",
  "videoId": "ADw_zMarJdk",
  "startTime": 13.5,
  "endTime": 19,
  "fullSentence": "옆에 있는 아미 분들과 같이",
  "blankWord": "있는",
  "explanation": {
    "en": "있는 = that is / which is / located somewhere.\n\n옆에 있는 친구, 집에 있는 강아지..",
    "ja": "있는 = 〜である / 〜する / どこかにある（いる）\n\n옆에 있는 친구, 집에 있는 강아지..",
    "es": "있는 = que es / que está / que se encuentra en algún lugar.\n\n옆에 있는 친구, 집에 있는 강아지..",
    "zh": "있는 = 是……的 / 位于某处的\n\n옆에 있는 친구, 집에 있는 강아지..",
    "vi": "있는 = là / đang ở / nằm ở đâu đó.\n\n옆에 있는 친구, 집에 있는 강아지.."
  },
  "hasHardcodedSubs": true
},
{
  "id": "runseokjin_02",
  "videoId": "ADw_zMarJdk",
  "startTime": 16.7,
  "endTime": 19,
  "fullSentence": "너무 재미있을 것 같습니다.",
  "blankWord": "재미있을",
  "explanation": {
    "en": "Verb + -(으)ㄹ 것 같다 = I think... / It seems like... / It looks like... / Probably... \n\n 내일은 날씨가 좋을 것 같아요.",
    "ja": "Verb + -(으)ㄹ 것 같다 = 〜だと思う… / 〜のようだ… / 〜みたいだ… / たぶん… \n\n 내일은 날씨가 좋을 것 같아요.",
    "es": "Verb + -(으)ㄹ 것 같다 = Creo que... / Parece que... / Se ve que... / Probablemente... \n\n 내일은 날씨가 좋을 것 같아요.",
    "zh": "Verb + -(으)ㄹ 것 같다 = 我觉得…… / 好像…… / 看起来…… / 大概…… \n\n 내일은 날씨가 좋을 것 같아요.",
    "vi": "Verb + -(으)ㄹ 것 같다 = Tôi nghĩ là... / Có vẻ như... / Trông có vẻ... / Có lẽ... \n\n 내일은 날씨가 좋을 것 같아요."
  },
  "hasHardcodedSubs": true
},
{
  "id": "runseokjin_03",
  "videoId": "ADw_zMarJdk",
  "startTime": 36,
  "endTime": 38,
  "fullSentence": "팝콘 먹는 게 제일 맛있죠.",
  "blankWord": "먹는",
  "explanation": {
    "en": "먹는[멍는]\n\n Verb + -는 게 / -는 것이 = the act of... / ...ing\n\n This pattern is often used when talking about an action in a general way. In everyday conversation, -는 게 is much more common than -는 것이.\n\n BTS 영상을 보는 게 좋아요. I like watching BTS videos.",
    "ja": "먹는[멍는]\n\n Verb + -는 게 / -는 것이 = 〜すること / 〜するの\n\n このパターンは、一般的な行為について話すときによく使われます。日常会話では、-는 것이よりも-는 게の方がずっとよく使われます。\n\n BTS 영상을 보는 게 좋아요. 私はBTSの映像を見るのが好きです。",
    "es": "먹는[멍는]\n\n Verb + -는 게 / -는 것이 = el acto de... / ...ando/...iendo\n\n Este patrón se usa a menudo para hablar de una acción de forma general. En la conversación cotidiana, -는 게 es mucho más común que -는 것이.\n\n BTS 영상을 보는 게 좋아요. Me gusta ver videos de BTS.",
    "zh": "먹는[멍는]\n\n Verb + -는 게 / -는 것이 = ……这件事 / ……的行为\n\n 这个句型常用于泛指某个动作。在日常对话中，-는 게比-는 것이常用得多。\n\n BTS 영상을 보는 게 좋아요. 我喜欢看BTS的视频。",
    "vi": "먹는[멍는]\n\n Verb + -는 게 / -는 것이 = việc... / sự...\n\n Mẫu câu này thường được dùng khi nói về một hành động một cách chung chung. Trong hội thoại hàng ngày, -는 게 phổ biến hơn nhiều so với -는 것이.\n\n BTS 영상을 보는 게 좋아요. Tôi thích xem video của BTS."
  },
  "hasHardcodedSubs": true
},
{
  "id": "runseokjin_04",
  "videoId": "ADw_zMarJdk",
  "startTime": 38,
  "endTime": 42,
  "fullSentence": "저도 가끔 (그..) 영화 다 보고 나서 인증 샷 같은 거 찍거든요",
  "blankWord": "보고 나서",
  "explanation": {
    "en": "Verb + -고 나서 = after doing...\n\n is expression means that one action happens after another action is completed.\n\n 밥을 먹고 나서 공부했어요. I studied after eating.",
    "ja": "Verb + -고 나서 = 〜した後で…\n\n この表現は、ある行動が完了した後に別の行動が起こることを意味します。\n\n 밥을 먹고 나서 공부했어요. 私はご飯を食べた後で勉強しました。",
    "es": "Verb + -고 나서 = después de hacer...\n\n Esta expresión significa que una acción ocurre después de que otra acción se ha completado.\n\n 밥을 먹고 나서 공부했어요. Estudié después de comer.",
    "zh": "Verb + -고 나서 = 做完……之后\n\n 这个表达的意思是，一个动作在另一个动作完成之后发生。\n\n 밥을 먹고 나서 공부했어요. 我吃完饭后学习了。",
    "vi": "Verb + -고 나서 = sau khi làm...\n\n Biểu hiện này có nghĩa là một hành động xảy ra sau khi một hành động khác đã hoàn thành.\n\n 밥을 먹고 나서 공부했어요. Tôi đã học sau khi ăn cơm."
  },
  "hasHardcodedSubs": true
},
{
  "id": "runseokjin_05",
  "videoId": "ADw_zMarJdk",
  "startTime": 55,
  "endTime": 59,
  "fullSentence": "열심히 한번 달려 보도록 하겠습니다.",
  "blankWord": "하겠습니다",
  "explanation": {
    "en": "Verb + -도록 하겠습니다 = I'll make sure to... / I'll do my best to...\nA polite way to express the speaker's intention or determination to do something.\n\n열심히 공부하도록 하겠습니다. I'll do my best to study hard.\n더 조심하도록 하겠습니다. I'll make sure to be more careful.",
    "ja": "Verb + -도록 하겠습니다 = 必ず〜します / 〜するよう頑張ります\n話し手の意図や決意を丁寧に表す表現です。\n\n열심히 공부하도록 하겠습니다. 一生懸命勉強するよう頑張ります。\n더 조심하도록 하겠습니다. もっと気をつけるようにします。",
    "es": "Verb + -도록 하겠습니다 = Me aseguraré de... / Haré lo posible por...\nUna forma educada de expresar la intención o determinación del hablante de hacer algo.\n\n열심히 공부하도록 하겠습니다. Haré lo posible por estudiar mucho.\n더 조심하도록 하겠습니다. Me aseguraré de tener más cuidado.",
    "zh": "Verb + -도록 하겠습니다 = 我一定会…… / 我会尽力……\n一种礼貌地表达说话者意图或决心的方式。\n\n열심히 공부하도록 하겠습니다. 我会尽力努力学习。\n더 조심하도록 하겠습니다. 我一定会更加小心。",
    "vi": "Verb + -도록 하겠습니다 = Tôi sẽ chắc chắn... / Tôi sẽ cố gắng hết sức để...\nMột cách nói lịch sự để thể hiện ý định hoặc quyết tâm của người nói.\n\n열심히 공부하도록 하겠습니다. Tôi sẽ cố gắng hết sức để học chăm chỉ.\n더 조심하도록 하겠습니다. Tôi sẽ chắc chắn cẩn thận hơn."
  },
  "hasHardcodedSubs": true
},
{
  "id": "runseokjin_06",
  "videoId": "ADw_zMarJdk",
  "startTime": 65,
  "endTime": 67,
  "fullSentence": " 우리 아미 여러분들하고 있으면 ",
  "blankWord": "있으면",
  "explanation": {
    "en": "Verb/Adjective + -(으)면 = if... / when...\nThis expression is used to talk about a condition or situation. It means that one thing will happen if or when another thing happens.\n\n시간이 있으면 만나요.  Let's meet if you have time.\n비가 오면 안 갈 거예요.  If it rains, I won't go.",
    "ja": "Verb/Adjective + -(으)면 = 〜すれば… / 〜すると…\nこの表現は、条件や状況について話すときに使われます。ある事が起こると（起これば）、別の事が起こるという意味です。\n\n시간이 있으면 만나요.  時間があれば会いましょう。\n비가 오면 안 갈 거예요.  雨が降ったら行きません。",
    "es": "Verb/Adjective + -(으)면 = si... / cuando...\nEsta expresión se usa para hablar de una condición o situación. Significa que algo ocurrirá si o cuando ocurra otra cosa.\n\n시간이 있으면 만나요.  Nos vemos si tienes tiempo.\n비가 오면 안 갈 거예요.  Si llueve, no iré.",
    "zh": "Verb/Adjective + -(으)면 = 如果…… / ……的话\n这个表达用于谈论条件或情况，意思是如果（或当）某事发生，另一件事就会发生。\n\n시간이 있으면 만나요.  如果你有时间，我们就见面吧。\n비가 오면 안 갈 거예요.  如果下雨，我就不去了。",
    "vi": "Verb/Adjective + -(으)면 = nếu... / khi...\nBiểu hiện này dùng để nói về một điều kiện hoặc tình huống. Nó có nghĩa là một việc sẽ xảy ra nếu hoặc khi một việc khác xảy ra.\n\n시간이 있으면 만나요.  Nếu bạn có thời gian thì mình gặp nhau nhé.\n비가 오면 안 갈 거예요.  Nếu trời mưa thì tôi sẽ không đi."
  },
  "hasHardcodedSubs": true
},
{
  "id": "runseokjin_07",
  "videoId": "ADw_zMarJdk",
  "startTime": 67.5,
  "endTime": 70,
  "fullSentence": "마음이 편안해지고 따뜻해지는 거 같아요. (것 같아요.)",
  "blankWord": "따뜻해지는",
  "explanation": {
    "en": "Verb + -는 것 같아요 = I think... / It seems like... / It looks like...\nThis expression is used to express a guess, opinion, or impression about a present or ongoing action.\n\n비 오는 것 같아요. → I think it's raining.\n많이 바쁜 것 같아요. → It seems like they're very busy.",
    "ja": "Verb + -는 것 같아요 = 〜だと思う… / 〜のようだ… / 〜みたいだ…\n現在の、または進行中の行動についての推測、意見、印象を表すときに使われる表現です。\n\n비 오는 것 같아요. → 雨が降っているみたいです。\n많이 바쁜 것 같아요. → とても忙しいみたいです。",
    "es": "Verb + -는 것 같아요 = Creo que... / Parece que... / Se ve que...\nEsta expresión se usa para expresar una suposición, opinión o impresión sobre una acción presente o en curso.\n\n비 오는 것 같아요. → Creo que está lloviendo.\n많이 바쁜 것 같아요. → Parece que están muy ocupados.",
    "zh": "Verb + -는 것 같아요 = 我觉得…… / 好像…… / 看起来……\n这个表达用于对当前或正在进行的动作表达推测、意见或印象。\n\n비 오는 것 같아요. → 好像在下雨。\n많이 바쁜 것 같아요. → 看起来他们很忙。",
    "vi": "Verb + -는 것 같아요 = Tôi nghĩ là... / Có vẻ như... / Trông có vẻ...\nBiểu hiện này dùng để diễn đạt một phỏng đoán, ý kiến hoặc ấn tượng về một hành động đang diễn ra ở hiện tại.\n\n비 오는 것 같아요. → Hình như trời đang mưa.\n많이 바쁜 것 같아요. → Có vẻ như họ đang rất bận."
  },
  "hasHardcodedSubs": true
},
{
  "id": "runseokjin_08",
  "videoId": "ADw_zMarJdk",
  "startTime": 73,
  "endTime": 76,
  "fullSentence": " 감사합니다 앞으로도 잘 부탁드리겠습니다.",
  "blankWord": "부탁드리겠습니다.",
  "explanation": {
    "en": "앞으로도 = from now on, going forward, in the future, or still (in the future)\n\n잘 부탁드리겠습니다 = I look forward to your support. / Thank you in advance. / Please take good care of me.",
    "ja": "앞으로도 = これからも、今後も、将来も、あるいは依然として（今後も）\n\n잘 부탁드리겠습니다 = 今後ともよろしくお願いします。 / あらかじめお礼申し上げます。 / どうぞよろしくお願いいたします。",
    "es": "앞으로도 = de ahora en adelante, en el futuro, o todavía (en el futuro)\n\n잘 부탁드리겠습니다 = Espero contar con su apoyo. / Gracias de antemano. / Por favor, cuide bien de mí.",
    "zh": "앞으로도 = 从今以后、今后、将来，或依然（在未来）\n\n잘 부탁드리겠습니다 = 期待您今后的关照。 / 提前谢谢您。 / 请多多关照。",
    "vi": "앞으로도 = từ nay về sau, trong tương lai, hoặc vẫn (trong tương lai)\n\n잘 부탁드리겠습니다 = Mong nhận được sự ủng hộ của bạn. / Cảm ơn trước. / Mong bạn quan tâm giúp đỡ."
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_01",
  "videoId": "rBDBC82UmKo",
  "startTime": 303,
  "endTime": 306,
  "fullSentence": "신호 주시면 그때부터 할게요.",
  "blankWord": "할게요",
  "explanation": {
    "en": "Verb + -(으)ㄹ게요 = I'll...\nThis expression is used when the speaker makes a decision, promise, or offer, often in response to the listener or the situation.\n기다릴게요.  I'll wait.\n다음에 다시 올게요.  I'll come back next time.\n\nVerb/Adjective + -(으)면 = if... / when...\nVerb/Adjective + -(으)시면 = if you... / if (someone) does... (honorific, more polite)\nBoth expressions are used to talk about a condition. -(으)시면 is the honorific form of -(으)면 and is commonly used when speaking politely to or about someone deserving respect.\n시간이 있으면 연락하세요.  Contact me when you have time.",
    "ja": "Verb + -(으)ㄹ게요 = 〜します\nこの表現は、話し手が決定、約束、または申し出をする際に使用され、聞き手や状況への返答としてもよく使われます。\n기다릴게요.  待ちます。\n다음에 다시 올게요.  また今度来ます。\n\nVerb/Adjective + -(으)면 = 〜すれば… / 〜すると…\nVerb/Adjective + -(으)시면 = あなたが〜すれば… / （誰かが）〜されたら…（尊敬形、より丁寧）\nどちらの表現も条件について話すときに使われます。-(으)시면は-(으)면の尊敬形で、敬うべき相手について丁寧に話すときによく使われます。\n시간이 있으면 연락하세요.  時間があれば連絡してください。",
    "es": "Verb + -(으)ㄹ게요 = Lo haré...\nEsta expresión se usa cuando el hablante toma una decisión, promesa u oferta, a menudo en respuesta al oyente o a la situación.\n기다릴게요.  Esperaré.\n다음에 다시 올게요.  Volveré la próxima vez.\n\nVerb/Adjective + -(으)면 = si... / cuando...\nVerb/Adjective + -(으)시면 = si tú... / si (alguien) hace... (honorífico, más formal)\nAmbas expresiones se usan para hablar de una condición. -(으)시면 es la forma honorífica de -(으)면 y se usa comúnmente para hablar cortésmente con o sobre alguien que merece respeto.\n시간이 있으면 연락하세요.  Contácteme cuando tenga tiempo.",
    "zh": "Verb + -(으)ㄹ게요 = 我会……\n这种表达用于说话者做出决定、承诺或提议时，常常是对听者或当下情况的回应。\n기다릴게요.  我会等的。\n다음에 다시 올게요.  我下次再来。\n\nVerb/Adjective + -(으)면 = 如果…… / ……的话\nVerb/Adjective + -(으)시면 = 如果您…… / 如果（某人）……（敬语，更礼貌）\n这两种表达都用于谈论条件。-(으)시면是-(으)면的敬语形式，常用于礼貌地谈论值得尊敬的人。\n시간이 있으면 연락하세요.  有时间的话请联系我。",
    "vi": "Verb + -(으)ㄹ게요 = Tôi sẽ...\nBiểu hiện này được dùng khi người nói đưa ra quyết định, lời hứa hoặc lời đề nghị, thường là để đáp lại người nghe hoặc tình huống.\n기다릴게요.  Tôi sẽ đợi.\n다음에 다시 올게요.  Lần sau tôi sẽ quay lại.\n\nVerb/Adjective + -(으)면 = nếu... / khi...\nVerb/Adjective + -(으)시면 = nếu bạn... / nếu (ai đó) làm... (kính ngữ, lịch sự hơn)\nCả hai biểu hiện đều dùng để nói về điều kiện. -(으)시면 là dạng kính ngữ của -(으)면 và thường được dùng khi nói lịch sự với hoặc về người đáng được tôn trọng.\n시간이 있으면 연락하세요.  Khi nào có thời gian thì liên lạc với tôi nhé."
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_02",
  "videoId": "rBDBC82UmKo",
  "startTime": 452,
  "endTime": 453.5,
  "fullSentence": "와 진짜 라이브 미쳤다",
  "blankWord": "미쳤",
  "explanation": {
    "en": "'미쳤다' literally means \"to be crazy,\" but in everyday Korean it is often used to express strong surprise, excitement, or amazement.\n와, 미쳤다! /진짜 미쳤네!  Wow, that's crazy!, That's insane!",
    "ja": "'미쳤다'は文字通り「気が狂っている」という意味ですが、日常の韓国語では強い驚き、興奮、感嘆を表すためによく使われます。\n와, 미쳤다! /진짜 미쳤네!  うわ、やばい！／マジでやばい！",
    "es": "'미쳤다' significa literalmente “estar loco”, pero en el coreano cotidiano se usa a menudo para expresar sorpresa, entusiasmo o asombro intensos.\n와, 미쳤다! /진짜 미쳤네!  ¡Guau, es una locura!, ¡Es increíble!",
    "zh": "'미쳤다'字面意思是“疯了”，但在日常韩语中，它常被用来表达强烈的惊讶、兴奋或赞叹。\n와, 미쳤다! /진짜 미쳤네!  哇，太疯狂了！／太离谱了！",
    "vi": "'미쳤다' theo nghĩa đen là “điên”, nhưng trong tiếng Hàn hàng ngày nó thường được dùng để diễn tả sự ngạc nhiên, phấn khích hoặc kinh ngạc mạnh mẽ.\n와, 미쳤다! /진짜 미쳤네!  Trời ơi, điên thật đấy!, Đỉnh thật đấy!"
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_03",
  "videoId": "rBDBC82UmKo",
  "startTime": 456,
  "endTime": 458,
  "fullSentence": "잘 먹겠습니다!",
  "blankWord": "먹겠습니다",
  "explanation": {
    "en": "잘 먹겠습니다 = Thanks for the meal. / I'll enjoy the meal.\nThis expression is said before eating to show gratitude to the person who prepared or paid for the meal. There is no exact English equivalent.\n\n잘 먹었습니다.  Thanks for the meal. (said after eating)",
    "ja": "잘 먹겠습니다 = いただきます。 / おいしくいただきますね。\nこの表現は、食事を作ってくれた人やご馳走してくれた人への感謝を示すために、食べる前に言います。英語には完全に対応する表現がありません。\n\n잘 먹었습니다.  ごちそうさまでした。（食べた後に言う）",
    "es": "잘 먹겠습니다 = Gracias por la comida. / Voy a disfrutar la comida.\nEsta expresión se dice antes de comer para mostrar gratitud a la persona que preparó o pagó la comida. No tiene un equivalente exacto en español.\n\n잘 먹었습니다.  Gracias por la comida. (se dice después de comer)",
    "zh": "잘 먹겠습니다 = 谢谢款待。 / 我要开动了。\n这句话在吃饭前说，用来向准备或请客的人表示感谢。中文里没有完全对应的说法。\n\n잘 먹었습니다.  谢谢款待。（吃完饭后说）",
    "vi": "잘 먹겠습니다 = Cảm ơn vì bữa ăn. / Tôi sẽ ăn ngon miệng.\nCâu này được nói trước khi ăn để bày tỏ lòng biết ơn với người đã chuẩn bị hoặc trả tiền cho bữa ăn. Không có câu tương đương chính xác trong tiếng Việt.\n\n잘 먹었습니다.  Cảm ơn vì bữa ăn. (nói sau khi ăn xong)"
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_04",
  "videoId": "rBDBC82UmKo",
  "startTime": 560,
  "endTime": 563,
  "fullSentence": "그래서 저희가 '멋'이라는 노래가 있는데",
  "blankWord": "저희가",
  "explanation": {
    "en": "Adjective + -(으)ㄴ데 / Verb + -는데 = ..., but... / ..., and... / ...\nThis expression gives background information, shows contrast, softens a statement, or leaves the sentence open for the listener to respond. The exact meaning depends on the context.\n비 오는데 우산 있어요?  It's raining. Do you have an umbrella?",
    "ja": "Adjective + -(으)ㄴ데 / Verb + -는데 = 〜だけど… / 〜だけど（で）… / …\nこの表現は背景情報を伝えたり、対比を示したり、発言を和らげたり、聞き手が反応できるように文を開いたままにしたりします。正確な意味は文脈によって異なります。\n비 오는데 우산 있어요?  雨が降っているけど、傘ある？",
    "es": "Adjective + -(으)ㄴ데 / Verb + -는데 = ..., pero... / ..., y... / ...\nEsta expresión aporta información de contexto, muestra contraste, suaviza una afirmación, o deja la oración abierta para que el oyente responda. El significado exacto depende del contexto.\n비 오는데 우산 있어요?  Está lloviendo. ¿Tienes paraguas?",
    "zh": "Adjective + -(으)ㄴ데 / Verb + -는데 = ……，但是…… / ……，然后…… / ……\n这个表达用于提供背景信息、表示对比、缓和语气，或者让句子保持开放以邀请对方回应。具体含义取决于语境。\n비 오는데 우산 있어요?  在下雨呢，你有伞吗？",
    "vi": "Adjective + -(으)ㄴ데 / Verb + -는데 = ..., nhưng... / ..., và... / ...\nBiểu hiện này cung cấp thông tin nền, thể hiện sự tương phản, làm dịu câu nói, hoặc để câu nói mở ngỏ cho người nghe phản hồi. Ý nghĩa chính xác tùy thuộc vào ngữ cảnh.\n비 오는데 우산 있어요?  Trời đang mưa đấy. Bạn có ô không?"
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_05",
  "videoId": "rBDBC82UmKo",
  "startTime": 795,
  "endTime": 797.5,
  "fullSentence": "운동을 진짜 열심히 했거든",
  "blankWord": "진짜",
  "explanation": {
    "en": "Verb/Adjective + -거든(요) = because... / you see... / it's because...\nThis expression is used to give a reason or explain something the listener may not know. \n어제 늦게 잤거든.  I went to bed late last night, you see.\n사실 나는 아침을 잘 안 먹거든.  Actually, I don't usually eat breakfast, you know.",
    "ja": "Verb/Adjective + -거든(요) = 〜だから… / 実は… / 〜なんだよ…\nこの表現は理由を伝えたり、聞き手がまだ知らないことを説明したりするときに使われます。 \n어제 늦게 잤거든.  昨日、遅く寝たんだよね。\n사실 나는 아침을 잘 안 먹거든.  実は私、朝ごはんをあまり食べないんだよね。",
    "es": "Verb/Adjective + -거든(요) = porque... / verás... / es que...\nEsta expresión se usa para dar una razón o explicar algo que el oyente quizá no sepa. \n어제 늦게 잤거든.  Anoche me dormí tarde, ¿sabes?\n사실 나는 아침을 잘 안 먹거든.  De hecho, no suelo desayunar, ¿sabes?",
    "zh": "Verb/Adjective + -거든(요) = 因为…… / 你知道吗…… / 其实是……\n这个表达用于说明原因，或解释一件听者可能还不知道的事。 \n어제 늦게 잤거든.  我昨天很晚才睡呢。\n사실 나는 아침을 잘 안 먹거든.  其实我平时不怎么吃早饭呢。",
    "vi": "Verb/Adjective + -거든(요) = vì... / bạn biết đấy... / là vì...\nBiểu hiện này dùng để đưa ra lý do hoặc giải thích điều mà người nghe có thể chưa biết. \n어제 늦게 잤거든.  Hôm qua tôi ngủ muộn đấy.\n사실 나는 아침을 잘 안 먹거든.  Thật ra tôi không hay ăn sáng đâu."
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_06",
  "videoId": "rBDBC82UmKo",
  "startTime": 840.5,
  "endTime": 842,
  "fullSentence": "형 지금 다 먹은 거야?",
  "blankWord": "먹은",
  "explanation": {
    "en": "In natural Korean speech, 지금 is often pronounced more like 짐 because the final -금 is reduced. Native speakers frequently shorten common words in fast conversation, so ​지금 may sound like 짐 even though it is still written as 지금.",
    "ja": "自然な韓国語の発音では、지금は語尾の-금が弱くなるため、짐のように聞こえることがよくあります。ネイティブスピーカーは早い会話の中で日常的な単語をよく短く発音するので、書くときは지금のままでも、実際には짐のように聞こえることがあります。",
    "es": "En el habla coreana natural, 지금 a menudo se pronuncia más como 짐 porque la sílaba final -금 se reduce. Los hablantes nativos suelen acortar palabras comunes al hablar rápido, así que 지금 puede sonar como 짐 aunque se siga escribiendo 지금.",
    "zh": "在自然的韩语口语中，지금常常听起来更像짐，因为词尾的-금发音被弱化了。母语者在快速交谈时经常把常用词说得更短，所以지금虽然书写不变，但听起来可能像짐。",
    "vi": "Trong lời nói tiếng Hàn tự nhiên, 지금 thường được phát âm giống 짐 hơn vì âm cuối -금 bị rút gọn. Người bản xứ thường nói ngắn các từ thông dụng khi nói nhanh, nên 지금 có thể nghe giống 짐 dù vẫn được viết là 지금."
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_07",
  "videoId": "rBDBC82UmKo",
  "startTime": 882.5,
  "endTime": 888,
  "fullSentence": "형, 난 ___ 가. (아, ___ 가는 구나.) 형, 나는 요즘 ___ 가고 있어.",
  "blankWord": "자주",
  "explanation": {
    "en": "가  go (verb stem)\n가는구나  Oh, you're going. / I see you're going.\n가고 있어  I'm going. / I'm on my way.",
    "ja": "가  行く（動詞の語幹）\n가는구나  ああ、行くんだね。／行くんだ、なるほど。\n가고 있어  行ってるよ。／向かってるところ。",
    "es": "가  ir (raíz del verbo)\n가는구나  Ah, te vas. / Ya veo que te vas.\n가고 있어  Voy. / Voy en camino.",
    "zh": "가  去（动词词干）\n가는구나  哦，你要去啊。／原来你要去啊。\n가고 있어  我在去的路上。／我正要去。",
    "vi": "가  đi (gốc động từ)\n가는구나  À, bạn đang đi đấy à. / Ra là bạn đang đi.\n가고 있어  Tôi đang đi. / Tôi đang trên đường đi."
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_08",
  "videoId": "rBDBC82UmKo",
  "startTime": 1195,
  "endTime": 1198,
  "fullSentence": "이번에 유닛이 생겼어",
  "blankWord": "이번에",
  "explanation": {
    "en": "생기다 = to be created, to form, to appear, or to come into existence\n생겼다 = was created, appeared, formed, or came into existence",
    "ja": "생기다 = 生まれる、できる、現れる、または存在するようになる\n생겼다 = 生まれた、できた、現れた、または存在するようになった",
    "es": "생기다 = crearse, formarse, aparecer, o llegar a existir\n생겼다 = se creó, apareció, se formó, o llegó a existir",
    "zh": "생기다 = 产生、形成、出现，或开始存在\n생겼다 = 产生了、出现了、形成了，或开始存在了",
    "vi": "생기다 = được tạo ra, hình thành, xuất hiện, hoặc ra đời\n생겼다 = đã được tạo ra, đã xuất hiện, đã hình thành, hoặc đã ra đời"
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_09",
  "videoId": "rBDBC82UmKo",
  "startTime": 1453,
  "endTime": 1458,
  "fullSentence": "19년 동안 화장실도 못 갔어요",
  "blankWord": "화장실",
  "explanation": {
    "en": "Noun + 동안 = for... / during...\n한 시간 동안 공부했어요.  I studied for an hour.",
    "ja": "Noun + 동안 = 〜の間… / 〜の間ずっと…\n한 시간 동안 공부했어요.  1時間勉強しました。",
    "es": "Noun + 동안 = durante... / por... (un periodo de tiempo)\n한 시간 동안 공부했어요.  Estudié durante una hora.",
    "zh": "Noun + 동안 = ……期间 / ……的时候（表示时长）\n한 시간 동안 공부했어요.  我学习了一个小时。",
    "vi": "Noun + 동안 = trong... / trong suốt... (khoảng thời gian)\n한 시간 동안 공부했어요.  Tôi đã học trong một tiếng đồng hồ."
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_10",
  "videoId": "rBDBC82UmKo",
  "startTime": 1517,
  "endTime": 1519,
  "fullSentence": "야, 당연하지~",
  "blankWord": "당연",
  "explanation": {
    "en": "당연하다 = to be natural, to be obvious, to be expected, or of course\n당연하지 = Of course. / Obviously. / Definitely.",
    "ja": "당연하다 = 当然だ、当たり前だ、予想通りだ、もちろんだ\n당연하지 = もちろん。／当たり前でしょ。／当然だよ。",
    "es": "당연하다 = ser natural, ser obvio, ser de esperar, o por supuesto\n당연하지 = Por supuesto. / Obviamente. / Claro que sí.",
    "zh": "당연하다 = 理所当然、显而易见、意料之中，或当然\n당연하지 = 当然啦。／那还用说。／肯定的。",
    "vi": "당연하다 = là điều đương nhiên, hiển nhiên, tất nhiên, hoặc dĩ nhiên\n당연하지 = Đương nhiên rồi. / Rõ ràng rồi. / Chắc chắn rồi."
  },
  "hasHardcodedSubs": true
},
{
  "id": "Jae friends_Ateez_10",
  "videoId": "rBDBC82UmKo",
  "startTime": 1853,
  "endTime": 1855,
  "fullSentence": "5주년 축하해~",
  "blankWord": "축하",
  "explanation": {
    "en": "축하해(요) = Congratulations!\n생일 축하해!  Happy birthday!\n졸업 축하해!  Congratulations on your graduation!\n합격 축하해!  Congratulations on passing!",
    "ja": "축하해(요) = おめでとう！\n생일 축하해!  誕生日おめでとう！\n졸업 축하해!  卒業おめでとう！\n합격 축하해!  合格おめでとう！",
    "es": "축하해(요) = ¡Felicidades!\n생일 축하해!  ¡Feliz cumpleaños!\n졸업 축하해!  ¡Felicidades por tu graduación!\n합격 축하해!  ¡Felicidades por aprobar!",
    "zh": "축하해(요) = 恭喜！\n생일 축하해!  生日快乐！\n졸업 축하해!  恭喜毕业！\n합격 축하해!  恭喜考上/考过！",
    "vi": "축하해(요) = Chúc mừng!\n생일 축하해!  Chúc mừng sinh nhật!\n졸업 축하해!  Chúc mừng tốt nghiệp!\n합격 축하해!  Chúc mừng bạn đã đỗ!"
  },
  "hasHardcodedSubs": true
},
{
  "id": "Awqvbvi_01",
  "videoId": "wQvbvIJttDc",
  "startTime": 46,
  "endTime": 48.5,
  "fullSentence": "부산에 온 걸 환영해",
  "blankWord": "온",
  "explanation": {
    "en": "것을=걸   (것이=게, 것은=건)\n '-걸' is the shortened form of '-것을' and is very common in everyday conversation.\nVerb + -(으)ㄴ 것 = the thing that... / what... / the fact that... (past or completed action)\nVerb + -는 것 = the act of... / ...ing / the thing that... (present, ongoing, or general action)\nThese expressions turn a verb into a noun.\n네가 온 걸 봤어.  I saw that you came.\n잃어버린 걸 찾았어요.  I found what I had lost."
  },
  "hasHardcodedSubs": true
}
];

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

  // 표현 클릭 즉석 해설 (원어민 빠른 발화/연음/축약/슬랭 뉘앙스) — 문장 어디서든 재사용
  const explainer = useExpressionExplainer({ videoId: routeVideoId, artist: currentVideo?.artist });

  const [list, setList] = useState(filteredQuizList);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]); // index별 'correct'|'partial'|'wrong'
  const [phase, setPhase] = useState('quiz'); // 'quiz' | 'done'
  const quiz = list[index];

  // Firestore 에 배포(published)된 퀴즈가 있으면 하드코딩 목록보다 우선 사용
  useEffect(() => {
    if (!routeVideoId) return;
    let cancelled = false;
    loadPublishedQuizzes(routeVideoId)
      .then((published) => {
        if (cancelled || !published || published.length === 0) return;
        setList(published);
        setIndex(0);
        setResults([]);
        setPhase('quiz');
      })
      .catch(() => { /* 오프라인/규칙 오류 시 하드코딩 fallback 유지 */ });
    return () => { cancelled = true; };
  }, [routeVideoId]);

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
    if (!quiz) return; // 배포 퀴즈 로딩 전(하드코딩 없음) 크래시 방지
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
  }, [quiz?.videoId]);

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
  }, [answer, quiz?.blankWord, recordStudy, index]);

  const resetAttempt = useCallback(() => {
    setAnswer('');
    setStatus('idle');
    setShowReview(false);
    setHintShown(false);
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

  // 아직 퀴즈가 없음: 배포 퀴즈 로딩 중이거나 미배포 영상 (하드코딩 fallback 도 없음)
  if (!quiz) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center text-slate-500">
        <p className="text-4xl">🎬</p>
        <p className="mt-3 text-sm font-semibold">{t('kartist.comingSoonSub')}</p>
      </div>
    );
  }

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
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('kpop.clozePrompt')}
            </p>
            <p className="mb-3 text-[11px] text-slate-400">{t('kpop.tapHint')}</p>
            {/* 딕테이션 원문 + 입력창: 크롬 자동 번역 차단 (translate="no" + notranslate)
                prefix/suffix 어절은 클릭 가능 — 모르는 표현 탭하면 즉석 해설 모달 오픈 */}
            <div
              translate="no"
              className="notranslate flex flex-wrap items-center gap-1 text-lg leading-relaxed"
            >
              <ClickableKorean text={prefix} onWordClick={(w) => explainer.explain(w, quiz.fullSentence)} />
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
              <ClickableKorean text={suffix} onWordClick={(w) => explainer.explain(w, quiz.fullSentence)} />
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
          stars={(currentVideo && currentVideo.stars) || 0}
          streak={stats.streak}
          liftBtn={liftBtn}
          onRestart={restartAll}
          videoId={routeVideoId || quiz?.videoId}
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
          explainer={explainer}
          onReplay={() => {
            setShowReview(false);
            replaySegment();
          }}
          onNext={goNext}
          onClose={() => setShowReview(false)}
        />
      )}

      {/* ── 표현 클릭 즉석 해설 모달: 위 어느 문장에서 탭하든 여기서 공통 표시 ── */}
      <ExpressionModal
        open={explainer.open}
        expression={explainer.expression}
        loading={explainer.loading}
        explanation={explainer.explanation}
        error={explainer.error}
        onClose={explainer.close}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 발음 포인트 복습 창: 채점 결과 + 해설 + '다음 문장 듣기' 흐름 제어
// ─────────────────────────────────────────────────────────────────────────────
function ReviewModal({ status, quiz, answer, isLast, liftBtn, explainer, onReplay, onNext, onClose }) {
  const { t, lang } = useLang();
  const isCorrect = status === 'correct';
  const isPartial = status === 'partial';
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

        {/* 전체 문장 (빈칸 단어 하이라이트) — 한국어 원문 보호, 어절 클릭 시 즉석 해설 */}
        <p
          translate="no"
          className="notranslate mt-3 rounded-xl bg-indigo-50 p-3 text-sm leading-relaxed text-indigo-900"
        >
          {quiz.fullSentence.split(quiz.blankWord).map((part, i, arr) => (
            <span key={i}>
              <ClickableKorean text={part} onWordClick={(w) => explainer.explain(w, quiz.fullSentence)} />
              {i < arr.length - 1 && (
                <mark className="rounded bg-indigo-200 px-1 font-bold text-indigo-900">
                  <ClickableKorean
                    text={quiz.blankWord}
                    onWordClick={(w) => explainer.explain(w, quiz.fullSentence)}
                  />
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
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={onRestart}
            className={`${liftBtn} rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800`}
          >
            {t('kpop.restart')}
          </button>
        </div>
      </section>

      {/* 성적 기반 바이럴 공유 — 포토카드 저장 + 통합 도전장 공유 버튼 */}
      <section className="rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 p-5 text-white shadow-lg">
        <p className="text-sm font-semibold opacity-90">{t('kpop.shareTitle')}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={shareCard}
            disabled={cardBusy}
            className={`${liftBtn} rounded-xl bg-amber-400 px-4 py-2 text-sm font-bold text-slate-900 shadow hover:bg-amber-300 disabled:opacity-60`}
          >
            {cardSaved ? t('kpop.cardSaved') : cardBusy ? '…' : t('kpop.saveCard')}
          </button>
        </div>
      </section>

      <ChallengeShare
        label={artist}
        score={percent}
        stars={stars}
        gamePath={`/kpop-quiz/${videoId || ''}`}
        correctCount={correctCount}
        total={total}
        thumbnailUrl={videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : undefined}
        variant="light"
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
    fullSentence: currentQuiz.fullSentence,
    blankWord: currentQuiz.blankWord,
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
