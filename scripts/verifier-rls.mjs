// Vérifie les règles d'accès avec la clé publique, comme un visiteur non connecté.
// Usage : node --env-file=.env.local scripts/verifier-rls.mjs
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

const { VITE_SUPABASE_URL: URL_SB, VITE_SUPABASE_PUBLISHABLE_KEY: CLE } = process.env
const sb = createClient(URL_SB, CLE)

const brouillons = await sb.from('medias').select('id').eq('publie', false)
assert.equal(brouillons.error, null)
assert.equal(brouillons.data.length, 0, 'un visiteur voit des brouillons')
assert.ok((await sb.from('admins').select()).error, 'la table admins est lisible')
assert.equal((await sb.rpc('est_admin')).data, false, 'est_admin() vaut true pour un visiteur')

// la RLS seule ferait réussir ces requêtes sur 0 ligne : on exige un refus explicite (droits retirés à anon)
for (const [table, champ] of [['profil', 'pseudo'], ['medias', 'titre'], ['cv', 'titre']]) {
  assert.ok((await sb.from(table).insert({ [champ]: 'x' })).error, `${table} : insertion anonyme acceptée`)
  assert.ok((await sb.from(table).update({ [champ]: 'x' }).not('id', 'is', null)).error, `${table} : modification anonyme acceptée`)
  assert.ok((await sb.from(table).delete().not('id', 'is', null)).error, `${table} : suppression anonyme acceptée`)
}

const fn = await fetch(`${URL_SB}/functions/v1/medias`, { method: 'POST', headers: { apikey: CLE, Authorization: `Bearer ${CLE}`, 'content-type': 'application/json' }, body: '{"action":"envoyer"}' })
if (fn.status === 404) console.log('Fonction « medias » pas encore déployée.')
else assert.equal(fn.status, 403, `la fonction medias répond ${fn.status} à un visiteur`)

console.log('Règles d’accès OK.')
