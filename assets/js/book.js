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
          if (idx >= 0 && idx !== S.pi){ S.pi = idx; showPage(idx); }
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
        const rep = difficultyReport(curPassage);
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

  window.Book = { turn, refresh, setMode, state: S };
  window.__ytDifficultyReport = difficultyReport;   /* 难度校验报告（可外部调用） */
})();
