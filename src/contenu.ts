/* ==========================================================================
   TON CONTENU — c'est le seul fichier à modifier pour gérer le site.

   Pour publier un nouveau doublage :
     1. Mets ton fichier dans  public/media/video/  (mp4)  ou  public/media/audio/  (mp3)
     2. Ajoute un bloc { ... } dans la liste "projets" plus bas
     3. Redéploie le site

   Pour programmer une sortie : mets une date future dans "date".
   Le doublage apparaîtra tout seul ce jour-là.
   Pour cacher un doublage sans le supprimer : publie: false
   ========================================================================== */

export type Projet = {
  type: 'video' | 'audio'
  titre: string
  fichier?: string
  miniature?: string
  qualites?: Record<string, string>
  role?: string
  oeuvre?: string
  date?: string
  publie?: boolean
}

export const SASU = {
  /* Ton ID Discord (une suite de chiffres, PAS ton pseudo).
     ⚠ Tu dois aussi rejoindre le serveur Lanyard : https://discord.gg/lanyard */
  discordId: '883007499349938178',

  profil: {
    pseudo: 'Sasu', // utilisé si Discord ne répond pas
    handle: 'sasu988',
    // affichée mot à mot pendant le défilement
    bio: [
      'Comédien voix, medium grave.',
      'Niveau intermédiaire en doublage.',
      'MP ouverts pour vos projets et collaborations.',
    ],
  },

  contact: {
    discord: 'Sasu988',
    instagram: 'sasu988_vr',
  },

  /* Ta démo principale : le bouton « Écouter ma démo ».
     Les répliques s'affichent en sous-titres pendant l'écoute :
     t = seconde où la phrase commence, d = durée en secondes. */
  demo: {
    fichier: '/media/audio/demo-voix.mp3',
    titre: 'Démo voix',
    soustitres: [
      { t: 0.3, d: 5.4, texte: 'Aki, Chainsaw Man' },
      { t: 7.1, d: 8.9, texte: "l'agresseur de Reze, Chainsaw Man" },
    ],
  },

  /* ---------- TES DOUBLAGES ----------
     type      : "video" ou "audio"
     fichier   : chemin vers le fichier
     miniature : (vidéo, optionnel) image de couverture, idéalement 1280×720
     qualites  : (vidéo, optionnel) plusieurs versions de la même vidéo
     role      : le personnage que tu doubles (optionnel)
     oeuvre    : l'anime / film / jeu (optionnel)
     date      : "AAAA-MM-JJ" — sert au tri, et à programmer la sortie
     publie    : false pour cacher (optionnel, true par défaut) */
  projets: [
    /* ---------- Vidéos ---------- */
    {
      type: 'video',
      titre: 'Eren',
      miniature: '/media/miniatures/snk-eren.jpg',
      qualites: {
        '1080p': '/media/video/snk-eren-1080p.mp4',
        '720p': '/media/video/snk-eren-720p.mp4',
        '480p': '/media/video/snk-eren-480p.mp4',
      },
      role: 'Eren',
      oeuvre: "L'Attaque des Titans",
      date: '2026-11-10',
    },
    {
      type: 'video',
      titre: 'Traître',
      miniature: '/media/miniatures/snk-traitre-eren.jpg',
      qualites: {
        '720p': '/media/video/snk-traitre-eren-720p.mp4',
        '480p': '/media/video/snk-traitre-eren-480p.mp4',
      },
      role: 'Eren',
      oeuvre: "L'Attaque des Titans",
      date: '2026-11-06',
    },
    {
      type: 'video',
      titre: 'La rage de Goku contre Zamasu',
      miniature: '/media/miniatures/dbs-goku-zamasu.jpg',
      qualites: {
        '1080p': '/media/video/dbs-goku-zamasu-1080p.mp4',
        '720p': '/media/video/dbs-goku-zamasu-720p.mp4',
        '480p': '/media/video/dbs-goku-zamasu-480p.mp4',
      },
      role: 'Tous les personnages (Goku, Black Goku, Trunks, Vegeta, Goten, Chichi)',
      oeuvre: 'Dragon Ball Super',
      date: '2026-10-20',
    },
    {
      type: 'video',
      titre: 'Yuta contre Ryu',
      miniature: '/media/miniatures/jjk-yuta-vs-ryu.jpg',
      qualites: {
        '1080p': '/media/video/jjk-yuta-vs-ryu-1080p.mp4',
        '720p': '/media/video/jjk-yuta-vs-ryu-720p.mp4',
        '480p': '/media/video/jjk-yuta-vs-ryu-480p.mp4',
      },
      role: 'Yuta et Ryu',
      oeuvre: 'Jujutsu Kaisen, saison 3',
      date: '2026-10-19',
    },
    {
      type: 'video',
      titre: 'Yuji et Todo',
      miniature: '/media/miniatures/jjk-yuji-todo.jpg',
      qualites: {
        '720p': '/media/video/jjk-yuji-todo-720p.mp4',
        '480p': '/media/video/jjk-yuji-todo-480p.mp4',
      },
      role: 'Yuji et Todo',
      oeuvre: 'Jujutsu Kaisen',
      date: '2026-10-19',
    },
    {
      type: 'video',
      titre: 'Jiren contre Goku, Freezer et C-17',
      miniature: '/media/miniatures/dbs-jiren-vs-goku.jpg',
      qualites: {
        '480p': '/media/video/dbs-jiren-vs-goku-480p.mp4',
      },
      role: 'Tous les personnages (Jiren, Goku, Freezer, C-17…)',
      oeuvre: 'Dragon Ball Super',
      date: '2026-10-13',
    },

    /* ---------- Audios ---------- */
    {
      type: 'audio',
      titre: 'Casting EvLG',
      fichier: '/media/audio/aki-casting-evlg.mp3',
      role: 'Aki',
      oeuvre: 'Chainsaw Man',
      date: '2026-11-10',
    },
    {
      type: 'audio',
      titre: "Casting, l'agresseur de Reze",
      fichier: '/media/audio/reze-agresseur-casting.mp3',
      role: "L'agresseur de Reze",
      oeuvre: 'Chainsaw Man',
      date: '2026-11-10',
    },
  ] satisfies Projet[] as Projet[],
}
