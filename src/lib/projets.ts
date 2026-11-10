/* Types de la base et petites fonctions pures (testées dans tests/projets.test.ts). */

export type Categorie = 'doublage' | 'montage' | 'production'
export type Qualite = { label: string; url: string }
export type Media = {
  id: string
  categorie: Categorie
  genre: 'video' | 'audio'
  titre: string
  role: string | null
  oeuvre: string | null
  description: string | null
  date: string | null
  youtube: string | null
  qualites: Qualite[]
  miniature: string | null
  a_la_une: boolean
  publie: boolean
  ordre: number
}
export type SousTitre = { t: number; d: number; texte: string }
export type Profil = {
  id: number
  discord_id: string
  pseudo: string
  handle: string
  bio: string[]
  contact_discord: string | null
  instagram: string | null
  youtube: string | null
  demo: { url: string; titre: string; soustitres: SousTitre[] } | null
}
export type LigneCV = {
  id: string
  section: 'objectif' | 'experience' | 'formation' | 'competence' | 'interet'
  titre: string
  structure: string | null
  lieu: string | null
  debut: string | null
  fin: string | null
  description: string | null
  ordre: number
}

// la base stocke des clés R2 relatives ; une URL complète ou un chemin absolu passe tel quel
const BASE = (import.meta.env?.VITE_MEDIAS_URL || '/media').replace(/\/$/, '')
export const url = (cle?: string | null) => (!cle ? undefined : /^(https?:)?\/\/|^\//.test(cle) ? cle : `${BASE}/${cle}`)
export const estCle = (cle?: string | null): cle is string => !!cle && !/^(https?:)?\/\/|^\//.test(cle)

export const hauteur = (label: string) => parseInt(label, 10) || 0
export const fichier = (m: Media) => url(m.qualites[0]?.url)
/** La version la plus légère, pour les aperçus (une qualité sans hauteur passe en dernier). */
export const plusLegere = (m: Media) => url([...m.qualites].sort((a, b) => (hauteur(a.label) || Infinity) - (hauteur(b.label) || Infinity))[0]?.url)
export const miniature = (m: Pick<Media, 'miniature' | 'youtube'>) => url(m.miniature) ?? (m.youtube ? `https://i.ytimg.com/vi/${m.youtube}/hqdefault.jpg` : undefined)

export const credit = (m: Pick<Media, 'role' | 'oeuvre'>) => (m.role && m.oeuvre ? `${m.role}, dans ${m.oeuvre}` : m.role || m.oeuvre || '')
export const jour = (d?: string | null) => (d ? new Date(d + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '')
/** « Jujutsu Kaisen, saison 3 » compte comme « Jujutsu Kaisen ». */
export const oeuvre = (m: Pick<Media, 'oeuvre'>) => m.oeuvre?.split(',')[0].trim() || undefined
export const oeuvres = (ms: Pick<Media, 'oeuvre'>[]) => [...new Set(ms.map(oeuvre).filter(Boolean))] as string[]

// le CV se lit en années : « 2024 – 2026 », « 2025 – en cours »
const an = (d: string) => d.slice(0, 4)
export const periode = (debut: string | null, fin: string | null) => {
  if (!debut) return fin ? an(fin) : ''
  if (!fin) return `${an(debut)} – en cours`
  return an(debut) === an(fin) ? an(debut) : `${an(debut)} – ${an(fin)}`
}

/** youtu.be/ID, youtube.com/watch?v=ID, /shorts/ID, /embed/ID, /live/ID ou l'ID seul ; null sinon. */
export function idYoutube(lien: string) {
  const s = lien.trim()
  const ok = (id?: string | null) => (id && /^[\w-]{11}$/.test(id) ? id : null)
  if (ok(s)) return s
  try {
    const u = new URL(/^https?:\/\//.test(s) ? s : 'https://' + s)
    const hote = u.hostname.replace(/^(www|m|music)\./, '')
    if (hote === 'youtu.be') return ok(u.pathname.split('/')[1])
    if (hote !== 'youtube.com' && hote !== 'youtube-nocookie.com') return null
    return ok(u.searchParams.get('v')) ?? ok(u.pathname.match(/^\/(?:shorts|embed|live)\/([^/]+)/)?.[1])
  } catch {
    return null
  }
}
