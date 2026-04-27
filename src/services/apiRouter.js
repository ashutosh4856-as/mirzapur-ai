// 🔑 API Keys
export const KEYS = {
  gemini:     '',
  groq:       'YOUR_GROQ_KEY_HERE',
  openrouter: '',
};

export const SYSTEM_PROMPT = `तुम "मिर्ज़ापुर AI" हो — smart, friendly, दोस्त जैसा AI assistant।

Rules:
1. User की भाषा में जवाब दो (Hindi/Hinglish/English)
2. दोस्त की तरह बात करो, formal नहीं
3. Code हमेशा proper \`\`\`language\`\`\` block में लिखो
4. जब clarification चाहिए:
   [QUESTION]: सवाल यहाँ
   [OPTIONS]: Option1 | Option2 | Option3 | खुद बताओ
5. Image generate करनी हो:
   [IMAGE]: detailed english description here
6. Short और clear जवाब दो`;

let apiIdx = 0;
const API_NAMES = ['gemini', 'groq', 'openrouter'];

// ── GEMINI STREAMING ──
async function* streamGemini(messages) {
  const k = KEYS.gemini;
  if (!k) throw new Error('NO_KEY');
  const hist = messages.slice(0, -1).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));
  const last = messages[messages.length - 1].content;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${k}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [...hist, { role: 'user', parts: [{ text: last }] }],
        generationConfig: { maxOutputTokens: 2048, temperature: 0.75 }
      })
    }
  );
  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (!res.ok) throw new Error('ERR_' + res.status);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const json = JSON.parse(line.slice(6));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) yield text;
        } catch {}
      }
    }
  }
}

// ── GROQ STREAMING ──
async function* streamGroq(messages) {
  const k = KEYS.groq;
  if (!k) throw new Error('NO_KEY');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` },
    body: JSON.stringify({
      model: 'llama-3.1-70b-versatile',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 2048,
      temperature: 0.75,
      stream: true
    })
  });
  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (!res.ok) throw new Error('ERR_' + res.status);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const json = JSON.parse(line.slice(6));
          const text = json.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch {}
      }
    }
  }
}

// ── OPENROUTER STREAMING ──
async function* streamOpenRouter(messages) {
  const k = KEYS.openrouter;
  if (!k) throw new Error('NO_KEY');
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${k}`,
      'HTTP-Referer': 'https://mirzapur-ai.vercel.app'
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.1-8b-instruct:free',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 2048,
      stream: true
    })
  });
  if (res.status === 429) throw new Error('RATE_LIMIT');
  if (!res.ok) throw new Error('ERR_' + res.status);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      if (line.startsWith('data: ') && !line.includes('[DONE]')) {
        try {
          const json = JSON.parse(line.slice(6));
          const text = json.choices?.[0]?.delta?.content;
          if (text) yield text;
        } catch {}
      }
    }
  }
}

const streamFns = [streamGemini, streamGroq, streamOpenRouter];

// ── MAIN ROUTER — Auto rotation ──
export async function* streamAI(messages, onModelChange) {
  const start = apiIdx;
  for (let i = 0; i < streamFns.length; i++) {
    const idx = (start + i) % streamFns.length;
    const name = API_NAMES[idx];
    if (!KEYS[name]) continue;
    try {
      onModelChange?.(name);
      let got = false;
      for await (const chunk of streamFns[idx](messages)) {
        got = true;
        yield chunk;
      }
      if (got) { apiIdx = idx; return; }
    } catch (e) {
      if (e.message === 'RATE_LIMIT' || e.message === 'NO_KEY') {
        apiIdx = (idx + 1) % streamFns.length;
        continue;
      }
      throw e;
    }
  }
  throw new Error('सभी APIs unavailable हैं। Settings में keys check करो।');
}

// ── IMAGE GENERATION (Pollinations — Free) ──
export function getImageUrl(prompt) {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + ', high quality, detailed, 4k')}?width=512&height=512&nologo=true&seed=${Date.now()}`;
}

// ── WIKIPEDIA SEARCH ──
export async function searchWikipedia(query) {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.extract || null;
  } catch {
    return null;
  }
}
