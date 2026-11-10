import { clsx, type ClassValue } from 'clsx'
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
