/* La vitrine : profil Discord, bio, pellicule et castings à la une, contact. */
import { useContenu } from '@/contenu'
import type { ProfilDiscord } from '@/discord'
import { oeuvres, type Profil as ProfilSasu } from '@/lib/projets'
import { Castings } from '@/components/Castings'
import { Contact } from '@/components/Contact'
import { Profil } from '@/components/Profil'
import { Pellicule } from '@/components/Videos'
import { TextReveal } from '@/components/ui/text-reveal'

export function Accueil({ discord, profil }: { discord: ProfilDiscord | null; profil: ProfilSasu }) {
  const doublages = useContenu().medias.filter(m => m.categorie === 'doublage' && m.publie)
  const une = doublages.filter(m => m.a_la_une)

  return (
    <>
      <Profil discord={discord} profil={profil} />
      {profil.bio.length > 0 && (
        <section id="voix" tabIndex={-1} aria-label="Voix" className="outline-none">
          <TextReveal>{profil.bio.join(' ')}</TextReveal>
        </section>
      )}
      <Pellicule medias={une.filter(m => m.genre === 'video')} />
      <Castings oeuvres={oeuvres(doublages)} pistes={une.filter(m => m.genre === 'audio')} />
      <Contact profil={profil} />
    </>
  )
}
