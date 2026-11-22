/* =====================================================
   研途阅读 · 场景音乐 + 按钮音效（v111，用户要求）
   零素材零版权：全部 Web Audio 程序化合成——
   · 场景音乐：五声音阶生成式古风拨弦（每场景独立调式/节奏/音色），场景切换 1.2s 交叉淡化
   · 按钮音效：木质轻叩；toast 按 ✅/❌/⚠️ 前缀自动配 上行双音/低闷音
   · 浏览器自动播放限制：首次 pointerdown/keydown 才初始化 AudioContext
   · 偏好持久化：yt_music（默认开）/ yt_sfx（默认开）；标签页隐藏自动暂停
   ===================================================== */
(function(){
  'use strict';
  var SECS=['home','reader','quiz','cloze','longread','words','speak','trans','writing','mock','games','profile'];
  function pref(k,d){ try{ var v=localStorage.getItem(k); return v===null?d:v; }catch(e){ return d; } }
  function setPref(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  var musicOn = pref('yt_music','1')==='1';
  var sfxOn   = pref('yt_sfx','1')==='1';

  var ctx=null, master=null, musicBus=null, sfxBus=null, wet=null, started=false;
  var curScene='home', sceneGains={}, timer=null, nextNote=0, walkIdx=2;
  var lastSceneCheck=0;

  /* ---------- 每场景音乐配置（v1.11.1 柔化：den 弃用改为必奏、step 缩短、余音拉长
     使相邻音符尾音交叠成连续线；drone 改为持续低音铺底不再间歇）----------
     step=音符间隔秒, dur=余音秒, hi=音区上移半音数, perc=节奏打点概率, flute=笛声概率, drone=低音频率 */
  var P=[0,2,4,7,9];                       /* 宫调五声 */
  var SCENES={
    home:    {base:293.66, step:0.95, dur:2.4, hi:0,  perc:0,   flute:0.10, drone:110.0},
    reader:  {base:293.66, step:1.35, dur:3.2, hi:-5, perc:0,   flute:0.16, drone:73.4},
    quiz:    {base:293.66, step:1.15, dur:2.5, hi:0,  perc:0,   flute:0.12, drone:98.0},
    cloze:   {base:329.63, step:1.10, dur:2.4, hi:0,  perc:0,   flute:0.12, drone:98.0},
    longread:{base:261.63, step:1.45, dur:3.4, hi:-5, perc:0,   flute:0.14, drone:65.4},
    words:   {base:329.63, step:0.80, dur:2.0, hi:7,  perc:0,   flute:0.08, drone:110.0},
    speak:   {base:293.66, step:1.30, dur:2.8, hi:0,  perc:0,   flute:0.14, drone:98.0},
    trans:   {base:293.66, step:1.30, dur:2.8, hi:0,  perc:0,   flute:0.14, drone:98.0},
    writing: {base:261.63, step:1.40, dur:3.2, hi:-5, perc:0,   flute:0.14, drone:65.4},
    mock:    {base:261.63, step:1.55, dur:3.4, hi:-5, perc:0,   flute:0.10, drone:65.4},
    games:   {base:329.63, step:0.55, dur:1.4, hi:7,  perc:0.4, flute:0.05, drone:110.0},
    profile: {base:246.94, step:1.70, dur:3.6, hi:-7, perc:0,   flute:0.12, drone:61.7}
  };

  function ensureCtx(){
    if(ctx) return true;
    try{
      var AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) return false;
      ctx=new AC();
      master=ctx.createGain(); master.gain.value=0.9; master.connect(ctx.destination);
      /* 简易混响：2s 指数衰减噪声脉冲响应 */
      wet=ctx.createConvolver();
      var len=Math.floor(ctx.sampleRate*1.8), ir=ctx.createBuffer(2,len,ctx.sampleRate);
      for(var c=0;c<2;c++){ var d=ir.getChannelData(c);
        for(var i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);
      }
      wet.buffer=ir;
      var wetGain=ctx.createGain(); wetGain.gain.value=0.28;
      musicBus=ctx.createGain(); musicBus.gain.value=0.42;
      musicBus.connect(master); musicBus.connect(wet); wet.connect(wetGain); wetGain.connect(master);
      sfxBus=ctx.createGain(); sfxBus.gain.value=0.55; sfxBus.connect(master);
      SECS.forEach(function(s){ sceneGains[s]=ctx.createGain(); sceneGains[s].gain.value=(s===curScene?1:0); sceneGains[s].connect(musicBus); });
      return true;
    }catch(e){ return false; }
  }

  /* ---------- 音色（v1.11.1 柔化：sine 为主圆润音体、慢起音、暗低通、瞬态大幅减弱） ---------- */
  function pluck(dest, freq, t, dur, vel){
    var o1=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
    o1.type='sine';     o1.frequency.value=freq;
    o2.type='triangle'; o2.frequency.value=freq;
    f.type='lowpass'; f.frequency.setValueAtTime(1500,t); f.frequency.exponentialRampToValueAtTime(500,t+dur);
    var g2=ctx.createGain(); g2.gain.value=0.18; o2.connect(g2);
    o1.connect(f); g2.connect(f); f.connect(g);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(vel,t+0.05);          /* 慢起音：柔和无敲击感 */
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o1.connect(g); o1.start(t); o1.stop(t+dur+0.05);
    o2.connect(g); o2.start(t); o2.stop(t+dur+0.05);
    g.connect(dest);
    var nb=ctx.createBuffer(1,Math.floor(ctx.sampleRate*0.02),ctx.sampleRate), nd=nb.getChannelData(0);
    for(var i=0;i<nd.length;i++) nd[i]=(Math.random()*2-1)*(1-i/nd.length);
    var ns=ctx.createBufferSource(); ns.buffer=nb;
    var nf=ctx.createBiquadFilter(); nf.type='bandpass'; nf.frequency.value=Math.min(freq*2.2,3800); nf.Q.value=1.4;
    var ng=ctx.createGain(); ng.gain.value=vel*0.18;
    ns.connect(nf); nf.connect(ng); ng.connect(dest); ns.start(t);
  }
  function flute(dest, freq, t, dur){
    var o=ctx.createOscillator(), g=ctx.createGain(), vib=ctx.createOscillator(), vg=ctx.createGain(), f=ctx.createBiquadFilter();
    o.type='sine'; o.frequency.value=freq;
    vib.type='sine'; vib.frequency.value=5.2; vg.gain.value=freq*0.008;
    vib.connect(vg); vg.connect(o.frequency);
    f.type='lowpass'; f.frequency.value=3000;
    o.connect(f); f.connect(g);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(0.10,t+0.18);
    g.gain.setValueAtTime(0.10,t+dur*0.55);
    g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    o.start(t); o.stop(t+dur+0.05); vib.start(t); vib.stop(t+dur+0.05);
    g.connect(dest);
  }
  /* 持续低音铺底（v1.11.1 连续感关键）：单振荡器常驻 + 慢 LFO 呼吸起伏，
     场景切换时 1.2s 淡出旧音换新音 */
  var droneNode=null;
  function setDrone(freq){
    if(!ctx||!musicBus||!started) return;                    /* 音乐已停（stopMusic）时不再生成低音节点 */
    var t=ctx.currentTime;
    if(droneNode){
      try{
        droneNode.g.gain.cancelScheduledValues(t);
        droneNode.g.gain.setValueAtTime(droneNode.g.gain.value,t);
        droneNode.g.gain.linearRampToValueAtTime(0.0001,t+1.2);
        droneNode.o.stop(t+1.3); droneNode.lfo.stop(t+1.3);
      }catch(e){}
    }
    try{
      var o=ctx.createOscillator(), g=ctx.createGain(), lfo=ctx.createOscillator(), lg=ctx.createGain();
      o.type='sine'; o.frequency.value=freq;
      lfo.type='sine'; lfo.frequency.value=0.07; lg.gain.value=0.013;
      lfo.connect(lg); lg.connect(g.gain);
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(0.030,t+1.5);
      o.connect(g); g.connect(musicBus);
      o.start(t); lfo.start(t);
      droneNode={o:o,g:g,lfo:lfo};
    }catch(e){ droneNode=null; }
  }
  function tickPerc(dest, t){
    var nb=ctx.createBuffer(1,Math.floor(ctx.sampleRate*0.03),ctx.sampleRate), nd=nb.getChannelData(0);
    for(var i=0;i<nd.length;i++) nd[i]=(Math.random()*2-1)*(1-i/nd.length);
    var ns=ctx.createBufferSource(); ns.buffer=nb;
    var f=ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=3200;
    var g=ctx.createGain(); g.gain.value=0.05;
    ns.connect(f); f.connect(g); g.connect(dest); ns.start(t);
  }

  /* ---------- 生成式调度：前瞻 0.55s，每 160ms 补票 ---------- */
  function schedule(){
    if(!ctx||!musicOn||ctx.state!=='running') return;
    var cfg=SCENES[curScene]||SCENES.home, bus=sceneGains[curScene]||musicBus;
    var horizon=ctx.currentTime+0.55;
    while(nextNote<horizon){
      var t=Math.max(nextNote,ctx.currentTime+0.02);
      /* 随机游走取五声音阶音，偶尔八度跳跃——每步必奏（v1.11.1 连续感） */
      if(Math.random()<0.22) walkIdx+=(Math.random()<0.5?-1:1)*2;
      else walkIdx+=(Math.random()<0.5?-1:1);
      if(walkIdx<0) walkIdx=2; if(walkIdx>9) walkIdx=7;
      var oct=Math.floor(walkIdx/P.length), deg=walkIdx%P.length;
      var freq=cfg.base*Math.pow(2,(P[deg]+12*oct+cfg.hi)/12);
      pluck(bus,freq,t,cfg.dur,0.11+Math.random()*0.05);      /* 音量降档：轻柔铺 */
      if(Math.random()<cfg.flute) flute(bus,freq*2,t+0.05,cfg.dur*0.8);
      if(cfg.perc&&Math.random()<cfg.perc) tickPerc(bus,t+cfg.step*0.5);
      nextNote=t+cfg.step*(0.85+Math.random()*0.35);
    }
  }
  function startMusic(){
    if(!ensureCtx()) return;
    if(ctx.state==='suspended') ctx.resume();
    if(started) return;
    started=true; nextNote=ctx.currentTime+0.15;
    timer=setInterval(schedule,160); schedule();
    setDrone((SCENES[curScene]||SCENES.home).drone);
  }
  function stopMusic(){
    if(timer){ clearInterval(timer); timer=null; }
    started=false;
    if(droneNode&&ctx){
      try{
        var t=ctx.currentTime;
        droneNode.g.gain.cancelScheduledValues(t);
        droneNode.g.gain.setValueAtTime(droneNode.g.gain.value,t);
        droneNode.g.gain.linearRampToValueAtTime(0.0001,t+0.8);
        droneNode.o.stop(t+0.9); droneNode.lfo.stop(t+0.9);
      }catch(e){}
      droneNode=null;
    }
    if(musicBus&&ctx){ var t=ctx.currentTime; musicBus.gain.cancelScheduledValues(t); musicBus.gain.setValueAtTime(musicBus.gain.value,t); musicBus.gain.linearRampToValueAtTime(0.0001,t+0.8);
      setTimeout(function(){ if(!started&&musicBus) musicBus.gain.value=0.42; },900); }
  }

  /* ---------- 场景切换侦测（同 motion.js 的 style 观察法） ---------- */
  function detectScene(){
    var now=Date.now(); if(now-lastSceneCheck<150) return; lastSceneCheck=now;
    var found=null;
    for(var i=0;i<SECS.length;i++){
      var el=document.getElementById(SECS[i]);
      if(el&&el.style.display!=='none'&&el.offsetParent!==null){ found=SECS[i]; break; }
    }
    if(found&&found!==curScene&&ctx){
      var t=ctx.currentTime;
      (sceneGains[curScene]||{}).gain&&sceneGains[curScene].gain.linearRampToValueAtTime(0.0001,t+1.2);
      (sceneGains[found]||{}).gain&&sceneGains[found].gain.linearRampToValueAtTime(1,t+1.2);
      curScene=found; nextNote=Math.min(nextNote,t+0.3);
      setDrone((SCENES[curScene]||SCENES.home).drone);       /* 低音随场景柔和换音 */
    }else if(found&&found!==curScene){ curScene=found; }
  }

  /* ---------- 音效 ---------- */
  function sfx(kind){
    if(!sfxOn||!ctx||ctx.state!=='running') return;
    var t=ctx.currentTime;
    if(kind==='tick'){ pluck(sfxBus,1150,t,0.09,0.16); }
    else if(kind==='ok'){ pluck(sfxBus,659.25,t,0.28,0.20); pluck(sfxBus,880,t+0.09,0.34,0.22); }
    else if(kind==='err'){
      var o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
      o.type='square'; o.frequency.setValueAtTime(170,t); o.frequency.exponentialRampToValueAtTime(95,t+0.13);
      f.type='lowpass'; f.frequency.value=600;
      o.connect(f); f.connect(g);
      g.gain.setValueAtTime(0.12,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.16);
      o.start(t); o.stop(t+0.18); g.connect(sfxBus);
    }
    else if(kind==='blip'){ pluck(sfxBus,740,t,0.14,0.15); }
  }

  /* ---------- toast 联动（包装 core.js 的 showToast，按前缀配音） ---------- */
  function wrapToast(){
    if(typeof window.showToast!=='function'||window.__ytToastWrapped) return;
    var orig=window.showToast;
    window.showToast=function(msg){
      try{
        var s=String(msg||'');
        if(s.indexOf('✅')===0) sfx('ok');
        else if(s.indexOf('❌')===0||s.indexOf('⚠️')===0) sfx('err');
      }catch(e){}
      return orig.apply(this,arguments);
    };
    window.__ytToastWrapped=true;
  }

  /* ---------- 按钮音效：事件委托，点任何 button 轻叩 ---------- */
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('button'):null;
    if(b) sfx('tick');
  },true);

  /* ---------- 自动播放解锁 + 标签页暂停 ---------- */
  function unlock(){
    if(!ensureCtx()) return;
    if(ctx.state==='suspended') ctx.resume();
    if(musicOn&&!started) startMusic();
  }
  document.addEventListener('pointerdown',unlock,{capture:true});
  document.addEventListener('keydown',unlock,{capture:true});
  document.addEventListener('visibilitychange',function(){
    if(!ctx) return;
    if(document.visibilityState==='hidden'){ if(ctx.state==='running') ctx.suspend(); }
    else if(musicOn){ if(ctx.state==='suspended') ctx.resume(); }
  });

  /* ---------- 场景观察 ---------- */
  SECS.forEach(function(s){
    var el=document.getElementById(s);
    if(el) new MutationObserver(detectScene).observe(el,{attributes:true,attributeFilter:['style']});
  });
  setInterval(detectScene,400);

  /* ---------- 顶栏开关 ---------- */
  function paintBtns(){
    var m=document.getElementById('musicBtn'), s=document.getElementById('sfxBtn');
    if(m){ m.textContent=musicOn?'🎵':'🎵'; m.style.opacity=musicOn?'1':'.4'; m.title=musicOn?'场景音乐：开':'场景音乐：关'; }
    if(s){ s.textContent=sfxOn?'🔔':'🔕'; s.style.opacity=sfxOn?'1':'.4'; s.title=sfxOn?'按钮音效：开':'按钮音效：关'; }
  }
  function bindBtns(){
    var m=document.getElementById('musicBtn'), s=document.getElementById('sfxBtn');
    if(m&&!m.__bound){ m.__bound=1;
      m.addEventListener('click',function(){
        musicOn=!musicOn; setPref('yt_music',musicOn?'1':'0');
        if(musicOn) startMusic(); else stopMusic();
        paintBtns();
        if(window.showToast) showToast(musicOn?'🎵 场景音乐已开':'🎵 场景音乐已关');
      });
    }
    if(s&&!s.__bound){ s.__bound=1;
      s.addEventListener('click',function(){
        sfxOn=!sfxOn; setPref('yt_sfx',sfxOn?'1':'0');
        if(sfxOn){ unlock(); sfx('blip'); }
        paintBtns();
        if(window.showToast) showToast(sfxOn?'🔔 按钮音效已开':'🔕 按钮音效已关');
      });
    }
  }
  bindBtns(); paintBtns(); wrapToast();
  window.__ytSfx=sfx;
  window.ytAudio={ get musicOn(){return musicOn;}, get sfxOn(){return sfxOn;}, get scene(){return curScene;}, get state(){return ctx?ctx.state:'none';} };
})();
