/* Acte 3 — les doublages vidéo sur une pellicule.
   Le défilement vertical fait avancer la pellicule à l'horizontale ;
   le plan au centre de l'écran est net, les autres s'assombrissent. */
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { credit, jour, videos, type Clip } from '@/lib/projets'
import { cn, temps } from '@/lib/utils'
import { IconeLecture } from '@/components/Icones'
import { Lecteur } from '@/components/Lecteur'

export function Videos() {
  const zone = useRef<HTMLElement>(null)
  const piste = useRef<HTMLUListElement>(null)
  const [course, setCourse] = useState(0)
  const [clip, setClip] = useState<Clip | null>(null)
  const { scrollYProgress } = useScroll({ target: zone, offset: ['start start', 'end end'] })
  const lisse = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.0005 })
  const x = useTransform(lisse, v => -v * course)
  const avance = useTransform(lisse, v => v * 100 + '%')

  useLayoutEffect(() => {
    const mesurer = () => setCourse(Math.max(0, piste.current!.scrollWidth - innerWidth))
    mesurer()
    const ro = new ResizeObserver(mesurer)
    ro.observe(piste.current!)
    return () => ro.disconnect()
  }, [])

  // au clavier : amène le plan qui reçoit le focus au centre
  const centrer = (li: HTMLElement) => {
    li.closest('.overflow-hidden')!.scrollLeft = 0
    if (!course) return
    const v = Math.max(0, Math.min(1, (li.offsetLeft + li.offsetWidth / 2 - innerWidth / 2) / course))
    scrollTo({ top: zone.current!.offsetTop + v * course, behavior: 'instant' })
  }

  if (!videos.length) return null
  return (
    <section id="videos" ref={zone} tabIndex={-1} aria-labelledby="titre-videos" style={{ height: `calc(100svh + ${course}px)` }} className="relative outline-none">
      <div className="sticky top-0 flex h-svh flex-col justify-center overflow-hidden py-20">
        <div className="mb-[clamp(20px,4vh,44px)] flex items-end justify-between gap-6 px-(--gouttiere) lg:pr-36">
          <h2 id="titre-videos" className="titre">Doublages vidéo</h2>
          <p className="pb-2 whitespace-nowrap text-doux">{videos.length} extraits</p>
        </div>

        <motion.ul ref={piste} style={{ x }} className="pellicule relative flex w-max gap-[clamp(14px,2vw,28px)] px-(--gouttiere) py-8">
          {videos.map(p => (
            <Plan key={p.id} p={p} x={x} ouvert={clip?.id === p.id} ouvrir={() => setClip(p)} centrer={centrer} />
          ))}
        </motion.ul>

        <div className="mx-(--gouttiere) mt-6 h-px bg-white/10 lg:mr-36" aria-hidden="true">
          <motion.div className="h-full bg-or" style={{ width: avance }} />
        </div>
      </div>
      <Lecteur clip={clip} fermer={() => setClip(null)} />
    </section>
  )
}

function Plan({ p, x, ouvert, ouvrir, centrer }: { p: Clip; x: MotionValue<number>; ouvert: boolean; ouvrir: () => void; centrer: (li: HTMLElement) => void }) {
  const li = useRef<HTMLLIElement>(null)
  const apercu = useRef<HTMLVideoElement>(null)
  const [milieu, setMilieu] = useState(0)
  const [duree, setDuree] = useState<number>()
  const basse = Object.values(p.qualites || {}).at(-1) || p.fichier

  useLayoutEffect(() => {
    const m = () => setMilieu(li.current!.offsetLeft + li.current!.offsetWidth / 2)
    m()
    addEventListener('resize', m)
    return () => removeEventListener('resize', m)
  }, [])

  // distance au centre de l'écran : 0 au centre, 1 à un écran de distance
  const d = useTransform(x, v => Math.min(1, Math.abs(v + milieu - innerWidth / 2) / innerWidth))
  const scale = useTransform(d, [0, 1], [1, 0.84])
  const filter = useTransform(d, v => `saturate(${1 - v * 0.7}) brightness(${1 - v * 0.45})`)
  const legende = useTransform(d, [0, 0.5], [1, 0.35])

  // durée : lecture des métadonnées uniquement
  useEffect(() => {
    const v = Object.assign(document.createElement('video'), { preload: 'metadata', muted: true, src: p.fichier })
    v.addEventListener('loadedmetadata', () => setDuree(v.duration), { once: true })
    return () => v.removeAttribute('src')
  }, [p.fichier])

  const survol = (oui: boolean) => {
    const v = apercu.current
    if (!v || matchMedia('(hover: none)').matches) return
    if (oui) {
      if (!v.src) v.src = basse
      v.play().catch(() => {})
    } else v.pause()
  }

  return (
    <motion.li ref={li} style={{ scale }} className="group w-[min(74vw,620px)] shrink-0" onFocus={() => centrer(li.current!)}>
      <button type="button" onClick={ouvrir} onPointerEnter={() => survol(true)} onPointerLeave={() => survol(false)} aria-label={`Regarder ${p.titre}`} className="block w-full rounded-[10px] text-left">
        <motion.div layoutId={`clip-${p.id}`} style={{ borderRadius: 10, filter }} className={cn('relative aspect-video overflow-hidden bg-cuir', ouvert && 'invisible')} data-media>
          {p.miniature && <img src={p.miniature} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />}
          <video ref={apercu} data-apercu muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} poster={p.miniature} className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid size-16 scale-90 place-items-center rounded-full bg-creme/95 text-encre opacity-0 shadow-xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
              <IconeLecture lecture={false} className="ml-1 size-7" />
            </span>
          </span>
          {duree !== undefined && <span className="absolute right-3 bottom-3 rounded bg-black/70 px-1.5 py-0.5 text-[0.8rem] tabular-nums">{temps(duree)}</span>}
        </motion.div>
      </button>
      <motion.div style={{ opacity: legende }} className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-[clamp(1.15rem,1rem+0.6vw,1.5rem)] leading-tight font-bold">{p.titre}</h3>
          <p className="mt-1 text-[0.95rem] text-doux">{credit(p)}</p>
        </div>
        {p.date && <time dateTime={p.date} className="shrink-0 pt-1 text-[0.85rem] text-doux">{jour(p.date)}</time>}
      </motion.div>
    </motion.li>
  )
}
