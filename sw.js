/* 研途阅读 v3 离线缓存（PWA） */
const CACHE = 'yt-pwa-v32';
const ASSETS = [
  './',
  './index.html',
  './assets/css/app.css',
  './assets/js/core.js',
  './assets/js/book.js',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './manifest.json',
  './lib/workbuddy-cloud-sdk.global.js'
];
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        if(res && res.ok && res.type === 'basic'){
          const cp = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, cp); });
        }
        return res;
      }).catch(function(){
        if(e.request.mode === 'navigate') return caches.match('./index.html');
      });
    })
  );
});
