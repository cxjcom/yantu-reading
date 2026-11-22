#!/usr/bin/env node
/* 版本升级脚本：index.html 每个 ?v=N 独立 +1；sw.js CACHE +1 并把预缓存 URL 同步为 index.html 的当前引用
   用法：node scripts/bump.mjs   （每次改动 css/js 后运行一次，浏览器/SW 才会拉新文件） */
import { readFileSync, writeFileSync } from 'fs';

let html = readFileSync('index.html', 'utf8');
if (!/\?v=\d+/.test(html)) { console.error('index.html 中未找到 ?v=N'); process.exit(1); }
html = html.replace(/\?v=(\d+)/g, (m0, n) => '?v=' + (Number(n) + 1));
writeFileSync('index.html', html);

let sw = readFileSync('sw.js', 'utf8');
const c = sw.match(/'yt-pwa-v(\d+)'/);
if (!c) { console.error('sw.js 中未找到 CACHE 版本'); process.exit(1); }
sw = sw.replace(c[0], `'yt-pwa-v${Number(c[1]) + 1}'`);
/* 预缓存清单以 index.html 的实际引用为准，杜绝两边版本脱钩
   （2026-11-18 修复：motion.css/motion.js 加入同步名单——此前漏同步导致
    预缓存版本与 index 脱钩，离线首装用户拿到 404 的动效文件）
   （2026-11-22：audio.js 加入同步名单——音频引擎更新依赖 SW 翻新，无版本号会卡旧缓存） */
const vmap = {};
for (const m of html.matchAll(/(app\.css|core\.js|book\.js|audio\.js|motion\.css|motion\.js)\?v=(\d+)/g)) vmap[m[1]] = Number(m[2]);
sw = sw.replace(/(app\.css\?v=)(\d+)/g, (m0, p) => p + vmap['app.css']);
sw = sw.replace(/(core\.js\?v=)(\d+)/g, (m0, p) => p + vmap['core.js']);
sw = sw.replace(/(book\.js\?v=)(\d+)/g, (m0, p) => p + vmap['book.js']);
sw = sw.replace(/(audio\.js\?v=)(\d+)/g, (m0, p) => p + (vmap['audio.js'] ?? m0.match(/(\d+)$/)[1]));
sw = sw.replace(/(motion\.css\?v=)(\d+)/g, (m0, p) => p + (vmap['motion.css'] ?? m0.match(/(\d+)$/)[1]));
sw = sw.replace(/(motion\.js\?v=)(\d+)/g, (m0, p) => p + (vmap['motion.js'] ?? m0.match(/(\d+)$/)[1]));
writeFileSync('sw.js', sw);

console.log('已升级：index.html 资源 ?v 各 +1 · SW 缓存 v' + (Number(c[1]) + 1) + '（预缓存已同步）');
