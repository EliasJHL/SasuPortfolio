/* Profil Discord en temps réel via Lanyard (https://github.com/Phineas/lanyard) :
   photo (animée si Nitro), décoration d'avatar, pseudo, tag de serveur, statut, activité.
   Mise à jour instantanée par WebSocket. Condition : être membre de discord.gg/lanyard. */
import { useEffect, useState } from 'react'

const API = 'https://api.lanyard.rest/v1/users/'
const WS = 'wss://api.lanyard.rest/socket'
const CDN = 'https://cdn.discordapp.com'
const CACHE = 'sasu-discord-v1'

export type Statut = 'online' | 'idle' | 'dnd' | 'offline'
export type Activite = { texte: string; perso: true } | { prefixe: string; nom: string; perso?: false }
export type ProfilDiscord = {
  id: string
  nom: string
  handle: string
  avatar: string
  favicon: string
  deco: string | null
  clan: { tag: string; badge: string | null } | null
  statut: Statut
  activite: Activite | null
  cache?: boolean
}

/* eslint-disable @typescript-eslint/no-explicit-any -- réponse Lanyard non typée */
const animeOk = () => !matchMedia('(prefers-reduced-motion: reduce)').matches

const avatarUrl = (u: any, taille = 256) => {
  if (!u.avatar) return `${CDN}/embed/avatars/${Number((BigInt(u.id) >> 22n) % 6n)}.png`
  const anime = u.avatar.startsWith('a_') && animeOk()
  return `${CDN}/avatars/${u.id}/${u.avatar}.${anime ? 'gif' : 'webp'}?size=${taille}`
}

// passthrough=true garde l'animation (APNG)
const decoUrl = (u: any) => {
  const d = u.avatar_decoration_data
  return d?.asset ? `${CDN}/avatar-decoration-presets/${d.asset}.png?size=240&passthrough=${animeOk()}` : null
}

const clan = (u: any) => {
  const g = u.primary_guild || u.clan
  if (!g?.tag || g.identity_enabled === false) return null
  return {
    tag: g.tag as string,
    badge: g.badge && g.identity_guild_id ? `${CDN}/clan-badges/${g.identity_guild_id}/${g.badge}.png?size=32` : null,
  }
}

const VERBES: Record<number, string> = { 0: 'Joue à', 1: 'En stream', 2: 'Écoute', 3: 'Regarde', 5: 'Participe à' }
const activite = (p: any): Activite | null => {
  const acts: any[] = p.activities || []
  const perso = acts.find(a => a.type === 4 && (a.state || a.emoji))
  if (perso) {
    const emoji = perso.emoji && !perso.emoji.id ? perso.emoji.name + ' ' : ''
    return { texte: (emoji + (perso.state || '')).trim(), perso: true }
  }
  if (p.listening_to_spotify && p.spotify) return { prefixe: 'Écoute', nom: `${p.spotify.song} de ${p.spotify.artist}` }
  const a = acts.find(a => a.type !== 4)
  return a ? { prefixe: VERBES[a.type] || 'Sur', nom: a.name } : null
}

const lire = (p: any): ProfilDiscord => {
  const u = p.discord_user
  return {
    id: u.id,
    nom: u.global_name || u.display_name || u.username,
    handle: u.username,
    avatar: avatarUrl(u),
    favicon: avatarUrl(u, 64).replace('.gif', '.png'),
    deco: decoUrl(u),
    clan: clan(u),
    statut: p.discord_status || 'offline',
    activite: activite(p),
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function useDiscord(id: string) {
  const [profil, setProfil] = useState<ProfilDiscord | null>(() => {
    // affichage immédiat avec la dernière version connue ; le statut attend la vraie réponse
    try {
      const c = JSON.parse(localStorage.getItem(CACHE) || 'null')
      return c?.id === id ? { ...c, statut: 'offline', activite: null, cache: true } : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (!/^\d{15,22}$/.test(id)) return
    let fini = false
    const publier = (presence: unknown) => {
      if (fini || !(presence as { discord_user?: unknown })?.discord_user) return
      const p = lire(presence)
      setProfil(p)
      try {
        localStorage.setItem(CACHE, JSON.stringify({ ...p, activite: null }))
      } catch {}
    }

    fetch(API + id)
      .then(r => r.json())
      .then(j => (j.success ? publier(j.data) : console.warn('[Discord] Lanyard ne suit pas ce compte. Rejoins https://discord.gg/lanyard', j.error)))
      .catch(() => {})

    let ws: WebSocket | undefined
    let coeur: number | undefined
    let relance: number | undefined
    let essai = 0
    const connecter = () => {
      try {
        ws = new WebSocket(WS)
      } catch {
        return
      }
      ws.onmessage = e => {
        let m
        try {
          m = JSON.parse(e.data)
        } catch {
          return
        }
        if (m.op === 1) {
          essai = 0
          clearInterval(coeur)
          coeur = setInterval(() => ws?.readyState === 1 && ws.send('{"op":3}'), m.d.heartbeat_interval)
          ws!.send(JSON.stringify({ op: 2, d: { subscribe_to_id: id } }))
        } else if (m.op === 0 && (m.t === 'INIT_STATE' || m.t === 'PRESENCE_UPDATE')) publier(m.d)
      }
      ws.onclose = () => {
        clearInterval(coeur)
        if (!fini) relance = setTimeout(connecter, Math.min(30000, 1500 * 2 ** essai++))
      }
    }
    connecter()

    return () => {
      fini = true
      clearInterval(coeur)
      clearTimeout(relance)
      ws?.close()
    }
  }, [id])

  useEffect(() => {
    const f = document.getElementById('favicon') as HTMLLinkElement | null
    if (f && profil?.favicon) f.href = profil.favicon
  }, [profil?.favicon])

  return profil
}
