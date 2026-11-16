/* =====================================================
   研途阅读 · 动效编排器 v4「动漫开镜」（motion.js）
   每个功能一个专属动效包 + 一幕转场特效（WAAPI/CSS，零依赖）
   动效语法源自 ui2v-motions 库：back.out 弹性 / expo.out 收束 /
   大幅位移 + 卡通物理（squash & stretch 落地回弹）
   —— 12 个场景全覆盖：
     home    案头陈设（磁贴落地压扁回弹 + 墨瓣飘落）
     reader  墨晕开卷（书名墨迹显影 + 笔锋线 + 墨斩转场）
     quiz    落笔作答（选项盖章落下 + 漫画集中线/闪帧）
     cloze   拼版落字（词块活字坠落归位 + 压扁回弹）
     longread 寻行数墨（段落显影 + 墨斩转场）
     words   抽卡背词（卡片翻转抽出 + 星芒爆散）
     speak   对坐会话（对话行左右交替 + 集中线）
     trans   批注落笔（句子浮起 + 序号盖章 + 墨斩）
     writing 铺纸研墨（稿纸逐层铺开）
     mock    试卷下发（考卷自上而下 + 集中线/闪帧）
     games   发牌开局（卡牌逐张飞出 + 星芒爆散）
     profile 书房开卷（名片落地回弹 + 数字滚动）
   - 场景切换方向感知（前进从右 / 返回从左）
   - 转场特效层 #mFx：墨斩/集中线/星爆，播完即自毁
   - CTA 点击冲击环；AI 设置面板展开弹入
   - 动态 stage（gm/wr/mock/trans）结构变化自动开工
   - 动画结束即 cancel，不长期占住 transform（hover 可用）
   - 尊重 prefers-reduced-motion（整套禁用）
   ===================================================== */
(function(){
  'use strict';
  if (window.__YT_MOTION__) return;
  window.__YT_MOTION__ = true;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const EASE = {
    out:  'cubic-bezier(0.22, 1, 0.36, 1)',              /* ≈ expo/power2 out */
    back: 'cubic-bezier(0.34, 1.8, 0.64, 1)'             /* ≈ back.out(1.8) 夸张回弹 */
  };
  /* 场景注册表（顺序即"前进/返回"方向感） */
  const SECS = ['home','reader','quiz','cloze','longread','words','speak','trans','writing','mock','games','profile'];
  const ORDER = {home:0, reader:1, quiz:2, cloze:3, longread:4, words:5, speak:6, trans:7, writing:8, mock:9, games:10, profile:11};

  /* ---------- 各功能专属动效包 ----------
     step: [选择器, 参数]
     参数：y/x 位移px · s 缩放 · rz 倾角deg · blur 墨晕px · d 时长ms ·
           e 缓动 · stagger 间隔ms · limit 上限 · fadeOnly 纯淡入 ·
           alt 倾角/方向按序号交替 · land 卡通落地（下落→压扁→回弹）
     红线：reader 场景 #article/#vocabBox 只做纯淡入——
           book.js 分页测量用 getBoundingClientRect，位移会污染测量 */
  const PACKS = {
    /* 案头工作台：物件落案（磁贴卡通落地） */
    home: [
      ['.deskGreet',        {y:16, blur:5, d:520}],
      ['.scrollBox',        {x:-26, s:.95, d:680, e:'back'}],
      ['.statTiles .tile',  {land:true, d:640, stagger:90}],
      ['.stationeryItem',   {x:-18, d:500, stagger:55, limit:8}],
      ['.deskTip',          {y:12, d:460}]
    ],
    /* 线装书阅读室：墨迹显影 + 墨斩转场 */
    reader: [
      ['.bookCtl',          {y:-14, d:480}],
      ['.bookTitle',        {y:18, blur:8, d:720}],
      ['.titleCn',          {y:12, d:540}],
      ['#metaChips span',   {s:.86, d:420, stagger:45, e:'back', limit:6}],
      ['#article',          {d:520, fadeOnly:true}],
      ['#vocabBox',         {d:480, fadeOnly:true}]
    ],
    /* 做题：选项如印章逐枚落下 + 集中线转场 */
    quiz: [
      ['.wCard',            {y:20, d:560}],
      ['#qOptions .qOpt',   {land:true, d:520, stagger:60}],
      ['.wBtns',            {y:14, d:440}]
    ],
    /* 选词填空：活字坠落归位（压扁回弹） */
    cloze: [
      ['#clozePassage',     {y:18, d:540}],
      ['#clzBank .clzChip', {land:true, d:560, stagger:40, limit:15}],
      ['.wBtns',            {y:14, d:440}]
    ],
    /* 长篇阅读：段落显影（纯淡入防测量污染）+ 墨斩 */
    longread: [
      ['#lrPassage .lrPara',{d:440, stagger:40, limit:10, fadeOnly:true}],
      ['#lrItems .lrItem',  {y:14, d:440, stagger:45, limit:6}]
    ],
    /* 背词：抽卡翻转落定 + 星芒爆散 */
    words: [
      ['.sceneHead',        {y:-14, d:440}],
      ['#wordFilter button',{s:.88, y:8, d:400, stagger:30, e:'back'}],
      ['.wCard',            {y:26, rz:-5, alt:true, s:.9, d:680, e:'back'}],
      ['.wBtns',            {y:14, d:440}],
      ['#wStats',           {y:12, d:400}]
    ],
    /* 录音跟读：对坐会话左右交替 + 集中线 */
    speak: [
      ['.sceneHead',        {y:-14, d:440}],
      ['#spDialog .dl',     {x:16, alt:true, d:460, stagger:45, limit:8}],
      ['.wBtns',            {y:14, d:440}]
    ],
    /* 翻译训练：句子浮起 + 序号盖章（行动画由 playStage 统一触发） */
    trans: [
      ['.sceneHead',        {y:-14, d:440}],
      ['.deskTip',          {y:12, d:460}]
    ],
    /* AI 作文批改：稿纸逐层铺开（稿纸动画由 playStage 统一触发） */
    writing: [
      ['.sceneHead',        {y:-14, d:440}],
      ['#wrTypeSeg button', {s:.88, y:8, d:400, stagger:30, e:'back'}]
    ],
    /* 仿真模考：试卷自上而下发放 + 集中线/闪帧 */
    mock: [
      ['.sceneHead',        {y:-14, d:440}],
      ['#mkReport',         {y:14, d:460}]
    ],
    /* 游戏角：发牌开局 + 星芒爆散 */
    games: [
      ['.sceneHead',        {y:-14, d:440}],
      ['#gmLevelSeg button',{s:.88, y:8, d:400, stagger:30, e:'back'}],
      ['#gameSeg button',   {s:.88, y:8, d:400, stagger:35, e:'back'}],
      ['#gmStats',          {y:12, d:420}]
    ],
    /* 书房：名片落地回弹 + 数字滚动 */
    profile: [
      ['.meHead',           {y:-14, d:440}],
      ['.meCard',           {land:true, d:680}],
      ['.meStats > div',    {y:12, d:480, stagger:70}],
      ['.secondary',        {y:12, d:440, stagger:50, limit:5}],
      ['#pwaInstallBtn',    {y:12, d:440}],
      ['#favList .favCard', {y:14, d:440, stagger:50, limit:6}],
      ['#histList .favCard',{y:14, d:440, stagger:50, limit:5}],
      ['#wrongList .favCard',{y:14, d:440, stagger:50, limit:4}]
    ]
  };

  /* 动态工作台：结构变化时触发开工动效（游戏发牌/稿纸铺开/试卷下发/批注落笔）
     格式与 PACKS 一致：多步 [选择器, 参数] */
  const STAGES = {
    gmStage: [
      ['#gmStage > *',      {y:16, s:.96, d:480}],
      ['#gmStage .gmCard',  {y:18, rz:3, alt:true, s:.88, d:500, stagger:45, e:'back'}]
    ],
    wrStage: [
      ['#wrStage > *',      {y:18, s:.96, d:540, stagger:80}]
    ],
    mockStage: [
      ['#mockStage > *',    {y:-18, d:500, stagger:90}]
    ],
    transStage: [
      ['#transStage .trQ',  {y:16, d:480, stagger:70}],
      ['#transStage .trNo', {s:.7, d:400, stagger:70, e:'back'}]
    ]
  };

  /* ---------- 转场特效（每场景一幕） ----------
     ink   墨斩：斜向笔刷横扫（阅读类场景）
     speed 漫画集中线 + 冲击闪帧（紧张类场景）
     burst 星芒爆散 + 冲击环（高光类场景） */
  const SCENE_FX = {reader:'ink', longread:'ink', trans:'ink', quiz:'speed', mock:'speed', speak:'speed', words:'burst', games:'burst'};
  let fxLayer = null;
  function ensureFx(){
    if(fxLayer && document.body.contains(fxLayer)) return fxLayer;
    fxLayer = document.createElement('div');
    fxLayer.id = 'mFx';
    document.body.appendChild(fxLayer);
    return fxLayer;
  }
  function fxNode(cls, ms){
    const n = document.createElement('div');
    n.className = cls;
    n.addEventListener('animationend', function(){ n.remove(); });
    setTimeout(function(){ if(n.parentNode) n.remove(); }, ms + 200);   /* 兜底 */
    return n;
  }
  function playFx(kind){
    if(!kind) return;
    const fx = ensureFx();
    if(kind === 'ink'){
      fx.appendChild(fxNode('mFxInk a', 700));
      fx.appendChild(fxNode('mFxInk b', 800));
    } else if(kind === 'speed'){
      fx.appendChild(fxNode('mFxSpeed', 520));
      fx.appendChild(fxNode('mFxFlash', 200));
    } else if(kind === 'burst'){
      fx.appendChild(fxNode('mFxRing', 560));
      for(let i = 0; i < 12; i++){
        const s = fxNode('mFxStar', 620);
        const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
        const d = 90 + Math.random() * 140;
        s.textContent = '✦';
        s.style.setProperty('--dx', Math.round(Math.cos(a) * d) + 'px');
        s.style.setProperty('--dy', Math.round(Math.sin(a) * d * 0.72 - 30) + 'px');
        s.style.setProperty('--rot', Math.round(Math.random() * 260 - 130) + 'deg');
        if(i % 2) s.style.color = 'var(--gold)';
        s.style.fontSize = (13 + Math.random() * 9) + 'px';
        fx.appendChild(s);
      }
    }
  }

  /* ---------- CTA 冲击环：研墨提笔按下时在点击点炸开 ---------- */
  function spawnRing(x, y, small){
    const fx = ensureFx();
    const r = fxNode('mFxRing' + (small ? ' small' : ''), 560);
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    fx.appendChild(r);
  }
  function armImpact(){
    document.addEventListener('click', function(e){
      const b = e.target.closest('.brushBtn');
      if(b) spawnRing(e.clientX, e.clientY, true);
    }, true);
  }

  /* ---------- 氛围粒子：案头与阅读室飘落墨瓣（朱砂/金交替） ---------- */
  function plantAmbient(){
    [['home', 8], ['reader', 8]].forEach(function(pair){
      const sec = document.getElementById(pair[0]);
      if(!sec || sec.querySelector('.mAmbient')) return;
      const box = document.createElement('div');
      box.className = 'mAmbient';
      for(let i = 0; i < pair[1]; i++){
        const p = document.createElement('i');
        p.className = 'mPetal';
        p.style.left = (2 + Math.random() * 94) + '%';
        p.style.setProperty('--pd', (9 + Math.random() * 7) + 's');
        p.style.setProperty('--pdelay', (-Math.random() * 16) + 's');
        p.style.setProperty('--sw', Math.round(Math.random() * 80 - 40) + 'px');
        const sz = 7 + Math.random() * 6;
        p.style.width = sz + 'px';
        p.style.height = (sz * 0.74) + 'px';
        p.style.background = (i % 2) ? 'var(--gold)' : 'var(--cinnabar)';
        p.style.opacity = (0.28 + Math.random() * 0.3).toFixed(2);
        box.appendChild(p);
      }
      sec.appendChild(box);
    });
  }

  /* ---------- AI 设置面板：展开时内容弹入 ---------- */
  function armDetails(){
    const d = document.getElementById('aiCfgBox');
    if(!d) return;
    d.addEventListener('toggle', function(){
      if(!d.open) return;
      const kids = d.querySelectorAll(':scope > *:not(summary)');
      for(let i = 0; i < kids.length; i++) enter(kids[i], {y:12, d:420}, 40 + i * 55, i);
    });
  }

  let lastScene = null;
  let running = [];          /* 进行中的入场动画，切场景时取消 */

  function cancelRunning(){
    running.forEach(function(a){ try{ a.cancel(); }catch(e){} });
    running = [];
  }
  /* 单元素入场（多属性 transform 合成；land=卡通落地；结束即 cancel 释放样式） */
  function enter(el, opt, delay, idx){
    if(!el || !el.offsetParent) return;                    /* 隐藏元素跳过 */
    let kf;
    if(opt.land){
      /* 卡通物理：高处落下 → 压扁 → 纵向回弹 → 静定 */
      kf = {
        opacity: [0, 1, 1, 1, 1],
        transform: [
          'translateY(-44px) scale(1.12, 0.86)',
          'translateY(0px) scale(0.9, 1.1)',
          'scale(1.06, 0.94)',
          'scale(0.985, 1.015)',
          'scale(1, 1)'
        ],
        offset: [0, 0.5, 0.72, 0.88, 1]
      };
    } else {
      kf = {opacity:[0,1]};
      const from = [], to = [];
      let x = opt.x, rz = opt.rz;
      if(opt.alt){                                         /* 交替方向/倾角 */
        const sg = (idx % 2 === 0) ? 1 : -1;
        if(x !== undefined) x *= sg;
        if(rz !== undefined) rz *= sg;
      }
      if(x !== undefined){ from.push('translateX(' + x + 'px)'); to.push('translateX(0)'); }
      if(opt.y){ from.push('translateY(' + opt.y + 'px)'); to.push('translateY(0)'); }
      if(rz !== undefined){ from.push('rotate(' + rz + 'deg)'); to.push('rotate(0deg)'); }
      if(opt.s){ from.push('scale(' + opt.s + ')'); to.push('scale(1)'); }
      if(from.length) kf.transform = [from.join(' '), to.join(' ')];
      if(opt.blur) kf.filter = ['blur(' + opt.blur + 'px)', 'blur(0px)'];
      if(opt.fadeOnly) delete kf.transform;
    }
    const anim = el.animate(kf, {
      duration: opt.d || 480,
      delay: delay || 0,
      easing: EASE[opt.e || 'out'],
      fill: 'both'
    });
    anim.onfinish = function(){ try{ anim.cancel(); }catch(e){} };
    running.push(anim);
    return anim;
  }
  /* stagger 组 */
  function staggerAll(sel, opt, base){
    const els = document.querySelectorAll(sel);
    const n = opt.limit ? Math.min(els.length, opt.limit) : els.length;
    for(let i = 0; i < n; i++) enter(els[i], opt, base + i * (opt.stagger || 55), i);
  }
  /* 执行整个动效包 */
  function runPack(pack, base){
    (pack || []).forEach(function(st){ staggerAll(st[0], st[1], base); });
  }
  /* 统计数字滚动（0 → 目标值，带千分位，power3.out） */
  function tickNumber(el, target, dur){
    const start = performance.now();
    function frame(now){
      const p = Math.min(1, (now - start) / (dur || 650));
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US');
      if(p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  /* 书房名片 + 工作台磁贴：数字滚动 + 描边扫过 */
  function tickStats(){
    ['stRead','stFav','stWords','hRead','hFav','hWords'].forEach(function(id){
      const el = document.getElementById(id);
      if(!el) return;
      const target = parseInt(String(el.textContent).replace(/,/g,''), 10);
      if(target) tickNumber(el, target, 650);
      el.classList.add('tick');
      setTimeout(function(){ el.classList.remove('tick'); }, 800);
    });
  }
  /* 动态工作台统一入口：700ms 去重窗口，场景包与侦测器谁先触发都不重播 */
  const STAGE_SCENE = {gmStage:'games', wrStage:'writing', mockStage:'mock', transStage:'trans'};
  const stageLast = {};
  function playStage(sid){
    const now = performance.now();
    if(stageLast[sid] && now - stageLast[sid] < 700) return;
    stageLast[sid] = now;
    runPack(STAGES[sid], 40);
  }
  /* 场景入场：方向转场 + 专属动效包 + 一幕转场特效 */
  function enterScene(id, dir){
    const sec = document.getElementById(id);
    if(!sec) return;
    cancelRunning();
    sec.classList.remove('m-scene-fwd','m-scene-back');
    void sec.offsetWidth;                                   /* 重置转场动画 */
    sec.classList.add(dir === 'back' ? 'm-scene-back' : 'm-scene-fwd');
    playFx(SCENE_FX[id]);
    runPack(PACKS[id], 50);
    /* 重进场景时，已填充的工作台照常开工动画（经 playStage 去重） */
    Object.keys(STAGE_SCENE).forEach(function(sid){
      if(STAGE_SCENE[sid] === id){
        const el = document.getElementById(sid);
        if(el && el.children.length && el.offsetParent) playStage(sid);
      }
    });
    /* 数字滚动 */
    if(id === 'profile') setTimeout(tickStats, 120);
    if(id === 'home') setTimeout(tickStats, 200);
  }
  /* 场景切换侦测（display 由外壳 glue 的 showOnly 切换） */
  function currentScene(){
    for(const s of SECS){
      const el = document.getElementById(s);
      if(el && el.style.display !== 'none') return s;
    }
    return 'home';
  }
  function onSwitch(){
    const now = currentScene();
    if(now === lastScene) return;
    const dir = (ORDER[now] !== undefined && ORDER[lastScene] !== undefined && ORDER[now] < ORDER[lastScene]) ? 'back' : 'fwd';
    enterScene(now, dir);
    lastScene = now;
  }
  /* 动态工作台侦测：容器结构签名变化时触发开工动效
     （开局：介绍卡→牌桌，签名变了→发牌；答题重渲染：结构相同→安静不打扰） */
  function watchStages(){
    function sig(e){
      return e.children.length + '|' + (e.firstElementChild ? e.firstElementChild.className : '');
    }
    Object.keys(STAGES).forEach(function(sid){
      const el = document.getElementById(sid);
      if(!el) return;
      let last = sig(el);
      new MutationObserver(function(){
        const s = sig(el);
        if(s !== last && el.children.length && el.offsetParent){
          playStage(sid);
        }
        last = s;
      }).observe(el, {childList:true});
    });
  }
  function init(){
    lastScene = currentScene();
    const obs = new MutationObserver(function(){ setTimeout(onSwitch, 0); });
    SECS.forEach(function(s){
      const el = document.getElementById(s);
      if(el) obs.observe(el, {attributes:true, attributeFilter:['style']});
    });
    watchStages();
    plantAmbient();
    armImpact();
    armDetails();
    onSwitch();                                            /* 首屏：案头专属入场 */
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
