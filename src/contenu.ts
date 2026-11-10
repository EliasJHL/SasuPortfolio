/* Le contenu du site (Supabase) et la session Discord, partagés par toutes les pages.
   Le dernier contenu publié est gardé en cache pour un affichage instantané. */
import { useSyncExternalStore } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { LigneCV, Media, Profil } from '@/lib/projets'

type Etat = {
  profil: Profil | null
  medias: Media[]
  cv: LigneCV[]
  statut: 'chargement' | 'pret' | 'erreur'
  session: Session | null | undefined // undefined : pas encore connue
  admin: boolean | undefined // undefined : vérification en cours
}

const CACHE = 'sasu-contenu-v1'
const lireCache = (): Partial<Etat> => {
  try {
    return JSON.parse(localStorage.getItem(CACHE) || '{}') || {}
  } catch {
    return {}
  }
}

let etat: Etat = { profil: null, medias: [], cv: [], ...lireCache(), statut: 'chargement', session: undefined, admin: undefined }
const abonnes = new Set<() => void>()
const maj = (p: Partial<Etat>) => {
  etat = { ...etat, ...p }
  abonnes.forEach(f => f())
}

/** Recharge tout (les admins reçoivent aussi les brouillons, grâce aux règles RLS). */
export async function charger() {
  try {
    const [p, m, c] = await Promise.all([
      supabase.from('profil').select().maybeSingle(),
      supabase.from('medias').select().order('ordre').order('date', { ascending: false, nullsFirst: false }),
      supabase.from('cv').select().order('ordre'),
    ])
    if (p.error || m.error || c.error) throw p.error || m.error || c.error
    maj({ profil: p.data, medias: m.data, cv: c.data, statut: 'pret' })
    try {
      localStorage.setItem(CACHE, JSON.stringify({ profil: p.data, medias: m.data.filter(x => x.publie), cv: c.data }))
    } catch {}
  } catch (e) {
    console.warn('[Contenu]', e)
    maj({ statut: etat.profil ? 'pret' : 'erreur' })
  }
}

supabase.auth.onAuthStateChange((evenement, session) => {
  maj({ session })
  if (evenement === 'TOKEN_REFRESHED' || evenement === 'USER_UPDATED') return
  if (session) maj({ admin: undefined })
  // pas d'appel Supabase dans ce rappel (verrou interne de supabase-js) : on attend le tour suivant
  setTimeout(async () => {
    maj({ admin: session ? (await supabase.rpc('est_admin')).data === true : false })
    charger()
  })
})

export const useContenu = () =>
  useSyncExternalStore(
    f => (abonnes.add(f), () => abonnes.delete(f)),
    () => etat,
  )

export const connecter = () => supabase.auth.signInWithOAuth({ provider: 'discord', options: { redirectTo: location.origin + '/admin' } })
export const deconnecter = () => supabase.auth.signOut()
