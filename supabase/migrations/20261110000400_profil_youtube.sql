-- Chaîne YouTube dans les contacts (handle sans le @).
alter table public.profil add column youtube text;
update public.profil set youtube = 'Sasu988';
