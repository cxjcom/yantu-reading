/* =====================================================
   研途阅读 · 动效编排器 v5「印刷开镜」（motion.js）
   动效语法源自 ui2v-motions 动效包 + code-mv-render 运动语法：
   · 错峰分层：主体 0ms → 附属 +70ms → 第三层 +140ms（逐组递进）
   · 禁止纯透明度淡入：正文用 clip-path 印刷揭示（不污染分页测量）
   · 字体遮罩：中文题名逐字显影 typed / 统计数字乱码收敛 scramble
   · 快速运动必带墨晕（|位移|≥20px 自动加 blur）
   · 二次运动：land 落地压扁回弹 / back.out(1.8) 过冲
   —— 12 个场景专属动效包 + 一幕转场特效（墨斩/集中线/星爆）
   —— reader 红线：#article 只用 clip-path（getBoundingClientRect 不受影响）
   —— 尊重 prefers-reduced-motion（整套禁用）
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
     step: [选择器, 参数, 组延迟ms]
     组延迟实现 MV 错峰分层：主体 → 附属 → 第三层逐组递进
     参数：y/x 位移px · s 缩放 · rz 倾角deg · blur 墨晕px · clip 印刷揭示 ·
           d 时长ms · e 缓动 · stagger 间隔ms · limit 上限 ·
           alt 方向按序号交替 · land 卡通落地
     红线：reader 场景 #article/#vocabBox 只做 clip-path 揭示——
           clip-path 不改变 getBoundingClientRect，分页测量不受污染 */
  const PACKS = {
    /* 案头工作台：题名显影 → 卷宗展开 → 磁贴落地 → 文具出匣 → 说明浮起 */
    home: [
      ['.deskGreet',        {y:14, blur:5, d:520}, 0],
      ['.scrollBox',        {x:-26, s:.95, d:680, e:'back'}, 80],
      ['.statTiles .tile',  {land:true, d:640, stagger:90}, 170],
      ['.stationeryItem',   {x:-18, d:500, stagger:55, limit:8}, 260],
      ['.deskTip',          {y:12, d:460}, 340]
    ],
    /* 线装书阅读室：墨迹显影 + 印刷揭示正文 + 墨斩转场 */
    reader: [
      ['.bookCtl',          {y:-14, d:480}, 0],
      ['.bookTitle',        {y:18, blur:8, d:720}, 70],
      ['.titleCn',          {y:12, d:540}, 150],
      ['#metaChips span',   {s:.86, d:420, stagger:45, e:'back', limit:6}, 220],
      ['#article',          {clip:true, d:600}, 120],
      ['#vocabBox',         {clip:true, d:480}, 260]
    ],
    /* 做题：选项如印章逐枚落下 + 集中线转场 */
    quiz: [
      ['.wCard',            {y:20, d:560}, 0],
      ['#qOptions .qOpt',   {land:true, d:520, stagger:60}, 100],
      ['.wBtns',            {y:14, d:440}, 220]
    ],
    /* 选词填空：活字坠落归位（压扁回弹） */
    cloze: [
      ['#clozePassage',     {y:18, d:540}, 0],
      ['#clzBank .clzChip', {land:true, d:560, stagger:40, limit:15}, 110],
      ['.wBtns',            {y:14, d:440}, 240]
    ],
    /* 长篇阅读：段落逐行印刷揭示 */
    longread: [
      ['#lrPassage .lrPara',{clip:true, d:440, stagger:45, limit:10}, 60],
      ['#lrItems .lrItem',  {y:14, d:440, stagger:45, limit:6}, 200]
    ],
    /* 背词：抽卡翻转落定 + 星芒爆散 */
    words: [
      ['.sceneHead',        {y:-14, d:440}, 0],
      ['#wordFilter button',{s:.88, y:8, d:400, stagger:30, e:'back'}, 90],
      ['.wCard',            {y:26, rz:-5, alt:true, s:.9, d:680, e:'back'}, 170],
      ['.wBtns',            {y:14, d:440}, 300],
      ['#wStats',           {y:12, d:400}, 380]
    ],
    /* 录音跟读：对坐会话左右交替 + 集中线 */
    speak: [
      ['.sceneHead',        {y:-14, d:440}, 0],
      ['#spDialog .dl',     {x:16, alt:true, d:460, stagger:45, limit:8}, 90],
      ['.wBtns',            {y:14, d:440}, 260]
    ],
    /* 翻译训练：句子浮起 + 序号盖章（行动画由 playStage 统一触发） */
    trans: [
      ['.sceneHead',        {y:-14, d:440}, 0],
      ['.deskTip',          {y:12, d:460}, 90]
    ],
    /* AI 作文批改：稿纸逐层铺开（稿纸动画由 playStage 统一触发） */
    writing: [
      ['.sceneHead',        {y:-14, d:440}, 0],
      ['#wrTypeSeg button', {s:.88, y:8, d:400, stagger:30, e:'back'}, 90]
    ],
    /* 仿真模考：试卷自上而下发放 + 集中线/闪帧 */
    mock: [
      ['.sceneHead',        {y:-14, d:440}, 0],
      ['#mkReport',         {y:14, d:460}, 120]
    ],
    /* 游戏角：发牌开局 + 星芒爆散 */
    games: [
      ['.sceneHead',        {y:-14, d:440}, 0],
      ['#gmLevelSeg button',{s:.88, y:8, d:400, stagger:30, e:'back'}, 90],
      ['#gameSeg button',   {s:.88, y:8, d:400, stagger:35, e:'back'}, 170],
      ['#gmStats',          {y:12, d:420}, 280]
    ],
    /* 书房：名片落地回弹 + 数字乱码收敛 */
    profile: [
      ['.meHead',           {y:-14, d:440}, 0],
      ['.meCard',           {land:true, d:680}, 80],
      ['.meStats > div',    {y:12, d:480, stagger:70}, 200],
      ['.secondary',        {y:12, d:440, stagger:50, limit:5}, 300],
      ['#pwaInstallBtn',    {y:12, d:440}, 380],
      ['#favList .favCard', {y:14, d:440, stagger:50, limit:6}, 300],
      ['#histList .favCard',{y:14, d:440, stagger:50, limit:5}, 380],
      ['#wrongList .favCard',{y:14, d:440, stagger:50, limit:4}, 440]
    ]
  };

  /* 动态工作台：结构变化时触发开工动效（游戏发牌/稿纸铺开/试卷下发/批注落笔） */
  const STAGES = {
    gmStage: [
      ['#gmStage > *',      {y:16, s:.96, d:480}, 0],
      ['#gmStage .gmCard',  {y:18, rz:3, alt:true, s:.88, d:500, stagger:45, e:'back'}, 80]
    ],
    wrStage: [
      ['#wrStage > *',      {y:18, s:.96, d:540, stagger:80}, 0]
    ],
    mockStage: [
      ['#mockStage > *',    {y:-18, d:500, stagger:90}, 0]
    ],
    transStage: [
      ['#transStage .trQ',  {y:16, d:480, stagger:70}, 0],
      ['#transStage .trNo', {s:.7, d:400, stagger:70, e:'back'}, 80]
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

  /* ---------- MV 构架：章节卷卡 + 电影黑边 ----------
     每次切场景打一张「第 N 卷 · 场景名」字卡（slam → hold → 墨化擦除），
     上下 letterbox 黑边随之开合；时长全部落在 0.46s 拍点网格上 */
  function playCard(name, chapter){
    const fx = ensureFx();
    fx.appendChild(fxNode('mFxBarT', 1000));
    fx.appendChild(fxNode('mFxBarB', 1000));
    const c = fxNode('mFxCard', 1500);
    c.innerHTML = '<i>第 ' + chapter + ' 卷</i><b></b><u></u><s>研途阅读 · 书房案头</s>';
    c.querySelector('b').textContent = name || '书房';
    fx.appendChild(c);
  }

  /* ---------- MV 构架：书架音浪（书架=播放列表，当前场景=播放中曲目） ---------- */
  function armShelfEQ(){
    const shelf = document.getElementById('shelf');
    if(!shelf) return;
    function sync(){
      shelf.querySelectorAll('.shelfItem').forEach(function(it){
        const on = it.classList.contains('on');
        let eq = it.querySelector('.mEq');
        if(on && !eq){ eq = document.createElement('span'); eq.className = 'mEq'; eq.innerHTML = '<i></i><i></i><i></i>'; it.appendChild(eq); }
        if(!on && eq) eq.remove();
      });
    }
    new MutationObserver(sync).observe(shelf, {subtree:true, attributes:true, attributeFilter:['class']});
    sync();
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

  /* ---------- 题名逐字显影（typed，中文按字计时） ----------
     sceneTitle/meTitle/案头题名/顶栏题名；只排 ≤12 字的短题名 */
  function typeTitle(el, base){
    if(!el || !el.offsetParent) return;
    const text = (el.textContent || '').trim();
    if(!text || text.length > 12) return;
    const frag = document.createDocumentFragment();
    for(const ch of text){
      const s = document.createElement('span');
      s.className = 'mT';
      s.textContent = ch === ' ' ? '\u00A0' : ch;
      frag.appendChild(s);
    }
    el.textContent = '';
    el.appendChild(frag);
    const chars = el.querySelectorAll('.mT');
    for(let i = 0; i < chars.length; i++){
      enter(chars[i], {y:10, blur:4, d:340}, (base || 40) + i * 34, i);
    }
  }

  let lastScene = null;
  let running = [];          /* 进行中的入场动画，切场景时取消 */

  function cancelRunning(){
    running.forEach(function(a){ try{ a.cancel(); }catch(e){} });
    running = [];
  }
  /* 单元素入场（多属性 transform 合成；land=卡通落地；clip=印刷揭示；
     结束即 cancel 释放样式；快速位移自动带墨晕） */
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
      if(opt.blur){
        kf.filter = ['blur(' + opt.blur + 'px)', 'blur(0px)'];
      } else if((opt.y && Math.abs(opt.y) >= 20) || (opt.x && Math.abs(opt.x) >= 16)){
        kf.filter = ['blur(3px)', 'blur(0px)'];            /* 快速运动必带墨晕 */
      }
      if(opt.clip){
        /* 印刷揭示：自上而下显影（clip-path 不影响布局测量） */
        kf.clipPath = ['inset(0 0 100% 0)', 'inset(0 0 -1% 0)'];
      }
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
  /* 执行整个动效包：组间错峰递进（主体 → 附属 → 第三层） */
  function runPack(pack, base){
    (pack || []).forEach(function(st, i){
      staggerAll(st[0], st[1], base + (st[2] || i * 70));
    });
  }
  /* 统计数字：乱码收敛（scramble）——逐位从随机数字沉淀为真值 */
  function tickNumber(el, target, dur){
    const str = target.toLocaleString('en-US');
    const start = performance.now();
    function frame(now){
      const p = Math.min(1, (now - start) / (dur || 620));
      const eased = 1 - Math.pow(1 - p, 3);
      const settled = Math.floor(eased * str.length);
      let out = '';
      for(let i = 0; i < str.length; i++){
        const ch = str[i];
        if(!/\d/.test(ch) || i < settled){ out += ch; }
        else { out += String(Math.floor(Math.random() * 10)); }
      }
      el.textContent = out;
      if(p < 1) requestAnimationFrame(frame);
      else el.textContent = str;
    }
    requestAnimationFrame(frame);
  }
  /* 书房名片 + 工作台磁贴：数字收敛 + 描边扫过 */
  function tickStats(){
    ['stRead','stFav','stWords','hRead','hFav','hWords'].forEach(function(id){
      const el = document.getElementById(id);
      if(!el) return;
      const target = parseInt(String(el.textContent).replace(/,/g,''), 10);
      if(target) tickNumber(el, target, 640);
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
  /* 场景入场：方向转场 + 纸面擦除揭示 + 专属动效包 + 一幕转场特效 */
  function enterScene(id, dir){
    const sec = document.getElementById(id);
    if(!sec) return;
    cancelRunning();
    sec.classList.remove('m-scene-fwd','m-scene-back');
    void sec.offsetWidth;                                   /* 重置转场动画 */
    sec.classList.add(dir === 'back' ? 'm-scene-back' : 'm-scene-fwd');
    playFx(SCENE_FX[id]);
    playCard((document.getElementById('sceneTitle') || {}).textContent, ORDER[id] + 1);
    runPack(PACKS[id], 50);
    /* 题名逐字显影（场景题名 / 书房题名 / 案头题名 / 顶栏题名） */
    setTimeout(function(){
      typeTitle(sec.querySelector('.sceneTitle') || sec.querySelector('.meTitle') || sec.querySelector('.deskGreet h1'), 60);
      typeTitle(document.getElementById('sceneTitle'), 20);
    }, 0);
    /* 重进场景时，已填充的工作台照常开工动画（经 playStage 去重） */
    Object.keys(STAGE_SCENE).forEach(function(sid){
      if(STAGE_SCENE[sid] === id){
        const el = document.getElementById(sid);
        if(el && el.children.length && el.offsetParent) playStage(sid);
      }
    });
    /* 数字收敛 */
    if(id === 'profile') setTimeout(tickStats, 140);
    if(id === 'home') setTimeout(tickStats, 220);
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
  /* ---------- 三墨版画：伏案读卷人剪影（world.execute(me) 式大幅背景渲染） ---------- */
  const SIL_FIG = '<svg viewBox="0 0 240 150" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g fill="currentColor">'
    + '<circle cx="92" cy="40" r="16"/>'
    + '<path d="M92 54 C70 58 54 74 52 96 C51 106 53 114 56 122 L104 122 C110 112 110 92 104 76 C101 66 98 58 92 54 Z"/>'
    + '<path d="M84 88 C100 92 116 96 130 100 L127 110 C112 106 96 102 82 98 Z"/>'
    + '<path d="M118 106 C130 96 146 92 158 96 L156 110 C146 106 134 108 124 114 Z"/>'
    + '<path d="M158 96 C170 92 182 94 190 100 L185 112 C177 107 167 106 156 110 Z"/>'
    + '<rect x="40" y="122" width="168" height="8"/>'
    + '<rect x="196" y="66" width="4" height="56"/>'
    + '<path d="M180 66 L216 66 L208 46 L188 46 Z"/>'
    + '<path d="M189 38 C191 32 199 32 201 38 C203 43 197 46 195 51 C193 46 187 43 189 38 Z"/>'
    + '</g></svg>';
  const SIL_STAR = '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path fill="currentColor" d="M20 0 L24 16 L40 20 L24 24 L20 40 L16 24 L0 20 L16 16 Z"/></svg>';

  /* 背景渲染层 #mArt：斜切专色场 + 光芒爆发 + 三层套印大剪影 + glitch 三切片 + 眼瞳十字星 + 像素噪带 */
  function ensureArt(){
    if(document.getElementById('mArt')) return;
    const a = document.createElement('div');
    a.id = 'mArt';
    a.innerHTML =
      '<div class="mField"></div>' +
      '<div class="mRays"></div>' +
      '<div class="mRaysFade"></div>' +
      '<div class="mFig">' +
        '<span class="mFigPlate">' + SIL_FIG + '</span>' +
        '<span class="mFigPaper">' + SIL_FIG + '</span>' +
        '<span class="mFigInk">' + SIL_FIG + '</span>' +
        '<span class="mFigGl g1">' + SIL_FIG + '</span>' +
        '<span class="mFigGl g2">' + SIL_FIG + '</span>' +
        '<span class="mFigGl g3">' + SIL_FIG + '</span>' +
        '<span class="mStar">' + SIL_STAR + '</span>' +
      '</div>' +
      '<div class="mPix p1"></div>' +
      '<div class="mPix p2"></div>';
    document.body.appendChild(a);
  }

  /* 场景内小剪影水印（书房；home 已有大背景不再重复） */
  function injectSilhouettes(){
    const sec = document.getElementById('profile');
    if(!sec || sec.querySelector('.mSil')) return;
    const w = document.createElement('div');
    w.className = 'mSil mSilProfile';
    w.innerHTML = SIL_FIG;
    sec.appendChild(w);
  }

  /* ---------- MV 渲染风格：全局胶片质感层（扫描线/暗角/颗粒闪烁/取景框角标） ---------- */
  function ensureFilm(){
    if(document.getElementById('mFilm')) return;
    const f = document.createElement('div');
    f.id = 'mFilm';
    document.body.appendChild(f);
  }

  /* ---------- 动效开关（2026-11-22 体检修复）：yt_fx=1 不铺常驻装饰层 ----------
     胶片颗粒/花瓣/剪影/Rays 是全站常驻 GPU 重绘，低端安卓发热耗电掉帧的主因；
     关掉的只是「常驻税」，交互式入场动画（arm* 系列）保留。core.js 顶栏 ✨ 按钮触发 */
  /* X5/QQ 内核检测（v1.11.7，用户报告 QQ 浏览器手机端无法滑动）：X5 对 fullscreen
     fixed 层的 pointer-events:none 存在失效 bug——胶片/花瓣/氛围层会吞掉全部触摸，
     页面划不动点不灵。X5 上强制静默模式：装饰层全部不铺，html.x5 类供 CSS 兜底隐藏 */
  var IS_X5=/MQQBrowser|QQBrowser|X5/i.test(navigator.userAgent);
  if(IS_X5 && document.documentElement.classList) document.documentElement.classList.add('x5');
  /* 低端机自动轻量（v1.11.8，用户报告手机卡顿+概率性划不动）：胶片颗粒全屏 0.9s 重绘、
     花瓣×16 常驻等动画在低端渲染线程上是滚动冻结的元凶——核数≤4 或内存≤4GB 的设备
     自动静默（同 X5 处理），html.lite 类供 CSS 兜底隐藏。桌面/旗舰机不受影响 */
  var IS_LOWEND=false;
  try{
    var hc=navigator.hardwareConcurrency||8, dm=navigator.deviceMemory||8;
    IS_LOWEND=(hc<=4||dm<=4);
  }catch(e){}
  if(IS_LOWEND && document.documentElement.classList) document.documentElement.classList.add('lite');
  function fxOff(){ try{ return localStorage.getItem('yt_fx')==='1' || IS_X5 || IS_LOWEND; }catch(e){ return IS_X5||IS_LOWEND; } }
  function plantConstantLayers(){ ensureFilm(); ensureArt(); injectSilhouettes(); plantAmbient(); }
  function removeConstantLayers(){
    const f=document.getElementById('mFilm'); if(f) f.remove();
    const a=document.getElementById('mArt'); if(a) a.remove();
    document.querySelectorAll('.mAmbient,.mSil').forEach(function(n){ n.remove(); });
  }
  function applyFx(){
    const off=fxOff();
    document.documentElement.classList.toggle('motion-off', off);
    if(off) removeConstantLayers(); else plantConstantLayers();
  }
  window.__ytFx=applyFx;

  function init(){
    lastScene = null;                                      /* null 强制首屏也走一次完整开镜（v3/v4 首屏动效从未触发的根因） */
    const obs = new MutationObserver(function(){ setTimeout(onSwitch, 0); });
    SECS.forEach(function(s){
      const el = document.getElementById(s);
      if(el) obs.observe(el, {attributes:true, attributeFilter:['style']});
    });
    watchStages();
    armImpact();
    armDetails();
    armShelfEQ();
    applyFx();                                             /* 按 yt_fx 决定铺/不铺常驻装饰层 */
    onSwitch();                                            /* 首屏：案头专属入场 */
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
