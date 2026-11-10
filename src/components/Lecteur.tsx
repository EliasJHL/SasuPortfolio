/* Lecteur vidéo : la vignette s'agrandit jusqu'au lecteur (motion layoutId).
   Lecture, progression, volume, qualité, plein écran (PC, Android et iPhone).
   Raccourcis : Espace/K lecture, F plein écran, M son, ← → ±5 s, ↑ ↓ volume. */
import { motion } from 'motion/react'
import { Maximize, Minimize, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn, temps } from '@/lib/utils'
import { IconeLecture } from '@/components/Icones'
import type { Clip } from '@/lib/projets'

type Source = { label: string; src: string }
type Pref = { volume?: number; muet?: boolean; qualite?: string | null }

const CLE = 'sasu-lecteur'
const lirePref = (): Pref => {
  try {
    return JSON.parse(localStorage.getItem(CLE) || '{}') || {}
  } catch {
    return {}
  }
}
const sauver = (p: Pref) => {
  try {
    localStorage.setItem(CLE, JSON.stringify(p))
  } catch {}
}
const hauteur = (label: string) => parseInt(label, 10) || 0
const auto = (s: Source[]) => {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection || {}
  if (c.saveData || /2g/.test(c.effectiveType || '')) return s.at(-1)!
  const px = Math.max(screen.width, screen.height) * Math.min(devicePixelRatio || 1, 2)
  const cible = px >= 1700 ? 1080 : px >= 1100 ? 720 : 480
  return s.find(x => hauteur(x.label) <= cible) || s.at(-1)!
}
// l'iPhone ne laisse régler le volume qu'avec ses boutons
const volumeReglable = (() => {
  const t = document.createElement('video')
  t.volume = 0.5
  return t.volume === 0.5
})()

type DocPlein = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void }
const enPlein = () => document.fullscreenElement || (document as DocPlein).webkitFullscreenElement
const sortirPlein = () => enPlein() && (document.exitFullscreen || (document as DocPlein).webkitExitFullscreen)?.call(document)

export function Lecteur({ clip, fermer }: { clip: Clip | null; fermer: () => void }) {
  const dlg = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (clip && !dlg.current!.open) dlg.current!.showModal()
  }, [clip])
  const close = () => {
    sortirPlein()
    dlg.current!.close()
  }

  return (
    <dialog
      ref={dlg}
      aria-labelledby="lecteur-titre"
      onClose={fermer}
      onClick={e => e.target === e.currentTarget && close()}
      className="lecteur m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-[clamp(12px,3vw,40px)] text-creme"
    >
      {clip && <Ecran key={clip.id} clip={clip} close={close} />}
    </dialog>
  )
}

function Ecran({ clip, close }: { clip: Clip; close: () => void }) {
  const ecran = useRef<HTMLDivElement>(null)
  const v = useRef<HTMLVideoElement>(null)
  const barre = useRef<HTMLDivElement>(null)
  const [pref, setPref] = useState(lirePref)
  const [sources] = useState<Source[]>(() => {
    const q = Object.entries(clip.qualites || {}).map(([label, src]) => ({ label, src }))
    return q.length ? q.sort((a, b) => hauteur(b.label) - hauteur(a.label)) : [{ label: 'Normale', src: clip.fichier }]
  })
  const choisie = (pref.qualite && sources.find(s => s.label === pref.qualite)) || auto(sources)
  const [source, setSource] = useState(choisie)
  const [pause, setPause] = useState(true)
  const [t, setT] = useState(0)
  const [duree, setDuree] = useState(0)
  const [charge, setCharge] = useState(0)
  const [volume, setVolume] = useState(pref.volume ?? 1)
  const [muet, setMuet] = useState(!!pref.muet)
  const [menu, setMenu] = useState(false)
  const [calme, setCalme] = useState(false)
  const [attente, setAttente] = useState(false)
  const [plein, setPlein] = useState(false)
  const reprise = useRef<{ t: number; joue: boolean } | null>(null)
  const minuteur = useRef<number>(undefined)

  const majPref = (p: Pref) => {
    const n = { ...pref, ...p }
    setPref(n)
    sauver(n)
  }

  useEffect(() => {
    v.current!.volume = volume
    v.current!.muted = muet
  }, [volume, muet])

  useEffect(() => {
    v.current!.play().catch(() => {})
    const maj = () => setPlein(!!enPlein())
    document.addEventListener('fullscreenchange', maj)
    document.addEventListener('webkitfullscreenchange', maj)
    return () => {
      document.removeEventListener('fullscreenchange', maj)
      document.removeEventListener('webkitfullscreenchange', maj)
    }
  }, [])

  // Les commandes se cachent pendant la lecture
  const montrer = (garder = v.current?.paused) => {
    setCalme(false)
    clearTimeout(minuteur.current)
    if (!garder)
      minuteur.current = setTimeout(() => {
        const f = document.activeElement
        const clavier = f?.closest('.commandes') && f.matches(':focus-visible')
        if (!v.current?.paused && !clavier) setCalme(true)
      }, 2600)
  }
  useEffect(() => () => clearTimeout(minuteur.current), [])

  const basculer = () => (v.current!.paused || v.current!.ended ? v.current!.play().catch(() => {}) : v.current!.pause())

  const changerQualite = (q: string | null) => {
    const s = (q && sources.find(x => x.label === q)) || auto(sources)
    majPref({ qualite: q })
    setMenu(false)
    if (s === source) return
    reprise.current = { t: v.current!.currentTime, joue: !v.current!.paused && !v.current!.ended }
    setSource(s)
  }

  const basculerMuet = () => {
    if (muet || volume === 0) {
      setMuet(false)
      if (volume === 0) setVolume(0.6)
      majPref({ muet: false, volume: volume || 0.6 })
    } else {
      setMuet(true)
      majPref({ muet: true })
    }
  }
  const regler = (n: number) => {
    n = Math.max(0, Math.min(1, n))
    setVolume(n)
    setMuet(n === 0)
    majPref({ volume: n || pref.volume || 1, muet: n === 0 })
  }

  const pleinEcran = () => {
    if (enPlein()) return sortirPlein()
    const e = ecran.current as HTMLDivElement & { webkitRequestFullscreen?: () => void }
    const vid = v.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void }
    if (e.requestFullscreen) {
      e.requestFullscreen({ navigationUI: 'hide' })
        .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape').catch(() => {}))
        .catch(() => {})
    } else if (e.webkitRequestFullscreen) e.webkitRequestFullscreen()
    else vid.webkitEnterFullscreen?.() // iPhone : lecteur plein écran d'Apple
  }

  const chercher = (x: number) => {
    if (!duree) return
    const r = barre.current!.getBoundingClientRect()
    v.current!.currentTime = Math.max(0, Math.min(1, (x - r.left) / r.width)) * duree
  }

  const clavier = (e: React.KeyboardEvent) => {
    const cible = e.target as HTMLElement
    if (e.key === 'Escape' && menu) {
      e.preventDefault() // ferme le menu, pas le lecteur
      setMenu(false)
      return
    }
    if (cible.matches('input') || cible.closest('[role=menu]') || e.ctrlKey || e.metaKey || e.altKey) return
    const k = e.key.toLowerCase()
    if (k === ' ' && cible.tagName === 'BUTTON') return
    const actions: Record<string, () => void> = {
      ' ': basculer,
      k: basculer,
      f: pleinEcran,
      m: basculerMuet,
      arrowright: () => (v.current!.currentTime = Math.min(duree, v.current!.currentTime + 5)),
      arrowleft: () => (v.current!.currentTime = Math.max(0, v.current!.currentTime - 5)),
      arrowup: () => regler((muet ? 0 : volume) + 0.1),
      arrowdown: () => regler(volume - 0.1),
    }
    if (actions[k]) {
      e.preventDefault()
      actions[k]()
      montrer()
    }
  }

  const coupe = muet || volume === 0
  const r = duree ? t / duree : 0

  return (
    <div className="flex size-full flex-col items-center justify-center gap-3" onKeyDown={clavier}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex w-[min(1100px,100%,calc((100dvh_-_140px)*16/9))] items-center justify-between gap-4">
        <p id="lecteur-titre" className="truncate text-lg font-bold">
          {clip.titre}
        </p>
        <button type="button" onClick={close} className="bouton bouton-petit" aria-label="Fermer le lecteur">
          <X className="size-4" /> Fermer
        </button>
      </motion.div>

      <motion.div
        ref={ecran}
        layoutId={`clip-${clip.id}`}
        transition={{ type: 'spring', bounce: 0.12, duration: 0.55 }}
        style={{ borderRadius: 18 }}
        className={cn('group/ecran relative aspect-video w-[min(1100px,100%,calc((100dvh_-_140px)*16/9))] overflow-hidden bg-black', calme && !menu && 'cursor-none', plein && 'rounded-none!')}
        onPointerMove={() => montrer()}
        onPointerDown={() => montrer()}
        onContextMenu={e => e.preventDefault()}
      >
        <video
          ref={v}
          src={source.src}
          poster={clip.miniature}
          playsInline
          disablePictureInPicture
          controlsList="nodownload"
          className="size-full object-contain"
          onClick={() => (menu ? setMenu(false) : basculer())}
          onDoubleClick={pleinEcran}
          onPlay={() => {
            setPause(false)
            montrer(false)
          }}
          onPause={() => {
            setPause(true)
            montrer(true)
          }}
          onEnded={() => setPause(true)}
          onLoadedMetadata={e => {
            setDuree(e.currentTarget.duration)
            if (reprise.current) {
              e.currentTarget.currentTime = reprise.current.t
              if (reprise.current.joue) e.currentTarget.play().catch(() => {})
              reprise.current = null
            }
          }}
          onTimeUpdate={e => setT(e.currentTarget.currentTime)}
          onProgress={e => {
            const b = e.currentTarget.buffered
            if (e.currentTarget.duration && b.length) setCharge(b.end(b.length - 1) / e.currentTarget.duration)
          }}
          onWaiting={() => setAttente(true)}
          onPlaying={() => setAttente(false)}
          onCanPlay={() => setAttente(false)}
        />

        {pause && (
          <motion.button
            type="button"
            onClick={basculer}
            aria-label="Lire"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4, duration: 0.4 }}
            className="absolute top-1/2 left-1/2 grid size-20 -translate-1/2 place-items-center rounded-full bg-creme/95 text-encre shadow-2xl"
          >
            <IconeLecture lecture={false} className="ml-1 size-8" />
          </motion.button>
        )}
        {attente && !pause && <span className="absolute top-1/2 left-1/2 size-12 -translate-1/2 animate-spin rounded-full border-3 border-white/20 border-t-or" aria-hidden="true" />}

        <div className={cn('commandes absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent px-4 pt-12 pb-3 transition-opacity duration-300', calme && !menu && 'pointer-events-none opacity-0')}>
          <div
            ref={barre}
            role="slider"
            tabIndex={0}
            aria-label="Position dans la vidéo"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(r * 100)}
            aria-valuetext={`${temps(t)} sur ${temps(duree)}`}
            className="group/barre relative h-4 cursor-pointer touch-none"
            onPointerDown={e => {
              e.currentTarget.setPointerCapture(e.pointerId)
              chercher(e.clientX)
            }}
            onPointerMove={e => e.currentTarget.hasPointerCapture(e.pointerId) && chercher(e.clientX)}
          >
            <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/20 transition-[height] group-hover/barre:h-1.5">
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: charge * 100 + '%' }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-or" style={{ width: r * 100 + '%' }}>
                <span className="absolute top-1/2 right-0 size-3.5 translate-x-1/2 -translate-y-1/2 scale-0 rounded-full bg-white shadow transition-transform group-hover/barre:scale-100 group-focus-visible/barre:scale-100" />
              </div>
            </div>
          </div>

          <div className="mt-1.5 flex items-center gap-2">
            <button type="button" className="cmd" onClick={basculer} aria-label={pause ? 'Lire' : 'Mettre en pause'}>
              <IconeLecture lecture={!pause} className="size-6" />
            </button>
            <div className="group/vol flex items-center">
              <button type="button" className="cmd" onClick={basculerMuet} aria-label={coupe ? 'Remettre le son' : 'Couper le son'}>
                {coupe ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
              </button>
              {volumeReglable && (
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={coupe ? 0 : volume}
                  onChange={e => regler(+e.target.value)}
                  aria-label="Volume"
                  className="volume w-0 opacity-0 transition-all duration-300 group-focus-within/vol:w-24 group-focus-within/vol:opacity-100 group-hover/vol:w-24 group-hover/vol:opacity-100"
                  style={{ ['--niveau' as string]: (coupe ? 0 : volume) * 100 + '%' }}
                />
              )}
            </div>
            <span className="ml-1 text-sm tabular-nums">
              {temps(t)} / {temps(duree)}
            </span>
            <span className="flex-1" />

            {sources.length > 1 && (
              <div className="relative">
                <button type="button" className="cmd flex w-auto px-2.5 text-sm font-semibold whitespace-nowrap" aria-haspopup="true" aria-expanded={menu} onClick={() => setMenu(!menu)} aria-label={`Qualité : ${source.label}${pref.qualite ? '' : ' (automatique)'}`}>
                  {source.label}
                  {!pref.qualite && <span className="ml-1 opacity-60">auto</span>}
                </button>
                {menu && (
                  <motion.ul
                    role="menu"
                    aria-label="Qualité de la vidéo"
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute right-0 bottom-full mb-2 min-w-36 origin-bottom-right rounded-xl border border-white/10 bg-cuir/95 p-1 shadow-2xl backdrop-blur"
                    onKeyDown={e => {
                      const liste = [...e.currentTarget.querySelectorAll('button')]
                      const i = liste.indexOf(document.activeElement as HTMLButtonElement)
                      if (e.key === 'ArrowDown') liste[(i + 1) % liste.length].focus()
                      else if (e.key === 'ArrowUp') liste[(i - 1 + liste.length) % liste.length].focus()
                      else return
                      e.preventDefault()
                    }}
                  >
                    {[{ label: 'Auto', auto: true }, ...sources].map(s => {
                      const coche = 'auto' in s ? !pref.qualite : pref.qualite === s.label
                      return (
                        <li role="none" key={s.label}>
                          <button
                            type="button"
                            role="menuitemradio"
                            aria-checked={coche}
                            autoFocus={coche}
                            onClick={() => changerQualite('auto' in s ? null : s.label)}
                            className={cn('flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10', coche && 'text-or')}
                          >
                            {s.label}
                            {'auto' in s && <small className="text-doux">{auto(sources).label}</small>}
                          </button>
                        </li>
                      )
                    })}
                  </motion.ul>
                )}
              </div>
            )}

            <button type="button" className="cmd" onClick={pleinEcran} aria-label={plein ? 'Quitter le plein écran' : 'Plein écran'}>
              {plein ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
