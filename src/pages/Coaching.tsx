/* Coaching : l'offre à gauche, la demande de rendez-vous à droite. */
import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { EnTete } from '@/pages/Categorie'

// date locale au format AAAA-MM-JJ (la locale suédoise l'écrit ainsi)
const demain = new Date(Date.now() + 864e5).toLocaleDateString('sv')

export function Coaching() {
  const [envoye, setEnvoye] = useState(false)

  const envoyer = (e: FormEvent) => {
    e.preventDefault()
    // ponytail: interface seule, rien n'est envoyé ; brancher sur Supabase avant la mise en ligne
    setEnvoye(true)
  }

  return (
    <div className="mx-auto max-w-[1180px] px-(--gouttiere) pt-28 pb-24">
      <EnTete titre="Coaching">Une session individuelle avec moi pour travailler ta voix. Choisis une date, je te réponds pour confirmer le créneau.</EnTete>

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <section aria-labelledby="offre" className="lg:sticky lg:top-28">
          <h2 id="offre" className="sr-only">
            L'offre
          </h2>
          <p className="titre text-[clamp(4.5rem,2.4rem+9vw,10rem)] text-or">499 €</p>
          <p className="mt-3 text-xl font-bold">la session de coaching</p>
          <p className="mt-8 border-t border-white/10 pt-5 text-lg text-doux">Offre limitée aux 100 premiers inscrits.</p>
        </section>

        <AnimatePresence mode="wait" initial={false}>
          {envoye ? (
            <motion.div key="ok" role="status" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-white/10 bg-cuir/70 p-[clamp(24px,4vw,40px)]">
              <p className="text-2xl font-extrabold">Demande envoyée</p>
              <p className="mt-3 text-doux">Je te réponds par e-mail pour confirmer la date et l'heure.</p>
              <button type="button" className="bouton mt-6" onClick={() => setEnvoye(false)}>
                Faire une autre demande
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={envoyer} exit={{ opacity: 0, y: -8 }} className="grid gap-4 rounded-2xl border border-white/10 bg-cuir/70 p-[clamp(20px,4vw,40px)] sm:grid-cols-2">
              <h2 className="text-2xl font-extrabold sm:col-span-2">Prendre rendez-vous</h2>
              <label className="champ">
                <span>Nom ou pseudo</span>
                <input required name="nom" autoComplete="name" maxLength={80} />
              </label>
              <label className="champ">
                <span>E-mail</span>
                <input required type="email" name="email" autoComplete="email" maxLength={120} />
              </label>
              <label className="champ">
                <span>Discord (facultatif)</span>
                <input name="discord" maxLength={40} />
              </label>
              <label className="champ">
                <span>Ton niveau</span>
                <select required name="niveau" defaultValue="">
                  <option value="" disabled>
                    Choisir
                  </option>
                  <option>Je débute</option>
                  <option>J'ai quelques projets</option>
                  <option>Confirmé</option>
                </select>
              </label>
              <label className="champ">
                <span>Date souhaitée</span>
                <input required type="date" name="date" min={demain} />
              </label>
              <label className="champ">
                <span>Moment de la journée</span>
                <select required name="creneau" defaultValue="">
                  <option value="" disabled>
                    Choisir
                  </option>
                  <option>Matin</option>
                  <option>Après-midi</option>
                  <option>Soir</option>
                </select>
              </label>
              <label className="champ sm:col-span-2">
                <span>Ce que tu veux travailler</span>
                <textarea name="message" rows={4} maxLength={1500} placeholder="Ton objectif, un rôle à préparer, une difficulté…" />
              </label>
              <p className="text-[0.88rem] text-doux sm:col-span-2">Tes informations servent uniquement à organiser la session.</p>
              <button type="submit" className="bouton bouton-plein w-fit sm:col-span-2">
                Réserver ma session
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
