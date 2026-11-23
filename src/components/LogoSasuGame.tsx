/* Le logo SasuGame (la salamandre en « S ») : il se dessine trait par trait à l'arrivée,
   la flamme vacille et l'œil suit le curseur. */
import { motion, useSpring, type Transition } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { calme, cn } from '@/lib/utils'

const trace = (delay: number, duration: number) => ({
  initial: { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { pathLength: { delay, duration, ease: [0.65, 0, 0.35, 1] }, opacity: { delay, duration: 0.01 } } satisfies Transition,
})
const surgit = (delay: number) => ({
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { delay, type: 'spring', bounce: 0.5, duration: 0.7 } satisfies Transition,
})

export function LogoSasuGame({ className }: { className?: string }) {
  const svg = useRef<SVGSVGElement>(null)
  const [fixe] = useState(calme)
  // la pupille, en unités du dessin autour du centre de l'œil (372, 128)
  const x = useSpring(5, { stiffness: 260, damping: 26 })
  const y = useSpring(-2, { stiffness: 260, damping: 26 })

  useEffect(() => {
    if (fixe) return
    const regarder = (e: PointerEvent) => {
      const b = svg.current!.getBoundingClientRect()
      const dx = e.clientX - (b.left + b.width * 0.727)
      const dy = e.clientY - (b.top + b.height * 0.25)
      const d = Math.hypot(dx, dy) || 1
      const r = Math.min(7, d / 20)
      x.set((dx / d) * r)
      y.set((dy / d) * r)
    }
    addEventListener('pointermove', regarder, { passive: true })
    return () => removeEventListener('pointermove', regarder)
  }, [fixe, x, y])

  const anime = (p: ReturnType<typeof trace> | ReturnType<typeof surgit>) => (fixe ? {} : p)

  return (
    <svg ref={svg} viewBox="0 0 512 512" role="img" aria-label="Logo SasuGame : une salamandre orange en forme de S" className={cn('overflow-visible', className)}>
      <defs>
        <linearGradient id="sg-fond" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1408" />
          <stop offset="1" stopColor="#0d0604" />
        </linearGradient>
        <radialGradient id="sg-halo" cx=".5" cy=".55" r=".55">
          <stop offset="0" stopColor="#ff7a1a" stopOpacity=".35" />
          <stop offset="1" stopColor="#ff7a1a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sg-corps" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffb347" />
          <stop offset=".5" stopColor="#ff7a1a" />
          <stop offset="1" stopColor="#e8500c" />
        </linearGradient>
        <linearGradient id="sg-flamme" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ff5a0a" />
          <stop offset=".55" stopColor="#ffb000" />
          <stop offset="1" stopColor="#fff1a8" />
        </linearGradient>
        <filter id="sg-lueur" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <motion.g {...anime(surgit(0))}>
        <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#sg-fond)" />
        <rect x="16" y="16" width="480" height="480" rx="112" fill="url(#sg-halo)" />
        <rect x="19" y="19" width="474" height="474" rx="109" fill="none" stroke="#ff9a3c" strokeOpacity=".45" strokeWidth="6" />
      </motion.g>

      <g filter="url(#sg-lueur)" transform="translate(-16 -10)">
        <motion.g style={{ originY: 1 }} {...anime(surgit(1.7))}>
          <motion.g style={{ originY: 1 }} animate={fixe ? undefined : { scaleY: [1, 1.09, 0.96, 1.05, 1], skewX: [0, 3, -2, 2, 0] }} transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}>
            <path d="M118 342 C92 318 88 286 104 256 C106 276 116 284 122 286 C118 262 128 236 152 220 C146 246 160 264 168 284 C176 306 160 336 134 346 Z" fill="url(#sg-flamme)" />
            <path d="M132 336 C118 324 118 306 126 292 C130 304 138 308 142 306 C142 296 146 288 152 282 C156 298 160 316 150 330 Z" fill="#fff6cf" />
          </motion.g>
        </motion.g>
      </g>

      <g filter="url(#sg-lueur)">
        <motion.path d="M246 124 L232 80 M352 324 L404 304" stroke="#e8500c" strokeWidth="26" strokeLinecap="round" {...anime(trace(1.2, 0.35))} />
        <motion.path d="M216 398 C168 408 128 392 112 334 C136 360 170 368 208 358 Z" fill="#ff7a1a" {...anime(surgit(1.3))} />
        <motion.path d="M338 150 C300 112 168 108 162 186 C156 262 352 238 350 326 C348 402 248 410 206 378" fill="none" stroke="url(#sg-corps)" strokeWidth="66" strokeLinecap="round" {...anime(trace(0.35, 1))} />
        <motion.path d="M318 146 C282 128 196 130 192 186 C188 236 380 236 376 322 C374 360 330 384 280 386" fill="none" stroke="#ffe9c2" strokeOpacity=".85" strokeWidth="12" strokeLinecap="round" {...anime(trace(1.1, 0.7))} />
      </g>

      <motion.g {...anime(surgit(1.25))}>
        <ellipse cx="362" cy="148" rx="62" ry="46" transform="rotate(-18 362 148)" fill="url(#sg-corps)" filter="url(#sg-lueur)" />
        <circle cx="372" cy="128" r="17" fill="#fff6e0" />
        <motion.g style={{ x, y }}>
          <circle cx="372" cy="128" r="9" fill="#1a0a04" />
          <circle cx="375" cy="124" r="3" fill="#fff" />
        </motion.g>
        <circle cx="412" cy="128" r="4" fill="#7a2a06" />
        <path d="M352 170 Q384 176 410 152" fill="none" stroke="#7a2a06" strokeWidth="6" strokeLinecap="round" />
      </motion.g>
    </svg>
  )
}
