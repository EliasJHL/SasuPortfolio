/* Admin du CV : expérience, formation et compétences, dans une liste triable. */
import { Pencil, Plus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { charger, useContenu } from '@/contenu'
import { periode, type LigneCV } from '@/lib/projets'
import { supabase } from '@/lib/supabase'
import { toast } from '@/lib/utils'
import { BoutonSupprimer, Champ, Triable } from '@/admin/outils'

const SECTIONS: Record<LigneCV['section'], string> = { objectif: 'Objectif', experience: 'Expérience', formation: 'Formation', competence: 'Compétence', interet: "Centre d'intérêt" }
// le CV se lit en années ; la base stocke une date au 1er janvier
const versAnnee = (d: string | null) => d?.slice(0, 4) ?? ''
const versDate = (a: string) => (/^\d{4}$/.test(a) ? a + '-01-01' : null)

export function CVAdmin() {
  const { cv } = useContenu()
  const [edition, setEdition] = useState<LigneCV | 'nouveau' | null>(null)

  if (edition) return <FormCV l={edition === 'nouveau' ? null : edition} ordre={cv.length} fermer={() => setEdition(null)} />

  const supprimer = async (l: LigneCV) => {
    const { error } = await supabase.from('cv').delete().eq('id', l.id)
    if (error) return toast('Suppression refusée : ' + error.message)
    await charger()
    toast('Supprimé.')
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-doux">{cv.length ? "Sur le site, les lignes sont regroupées par section, dans l'ordre de cette liste." : 'Le CV est vide.'}</p>
        <button type="button" className="bouton bouton-plein bouton-petit" onClick={() => setEdition('nouveau')}>
          <Plus className="size-4" /> Ajouter
        </button>
      </div>
      <Triable
        table="cv"
        items={cv}
        rendu={(l, poignee) => (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-white/8 bg-cuir/70 p-2 pr-3">
            <div className="flex min-w-0 flex-1 basis-64 items-center gap-3">
              {poignee}
              <span className="w-28 shrink-0 rounded bg-white/8 px-2 py-0.5 text-center text-sm">{SECTIONS[l.section]}</span>
              <div className="min-w-0">
                <p className="truncate font-bold">{l.titre}</p>
                <p className="truncate text-sm text-doux">{[l.structure, periode(l.debut, l.fin)].filter(Boolean).join(', ') || l.description}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="bouton bouton-petit" onClick={() => setEdition(l)}>
                <Pencil className="size-4" /> Modifier
              </button>
              <BoutonSupprimer nom={l.titre} supprimer={() => supprimer(l)} />
            </div>
          </div>
        )}
      />
    </>
  )
}

function FormCV({ l, ordre, fermer }: { l: LigneCV | null; ordre: number; fermer: () => void }) {
  const [f, setF] = useState({
    section: l?.section ?? ('experience' as LigneCV['section']),
    titre: l?.titre ?? '',
    structure: l?.structure ?? '',
    lieu: l?.lieu ?? '',
    debut: versAnnee(l?.debut ?? null),
    fin: versAnnee(l?.fin ?? null),
    enCours: !!l?.debut && !l.fin,
    description: l?.description ?? '',
  })
  const maj = (p: Partial<typeof f>) => setF(x => ({ ...x, ...p }))
  const [erreur, setErreur] = useState('')
  // seules l'expérience et la formation ont structure, lieu et dates
  const avecDates = f.section === 'experience' || f.section === 'formation'
  const sansTitre = f.section === 'objectif'
  const sansTexte = f.section === 'interet'

  const enregistrer = async (e: FormEvent) => {
    e.preventDefault()
    const ligne = {
      section: f.section,
      titre: sansTitre ? 'Objectif' : f.titre.trim(),
      structure: avecDates ? f.structure.trim() || null : null,
      lieu: avecDates ? f.lieu.trim() || null : null,
      debut: avecDates ? versDate(f.debut) : null,
      fin: avecDates && !f.enCours ? versDate(f.fin) : null,
      description: sansTexte ? null : f.description.trim() || null,
      ordre: l?.ordre ?? ordre,
    }
    const { error } = l ? await supabase.from('cv').update(ligne).eq('id', l.id) : await supabase.from('cv').insert(ligne)
    if (error) return setErreur(`Enregistrement refusé : ${error.message}`)
    await charger()
    toast('Enregistré.')
    fermer()
  }

  return (
    <form onSubmit={enregistrer} className="grid max-w-2xl gap-4">
      <h2 className="mb-2 text-2xl font-extrabold">{l ? `Modifier « ${l.titre} »` : 'Nouvelle ligne'}</h2>
      <Champ label="Section">
        <select value={f.section} onChange={e => maj({ section: e.target.value as LigneCV['section'] })}>
          {Object.entries(SECTIONS).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </Champ>
      {!sansTitre && (
        <Champ label={avecDates ? 'Intitulé' : SECTIONS[f.section]}>
          <input required value={f.titre} onChange={e => maj({ titre: e.target.value })} placeholder={avecDates ? 'CAP Électricien' : 'Musique'} />
        </Champ>
      )}
      {avecDates && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label={f.section === 'formation' ? 'École' : 'Structure'}>
              <input value={f.structure} onChange={e => maj({ structure: e.target.value })} />
            </Champ>
            <Champ label="Lieu">
              <input value={f.lieu} onChange={e => maj({ lieu: e.target.value })} />
            </Champ>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Champ label="Début (année)">
              <input type="number" min={1950} max={2100} value={f.debut} onChange={e => maj({ debut: e.target.value })} placeholder="2024" />
            </Champ>
            <Champ label="Fin (année)">
              <input type="number" min={1950} max={2100} value={f.enCours ? '' : f.fin} disabled={f.enCours} onChange={e => maj({ fin: e.target.value })} placeholder="2026" />
            </Champ>
          </div>
          <label className="inline-flex w-fit cursor-pointer items-center gap-2">
            <input type="checkbox" className="interrupteur" role="switch" checked={f.enCours} onChange={e => maj({ enCours: e.target.checked })} />
            En cours
          </label>
        </>
      )}
      {!sansTexte && (
        <Champ label={sansTitre ? 'Texte affiché en introduction du CV' : 'Description'}>
          <textarea rows={sansTitre ? 6 : 4} required={sansTitre} value={f.description} onChange={e => maj({ description: e.target.value })} />
        </Champ>
      )}
      {erreur && (
        <p role="alert" className="text-rec">
          {erreur}
        </p>
      )}
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" className="bouton bouton-plein">
          Enregistrer
        </button>
        <button type="button" className="bouton" onClick={fermer}>
          Annuler
        </button>
      </div>
    </form>
  )
}
