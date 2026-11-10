-- Le CV a aussi un objectif (texte d'intro) et des centres d'intérêt.
alter type public.section_cv add value if not exists 'objectif';
alter type public.section_cv add value if not exists 'interet';
