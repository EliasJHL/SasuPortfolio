import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { SASU } from '@/contenu'
import { useDiscord } from '@/discord'
import { demo } from '@/voix'
import Noise from '@/components/Noise'
import { Castings } from '@/components/Castings'
import { Contact } from '@/components/Contact'
import { Profil, SousTitres } from '@/components/Profil'
import { Timeline } from '@/components/Timeline'
import { Videos } from '@/components/Videos'
import { TextReveal } from '@/components/ui/text-reveal'

function Toast() {
  const [msg, setMsg] = useState<{ texte: string; id: number } | null>(null)
  useEffect(() => {
    let t: number
    const ecouter = (e: Event) => {
      setMsg({ texte: (e as CustomEvent<string>).detail, id: Date.now() })
      clearTimeout(t)
      t = setTimeout(() => setMsg(null), 2200)
    }
    addEventListener('sasu:toast', ecouter)
    return () => removeEventListener('sasu:toast', ecouter)
  }, [])
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-36 z-50 flex justify-center px-4">
      <AnimatePresence>
        {msg && (
          <motion.p
            key={msg.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
            className="rounded-full bg-creme px-5 py-2.5 font-semibold text-encre shadow-2xl"
          >
            {msg.texte}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

const annee = new Date().getFullYear()

export default function App() {
  const discord = useDiscord(SASU.discordId)

  useEffect(() => {
    // le lecteur vidéo coupe la voix en cours (les aperçus muets ne coupent rien)
    const seul = (e: Event) => {
      const m = e.target as HTMLMediaElement
      if (m.dataset.apercu !== undefined) return
      for (const x of [demo, ...document.querySelectorAll<HTMLMediaElement>('audio, video')]) if (x !== m && !x.paused) x.pause()
    }
    // pas de clic droit « enregistrer sous » sur les médias
    const menu = (e: Event) => (e.target as Element).closest?.('audio, video, [data-media]') && e.preventDefault()
    document.addEventListener('play', seul, true)
    document.addEventListener('contextmenu', menu)
    return () => {
      document.removeEventListener('play', seul, true)
      document.removeEventListener('contextmenu', menu)
    }
  }, [])

  return (
    <>
      <a className="saut" href="#videos">
        Aller aux doublages
      </a>
      <main>
        <Profil discord={discord} />
        <section id="voix" tabIndex={-1} aria-label="Voix" className="outline-none">
          <TextReveal>{SASU.profil.bio.join(' ')}</TextReveal>
        </section>
        <Videos />
        <Castings />
        <Contact />
      </main>
      <footer className="mx-auto max-w-[1180px] px-(--gouttiere) pb-32 text-[0.88rem] text-doux lg:pr-36">
        <div className="flex flex-wrap justify-between gap-x-8 gap-y-2 border-t border-white/8 pt-8">
          <p>© {annee} Sasu</p>
          <p>Extraits présentés à titre de démonstration. Les œuvres originales appartiennent à leurs ayants droit.</p>
        </div>
      </footer>
      <Timeline />
      <SousTitres />
      <Toast />
      <Noise fixed opacity={0.07} fps={18} zIndex={60} blendMode="overlay" />
    </>
  )
}
