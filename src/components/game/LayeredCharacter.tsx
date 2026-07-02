// ── Types ───────────────────────────────────────────────────────────────────

export interface LayerConfig {
  body: number    // 0-3: skin tone
  head: number    // 0-4: hair style
  outfit: number  // 0-4: clothing
  shoes: number   // 0-3: footwear
}

export const DEFAULT_LAYER_CONFIG: LayerConfig = {
  body: 0,
  head: 0,
  outfit: 0,
  shoes: 0,
}

// ── Constants ────────────────────────────────────────────────────────────────

const SKIN_TONES = ['#FDDBB4', '#E8B88A', '#C68642', '#8D5524']
const HAIR_COLORS = ['#1a1a1a', '#8B4513', '#D4A96A', '#4B1C14', '#7B3F9E']
const OUTFIT_COLORS = ['#3B82F6', '#EC4899', '#10B981', '#6D28D9', '#F59E0B']
const SHOE_COLORS = ['#E5E7EB', '#1F2937', '#92400E', '#FBCFE8']

// Category metadata used by the customizer UI
export const LAYER_CATEGORIES = {
  body: {
    label: '몸체',
    count: 4,
    subLabels: ['라이트', '내추럴', '웜', '딥'],
    accent: '#F59E0B',
    // Thumbnail viewBox shows just the face area
    thumbViewBox: '40 18 120 106',
  },
  head: {
    label: '머리',
    count: 5,
    subLabels: ['숏컷', '롱', '웨이브', '컬리', '업두'],
    accent: '#EC4899',
    thumbViewBox: '36 10 128 120',
  },
  outfit: {
    label: '옷',
    count: 5,
    subLabels: ['캐주얼', '드레스', '후디', '정장', '스포츠'],
    accent: '#3B82F6',
    thumbViewBox: '0 130 200 120',
  },
  shoes: {
    label: '신발',
    count: 4,
    subLabels: ['스니커즈', '부츠', '로퍼', '캔버스'],
    accent: '#10B981',
    thumbViewBox: '20 230 160 110',
  },
} as const

export type LayerCategoryKey = keyof typeof LAYER_CATEGORIES

// ── SVG Layer Components ─────────────────────────────────────────────────────
// Canvas: viewBox="0 0 200 340" for all layers
// Transparent areas allow lower z-index layers to show through.
//
// Z-index stacking order:
//   1: Body  (skin base — head, neck, arms, legs)
//   2: Outfit (clothes — covers torso, arms, upper legs)
//   3: Shoes  (footwear — covers feet / bottom of legs)
//   4: Head   (hair — overlays the top of the head)
//
// When real PNG assets are ready, replace each <Svg> with:
//   <img src={`/character/body/${variant}.png`} width="100%" height="100%" style={{objectFit:'contain'}}/>

function BodySvg({ variant }: { variant: number }) {
  const skin = SKIN_TONES[variant] ?? SKIN_TONES[0]
  return (
    <svg viewBox="0 0 200 340" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Torso (will be covered by OutfitSvg) */}
      <rect x="42" y="140" width="116" height="88" rx="8" fill={skin} />
      {/* Head */}
      <circle cx="100" cy="70" r="52" fill={skin} />
      {/* Neck */}
      <rect x="87" y="120" width="26" height="22" fill={skin} />
      {/* Left arm */}
      <rect x="6" y="142" width="38" height="86" rx="19" fill={skin} />
      {/* Right arm */}
      <rect x="156" y="142" width="38" height="86" rx="19" fill={skin} />
      {/* Left leg */}
      <rect x="50" y="225" width="44" height="80" rx="14" fill={skin} />
      {/* Right leg */}
      <rect x="106" y="225" width="44" height="80" rx="14" fill={skin} />

      {/* ── Face features ── */}
      {/* Cheeks */}
      <ellipse cx="73" cy="82" rx="10" ry="6" fill="#FFB3BA" opacity="0.55" />
      <ellipse cx="127" cy="82" rx="10" ry="6" fill="#FFB3BA" opacity="0.55" />
      {/* Eyes */}
      <ellipse cx="85" cy="67" rx="8" ry="9" fill="white" />
      <ellipse cx="115" cy="67" rx="8" ry="9" fill="white" />
      <circle cx="87" cy="69" r="5.5" fill="#333" />
      <circle cx="117" cy="69" r="5.5" fill="#333" />
      <circle cx="89" cy="66" r="2" fill="white" />
      <circle cx="119" cy="66" r="2" fill="white" />
      {/* Mouth */}
      <path d="M 88 88 Q 100 97 112 88" stroke="#C47B7B" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function HeadSvg({ variant }: { variant: number }) {
  const color = HAIR_COLORS[variant] ?? HAIR_COLORS[0]
  return (
    <svg viewBox="0 0 200 340" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {variant === 0 && (
        /* Short crop */
        <>
          <ellipse cx="100" cy="50" rx="52" ry="28" fill={color} />
          <rect x="48" y="50" width="18" height="24" rx="9" fill={color} />
          <rect x="134" y="50" width="18" height="24" rx="9" fill={color} />
        </>
      )}
      {variant === 1 && (
        /* Long straight */
        <>
          <ellipse cx="100" cy="50" rx="52" ry="28" fill={color} />
          <rect x="48" y="62" width="20" height="110" rx="10" fill={color} />
          <rect x="132" y="62" width="20" height="110" rx="10" fill={color} />
          <rect x="50" y="62" width="100" height="28" fill={color} />
        </>
      )}
      {variant === 2 && (
        /* Wavy bob */
        <>
          <ellipse cx="100" cy="50" rx="52" ry="28" fill={color} />
          <rect x="48" y="60" width="20" height="62" rx="10" fill={color} />
          <rect x="132" y="60" width="20" height="62" rx="10" fill={color} />
          <ellipse cx="68" cy="124" rx="24" ry="9" fill={color} />
          <ellipse cx="100" cy="128" rx="20" ry="8" fill={color} />
          <ellipse cx="132" cy="124" rx="24" ry="9" fill={color} />
        </>
      )}
      {variant === 3 && (
        /* Curly / afro */
        <>
          <ellipse cx="100" cy="44" rx="56" ry="36" fill={color} />
          <circle cx="50" cy="68" r="22" fill={color} />
          <circle cx="150" cy="68" r="22" fill={color} />
          <circle cx="74" cy="24" r="18" fill={color} />
          <circle cx="100" cy="18" r="16" fill={color} />
          <circle cx="126" cy="24" r="18" fill={color} />
        </>
      )}
      {variant === 4 && (
        /* High bun */
        <>
          <ellipse cx="100" cy="62" rx="50" ry="22" fill={color} />
          {/* Bun top */}
          <ellipse cx="100" cy="30" rx="22" ry="20" fill={color} />
          <rect x="88" y="42" width="24" height="22" fill={color} />
          {/* Side strands */}
          <rect x="50" y="62" width="14" height="20" rx="7" fill={color} />
          <rect x="136" y="62" width="14" height="20" rx="7" fill={color} />
        </>
      )}
    </svg>
  )
}

function OutfitSvg({ variant }: { variant: number }) {
  const c = OUTFIT_COLORS[variant] ?? OUTFIT_COLORS[0]
  return (
    <svg viewBox="0 0 200 340" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {variant === 0 && (
        /* Blue casual — t-shirt + jeans */
        <>
          {/* Shirt body */}
          <rect x="42" y="140" width="116" height="80" rx="6" fill={c} />
          {/* Sleeves */}
          <rect x="6" y="142" width="42" height="52" rx="18" fill={c} />
          <rect x="152" y="142" width="42" height="52" rx="18" fill={c} />
          {/* Collar V */}
          <path d="M 86 140 L 100 162 L 114 140" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinejoin="round" />
          {/* Jeans */}
          <rect x="50" y="217" width="44" height="88" rx="14" fill="#1D4ED8" />
          <rect x="106" y="217" width="44" height="88" rx="14" fill="#1D4ED8" />
          {/* Jeans center seam */}
          <rect x="93" y="217" width="14" height="88" fill="#1E40AF" />
          {/* Belt */}
          <rect x="44" y="215" width="112" height="10" rx="5" fill="#92400E" />
        </>
      )}
      {variant === 1 && (
        /* Pink dress */
        <>
          {/* Bodice */}
          <rect x="54" y="140" width="92" height="58" rx="6" fill={c} />
          {/* Spaghetti straps */}
          <rect x="68" y="120" width="12" height="24" rx="6" fill={c} />
          <rect x="120" y="120" width="12" height="24" rx="6" fill={c} />
          {/* Skirt flare */}
          <path d="M 40 196 Q 20 340 100 336 Q 180 340 160 196 Z" fill="#F472B6" />
          {/* Waist ribbon */}
          <rect x="50" y="192" width="100" height="8" rx="4" fill="#DB2777" />
          <polygon points="96,196 104,196 100,206" fill="#DB2777" />
        </>
      )}
      {variant === 2 && (
        /* Green hoodie + joggers */
        <>
          {/* Hoodie body */}
          <rect x="38" y="137" width="124" height="90" rx="10" fill={c} />
          {/* Long sleeves */}
          <rect x="4" y="140" width="40" height="92" rx="18" fill={c} />
          <rect x="156" y="140" width="40" height="92" rx="18" fill={c} />
          {/* Front pocket */}
          <rect x="72" y="185" width="56" height="32" rx="10" fill="#059669" />
          {/* Hoodie strings */}
          <rect x="94" y="142" width="5" height="28" rx="2" fill="#059669" />
          <rect x="101" y="142" width="5" height="28" rx="2" fill="#059669" />
          {/* Joggers */}
          <rect x="50" y="224" width="44" height="80" rx="14" fill="#374151" />
          <rect x="106" y="224" width="44" height="80" rx="14" fill="#374151" />
          {/* Jogger cuffs */}
          <rect x="50" y="292" width="44" height="14" rx="4" fill="#1F2937" />
          <rect x="106" y="292" width="44" height="14" rx="4" fill="#1F2937" />
        </>
      )}
      {variant === 3 && (
        /* Purple formal suit */
        <>
          {/* Jacket */}
          <rect x="38" y="138" width="124" height="90" rx="6" fill={c} />
          {/* Jacket sleeves */}
          <rect x="4" y="140" width="40" height="90" rx="18" fill={c} />
          <rect x="156" y="140" width="40" height="90" rx="18" fill={c} />
          {/* Lapels */}
          <path d="M 80 138 L 100 174 L 90 138 Z" fill="#5B21B6" />
          <path d="M 120 138 L 100 174 L 110 138 Z" fill="#5B21B6" />
          {/* Shirt underneath */}
          <rect x="92" y="138" width="16" height="36" fill="white" />
          {/* Tie */}
          <path d="M 97 155 L 103 155 L 105 202 L 100 208 L 95 202 Z" fill="#FCD34D" />
          <polygon points="95,155 105,155 103,148 97,148" fill="#FCA5A5" />
          {/* Dress pants */}
          <rect x="50" y="225" width="44" height="80" rx="14" fill="#4C1D95" />
          <rect x="106" y="225" width="44" height="80" rx="14" fill="#4C1D95" />
          {/* Crease */}
          <rect x="70" y="225" width="4" height="80" rx="2" fill="#3B0764" />
          <rect x="126" y="225" width="4" height="80" rx="2" fill="#3B0764" />
        </>
      )}
      {variant === 4 && (
        /* Yellow sport set */
        <>
          {/* Jersey */}
          <rect x="38" y="138" width="124" height="86" rx="8" fill={c} />
          {/* Sleeveless sides */}
          <rect x="40" y="140" width="20" height="40" rx="8" fill="#D97706" />
          <rect x="140" y="140" width="20" height="40" rx="8" fill="#D97706" />
          {/* Jersey number placeholder */}
          <text x="100" y="190" textAnchor="middle" fill="#D97706" fontSize="32" fontWeight="bold" fontFamily="sans-serif">K</text>
          {/* Neckline */}
          <ellipse cx="100" cy="142" rx="20" ry="8" fill="#D97706" />
          {/* Sport shorts */}
          <rect x="46" y="222" width="50" height="68" rx="14" fill="#D97706" />
          <rect x="104" y="222" width="50" height="68" rx="14" fill="#D97706" />
          {/* Shorts stripe */}
          <rect x="92" y="222" width="16" height="68" fill="#B45309" />
          {/* Side stripe on shorts */}
          <rect x="46" y="222" width="8" height="68" rx="4" fill="#FBBF24" />
          <rect x="146" y="222" width="8" height="68" rx="4" fill="#FBBF24" />
        </>
      )}
    </svg>
  )
}

function ShoesSvg({ variant }: { variant: number }) {
  const c = SHOE_COLORS[variant] ?? SHOE_COLORS[0]
  return (
    <svg viewBox="0 0 200 340" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {variant === 0 && (
        /* White sneakers */
        <>
          {/* Left sneaker sole */}
          <ellipse cx="70" cy="315" rx="36" ry="12" fill="#9CA3AF" />
          {/* Left sneaker upper */}
          <rect x="34" y="295" width="72" height="22" rx="10" fill={c} />
          <ellipse cx="70" cy="295" rx="36" ry="10" fill={c} />
          {/* Left laces */}
          <line x1="46" y1="302" x2="94" y2="299" stroke="#6B7280" strokeWidth="1.5" />
          <line x1="50" y1="307" x2="90" y2="304" stroke="#6B7280" strokeWidth="1.5" />
          {/* Left toe cap */}
          <ellipse cx="102" cy="304" rx="10" ry="8" fill="#E5E7EB" />

          {/* Right sneaker sole */}
          <ellipse cx="130" cy="315" rx="36" ry="12" fill="#9CA3AF" />
          {/* Right sneaker upper */}
          <rect x="94" y="295" width="72" height="22" rx="10" fill={c} />
          <ellipse cx="130" cy="295" rx="36" ry="10" fill={c} />
          {/* Right laces */}
          <line x1="106" y1="302" x2="154" y2="299" stroke="#6B7280" strokeWidth="1.5" />
          <line x1="110" y1="307" x2="150" y2="304" stroke="#6B7280" strokeWidth="1.5" />
          {/* Right toe cap */}
          <ellipse cx="160" cy="304" rx="10" ry="8" fill="#E5E7EB" />
        </>
      )}
      {variant === 1 && (
        /* Black boots */
        <>
          {/* Left boot shaft */}
          <rect x="36" y="242" width="46" height="68" rx="8" fill={c} />
          {/* Left boot toe */}
          <ellipse cx="64" cy="316" rx="36" ry="12" fill="#111827" />
          <rect x="30" y="304" width="68" height="14" rx="6" fill={c} />
          {/* Left boot details */}
          <rect x="40" y="270" width="38" height="4" rx="2" fill="#374151" />

          {/* Right boot shaft */}
          <rect x="118" y="242" width="46" height="68" rx="8" fill={c} />
          {/* Right boot toe */}
          <ellipse cx="136" cy="316" rx="36" ry="12" fill="#111827" />
          <rect x="102" y="304" width="68" height="14" rx="6" fill={c} />
          {/* Right boot details */}
          <rect x="122" y="270" width="38" height="4" rx="2" fill="#374151" />
        </>
      )}
      {variant === 2 && (
        /* Brown loafers */
        <>
          {/* Left loafer */}
          <ellipse cx="70" cy="316" rx="36" ry="12" fill="#78350F" />
          <rect x="34" y="298" width="62" height="20" rx="8" fill={c} />
          <ellipse cx="66" cy="298" rx="32" ry="10" fill={c} />
          {/* Left loafer bow */}
          <circle cx="64" cy="296" r="5" fill="#92400E" />
          <ellipse cx="56" cy="294" rx="8" ry="4" fill="#92400E" />
          <ellipse cx="72" cy="294" rx="8" ry="4" fill="#92400E" />

          {/* Right loafer */}
          <ellipse cx="130" cy="316" rx="36" ry="12" fill="#78350F" />
          <rect x="104" y="298" width="62" height="20" rx="8" fill={c} />
          <ellipse cx="134" cy="298" rx="32" ry="10" fill={c} />
          {/* Right loafer bow */}
          <circle cx="132" cy="296" r="5" fill="#92400E" />
          <ellipse cx="124" cy="294" rx="8" ry="4" fill="#92400E" />
          <ellipse cx="140" cy="294" rx="8" ry="4" fill="#92400E" />
        </>
      )}
      {variant === 3 && (
        /* Pink canvas */
        <>
          {/* Left canvas sole */}
          <ellipse cx="70" cy="316" rx="36" ry="12" fill="#F472B6" />
          {/* Left canvas upper */}
          <rect x="34" y="293" width="72" height="24" rx="10" fill={c} />
          <ellipse cx="70" cy="293" rx="36" ry="10" fill={c} />
          {/* Left star detail */}
          <text x="68" y="302" textAnchor="middle" fill="#EC4899" fontSize="12">★</text>
          {/* Left laces */}
          <line x1="50" y1="300" x2="90" y2="297" stroke="#F9A8D4" strokeWidth="1.5" />

          {/* Right canvas sole */}
          <ellipse cx="130" cy="316" rx="36" ry="12" fill="#F472B6" />
          {/* Right canvas upper */}
          <rect x="94" y="293" width="72" height="24" rx="10" fill={c} />
          <ellipse cx="130" cy="293" rx="36" ry="10" fill={c} />
          {/* Right star detail */}
          <text x="128" y="302" textAnchor="middle" fill="#EC4899" fontSize="12">★</text>
          {/* Right laces */}
          <line x1="110" y1="300" x2="150" y2="297" stroke="#F9A8D4" strokeWidth="1.5" />
        </>
      )}
    </svg>
  )
}

// ── Layered Character Display ─────────────────────────────────────────────────
// Stacks 4 SVG layers using position:absolute + z-index
// Replace SVG components with <img> when real PNG assets are ready:
//   <img src={`/character/body/${config.body}.png`} width="100%" height="100%" style={{objectFit:'contain'}}/>

export function LayeredCharacterDisplay({
  config,
  width = 200,
}: {
  config: LayerConfig
  width?: number
}) {
  const height = Math.round(width * (340 / 200))
  return (
    <div style={{ position: 'relative', width, height, flexShrink: 0 }}>
      {/* Layer 1 — Body/Skin (lowest) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <BodySvg variant={config.body} />
      </div>
      {/* Layer 2 — Outfit (covers torso) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2 }}>
        <OutfitSvg variant={config.outfit} />
      </div>
      {/* Layer 3 — Shoes (covers feet) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3 }}>
        <ShoesSvg variant={config.shoes} />
      </div>
      {/* Layer 4 — Head/Hair (highest) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
        <HeadSvg variant={config.head} />
      </div>
    </div>
  )
}

// ── Layer Thumbnail ───────────────────────────────────────────────────────────
// Cropped miniature preview for the item picker grid.

export function LayerThumbnail({
  category,
  variant,
  size = 64,
}: {
  category: LayerCategoryKey
  variant: number
  size?: number
}) {
  const { thumbViewBox } = LAYER_CATEGORIES[category]

  return (
    <div style={{ width: size, height: size, position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
      <svg
        viewBox={thumbViewBox}
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0 }}
      >
        {/* For body/head thumbnails, show body + head layer together */}
        {(category === 'body' || category === 'head') && (
          <>
            <BodySvg variant={category === 'body' ? variant : 0} />
            <HeadSvg variant={category === 'head' ? variant : 0} />
          </>
        )}
        {category === 'outfit' && (
          <>
            <BodySvg variant={0} />
            <OutfitSvg variant={variant} />
          </>
        )}
        {category === 'shoes' && (
          <>
            <BodySvg variant={0} />
            <ShoesSvg variant={variant} />
          </>
        )}
      </svg>
    </div>
  )
}
