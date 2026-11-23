import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router'
import { charger, useContenu } from '@/contenu'
import { useDiscord } from '@/discord'
import { demo } from '@/voix'
import Noise from '@/components/Noise'
import { Navigation } from '@/components/Navigation'
import { BadgeDiscord, SousTitres } from '@/components/Profil'
import { Accueil } from '@/pages/Accueil'
import { Categorie } from '@/pages/Categorie'
import { Coaching } from '@/pages/Coaching'
import { CV } from '@/pages/CV'
import { SasuGame } from '@/pages/SasuGame'

const Admin = lazy(() => import('@/admin/Admin'))

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
const TITRES: Record<string, string> = { '/doublage': 'Doublage', '/videos': 'Vidéos', '/production': 'Production', '/sasugame': 'SasuGame', '/cv': 'CV', '/coaching': 'Coaching', '/admin': 'Admin' }

function Erreur() {
  return (
    <div className="grid min-h-svh place-items-center px-(--gouttiere) text-center">
      <div>
        <p className="text-xl font-bold">Impossible de charger le contenu. Vérifie ta connexion.</p>
        <button type="button" className="bouton mt-6" onClick={() => charger()}>
          Réessayer
        </button>
      </div>
    </div>
  )
}

function Introuvable() {
  return (
    <div className="grid min-h-[70svh] place-items-center px-(--gouttiere) text-center">
      <div>
        <h1 className="titre">Page introuvable</h1>
        <Link to="/" className="bouton mt-8">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  )
}

export default function App() {
  const { profil, statut, admin } = useContenu()
  const discord = useDiscord(profil?.discord_id ?? '')
  const { pathname } = useLocation()
  const nom = discord?.nom || profil?.pseudo || 'Sasu'

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

  useEffect(() => {
    const titre = pathname === '/coaching' && !profil?.coaching && !admin ? undefined : TITRES[pathname]
    document.title = titre ? `${titre}, ${nom}` : `${nom}, comédien voix`
  }, [pathname, nom, profil?.coaching, admin])

  return (
    <>
      <a className="saut" href="#contenu">
        Aller au contenu
      </a>
      {profil ? (
        <AnimatePresence mode="wait" onExitComplete={() => scrollTo(0, 0)}>
          <motion.div key={pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <main id="contenu" tabIndex={-1} className="outline-none">
              <Routes location={pathname}>
                <Route path="/" element={<Accueil discord={discord} profil={profil} />} />
                <Route path="/doublage" element={<Categorie categorie="doublage" />} />
                <Route path="/videos" element={<Categorie categorie="montage" />} />
                <Route path="/production" element={<Categorie categorie="production" />} />
                <Route path="/sasugame" element={<SasuGame />} />
                <Route path="/cv" element={<CV />} />
                <Route path="/coaching" element={profil.coaching || admin ? <Coaching /> : <Introuvable />} />
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={null}>
                      <Admin />
                    </Suspense>
                  }
                />
                <Route path="*" element={<Introuvable />} />
              </Routes>
            </main>
            <footer className="mx-auto max-w-[1180px] px-(--gouttiere) pb-32 text-[0.88rem] text-doux">
              <div className="flex flex-wrap justify-between gap-x-8 gap-y-2 border-t border-white/8 pt-8">
                <p>© {annee} SasuStudio</p>
                <p>Extraits présentés à titre de démonstration. Les œuvres originales appartiennent à leurs ayants droit.</p>
              </div>
            </footer>
          </motion.div>
        </AnimatePresence>
      ) : (
        statut === 'erreur' && <Erreur />
      )}
      {profil && pathname !== '/' && <BadgeDiscord discord={discord} nom={nom} />}
      <Navigation />
      <SousTitres />
      <Toast />
      <Noise fixed opacity={0.07} fps={18} zIndex={60} blendMode="overlay" />
    </>
  )
}
