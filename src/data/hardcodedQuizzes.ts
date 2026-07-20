// src/data/hardcodedQuizzes.ts
// ─────────────────────────────────────────────────────────────────────────────
// 코드에 내장된 기본 퀴즈 (Firestore 미배포 모드의 fallback)
//   · mode 필드가 없는 항목은 A(딕테이션)로 간주한다
//   · Firestore 에 같은 모드가 배포되면 그 모드는 배포본이 우선한다 (lib/quizResolve)
// ─────────────────────────────────────────────────────────────────────────────

import type { QuizItem } from '@/lib/quizStore'

export const HARDCODED_QUIZZES: QuizItem[] = [
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
    "en": "것을=걸   (것이=게, 것은=건)\n '-걸' is the shortened form of '-것을' and is very common in everyday conversation.\nVerb + -(으)ㄴ 것 = the thing that... / what... / the fact that... (past or completed action)\nVerb + -는 것 = the act of... / ...ing / the thing that... (present, ongoing, or general action)\nThese expressions turn a verb into a noun.\n네가 온 걸 봤어.  I saw that you came.\n잃어버린 걸 찾았어요.  I found what I had lost.",
    "ja": "것을=걸   (것이=게, 것은=건)\n'-걸'は'-것을'の短縮形で、日常会話で非常に一般的です。\nVerb + -(으)ㄴ 것 = そのこと／...こと／...という事実（過去または完了の動作）\nVerb + -는 것 = その行為／...中／...ということ（現在、進行、または一般的な動作）\nこれらの表現は動詞を名詞に変換します。\n네가 온 걸 봤어. あなたが来たのを見ました。\n잃어버린 걸 찾았어요. 私が失ったものを見つけました。",
    "es": "것을=걸   (것이=게, 것은=건)\n'-걸' es la forma abreviada de '-것을' y es muy común en conversaciones cotidianas.\nVerb + -(으)ㄴ 것 = la cosa que... / qué... / el hecho de... (acción pasada o completada)\nVerb + -는 것 = el acto de... / ...ando / la cosa que... (acción presente, continua o general)\nEstas expresiones convierten un verbo en sustantivo.\n네가 온 걸 봤어. Vi que viniste.\n잃어버린 걸 찾았어요. Encontré lo que había perdido.",
    "zh": "것을=걸   (것이=게, 것은=건)\n'-걸'是'-것을'的缩写形式，在日常对话中非常常见。\nVerb + -(으)ㄴ 것 = 该事情／...的事情／...的事实（过去或已完成的动作）\nVerb + -는 것 = 该行为／...进行中／...的事情（现在、进行或一般性的动作）\n这些表达将动词转换为名词。\n네가 온 걸 봤어。 我看到你来了。\n잃어버린 걸 찾았어요。 我找到了我丢失的东西。",
    "vi": "것을=걸   (것이=게, 것은=건)\n'-걸' là dạng rút gọn của '-것을' và rất phổ biến trong hội thoại hàng ngày.\nVerb + -(으)ㄴ 것 = cái gì... / sự... / việc... (hành động đã qua hoặc hoàn thành)\nVerb + -는 것 = hành động... / ...ing / cái gì... (hành động hiện tại, đang diễn ra hoặc chung)\nNhững biểu thức này biến động từ thành danh từ.\n네가 온 걸 봤어. Tôi đã thấy bạn đến.\n잃어버린 걸 찾았어요. Tôi đã tìm thấy thứ mình đã mất."
  },
  "hasHardcodedSubs": true
}
]
