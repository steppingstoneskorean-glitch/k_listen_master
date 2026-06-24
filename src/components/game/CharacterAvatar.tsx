export interface CharacterConfig {
  skinTone: number   // 0-3
  hairStyle: number  // 0-4
  hairColor: number  // 0-4
  glasses: number    // 0-3
  outfitColor: number // 0-4
}

export const SKIN_TONES = ['#FDDBB4', '#E8B88A', '#C68642', '#8D5524']
export const HAIR_COLORS = ['#1a1a1a', '#6B3A2A', '#C8A97E', '#B22222', '#7B3F9E']
export const OUTFIT_COLORS = ['#4A90E2', '#E24A6B', '#4ABA77', '#9B4AE2', '#E2904A']

const SKIN_LABELS = ['라이트', '내추럴', '웜', '딥']
const HAIR_STYLE_LABELS = ['숏컷', '롱', '단발', '업두', '스파이키']
const HAIR_COLOR_LABELS = ['블랙', '브라운', '블론드', '레드', '퍼플']
const GLASSES_LABELS = ['없음', '라운드', '사각', '캣아이']
const OUTFIT_LABELS = ['블루', '핑크', '그린', '퍼플', '오렌지']

export const CONFIG_LABELS = {
  skinTone: SKIN_LABELS,
  hairStyle: HAIR_STYLE_LABELS,
  hairColor: HAIR_COLOR_LABELS,
  glasses: GLASSES_LABELS,
  outfitColor: OUTFIT_LABELS,
}

export const DEFAULT_CHARACTER: CharacterConfig = {
  skinTone: 0,
  hairStyle: 0,
  hairColor: 0,
  glasses: 0,
  outfitColor: 0,
}

function Hair({ style, color }: { style: number; color: string }) {
  switch (style) {
    case 0: // Short
      return <ellipse cx="60" cy="30" rx="37" ry="22" fill={color} />
    case 1: // Long
      return (
        <>
          <ellipse cx="60" cy="30" rx="37" ry="22" fill={color} />
          <rect x="21" y="46" width="15" height="58" rx="7" fill={color} />
          <rect x="84" y="46" width="15" height="58" rx="7" fill={color} />
        </>
      )
    case 2: // Bob
      return (
        <>
          <ellipse cx="60" cy="30" rx="37" ry="22" fill={color} />
          <rect x="21" y="46" width="15" height="36" rx="7" fill={color} />
          <rect x="84" y="46" width="15" height="36" rx="7" fill={color} />
          <rect x="22" y="76" width="76" height="8" rx="4" fill={color} />
        </>
      )
    case 3: // Bun
      return (
        <>
          <ellipse cx="60" cy="33" rx="37" ry="19" fill={color} />
          <circle cx="60" cy="12" r="16" fill={color} />
        </>
      )
    case 4: // Spiky
      return (
        <>
          <ellipse cx="60" cy="34" rx="37" ry="18" fill={color} />
          <polygon points="60,2 54,24 66,24" fill={color} />
          <polygon points="40,10 36,30 50,26" fill={color} />
          <polygon points="80,10 84,30 70,26" fill={color} />
          <polygon points="25,32 24,50 36,40" fill={color} />
          <polygon points="95,32 96,50 84,40" fill={color} />
        </>
      )
    default:
      return null
  }
}

function Glasses({ style }: { style: number }) {
  if (style === 0) return null
  const stroke = '#444'
  const sw = 2.5
  if (style === 1) { // Round
    return (
      <>
        <circle cx="46" cy="63" r="13" fill="none" stroke={stroke} strokeWidth={sw} />
        <circle cx="74" cy="63" r="13" fill="none" stroke={stroke} strokeWidth={sw} />
        <line x1="59" y1="63" x2="61" y2="63" stroke={stroke} strokeWidth={sw} />
        <line x1="22" y1="61" x2="33" y2="63" stroke={stroke} strokeWidth={2} />
        <line x1="87" y1="63" x2="98" y2="61" stroke={stroke} strokeWidth={2} />
      </>
    )
  }
  if (style === 2) { // Square
    return (
      <>
        <rect x="32" y="52" width="26" height="20" rx="3" fill="none" stroke={stroke} strokeWidth={sw} />
        <rect x="62" y="52" width="26" height="20" rx="3" fill="none" stroke={stroke} strokeWidth={sw} />
        <line x1="58" y1="62" x2="62" y2="62" stroke={stroke} strokeWidth={sw} />
        <line x1="22" y1="60" x2="32" y2="62" stroke={stroke} strokeWidth={2} />
        <line x1="88" y1="62" x2="98" y2="60" stroke={stroke} strokeWidth={2} />
      </>
    )
  }
  if (style === 3) { // Cat-eye
    return (
      <>
        <path d="M33,68 Q38,50 58,52 L58,66 Q48,68 33,68 Z" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        <path d="M62,52 Q82,50 87,68 Q72,68 62,66 Z" fill="none" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
        <line x1="58" y1="59" x2="62" y2="59" stroke={stroke} strokeWidth={sw} />
        <line x1="22" y1="61" x2="33" y2="68" stroke={stroke} strokeWidth={2} />
        <line x1="87" y1="68" x2="98" y2="61" stroke={stroke} strokeWidth={2} />
      </>
    )
  }
  return null
}

export default function CharacterAvatar({
  config,
  size = 120,
}: {
  config: CharacterConfig
  size?: number
}) {
  const skin = SKIN_TONES[config.skinTone]
  const hairColor = HAIR_COLORS[config.hairColor]
  const outfit = OUTFIT_COLORS[config.outfitColor]

  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 120 180">
      {/* Body */}
      <rect x="22" y="102" width="76" height="68" rx="14" fill={outfit} />
      {/* Outfit detail */}
      <rect x="50" y="102" width="20" height="10" rx="4" fill="rgba(255,255,255,0.25)" />
      {/* Neck */}
      <rect x="49" y="92" width="22" height="16" rx="0" fill={skin} />
      {/* Head */}
      <circle cx="60" cy="62" r="38" fill={skin} />
      {/* Hair (behind face features) */}
      <Hair style={config.hairStyle} color={hairColor} />
      {/* Cheeks */}
      <ellipse cx="33" cy="72" rx="10" ry="6" fill="#FFB3BA" opacity="0.55" />
      <ellipse cx="87" cy="72" rx="10" ry="6" fill="#FFB3BA" opacity="0.55" />
      {/* Eyes - white */}
      <ellipse cx="46" cy="60" rx="9" ry="10" fill="white" />
      <ellipse cx="74" cy="60" rx="9" ry="10" fill="white" />
      {/* Pupils */}
      <circle cx="48" cy="62" r="6" fill="#333" />
      <circle cx="76" cy="62" r="6" fill="#333" />
      {/* Highlights */}
      <circle cx="50" cy="59" r="2.5" fill="white" />
      <circle cx="78" cy="59" r="2.5" fill="white" />
      {/* Mouth */}
      <path
        d="M 50 76 Q 60 86 70 76"
        stroke="#C47B7B"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Glasses */}
      <Glasses style={config.glasses} />
    </svg>
  )
}
