-- Supabase accorde tous les droits par défaut (TRUNCATE compris, que la RLS ne couvre pas).
-- Les visiteurs ne gardent que la lecture ; l'écriture reste filtrée par est_admin() via la RLS.
revoke all on public.profil, public.medias, public.cv from anon, authenticated;
grant select on public.profil, public.medias, public.cv to anon;
grant select, insert, update, delete on public.profil, public.medias, public.cv to authenticated;
