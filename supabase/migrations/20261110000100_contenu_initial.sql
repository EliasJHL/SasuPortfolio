-- Contenu repris de l'ancien site (src/contenu.ts). Tout est publié et à la une pour garder l'accueil identique.

insert into public.admins (discord_id) values
  ('883007499349938178'),  -- Sasu
  ('1435226976330711144'); -- Elias

insert into public.profil (discord_id, pseudo, handle, bio, contact_discord, instagram, demo) values (
  '883007499349938178', 'Sasu', 'sasu988',
  array['Comédien voix, medium grave.', 'Niveau intermédiaire en doublage.', 'MP ouverts pour vos projets et collaborations.'],
  'Sasu988', 'sasu988_vr',
  '{"url": "profil/demo-voix.mp3", "titre": "Démo voix", "soustitres": [
    {"t": 0.3, "d": 5.4, "texte": "Aki, Chainsaw Man"},
    {"t": 7.1, "d": 8.9, "texte": "l''agresseur de Reze, Chainsaw Man"}
  ]}'
);

insert into public.medias (categorie, genre, titre, role, oeuvre, date, qualites, miniature, a_la_une, publie, ordre) values
  ('doublage', 'video', 'Eren', 'Eren', 'L''Attaque des Titans', '2026-11-10',
   '[{"label": "1080p", "url": "doublage/snk-eren-1080p.mp4"}, {"label": "720p", "url": "doublage/snk-eren-720p.mp4"}, {"label": "480p", "url": "doublage/snk-eren-480p.mp4"}]',
   'miniatures/snk-eren.jpg', true, true, 0),
  ('doublage', 'video', 'Traître', 'Eren', 'L''Attaque des Titans', '2026-11-06',
   '[{"label": "720p", "url": "doublage/snk-traitre-eren-720p.mp4"}, {"label": "480p", "url": "doublage/snk-traitre-eren-480p.mp4"}]',
   'miniatures/snk-traitre-eren.jpg', true, true, 1),
  ('doublage', 'video', 'La rage de Goku contre Zamasu', 'Tous les personnages (Goku, Black Goku, Trunks, Vegeta, Goten, Chichi)', 'Dragon Ball Super', '2026-10-20',
   '[{"label": "1080p", "url": "doublage/dbs-goku-zamasu-1080p.mp4"}, {"label": "720p", "url": "doublage/dbs-goku-zamasu-720p.mp4"}, {"label": "480p", "url": "doublage/dbs-goku-zamasu-480p.mp4"}]',
   'miniatures/dbs-goku-zamasu.jpg', true, true, 2),
  ('doublage', 'video', 'Yuta contre Ryu', 'Yuta et Ryu', 'Jujutsu Kaisen, saison 3', '2026-10-19',
   '[{"label": "1080p", "url": "doublage/jjk-yuta-vs-ryu-1080p.mp4"}, {"label": "720p", "url": "doublage/jjk-yuta-vs-ryu-720p.mp4"}, {"label": "480p", "url": "doublage/jjk-yuta-vs-ryu-480p.mp4"}]',
   'miniatures/jjk-yuta-vs-ryu.jpg', true, true, 3),
  ('doublage', 'video', 'Yuji et Todo', 'Yuji et Todo', 'Jujutsu Kaisen', '2026-10-19',
   '[{"label": "720p", "url": "doublage/jjk-yuji-todo-720p.mp4"}, {"label": "480p", "url": "doublage/jjk-yuji-todo-480p.mp4"}]',
   'miniatures/jjk-yuji-todo.jpg', true, true, 4),
  ('doublage', 'video', 'Jiren contre Goku, Freezer et C-17', 'Tous les personnages (Jiren, Goku, Freezer, C-17…)', 'Dragon Ball Super', '2026-10-13',
   '[{"label": "480p", "url": "doublage/dbs-jiren-vs-goku-480p.mp4"}]',
   'miniatures/dbs-jiren-vs-goku.jpg', true, true, 5),
  ('doublage', 'audio', 'Casting EvLG', 'Aki', 'Chainsaw Man', '2026-11-10',
   '[{"label": "Originale", "url": "doublage/aki-casting-evlg.mp3"}]', null, true, true, 6),
  ('doublage', 'audio', 'Casting, l''agresseur de Reze', 'L''agresseur de Reze', 'Chainsaw Man', '2026-11-10',
   '[{"label": "Originale", "url": "doublage/reze-agresseur-casting.mp3"}]', null, true, true, 7);
