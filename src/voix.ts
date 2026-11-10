/* La voix en cours : démo + castings passent par un analyseur Web Audio.
   `niveau` (0..1) fait s'allumer l'avatar comme l'anneau « parle » de Discord,
   `spectre` fait danser les barres de la piste en lecture. */
import { animate, motionValue } from 'motion/react'
import { useSyncExternalStore } from 'react'
import { SASU } from '@/contenu'

export const demo = new Audio()
demo.preload = 'none'

export const niveau = motionValue(0)
export const spectre = new Uint8Array(48)

let ctx: AudioContext | undefined
let analyseur: AnalyserNode | undefined
let raf = 0
const branches = new WeakSet<HTMLMediaElement>()
const enCours = new Set<HTMLMediaElement>()
const onde = new Uint8Array(512)

const ecouter = () => {
  analyseur!.getByteTimeDomainData(onde)
  analyseur!.getByteFrequencyData(spectre)
  let somme = 0
  for (const v of onde) somme += ((v - 128) / 128) ** 2
  niveau.set(niveau.get() * 0.5 + Math.min(1, Math.sqrt(somme / onde.length) * 5) * 0.5)
  raf = requestAnimationFrame(ecouter)
}

const brancher = (el: HTMLMediaElement) => {
  ctx ??= new AudioContext()
  if (!analyseur) {
    analyseur = ctx.createAnalyser()
    analyseur.fftSize = 1024
    analyseur.smoothingTimeConstant = 0.7
    analyseur.connect(ctx.destination)
  }
  if (!branches.has(el)) {
    ctx.createMediaElementSource(el).connect(analyseur)
    branches.add(el)
    el.addEventListener('play', () => {
      enCours.add(el)
      if (!raf) ecouter()
    })
    const stop = () => {
      enCours.delete(el)
      if (enCours.size) return
      cancelAnimationFrame(raf)
      raf = 0
      spectre.fill(0)
      animate(niveau, 0, { duration: 0.4 })
    }
    el.addEventListener('pause', stop)
    el.addEventListener('ended', stop)
  }
  ctx.resume()
}

/** Lance un son (et coupe les autres : un seul son à la fois). À appeler depuis un clic. */
export const jouer = (el: HTMLMediaElement) => {
  for (const m of [demo, ...document.querySelectorAll<HTMLMediaElement>('audio, video')])
    if (m !== el && !m.paused && m.dataset?.apercu === undefined) m.pause()
  try {
    brancher(el)
  } catch {
    // sans Web Audio, le son passe quand même, juste sans l'anneau
  }
  return el.play()
}

export const basculerDemo = () => {
  if (!demo.src) demo.src = SASU.demo.fichier
  return demo.paused ? jouer(demo) : demo.pause()
}

const abonner = (cb: () => void) => {
  const evs = ['play', 'pause', 'ended', 'timeupdate']
  evs.forEach(e => demo.addEventListener(e, cb))
  return () => evs.forEach(e => demo.removeEventListener(e, cb))
}
export type EtatDemo = 'neuf' | 'lecture' | 'pause' | 'fin'
export const useDemo = () => ({
  etat: useSyncExternalStore(abonner, (): EtatDemo => (!demo.paused ? 'lecture' : demo.ended ? 'fin' : demo.currentTime > 0 ? 'pause' : 'neuf')),
  t: useSyncExternalStore(abonner, () => demo.currentTime),
})
