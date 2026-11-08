const CACHE = 'kana1h-v2';
const FILES = ['./', 'index.html', 'style.css', 'data.js', 'strokes.js', 'app.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
const H = 'aiueo ka ki ku ke ko sa shi su se so ta chi tsu te to na ni nu ne no ha hi fu he ho ma mi mu me mo ya yu yo ra ri ru re ro wa wo n'.split(' ').flatMap(r => r === 'aiueo' ? [...r] : [r]);
const IMGS = ['h', 'k'].flatMap(s => H.map(r => `img/${s}-${r}.jpg`));
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => {
    c.addAll(IMGS).catch(() => {}); // 그림은 기다리지 않고 받아 둠 (오프라인용)
    return c.addAll(FILES);
  }));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// 캐시 우선 + 백그라운드 갱신 (오프라인에서도 동작)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  }));
});
