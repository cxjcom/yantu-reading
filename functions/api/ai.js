/* =====================================================
   研途阅读 · AI 同源中转（Cloudflare Pages Function）
   手机运营商常拦 workbuddy.host / pollinations.ai——同源请求不会被拦。
   收 OpenAI 格式请求 → 服务端多模型竞速调 WB 云端（SSE 逐块聚合，
   首个产出即胜出）→ 失败回落 Pollinations → 返回 OpenAI 格式 JSON。
   防滥用：同 IP 15 次/分钟（isolate 内存，尽力而为）+ 消息条数/长度封顶。
   ===================================================== */
const WB_CHAT = 'https://kaoyan-reading-65228.app.workbuddy.host/.cloud/llm/chat/completions';
const WB_KEY = 'wbpk_xBdw1VVfFNuWiVJgnZPy_EY32VZ53l9ecPE5JwddrM6FHqeySawSU';
const WB_POOL = ['auto', 'hy4std', 'fast-model'];

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const request = context.request;
  const ip = request.headers.get('CF-Connecting-IP') || 'anon';
  /* 限流：15 次/分钟/IP */
  const now = Date.now();
  if (!globalThis.__ytRL) globalThis.__ytRL = new Map();
  const arr = (globalThis.__ytRL.get(ip) || []).filter(function (t) { return now - t < 60000; });
  if (arr.length >= 15) return json({ error: { message: '速率限制：每分钟 15 次，稍后再试' } }, 429);
  arr.push(now);
  globalThis.__ytRL.set(ip, arr);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: { message: 'bad json' } }, 400); }
  if (!body || !Array.isArray(body.messages) || !body.messages.length) {
    return json({ error: { message: 'messages required' } }, 400);
  }
  const msgs = body.messages.slice(-12).map(function (m) {
    return { role: String(m.role || 'user').slice(0, 16), content: String(m.content || '').slice(0, 24000) };
  });

  /* ① WB 云端多模型竞速（SSE 聚合，共享空闲 40s / 硬顶 85s） */
  let diag = {};
  try {
    const text = await wbRace(msgs, body.temperature, body.model, diag);
    if (text && text.trim().length > 2) {
      return json({ choices: [{ message: { role: 'assistant', content: text } }] });
    }
    diag.wb = '竞速全空 (' + diag.wb + ')';
  } catch (e) { diag.wb = 'ERR:' + String(e && e.message || e).slice(0, 60); }

  /* ② Pollinations 服务端回落 */
  try {
    const r = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: msgs,
        temperature: body.temperature != null ? body.temperature : 0.7
      })
    });
    diag.poll = 'HTTP ' + r.status;
    if (r.ok) {
      const j = await r.json().catch(function () { return null; });
      const t = j && j.choices && j.choices[0] && (j.choices[0].message ? j.choices[0].message.content : (j.choices[0].content || j.content));
      if (t) return json({ choices: [{ message: { role: 'assistant', content: String(t) } }] });
      diag.poll += ' 空内容';
    }
  } catch (e) { diag.poll = 'ERR:' + String(e && e.message || e).slice(0, 60); }

  return json({ error: { message: '上游端点均不可用' }, diag: diag }, 502);
}

/* 多模型竞速：preferModel（客户端缓存的真实模型）优先，池内其余模型并行，
   任一通道产出 >2 字即胜出；共享空闲看门狗 40s / 硬顶 85s */
async function wbRace(msgs, temperature, preferModel, diag) {
  const pool = [];
  const add = function (m) {
    if (m && typeof m === 'string' && m !== 'shell' && pool.indexOf(m) < 0) pool.push(m);
  };
  add('auto');                                          /* auto 历史输出最长（6400-7000 字），置顶 */
  if (preferModel && preferModel !== 'auto') add(preferModel);
  WB_POOL.forEach(add);
  if (!pool.length) pool.push('auto');
  diag.wb = 'pool[' + pool.join(',') + ']';

  return new Promise(function (resolve) {
    let settled = false, pending = pool.length;
    const finish = function (text) {
      if (settled) return;
      settled = true;
      clearTimeout(hard);
      resolve(text || '');
    };
    const hard = setTimeout(function () {
      diag.wb += ' 硬顶85s';
      finish('');
    }, 85000);
    let idle = setTimeout(function () {
      diag.wb += ' 空闲40s';
      finish('');
    }, 40000);
    const tick = function () {
      clearTimeout(idle);
      idle = setTimeout(function () {
        diag.wb += ' 空闲40s';
        finish('');
      }, 40000);
    };
    pool.forEach(function (m) {
      wbChat(m, msgs, temperature, tick).then(function (text) {
        if (settled) return;
        if (text && text.trim().length > 2) finish(text);
        else {
          pending--;
          diag.wb += ' ' + m + ':空';
          if (pending <= 0) finish('');
        }
      });
    });
  });
}

/* 单通道 WB SSE 聚合：onChunk 为共享看门狗喂狗回调；半截输出也返回 */
async function wbChat(model, msgs, temperature, onChunk) {
  const ctrl = new AbortController();
  const t0 = Date.now();
  const hard = setTimeout(function () { ctrl.abort(); }, 85000);
  let idle = setTimeout(function () { ctrl.abort(); }, 40000);
  try {
    const r = await fetch(WB_CHAT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        'x-wb-webapp-access-key': WB_KEY
      },
      body: JSON.stringify({
        model: model,
        messages: msgs,
        stream: true,
        temperature: temperature != null ? temperature : 0.6
      }),
      signal: ctrl.signal
    });
    if (!r.ok || !r.body) { clearTimeout(hard); clearTimeout(idle); return ''; }
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '', out = '';
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buf += dec.decode(chunk.value, { stream: true });
      clearTimeout(idle);
      idle = setTimeout(function () { ctrl.abort(); }, 40000);
      if (onChunk) onChunk();
      if (Date.now() - t0 > 85000) break;
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (line.indexOf('data:') !== 0) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') { clearTimeout(hard); clearTimeout(idle); return out; }
        try {
          const j = JSON.parse(payload);
          const d = j.choices && j.choices[0] && j.choices[0].delta;
          if (d && d.content) out += d.content;
        } catch (e) { /* 忽略无法解析的行 */ }
      }
    }
    clearTimeout(hard); clearTimeout(idle);
    return out;
  } catch (e) {
    clearTimeout(hard); clearTimeout(idle);
    return '';
  }
}
