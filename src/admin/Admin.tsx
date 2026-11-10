/* Espace admin : connexion Discord, puis un onglet par type de contenu. Chargé à la demande. */
import { motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { connecter, deconnecter, useContenu } from '@/contenu'
import { cn } from '@/lib/utils'
import { DISCORD, Logo } from '@/components/Icones'
import { CVAdmin } from '@/admin/CVAdmin'
import { MediasAdmin } from '@/admin/Medias'
import { ProfilAdmin } from '@/admin/ProfilAdmin'

const ONGLETS = [
  { id: 'doublage', label: 'Doublage' },
  { id: 'montage', label: 'Vidéos' },
  { id: 'production', label: 'Production' },
  { id: 'cv', label: 'CV' },
  { id: 'profil', label: 'Profil' },
] as const
type Onglet = (typeof ONGLETS)[number]['id']

function Porte({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[80svh] place-items-center px-(--gouttiere) pt-24 text-center">
      <div className="grid max-w-md justify-items-center gap-6">
        <h1 className="titre">Admin</h1>
        {children}
      </div>
    </div>
  )
}

export default function Admin() {
  const { session, admin } = useContenu()
  const echec = new URLSearchParams(location.search).get('error_description')

  if (session === undefined || (session && admin === undefined))
    return (
      <Porte>
        <p className="text-doux">Vérification du compte…</p>
      </Porte>
    )
  if (!session)
    return (
      <Porte>
        <p className="text-lg text-doux">Connecte-toi avec un compte Discord autorisé pour gérer le site.</p>
        {echec && (
          <p role="alert" className="text-rec">
            La connexion a échoué : {echec}
          </p>
        )}
        <button type="button" className="bouton bouton-plein" onClick={() => connecter()}>
          <Logo d={DISCORD} className="size-5" /> Se connecter avec Discord
        </button>
      </Porte>
    )
  if (!admin)
    return (
      <Porte>
        <p className="text-lg">Ce compte Discord n'a pas accès à l'admin.</p>
        <button type="button" className="bouton" onClick={() => deconnecter()}>
          Se déconnecter
        </button>
      </Porte>
    )
  return <Tableau nom={session.user.user_metadata.full_name ?? session.user.user_metadata.name} />
}

function Tableau({ nom }: { nom?: string }) {
  const [onglet, setOnglet] = useState<Onglet>('doublage')

  return (
    <div className="mx-auto max-w-[1100px] px-(--gouttiere) pt-24 pb-32">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="titre">Admin</h1>
        <div className="flex items-center gap-3 pb-2 text-doux">
          {nom && <span>Connecté en tant que {nom}</span>}
          <button type="button" className="bouton bouton-petit" onClick={() => deconnecter()}>
            Se déconnecter
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="Contenu à gérer" className="mt-8 flex gap-1 overflow-x-auto border-b border-white/10">
        {ONGLETS.map(o => (
          <button
            key={o.id}
            id={`onglet-${o.id}`}
            type="button"
            role="tab"
            aria-selected={onglet === o.id}
            aria-controls="panneau"
            onClick={() => setOnglet(o.id)}
            className={cn('relative shrink-0 px-4 py-3 font-semibold transition-colors', onglet === o.id ? 'text-creme' : 'text-doux hover:text-creme')}
          >
            {o.label}
            {onglet === o.id && <motion.span layoutId="onglet-actif" className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-or" />}
          </button>
        ))}
      </div>

      <div id="panneau" role="tabpanel" aria-labelledby={`onglet-${onglet}`} className="mt-8">
        {onglet === 'cv' ? <CVAdmin /> : onglet === 'profil' ? <ProfilAdmin /> : <MediasAdmin key={onglet} categorie={onglet} />}
      </div>
    </div>
  )
}
