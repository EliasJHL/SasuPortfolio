/* Acte 4 — les castings audio.
   Les formes d'onde se dessinent au défilement, puis dansent sur la voix pendant l'écoute. */
import { motion, useScroll } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { audios, credit, oeuvres, type Clip } from '@/lib/projets'
import { cn, temps, toast } from '@/lib/utils'
import { jouer, spectre } from '@/voix'
import { BorderBeam } from '@/components/ui/border-beam'
import { ScrollVelocityContainer, ScrollVelocityRow } from '@/components/ui/scroll-based-velocity'
import { IconeLecture } from '@/components/Icones'

export function Castings() {
  return (
    <section id="castings" tabIndex={-1} aria-labelledby="titre-castings" className="py-[clamp(80px,14vh,160px)] outline-none">
      {oeuvres.length > 0 && (
        <ScrollVelocityContainer className="mb-[clamp(56px,10vh,120px)] -rotate-2 border-y border-or/25 bg-cuir py-3" aria-label={`Œuvres doublées : ${oeuvres.join(', ')}`}>
          <ScrollVelocityRow baseVelocity={3} direction={-1}>
            {oeuvres.map(o => (
              <span key={o} className="oeuvre inline-flex items-center" aria-hidden="true">
                {o}
                <span className="mx-[0.45em] inline-block size-[0.16em] rotate-45 bg-or" />
              </span>
            ))}
          </ScrollVelocityRow>
        </ScrollVelocityContainer>
      )}

      {audios.length > 0 && (
        <div className="mx-auto max-w-[1180px] px-(--gouttiere) lg:pr-36">
          <h2 id="titre-castings" className="titre">Castings audio</h2>
          <ul className="mt-[clamp(32px,6vh,64px)] grid gap-[clamp(48px,9vh,96px)]">
            {audios.map(p => (
              <Piste key={p.id} p={p} />
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

const NB = 72
const graine = (s: string) => {
  let h = 2166136261
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return h >>> 0
}
const barres = (cle: string) => {
  let s = graine(cle), v = 0.5
  const r = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296
  return Array.from({ length: NB }, (_, i) => {
    v = Math.min(1, Math.max(0.12, v + (r() - 0.5) * 0.5))
    return 0.18 + v * Math.min(1, i / 5, (NB - i) / 5) * 0.82
  })
}

function Piste({ p }: { p: Clip }) {
  const li = useRef<HTMLLIElement>(null)
  const ondeEl = useRef<HTMLDivElement>(null)
  const a = useRef<HTMLAudioElement>(null)
  const [lecture, setLecture] = useState(false)
  const [t, setT] = useState(0)
  const [duree, setDuree] = useState(NaN)
  const [hauteurs] = useState(() => barres(p.titre + p.fichier))
  const r = duree ? t / duree : 0

  // l'onde se dessine de gauche à droite quand la piste arrive à l'écran
  const { scrollYProgress: dessin } = useScroll({ target: li, offset: ['start end', 'center center'] })

  // pendant l'écoute, chaque barre suit une bande de fréquence de la voix
  useEffect(() => {
    if (!lecture) return
    const bs = [...ondeEl.current!.querySelectorAll<HTMLElement>('[data-b]')]
    let raf = 0
    const danser = () => {
      for (const b of bs) b.style.setProperty('--v', String(spectre[+b.dataset.b! % spectre.length] / 255))
      raf = requestAnimationFrame(danser)
    }
    danser()
    return () => {
      cancelAnimationFrame(raf)
      bs.forEach(b => b.style.setProperty('--v', '0'))
    }
  }, [lecture])

  const basculer = () => (a.current!.paused ? jouer(a.current!).catch(() => toast('Impossible de lire cet extrait.')) : a.current!.pause())
  const chercher = (x: number, box: DOMRect) => {
    if (duree) a.current!.currentTime = Math.max(0, Math.min(1, (x - box.left) / box.width)) * duree
  }

  const onde = (plein: boolean) => (
    <div aria-hidden={plein || undefined} className={cn('absolute inset-0 flex items-center gap-[3px]', plein && 'transition-[clip-path] duration-300 ease-linear')} style={plein ? { clipPath: `inset(0 ${100 - r * 100}% 0 0)` } : undefined}>
      {hauteurs.map((h, i) => (
        <i key={i} data-b={i} className={cn('barre flex-1 rounded-full', plein ? 'bg-or' : 'bg-creme/20')} style={{ ['--h' as string]: h, ['--i' as string]: i / NB }} />
      ))}
    </div>
  )

  return (
    <li ref={li} data-lecture={lecture || undefined} className="relative">
      <div className="flex items-end gap-5">
        <button
          type="button"
          onClick={basculer}
          aria-label={(lecture ? 'Mettre en pause ' : 'Écouter ') + p.titre}
          className={cn('grid size-[clamp(56px,7vw,76px)] shrink-0 place-items-center rounded-full transition-colors', lecture ? 'bg-or text-encre' : 'bg-creme text-encre hover:bg-white')}
        >
          <IconeLecture lecture={lecture} className={cn('size-[40%]', !lecture && 'ml-[6%]')} />
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="text-[clamp(1.6rem,1rem+2.6vw,3.2rem)] leading-[1.02] font-extrabold tracking-tight [font-variation-settings:'wdth'_70]">{p.titre}</h3>
          <p className="mt-1.5 text-doux">{credit(p)}</p>
        </div>
        <span className="pb-1 text-[0.95rem] text-doux tabular-nums max-sm:hidden">
          {temps(t)} / {temps(duree)}
        </span>
      </div>

      <div className="relative mt-5 rounded-2xl border border-white/8 bg-cuir/60 px-4 py-3">
        {lecture && <BorderBeam size={120} duration={5} colorFrom="#e2a63b" colorTo="#23a55a" borderWidth={1.5} />}
        <motion.div
          ref={ondeEl}
          role="slider"
          tabIndex={0}
          aria-label={`Position dans ${p.titre}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(r * 100)}
          aria-valuetext={`${temps(t)} sur ${temps(duree)}`}
          style={{ ['--p' as string]: dessin }}
          className="relative h-[clamp(64px,10vw,110px)] cursor-pointer touch-none"
          onPointerDown={e => {
            e.currentTarget.setPointerCapture(e.pointerId)
            chercher(e.clientX, e.currentTarget.getBoundingClientRect())
          }}
          onPointerMove={e => e.currentTarget.hasPointerCapture(e.pointerId) && chercher(e.clientX, e.currentTarget.getBoundingClientRect())}
          onKeyDown={e => {
            const pas = ({ ArrowRight: 5, ArrowUp: 5, ArrowLeft: -5, ArrowDown: -5 } as Record<string, number>)[e.key]
            if (pas && duree) {
              e.preventDefault()
              a.current!.currentTime = Math.max(0, Math.min(duree, t + pas))
            } else if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              basculer()
            }
          }}
        >
          {onde(false)}
          {onde(true)}
        </motion.div>
      </div>
      <p className="mt-2 text-[0.9rem] text-doux tabular-nums sm:hidden">
        {temps(t)} / {temps(duree)}
      </p>

      <audio
        ref={a}
        preload="metadata"
        src={p.fichier}
        controlsList="nodownload"
        onLoadedMetadata={e => setDuree(e.currentTarget.duration)}
        onTimeUpdate={e => setT(e.currentTarget.currentTime)}
        onPlay={() => setLecture(true)}
        onPause={() => setLecture(false)}
        onEnded={e => {
          setLecture(false)
          e.currentTarget.currentTime = 0
        }}
      />
    </li>
  )
}
