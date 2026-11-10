-- Portfolio de Sasu : profil, médias, CV. Lecture publique, écriture réservée aux admins Discord.
-- Les médias sont des clés R2 relatives (ex. « doublage/snk-eren-1080p.mp4 »), préfixées côté site.

create table public.admins (discord_id text primary key);

create table public.profil (
  id int primary key default 1 check (id = 1),
  discord_id text not null,
  pseudo text not null,
  handle text not null,
  bio text[] not null default '{}',
  contact_discord text,
  instagram text,
  demo jsonb -- { url, titre, soustitres: [{ t, d, texte }] }
);

create type public.categorie as enum ('doublage', 'montage', 'production');
create type public.genre as enum ('video', 'audio');

create table public.medias (
  id uuid primary key default gen_random_uuid(),
  categorie public.categorie not null,
  genre public.genre not null,
  titre text not null check (titre <> ''),
  role text,
  oeuvre text,
  description text,
  date date,
  youtube text check (youtube ~ '^[A-Za-z0-9_-]{11}$'),
  qualites jsonb not null default '[]', -- [{ label, url }], la première est la principale
  miniature text,
  a_la_une boolean not null default false,
  publie boolean not null default false,
  ordre int not null default 0,
  cree_le timestamptz not null default now(),
  check (youtube is not null or jsonb_array_length(qualites) > 0)
);

create type public.section_cv as enum ('experience', 'formation', 'competence');

create table public.cv (
  id uuid primary key default gen_random_uuid(),
  section public.section_cv not null,
  titre text not null check (titre <> ''),
  structure text,
  lieu text,
  debut date,
  fin date, -- vide = en cours
  description text,
  ordre int not null default 0
);

-- user_metadata est modifiable par l'utilisateur : on se fie uniquement à auth.identities
create function public.est_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.identities i
    join public.admins a on a.discord_id = i.provider_id
    where i.user_id = auth.uid() and i.provider = 'discord'
  )
$$;
revoke execute on function public.est_admin() from public;
grant execute on function public.est_admin() to anon, authenticated;

alter table public.admins enable row level security; -- aucune politique : invisible depuis le site
alter table public.profil enable row level security;
alter table public.medias enable row level security;
alter table public.cv enable row level security;

create policy "lecture publique" on public.profil for select using (true);
create policy "lecture publique" on public.cv for select using (true);
create policy "lecture des publiés" on public.medias for select using (publie or public.est_admin());

create policy "admin" on public.profil for all to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "admin" on public.medias for all to authenticated using (public.est_admin()) with check (public.est_admin());
create policy "admin" on public.cv for all to authenticated using (public.est_admin()) with check (public.est_admin());

grant select on public.profil, public.medias, public.cv to anon, authenticated;
grant insert, update, delete on public.profil, public.medias, public.cv to authenticated;
revoke all on public.admins from anon, authenticated;
