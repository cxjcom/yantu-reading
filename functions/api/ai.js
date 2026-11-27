/* =====================================================
   研途阅读 · AI 同源中转（Cloudflare Pages Function）
   手机运营商常拦外部 AI 域名——同源请求不会被拦。
   收 OpenAI 格式请求 → ① 通用端点代调（客户端自带 Key 的无 CORS 服务商，
   如智谱/豆包/混元/硅基流动）→ ② Pollinations 服务端回落 →
   返回 OpenAI 格式 JSON。
   WB 云端回退已移除（v1.10.32）：服务端无 WB 登录态，调用必返回
   login_required——此前每笔中转请求白试 3 次池模型；浏览器 WB 通道
   （SDK 直连+cookie）独立存在，不受本次删除影响。
   Workers AI 回退已移除（v1.10.31）：CF 账号资源不可被第三方消费。
   仅保留消息封顶、Origin 白名单、每 IP 限流与服务端 175s 总程。
   ===================================================== */

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

/* ========== 安全防护（2026-11-22 体检修复；2026-11-28 v1.11.11 放宽无 Origin）==========
   1) Origin 校验：带 Origin 的请求只放行本站域名（外域 403）；**无 Origin 放行**——
      X5/QQ 等部分内核 POST 不带 Origin，此前一刀切 403 会掐死手机中转陪跑（用户实测手机
      DeepSeek 无法生成的候选病因）。放宽后的滥用面评估：Workers AI 已丢弃（v1.10.31）、
      ep 代调需调用者自己的 Key、匿名无 Key 只能蹭第三方 Pollinations——且仍有每 IP 双窗限流封顶。
   2) 每 IP 双窗限流（内存近似，跨 isolate 不精确但足以挡脚本刷量）：
      每分钟 15 次 + 每小时 240 次（v1.11.11 放宽：兼容运营商 CGNAT 共享出口 IP 的多用户）。 */
function originAllowed(request) {
  const origin = request.headers.get('origin') || '';
  if (!origin) return true;                                             /* 无 Origin（X5 等）：放行，限流兜底 */
  try {
    const o = new URL(origin);
    if (o.origin === new URL(request.url).origin) return true;          /* 同源（预览域/自定义域自动覆盖） */
    const h = o.hostname;
    if (h === 'yantu-reading.pages.dev' || h.endsWith('.yantu-reading.pages.dev')) return true;
    return false;                                                       /* 伪造外域 Origin：仍拒 */
  } catch (e) { return false; }
}
const RL = (globalThis.__ytRL || (globalThis.__ytRL = new Map()));
function rateLimited(ip) {
  const now = Date.now();
  let e = RL.get(ip);
  if (!e || now - e.win0 > 3600000) { e = { win0: now, hour: 0, min0: now, min: 0 }; RL.set(ip, e); }
  if (now - e.min0 > 60000) { e.min0 = now; e.min = 0; }
  e.min++; e.hour++;
  if (RL.size > 5000) { for (const k of RL.keys()) { const v = RL.get(k); if (v && now - v.win0 > 3600000) RL.delete(k); } }
  return e.min > 15 || e.hour > 240;
}

export async function onRequestPost(context) {
  const request = context.request;
  if (!originAllowed(request)) {
    return json({ error: { message: 'forbidden: origin not allowed' } }, 403);
  }
  const rlIp = request.headers.get('cf-connecting-ip') || 'unknown';
  if (rateLimited(rlIp)) {
    return json({ error: { message: 'rate limited: try later' } }, 429);
  }
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
        const epBody = {
          model: String(body.ep.model).slice(0, 100),
          messages: msgs,
          temperature: body.temperature != null ? body.temperature : 0.6,
          stream: false
        };
        /* max_tokens 透传（2026-11-22 体检⑤）：客户端 yt_maxtok 配置，64-32768 合法 */
        const epMt = Number(body.ep.maxTok);
        if (epMt >= 64 && epMt <= 32768) epBody.max_tokens = epMt;
        const r = await fetch(eu, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + String(body.ep.key || '').slice(0, 300)
          },
          body: JSON.stringify(epBody)
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

  /* ① WB 云端回退已移除（v1.10.32）：服务端无 WB 登录态必 login_required，
     每笔请求此前白试 3 次池模型；浏览器 WB 通道（SDK+cookie）不受影响 */
  /* ② Cloudflare Workers AI 回退已移除（v1.10.31）：
     CF 账号资源从此不可被任何第三方消费 */

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

/* 调试端点：GET /api/ai?debug=1 返回绑定状态（不含敏感信息） */
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  if (url.searchParams.get('debug') !== '1') return json({ ok: false }, 404);
  return json({
    hasAI: !!(context.env && context.env.AI),
    keys: context.env ? Object.keys(context.env) : []
  });
}
