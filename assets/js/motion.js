/* =====================================================
   研途阅读 · 动效编排器 v3（motion.js）
   每个功能一个专属动效包（WAAPI 编排，零依赖）
   动效语法源自 ui2v-motions 库：back.out 弹性 / expo.out 收束 /
   y 轴 14-24px 位移 / scale 0.9-0.94 入场 / 40-80ms stagger
   —— 12 个场景全覆盖，每个场景一套签名：
     home    案头陈设（卷宗展开 + 文具出匣 + 磁贴落章）
     reader  墨晕开卷（书名墨迹显影 + 芯片盖章 + 正文纯淡入）
     quiz    落笔作答（题卡起手 + 选项逐个递上）
     cloze   拼版落字（词块如活字坠落归位）
     longread 寻行数墨（段落显影 + 定位项浮起）
     words   抽卡背词（卡片带倾角翻转落定）
     speak   对坐会话（对话行左右交替入场）
     trans   批注落笔（句子行浮起 + 序号盖章）
     writing 铺纸研墨（稿纸逐层铺开）
     mock    试卷下发（考卷自上而下发放）
     games   发牌开局（卡牌带倾角逐张发下）
     profile 书房开卷（名片起手 + 数字滚动 + 藏书列架）
   - 场景切换方向感知（前进从右 / 返回从左）
   - 动态 stage（gm/wr/mock/trans）空→实自动触发开工动效
   - 动画结束即 cancel，不长期占住 transform（hover 可用）
   - 尊重 prefers-reduced-motion
   ===================================================== */
(function(){
  'use strict';
  if (window.__YT_MOTION__) return;
  window.__YT_MOTION__ = true;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const EASE = {
    out:  'cubic-bezier(0.22, 1, 0.36, 1)',              /* ≈ expo/power2 out */
    back: 'cubic-bezier(0.34, 1.56, 0.64, 1)'            /* ≈ back.out(1.4) */
  };
  /* 场景注册表（顺序即"前进/返回"方向感） */
  const SECS = ['home','reader','quiz','cloze','longread','words','speak','trans','writing','mock','games','profile'];
  const ORDER = {home:0, reader:1, quiz:2, cloze:3, longread:4, words:5, speak:6, trans:7, writing:8, mock:9, games:10, profile:11};

  /* ---------- 各功能专属动效包 ----------
     step: [选择器, 参数]
     参数：y/x 位移px · s 缩放 · rz 倾角deg · blur 墨晕px · d 时长ms ·
           e 缓动 · stagger 间隔ms · limit 上限 · fadeOnly 纯淡入 ·
           alt 倾角/方向按序号正负交替
     红线：reader 场景 #article/#vocabBox 只做纯淡入——
           book.js 分页测量用 getBoundingClientRect，位移会污染测量 */
  const PACKS = {
    /* 案头工作台：物件落案 */
    home: [
      ['.deskGreet',        {y:14, d:480}],
      ['.scrollBox',        {x:-20, s:.97, d:620, e:'back'}],
      ['.statTiles .tile',  {y:18, s:.92, d:560, stagger:80, e:'back'}],
      ['.stationeryItem',   {x:-16, d:460, stagger:60, limit:8}],
      ['.deskTip',          {y:10, d:440}]
    ],
    /* 线装书阅读室：墨迹显影 */
    reader: [
      ['.bookCtl',          {y:-12, d:460}],
      ['.bookTitle',        {y:14, blur:6, d:640}],
      ['.titleCn',          {y:10, d:520}],
      ['#metaChips span',   {s:.9, d:400, stagger:45, e:'back', limit:6}],
      ['#article',          {d:500, fadeOnly:true}],
      ['#vocabBox',         {d:460, fadeOnly:true}]
    ],
    /* 做题：选项逐个递上 */
    quiz: [
      ['.wCard',            {y:16, d:520}],
      ['#qOptions .qOpt',   {x:14, s:.97, d:420, stagger:60}],
      ['.wBtns',            {y:12, d:420}]
    ],
    /* 选词填空：活字坠落归位 */
    cloze: [
      ['#clozePassage',     {y:16, d:520}],
      ['#clzBank .clzChip', {y:12, s:.8, d:460, stagger:40, e:'back', limit:15}],
      ['.wBtns',            {y:12, d:420}]
    ],
    /* 长篇阅读：段落显影（纯淡入防测量污染） */
    longread: [
      ['#lrPassage .lrPara',{d:420, stagger:40, limit:10, fadeOnly:true}],
      ['#lrItems .lrItem',  {y:12, d:420, stagger:45, limit:6}]
    ],
    /* 背词：抽卡翻转落定 */
    words: [
      ['.sceneHead',        {y:-12, d:420}],
      ['#wordFilter button',{s:.9, y:6, d:380, stagger:30, e:'back'}],
      ['.wCard',            {y:20, rz:-4, alt:true, s:.94, d:620, e:'back'}],
      ['.wBtns',            {y:12, d:420}],
      ['#wStats',           {y:10, d:380}]
    ],
    /* 录音跟读：对坐会话，左右交替 */
    speak: [
      ['.sceneHead',        {y:-12, d:420}],
      ['#spDialog .dl',     {x:14, alt:true, d:440, stagger:45, limit:8}],
      ['.wBtns',            {y:12, d:420}]
    ],
    /* 翻译训练：句子浮起 + 序号盖章（行动画由 playStage 统一触发） */
    trans: [
      ['.sceneHead',        {y:-12, d:420}],
      ['.deskTip',          {y:10, d:440}]
    ],
    /* AI 作文批改：稿纸逐层铺开（稿纸动画由 playStage 统一触发） */
    writing: [
      ['.sceneHead',        {y:-12, d:420}],
      ['#wrTypeSeg button', {s:.9, y:6, d:380, stagger:30, e:'back'}]
    ],
    /* 仿真模考：试卷自上而下发放（试卷动画由 playStage 统一触发） */
    mock: [
      ['.sceneHead',        {y:-12, d:420}],
      ['#mkReport',         {y:12, d:460}]
    ],
    /* 游戏角：发牌开局 */
    games: [
      ['.sceneHead',        {y:-12, d:420}],
      ['#gmLevelSeg button',{s:.9, y:6, d:380, stagger:30, e:'back'}],
      ['#gameSeg button',   {s:.9, y:6, d:380, stagger:35, e:'back'}],
      ['#gmStats',          {y:10, d:420}]
    ],
    /* 书房：开卷 + 数字滚动 */
    profile: [
      ['.meHead',           {y:-12, d:420}],
      ['.meCard',           {y:16, s:.96, d:560, e:'back'}],
      ['.meStats > div',    {y:10, d:460, stagger:70}],
      ['.secondary',        {y:10, d:420, stagger:50, limit:5}],
      ['#pwaInstallBtn',    {y:10, d:420}],
      ['#favList .favCard', {y:12, d:420, stagger:50, limit:6}],
      ['#histList .favCard',{y:12, d:420, stagger:50, limit:5}],
      ['#wrongList .favCard',{y:12, d:420, stagger:50, limit:4}]
    ]
  };

  /* 动态工作台：结构变化时触发开工动效（游戏发牌/稿纸铺开/试卷下发/批注落笔）
     格式与 PACKS 一致：多步 [选择器, 参数] */
  const STAGES = {
    gmStage: [
      ['#gmStage > *',      {y:14, s:.97, d:460}],
      ['#gmStage .gmCard',  {y:16, rz:3, alt:true, s:.9, d:480, stagger:45, e:'back'}]
    ],
    wrStage: [
      ['#wrStage > *',      {y:16, s:.97, d:520, stagger:80}]
    ],
    mockStage: [
      ['#mockStage > *',    {y:-14, d:480, stagger:90}]
    ],
    transStage: [
      ['#transStage .trQ',  {y:14, d:460, stagger:70}],
      ['#transStage .trNo', {s:.7, d:380, stagger:70, e:'back'}]
    ]
  };

  let lastScene = null;
  let running = [];          /* 进行中的入场动画，切场景时取消 */

  function cancelRunning(){
    running.forEach(function(a){ try{ a.cancel(); }catch(e){} });
    running = [];
  }
  /* 单元素入场（transform 多属性正确合成；结束即 cancel 释放样式） */
  function enter(el, opt, delay, idx){
    if(!el || !el.offsetParent) return;                    /* 隐藏元素跳过 */
    const kf = {opacity:[0,1]};
    const from = [], to = [];
    let x = opt.x, rz = opt.rz;
    if(opt.alt){                                           /* 交替方向/倾角 */
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
  /* 场景入场：方向转场 + 专属动效包 */
  function enterScene(id, dir){
    const sec = document.getElementById(id);
    if(!sec) return;
    cancelRunning();
    sec.classList.remove('m-scene-fwd','m-scene-back');
    void sec.offsetWidth;                                   /* 重置转场动画 */
    sec.classList.add(dir === 'back' ? 'm-scene-back' : 'm-scene-fwd');
    runPack(PACKS[id], 60);
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
  /* 动态工作台侦测：结构签名变化时触发开工动效
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
    onSwitch();                                            /* 首屏：案头专属入场 */
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
