import { clsx, type ClassValue } from 'clsx'
import { animate } from 'motion/react'
import type { MouseEvent } from 'react'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const temps = (s: number) => {
  if (!isFinite(s) || s < 0) return '–:––'
  s = Math.floor(s)
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = String(s % 60).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export const toast = (message: string) => window.dispatchEvent(new CustomEvent('sasu:toast', { detail: message }))

export const calme = () => matchMedia('(prefers-reduced-motion: reduce)').matches

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
