/* Acte 3 — les doublages vidéo sur une pellicule.
   Le défilement vertical fait avancer la pellicule à l'horizontale ; sur écran tactile, elle se fait glisser au doigt.
   Le plan au centre de l'écran est net, les autres s'assombrissent. */
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionStyle, type MotionValue } from 'motion/react'
import { useEffect, useLayoutEffect, useRef, useState, type UIEvent } from 'react'
import { Link } from 'react-router'
import { credit, fichier, jour, miniature, plusLegere, type Media } from '@/lib/projets'
import { cn, temps } from '@/lib/utils'
import { IconeLecture } from '@/components/Icones'
import { Lecteur } from '@/components/Lecteur'

export function Pellicule({ medias }: { medias: Media[] }) {
  const zone = useRef<HTMLElement>(null)
  const piste = useRef<HTMLUListElement>(null)
  const [course, setCourse] = useState(0)
  const [clip, setClip] = useState<Media | null>(null)
  const { scrollYProgress } = useScroll({ target: zone, offset: ['start start', 'end end'] })
  const lisse = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.0005 })
  const defile = useTransform(lisse, v => -v * course)
  const avanceDefile = useTransform(lisse, v => v * 100 + '%')
  // au doigt, monter et descendre pour aller à gauche ou à droite est pénible : la pellicule glisse d'elle-même
  // et la page garde un défilement vertical normal
  const [tactile] = useState(() => matchMedia('(hover: none)').matches)
  const doigt = useMotionValue(0)
  const avanceDoigt = useMotionValue('0%')
  const x = tactile ? doigt : defile
  const avance = tactile ? avanceDoigt : avanceDefile
  const glisser = (e: UIEvent<HTMLDivElement>) => {
    const d = e.currentTarget
    doigt.set(-d.scrollLeft)
    avanceDoigt.set((d.scrollLeft / Math.max(1, d.scrollWidth - d.clientWidth)) * 100 + '%')
  }

  useLayoutEffect(() => {
    const mesurer = () => setCourse(Math.max(0, piste.current!.scrollWidth - innerWidth))
    mesurer()
    const ro = new ResizeObserver(mesurer)
    ro.observe(piste.current!)
    return () => ro.disconnect()
  }, [])

  // au clavier : amène le plan qui reçoit le focus au centre
  const centrer = (li: HTMLElement) => {
    if (tactile) return // le navigateur fait déjà défiler la pellicule jusqu'au plan
    li.closest('.overflow-hidden')!.scrollLeft = 0
    if (!course) return
    const v = Math.max(0, Math.min(1, (li.offsetLeft + li.offsetWidth / 2 - innerWidth / 2) / course))
    scrollTo({ top: zone.current!.offsetTop + v * course, behavior: 'instant' })
  }

  if (!medias.length) return null
  return (
    <section id="videos" ref={zone} tabIndex={-1} aria-labelledby="titre-videos" style={tactile ? undefined : { height: `calc(100svh + ${course}px)` }} className="relative outline-none">
      <div className={cn('flex flex-col justify-center overflow-hidden py-20', !tactile && 'sticky top-0 h-svh')}>
        <div className="mb-[clamp(20px,4vh,44px)] flex items-end justify-between gap-6 px-(--gouttiere)">
          <h2 id="titre-videos" className="titre">Doublages vidéo</h2>
          <p className="pb-2 whitespace-nowrap text-doux">{medias.length} extraits</p>
        </div>

        <div onScroll={tactile ? glisser : undefined} className={cn(tactile && 'snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none]')}>
          <motion.ul ref={piste} style={tactile ? undefined : { x }} className="pellicule relative flex w-max gap-[clamp(14px,2vw,28px)] px-(--gouttiere) py-8">
            {medias.map(m => (
              <Plan key={m.id} m={m} x={x} ouvert={clip?.id === m.id} ouvrir={() => setClip(m)} centrer={centrer} />
            ))}
            <li className="w-[min(74vw,620px)] shrink-0 snap-center self-start" onFocus={e => centrer(e.currentTarget)}>
              <Link to="/doublage" className="group grid aspect-video place-items-center rounded-[10px] border border-dashed border-creme/25 text-center no-underline transition-colors hover:border-or">
                <span className="px-6 text-[clamp(1.8rem,1.2rem+2.4vw,3.4rem)] leading-none font-extrabold text-creme [font-variation-settings:'wdth'_70] group-hover:text-or">Voir tous les doublages</span>
              </Link>
            </li>
          </motion.ul>
        </div>

        <div className="mx-(--gouttiere) mt-6 h-px bg-white/10" aria-hidden="true">
          <motion.div className="h-full bg-or" style={{ width: avance }} />
        </div>
      </div>
      <Lecteur clip={clip} fermer={() => setClip(null)} />
    </section>
  )
}

function Plan({ m, x, ouvert, ouvrir, centrer }: { m: Media; x: MotionValue<number>; ouvert: boolean; ouvrir: () => void; centrer: (li: HTMLElement) => void }) {
  const li = useRef<HTMLLIElement>(null)
  const [milieu, setMilieu] = useState(0)

  useLayoutEffect(() => {
    const mesurer = () => setMilieu(li.current!.offsetLeft + li.current!.offsetWidth / 2)
    mesurer()
    addEventListener('resize', mesurer)
    return () => removeEventListener('resize', mesurer)
  }, [])

  // distance au centre de l'écran : 0 au centre, 1 à un écran de distance
  const d = useTransform(x, v => Math.min(1, Math.abs(v + milieu - innerWidth / 2) / innerWidth))
  const scale = useTransform(d, [0, 1], [1, 0.84])
  const filter = useTransform(d, v => `saturate(${1 - v * 0.7}) brightness(${1 - v * 0.45})`)
  const legende = useTransform(d, [0, 0.5], [1, 0.35])

  return (
    <motion.li ref={li} style={{ scale }} className="group w-[min(74vw,620px)] shrink-0 snap-center" onFocus={() => centrer(li.current!)}>
      <Vignette m={m} ouvert={ouvert} ouvrir={ouvrir} style={{ filter }} />
      <motion.div style={{ opacity: legende }}>
        <Legende m={m} />
      </motion.div>
    </motion.li>
  )
}

/** Miniature cliquable : aperçu muet au survol, durée, et morph vers le lecteur (layoutId). */
export function Vignette({ m, ouvert, ouvrir, style }: { m: Media; ouvert: boolean; ouvrir: () => void; style?: MotionStyle }) {
  const apercu = useRef<HTMLVideoElement>(null)
  const [duree, setDuree] = useState<number>()
  const image = miniature(m)
  const source = fichier(m)

  // durée : lecture des métadonnées uniquement
  useEffect(() => {
    if (!source) return
    const v = Object.assign(document.createElement('video'), { preload: 'metadata', muted: true, src: source })
    v.addEventListener('loadedmetadata', () => setDuree(v.duration), { once: true })
    return () => v.removeAttribute('src')
  }, [source])

  const survol = (oui: boolean) => {
    const v = apercu.current
    if (!v || matchMedia('(hover: none)').matches) return
    if (oui) {
      if (!v.src) v.src = plusLegere(m)!
      v.play().catch(() => {})
    } else v.pause()
  }

  return (
    <button type="button" onClick={ouvrir} onPointerEnter={() => survol(true)} onPointerLeave={() => survol(false)} aria-label={`Regarder ${m.titre}`} className="group block w-full rounded-[10px] text-left">
      <motion.div layoutId={`clip-${m.id}`} style={{ borderRadius: 10, ...style }} className={cn('relative aspect-video overflow-hidden bg-cuir', ouvert && 'invisible')} data-media>
        {image ? (
          <img src={image} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
        ) : (
          source && <video muted preload="metadata" src={source + '#t=0.5'} aria-hidden="true" tabIndex={-1} className="size-full object-cover" />
        )}
        {source && <video ref={apercu} data-apercu muted loop playsInline preload="none" aria-hidden="true" tabIndex={-1} poster={image} className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-16 scale-90 place-items-center rounded-full bg-creme/95 text-encre opacity-0 shadow-xl transition-all duration-300 group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100">
            <IconeLecture lecture={false} className="ml-1 size-7" />
          </span>
        </span>
        {m.youtube && <span className="absolute top-3 left-3 rounded bg-black/70 px-1.5 py-0.5 text-[0.8rem] font-semibold">YouTube</span>}
        {duree !== undefined && <span className="absolute right-3 bottom-3 rounded bg-black/70 px-1.5 py-0.5 text-[0.8rem] tabular-nums">{temps(duree)}</span>}
      </motion.div>
    </button>
  )
}

export function Legende({ m }: { m: Media }) {
  return (
    <div className="mt-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-[clamp(1.15rem,1rem+0.6vw,1.5rem)] leading-tight font-bold">{m.titre}</h3>
        <p className="mt-1 text-[0.95rem] text-doux">{credit(m)}</p>
      </div>
      {m.date && (
        <time dateTime={m.date} className="shrink-0 pt-1 text-[0.85rem] text-doux">
          {jour(m.date)}
        </time>
      )}
    </div>
  )
}
