// resources/js/components/TailoringBackground.tsx


// Paste all your SVG components here (SewingMachine, NeedleWithThread, ThreadSpool, etc.)
function SewingMachine({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="45" width="70" height="10" rx="2" fill={color} />
      <path d="M15 45 L15 25 Q15 20 20 20 L55 20 Q60 20 60 25 L60 45" fill={color} />
      <path d="M20 20 L20 12 Q20 8 25 8 L50 8 Q55 8 55 12 L55 20" fill={color} />
      <rect x="50" y="30" width="8" height="15" fill={color} />
      <line x1="54" y1="45" x2="54" y2="55" stroke={color} strokeWidth="1.5" />
      <circle cx="65" cy="35" r="8" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="65" cy="35" r="2" fill={color} />
      <ellipse cx="35" cy="6" rx="6" ry="3" fill={color} />
    </svg>
  )
}

function NeedleWithThread({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 20 L45 20" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M45 20 L50 20" stroke={color} strokeWidth="1" strokeLinecap="round" />
      <ellipse cx="10" cy="20" rx="2" ry="1.5" stroke={color} strokeWidth="1" fill="none" />
      <path d="M8 20 Q0 15 5 10 Q12 5 8 0" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M8 20 Q15 25 10 32 Q5 38 12 40" stroke={color} strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function ThreadSpool({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="8" rx="12" ry="5" fill={color} />
      <rect x="10" y="8" width="20" height="32" fill={color} />
      <line x1="10" y1="15" x2="30" y2="15" stroke="black" strokeWidth="0.5" opacity="0.3" />
      <line x1="10" y1="22" x2="30" y2="22" stroke="black" strokeWidth="0.5" opacity="0.3" />
      <line x1="10" y1="29" x2="30" y2="29" stroke="black" strokeWidth="0.5" opacity="0.3" />
      <line x1="10" y1="36" x2="30" y2="36" stroke="black" strokeWidth="0.5" opacity="0.3" />
      <ellipse cx="20" cy="40" rx="12" ry="5" fill={color} />
      <ellipse cx="20" cy="8" rx="4" ry="2" fill="black" opacity="0.4" />
    </svg>
  )
}

function Scissors({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 60 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="12" rx="8" ry="10" stroke={color} strokeWidth="2.5" fill="none" />
      <ellipse cx="12" cy="40" rx="8" ry="8" stroke={color} strokeWidth="2.5" fill="none" />
      <path d="M18 15 L55 22" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <path d="M18 35 L55 28" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <circle cx="22" cy="25" r="3" fill={color} />
    </svg>
  )
}

function SewButton({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="18" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="20" cy="20" r="14" stroke={color} strokeWidth="1" fill="none" />
      <circle cx="14" cy="14" r="2.5" fill={color} />
      <circle cx="26" cy="14" r="2.5" fill={color} />
      <circle cx="14" cy="26" r="2.5" fill={color} />
      <circle cx="26" cy="26" r="2.5" fill={color} />
    </svg>
  )
}

function StraightPin({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 15 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="6" r="5" fill={color} />
      <line x1="7.5" y1="11" x2="7.5" y2="58" stroke={color} strokeWidth="1.5" />
      <path d="M7.5 58 L6 55 L9 55 Z" fill={color} />
    </svg>
  )
}

function Thimble({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 35 45" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 40 Q5 15 17.5 10 Q30 15 30 40 Z" fill={color} />
      <ellipse cx="17.5" cy="12" rx="10" ry="5" fill={color} />
      <circle cx="10" cy="25" r="1.5" fill="black" opacity="0.3" />
      <circle cx="17" cy="23" r="1.5" fill="black" opacity="0.3" />
      <circle cx="24" cy="25" r="1.5" fill="black" opacity="0.3" />
      <circle cx="12" cy="32" r="1.5" fill="black" opacity="0.3" />
      <circle cx="20" cy="30" r="1.5" fill="black" opacity="0.3" />
      <circle cx="26" cy="33" r="1.5" fill="black" opacity="0.3" />
      <circle cx="15" cy="38" r="1.5" fill="black" opacity="0.3" />
      <circle cx="22" cy="37" r="1.5" fill="black" opacity="0.3" />
      <ellipse cx="17.5" cy="40" rx="12" ry="3" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  )
}

function MeasuringTape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 70 30" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="8" width="60" height="14" rx="1" fill={color} />
      <line x1="12" y1="8" x2="12" y2="14" stroke="black" strokeWidth="0.5" opacity="0.4" />
      <line x1="20" y1="8" x2="20" y2="16" stroke="black" strokeWidth="0.8" opacity="0.4" />
      <line x1="28" y1="8" x2="28" y2="14" stroke="black" strokeWidth="0.5" opacity="0.4" />
      <line x1="36" y1="8" x2="36" y2="16" stroke="black" strokeWidth="0.8" opacity="0.4" />
      <line x1="44" y1="8" x2="44" y2="14" stroke="black" strokeWidth="0.5" opacity="0.4" />
      <line x1="52" y1="8" x2="52" y2="16" stroke="black" strokeWidth="0.8" opacity="0.4" />
      <line x1="60" y1="8" x2="60" y2="14" stroke="black" strokeWidth="0.5" opacity="0.4" />
      <rect x="2" y="6" width="5" height="18" rx="1" fill={color} />
    </svg>
  )
}

type ItemType = 'sewingMachine' | 'needle' | 'spool' | 'scissors' | 'button' | 'pin' | 'thimble' | 'tape'

interface FloatingItem {
  id: number
  type: ItemType
  x: number
  y: number
  scale: number
  opacity: number
  rotation: number
  animationDuration: number
  animationDelay: number
  driftX: number
  color: string
}

function generateItems(count: number): FloatingItem[] {
  const types: ItemType[] = ['sewingMachine', 'needle', 'spool', 'scissors', 'button', 'pin', 'thimble', 'tape']
  const greyColors = ['#555', '#666', '#777', '#888', '#999']
  const items: FloatingItem[] = []
  for (let i = 0; i < count; i++) {
    const depthRoll = Math.random()
    let scale: number, opacity: number
    if (depthRoll < 0.33) {
      scale = 0.5 + Math.random() * 0.2
      opacity = 0.15 + Math.random() * 0.05
    } else if (depthRoll < 0.66) {
      scale = 0.8 + Math.random() * 0.2
      opacity = 0.25 + Math.random() * 0.1
    } else {
      scale = 1.2 + Math.random() * 0.3
      opacity = 0.4 + Math.random() * 0.1
    }
    items.push({
      id: i,
      type: types[Math.floor(Math.random() * types.length)],
      x: Math.random() * 90 + 5,
      y: Math.random() * 85 + 5,
      scale,
      opacity,
      rotation: Math.random() * 360,
      animationDuration: 6 + Math.random() * 8,
      animationDelay: Math.random() * -10,
      driftX: 10 + Math.random() * 15,
      color: greyColors[Math.floor(Math.random() * greyColors.length)],
    })
  }
  return items
}

function renderItem(type: ItemType, color: string) {
  switch (type) {
    case 'sewingMachine': return <SewingMachine color={color} />
    case 'needle': return <NeedleWithThread color={color} />
    case 'spool': return <ThreadSpool color={color} />
    case 'scissors': return <Scissors color={color} />
    case 'button': return <SewButton color={color} />
    case 'pin': return <StraightPin color={color} />
    case 'thimble': return <Thimble color={color} />
    case 'tape': return <MeasuringTape color={color} />
    default: return null
  }
}

const floatingItems = generateItems(28)

export function TailoringBackground() {
  return (
    <>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-5px) translateX(-5px); }
          75% { transform: translateY(-25px) translateX(5px); }
        }
        @keyframes floatAlt {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-15px) translateX(-10px); }
          66% { transform: translateY(-30px) translateX(8px); }
        }
        @keyframes slowRotate { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes slowRotateReverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
        @keyframes drift {
          0%, 100% { transform: translateX(0px) translateY(0px); }
          50% { transform: translateX(var(--drift-x, 15px)) translateY(-20px); }
        }
        @keyframes gentleBob { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-18px); } }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }} aria-hidden="true">
        {floatingItems.map((item) => {
          const animations = ['float', 'floatAlt', 'drift', 'gentleBob']
          const rotations = ['slowRotate', 'slowRotateReverse', 'none', 'none']
          const selectedAnimation = animations[item.id % animations.length]
          const selectedRotation = rotations[item.id % rotations.length]
          const rotationDuration = 20 + (item.id % 5) * 8
          return (
            <div key={item.id} style={{ position: 'absolute', left: `${item.x}%`, top: `${item.y}%`, opacity: item.opacity, transform: `rotate(${item.rotation}deg)`, ['--drift-x' as any]: `${item.driftX}px` }}>
              <div style={{ animation: `${selectedAnimation} ${item.animationDuration}s ease-in-out infinite`, animationDelay: `${item.animationDelay}s` }}>
                <div style={{ width: `${50 * item.scale}px`, height: `${50 * item.scale}px`, animation: selectedRotation !== 'none' ? `${selectedRotation} ${rotationDuration}s linear infinite` : 'none', animationDelay: `${item.animationDelay * 0.5}s` }}>
                  {renderItem(item.type, item.color)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}