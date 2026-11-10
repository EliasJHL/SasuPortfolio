import assert from 'node:assert/strict'
import { test } from 'node:test'
import { estCle, idYoutube, miniature, oeuvres, periode, plusLegere, url, type Media } from '../src/lib/projets.ts'

test('idYoutube reconnaît les formats courants', () => {
  const id = 'dQw4w9WgXcQ'
  for (const lien of [id, `https://youtu.be/${id}`, `https://www.youtube.com/watch?v=${id}&t=42`, `youtube.com/shorts/${id}`, `https://m.youtube.com/embed/${id}`, `https://www.youtube.com/live/${id}?si=x`, ` https://youtu.be/${id}?si=abc `])
    assert.equal(idYoutube(lien), id, lien)
  for (const lien of ['', 'bonjour', 'https://vimeo.com/123456', `https://evil.com/watch?v=${id}`, 'https://youtu.be/trop-court'])
    assert.equal(idYoutube(lien), null, lien)
})

test('url préfixe les clés R2 et laisse passer le reste', () => {
  assert.equal(url('doublage/a.mp4'), '/media/doublage/a.mp4')
  assert.equal(url('https://cdn.exemple.fr/a.mp4'), 'https://cdn.exemple.fr/a.mp4')
  assert.equal(url('/favicon.svg'), '/favicon.svg')
  assert.equal(url(null), undefined)
  assert.ok(estCle('profil/demo.mp3'))
  assert.ok(!estCle('https://i.ytimg.com/vi/x/hqdefault.jpg'))
})

test('plusLegere choisit la plus petite qualité connue', () => {
  const m = { qualites: [{ label: 'Originale', url: 'a' }, { label: '1080p', url: 'b' }, { label: '480p', url: 'c' }] } as Media
  assert.equal(plusLegere(m), '/media/c')
  assert.equal(plusLegere({ qualites: [{ label: 'Originale', url: 'a' }] } as Media), '/media/a')
})

test('miniature retombe sur YouTube', () => {
  assert.equal(miniature({ miniature: null, youtube: 'dQw4w9WgXcQ' }), 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
  assert.equal(miniature({ miniature: 'miniatures/x.jpg', youtube: 'dQw4w9WgXcQ' }), '/media/miniatures/x.jpg')
})

test('oeuvres regroupe les saisons', () => {
  assert.deepEqual(oeuvres([{ oeuvre: 'Jujutsu Kaisen, saison 3' }, { oeuvre: 'Jujutsu Kaisen' }, { oeuvre: null }, { oeuvre: 'Dragon Ball Super' }]), ['Jujutsu Kaisen', 'Dragon Ball Super'])
})

test('periode écrit les dates du CV', () => {
  assert.equal(periode('2024-03-01', null), 'mars 2024 – en cours')
  assert.equal(periode('2022-09-01', '2024-06-01'), 'septembre 2022 – juin 2024')
  assert.equal(periode(null, null), '')
})
