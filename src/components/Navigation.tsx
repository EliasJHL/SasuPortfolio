/* Le dock (Magic UI) : les pages, puis le compte Discord.
   Une catégorie sans contenu publié, ou le coaching désactivé, n'apparaît pas pour les visiteurs ;
   l'admin la voit en grisé. */
import { AudioLines, CalendarCheck, Clapperboard, FileText, House, Mic, type LucideIcon } from 'lucide-react'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { useContenu } from '@/contenu'
import type { Categorie } from '@/lib/projets'
import { cn } from '@/lib/utils'
import { Dock, DockIcon } from '@/components/ui/dock'
import { DISCORD, Logo } from '@/components/Icones'

const PAGES: { to: string; label: string; Icone: LucideIcon; categorie?: Categorie }[] = [
  { to: '/', label: 'Accueil', Icone: House },
  { to: '/doublage', label: 'Doublage', Icone: Mic, categorie: 'doublage' },
  { to: '/videos', label: 'Vidéos', Icone: Clapperboard, categorie: 'montage' },
  { to: '/production', label: 'Production', Icone: AudioLines, categorie: 'production' },
  { to: '/cv', label: 'CV', Icone: FileText },
  { to: '/coaching', label: 'Coaching', Icone: CalendarCheck },
]

function Lien({ to, label, actif, children }: { to: string; label: string; actif: boolean; children: ReactNode }) {
  return (
    <Link to={to} aria-label={label} aria-current={actif ? 'page' : undefined} className={cn('group absolute inset-0 grid place-items-center rounded-full no-underline transition-colors', actif ? 'text-or' : 'text-creme hover:bg-white/8')}>
      {children}
      <span aria-hidden="true" className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 rounded-md bg-creme px-2 py-0.5 text-xs font-semibold whitespace-nowrap text-encre opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
      {actif && <motion.span layoutId="dock-actif" className="absolute -bottom-1 size-1 rounded-full bg-or" />}
    </Link>
  )
}

export function Navigation() {
  const { profil, medias, cv, session, admin } = useContenu()
  const { pathname } = useLocation()
  const publique = (p: (typeof PAGES)[number]) => (p.categorie ? medias.some(m => m.categorie === p.categorie && m.publie) : p.to === '/cv' ? cv.length > 0 : p.to !== '/coaching' || !!profil?.coaching)
  const avatar = session?.user.user_metadata.avatar_url as string | undefined

  return (
    <nav aria-label="Navigation principale" className="pointer-events-none fixed inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-50 flex justify-center px-3">
      <Dock iconSize={42} iconMagnification={58} iconDistance={120} className="pointer-events-auto mt-0 h-[60px] gap-1.5 border-white/10 bg-nuit/75 shadow-2xl shadow-black/40">
        {PAGES.filter(p => admin || publique(p)).map(p => (
          <DockIcon key={p.to} className={cn('relative', !publique(p) && 'opacity-40')}>
            <Lien to={p.to} label={publique(p) ? p.label : `${p.label} (masquée aux visiteurs)`} actif={pathname === p.to}>
              <p.Icone className="size-[46%]" strokeWidth={1.8} />
            </Lien>
          </DockIcon>
        ))}
        <span className="mx-1 h-8 w-px self-center bg-white/12" aria-hidden="true" />
        <DockIcon className="relative">
          <Lien to="/admin" label={session ? (admin ? 'Admin' : 'Mon compte') : 'Connexion'} actif={pathname === '/admin'}>
            {avatar ? <img src={avatar} alt="" className="size-[62%] rounded-full object-cover" /> : <Logo d={DISCORD} className="size-[44%]" />}
          </Lien>
        </DockIcon>
      </Dock>
    </nav>
  )
}
