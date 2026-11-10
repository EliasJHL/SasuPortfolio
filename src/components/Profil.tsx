/* Acte 1 — le profil Discord.
   Au défilement, la caméra traverse le nom et l'avatar s'envole se ranger en badge
   en haut à gauche, où il reste (et s'allume en vert quand la voix joue). */
import { AnimatePresence, motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useState } from 'react'
import { SASU } from '@/contenu'
import type { ProfilDiscord, Statut } from '@/discord'
import { cn, toast } from '@/lib/utils'
import { basculerDemo, niveau, useDemo } from '@/voix'
import LightRays from '@/components/LightRays'
import TextPressure from '@/components/TextPressure'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { IconeLecture } from '@/components/Icones'
import { allerA } from '@/components/Timeline'

const LIBELLES: Record<Statut, string> = { online: 'En ligne sur Discord', idle: 'Absent sur Discord', dnd: 'Ne pas déranger', offline: 'Hors ligne sur Discord' }
const COULEURS: Record<Statut, string> = { online: '#23a55a', idle: '#f0b232', dnd: '#f23f43', offline: '#80848e' }
const BADGE = { taille: 44, x: 38, y: 36 } // l'avatar une fois rangé

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const geometrie = (w: number, h: number) => {
  const mobile = w < 640
  const s = Math.round(Math.min(h * 0.36, w * (mobile ? 0.7 : 0.38), 360))
  return { s, cx: w / 2, cy: h * (mobile ? 0.47 : 0.53) }
}
type Geo = ReturnType<typeof geometrie>

function useEcran() {
  const [e, setE] = useState({ w: innerWidth, h: innerHeight })
  useEffect(() => {
    const maj = () => setE({ w: innerWidth, h: innerHeight })
    addEventListener('resize', maj)
    return () => removeEventListener('resize', maj)
  }, [])
  return e
}

export function Profil({ discord }: { discord: ProfilDiscord | null }) {
  const { w, h } = useEcran()
  const g = geometrie(w, h)
  const { scrollY } = useScroll()
  const p = useSpring(useTransform(scrollY, [0, h * 0.65], [0, 1], { clamp: true }), { stiffness: 380, damping: 48, restDelta: 0.0001 })
  const statut = discord && !discord.cache ? discord.statut : null

  // le nom fonce vers le visiteur et s'efface
  const nomEchelle = useTransform(p, [0, 1], [1, 1.9])
  const nomOpacite = useTransform(p, [0, 0.6], [1, 0])
  const nomFlou = useTransform(p, [0, 0.6], ['blur(0px)', 'blur(14px)'])
  const infosOpacite = useTransform(p, [0, 0.3], [1, 0])
  const infosY = useTransform(p, [0, 0.3], [0, 60])

  return (
    <section id="profil" tabIndex={-1} aria-label="Profil" className="relative h-[165vh] outline-none">
      <div className="sticky top-0 h-svh overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
          <LightRays raysOrigin="top-center" raysColor="#f3c46b" raysSpeed={0.5} lightSpread={0.8} rayLength={1.5} followMouse mouseInfluence={0.06} cursorShadow={false} clickPulse={false} intensity={0.7} />
        </div>

        {/* le nom respire comme une onde de voix et se gonfle sous le curseur */}
        <motion.div style={{ scale: nomEchelle, opacity: nomOpacite, filter: nomFlou, top: h * 0.05 }} className="absolute inset-x-0 mx-auto aspect-[2/1] w-[min(92vw,105vh)] origin-[50%_70%]">
          <TextPressure
            text={discord?.nom || SASU.profil.pseudo}
            fontFamily="Anybody"
            fontUrl="https://fonts.googleapis.com/css2?family=Anybody:wdth,wght@50..150,100..900&display=swap"
            italic={false}
            idle="wave"
            idleSpeed={0.7}
            textColor="var(--color-creme)"
            pressureColor="#e2a63b"
            minFontSize={64}
          />
        </motion.div>

        <motion.div style={{ opacity: infosOpacite, y: infosY, top: g.cy + g.s / 2 + 24 }} className="absolute inset-x-0 flex flex-col items-center gap-4 px-4 text-center">
          <div>
            <p className={cn('inline-flex items-center gap-2 rounded-full border border-white/10 bg-cuir/70 py-1 pr-3.5 pl-2.5 text-[0.9rem] backdrop-blur', !statut && 'invisible')} aria-live="polite">
              <span className="relative flex size-2.5" aria-hidden="true">
                {statut === 'dnd' && <span className="absolute inset-0 animate-ping rounded-full bg-rec opacity-60" />}
                <span className="relative size-2.5 rounded-full" style={{ background: COULEURS[statut || 'offline'] }} />
              </span>
              {LIBELLES[statut || 'offline']}
            </p>
            <p className="mt-2 flex flex-wrap items-center justify-center gap-2 text-doux">
              @{discord?.handle || SASU.profil.handle}
              {discord?.clan && (
                <span className="inline-flex items-center gap-1 rounded-md bg-cuir-2 py-px pr-2 pl-1.5 text-[0.85rem] font-semibold text-creme">
                  {discord.clan.badge && <img src={discord.clan.badge} alt="" width={16} height={16} />}
                  {discord.clan.tag}
                </span>
              )}
            </p>
            {discord?.activite && (
              <p className="mt-1 text-[0.92rem] text-doux">
                {discord.activite.perso ? `« ${discord.activite.texte} »` : `${discord.activite.prefixe} ${discord.activite.nom}`}
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <BoutonDemo />
            <a href="#contact" onClick={allerA('contact')} className="bouton">
              Me contacter
            </a>
          </div>
        </motion.div>

        <motion.span style={{ opacity: infosOpacite }} className="defiler absolute bottom-6 left-1/2 h-12 w-px -translate-x-1/2 overflow-hidden bg-white/15 max-lg:bottom-24" aria-hidden="true" />
      </div>

      <AvatarVolant key={`${w}x${h}`} g={g} p={p} discord={discord} statut={statut} />
    </section>
  )
}

function AvatarVolant({ g, p, discord, statut }: { g: Geo; p: MotionValue<number>; discord: ProfilDiscord | null; statut: Statut | null }) {
  const x = useTransform(p, v => lerp(g.cx, BADGE.x, v) - g.s / 2)
  const y = useTransform(p, v => lerp(g.cy, BADGE.y, v) - g.s / 2)
  const scale = useTransform(p, v => lerp(1, BADGE.taille / g.s, v))
  const range = useTransform(p, [0.85, 1], [0, 1])
  const clics = useTransform(p, v => (v > 0.95 ? 'auto' : 'none'))
  // l'anneau vert de Discord quand la voix parle
  const anneau = Math.max(4, g.s * 0.03)
  const parle = useTransform(niveau, n => `0 0 0 ${anneau}px rgb(35 165 90 / ${Math.min(1, n * 1.8)}), 0 0 ${g.s * 0.2}px rgb(35 165 90 / ${Math.min(0.7, n)})`)

  return (
    <>
      <motion.div style={{ x, y, scale, width: g.s, height: g.s }} className="pointer-events-none fixed top-0 left-0 z-50 origin-center" aria-hidden="true">
        <motion.img style={{ boxShadow: parle }} className="size-full rounded-full bg-cuir object-cover" src={discord?.avatar || '/favicon.svg'} alt="" decoding="async" />
        {discord?.deco && <img className="absolute -inset-[10%] size-[120%] max-w-none" src={discord.deco} alt="" decoding="async" />}
        {statut && (
          <span
            className="absolute right-[6%] bottom-[6%] aspect-square w-[18%] rounded-full border-solid border-nuit"
            style={{ background: COULEURS[statut], borderWidth: Math.max(5, g.s * 0.024) }}
          />
        )}
      </motion.div>
      {/* le badge : ramène en haut */}
      <motion.a
        href="#profil"
        onClick={allerA('profil')}
        style={{ opacity: range, pointerEvents: clics }}
        className="fixed top-3 left-3 z-40 flex h-12 items-center gap-3 rounded-full border border-white/8 bg-nuit/75 py-0 pr-4 pl-[58px] text-creme no-underline backdrop-blur-md"
      >
        <span className="leading-tight">
          <span className="block font-bold">{discord?.nom || SASU.profil.pseudo}</span>
          <span className="block text-xs text-doux">{statut ? LIBELLES[statut] : 'Comédien voix'}</span>
        </span>
      </motion.a>
    </>
  )
}

function BoutonDemo() {
  const { etat } = useDemo()
  const lecture = etat === 'lecture'
  if (!SASU.demo.fichier) return null

  return (
    <ShimmerButton
      type="button"
      onClick={() => basculerDemo()?.catch(() => toast('Impossible de lire la démo.'))}
      aria-pressed={lecture}
      background="var(--color-creme)"
      shimmerColor="#e2a63b"
      shimmerSize="0.1em"
      className="min-h-12 gap-2.5 border-creme px-6 font-semibold text-encre"
    >
      {lecture ? (
        <span className="flex h-4 items-center gap-[3px]" aria-hidden="true">
          {[0.9, 1.4, 1.1, 0.7].map(k => (
            <Barre key={k} k={k} />
          ))}
        </span>
      ) : (
        <IconeLecture lecture={false} />
      )}
      {{ neuf: 'Écouter ma démo', lecture: 'Mettre en pause', pause: 'Reprendre ma démo', fin: 'Réécouter ma démo' }[etat]}
    </ShimmerButton>
  )
}

const Barre = ({ k }: { k: number }) => (
  <motion.i style={{ scaleY: useTransform(niveau, n => Math.max(0.2, Math.min(1, n * k * 1.6))) }} className="h-full w-[3px] rounded-full bg-encre" />
)

/** Les répliques de la démo, en sous-titres, où que l'on soit sur la page. */
export function SousTitres() {
  const { etat, t } = useDemo()
  const ligne = etat === 'lecture' ? SASU.demo.soustitres.find(l => t >= l.t && t <= l.t + l.d) : undefined
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex justify-center px-4 lg:bottom-10" aria-live="polite">
      <AnimatePresence mode="wait">
        {ligne && (
          <motion.p
            key={ligne.texte}
            initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
            className="rounded-md bg-black/75 px-4 py-1.5 text-center text-[clamp(1rem,0.9rem+0.6vw,1.35rem)] font-semibold text-creme"
          >
            {ligne.texte}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
