// オフライン対応用サービスワーカー
// ファイルを更新したら VERSION を上げると、古いキャッシュが入れ替わる。
const VERSION = 'v11.2.0';
const CACHE = 'kekkai-' + VERSION;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/data.js',
  './js/art.js',
  './js/save.js',
  './js/gacha.js',
  './js/battle.js',
  './js/live.js',
  './js/story.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './assets/chars/meltia.webp',
  './assets/chars/kagura.webp',
  './assets/chars/nereia.webp',
  './assets/chars/akane.webp',
  './assets/chars/shizuku.webp',
  './assets/chars/sylphina.webp',
  './assets/chars/seira.webp',
  './assets/chars/xeno.webp',
  './assets/chars/karin.webp',
  './assets/chars/shigure.webp',
  './assets/chars/lydia.webp',
  './assets/chars/soyo.webp',
  './assets/chars/hayate.webp',
  './assets/chars/zephyr.webp',
  './assets/chars/viola.webp',
  './assets/chars/aster.webp',
  './assets/chars/minamo.webp',
  './assets/chars/ciel.webp',
  './assets/chars/chloe.webp',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('kekkai-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// オンライン時は常に最新を取得し、取れなかったときだけキャッシュを使う（ネットワーク優先）
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
        .then(hit => hit || new Response('オフラインです', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })))
  );
});
