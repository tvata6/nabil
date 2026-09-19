/* SANAD CARS — عامل الخدمة
   القاعدة: الشبكة أولاً دائماً، حتى يصل أي تحديث ترفعه فوراً لكل الهواتف.
   النسخة المخزّنة تُستعمل فقط عندما ينقطع الإنترنت. */
const CACHE = 'sanadcars-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // لا نلمس طلبات الخادم
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;             // Apps Script والخطوط تمر مباشرة

  e.respondWith(
    fetch(req)
      .then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        if (req.mode === 'navigate'){
          const shell = await caches.match('./index.html');
          if (shell) return shell;
        }
        return new Response(
          '<!doctype html><html lang="ar" dir="rtl"><meta charset="utf-8">' +
          '<meta name="viewport" content="width=device-width,initial-scale=1">' +
          '<body style="margin:0;height:100dvh;display:grid;place-items:center;background:#19222D;color:#fff;' +
          'font-family:system-ui,Tahoma,sans-serif;text-align:center;padding:24px">' +
          '<div><h2 style="margin:0 0 8px">لا يوجد اتصال بالإنترنت</h2>' +
          '<p style="color:#9AA7B3;margin:0">تحقق من الشبكة ثم أعد فتح التطبيق.</p></div></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      })
  );
});
