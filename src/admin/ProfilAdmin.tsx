/* Admin du profil : identité, bio, contacts et démo voix avec ses sous-titres. */
import { Plus, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { charger, useContenu } from '@/contenu'
import { url, type Profil, type SousTitre } from '@/lib/projets'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/utils'
import { Champ, ChoisirFichier, existant, LigneEnvoi, supprimerFichiers, useEnvois } from '@/admin/outils'

export function ProfilAdmin() {
  const { profil } = useContenu()
  return profil && <FormProfil p={profil} />
}

function FormProfil({ p }: { p: Profil }) {
  const [f, setF] = useState({
    pseudo: p.pseudo,
    handle: p.handle,
    discord_id: p.discord_id,
    bio: p.bio.join('\n'),
    contact_discord: p.contact_discord ?? '',
    instagram: p.instagram ?? '',
    titreDemo: p.demo?.titre ?? 'Démo voix',
  })
  const maj = (x: Partial<typeof f>) => setF(v => ({ ...v, ...x }))
  const [lignes, setLignes] = useState<SousTitre[]>(p.demo?.soustitres ?? [])
  const demo = useEnvois('profil', p.demo ? [existant(p.demo.url)] : [])
  const [erreur, setErreur] = useState('')
  const ecoute = url(demo.cles[0])

  const majLigne = (i: number, x: Partial<SousTitre>) => setLignes(l => l.map((s, j) => (j === i ? { ...s, ...x } : s)))

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault()
    setErreur('')
    if (!/^\d{15,22}$/.test(f.discord_id.trim())) return setErreur("L'ID Discord doit être une suite de 15 à 22 chiffres.")
    const cle = demo.cles[0]
    const ligne = {
      pseudo: f.pseudo.trim(),
      handle: f.handle.trim().replace(/^@/, ''),
      discord_id: f.discord_id.trim(),
      bio: f.bio.split('\n').map(s => s.trim()).filter(Boolean),
      contact_discord: f.contact_discord.trim() || null,
      instagram: f.instagram.trim().replace(/^@/, '') || null,
      demo: cle ? { url: cle, titre: f.titreDemo.trim() || 'Démo voix', soustitres: lignes.filter(l => l.texte.trim()).sort((a, b) => a.t - b.t) } : null,
    }
    const { error } = await supabase.from('profil').update(ligne).eq('id', 1)
    if (error) return setErreur(`Enregistrement refusé : ${error.message}`)
    supprimerFichiers([p.demo?.url, ...demo.nouvelles.current].filter(k => k !== cle))
    await charger()
    toast('Profil enregistré.')
  }

  return (
    <form onSubmit={enregistrer} className="grid max-w-3xl gap-10">
      <fieldset className="grid gap-4">
        <legend className="mb-4 text-xl font-extrabold">Identité</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <Champ label="Pseudo" aide="Affiché si Discord ne répond pas.">
            <input required value={f.pseudo} onChange={e => maj({ pseudo: e.target.value })} />
          </Champ>
          <Champ label="Handle Discord">
            <input required value={f.handle} onChange={e => maj({ handle: e.target.value })} />
          </Champ>
          <Champ label="ID Discord" aide="Le profil et le statut viennent de ce compte.">
            <input required inputMode="numeric" value={f.discord_id} onChange={e => maj({ discord_id: e.target.value })} />
          </Champ>
        </div>
        <Champ label="Bio" aide="Une phrase par ligne. Elle s'affiche mot à mot sur l'accueil.">
          <textarea rows={4} value={f.bio} onChange={e => maj({ bio: e.target.value })} />
        </Champ>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 text-xl font-extrabold">Contact</legend>
        <Champ label="Pseudo Discord à copier">
          <input value={f.contact_discord} onChange={e => maj({ contact_discord: e.target.value })} />
        </Champ>
        <Champ label="Instagram">
          <input value={f.instagram} onChange={e => maj({ instagram: e.target.value })} placeholder="sans le @" />
        </Champ>
      </fieldset>

      <fieldset className="grid gap-4">
        <legend className="mb-4 text-xl font-extrabold">Démo voix</legend>
        <Champ label="Titre">
          <input value={f.titreDemo} onChange={e => maj({ titreDemo: e.target.value })} />
        </Champ>
        {demo.liste.length > 0 && (
          <ul className="grid gap-2">
            {demo.liste.map(e => (
              <LigneEnvoi key={e.id} e={e} retirer={() => demo.retirer(e.id)} reessayer={() => demo.reessayer(e)} />
            ))}
          </ul>
        )}
        <ChoisirFichier label={demo.liste.length ? 'Remplacer le fichier' : 'Choisir un fichier audio'} accept="audio/*" choisir={([fi]) => fi && demo.ajouter(fi, true)} />
        {ecoute && <audio controls src={ecoute} className="w-full max-w-xl" aria-label="Écouter la démo pour caler les sous-titres" />}

        <div className="grid gap-2">
          <p className="font-semibold">Sous-titres</p>
          <p className="text-[0.92rem] text-doux">Début et durée en secondes. Lis la démo ci-dessus pour caler les temps.</p>
          {lignes.map((l, i) => (
            <div key={i} className="grid grid-cols-[5.5rem_5.5rem_1fr_auto] items-end gap-2">
              <Champ label="Début">
                <input type="number" min={0} step={0.1} value={l.t} onChange={e => majLigne(i, { t: +e.target.value })} />
              </Champ>
              <Champ label="Durée">
                <input type="number" min={0.1} step={0.1} value={l.d} onChange={e => majLigne(i, { d: +e.target.value })} />
              </Champ>
              <Champ label="Texte">
                <input value={l.texte} onChange={e => majLigne(i, { texte: e.target.value })} />
              </Champ>
              <button type="button" className="cmd mb-1 size-10" aria-label={`Retirer la ligne ${i + 1}`} onClick={() => setLignes(x => x.filter((_, j) => j !== i))}>
                <X className="size-4" />
              </button>
            </div>
          ))}
          <button type="button" className="bouton bouton-petit w-fit" onClick={() => setLignes(x => [...x, { t: x.length ? +(x.at(-1)!.t + x.at(-1)!.d + 0.5).toFixed(1) : 0, d: 3, texte: '' }])}>
            <Plus className="size-4" /> Ajouter une ligne
          </button>
        </div>
      </fieldset>

      {erreur && (
        <p role="alert" className="text-rec">
          {erreur}
        </p>
      )}
      <button type="submit" className="bouton bouton-plein w-fit" disabled={demo.enCours}>
        {demo.enCours ? 'Envoi en cours…' : 'Enregistrer le profil'}
      </button>
    </form>
  )
}
