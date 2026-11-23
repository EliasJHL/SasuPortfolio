/* SasuGame : le lanceur de jeux de Sasu, mis en scène comme l'accueil. Le nom et le logo, le texte qui s'allume
   au défilement, le lanceur étape par étape, les jeux, la pellicule des maps, puis le lien vers le site.
   Ajouter un jeu : ses images dans public/sasugame, puis une fiche dans JEUX. */
import { Globe } from 'lucide-react'
import { motion, useMotionValueEvent, useScroll, useSpring, useTransform } from 'motion/react'
import { useRef, useState } from 'react'
import { allerA, cn } from '@/lib/utils'
import ClickSpark from '@/components/ClickSpark'
import { Canal, TitreMonte } from '@/components/Contact'
import LightRays from '@/components/LightRays'
import { LogoSasuGame } from '@/components/LogoSasuGame'
import TextPressure from '@/components/TextPressure'
import { Bande } from '@/components/Videos'
import { BorderBeam } from '@/components/ui/border-beam'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { TextReveal } from '@/components/ui/text-reveal'

const SITE = 'https://sasugame.fr'
const IMG = '/sasugame/'

const ETAPES = [
  { titre: 'Tu le télécharges', texte: "Sur sasugame.fr, tu récupères l'installateur. C'est gratuit, et il te faut un PC sous Windows 10 ou 11 (64 bits).", image: 'site.webp', alt: 'Accueil du site sasugame.fr, avec le logo et le bouton de téléchargement' },
  { titre: 'Tu choisis un jeu', texte: "La bibliothèque montre tous les jeux que j'ai sortis. Les suivants y arrivent avec les mises à jour du lanceur.", image: 'lanceur-biblio.webp', alt: 'Bibliothèque du lanceur SasuGame, avec Nuke Party et un emplacement pour les prochains jeux' },
  { titre: 'Tu lances la partie', texte: "Un seul bouton, et le jeu s'ouvre directement dans sa dernière version. Rien à mettre à jour à la main.", image: 'lanceur-jouer.webp', alt: 'Page de Nuke Party dans le lanceur, onglet Jouer' },
  { titre: 'Tu invites tes potes', texte: "Ton PC peut héberger la partie. Tu envoies le lien, ils le collent dans l'onglet Rejoindre, et vous jouez ensemble.", image: 'lanceur-heberger.webp', alt: 'Page de Nuke Party dans le lanceur, onglet Héberger' },
]

const JEUX = [
  {
    id: 'nukeparty',
    nom: 'Nuke Party',
    accroche: 'Le battle royale de nukes entre potes.',
    texte: 'Tu tombes dans une arène, tu ramasses tout ce qui traîne et tu fais sauter les autres. Roquettes, mines, kart, bouclier, épée, objets surprises et coups spéciaux : le dernier debout gagne la manche, puis tout le monde vote pour la map suivante.',
    fiche: [
      ['Joueurs', '2 à 10, en ligne'],
      ['Maps', '24, choisies par vote'],
      ['Imprévus', "Météores, séisme, tornade, pluie d'objets"],
      ['Ton perso', 'Tenues, danses et collection à débloquer'],
      ['Langues', '7, dont le français et le japonais'],
    ],
  },
]

const MAPS = [
  ['pirate', 'Pirates'],
  ['halloween', 'Halloween'],
  ['japon', 'Japon'],
  ['ville', 'Ville'],
  ['bonbons', 'Bonbons'],
  ['lune', 'Lune'],
  ['volcan', 'Volcan'],
  ['pianogeant', 'Piano géant'],
]

/** Le nom respire derrière le logo ; au défilement, la caméra traverse le nom (comme sur l'accueil). */
function Ouverture() {
  const zone = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: zone, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 380, damping: 48, restDelta: 0.0001 })
  const nomEchelle = useTransform(p, [0, 1], [1, 1.9])
  const nomOpacite = useTransform(p, [0, 0.6], [1, 0])
  const nomFlou = useTransform(p, [0, 0.6], ['blur(0px)', 'blur(14px)'])
  const logoEchelle = useTransform(p, [0, 1], [1, 1.18])
  const logoOpacite = useTransform(p, [0.55, 1], [1, 0])
  const infosOpacite = useTransform(p, [0, 0.3], [1, 0])
  const infosY = useTransform(p, [0, 0.3], [0, 60])

  return (
    <section ref={zone} aria-label="SasuGame" className="relative h-[165vh]">
      <div className="sticky top-0 flex h-svh flex-col items-center justify-center overflow-hidden px-4 pt-14 pb-24">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
          <LightRays raysOrigin="top-center" raysColor="#f3c46b" raysSpeed={0.5} lightSpread={0.8} rayLength={1.5} followMouse mouseInfluence={0.06} cursorShadow={false} clickPulse={false} intensity={0.7} />
        </div>
        <motion.div style={{ scale: nomEchelle, opacity: nomOpacite, filter: nomFlou }} className="relative aspect-[4/1] w-[min(92vw,130svh)] shrink-0 origin-[50%_70%]">
          <TextPressure
            text="SasuGame"
            fontFamily="'Anybody Titre', Anybody"
            fontUrl="https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@50..150,100..900&display=swap"
            italic={false}
            idle="wave"
            idleSpeed={0.7}
            textColor="var(--color-creme)"
            pressureColor="#e2a63b"
            minFontSize={64}
          />
        </motion.div>
        <motion.div style={{ scale: logoEchelle, opacity: logoOpacite }} className="relative mt-[clamp(8px,2svh,24px)] size-[min(32svh,60vw,320px)] shrink-0 sm:-mt-[7svh]">
          <LogoSasuGame className="size-full drop-shadow-[0_24px_70px_rgb(0_0_0/.6)]" />
        </motion.div>
        <motion.div style={{ opacity: infosOpacite, y: infosY }} className="relative mt-7 flex flex-col items-center gap-5 text-center">
          <p className="max-w-[44ch] text-[clamp(1.05rem,1rem+0.4vw,1.3rem)] text-balance text-doux">Mon lanceur gratuit pour Windows, avec tous les jeux que je crée dedans.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <ShimmerButton href={SITE} background="var(--color-creme)" shimmerColor="#e2a63b" shimmerSize="0.1em" className="min-h-12 gap-2.5 border-creme px-6 font-semibold text-encre no-underline">
              Aller sur sasugame.fr
            </ShimmerButton>
            <a href="#lanceur" onClick={allerA('lanceur')} className="bouton">
              Voir le lanceur
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/** Grand écran : les étapes s'ouvrent et les captures se relaient au défilement. Petit écran : chaque étape avec sa capture, l'une sous l'autre. */
function Lanceur() {
  const zone = useRef<HTMLDivElement>(null)
  const [actif, setActif] = useState(0)
  const { scrollYProgress } = useScroll({ target: zone, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', v => setActif(Math.min(ETAPES.length - 1, Math.floor(v * ETAPES.length))))
  const trait = useSpring(scrollYProgress, { stiffness: 200, damping: 40 })

  return (
    <section id="lanceur" tabIndex={-1} aria-labelledby="titre-lanceur" className="mx-auto max-w-[1400px] px-(--gouttiere) pt-[clamp(64px,10vh,120px)] outline-none">
      <h2 id="titre-lanceur" className="titre">
        Le lanceur
      </h2>
      <p className="mt-5 max-w-[56ch] text-[clamp(1.05rem,1rem+0.4vw,1.3rem)] text-doux">Un lanceur, c'est un programme qui range tes jeux au même endroit, les garde à jour et les ouvre en un clic. Voilà comment ça se passe avec le mien.</p>
      <div ref={zone} className="relative mt-12 lg:mt-0 lg:h-[340vh]">
        <div className="lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:pb-16">
          <div className="relative w-full">
            <span className="absolute inset-y-1 left-0 w-px bg-white/12 max-lg:hidden" aria-hidden="true" />
            <motion.span style={{ scaleY: trait }} className="absolute inset-y-1 left-0 w-px origin-top bg-or max-lg:hidden" aria-hidden="true" />
            <ol className="grid gap-14 lg:grid-cols-[minmax(0,4fr)_minmax(0,9fr)] lg:gap-x-12 lg:gap-y-[min(4svh,32px)]">
              {ETAPES.map((e, i) => (
                <li key={e.image} className="lg:contents">
                  <div style={{ gridRow: i + 1 }} className={cn('transition-opacity duration-500 lg:col-start-1 lg:self-center lg:pl-8', i !== actif && 'lg:opacity-45')}>
                    <h3 className="text-[clamp(1.6rem,1rem+1.6vw,2.4rem)] leading-[1.02] font-extrabold tracking-tight [font-variation-settings:'wdth'_70]">{e.titre}</h3>
                    <div className={cn('grid grid-rows-[1fr] transition-[grid-template-rows] duration-500', i !== actif && 'lg:grid-rows-[0fr]')}>
                      <p className="max-w-[44ch] min-h-0 overflow-hidden text-doux"><span className="block pt-2">{e.texte}</span></p>
                    </div>
                  </div>
                  <div className={cn('relative mt-5 overflow-hidden rounded-[10px] border border-white/10 bg-cuir transition-[opacity,scale] duration-500 lg:col-start-2 lg:row-start-1 lg:row-end-5 lg:mt-0 lg:self-center', i !== actif && 'lg:scale-[.97] lg:opacity-0')}>
                    <img src={IMG + e.image} alt={e.alt} width={1440} height={860} loading="lazy" decoding="async" className="block h-auto w-full" />
                    {i === actif && <BorderBeam size={180} duration={7} colorFrom="#e2a63b" colorTo="#f2e8d5" borderWidth={1.5} />}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

function Jeu({ j }: { j: (typeof JEUX)[number] }) {
  const cadre = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: cadre, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  return (
    <article className="mt-[clamp(36px,6vh,64px)]">
      <div className="relative mb-[clamp(72px,9vw,130px)]">
        <div ref={cadre} className="aspect-video overflow-hidden rounded-[10px] bg-cuir">
          <motion.img style={{ y, scale: 1.13 }} src={`${IMG}${j.id}.webp`} alt={`Les personnages de ${j.nom} dans une arène`} width={1920} height={1080} loading="lazy" decoding="async" className="size-full object-cover" />
        </div>
        <h3 className="absolute bottom-0 left-[4%] w-[min(46%,460px)] translate-y-[38%]">
          <img src={`${IMG}${j.id}-logo.webp`} alt={j.nom} width={900} height={565} loading="lazy" decoding="async" className="h-auto w-full drop-shadow-[0_18px_40px_rgb(0_0_0/.55)]" />
        </h3>
      </div>
      <div className="grid gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div>
          <p className="text-[clamp(1.6rem,1rem+2vw,2.8rem)] leading-[1.05] font-extrabold tracking-tight text-balance [font-variation-settings:'wdth'_70]">{j.accroche}</p>
          <p className="mt-5 max-w-[58ch] text-[1.05rem] text-doux">{j.texte}</p>
          <a href={`${SITE}/jeux/${j.id}`} target="_blank" rel="noopener" className="bouton mt-8">
            Voir {j.nom} sur sasugame.fr
          </a>
        </div>
        <dl className="border-b border-white/10">
          {j.fiche.map(([nom, valeur]) => (
            <div key={nom} className="grid grid-cols-[7rem_1fr] gap-4 border-t border-white/10 py-3.5">
              <dt className="text-doux">{nom}</dt>
              <dd className="font-semibold">{valeur}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  )
}

export function SasuGame() {
  return (
    <>
      <Ouverture />
      <section aria-label="À quoi sert SasuGame">
        <TextReveal>{"SasuGame, c'est l'endroit où je sors les jeux que je crée : des vrais projets, des tests, des idées à essayer entre potes. Tu installes un seul programme, et chaque nouveau jeu arrive dedans."}</TextReveal>
      </section>
      <Lanceur />
      <section aria-labelledby="titre-jeux" className="mx-auto max-w-[1180px] px-(--gouttiere) pt-[clamp(80px,14vh,160px)]">
        <h2 id="titre-jeux" className="titre">
          Les jeux
        </h2>
        <p className="mt-5 max-w-[56ch] text-[clamp(1.05rem,1rem+0.4vw,1.3rem)] text-doux">Nuke Party est le premier. Mes prochains projets et mes tests sortiront au même endroit.</p>
        {JEUX.map(j => (
          <Jeu key={j.id} j={j} />
        ))}
      </section>
      <Bande
        id="maps"
        titre="Les maps"
        compte={`${MAPS.length} sur 24`}
        plans={MAPS.map(([id, nom]) => ({
          cle: id,
          vue: style => <motion.img style={style} src={`${IMG}maps/${id}.webp`} alt={`La map ${nom} de Nuke Party`} width={1600} height={900} loading="lazy" decoding="async" className="aspect-video w-full rounded-[10px] bg-cuir object-cover" />,
          legende: <h3 className="mt-4 text-[clamp(1.15rem,1rem+0.6vw,1.5rem)] leading-tight font-bold">{nom}</h3>,
        }))}
        fin={
          <a href={`${SITE}/jeux/nukeparty`} target="_blank" rel="noopener" className="group grid aspect-video place-items-center rounded-[10px] border border-dashed border-creme/25 text-center no-underline transition-colors hover:border-or">
            <span className="px-6 text-[clamp(1.8rem,1.2rem+2.4vw,3.4rem)] leading-none font-extrabold text-creme [font-variation-settings:'wdth'_70] group-hover:text-or">Les autres maps t'attendent en jeu</span>
          </a>
        }
      />
      <section aria-labelledby="titre-site" className="mx-auto max-w-[1180px] px-(--gouttiere) pt-[clamp(80px,14vh,160px)] pb-40">
        <TitreMonte id="titre-site" texte={"On se fait une partie ?"} />
        <p className="mt-8 max-w-[46ch] text-[clamp(1.05rem,1rem+0.4vw,1.3rem)] text-doux">Le lanceur et les jeux sont gratuits. Si tu trouves un bug ou si tu as une idée, mes MP Discord sont ouverts.</p>
        <div className="mt-16 border-b border-white/12">
          <ClickSpark sparkColor={['#e2a63b', '#f2e8d5', '#ff7a1a']} sparkCount={14} sparkRadius={34} shape="star" className="h-auto">
            <Canal icone={<Globe className="size-5" aria-hidden="true" />} nom="Le site" id="sasugame.fr">
              <a href={SITE} target="_blank" rel="noopener" className="bouton bouton-plein bouton-petit">
                Ouvrir le site
              </a>
            </Canal>
          </ClickSpark>
        </div>
      </section>
    </>
  )
}
