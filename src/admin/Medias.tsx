/* Admin des médias d'une catégorie : liste triable, interrupteurs, formulaire d'ajout et de modification. */
import { AudioLines, Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { charger, useContenu } from '@/contenu'
import { credit, estCle, idYoutube, miniature, url, type Categorie, type Media } from '@/lib/projets'
import { supabase } from '@/lib/supabase'
import { cn, toast } from '@/lib/utils'
import { BoutonSupprimer, Champ, ChoisirFichier, existant, Interrupteur, LigneEnvoi, supprimerFichiers, Triable, useEnvois } from '@/admin/outils'

export function MediasAdmin({ categorie }: { categorie: Categorie }) {
  const liste = useContenu().medias.filter(m => m.categorie === categorie)
  const [edition, setEdition] = useState<Media | 'nouveau' | null>(null)

  if (edition)
    return <FormMedia categorie={categorie} m={edition === 'nouveau' ? null : edition} ordre={Math.min(0, ...liste.map(m => m.ordre)) - 1} fermer={() => setEdition(null)} />

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-doux">{liste.length ? `${liste.length} élément${liste.length > 1 ? 's' : ''}, glisse-les pour changer l'ordre.` : "Rien ici pour l'instant."}</p>
        <button type="button" className="bouton bouton-plein bouton-petit" onClick={() => setEdition('nouveau')}>
          <Plus className="size-4" /> Ajouter
        </button>
      </div>
      <Triable table="medias" items={liste} rendu={(m, poignee) => <LigneMedia m={m} poignee={poignee} modifier={() => setEdition(m)} />} />
    </>
  )
}

function LigneMedia({ m, poignee, modifier }: { m: Media; poignee: ReactNode; modifier: () => void }) {
  const image = miniature(m)
  const basculer = async (champ: 'publie' | 'a_la_une', v: boolean) => {
    const { error } = await supabase.from('medias').update({ [champ]: v }).eq('id', m.id)
    if (error) toast("La modification n'a pas été enregistrée.")
    charger()
  }
  const supprimer = async () => {
    const { error } = await supabase.from('medias').delete().eq('id', m.id)
    if (error) return toast('Suppression refusée : ' + error.message)
    supprimerFichiers([...m.qualites.map(q => q.url), m.miniature])
    await charger()
    toast('Supprimé.')
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-white/8 bg-cuir/70 p-2 pr-3', !m.publie && 'border-dashed')}>
      <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
        {poignee}
        {image ? (
          <img src={image} alt="" className="h-12 w-20 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="grid h-12 w-20 shrink-0 place-items-center rounded-md bg-cuir-2 text-doux">
            <AudioLines className="size-5" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-bold">{m.titre}</p>
          <p className="flex flex-wrap items-center gap-1.5 text-sm text-doux">
            {credit(m) && <span className="truncate">{credit(m)}</span>}
            {m.youtube && <span className="rounded bg-white/8 px-1.5">YouTube</span>}
            {m.qualites.length > 1 && <span className="rounded bg-white/8 px-1.5">{m.qualites.length} qualités</span>}
            {!m.publie && <span className="rounded bg-white/8 px-1.5">Brouillon</span>}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Interrupteur label="Publié" actif={m.publie} changer={v => basculer('publie', v)} />
        {m.categorie === 'doublage' && <Interrupteur label="À la une" actif={m.a_la_une} changer={v => basculer('a_la_une', v)} />}
        <button type="button" className="bouton bouton-petit" onClick={modifier}>
          <Pencil className="size-4" /> Modifier
        </button>
        <BoutonSupprimer nom={m.titre} supprimer={supprimer} />
      </div>
    </div>
  )
}

const hauteurVideo = (f: File) =>
  new Promise<string>(ok => {
    if (!f.type.startsWith('video')) return ok('')
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.src = URL.createObjectURL(f)
    v.onloadedmetadata = () => {
      ok(v.videoHeight ? v.videoHeight + 'p' : '')
      URL.revokeObjectURL(v.src)
    }
    v.onerror = () => ok('')
  })

function FormMedia({ categorie, m, ordre, fermer }: { categorie: Categorie; m: Media | null; ordre: number; fermer: () => void }) {
  const [f, setF] = useState({
    titre: m?.titre ?? '',
    role: m?.role ?? '',
    oeuvre: m?.oeuvre ?? '',
    description: m?.description ?? '',
    date: m?.date ?? '',
    publie: m?.publie ?? true,
    a_la_une: m?.a_la_une ?? categorie === 'doublage',
  })
  const maj = (p: Partial<typeof f>) => setF(x => ({ ...x, ...p }))
  const [source, setSource] = useState<'fichier' | 'youtube'>(m?.youtube ? 'youtube' : 'fichier')
  const [lien, setLien] = useState(m?.youtube ? `https://youtu.be/${m.youtube}` : '')
  const fichiers = useEnvois(categorie, m?.qualites.map(q => existant(q.url, q.label)) ?? [])
  const image = useEnvois('miniatures', m?.miniature ? [existant(m.miniature)] : [])
  const [erreur, setErreur] = useState('')
  const [enregistrement, setEnregistrement] = useState(false)

  const id = idYoutube(lien)
  const prets = fichiers.liste.filter(e => e.etat === 'ok')
  const premier = prets[0]?.type
  const genre = source === 'youtube' ? 'video' : premier ? (premier.startsWith('audio') ? 'audio' : 'video') : (m?.genre ?? 'video')
  const occupe = fichiers.enCours || image.enCours || enregistrement
  const apercu = url(image.liste.find(e => e.etat === 'ok')?.cle) ?? (source === 'youtube' && id ? miniature({ miniature: null, youtube: id }) : undefined)

  const ajouterFichiers = (liste: File[]) =>
    liste.forEach(async fi => {
      const idEnvoi = fichiers.ajouter(fi)
      const label = await hauteurVideo(fi)
      if (label) fichiers.changer(idEnvoi, { label })
    })

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault()
    setErreur('')
    if (source === 'youtube' && !id) return setErreur("Ce lien YouTube n'est pas reconnu.")
    if (source === 'fichier' && !prets.length) return setErreur('Ajoute au moins un fichier.')
    const ligne = {
      categorie,
      genre,
      titre: f.titre.trim(),
      role: f.role.trim() || null,
      oeuvre: f.oeuvre.trim() || null,
      description: f.description.trim() || null,
      date: f.date || null,
      youtube: source === 'youtube' ? id : null,
      qualites: source === 'fichier' ? prets.map(x => ({ label: x.label.trim() || 'Originale', url: x.cle! })) : [],
      miniature: image.cles[0] ?? null,
      publie: f.publie,
      a_la_une: f.a_la_une,
      ordre: m?.ordre ?? ordre,
    }
    setEnregistrement(true)
    const { error } = m ? await supabase.from('medias').update(ligne).eq('id', m.id) : await supabase.from('medias').insert(ligne)
    setEnregistrement(false)
    if (error) return setErreur(`Enregistrement refusé : ${error.message}`)
    // fichiers remplacés ou retirés : supprimés de R2 une fois l'enregistrement réussi
    const gardees = [...ligne.qualites.map(q => q.url), ligne.miniature]
    const avant = [...(m?.qualites.map(q => q.url) ?? []), m?.miniature].filter(estCle)
    supprimerFichiers([...avant, ...fichiers.nouvelles.current, ...image.nouvelles.current].filter(k => !gardees.includes(k)))
    await charger()
    toast('Enregistré.')
    fermer()
  }

  const annuler = () => {
    supprimerFichiers([...fichiers.nouvelles.current, ...image.nouvelles.current])
    fermer()
  }

  return (
    <form onSubmit={enregistrer} className="grid gap-8">
      <h2 className="text-2xl font-extrabold">{m ? `Modifier « ${m.titre} »` : 'Nouvel élément'}</h2>

      <div className="grid gap-8 lg:grid-cols-2">
        <fieldset className="grid content-start gap-4">
          <Champ label="Titre">
            <input required value={f.titre} onChange={e => maj({ titre: e.target.value })} />
          </Champ>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Rôle">
              <input value={f.role} onChange={e => maj({ role: e.target.value })} placeholder="Eren" />
            </Champ>
            <Champ label="Œuvre">
              <input value={f.oeuvre} onChange={e => maj({ oeuvre: e.target.value })} placeholder="L'Attaque des Titans" />
            </Champ>
          </div>
          <Champ label="Date">
            <input type="date" value={f.date} onChange={e => maj({ date: e.target.value })} />
          </Champ>
          <Champ label="Description">
            <textarea rows={3} value={f.description} onChange={e => maj({ description: e.target.value })} />
          </Champ>
          <div className="flex flex-wrap gap-6 pt-1">
            <Interrupteur label="Publié" actif={f.publie} changer={v => maj({ publie: v })} />
            {categorie === 'doublage' && <Interrupteur label="À la une sur l'accueil" actif={f.a_la_une} changer={v => maj({ a_la_une: v })} />}
          </div>
        </fieldset>

        <fieldset className="grid content-start gap-4">
          <legend className="sr-only">Source</legend>
          <div role="radiogroup" aria-label="Source" className="flex w-fit rounded-full border border-white/12 p-1">
            {(['fichier', 'youtube'] as const).map(s => (
              <button key={s} type="button" role="radio" aria-checked={source === s} onClick={() => setSource(s)} className={cn('rounded-full px-4 py-1.5 text-[0.95rem] font-semibold transition-colors', source === s ? 'bg-creme text-encre' : 'text-creme')}>
                {s === 'fichier' ? 'Fichier' : 'YouTube'}
              </button>
            ))}
          </div>

          {source === 'youtube' ? (
            <Champ label="Lien YouTube" aide={lien && !id ? "Ce lien YouTube n'est pas reconnu." : undefined}>
              <input value={lien} onChange={e => setLien(e.target.value)} placeholder="https://youtu.be/…" inputMode="url" />
            </Champ>
          ) : (
            <div className="grid gap-3">
              <p className="text-[0.92rem] text-doux">Le premier fichier est la version principale. Ajoute d'autres qualités (720p, 480p…) si tu les as exportées.</p>
              {fichiers.liste.length > 0 && (
                <ul className="grid gap-2">
                  {fichiers.liste.map(e => (
                    <LigneEnvoi key={e.id} e={e} retirer={() => fichiers.retirer(e.id)} reessayer={() => fichiers.reessayer(e)}>
                      <input aria-label={`Qualité de ${e.nom}`} value={e.label} onChange={ev => fichiers.changer(e.id, { label: ev.target.value })} placeholder="Qualité" className="champ-court" />
                    </LigneEnvoi>
                  ))}
                </ul>
              )}
              <ChoisirFichier label={fichiers.liste.length ? 'Ajouter une qualité' : 'Choisir un fichier'} accept="video/*,audio/*" multiple choisir={ajouterFichiers} />
            </div>
          )}

          <div className="grid gap-3 border-t border-white/8 pt-4">
            <p className="font-semibold">Miniature</p>
            {apercu && <img src={apercu} alt="Aperçu de la miniature" className="aspect-video w-full max-w-sm rounded-lg object-cover" />}
            {image.liste
              .filter(e => e.etat !== 'ok')
              .map(e => (
                <ul key={e.id}>
                  <LigneEnvoi e={e} retirer={() => image.retirer(e.id)} reessayer={() => image.reessayer(e)} />
                </ul>
              ))}
            <div className="flex flex-wrap gap-2">
              <ChoisirFichier label={image.cles.length ? 'Changer la miniature' : 'Choisir une image'} accept="image/*" choisir={([fi]) => fi && image.ajouter(fi, true)} />
              {image.cles.length > 0 && (
                <button type="button" className="bouton bouton-petit" onClick={() => image.liste.forEach(e => image.retirer(e.id))}>
                  Retirer
                </button>
              )}
            </div>
            {source === 'youtube' && !image.cles.length && <p className="text-[0.9rem] text-doux">Sans image, la miniature YouTube est utilisée.</p>}
          </div>
        </fieldset>
      </div>

      {erreur && (
        <p role="alert" className="text-rec">
          {erreur}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" className="bouton bouton-plein" disabled={occupe}>
          {enregistrement ? 'Enregistrement…' : occupe ? 'Envoi en cours…' : 'Enregistrer'}
        </button>
        <button type="button" className="bouton" onClick={annuler}>
          Annuler
        </button>
      </div>
    </form>
  )
}
