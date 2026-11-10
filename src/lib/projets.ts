import { SASU, type Projet } from '@/contenu'

export type Clip = Projet & { id: string; fichier: string }

const aujourdhui = new Date().toLocaleDateString('sv') // AAAA-MM-JJ, heure locale
export const projets: Clip[] = SASU.projets
  .map((p, i) => ({ ...p, id: String(i), fichier: p.fichier || Object.values(p.qualites || {})[0] }))
  .filter(p => p.fichier && p.publie !== false && (!p.date || p.date <= aujourdhui))
  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
export const videos = projets.filter(p => p.type === 'video')
export const audios = projets.filter(p => p.type !== 'video')
export const oeuvres = [...new Set(projets.map(p => p.oeuvre?.split(',')[0]).filter(Boolean))] as string[]

export const credit = (p: Projet) => (p.role && p.oeuvre ? `${p.role}, dans ${p.oeuvre}` : p.role || p.oeuvre || '')
export const jour = (d?: string) => (d ? new Date(d + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
