// Signe les envois vers R2 et supprime les fichiers. Réservé aux admins (public.est_admin()).
// POST { action: 'envoyer', dossier, type, extension } -> { envoi, cle }   (URL PUT valable 10 min)
// POST { action: 'supprimer', cle }                    -> { ok: true }
import { createClient } from 'npm:@supabase/supabase-js@2'
import { AwsClient } from 'npm:aws4fetch@1'

const env = (k: string) => Deno.env.get(k) ?? ''
const r2 = new AwsClient({ accessKeyId: env('R2_ACCESS_KEY_ID'), secretAccessKey: env('R2_SECRET_ACCESS_KEY'), service: 's3', region: 'auto' })
const base = `${env('R2_ENDPOINT') || `https://${env('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`}/${env('R2_BUCKET')}`

const DOSSIERS = ['doublage', 'montage', 'production', 'profil', 'miniatures']
const CLE = new RegExp(`^(${DOSSIERS.join('|')})/[A-Za-z0-9_-][A-Za-z0-9._-]*$`)
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const repondre = (corps: unknown, status = 200) => Response.json(corps, { status, headers: CORS })

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  // clé publique : celle injectée par Supabase, sinon celle envoyée par le site (nouvelles clés sb_publishable)
  const sb = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY') || (req.headers.get('apikey') ?? ''), {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: admin } = await sb.rpc('est_admin')
  if (admin !== true) return repondre({ erreur: 'Réservé aux admins.' }, 403)

  const c = await req.json().catch(() => ({}))
  if (c.action === 'envoyer') {
    if (!DOSSIERS.includes(c.dossier) || !/^(video|audio|image)\/[\w.+-]+$/.test(c.type) || !/^[a-z0-9]{1,5}$/.test(c.extension))
      return repondre({ erreur: 'Fichier refusé.' }, 400)
    const cle = `${c.dossier}/${crypto.randomUUID()}.${c.extension}`
    const signe = await r2.sign(new Request(`${base}/${cle}?X-Amz-Expires=600`, { method: 'PUT', headers: { 'content-type': c.type } }), { aws: { signQuery: true } })
    return repondre({ envoi: signe.url, cle })
  }
  if (c.action === 'supprimer') {
    if (!CLE.test(c.cle ?? '')) return repondre({ erreur: 'Clé invalide.' }, 400)
    const r = await r2.fetch(`${base}/${c.cle}`, { method: 'DELETE' })
    return r.ok ? repondre({ ok: true }) : repondre({ erreur: 'Suppression refusée par R2.' }, 502)
  }
  return repondre({ erreur: 'Action inconnue.' }, 400)
})
