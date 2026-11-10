/* CV : expérience et formation sur une frise qui se dessine au défilement,
   chaque étape s'allume quand la ligne l'atteint. Compétences en dessous. */
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { useRef } from 'react'
import { useContenu } from '@/contenu'
import { periode, type LigneCV } from '@/lib/projets'
import { EnTete } from '@/pages/Categorie'

function Etape({ l }: { l: LigneCV }) {
  const li = useRef<HTMLLIElement>(null)
  const { scrollYProgress } = useScroll({ target: li, offset: ['start 80%', 'start 55%'] })
  const opacity = useTransform(scrollYProgress, [0, 1], [0.35, 1])
  const lieu = [l.structure, l.lieu].filter(Boolean).join(', ')

  return (
    <motion.li ref={li} style={{ opacity }} className="relative">
      <span className="absolute top-1.5 -left-10 size-[15px] rounded-full border-2 border-or bg-nuit" aria-hidden="true">
        <motion.span style={{ scale: scrollYProgress }} className="absolute inset-[2px] rounded-full bg-or" />
      </span>
      {periode(l.debut, l.fin) && <p className="text-[0.95rem] text-doux">{periode(l.debut, l.fin)}</p>}
      <h3 className="mt-1 text-[clamp(1.4rem,1rem+1.6vw,2.2rem)] leading-tight font-extrabold [font-variation-settings:'wdth'_75]">{l.titre}</h3>
      {lieu && <p className="mt-1 text-creme/80">{lieu}</p>}
      {l.description && <p className="mt-3 max-w-[62ch] whitespace-pre-line text-doux">{l.description}</p>}
    </motion.li>
  )
}

function Frise({ titre, lignes }: { titre: string; lignes: LigneCV[] }) {
  const ol = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ol, offset: ['start 80%', 'end 55%'] })
  const trait = useSpring(scrollYProgress, { stiffness: 200, damping: 40 })

  return (
    <section className="mt-[clamp(48px,9vh,96px)]">
      <h2 className="titre text-[clamp(2.2rem,1.4rem+3.4vw,4.6rem)]">{titre}</h2>
      <ol ref={ol} className="relative mt-10 grid gap-[clamp(40px,7vh,72px)] pl-10">
        <span className="absolute top-2 bottom-2 left-[7px] w-px bg-white/12" aria-hidden="true" />
        <motion.span style={{ scaleY: trait }} className="absolute top-2 bottom-2 left-[7px] w-px origin-top bg-or" aria-hidden="true" />
        {lignes.map(l => (
          <Etape key={l.id} l={l} />
        ))}
      </ol>
    </section>
  )
}

export function CV() {
  const { cv } = useContenu()
  const section = (s: LigneCV['section']) => cv.filter(l => l.section === s)
  const competences = section('competence')

  return (
    <div className="mx-auto max-w-[980px] px-(--gouttiere) pt-28 pb-24">
      <EnTete titre="CV" />
      {section('experience').length > 0 && <Frise titre="Expérience" lignes={section('experience')} />}
      {section('formation').length > 0 && <Frise titre="Formation" lignes={section('formation')} />}
      {competences.length > 0 && (
        <section className="mt-[clamp(48px,9vh,96px)]">
          <h2 className="titre text-[clamp(2.2rem,1.4rem+3.4vw,4.6rem)]">Compétences</h2>
          <ul className="mt-8 grid gap-x-10 sm:grid-cols-2">
            {competences.map(c => (
              <li key={c.id} className="border-t border-white/10 py-4">
                <p className="text-lg font-bold">{c.titre}</p>
                {c.description && <p className="mt-1 text-doux">{c.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {!cv.length && <p className="text-lg text-doux">Le CV n'est pas encore rempli.</p>}
    </div>
  )
}
