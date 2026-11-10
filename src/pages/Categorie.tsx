/* Doublage, Vidéos (montages) et Production : grille des vidéos, puis les pistes audio.
   Les puces filtrent par œuvre ; la grille se réorganise avec motion (layout). */
import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { useContenu } from '@/contenu'
import { oeuvre, oeuvres, type Categorie as Cat, type Media } from '@/lib/projets'
import { cn } from '@/lib/utils'
import { Piste } from '@/components/Castings'
import { Lecteur } from '@/components/Lecteur'
import { Legende, Vignette } from '@/components/Videos'

const TEXTES: Record<Cat, { titre: string; intro: string; audio: string }> = {
  doublage: { titre: 'Doublage', intro: 'Tous mes extraits doublés, en vidéo et en casting audio.', audio: 'Castings audio' },
  montage: { titre: 'Vidéos', intro: 'Montages et créations vidéo.', audio: 'Audio' },
  production: { titre: 'Production', intro: 'Musiques et sons.', audio: 'Sons' },
}

/** Le titre de page arrive lettre par lettre, large, puis se resserre. */
export function EnTete({ titre, children }: { titre: string; children?: ReactNode }) {
  return (
    <header className="mb-[clamp(36px,6vh,64px)]">
      <h1 aria-label={titre} className="titre text-[clamp(3.4rem,1.6rem+8vw,9rem)]">
        <motion.span aria-hidden="true" initial={{ fontVariationSettings: "'wdth' 150" }} animate={{ fontVariationSettings: "'wdth' 55" }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} className="inline-block overflow-hidden pb-[0.06em]">
          {[...titre].map((c, i) => (
            <motion.span key={i} initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ delay: i * 0.04, type: 'spring', bounce: 0.25, duration: 0.8 }} className="inline-block whitespace-pre">
              {c}
            </motion.span>
          ))}
        </motion.span>
      </h1>
      {children && <p className="mt-5 max-w-[56ch] text-[clamp(1.05rem,1rem+0.4vw,1.3rem)] whitespace-pre-line text-doux">{children}</p>}
    </header>
  )
}

export function Categorie({ categorie }: { categorie: Cat }) {
  const { medias } = useContenu()
  const t = TEXTES[categorie]
  const tous = medias.filter(m => m.categorie === categorie && m.publie)
  const liste = oeuvres(tous)
  const [filtre, setFiltre] = useState<string | null>(null)
  const [clip, setClip] = useState<Media | null>(null)
  const vus = filtre ? tous.filter(m => oeuvre(m) === filtre) : tous
  const videos = vus.filter(m => m.genre === 'video')
  const audios = vus.filter(m => m.genre === 'audio')

  return (
    <div className="mx-auto max-w-[1180px] px-(--gouttiere) pt-28 pb-24">
      <EnTete titre={t.titre}>{t.intro}</EnTete>

      {liste.length > 1 && (
        <div role="group" aria-label="Filtrer par œuvre" className="mb-12 flex flex-wrap gap-2">
          {[null, ...liste].map(o => (
            <button key={o ?? 'toutes'} type="button" aria-pressed={filtre === o} onClick={() => setFiltre(o)} className={cn('relative isolate rounded-full border px-4 py-2 text-[0.95rem] font-semibold transition-colors', filtre === o ? 'border-or text-encre' : 'border-white/14 text-creme hover:border-or')}>
              {filtre === o && <motion.span layoutId="filtre" transition={{ type: 'spring', bounce: 0.2, duration: 0.45 }} className="absolute inset-0 -z-10 rounded-full bg-or" />}
              {o ?? 'Toutes'}
            </button>
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <motion.ul layout className="grid gap-x-[clamp(16px,2.4vw,32px)] gap-y-12 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {videos.map(m => (
              <motion.li key={m.id} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}>
                <Vignette m={m} ouvert={clip?.id === m.id} ouvrir={() => setClip(m)} />
                <Legende m={m} />
                {m.description && <p className="mt-2 text-[0.95rem] text-doux">{m.description}</p>}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {audios.length > 0 && (
        <section aria-labelledby="titre-audio" className={cn(videos.length > 0 && 'mt-[clamp(72px,12vh,140px)]')}>
          {videos.length > 0 && (
            <h2 id="titre-audio" className="titre mb-[clamp(32px,6vh,64px)] text-[clamp(2.2rem,1.4rem+3.4vw,4.6rem)]">
              {t.audio}
            </h2>
          )}
          <ul aria-label={videos.length ? undefined : t.audio} className="grid gap-[clamp(48px,9vh,96px)]">
            {audios.map(p => (
              <Piste key={p.id} p={p} />
            ))}
          </ul>
        </section>
      )}

      {!tous.length && <p className="text-lg text-doux">Rien n'est encore publié ici.</p>}
      <Lecteur clip={clip} fermer={() => setClip(null)} />
    </div>
  )
}
