/* Acte 5 — le contact. Le titre monte mot par mot au rythme du défilement. */
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef, type ReactNode } from 'react'
import type { Profil } from '@/lib/projets'
import { toast } from '@/lib/utils'
import ClickSpark from '@/components/ClickSpark'
import { DISCORD, INSTAGRAM, Logo, YOUTUBE } from '@/components/Icones'

const TITRE = 'Un rôle à caster, un projet à monter ?'

function Mot({ children, i, n, p }: { children: string; i: number; n: number; p: MotionValue<number> }) {
  const debut = (i / n) * 0.6
  const y = useTransform(p, [debut, debut + 0.4], ['110%', '0%'])
  const rotate = useTransform(p, [debut, debut + 0.4], [8, 0])
  return (
    <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <motion.span style={{ y, rotate }} className="inline-block origin-bottom-left">
        {children}
      </motion.span>
    </span>
  )
}

function Canal({ icone, nom, id, children }: { icone: string; nom: string; id: string; children: ReactNode }) {
  return (
    <div className="canal group relative grid items-center gap-x-8 gap-y-4 border-t border-white/12 py-7 md:grid-cols-[11rem_1fr_auto]">
      <p className="flex items-center gap-3 text-doux transition-colors group-hover:text-encre">
        <Logo d={icone} className="size-5" />
        {nom}
      </p>
      <p className="truncate text-[clamp(2rem,1.2rem+3.6vw,4.4rem)] leading-none font-extrabold tracking-tight transition-colors [font-variation-settings:'wdth'_62] group-hover:text-encre">{id}</p>
      <div className="flex flex-wrap gap-2.5">{children}</div>
    </div>
  )
}

export function Contact({ profil }: { profil: Profil }) {
  const pseudo = profil.contact_discord
  const titre = useRef<HTMLHeadingElement>(null)
  const { scrollYProgress } = useScroll({ target: titre, offset: ['start end', 'end 55%'] })
  const mots = TITRE.split(' ')

  const copier = async () => {
    try {
      await navigator.clipboard.writeText(pseudo!)
      toast('Pseudo copié : ' + pseudo)
    } catch {
      toast('Mon pseudo Discord : ' + pseudo)
    }
  }

  return (
    <section id="contact" tabIndex={-1} aria-labelledby="titre-contact" className="mx-auto max-w-[1180px] px-(--gouttiere) pt-[clamp(80px,14vh,160px)] pb-40 outline-none">
      <h2 ref={titre} id="titre-contact" aria-label={TITRE} className="max-w-[16ch] font-serif text-[clamp(2.8rem,1.4rem+6vw,7rem)] leading-[0.98] font-light tracking-[-0.02em]">
        <span aria-hidden="true">
          {mots.map((m, i) => (
            <span key={i}>
              <Mot i={i} n={mots.length} p={scrollYProgress}>
                {m}
              </Mot>{' '}
            </span>
          ))}
        </span>
      </h2>
      <p className="mt-8 max-w-[46ch] text-[clamp(1.05rem,1rem+0.4vw,1.3rem)] text-doux">Mes MP sont ouverts. Dis-moi le projet, le personnage et tes délais, je te réponds vite.</p>

      <div className="mt-16 border-b border-white/12">
        {pseudo && (
          <ClickSpark sparkColor={['#e2a63b', '#f2e8d5', '#23a55a']} sparkCount={14} sparkRadius={34} shape="star" className="h-auto">
            <Canal icone={DISCORD} nom="Discord" id={pseudo}>
              <button type="button" onClick={copier} className="bouton bouton-plein bouton-petit">
                Copier le pseudo
              </button>
              <a className="bouton bouton-petit" href={`https://discord.com/users/${profil.discord_id}`} target="_blank" rel="noopener">
                Ouvrir le profil
              </a>
            </Canal>
          </ClickSpark>
        )}
        {profil.instagram && (
          <Canal icone={INSTAGRAM} nom="Instagram" id={'@' + profil.instagram}>
            <a className="bouton bouton-petit" href={`https://www.instagram.com/${encodeURIComponent(profil.instagram)}/`} target="_blank" rel="noopener">
              Voir sur Instagram
            </a>
          </Canal>
        )}
        {profil.youtube && (
          <Canal icone={YOUTUBE} nom="YouTube" id={'@' + profil.youtube}>
            <a className="bouton bouton-petit" href={`https://www.youtube.com/@${encodeURIComponent(profil.youtube)}`} target="_blank" rel="noopener">
              Voir la chaîne
            </a>
          </Canal>
        )}
      </div>
    </section>
  )
}
