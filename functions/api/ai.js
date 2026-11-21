/* =====================================================
   研途阅读 · AI 同源中转（Cloudflare Pages Function）
   手机运营商常拦 workbuddy.host / pollinations.ai——同源请求不会被拦。
   收 OpenAI 格式请求 → 服务端多模型顺序回退调 WB 云端（SSE 聚合，
   长度达标判断：<6500 字自动换模型）→ 失败回落 Pollinations →
   返回 OpenAI 格式 JSON。
   无限流、无短时限（用户要求）：仅保留消息封顶与服务端 175s 总程，
   等满 175s 比提前失败更符合生成场景。
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
  const aiBinding = (context.env && context.env.AI) ? context.env.AI : null;
  let body;
  try { body = await request.json(); } catch (e) { return json({ error: { message: 'bad json' } }, 400); }
  if (!body || !Array.isArray(body.messages) || !body.messages.length) {
    return json({ error: { message: 'messages required' } }, 400);
  }
  const msgs = body.messages.slice(-12).map(function (m) {
    return { role: String(m.role || 'user').slice(0, 16), content: String(m.content || '').slice(0, 24000) };
  });

  /* 诊断信息：各通道失败原因，最终 502 时随 body 返回 */
  let diag = {};

  /* ⓪ 通用端点代调：客户端传自定义 OpenAI 兼容端点（ep:{url,model,key}）时服务端直调——
     解决无 CORS 服务商（如智谱 bigmodel）浏览器直连必败的问题。
     防滥用白名单：仅 https 且路径以 /chat/completions 结尾（不是通用代理） */
  if (body.ep && body.ep.url && body.ep.model) {
    const eu = String(body.ep.url).replace(/\/+$/, '');
    if (/^https:\/\/[^/]+\/chat\/completions$/.test(eu)) {
      try {
        const r = await fetch(eu, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + String(body.ep.key || '').slice(0, 300)
          },
          body: JSON.stringify({
            model: String(body.ep.model).slice(0, 100),
            messages: msgs,
            temperature: body.temperature != null ? body.temperature : 0.6,
            stream: false
          })
        });
        if (r.ok) {
          const j = await r.json().catch(function () { return null; });
          const t = j && j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : null;
          if (t && t.trim().length > 2) {
            return json({ choices: [{ message: { role: 'assistant', content: String(t) } }] });
          }
          diag.ep = 'HTTP ' + r.status + ' 空内容';
        } else {
          diag.ep = 'HTTP ' + r.status;
        }
      } catch (e) { diag.ep = 'ERR:' + String(e && e.message || e).slice(0, 50); }
    } else {
      diag.ep = '端点不合规';
    }
  }

  /* ① WB 云端多模型顺序回退（SSE 聚合，长度达标判断） */
  try {
    const text = await wbRace(msgs, body.temperature, body.model, diag);
    if (text && text.trim().length > 2) {
      return json({ choices: [{ message: { role: 'assistant', content: text } }] });
    }
    diag.wb = '竞速全空 (' + diag.wb + ')';
  } catch (e) { diag.wb = 'ERR:' + String(e && e.message || e).slice(0, 60); }

  /* ② Cloudflare Workers AI（后台加 AI 绑定后自动启用；免 key，稳定）
     双模型顺序回退：70b 质量优先，8b 快速兜底 */
  if (aiBinding) {
    const waModels = ['@cf/meta/llama-3.3-70b-instruct-fp8-fast', '@cf/meta/llama-3.1-8b-instruct'];
    for (const m of waModels) {
      try {
        const r = await aiBinding.run(m, {
          messages: msgs,
          temperature: body.temperature != null ? body.temperature : 0.6
        });
        const t = r && (r.response || (r.choices && r.choices[0] && r.choices[0].message ? r.choices[0].message.content : null));
        const L = (t || '').trim().length;
        diag.wa = m.split('/').pop() + ':' + L + '字';
        if (t && L > 2) {
          return json({ choices: [{ message: { role: 'assistant', content: String(t) } }] });
        }
      } catch (e) { diag.wa = m.split('/').pop() + ':ERR:' + String(e && e.message || e).slice(0, 50); }
    }
  }

  /* ③ Pollinations 服务端回落 */
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

/* 多模型顺序回退 + 长度达标判断：WB 对同 key 并发流有限制（3 路并行实测全空），
   且 auto 等模型存在 ~5000 字符输出截断——输出不足 6500 字时自动换下一个模型，
   池耗尽/总程 175s 时返回历史最长输出（客户端校验兜底） */
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

  const GOOD = 6500;
  const t0 = Date.now();
  let best = '', bestLen = 0;
  for (let i = 0; i < pool.length; i++) {
    if (Date.now() - t0 > 170000) { diag.wb += ' 总程175s到'; break; }
    const text = await wbChat(pool[i], msgs, temperature);
    const L = (text || '').trim().length;
    if (L > bestLen) { bestLen = L; best = text || ''; }
    diag.wb += ' ' + pool[i] + ':' + L + '字';
    if (L >= GOOD) break;
  }
  if (bestLen > 0) diag.wb += ' 返回' + bestLen + '字';
  return best;
}

/* 单通道 WB SSE 聚合：无空闲掐断（流式只要还在产 token 就继续等），
   仅保留单模型 90s 上限避免单模型吃光总程 */
async function wbChat(model, msgs, temperature) {
  const ctrl = new AbortController();
  const t0 = Date.now();
  const hard = setTimeout(function () { ctrl.abort(); }, 90000);
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
    if (!r.ok || !r.body) { clearTimeout(hard); return ''; }
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '', out = '';
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buf += dec.decode(chunk.value, { stream: true });
      if (Date.now() - t0 > 90000) break;
      let idx;
      while ((idx = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (line.indexOf('data:') !== 0) continue;
        const payload = line.slice(5).trim();
        if (payload === '[DONE]') { clearTimeout(hard); return out; }
        try {
          const j = JSON.parse(payload);
          const d = j.choices && j.choices[0] && j.choices[0].delta;
          if (d && d.content) out += d.content;
        } catch (e) { /* 忽略无法解析的行 */ }
      }
    }
    clearTimeout(hard);
    return out;
  } catch (e) {
    clearTimeout(hard);
    return '';
  }
}

/* 调试端点：GET /api/ai?debug=1 返回绑定状态（不含敏感信息） */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  if (url.searchParams.get('debug') !== '1') return json({ ok: false }, 404);
  return json({
    hasAI: !!(context.env && context.env.AI),
    keys: context.env ? Object.keys(context.env) : []
  });
}
