import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200, origin = '*') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Access-Control-Allow-Origin': origin, 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function normalize(value: unknown) { return String(value ?? '').replace(/\s+/g, ' ').trim(); }
async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  const requestOrigin = req.headers.get('origin') || '';
  const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map((x) => x.trim()).filter(Boolean);
  const corsOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : (allowedOrigins[0] || '*');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { ...corsHeaders, 'Access-Control-Allow-Origin': corsOrigin } });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405, corsOrigin);
  if (allowedOrigins.length && !allowedOrigins.includes(requestOrigin)) return json({ error: 'Origin not allowed' }, 403, corsOrigin);

  try {
    const body = await req.json();
    const text = normalize(body.text);
    const sourceLanguage = normalize(body.sourceLanguage).toLowerCase();
    const targetLanguage = normalize(body.targetLanguage).toLowerCase();
    const context = normalize(body.context || 'petatoe-ui').slice(0, 120);
    if (!text || text.length > 1200) return json({ error: 'Invalid text length' }, 400, corsOrigin);
    if (!['ar', 'en'].includes(sourceLanguage) || !['ar', 'en'].includes(targetLanguage) || sourceLanguage === targetLanguage) return json({ error: 'Invalid language pair' }, 400, corsOrigin);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const sourceHash = await sha256(`${sourceLanguage}|${targetLanguage}|${text}`);
    const { data: cached } = await db.from('translation_cache').select('id,translated_text,provider').eq('source_language', sourceLanguage).eq('target_language', targetLanguage).eq('source_hash', sourceHash).maybeSingle();
    if (cached?.translated_text) {
      await db.from('translation_cache').update({ last_used_at: new Date().toISOString() }).eq('id', cached.id);
      return json({ translation: cached.translated_text, provider: cached.provider, cached: true }, 200, corsOrigin);
    }

    const apiUrl = Deno.env.get('TRANSLATION_API_URL');
    const apiKey = Deno.env.get('TRANSLATION_API_KEY');
    const model = Deno.env.get('TRANSLATION_MODEL');
    if (!apiUrl || !apiKey || !model) return json({ error: 'Translation provider is not configured' }, 503, corsOrigin);

    const systemPrompt = `You are PETATOE's enterprise UI translator. Translate from ${sourceLanguage} to ${targetLanguage}. Preserve numbers, placeholders like {name}, HTML tags, emojis, product names, customer names, vehicle names, invoice numbers, and the brand PETATOE. Use Saudi ERP terminology: VAT, Payroll Statement, Vehicle Operations, Trusted Devices, Active Sessions, Security Log. Return only the translated text.`;
    const providerResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: `Context: ${context}\nText: ${text}` }], temperature: 0 }),
    });
    const providerPayload = await providerResponse.json();
    if (!providerResponse.ok) return json({ error: 'Translation provider request failed' }, 502, corsOrigin);
    const translatedText = normalize(providerPayload?.choices?.[0]?.message?.content);
    if (!translatedText) return json({ error: 'Translation provider returned an empty result' }, 502, corsOrigin);

    await db.from('translation_cache').upsert({ source_language: sourceLanguage, target_language: targetLanguage, source_hash: sourceHash, source_text: text, translated_text: translatedText, provider: 'configured-provider', status: 'machine', last_used_at: new Date().toISOString() }, { onConflict: 'source_language,target_language,source_hash' });
    return json({ translation: translatedText, provider: 'configured-provider', cached: false }, 200, corsOrigin);
  } catch (error) {
    console.error('[PETATOE translation]', error);
    return json({ error: 'Translation service failed' }, 500, corsOrigin);
  }
});
