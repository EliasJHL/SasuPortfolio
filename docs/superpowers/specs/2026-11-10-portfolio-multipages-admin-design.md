# Portfolio de Sasu : pages, connexion Discord et espace admin

Date : 2026-11-10

## Objectif

Faire passer le portfolio d'un one-page figé (`src/contenu.ts`) à un site multi-pages dont tout le contenu se gère depuis un espace admin, accessible en se connectant avec Discord. Aucun serveur à maintenir.

Le statut Discord est déjà synchronisé en direct avec le vrai compte (Lanyard, WebSocket) : rien à changer.

## Décisions prises

| Sujet | Choix |
|---|---|
| Données et connexion | Supabase (Auth Discord, Postgres avec RLS, une Edge Function) |
| Médias | Bucket Cloudflare R2 public, envois par URL signée |
| Accueil | La vitrine actuelle reste, alimentée par les éléments « à la une » ; les pages de catégories listent tout |
| Admins | Table `admins` fixe, modifiée depuis le dashboard Supabase, pas d'écran |
| Qualités vidéo | Un fichier principal, versions supplémentaires facultatives |
| Chargement | Lecture en direct depuis Supabase au chargement, avec cache local ; pas de rebuild |
| Navigation | Dock Magic UI en bas, qui remplace la frise de montage (`Timeline.tsx`) |

## Architecture

- SPA Vite + React 19, `react-router` v7 en mode déclaratif.
- `public/_redirects` : `/* /index.html 200` pour les liens directs sur Netlify.
- `@supabase/supabase-js` côté client. L'écriture est protégée par RLS, jamais par le front seul.
- Edge Function Supabase `medias` (Deno, `aws4fetch`) : signe les envois et supprime les fichiers sur R2.
- R2 sert les médias en lecture publique (URL de base dans `VITE_MEDIAS_URL`).
- Lanyard reste la source du profil et du statut Discord en direct.

### Routes

| Route | Contenu |
|---|---|
| `/` | Vitrine actuelle : profil Discord, bio, pellicule, castings, contact |
| `/doublage` | Tous les doublages (vidéo, YouTube, audio), filtres par œuvre |
| `/videos` | Montages vidéo (fichier ou YouTube) |
| `/production` | Musique et sons |
| `/cv` | Expérience, formation, compétences |
| `/admin` | Espace admin, chargé à la demande (`React.lazy`) |

Les pages s'enchaînent avec un fondu-glissé (`AnimatePresence` de motion, clé = chemin). Le scroll revient en haut à chaque changement de page.

### Dock

- Magic UI `Dock`, fixé en bas au centre, icônes `lucide-react` avec libellé au survol et `aria-label`.
- Accueil (House), Doublage (Mic), Vidéos (Clapperboard), Production (AudioLines), CV (FileText), séparateur, puis le compte :
  - non connecté : logo Discord, « Connexion » (mène à `/admin`) ;
  - connecté : avatar Discord ; pour un admin, un raccourci « Admin ».
- La page en cours porte `aria-current="page"` et un repère visuel.
- Pour les visiteurs, une catégorie sans contenu publié est retirée du dock. Les admins la voient toujours.

## Données

Fichier de migration SQL dans `supabase/migrations/`.

```sql
create table admins (discord_id text primary key);

create table profil (
  id int primary key default 1 check (id = 1),
  discord_id text not null,
  pseudo text not null,
  handle text not null,
  bio text[] not null default '{}',
  contact_discord text,
  instagram text,
  demo jsonb  -- { url, titre, soustitres: [{ t, d, texte }] } ou null
);

create type categorie as enum ('doublage', 'montage', 'production');
create type genre as enum ('video', 'audio');

create table medias (
  id uuid primary key default gen_random_uuid(),
  categorie categorie not null,
  genre genre not null,
  titre text not null,
  role text,
  oeuvre text,
  description text,
  date date,
  youtube text,                          -- ID YouTube (11 caractères) ou null
  qualites jsonb not null default '[]',  -- [{ label, url }], la première est la principale
  miniature text,
  a_la_une boolean not null default false,
  publie boolean not null default false,
  ordre int not null default 0,
  cree_le timestamptz not null default now(),
  check (youtube is not null or jsonb_array_length(qualites) > 0)
);

create type section_cv as enum ('experience', 'formation', 'competence');

create table cv (
  id uuid primary key default gen_random_uuid(),
  section section_cv not null,
  titre text not null,
  structure text,     -- entreprise, école, studio
  lieu text,
  debut date,
  fin date,           -- null = en cours (ignoré pour les compétences)
  description text,
  ordre int not null default 0
);
```

- Une vidéo YouTube a `genre = 'video'`, `youtube` renseigné et `qualites` vide.
- Les castings audio actuels deviennent des lignes `categorie = 'doublage'`, `genre = 'audio'`.
- La démo voix reste dans `profil.demo`.
- Ordre d'affichage : `ordre` croissant, puis `date` décroissante.

### Sécurité (RLS)

```sql
create function est_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.identities i
    join public.admins a on a.discord_id = i.provider_id
    where i.user_id = auth.uid() and i.provider = 'discord'
  )
$$;
```

- `auth.identities` et non `user_metadata`, qu'un utilisateur peut modifier lui-même.
- `profil`, `cv` : lecture publique ; écriture si `est_admin()`.
- `medias` : lecture publique si `publie`, toutes les lignes si `est_admin()` ; écriture si `est_admin()`.
- `admins` : RLS activé sans aucune politique (illisible depuis le client, géré depuis le dashboard).

### Edge Function `medias`

- Entrée : `POST { action: 'envoyer', dossier, type, extension }` ou `POST { action: 'supprimer', url }`, avec le JWT de la session.
- Vérifie la session puis `est_admin()` (RPC avec le JWT de l'appelant). Sinon : 403.
- `envoyer` : `dossier` dans `doublage | montage | production | profil | miniatures`, `type` commençant par `video/`, `audio/` ou `image/`. Renvoie `{ envoi, url }` : URL PUT signée valable 10 minutes pour la clé `{dossier}/{uuid}.{extension}`, et l'URL publique finale.
- `supprimer` : n'accepte qu'une URL sous `VITE_MEDIAS_URL`, supprime l'objet.
- Secrets de la fonction : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `MEDIAS_URL`.

## Chargement du contenu côté site

- Un seul magasin (`useSyncExternalStore`) charge au démarrage `profil`, `medias` et `cv`, et expose `{ profil, medias, cv, etat }`.
- Le dernier contenu reçu est gardé en `localStorage` (`sasu-contenu-v1`) et affiché immédiatement à l'ouverture suivante.
- Si un admin est connecté, le magasin recharge en incluant les brouillons ; il recharge aussi après chaque enregistrement dans l'admin.
- `src/contenu.ts` disparaît après la migration. Les fichiers qui en dépendent (`lib/projets.ts`, composants) lisent le magasin.

## Pages publiques

- **Accueil** : les composants actuels (`Profil`, bio en `TextReveal`, `Videos`, `Castings`, `Contact`), alimentés par la base.
  - Pellicule : doublages `genre = 'video'` à la une, suivis d'un lien « Voir tous les doublages » vers `/doublage`.
  - Castings : doublages `genre = 'audio'` à la une.
- **Doublage** : titre, filtres par œuvre (une puce par œuvre, plus « Toutes »), grille des vidéos, puis la liste des castings audio (composant `Piste` actuel).
- **Vidéos** : grille des montages, aperçu muet au survol pour les fichiers, miniature pour YouTube.
- **Production** : liste de pistes (`Piste` réutilisé, avec pochette si `miniature`), même anneau « parle » sur l'avatar et même forme d'onde.
- **CV** : frise verticale expérience, puis formation ; la ligne se dessine au scroll (`useScroll`), chaque étape s'allume quand la ligne l'atteint. Dates en « mois année », « en cours » si `fin` est vide. Compétences en liste sous la frise.

### Lecteurs

- Fichier R2 : le `Lecteur` actuel (morph `layoutId` depuis la miniature, menu de qualité affiché seulement s'il y a plusieurs `qualites`).
- YouTube : même `dialog`, même morph, contenu = iframe `https://www.youtube-nocookie.com/embed/{id}?autoplay=1&rel=0`, créée seulement à l'ouverture. Miniature par défaut : `https://i.ytimg.com/vi/{id}/hqdefault.jpg`.
- Liens YouTube acceptés : `youtu.be/ID`, `youtube.com/watch?v=ID`, `/shorts/ID`, `/embed/ID`, `/live/ID`, ou l'ID seul.

## Espace admin (`/admin`)

- Non connecté : « Se connecter avec Discord » (`signInWithOAuth`, provider `discord`, retour sur `/admin`).
- Connecté, pas admin : « Ce compte Discord n'a pas accès à l'admin. » et « Se déconnecter ».
- Admin : onglets Doublage, Vidéos, Production, CV, Profil ; « Se déconnecter » dans l'en-tête.

### Listes (Doublage, Vidéos, Production, CV)

- Glisser-déposer pour l'ordre (`Reorder` de motion) ; l'ordre est enregistré en un seul `upsert`.
- Interrupteurs « Publié » et « À la une » directement sur chaque ligne (médias seulement).
- « Ajouter », « Modifier », « Supprimer » (confirmation, puis suppression des fichiers R2 de la ligne).

### Formulaire média

- Champs : titre (obligatoire), rôle, œuvre, date, description, genre (vidéo ou audio).
- Source : « Fichier » ou « YouTube ».
  - YouTube : on colle un lien ; l'ID et la miniature sont déduits, avec un aperçu. Lien invalide : « Ce lien YouTube n'est pas reconnu. »
  - Fichier : fichier principal, puis « Ajouter une qualité » (fichier + label, par ex. 720p). Barre de progression par fichier (`XMLHttpRequest`, `upload.onprogress`). Durée lue sur le fichier.
- Miniature : envoi d'une image, ou celle de YouTube.
- « Enregistrer » est actif quand tous les envois sont terminés. « Annuler » supprime les fichiers envoyés pendant la session du formulaire. En modification, un fichier remplacé est supprimé de R2 après l'enregistrement réussi.

### Formulaire CV

- Section, titre, structure, lieu, début, fin (case « En cours »), description. Pour une compétence : titre et description seulement.

### Profil

- Pseudo, handle, ID Discord, bio (une ligne par phrase), pseudo Discord de contact, Instagram.
- Démo voix : fichier audio, titre, et sous-titres en lignes `début (s) / durée (s) / texte`, avec un bouton « Écouter » pour caler les temps.

## Erreurs

- Chargement : cache affiché d'abord. Sans réseau et sans cache : « Impossible de charger le contenu. Vérifie ta connexion. » avec « Réessayer ».
- Envoi raté : « Échec de l'envoi » sur la ligne du fichier, avec « Réessayer ».
- Enregistrement refusé : message d'erreur au-dessus du bouton, formulaire conservé.
- 403 de la fonction : « Ta session n'a pas les droits admin. Reconnecte-toi. »
- La session se renouvelle seule (`supabase-js`).

## Migration de l'existant

- `scripts/migrer.mjs`, lancé une fois en local avec les accès R2 dans `.env.local` (non versionné) :
  - envoie les fichiers de `public/media` sur R2 (mêmes dossiers que ci-dessus) ;
  - écrit `supabase/migrations/<horodatage>_contenu_initial.sql` qui insère `profil`, les `medias` (tous publiés et à la une, pour garder l'accueil actuel) et rien dans `cv`.
- Ensuite : suppression de `public/media` et de `src/contenu.ts` du dépôt.

## Tests

- `node --test` sur la logique pure : lecture des liens YouTube, construction de la clé R2, tri des médias, format des dates du CV.
- `scripts/verifier-rls.mjs` avec la clé publique : un visiteur ne lit aucun brouillon, ne peut écrire dans aucune table, ne lit pas `admins`, et la fonction `medias` lui répond 403.
- Vérification dans Chrome : chaque page en visiteur, connexion d'un compte non admin, puis parcours admin complet (ajout fichier avec deux qualités, ajout YouTube, réordonnancement, brouillon invisible côté visiteur, suppression).

## Mise en place (à faire par le propriétaire du projet)

1. Projet Supabase : URL et clé publique dans `.env.local` et dans les variables Netlify (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_MEDIAS_URL`).
2. Application Discord (Developer Portal) : Client ID et secret dans Supabase, Auth > Providers > Discord ; URL de redirection Supabase ajoutée côté Discord ; URL du site et `http://localhost:5179` dans les URL de redirection autorisées de Supabase.
3. Bucket R2 : accès public (r2.dev ou domaine), token S3, CORS autorisant `PUT` depuis `http://localhost:5179` et le domaine Netlify.
4. IDs Discord des admins à insérer dans `admins`.
5. `supabase login` une fois, puis liaison du projet, pour pousser les migrations et déployer la fonction.

## Hors périmètre

Rôles autres qu'admin, écran de gestion des admins, conversion vidéo, rendu serveur et SEO avancé, statistiques de visite, multilingue, publication programmée.
