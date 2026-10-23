import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
// Tiny SVG paths for sewing equipment (drawn in a ~12x12 viewBox)
const SEWING_ICONS = [
  // Needle
  (key: number) => (
    <svg
      key={key}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <line
        x1="2"
        y1="10"
        x2="10"
        y2="2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="10" cy="2" r="1.2" fill="currentColor" />
      <line
        x1="9.2"
        y1="2.8"
        x2="8.4"
        y2="3.6"
        stroke="currentColor"
        strokeWidth="0.8"
      />
    </svg>
  ),
  // Scissors
  (key: number) => (
    <svg
      key={key}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="3" cy="3.5" r="1.5" stroke="currentColor" strokeWidth="0.9" />
      <circle cx="3" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="0.9" />
      <line
        x1="4.2"
        y1="4.5"
        x2="10"
        y2="10"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
      <line
        x1="4.2"
        y1="7.5"
        x2="10"
        y2="2"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  ),
  // Spool of thread
  (key: number) => (
    <svg
      key={key}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse
        cx="6"
        cy="3"
        rx="4"
        ry="1.5"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <ellipse
        cx="6"
        cy="9"
        rx="4"
        ry="1.5"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <line
        x1="2"
        y1="3"
        x2="2"
        y2="9"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <line
        x1="10"
        y1="3"
        x2="10"
        y2="9"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <line
        x1="4"
        y1="3.8"
        x2="4"
        y2="8.2"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="1 1"
      />
    </svg>
  ),
  // Pin
  (key: number) => (
    <svg
      key={key}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="6"
        cy="3"
        r="2"
        stroke="currentColor"
        strokeWidth="0.9"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <line
        x1="6"
        y1="5"
        x2="6"
        y2="11"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
      />
    </svg>
  ),
  // Thimble
  (key: number) => (
    <svg
      key={key}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 9 Q3 4 6 2 Q9 4 9 9 Z"
        stroke="currentColor"
        strokeWidth="0.9"
        fill="currentColor"
        fillOpacity="0.2"
      />
      <line
        x1="3"
        y1="9"
        x2="9"
        y2="9"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <circle cx="5" cy="5.5" r="0.5" fill="currentColor" />
      <circle cx="7" cy="5.5" r="0.5" fill="currentColor" />
      <circle cx="6" cy="7" r="0.5" fill="currentColor" />
    </svg>
  ),
]
export function SewingBackground() {
  const particles = useMemo(() => {
    return Array.from({
      length: 25,
    }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 15 + 15,
      delay: Math.random() * 5,
    }))
  }, [])
  const sewingDots = useMemo(() => {
    return Array.from({
      length: 45,
    }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 98}%`,
      top: `${Math.random() * 98}%`,
      rotate: Math.floor(Math.random() * 360),
      iconIndex: i % SEWING_ICONS.length,
      size: Math.floor(Math.random() * 4) + 7,
      delay: Math.random() * 8,
      opacity: Math.random() * 0.12 + 0.08, // 0.08–0.20
    }))
  }, [])
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-black pointer-events-none select-none">
      {/* 1. Base Warm Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-black/0 to-black/0 z-0" />

      {/* 2. Silhouette Layer with Sewing Animation */}
      <div className="absolute inset-0 flex items-end justify-center z-10 pb-10 md:pb-0 md:items-center">
        <motion.img
          src="/images/generated/studio.png"
          alt="Sewing Silhouette"
          className="w-[120%] max-w-[800px] object-contain opacity-20 will-change-transform"
          style={{
            filter: 'invert(1)',
            mixBlendMode: 'screen',
          }}
          animate={{
            y: [0, -3, 0],
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      {/* 3. Thread Animations (SVG Paths) */}
      <div className="absolute inset-0 z-20 opacity-40">
        <svg
          className="w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <motion.path
            d="M -10 80 Q 30 60 50 80 T 110 40"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="0.15"
            initial={{
              pathLength: 0,
              opacity: 0,
            }}
            animate={{
              pathLength: 1,
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0,
            }}
          />
          <motion.path
            d="M 0 110 C 30 90 40 40 70 50 S 90 10 110 20"
            fill="none"
            stroke="#fcd34d"
            strokeWidth="0.1"
            initial={{
              pathLength: 0,
              opacity: 0,
            }}
            animate={{
              pathLength: 1,
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 2,
            }}
          />
          <motion.path
            d="M 20 -10 Q 40 50 80 110"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.08"
            initial={{
              pathLength: 0,
              opacity: 0,
            }}
            animate={{
              pathLength: 1,
              opacity: [0, 0.4, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
              delay: 4,
            }}
          />
          <motion.path
            d="M 110 80 Q 60 90 40 30 T -10 10"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="0.12"
            initial={{
              pathLength: 0,
              opacity: 0,
            }}
            animate={{
              pathLength: 1,
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 1,
            }}
          />
        </svg>
      </div>

      {/* 4. Floating Particles (Fabric Dust) */}
      <div className="absolute inset-0 z-30">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full bg-amber-100/30"
            style={{
              left: particle.left,
              top: particle.top,
              width: particle.size,
              height: particle.size,
            }}
            animate={{
              y: [0, -100],
              x: [0, Math.random() * 50 - 25],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              ease: 'linear',
              delay: particle.delay,
            }}
          />
        ))}
      </div>

      {/* 5. Frosted Overlay */}
      <div className="absolute inset-0 z-40 bg-black/55 backdrop-blur-md" />

      {/* 6. Tiny Sewing Equipment Icons */}
      <div className="absolute inset-0 z-50">
        {sewingDots.map((dot) => {
          const IconFn = SEWING_ICONS[dot.iconIndex]
          return (
            <motion.div
              key={dot.id}
              className="absolute text-amber-200"
              style={{
                left: dot.left,
                top: dot.top,
                width: dot.size,
                height: dot.size,
                rotate: dot.rotate,
                opacity: dot.opacity,
              }}
              animate={{
                opacity: [dot.opacity, dot.opacity * 1.8, dot.opacity],
              }}
              transition={{
                duration: 4 + dot.delay,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: dot.delay,
              }}
            >
              {IconFn(dot.id)}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
