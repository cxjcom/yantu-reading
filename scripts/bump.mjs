#!/usr/bin/env node
/* 版本升级脚本：index.html 资源 ?v=N → N+1，sw.js CACHE vN → vN+1
   用法：node scripts/bump.mjs   （每次改动 css/js 后运行一次，浏览器/SW 才会拉新文件） */
import { readFileSync, writeFileSync } from 'fs';

let html = readFileSync('index.html', 'utf8');
const m = html.match(/\?v=(\d+)"/);
if (!m) { console.error('index.html 中未找到 ?v=N'); process.exit(1); }
const n = Number(m[1]) + 1;
html = html.replaceAll(`?v=${m[1]}"`, `?v=${n}"`);
writeFileSync('index.html', html);

let sw = readFileSync('sw.js', 'utf8');
const c = sw.match(/'yt-pwa-v(\d+)'/);
if (!c) { console.error('sw.js 中未找到 CACHE 版本'); process.exit(1); }
const cn = Number(c[1]) + 1;
sw = sw.replace(c[0], `'yt-pwa-v${cn}'`);
writeFileSync('sw.js', sw);

console.log(`已升级：资源 ?v=${n} · SW 缓存 v${cn}`);
