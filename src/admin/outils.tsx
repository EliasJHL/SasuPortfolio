/* Outils de l'admin : envois vers R2 (URL signée par l'Edge Function « medias »),
   listes triables (glisser ou flèches du clavier), champs et boutons communs. */
import { Reorder, useDragControls } from 'motion/react'
import { Check, GripVertical, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { charger } from '@/contenu'
import { estCle } from '@/lib/projets'
import { supabase } from '@/lib/supabase'
import { cn, toast } from '@/lib/utils'

export type Dossier = 'doublage' | 'montage' | 'production' | 'profil' | 'miniatures'

async function appeler(corps: object) {
  const { data, error } = await supabase.functions.invoke('medias', { body: corps })
  if (error) {
    const status = (error as { context?: Response }).context?.status
    throw new Error(status === 403 ? "Ta session n'a pas les droits admin. Reconnecte-toi." : "Le service d'envoi ne répond pas.")
  }
  return data
}

/** Envoie un fichier sur R2 et renvoie sa clé (ex. « doublage/3f2a….mp4 »). */
export async function envoyer(f: File, dossier: Dossier, progres: (p: number) => void): Promise<string> {
  const extension = f.name.split('.').pop()?.toLowerCase() ?? ''
  if (!/^(video|audio|image)\//.test(f.type) || !/^[a-z0-9]{1,5}$/.test(extension)) throw new Error('Format de fichier non reconnu.')
  const { envoi, cle } = await appeler({ action: 'envoyer', dossier, type: f.type, extension })
  await new Promise<void>((ok, ko) => {
    const x = new XMLHttpRequest()
    x.open('PUT', envoi)
    x.setRequestHeader('content-type', f.type)
    x.upload.onprogress = e => e.lengthComputable && progres(e.loaded / e.total)
    x.onload = () => (x.status < 300 ? ok() : ko(new Error("Échec de l'envoi.")))
    x.onerror = () => ko(new Error("Échec de l'envoi."))
    x.send(f)
  })
  return cle
}

// ponytail: un échec laisse un fichier orphelin sur R2, sans effet sur le site
export const supprimerFichiers = (cles: (string | null | undefined)[]) => Promise.allSettled([...new Set(cles.filter(estCle))].map(cle => appeler({ action: 'supprimer', cle })))

export type Envoi = { id: string; nom: string; label: string; cle?: string; type?: string; progres: number; etat: 'envoi' | 'ok' | 'erreur'; erreur?: string; fichier?: File }
export const existant = (cle: string, label = ''): Envoi => ({ id: cle, nom: cle.split('/').pop()!, label, cle, progres: 1, etat: 'ok' })

/** Une liste de fichiers envoyés au fil de l'eau ; `nouvelles` garde les clés créées pendant le formulaire. */
export function useEnvois(dossier: Dossier, initiales: Envoi[]) {
  const [liste, setListe] = useState(initiales)
  const nouvelles = useRef<string[]>([])
  const changer = (id: string, p: Partial<Envoi>) => setListe(l => l.map(e => (e.id === id ? { ...e, ...p } : e)))
  const lancer = async (e: Envoi) => {
    changer(e.id, { etat: 'envoi', progres: 0, erreur: undefined })
    try {
      const cle = await envoyer(e.fichier!, dossier, p => changer(e.id, { progres: p }))
      nouvelles.current.push(cle)
      changer(e.id, { etat: 'ok', cle })
    } catch (err) {
      changer(e.id, { etat: 'erreur', erreur: (err as Error).message })
    }
  }
  const ajouter = (f: File, remplacer = false) => {
    const e: Envoi = { id: crypto.randomUUID(), nom: f.name, label: '', type: f.type, progres: 0, etat: 'envoi', fichier: f }
    setListe(l => (remplacer ? [e] : [...l, e]))
    lancer(e)
    return e.id
  }
  return {
    liste,
    ajouter,
    changer,
    nouvelles,
    reessayer: lancer,
    retirer: (id: string) => setListe(l => l.filter(e => e.id !== id)),
    enCours: liste.some(e => e.etat === 'envoi'),
    cles: liste.filter(e => e.etat === 'ok').map(e => e.cle!),
  }
}

export function LigneEnvoi({ e, retirer, reessayer, children }: { e: Envoi; retirer: () => void; reessayer: () => void; children?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-cuir/60 px-4 py-2.5">
      <span className="min-w-0 flex-1 truncate text-[0.95rem]">{e.nom}</span>
      {children}
      {e.etat === 'envoi' && (
        <span role="progressbar" aria-label={`Envoi de ${e.nom}`} aria-valuenow={Math.round(e.progres * 100)} className="h-1.5 w-28 overflow-hidden rounded-full bg-white/10">
          <span className="block h-full bg-or transition-[width]" style={{ width: e.progres * 100 + '%' }} />
        </span>
      )}
      {e.etat === 'erreur' && (
        <>
          <span className="text-[0.9rem] text-rec">{e.erreur}</span>
          <button type="button" className="bouton bouton-petit" onClick={reessayer}>
            Réessayer
          </button>
        </>
      )}
      {e.etat === 'ok' && <Check className="size-4 text-[#23a55a]" aria-label="Envoyé" />}
      <button type="button" className="cmd size-8" onClick={retirer} aria-label={`Retirer ${e.nom}`}>
        <X className="size-4" />
      </button>
    </li>
  )
}

/** Bouton fichier stylé ; `accept` comme pour un input natif. */
export function ChoisirFichier({ label, accept, multiple, choisir }: { label: string; accept: string; multiple?: boolean; choisir: (f: File[]) => void }) {
  return (
    <label className="bouton bouton-petit relative w-fit cursor-pointer focus-within:outline-2 focus-within:outline-or">
      {label}
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="absolute inset-0 cursor-pointer opacity-0"
        onChange={e => {
          choisir([...(e.target.files ?? [])])
          e.target.value = ''
        }}
      />
    </label>
  )
}

export function Champ({ label, aide, children }: { label: string; aide?: string; children: ReactNode }) {
  return (
    <label className="champ">
      <span>{label}</span>
      {children}
      {aide && <small>{aide}</small>}
    </label>
  )
}

export function Interrupteur({ label, actif, changer }: { label: string; actif: boolean; changer: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[0.9rem] whitespace-nowrap">
      <input type="checkbox" role="switch" className="interrupteur" checked={actif} onChange={e => changer(e.target.checked)} />
      {label}
    </label>
  )
}

/** Suppression en deux temps : le bouton demande confirmation pendant 4 s. */
export function BoutonSupprimer({ nom, supprimer }: { nom: string; supprimer: () => void }) {
  const [confirme, setConfirme] = useState(false)
  useEffect(() => {
    if (!confirme) return
    const t = setTimeout(() => setConfirme(false), 4000)
    return () => clearTimeout(t)
  }, [confirme])
  return (
    <button type="button" onClick={() => (confirme ? supprimer() : setConfirme(true))} aria-label={confirme ? `Confirmer la suppression de ${nom}` : `Supprimer ${nom}`} className={cn('bouton bouton-petit', confirme && 'border-rec! bg-rec text-creme')}>
      <Trash2 className="size-4" />
      {confirme ? 'Confirmer' : 'Supprimer'}
    </button>
  )
}

/** Liste réordonnable ; le nouvel ordre est enregistré en un seul upsert. */
export function Triable<T extends { id: string; ordre: number }>({ table, items, rendu }: { table: 'medias' | 'cv'; items: T[]; rendu: (x: T, poignee: ReactNode) => ReactNode }) {
  const [glisse, setGlisse] = useState<T[] | null>(null)
  const liste = glisse ?? items
  const sauver = async (l: T[]) => {
    const { error } = await supabase.from(table).upsert(l.map((x, i) => ({ ...x, ordre: i })))
    if (error) toast("Le nouvel ordre n'a pas été enregistré.")
    await charger()
    setGlisse(null)
  }
  const deplacer = (i: number, d: number) => {
    const j = i + d
    if (j < 0 || j >= liste.length) return
    const l = [...liste]
    ;[l[i], l[j]] = [l[j], l[i]]
    setGlisse(l)
    sauver(l)
  }
  // grid-cols-1 (minmax(0, 1fr)) : sans lui, un long texte tronqué élargit toute la liste et repousse les boutons hors de l'écran
  return (
    <Reorder.Group axis="y" values={liste} onReorder={setGlisse} className="grid grid-cols-1 gap-2">
      {liste.map((x, i) => (
        <Element key={x.id} x={x} fin={() => glisse && sauver(glisse)} deplacer={d => deplacer(i, d)}>
          {p => rendu(x, p)}
        </Element>
      ))}
    </Reorder.Group>
  )
}

function Element<T>({ x, fin, deplacer, children }: { x: T; fin: () => void; deplacer: (d: number) => void; children: (poignee: ReactNode) => ReactNode }) {
  const controles = useDragControls()
  const poignee = (
    <button
      type="button"
      aria-label="Déplacer (flèches haut et bas)"
      className="cmd size-9 shrink-0 cursor-grab touch-none text-doux active:cursor-grabbing"
      onPointerDown={e => controles.start(e)}
      onKeyDown={e => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
        e.preventDefault()
        deplacer(e.key === 'ArrowUp' ? -1 : 1)
      }}
    >
      <GripVertical className="size-4" />
    </button>
  )
  return (
    <Reorder.Item value={x} dragListener={false} dragControls={controles} onDragEnd={fin} className="relative list-none">
      {children(poignee)}
    </Reorder.Item>
  )
}
