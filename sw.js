/* 研途阅读 v4 离线缓存（PWA）
   策略：
   - 预缓存核心资源（不含带查询参数的地址，版本由 index.html 的 ?v=N 控制，直连网络）
   - 导航请求 network-first（保证 HTML 永远最新，离线才回落缓存）
   - 带 ? 的请求一律直连网络（开发期 ?v=N 强制刷新）
   - 运行时缓存仅限同源、无查询参数的 GET，上限 80 条（越旧越先淘汰） */
const CACHE = 'yt-pwa-v53';
const PRECACHE = [
  './',
  './index.html',
  './assets/css/app.css',
  './assets/js/core.js',
  './assets/js/book.js',
  /* wordbank.js（4.3MB）不预缓存：首次在线加载后进入运行时缓存，离线可用 */
  './icon-192.png',
  './icon-512.png',
  './icon-180.png',
  './manifest.json',
  './lib/workbuddy-cloud-sdk.global.js'
];
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(PRECACHE); }).then(function(){ return self.skipWaiting(); })
  );
});
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});
/* 运行时缓存裁剪：超过 MAX_RUNTIME 条时删除最早写入的若干条 */
const MAX_RUNTIME = 80;
function trimRuntime(cacheName){
  return caches.open(cacheName).then(function(c){
    return c.keys().then(function(keys){
      if(keys.length <= MAX_RUNTIME) return;
      const del = keys.slice(0, keys.length - MAX_RUNTIME);
      return Promise.all(del.map(function(k){ return c.delete(k); }));
    });
  });
}
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if(url.origin !== self.location.origin) return;      // 跨域（有道发音等）不缓存
  if(url.search) return;                               // 带 ? 的请求直连网络，保证最新
  if(e.request.mode === 'navigate'){
    /* 导航：network-first，离线回落 index.html */
    e.respondWith(
      fetch(e.request).then(function(res){
        if(res && res.ok){
          const cp = res.clone();
          caches.open(CACHE).then(function(c){ c.put('./index.html', cp); });
        }
        return res;
      }).catch(function(){ return caches.match('./index.html'); })
    );
    return;
  }
  /* 静态资源：cache-first + 运行时缓存（裁剪上限） */
  e.respondWith(
    caches.match(e.request).then(function(hit){
      if(hit) return hit;
      return fetch(e.request).then(function(res){
        if(res && res.ok && res.type === 'basic'){
          const cp = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, cp); return trimRuntime(CACHE); });
        }
        return res;
      }).catch(function(){ return caches.match(e.request); });
    })
  );
});
