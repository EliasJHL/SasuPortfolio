// Envoie public/media sur R2 en gardant les chemins comme clés (doublage/…, miniatures/…, profil/…).
// Usage : node --env-file=.env.local scripts/envoyer-r2.mjs
import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { AwsClient } from 'aws4fetch'

const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env
const r2 = new AwsClient({ accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY, service: 's3', region: 'auto' })
const TYPES = { '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
const RACINE = 'public/media'

let echecs = 0
for (const f of await readdir(RACINE, { recursive: true, withFileTypes: true })) {
  if (!f.isFile() || f.name.startsWith('.')) continue
  const chemin = join(f.parentPath, f.name)
  const cle = relative(RACINE, chemin)
  const r = await r2.fetch(`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET}/${cle}`, {
    method: 'PUT',
    body: await readFile(chemin),
    headers: { 'content-type': TYPES[extname(f.name)] ?? 'application/octet-stream' },
  })
  if (!r.ok) echecs++
  console.log(r.ok ? 'envoyé ' : `ÉCHEC ${r.status} `, cle)
}
process.exit(echecs ? 1 : 0)
