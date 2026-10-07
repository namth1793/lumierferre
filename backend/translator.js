// Tự động dịch nội dung admin nhập (tiếng Việt) sang tiếng Anh cho giao diện EN.
// Chọn dịch vụ theo key có trong .env (ưu tiên từ trên xuống):
//   1. ANTHROPIC_API_KEY        → Claude: dịch văn phong thời trang cao cấp, giữ tên thương hiệu/tên mẫu
//   2. GOOGLE_TRANSLATE_API_KEY → Google Cloud Translation (500.000 ký tự/tháng miễn phí)
//   3. Không có key             → endpoint miễn phí của Google Translate (dễ bị chặn khi dịch nhiều, chỉ nên dùng thử)
// Kết quả lưu vào bảng `translations` (khóa = câu gốc) nên mỗi câu chỉ dịch 1 lần.

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Claude ───────────────────────────────────────────────
function claudeProvider() {
  const Anthropic = require('@anthropic-ai/sdk');
  const { betaZodOutputFormat } = require('@anthropic-ai/sdk/helpers/beta/zod');
  const { z } = require('zod');
  const client = new Anthropic();
  const Result = z.object({ translations: z.array(z.object({ i: z.number(), en: z.string() })) });

  const SYSTEM = `You translate website content for LUMIE FERRE, a Vietnamese luxury fashion house, from Vietnamese into natural, elegant English for its English storefront.
Rules:
- Keep brand, collection and model names as written (LUMIE FERRE, Rêverie, La Pureza, Almira, Celestine...). Translate the product type around them ("Váy Almira" → "Almira Dress").
- Keep "Áo dài" as "Áo Dài".
- Text that is already English or is only a proper name stays unchanged.
- Translate colour names ("Kem" → "Cream", "Hồng phấn" → "Powder Pink").
- Keep numbers, prices, years, quotation marks, line breaks and capitalisation style (an ALL-CAPS label stays ALL CAPS).
Return exactly one translation per input item, matched by its index i.`;

  return {
    name: 'Claude (claude-opus-5-5)',
    batchSize: 40,
    concurrency: 2,
    async translate(texts) {
      const response = await client.beta.messages.parse({
        model: 'claude-opus-5-5',
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'low', format: betaZodOutputFormat(Result) },
        system: SYSTEM,
        messages: [{ role: 'user', content: JSON.stringify(texts.map((text, i) => ({ i, vi: text }))) }],
      });
      if (response.stop_reason === 'refusal') throw new Error('Claude từ chối dịch đoạn này');
      if (!response.parsed_output) throw new Error(`Claude trả kết quả không hợp lệ (stop_reason: ${response.stop_reason})`);
      const out = new Array(texts.length);
      for (const t of response.parsed_output.translations) if (t.i >= 0 && t.i < texts.length) out[t.i] = t.en;
      return out;
    },
  };
}

// ── Google ───────────────────────────────────────────────
// Ký tự chỉ tiếng Việt mới có (không trùng tiếng Pháp/TBN) → chắc chắn là câu tiếng Việt
const VI_ONLY = /[đĐăĂơƠưƯĩĨũŨẠ-ỹ]/;

function googleProvider(callApi, name) {
  // Câu không phải tiếng Việt (tên thương hiệu "Rêverie", "Tops", "Blazer Structured"...) → giữ nguyên
  async function one(text) {
    const r = await callApi(text, 'auto');
    if (r.detected === 'vi') return r.text;
    if (VI_ONLY.test(text)) return (await callApi(text, 'vi')).text;
    return text;
  }
  return {
    name,
    batchSize: 1,
    concurrency: 2,
    async translate(texts) {
      for (let attempt = 0; ; attempt++) {
        try { return [await one(texts[0])]; } catch (e) {
          // Bị giới hạn tần suất (429/503) → chờ tăng dần rồi thử lại
          if (!/429|503/.test(e.message) || attempt >= 4) throw e;
          await sleep(1000 * 2 ** attempt);
        }
      }
    },
  };
}

async function googleCloudApi(text, sl) {
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: [text], target: 'en', format: 'text', ...(sl !== 'auto' ? { source: sl } : {}) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Google Cloud Translation HTTP ${res.status}`);
  const t = data.data.translations[0];
  return { text: t.translatedText, detected: t.detectedSourceLanguage || sl };
}

async function googleFreeApi(text, sl) {
  const res = await fetch(`https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sl}&tl=en`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body: new URLSearchParams({ q: text }),
  });
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  const body = await res.text();
  if (!body.startsWith('[')) throw new Error('Google Translate HTTP 429 (bị chặn tạm thời)');
  // sl=auto → [["bản dịch","ngôn ngữ phát hiện"]]; sl=vi → ["bản dịch"]
  const first = JSON.parse(body)[0];
  return Array.isArray(first) ? { text: first[0], detected: first[1] } : { text: first, detected: sl };
}

function pickProvider() {
  if (process.env.ANTHROPIC_API_KEY) return claudeProvider();
  if (process.env.GOOGLE_TRANSLATE_API_KEY) return googleProvider(googleCloudApi, 'Google Cloud Translation');
  return googleProvider(googleFreeApi, 'Google Translate miễn phí (chưa có API key — có thể bị chặn)');
}

// ── Bộ dịch + cache ──────────────────────────────────────
function createTranslator(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS translations (
      lang TEXT NOT NULL,
      source TEXT NOT NULL,
      text TEXT NOT NULL,
      PRIMARY KEY (lang, source)
    )
  `);
  const provider = pickProvider();
  const cache = new Map(db.prepare("SELECT source, text FROM translations WHERE lang = 'en'").all().map(r => [r.source, r.text]));
  const save = db.prepare("INSERT OR REPLACE INTO translations (lang, source, text) VALUES ('en', ?, ?)");
  const inFlight = new Map();
  const failedAt = new Map(); // câu vừa dịch lỗi → tạm không tự thử lại khi khách xem trang
  const RETRY_AFTER_MS = 5 * 60 * 1000;

  const needsTranslation = (s) => typeof s === 'string' && s.trim() && !cache.has(s) && !/^(https?:)?\/\//.test(s.trim());

  function translateBatch(batch) {
    const p = provider.translate(batch)
      .then(out => batch.forEach((source, i) => {
        if (typeof out[i] === 'string' && out[i].trim()) { cache.set(source, out[i]); save.run(source, out[i]); }
      }))
      .catch(e => batch.forEach(s => failedAt.set(s, Date.now())) || console.warn(`⚠ Dịch thất bại (${batch.length} câu, "${batch[0].slice(0, 40)}"...): ${e.message}`))
      .finally(() => batch.forEach(s => inFlight.delete(s)));
    batch.forEach(s => inFlight.set(s, p));
    return p;
  }

  // Dịch các câu chưa có trong cache; câu đang được dịch dở thì chờ cùng
  async function ensure(strings) {
    const unique = [...new Set(strings.filter(needsTranslation))];
    const pending = [...new Set(unique.filter(s => inFlight.has(s)).map(s => inFlight.get(s)))];
    const queue = unique.filter(s => !inFlight.has(s));
    const batches = [];
    for (let i = 0; i < queue.length; i += provider.batchSize) batches.push(queue.slice(i, i + provider.batchSize));
    const worker = async () => { while (batches.length) await translateBatch(batches.shift()); };
    await Promise.all([...pending, ...Array.from({ length: Math.min(provider.concurrency, batches.length) }, worker)]);
  }

  // Admin bấm Lưu: chờ dịch xong tối đa `ms` rồi trả lời, phần còn lại tiếp tục dịch ngầm
  async function ensureWithin(strings, ms = 20000) {
    let timer;
    const done = await Promise.race([
      ensure(strings).then(() => !strings.some(needsTranslation)),
      new Promise(r => { timer = setTimeout(() => r(false), ms); }),
    ]);
    clearTimeout(timer);
    return done;
  }

  // Câu chưa dịch gặp lúc khách xem trang → gom lại, dịch ngầm theo lô
  const backlog = new Set();
  let flushing = false;
  async function flushBacklog() {
    if (flushing) return;
    flushing = true;
    while (backlog.size) {
      const batch = [...backlog];
      backlog.clear();
      await ensure(batch);
    }
    flushing = false;
  }

  // Lấy bản dịch; chưa có → trả câu gốc và dịch ngầm để lần tải sau có tiếng Anh
  function tr(s) {
    if (typeof s !== 'string' || !s) return s;
    if (cache.has(s)) return cache.get(s);
    if (needsTranslation(s) && !inFlight.has(s) && !(Date.now() - (failedAt.get(s) || 0) < RETRY_AFTER_MS)) { backlog.add(s); setImmediate(flushBacklog); }
    return s;
  }

  return { ensure, ensureWithin, tr, provider: provider.name };
}

module.exports = { createTranslator };
