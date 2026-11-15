/* =====================================================
   研途阅读 · 书房翻页引擎（book.js）
   - 阅读室可切换「📖 线装书翻页 / 📜 长卷滚动」（记忆用户选择）
   - 翻页模式：按段落智能分页（超页段落按句切分），3D 翻页动画
   - 支持 按钮 / 左右滑动手势 / 键盘方向键
   - 朗读（TTS）时自动跟随翻到正在读的段落
   - 不改动 core.js 任何功能逻辑，仅在其渲染后接管排版
   ===================================================== */
(function(){
  'use strict';
  if (window.__YT_BOOK__) return;
  window.__YT_BOOK__ = true;

  const FLIP_MS = 600;
  const LS_KEY  = 'yt_flip';
  const $ = (s) => document.querySelector(s);

  const stage = () => document.getElementById('bookStage');
  const leaf  = () => document.getElementById('leaf');
  const art   = () => document.getElementById('article');

  const S = {
    mode: 'flip',        /* 'flip' | 'scroll' */
    pages: [],
    pi: 0,
    busy: false
  };

  try {
    S.mode = (localStorage.getItem(LS_KEY) === '0') ? 'scroll' : 'flip';
  } catch(e) {}

  function saveMode(){
    try { localStorage.setItem(LS_KEY, S.mode === 'flip' ? '1' : '0'); } catch(e) {}
  }

  function readerVisible(){
    const r = document.getElementById('reader');
    return !!(r && r.style.display !== 'none');
  }

  /* ---------- 显示辅助 ---------- */
  function showAll(){
    const a = art(); if (!a) return;
    a.querySelectorAll(':scope > .para').forEach(p => {
      p.style.display = '';
      p.querySelectorAll(':scope > .sent').forEach(s => { s.style.display = ''; });
    });
  }

  /* pages: [{type:'paras', els:[...]}, {type:'range', para, from, to}] */
  function showPage(i){
    const a = art(); if (!a) return;
    const pg = S.pages[i];
    a.querySelectorAll(':scope > .para').forEach(p => { p.style.display = 'none'; });
    if (!pg){ updateInd(); return; }
    if (pg.type === 'paras'){
      pg.els.forEach(p => {
        p.style.display = '';
        p.querySelectorAll(':scope > .sent').forEach(s => { s.style.display = ''; });
      });
    } else {
      const p = pg.para;
      p.style.display = '';
      const sents = p.querySelectorAll(':scope > .sent');
      sents.forEach((s, si) => { s.style.display = (si >= pg.from && si < pg.to) ? '' : 'none'; });
    }
    updateInd();
  }

  function updateInd(){
    const total = Math.max(1, S.pages.length);
    const cur = Math.min(S.pi, total - 1) + 1;
    const ind = document.getElementById('pgInd');
    const foot = document.getElementById('pageFoot');
    const txt = '第 ' + cur + ' 页 · 共 ' + total + ' 页';
    const shortTxt = cur + ' / ' + total;
    if (ind) ind.textContent = shortTxt;
    if (foot) foot.textContent = txt;
    const prev = document.getElementById('pgPrev');
    const next = document.getElementById('pgNext');
    if (prev) prev.style.visibility = (S.pi <= 0) ? 'hidden' : 'visible';
    if (next) next.style.visibility = (S.pi >= S.pages.length - 1) ? 'hidden' : 'visible';
    const prog = document.getElementById('readProgBar');
    if (prog) prog.style.width = (cur / total * 100) + '%';
  }

  /* ---------- 阅读位置恢复（确定性）：文章渲染时读入目标页码，每次分页无条件应用 ---------- */
  function queueRestore(id){
    try{
      const pos = loadPos()[id];
      if(pos && pos.mode === S.mode){
        if(S.mode === 'flip' && typeof pos.pi === 'number'){ S.restorePi = pos.pi; S.restoreActive = true; }
        else if(S.mode === 'scroll' && pos.y){ S.restoreY = pos.y; S.restoreActive = true; }
      }
    }catch(e){}
  }
  /* ---------- 分页 ---------- */
  function elH(el){
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return r.height + parseFloat(cs.marginTop || 0) + parseFloat(cs.marginBottom || 0);
  }

  function paginate(){
    const st = stage(), lf = leaf(), a = art();
    if (!st || !lf || !a) return;
    if (S.mode !== 'flip' || !readerVisible()){
      st.style.height = '';
      lf.classList.remove('paged');
      showAll();
      updateInd();
      return;
    }
    if(!__layoutReady){ showAll(); updateInd(); return; }   /* 字体未就绪：暂不分页，就绪后一次成型 */
    /* 纸张高度：以 scrollTop=0 的阅读起始位置为准（文档坐标）
       窄屏时书架是底部 dock，需要扣除其高度 */
    showAll();
    const topDoc = st.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0);
    const shelfEl = document.getElementById('shelf');
    const dockH = (window.matchMedia && window.matchMedia('(max-width:979px)').matches && shelfEl)
      ? shelfEl.getBoundingClientRect().height : 0;
    const H = Math.max(240, window.innerHeight - topDoc - 22 - dockH);
    st.style.height = H + 'px';

    /* 贪心分页：段落为原子单位；超页段落按句切分 */
    const paras = [...a.querySelectorAll(':scope > .para')];
    const pages = [];
    let cur = [], used = 0;
    const flush = () => { if (cur.length){ pages.push({ type:'paras', els:cur }); cur = []; used = 0; } };

    for (const p of paras){
      const h = elH(p);
      if (h > H - 8){
        flush();
        const sents = [...p.querySelectorAll(':scope > .sent')];
        if (!sents.length){ pages.push({ type:'paras', els:[p] }); continue; }
        let acc = 0, start = 0;
        for (let i = 0; i < sents.length; i++){
          const sh = elH(sents[i]);
          if (acc + sh > H - 12 && i > start){
            pages.push({ type:'range', para:p, from:start, to:i });
            start = i; acc = sh;
          } else {
            acc += sh;
          }
        }
        pages.push({ type:'range', para:p, from:start, to:sents.length });
      } else {
        if (used + h > H - 8 && cur.length){ flush(); }
        cur.push(p); used += h;
      }
    }
    flush();
    S.pages = pages.length ? pages : [{ type:'paras', els:[] }];
    if (S.pi >= S.pages.length) S.pi = S.pages.length - 1;
    if (S.pi < 0) S.pi = 0;
    if(S.restoreActive){
      if(S.restorePi != null){ S.pi = Math.min(S.restorePi, S.pages.length - 1); }
      S.restoreActive = false;   /* 只应用一次；之后以用户翻页为准 */
    }
    showPage(S.pi);
  }

  /* ---------- 翻页动画 ---------- */
  function stripIds(node){
    node.removeAttribute('id');
    node.querySelectorAll('[id]').forEach(e => e.removeAttribute('id'));
  }

  function turn(dir){
    if (S.busy || S.mode !== 'flip' || !readerVisible()) return;
    const np = S.pi + dir;
    if (np < 0 || np >= S.pages.length) return;
    const st = stage(), lf = leaf();
    if (!st || !lf) return;
    S.busy = true;

    const wrapEl = document.createElement('div');
    wrapEl.className = 'flipWrap';
    const oldPi = S.pi;
    let clone;
    if (dir > 0){
      clone = lf.cloneNode(true);
      stripIds(clone);
      S.pi = np;
      showPage(np);
    } else {
      showPage(np);
      clone = lf.cloneNode(true);
      stripIds(clone);
      S.pi = oldPi;
      showPage(oldPi);
    }
    clone.classList.add('flipClone');
    const back = document.createElement('div');
    back.className = 'flipBack';
    wrapEl.appendChild(clone);
    wrapEl.appendChild(back);
    st.appendChild(wrapEl);

    const from = dir > 0 ? 0 : -180;
    const to   = dir > 0 ? -180 : 0;
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      S.pi = np;
      showPage(np);
      wrapEl.remove();
      updateInd();
      S.busy = false;
      S.restoreActive = false;
      saveCur();
    };
    if (typeof wrapEl.animate === 'function'){
      try {
        const anim = wrapEl.animate(
          [{ transform:'rotateY(' + from + 'deg)' }, { transform:'rotateY(' + to + 'deg)' }],
          { duration: FLIP_MS, easing: 'cubic-bezier(.4,.1,.3,1)' }
        );
        anim.onfinish = done;
        setTimeout(done, FLIP_MS + 120);
      } catch(e){ done(); }
    } else {
      done();
    }
    setTimeout(updateInd, FLIP_MS / 2);
  }

  /* ---------- 交互绑定 ---------- */
  function bindControls(){
    const prev = document.getElementById('pgPrev');
    const next = document.getElementById('pgNext');
    if (prev) prev.addEventListener('click', () => turn(-1));
    if (next) next.addEventListener('click', () => turn(1));

    const btn = document.getElementById('flipBtn');
    if (btn) btn.addEventListener('click', () => setMode(S.mode === 'flip' ? 'scroll' : 'flip'));

    const st = stage();
    if (st){
      let sx = 0, sy = 0, on = false;
      st.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) { on = false; return; }
        on = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY;
      }, { passive:true });
      st.addEventListener('touchend', (e) => {
        if (!on) return; on = false;
        const t = e.changedTouches && e.changedTouches[0];
        if (!t) return;
        const dx = t.clientX - sx, dy = t.clientY - sy;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2){
          turn(dx < 0 ? 1 : -1);
        }
      }, { passive:true });
    }

    document.addEventListener('keydown', (e) => {
      if (S.mode !== 'flip' || !readerVisible()) return;
      const tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (e.key === 'ArrowRight') turn(1);
      else if (e.key === 'ArrowLeft') turn(-1);
    });

    /* TTS 跟随 */
    const a = art();
    if (a && typeof MutationObserver === 'function'){
      let tt = null;
      new MutationObserver(() => {
        if (S.mode !== 'flip' || !readerVisible()) return;
        clearTimeout(tt);
        tt = setTimeout(() => {
          const on = a.querySelector('.para.tts-on');
          if (!on) return;
          const idx = S.pages.findIndex(pg =>
            pg.type === 'paras' ? pg.els.includes(on) : pg.para === on);
          if (idx >= 0 && idx !== S.pi && !S.busy){ S.pi = idx; showPage(idx); }
        }, 120);
      }).observe(a, { subtree:true, attributes:true, attributeFilter:['class'] });
    }

    /* 字号变化 → 重排 */
    if (typeof MutationObserver === 'function'){
      let ft = null;
      new MutationObserver(() => {
        clearTimeout(ft);
        ft = setTimeout(refresh, 160);
      }).observe(document.documentElement, { attributes:true, attributeFilter:['style'] });
    }

    let rt = null;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(refresh, 200);
    });
  }

  /* ---------- 模式切换 ---------- */
  function applyModeUI(){
    document.body.classList.toggle('flip-on', S.mode === 'flip');
    const btn = document.getElementById('flipBtn');
    if (btn){
      btn.textContent = S.mode === 'flip' ? '📖' : '📜';
      btn.title = S.mode === 'flip' ? '当前：线装书翻页（点击切换长卷）' : '当前：长卷滚动（点击切换翻页）';
    }
  }

  function setMode(m){
    if (S.mode === m){ applyModeUI(); return; }
    S.mode = m;
    S.pi = 0;
    S.busy = false;
    saveMode();
    applyModeUI();
    refresh();
  }

  let __layoutReady = !!(document.fonts && document.fonts.status === 'loaded');
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){ __layoutReady = true; setTimeout(refresh, 60); }).catch(function(){});
  }
  function refresh(){
    requestAnimationFrame(paginate);
  }

  /* ---------- 接管 core.js 的渲染钩子（不改变其逻辑） ---------- */
  function hook(fnName, after){
    const orig = window[fnName];
    if (typeof orig !== 'function') return;
    window[fnName] = function(){
      const r = orig.apply(this, arguments);
      try { after.apply(this, arguments); } catch(e) {}
      return r;
    };
  }
  /* 难度校验报告：用 WORD_BANK（22295 词，每词带级别标签）核对生成文章的词汇分布。
     分级依据官方大纲词汇量：四级 ≈4500 / 六级 ≈6000 / 考研 ≈5500。 */
  let __lvlIdx = null;
  function levelIndex(){
    if (typeof WORD_BANK === 'undefined' || !WORD_BANK.length) return null;
    if (__lvlIdx) return __lvlIdx;
    const idx = new Map();
    const order = {cet4:0, cet6:1, ky:2, beyond:3};
    WORD_BANK.forEach(function(entry){
      const tags = String(entry[5]||'');
      let lvl = 'beyond';
      if (/四级|高考/.test(tags)) lvl = 'cet4';
      else if (/六级/.test(tags)) lvl = 'cet6';
      else if (/考研/.test(tags)) lvl = 'ky';
      const w = String(entry[0]||'').toLowerCase();
      if (!idx.has(w) || order[lvl] < order[idx.get(w)]) idx.set(w, lvl);
    });
    __lvlIdx = idx; return idx;
  }
  function difficultyReport(p){
    const idx = levelIndex();
    if (!idx) return null;
    const tokens = p.paras.flat().map(s=>s.en).join(' ').toLowerCase()
      .replace(/[^a-z'\- ]+/g,' ').split(/\s+/).filter(Boolean);
    const cnt = {cet4:0, cet6:0, ky:0, beyond:0, unknown:0};
    tokens.forEach(function(t){ const l = idx.get(t); if(l) cnt[l]++; else cnt.unknown++; });
    const sentCount = p.paras.flat().length;
    const known = tokens.length - cnt.unknown;
    const pct = (x) => known ? Math.round(x/known*100) : 0;
    return {
      total: tokens.length,
      wps: Math.round(tokens.length / Math.max(1, sentCount)),
      cet4: pct(cnt.cet4), cet6: pct(cnt.cet6), ky: pct(cnt.ky), beyond: pct(cnt.beyond),
      unknownN: cnt.unknown
    };
  }
  hook('renderPassage', function(){
    S.pi = 0; refresh();
    try{
      if (typeof curPassage !== 'undefined' && curPassage && curPassage.paras){
        /* 恢复该篇上次阅读位置：排队待分页完成后应用（见 paginate 尾部） */
        if(curPassage.id) queueRestore(curPassage.id);
        let rep = difficultyReport(curPassage);
        if (!rep && window.ensureWordBank) window.ensureWordBank();   /* 词库未就绪：后台加载，下次渲染出报告 */
        if (!rep) return;
        const mc = document.getElementById('metaChips');
        if (mc){
          const chip = document.createElement('span');
          chip.className = 'metaDiff';
          chip.title = '词汇分布按 WORD_BANK 级别标签统计（已知词归一）';
          chip.textContent = '📊 四级内词汇 ' + rep.cet4 + '% · 超纲 ' + rep.beyond + '%';
          mc.appendChild(chip);
        }
        console.log('[难度校验] 《' + (curPassage.titleEn||'') + '》 总词数 ' + rep.total +
          ' · 平均句长 ' + rep.wps + ' 词 · 词汇分布（已知词归一）：四级内 ' + rep.cet4 + '% / 六级 ' +
          rep.cet6 + '% / 考研 ' + rep.ky + '% / 超纲 ' + rep.beyond + '%');
      }
    }catch(e){}
  });
  hook('applyMode', () => { refresh(); });
  hook('showReader', () => { refresh(); });

  function init(){
    applyModeUI();
    bindControls();
    refresh();
  }
  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ---------- 点词查词：点击文章单词 → 释义弹层（数据来自 WORD_BANK） ---------- */
  let __wordPop = null;
  let __wordPopCloser = null;
  function wpEsc(s){
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function closeWordPop(){
    if(__wordPop){ __wordPop.remove(); __wordPop = null; }
    if(__wordPopCloser){ document.removeEventListener('click', __wordPopCloser); __wordPopCloser = null; }
  }
  function lookupWord(w){
    const tries = [[w, w]];
    if(w.endsWith('ies')) tries.push([w.slice(0,-3)+'y', w.slice(0,-3)]);
    if(w.endsWith('es'))  tries.push([w.slice(0,-2), w.slice(0,-2)]);
    if(w.endsWith('s'))   tries.push([w.slice(0,-1), w.slice(0,-1)]);
    if(w.endsWith('ing')){ tries.push([w.slice(0,-3), ''], [w.slice(0,-3)+'e', '']); }
    if(w.endsWith('ed')) { tries.push([w.slice(0,-2), ''], [w.slice(0,-1), '']); }
    for(const [t, base] of tries){
      const hit = WORD_BANK.find(function(x){ return x[0].toLowerCase()===t; });
      if(hit) return {entry: hit, base: base || t};
    }
    return null;
  }
  function showWordPopup(x, y, entry, base){
    closeWordPop();
    const pop = document.createElement('div'); pop.className = 'wordPop';
    const tags = String(entry[5]||'');
    const ipa = entry[1];
    pop.innerHTML =
      '<div class="wpWord">' + wpEsc(entry[0]) + (ipa ? '<span class="wpIpa">' + wpEsc(ipa) + '</span>' : '') + '</div>' +
      (base && base !== entry[0].toLowerCase() ? '<div class="wpBase">原型词：' + wpEsc(base) + '</div>' : '') +
      (tags ? '<div class="wpTags">' + wpEsc(tags) + '</div>' : '') +
      '<div class="wpMeaning">' + wpEsc(entry[2]) + '</div>' +
      (entry[3] ? '<div class="wpEx">' + wpEsc(entry[3]) + '<br>' + wpEsc(entry[4]) + '</div>' : '') +
      '<div class="wpBtns">' +
      '<button class="wpBtn" data-act="speak">🔊 发音</button>' +
      '<button class="wpBtn" data-act="add">＋ 加入背词</button></div>';
    document.body.appendChild(pop);
    const rect = pop.getBoundingClientRect();
    let px = Math.min(window.innerWidth - rect.width - 12, Math.max(10, x + 10));
    let py = y + 18;
    if(py + rect.height > window.innerHeight - 10) py = Math.max(10, y - rect.height - 14);
    pop.style.left = px + 'px'; pop.style.top = py + 'px';
    pop.querySelector('[data-act="speak"]').onclick = function(ev){
      ev.stopPropagation();
      try{
        const u = new SpeechSynthesisUtterance(entry[0]);
        u.lang = 'en-US';
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      }catch(err){}
    };
    pop.querySelector('[data-act="add"]').onclick = function(ev){
      ev.stopPropagation();
      const w = entry[0].toLowerCase();
      let added = false;
      try{
        const st = getWordState();
        if(!st[w]){ st[w] = {s:'u', t:Date.now()}; saveWordState(st); added = true; }
      }catch(err){}
      this.textContent = added ? '✓ 已加入背词' : '已在背词中';
      showToast(added ? ('已加入背词：' + w) : '该词已在背词列表');
    };
    __wordPop = pop;
    setTimeout(function(){
      __wordPopCloser = function closer(ev){
        if(!pop.contains(ev.target)){
          pop.remove(); __wordPop = null;
          document.removeEventListener('click', closer);
          if(__wordPopCloser === closer) __wordPopCloser = null;
        }
      };
      document.addEventListener('click', __wordPopCloser);
    }, 30);
  }
  function bindWordLookup(){
    const a = document.getElementById('article');
    if(!a) return;
    a.addEventListener('click', function(e){
      /* 朗读进行中：保留原有点段落跳转行为 */
      if(typeof tts !== 'undefined' && tts.playing) return;
      /* 翻页模式：书页外缘 12% 点击 = 翻页（真书空间交互，优先于点词） */
      if (S.mode === 'flip' && readerVisible() && !S.busy){
        const rect0 = document.getElementById('bookStage').getBoundingClientRect();
        const rel0 = (e.clientX - rect0.left) / rect0.width;
        const onCtl = e.target.closest('button, select, input, a, summary');
        if (!onCtl && (rel0 < 0.12 || rel0 > 0.88)){
          e.preventDefault(); e.stopPropagation();
          turn(rel0 > 0.5 ? 1 : -1);
          return;
        }
      }
      if(typeof WORD_BANK === 'undefined' || !WORD_BANK.length) return;
      let rng = document.caretRangeFromPoint ? document.caretRangeFromPoint(e.clientX, e.clientY) : null;
      if(!rng && document.caretPositionFromPoint){
        const cp = document.caretPositionFromPoint(e.clientX, e.clientY);   /* Firefox */
        rng = cp ? { startContainer: cp.offsetNode, startOffset: cp.offset } : null;
      }
      if(!rng || !rng.startContainer || rng.startContainer.nodeType !== 3) return;
      const text = rng.startContainer.textContent, off = rng.startOffset;
      const isW = (ch) => /[A-Za-z'’-]/.test(ch);
      let a2 = off, b2 = off;
      while(a2 > 0 && isW(text[a2-1])) a2--;
      while(b2 < text.length && isW(text[b2])) b2++;
      const word = text.slice(a2, b2).toLowerCase();
      if(word && word.length >= 2 && /^[a-z][a-z'’-]*$/.test(word)){
        const found = lookupWord(word);
        if(found){
          e.preventDefault(); e.stopPropagation();
          showWordPopup(e.clientX, e.clientY, found.entry, found.base);
          return;
        }
      }
      /* 其余点击：维持原有段落跳读行为 */
    }, true);
  }
  bindWordLookup();

  /* 字体加载完成后重排一次：避免字体切换导致分页/恢复错位 */
  if(document.fonts && document.fonts.ready){
    document.fonts.ready.then(function(){ setTimeout(refresh, 60); }).catch(function(){});
  }

  /* ---------- 桌面滚轮翻页（翻页模式） ---------- */
  let __wheelLock = 0;
  const stEl = document.getElementById('bookStage');
  if (stEl){
    stEl.addEventListener('wheel', function(e){
      if (S.mode !== 'flip' || !readerVisible() || S.busy) return;
      e.preventDefault();
      const now = Date.now();
      if (now - __wheelLock < 450) return;
      if (Math.abs(e.deltaY) < 25) return;
      __wheelLock = now;
      turn(e.deltaY > 0 ? 1 : -1);
    }, {passive:false});
  }

  /* ---------- 阅读位置记忆：每篇文章记住页码（翻页）/滚动位置（长卷） ---------- */
  function loadPos(){
    try{ return JSON.parse(localStorage.getItem('yt_readpos')||'{}'); }catch(e){ return {}; }
  }
  function savePos(id, data){
    if(!id) return;
    try{
      const all = loadPos();
      all[id] = Object.assign({ts: Date.now()}, data);
      const keys = Object.keys(all).sort(function(a,b){ return all[b].ts - all[a].ts; });
      const trimmed = {};
      keys.slice(0, 50).forEach(function(k){ trimmed[k] = all[k]; });
      localStorage.setItem('yt_readpos', JSON.stringify(trimmed));
    }catch(e){}
  }
  function saveCur(){
    try{
      if(typeof curPassage === 'undefined' || !curPassage || !curPassage.id) return;
      if(!readerVisible()) return;
      if(S.mode === 'flip'){ savePos(curPassage.id, {mode:'flip', pi:S.pi}); }
      else { savePos(curPassage.id, {mode:'scroll', y:window.scrollY||0}); }
    }catch(e){}
  }
  document.addEventListener('visibilitychange', function(){
    if(document.visibilityState === 'hidden'){
      /* 恢复待定期间：页面刚载入尚未读到保存位置，此时保存会用第 1 页覆盖真实进度 */
      if(!S.restoreActive) saveCur();
    }
  });
  window.addEventListener('beforeunload', function(){
    if(!S.restoreActive) saveCur();
  });
  let __scrollSave = null;
  window.addEventListener('scroll', function(){
    clearTimeout(__scrollSave);
    __scrollSave = setTimeout(function(){
      if(S.mode === 'scroll' && readerVisible()) saveCur();
    }, 500);
  }, {passive:true});

  /* 刷新恢复：core 初始化先于本文件，补挂恢复意图 */
  try{
    const rid = window.__ytRestoreId;
    if(rid && typeof curPassage !== 'undefined' && curPassage && curPassage.id === rid){
      queueRestore(rid);
      refresh();
    }
    window.__ytRestoreId = null;
  }catch(e){}

  window.Book = { turn, refresh, setMode, state: S };
  window.__ytDifficultyReport = difficultyReport;   /* 难度校验报告（可外部调用） */
})();
