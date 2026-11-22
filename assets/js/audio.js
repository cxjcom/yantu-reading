/* =====================================================
   研途阅读 · 按钮音效（v1.11.5）
   音乐已按用户要求移除（完整版在 tag v1.11.4，随时可找回）——本文件仅保留：
   · 按钮点击音：清脆轻叩（950Hz 短促滑落 + 微气声，随机微变调防单调），不含 3kHz 以上成分不刺耳
   · toast 联动：✅ 上行双音 / ❌ 低闷音
   · 顶栏 🔔 开关（yt_sfx 默认开，持久化）；首次 pointerdown 解锁 AudioContext
   ===================================================== */
(function(){
  'use strict';
  function pref(k,d){ try{ var v=localStorage.getItem(k); return v===null?d:v; }catch(e){ return d; } }
  function setPref(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
  var sfxOn = pref('yt_sfx','1')==='1';

  var ctx=null, sfxBus=null;

  function ensureCtx(){
    if(ctx) return true;
    try{
      var AC=window.AudioContext||window.webkitAudioContext;
      if(!AC) return false;
      ctx=new AC();
      var master=ctx.createGain(); master.gain.value=0.9; master.connect(ctx.destination);
      sfxBus=ctx.createGain(); sfxBus.gain.value=0.42; sfxBus.connect(master);
      return true;
    }catch(e){ return false; }
  }

  /* 清脆轻叩：短促下滑音 + 微气声。base 加随机微变调，连点不单调 */
  function tick(){
    var t=ctx.currentTime;
    var base=920+Math.random()*140;
    var o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
    o.type='sine'; o.frequency.setValueAtTime(base,t); o.frequency.exponentialRampToValueAtTime(base*0.72,t+0.03);
    f.type='lowpass'; f.frequency.value=2600;               /* 去掉 3kHz 以上：脆而不刺 */
    o.connect(f); f.connect(g);
    g.gain.setValueAtTime(0.12,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.055);
    o.start(t); o.stop(t+0.07); g.connect(sfxBus);
    var nb=ctx.createBuffer(1,Math.floor(ctx.sampleRate*0.012),ctx.sampleRate), nd=nb.getChannelData(0);
    for(var i=0;i<nd.length;i++) nd[i]=(Math.random()*2-1)*(1-i/nd.length);
    var ns=ctx.createBufferSource(); ns.buffer=nb;
    var nf=ctx.createBiquadFilter(); nf.type='bandpass'; nf.frequency.value=2400; nf.Q.value=1.0;
    var ng=ctx.createGain(); ng.gain.value=0.025;
    ns.connect(nf); nf.connect(ng); ng.connect(sfxBus); ns.start(t);
  }
  function ok(){                                            /* ✅ 上行双音：柔和肯定 */
    var t=ctx.currentTime;
    [[523.25,0],[659.25,0.12]].forEach(function(p){
      var o=ctx.createOscillator(), g=ctx.createGain();
      o.type='sine'; o.frequency.value=p[0];
      o.connect(g);
      g.gain.setValueAtTime(0.0001,t+p[1]);
      g.gain.exponentialRampToValueAtTime(0.12,t+p[1]+0.02);
      g.gain.exponentialRampToValueAtTime(0.0001,t+p[1]+0.34);
      o.start(t+p[1]); o.stop(t+p[1]+0.36); g.connect(sfxBus);
    });
  }
  function err(){                                           /* ❌ 低闷音 */
    var t=ctx.currentTime;
    var o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter();
    o.type='square'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(85,t+0.15);
    f.type='lowpass'; f.frequency.value=500;
    o.connect(f); f.connect(g);
    g.gain.setValueAtTime(0.10,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);
    o.start(t); o.stop(t+0.20); g.connect(sfxBus);
  }
  function blip(){
    var t=ctx.currentTime;
    var o=ctx.createOscillator(), g=ctx.createGain();
    o.type='sine'; o.frequency.value=493.88;
    o.connect(g);
    g.gain.setValueAtTime(0.0001,t);
    g.gain.exponentialRampToValueAtTime(0.11,t+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001,t+0.16);
    o.start(t); o.stop(t+0.18); g.connect(sfxBus);
  }

  function sfx(kind){
    if(!sfxOn||!ctx||ctx.state!=='running') return;
    if(kind==='tick') tick();
    else if(kind==='ok') ok();
    else if(kind==='err') err();
    else if(kind==='blip') blip();
  }

  /* 按钮音效：事件委托，点任何 button 轻叩 */
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('button'):null;
    if(b) sfx('tick');
  },true);

  /* toast 联动（包装 core.js 的 showToast，按前缀配音） */
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

  /* 自动播放解锁 + 标签页暂停 */
  function unlock(){
    if(!ensureCtx()) return;
    if(ctx.state==='suspended') ctx.resume();
  }
  document.addEventListener('pointerdown',unlock,{capture:true});
  document.addEventListener('keydown',unlock,{capture:true});
  document.addEventListener('visibilitychange',function(){
    if(!ctx) return;
    if(document.visibilityState==='hidden'){ if(ctx.state==='running') ctx.suspend(); }
    else { if(ctx.state==='suspended') ctx.resume(); }
  });

  /* 顶栏 🔔 开关 */
  function paintBtn(){
    var s=document.getElementById('sfxBtn');
    if(!s) return;
    s.textContent=sfxOn?'🔔':'🔕'; s.style.opacity=sfxOn?'1':'.4';
    s.title=sfxOn?'按钮音效：开':'按钮音效：关';
  }
  function bindBtn(){
    var s=document.getElementById('sfxBtn');
    if(s&&!s.__bound){ s.__bound=1;
      s.addEventListener('click',function(){
        sfxOn=!sfxOn; setPref('yt_sfx',sfxOn?'1':'0');
        if(sfxOn){ unlock(); blip(); }
        paintBtn();
        if(window.showToast) showToast(sfxOn?'🔔 按钮音效已开':'🔕 按钮音效已关');
      });
    }
  }
  bindBtn(); paintBtn(); wrapToast();
  window.__ytSfx=sfx;
  window.ytAudio={ get sfxOn(){return sfxOn;}, get state(){return ctx?ctx.state:'none';} };
})();
