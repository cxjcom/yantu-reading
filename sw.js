/* 研途阅读 v4 离线缓存（PWA）
   策略：
   - 预缓存核心资源（与 index.html 引用的 ?v=N 版本一一对应；版本升级 = 改这里 + 改 index.html）
   - 导航请求 network-first（保证 HTML 永远最新，离线才回落缓存）
   - 带 ?v=N 的静态资源：缓存优先（版本化 URL 视为不可变；HTML 更新后自然引用新版本 URL）
   - 其他带 ? 的请求直连网络；跨域（有道发音等）一律不缓存
   - 无版本的同源静态资源：cache-first + 运行时缓存，上限 80 条（越旧越先淘汰） */
const CACHE = 'yt-pwa-v146';
const PRECACHE = [
  './',
  './index.html',
  './assets/css/app.css?v=94',
  './assets/js/core.js?v=120',
  './assets/js/book.js?v=91',
  './assets/css/motion.css?v=40',
  './assets/js/motion.js?v=40',
  './assets/js/audio.js?v=4',
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
  const isVer = /[?&]v=\d+/.test(url.search);
  if(url.search && !isVer) return;                     // 非版本参数的带 ? 请求直连网络
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
