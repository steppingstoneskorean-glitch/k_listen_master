// src/data/wordMeanings.ts
// ─────────────────────────────────────────────────────────────────────────────
// 초급 최소 대립쌍(minimalPairs.ts) 단어의 의미(번역) — 게임/복습 화면에서 함께 노출.
//   · 키는 한국어 단어 그대로. 값은 { en, es, ja } 3개 언어.
//   · 한국어(ko) 사용자는 원문이 곧 의미이므로 별도 표시하지 않는다(meaningText 참고).
//   · 값이 비어 있으면(아직 미번역) 화면에 아무것도 표시되지 않는다.
//   · TODO(번역): 아래 빈 문자열을 en/es/ja 로 채우면 즉시 게임·복습 화면에 반영된다.
// ─────────────────────────────────────────────────────────────────────────────

import type { Lang } from '@/lib/i18n'

/** 단어/문장 의미 다국어 객체 (모두 존재하되 미번역 시 빈 문자열). */
export interface Meaning {
  en: string
  es: string
  ja: string
}

/**
 * 표시할 의미 문자열을 고른다.
 *   · ko: 원문이 곧 의미이므로 빈 문자열(표시 안 함)
 *   · 선택 언어가 비어 있으면 영어로 폴백, 그것도 비어 있으면 빈 문자열
 */
export function meaningText(m: Meaning | undefined, lang: Lang): string {
  if (!m || lang === 'ko') return ''
  return (m[lang] || m.en || '').trim()
}

/** 한 단어의 의미를 바로 얻는 편의 함수. */
export function wordMeaning(word: string, lang: Lang): string {
  return meaningText(WORD_MEANINGS[word], lang)
}

const M = (en = '', es = '', ja = ''): Meaning => ({ en, es, ja })

// ── 단어별 의미 (minimalPairs.ts PAIRS_BY_LEVEL 의 모든 고유 단어) ────────────────
export const WORD_MEANINGS: Record<string, Meaning> = {
  // 레벨 1
  '아이': M('child', 'niño', '子ども'),
  '오이': M('cucumber', 'pepino', 'きゅうり'),
  '구두': M('dress shoes', 'zapatos', '革靴'),
  '구도': M('composition (art)', 'composición', '構図'),
  '나무': M('tree', 'árbol', '木'),
  '너무': M('too (much)', 'demasiado', 'あまりに（～すぎる）'),
  '물고기': M('fish', 'pez', '魚'),
  '불고기': M('bulgogi (grilled beef)', 'bulgogi (carne a la parrilla)', 'プルコギ'),
  '커피': M('coffee', 'café', 'コーヒー'),
  '코피': M('nosebleed', 'hemorragia nasal', '鼻血'),
  '모래': M('sand', 'arena', '砂'),
  '머리': M('head; hair', 'cabeza; pelo', '頭、髪'),
  '별': M('star', 'estrella', '星'),
  '벌': M('bee', 'abeja', '蜂'),
  '노래': M('song', 'canción', '歌'),
  '배': M('pear; ship; belly', 'pera; barco; barriga', '梨・船・お腹'),
  '비': M('rain', 'lluvia', '雨'),
  '밤': M('night; chestnut', 'noche; castaña', '夜、栗'),
  '뱀': M('snake', 'serpiente', '蛇'),
  '말': M('horse; words', 'caballo; palabra', '馬、言葉'),
  '발': M('foot', 'pie', '足'),
  '소금': M('salt', 'sal', '塩'),
  '조금': M('a little', 'un poco', '少し'),
  '운전': M('driving', 'conducción', '運転'),
  '안전': M('safety', 'seguridad', '安全'),
  '볼': M('cheek', 'mejilla', '頬'),
  '파': M('green onion', 'cebolleta', 'ねぎ'),
  '피': M('blood', 'sangre', '血'),
  '소': M('cow', 'vaca', '牛'),
  '새': M('bird', 'pájaro', '鳥'),
  '고기': M('meat', 'carne', '肉'),
  '거기': M('there', 'ahí', 'そこ'),
  '여유': M('leeway; spare time', 'holgura; tiempo libre', '余裕'),
  '우유': M('milk', 'leche', '牛乳'),
  '무리': M('group; overdoing it', 'grupo; exceso', '群れ、無理'),
  '부모': M('parents', 'padres', '両親'),
  '보모': M('nanny', 'niñera', 'ベビーシッター（保母）'),
  '하늘': M('sky', 'cielo', '空'),
  '마늘': M('garlic', 'ajo', 'にんにく'),

  // 레벨 2
  '산': M('mountain', 'montaña', '山'),
  '상': M('prize; award', 'premio', '賞'),
  '삼': M('three', 'tres', '三'),
  '곰': M('bear', 'oso', '熊'),
  '공': M('ball', 'pelota', 'ボール'),
  '방': M('room', 'habitación', '部屋'),
  '반': M('half; class', 'mitad; clase', '半分、クラス'),
  '감': M('persimmon', 'caqui', '柿'),
  '강': M('river', 'río', '川'),
  '병': M('bottle; illness', 'botella; enfermedad', '瓶、病気'),
  '명': M('counter for people', 'contador de personas', '名（人数の助数詞）'),
  '돈': M('money', 'dinero', 'お金'),
  '돌': M('stone', 'piedra', '石'),
  '밥': M('cooked rice; meal', 'arroz (cocido); comida', 'ご飯'),
  '문': M('door; gate', 'puerta', 'ドア、門'),
  '물': M('water', 'agua', '水'),
  '짐': M('luggage; load', 'equipaje; carga', '荷物'),
  '집': M('house; home', 'casa', '家'),
  '글': M('writing; text', 'escrito; texto', '文章'),
  '금': M('gold', 'oro', '金'),
  '잔': M('glass; cup', 'vaso; copa', '杯、グラス'),
  '장': M('sheet (of paper); chapter', 'hoja; capítulo', '枚、章'),
  '귤': M('tangerine', 'mandarina', 'みかん'),
  '균': M('germ; bacteria', 'germen; bacteria', '菌'),
  '솜': M('cotton (wadding)', 'algodón', '綿'),
  '솥': M('cauldron; pot', 'olla; caldero', '釜'),
  '사람': M('person', 'persona', '人'),
  '사랑': M('love', 'amor', '愛'),

  // 레벨 3
  '도끼': M('axe', 'hacha', '斧'),
  '토끼': M('rabbit', 'conejo', 'うさぎ'),
  '딸': M('daughter', 'hija', '娘'),
  '탈': M('mask', 'máscara', 'お面、仮面'),
  '달': M('moon; month', 'luna; mes', '月'),
  '불': M('fire', 'fuego', '火'),
  '뿔': M('horn', 'cuerno', '角'),
  '풀': M('grass', 'hierba', '草'),
  '창': M('window', 'ventana', '窓'),
  '빵': M('bread', 'pan', 'パン'),
  '굴': M('oyster; cave', 'ostra; cueva', '牡蠣、洞窟'),
  '꿀': M('honey', 'miel', '蜂蜜'),
  '고리': M('ring; loop', 'anilla; aro', '輪、環'),
  '꼬리': M('tail', 'cola', '尻尾'),
  '그림': M('picture; drawing', 'dibujo; cuadro', '絵'),
  '크림': M('cream', 'crema', 'クリーム'),
  '종': M('bell', 'campana', '鐘'),
  '총': M('gun', 'pistola', '銃'),
  '콩': M('bean; soybean', 'frijol; soja', '豆'),
  '부리': M('beak', 'pico', 'くちばし'),
  '뿌리': M('root', 'raíz', '根'),
  '가다': M('to go', 'ir', '行く'),
  '까다': M('to peel; to shell', 'pelar; descascarar', 'むく（皮を）'),
  '살': M('flesh (body); ~years old', 'carne (del cuerpo); años (de edad)', '肉（身）、～歳'),
  '쌀': M('(uncooked) rice', 'arroz (crudo)', '米（生米）'),
  '찜': M('jjim (steamed/braised dish)', 'jjim (plato al vapor)', 'チム（蒸し料理）'),
  '대': M('pole; counter for vehicles', 'vara; contador de vehículos', '竿、台（助数詞）'),
  '때': M('time; grime', 'momento; mugre', '時、垢'),
  '소다': M('soda', 'soda', 'ソーダ'),
  '쏘다': M('to shoot; to sting', 'disparar; picar', '撃つ、刺す'),
  '마음': M('mind; heart', 'mente; corazón', '心'),
  '마을': M('village', 'pueblo', '村'),

  // 레벨 4
  '얼음': M('ice', 'hielo', '氷'),
  '어른': M('adult', 'adulto', '大人'),
  '단어': M('word (vocabulary)', 'palabra', '単語'),
  '다녀': M('go around; attend (form of 다니다)', 'ir y venir; asistir (forma de 다니다)', '通う・行ってくる（다니다の活用）'),
  '사다': M('to buy', 'comprar', '買う'),
  '싸다': M('to be cheap', 'ser barato', '安い'),
  '책상': M('desk', 'escritorio', '机'),
  '색상': M('color; hue', 'color', '色、色相'),
  '담': M('wall; fence', 'muro; tapia', '塀'),
  '땀': M('sweat', 'sudor', '汗'),
  '팔': M('arm', 'brazo', '腕'),
  '자다': M('to sleep', 'dormir', '寝る'),
  '짜다': M('to be salty', 'ser salado', '塩辛い'),
  '차다': M('to kick; to be cold', 'patear; estar frío', '蹴る、冷たい'),
  '거울': M('mirror', 'espejo', '鏡'),
  '겨울': M('winter', 'invierno', '冬'),
  '시력': M('eyesight', 'vista', '視力'),
  '실력': M('skill; ability', 'habilidad; capacidad', '実力'),
  '고장': M('breakdown; out of order', 'avería', '故障'),
  '공장': M('factory', 'fábrica', '工場'),
}
