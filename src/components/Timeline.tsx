/* Navigation façon timeline de montage : chaque section est un plan,
   la tête de lecture rouge suit le défilement. */
import { animate, motion, useScroll, useSpring, useTransform } from 'motion/react'
import { useEffect, useState, type MouseEvent } from 'react'
import { calme, cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'profil', label: 'Profil' },
  { id: 'voix', label: 'Voix' },
  { id: 'videos', label: 'Vidéos' },
  { id: 'castings', label: 'Castings' },
  { id: 'contact', label: 'Contact' },
]

let anim: ReturnType<typeof animate> | undefined
;['wheel', 'touchstart'].forEach(ev => addEventListener(ev, () => anim?.stop(), { passive: true }))

/** Défilement fluide (motion) vers une section, interrompu dès que le visiteur reprend la main. */
export const allerA = (id: string) => (e?: MouseEvent) => {
  e?.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  const cible = el.getBoundingClientRect().top + scrollY
  anim?.stop()
  if (calme()) scrollTo(0, cible)
  else anim = animate(scrollY, cible, { duration: Math.min(1.6, 0.6 + Math.abs(cible - scrollY) / 5000), ease: [0.65, 0, 0.35, 1], onUpdate: v => scrollTo(0, v) })
  history.replaceState(null, '', id === 'profil' ? location.pathname : '#' + id)
  el.focus({ preventScroll: true })
}

export function Timeline() {
  const { scrollYProgress } = useScroll()
  const tete = useSpring(scrollYProgress, { stiffness: 260, damping: 40 })
  const pct = useTransform(tete, v => v * 100 + '%')
  const [tops, setTops] = useState<number[]>([])
  const [actif, setActif] = useState('profil')

  // position de chaque section dans la page
  useEffect(() => {
    const mesurer = () => setTops(SECTIONS.map(s => document.getElementById(s.id)?.offsetTop ?? 0))
    mesurer()
    const ro = new ResizeObserver(mesurer)
    ro.observe(document.body)
    return () => ro.disconnect()
  }, [])
  const max = Math.max(1, (typeof document !== 'undefined' ? document.documentElement.scrollHeight : 1) - innerHeight)
  const reperes = tops.map(t => Math.min(1, t / max))

  // la section active est celle qui occupe le milieu de l'écran
  useEffect(() => {
    const maj = () => {
      let i = 0
      tops.forEach((t, j) => scrollY + innerHeight / 2 >= t && (i = j))
      setActif(SECTIONS[i].id)
    }
    maj()
    addEventListener('scroll', maj, { passive: true })
    return () => removeEventListener('scroll', maj)
  }, [tops])

  return (
    <nav aria-label="Navigation principale" className="fixed z-40 max-lg:inset-x-4 max-lg:bottom-[max(14px,env(safe-area-inset-bottom))] lg:top-1/2 lg:right-7 lg:h-[56vh] lg:-translate-y-1/2">
      <motion.div style={{ ['--p' as string]: pct }} className="relative isolate size-full max-lg:h-12 max-lg:rounded-full max-lg:border max-lg:border-white/10 max-lg:bg-nuit/80 max-lg:backdrop-blur-md">
        <span className="absolute -inset-x-4 -inset-y-6 -z-10 rounded-2xl bg-nuit/75 backdrop-blur-md max-lg:hidden" aria-hidden="true" />
        {/* la piste, remplie jusqu'à la tête de lecture */}
        <div className="absolute bg-white/12 max-lg:inset-x-5 max-lg:top-1/2 max-lg:h-px lg:inset-y-0 lg:right-0 lg:w-px" aria-hidden="true">
          <div className="absolute bg-or max-lg:inset-y-0 max-lg:left-0 max-lg:w-(--p) lg:inset-x-0 lg:top-0 lg:h-(--p)" />
          <span className="absolute size-2.5 -translate-1/2 rounded-full bg-rec shadow-[0_0_12px_#f23f43] max-lg:top-1/2 max-lg:left-(--p) lg:top-(--p) lg:left-1/2" />
        </div>
        <ul className="contents">
          {SECTIONS.map((s, i) => (
            <li
              key={s.id}
              style={{ ['--r' as string]: reperes[i] ?? 0 }}
              className="absolute max-lg:top-1/2 max-lg:left-[calc(1.25rem+var(--r)*(100%-2.5rem))] max-lg:-translate-1/2 lg:top-[calc(var(--r)*100%)] lg:right-0 lg:-translate-y-1/2"
            >
              <a
                href={'#' + s.id}
                onClick={allerA(s.id)}
                aria-current={actif === s.id ? 'location' : undefined}
                className={cn('group flex items-center gap-3 text-[0.8rem] font-semibold no-underline transition-colors max-lg:size-8 max-lg:justify-center lg:flex-row-reverse', actif === s.id ? 'text-creme' : 'text-doux hover:text-creme')}
              >
                <span aria-hidden="true" className={cn('transition-all max-lg:size-2 max-lg:rounded-full lg:h-px', actif === s.id ? 'bg-or lg:w-6' : 'bg-white/35 lg:w-3 lg:group-hover:w-5')} />
                <span className="max-lg:sr-only">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </motion.div>
    </nav>
  )
}
