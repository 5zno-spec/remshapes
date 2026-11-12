const CACHE = 'memory-cards-v14';
const IMAGES = ['seed', 'faucet', 'wateringcan', 'shower', 'tree', 'house', 'rocket', 'backpack',
  'net', 'gift', 'comb', 'candle', 'frog', 'key', 'fish', 'brush'].map((n) => 'img/' + n + '.webp');
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'img/logo.png',
  'img/favicon.png'
].concat(IMAGES);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* الصور والأيقونات لا تتغير، فتُؤخذ من ذاكرة الجهاز أولاً دون طلب من الخادم.
   إذا استبدلت صورة بنفس الاسم فارفع رقم CACHE أعلاه ليأخذها اللاعبون. */
function isStatic(url) {
  return /\.(webp|png)$/i.test(url.pathname);
}

function saveCopy(req, res) {
  if (res.ok) {
    const copy = res.clone();
    caches.open(CACHE).then((cache) => cache.put(req, copy));
  }
  return res;
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (isStatic(url)) {
    /* الذاكرة أولاً للصور */
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => saveCopy(req, res)))
    );
    return;
  }

  /* الشبكة أولاً للصفحة وباقي الملفات، حتى تصل تعديلات الكود فوراً */
  event.respondWith(
    fetch(req)
      .then((res) => saveCopy(req, res))
      .catch(() => caches.match(req).then((hit) => hit || caches.match('index.html')))
  );
});
