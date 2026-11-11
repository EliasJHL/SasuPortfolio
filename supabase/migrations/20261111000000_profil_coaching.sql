-- La page Coaching reste masquée aux visiteurs tant qu'elle n'est pas activée depuis l'admin.
alter table public.profil add column coaching boolean not null default false;
