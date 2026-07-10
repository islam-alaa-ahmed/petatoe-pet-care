// PETATOE Enterprise Translation Service — Production Edge Function
// Secrets stay in Supabase. Never place provider keys in GitHub Pages assets.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@1";
import { createClient } from "npm:@supabase/supabase-js@2";

type Language = "ar" | "en";
type Provider = "openai" | "deepl" | "google";

interface TranslationRequest {
  text?: unknown;
  sourceLanguage?: unknown;
  targetLanguage?: unknown;
  context?: unknown;
}

interface TranslationResult {
  text: string;
  provider: Provider;
  model?: string;
}

const MAX_TEXT_LENGTH = 1200;
const MAX_CONTEXT_LENGTH = 160;
const REQUEST_TIMEOUT_MS = 20_000;
const GLOSSARY_VERSION = "petatoe-ets-v1";

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

function normalize(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeLanguage(value: unknown): Language | null {
  const language = normalize(value).toLowerCase();
  return language === "ar" || language === "en" ? language : null;
}

function parseAllowedOrigins(): string[] {
  return (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

function resolveCorsOrigin(requestOrigin: string, allowedOrigins: string[]): string | null {
  if (!allowedOrigins.length) return null;
  const normalizedOrigin = requestOrigin.replace(/\/$/, "");
  return allowedOrigins.includes(normalizedOrigin) ? normalizedOrigin : null;
}

function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsOrigin: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...BASE_CORS_HEADERS,
      "Access-Control-Allow-Origin": corsOrigin,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function extractProtectedTokens(text: string): string[] {
  const patterns = [
    /\{[^{}]+\}/g,
    /\$\{[^{}]+\}/g,
    /%[a-zA-Z0-9_.-]+%/g,
    /https?:\/\/[^\s]+/g,
    /[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g,
    /<[^>]+>/g,
  ];

  const tokens = new Set<string>();
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) tokens.add(match[0]);
  }
  return [...tokens];
}

function validateProtectedTokens(source: string, translated: string): boolean {
  return extractProtectedTokens(source).every((token) => translated.includes(token));
}

function buildInstructions(source: Language, target: Language, context: string): string {
  const targetName = target === "en" ? "English" : "Arabic";
  const sourceName = source === "en" ? "English" : "Arabic";

  return [
    "You are the controlled enterprise UI translation service for PETATOE.",
    `Translate from ${sourceName} to ${targetName}.`,
    `UI context: ${context || "petatoe-ui"}.`,
    "Return only the translated text, with no explanation, quotation marks, or markdown wrapper.",
    "Preserve PETATOE, numbers, invoice identifiers, vehicle identifiers, emojis, HTML tags, URLs, emails, and placeholders exactly.",
    "Do not translate customer names, pet names, employee names, vehicle names, service names that look like stored business data, or database identifiers.",
    "Use Saudi ERP terminology consistently.",
    "Approved terminology: VAT; Payroll Management; Payroll Statement; Vehicle Operations; Vehicle Operations Reports; Reference Data; Trusted Devices; Active Sessions; Security Log; Sales Before VAT; Permissions; Audit Log.",
    "Keep the translation concise and suitable for buttons, labels, tables, dialogs, and reports.",
  ].join("\n");
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function translateWithOpenAI(
  text: string,
  source: Language,
  target: Language,
  context: string,
): Promise<TranslationResult> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const model = Deno.env.get("OPENAI_TRANSLATION_MODEL") || "gpt-4.1-mini";
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");

  const response = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      instructions: buildInstructions(source, target, context),
      input: text,
      max_output_tokens: 1200,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[PETATOE ETS] OpenAI error", response.status, payload?.error?.code || "unknown");
    throw new Error("OpenAI translation request failed");
  }

  let output = normalize(payload?.output_text);
  if (!output && Array.isArray(payload?.output)) {
    output = normalize(
      payload.output
        .flatMap((item: any) => Array.isArray(item?.content) ? item.content : [])
        .filter((item: any) => item?.type === "output_text")
        .map((item: any) => item?.text || "")
        .join(" "),
    );
  }

  if (!output) throw new Error("OpenAI returned an empty translation");
  return { text: output, provider: "openai", model };
}

async function translateWithDeepL(
  text: string,
  source: Language,
  target: Language,
): Promise<TranslationResult> {
  const apiKey = Deno.env.get("DEEPL_API_KEY");
  const apiUrl = Deno.env.get("DEEPL_API_URL") || "https://api-free.deepl.com/v2/translate";
  if (!apiKey) throw new Error("DEEPL_API_KEY is not configured");

  const params = new URLSearchParams();
  params.set("text", text);
  params.set("source_lang", source.toUpperCase());
  params.set("target_lang", target === "en" ? "EN-US" : "AR");
  params.set("preserve_formatting", "1");

  const response = await fetchWithTimeout(apiUrl, {
    method: "POST",
    headers: {
      "Authorization": `DeepL-Auth-Key ${apiKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[PETATOE ETS] DeepL error", response.status);
    throw new Error("DeepL translation request failed");
  }

  const output = normalize(payload?.translations?.[0]?.text);
  if (!output) throw new Error("DeepL returned an empty translation");
  return { text: output, provider: "deepl" };
}

async function translateWithGoogle(
  text: string,
  source: Language,
  target: Language,
): Promise<TranslationResult> {
  const apiKey = Deno.env.get("GOOGLE_TRANSLATE_API_KEY");
  if (!apiKey) throw new Error("GOOGLE_TRANSLATE_API_KEY is not configured");

  const response = await fetchWithTimeout(
    `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source, target, format: "text" }),
    },
  );

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[PETATOE ETS] Google error", response.status);
    throw new Error("Google translation request failed");
  }

  const output = normalize(payload?.data?.translations?.[0]?.translatedText);
  if (!output) throw new Error("Google returned an empty translation");
  return { text: output, provider: "google" };
}

async function requestProviderTranslation(
  text: string,
  source: Language,
  target: Language,
  context: string,
): Promise<TranslationResult> {
  const provider = normalize(Deno.env.get("TRANSLATION_PROVIDER") || "openai").toLowerCase() as Provider;
  if (provider === "openai") return translateWithOpenAI(text, source, target, context);
  if (provider === "deepl") return translateWithDeepL(text, source, target);
  if (provider === "google") return translateWithGoogle(text, source, target);
  throw new Error("Unsupported translation provider");
}

export default {
  fetch: withSupabase(
    { auth: ["publishable", "secret"] },
    async (req: Request) => {
      const requestOrigin = normalize(req.headers.get("origin"));
      const allowedOrigins = parseAllowedOrigins();
      const corsOrigin = resolveCorsOrigin(requestOrigin, allowedOrigins);

      if (!corsOrigin) {
        return new Response(JSON.stringify({ error: "Origin not allowed" }), {
          status: 403,
          headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
        });
      }

      if (req.method === "OPTIONS") {
        return new Response("ok", {
          status: 200,
          headers: { ...BASE_CORS_HEADERS, "Access-Control-Allow-Origin": corsOrigin },
        });
      }

      if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405, corsOrigin);
      }

      const contentType = req.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return jsonResponse({ error: "Content-Type must be application/json" }, 415, corsOrigin);
      }

      try {
        const body = await req.json() as TranslationRequest;
        const text = normalize(body.text);
        const sourceLanguage = normalizeLanguage(body.sourceLanguage);
        const targetLanguage = normalizeLanguage(body.targetLanguage);
        const context = normalize(body.context || "petatoe-ui").slice(0, MAX_CONTEXT_LENGTH);

        if (!text || text.length > MAX_TEXT_LENGTH) {
          return jsonResponse({ error: "Invalid text length" }, 400, corsOrigin);
        }
        if (!sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage) {
          return jsonResponse({ error: "Invalid language pair" }, 400, corsOrigin);
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        if (!supabaseUrl || !serviceRoleKey) {
          console.error("[PETATOE ETS] Missing built-in Supabase environment variables");
          return jsonResponse({ error: "Translation service database is not configured" }, 503, corsOrigin);
        }

        const db = createClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        });

        const sourceHash = await sha256(
          `${GLOSSARY_VERSION}|${sourceLanguage}|${targetLanguage}|${context}|${text}`,
        );

        const { data: cached, error: cacheReadError } = await db
          .from("translation_cache")
          .select("id, translated_text, provider, hit_count, status")
          .eq("source_language", sourceLanguage)
          .eq("target_language", targetLanguage)
          .eq("source_hash", sourceHash)
          .neq("status", "rejected")
          .maybeSingle();

        if (cacheReadError) {
          console.error("[PETATOE ETS] Cache read failed", cacheReadError.code);
        }

        if (cached?.translated_text) {
          await db
            .from("translation_cache")
            .update({
              hit_count: Number(cached.hit_count || 0) + 1,
              last_used_at: new Date().toISOString(),
            })
            .eq("id", cached.id);

          return jsonResponse({
            translation: cached.translated_text,
            provider: cached.provider,
            cached: true,
            status: cached.status,
          }, 200, corsOrigin);
        }

        const translated = await requestProviderTranslation(
          text,
          sourceLanguage,
          targetLanguage,
          context,
        );

        if (!validateProtectedTokens(text, translated.text)) {
          console.error("[PETATOE ETS] Provider changed a protected placeholder or token");
          return jsonResponse({ error: "Translation validation failed" }, 502, corsOrigin);
        }

        const { error: cacheWriteError } = await db.from("translation_cache").upsert({
          source_language: sourceLanguage,
          target_language: targetLanguage,
          source_hash: sourceHash,
          source_text: text,
          translated_text: translated.text,
          provider: translated.model ? `${translated.provider}:${translated.model}` : translated.provider,
          glossary_version: GLOSSARY_VERSION,
          status: "machine",
          hit_count: 0,
          last_used_at: new Date().toISOString(),
        }, { onConflict: "source_language,target_language,source_hash" });

        if (cacheWriteError) {
          console.error("[PETATOE ETS] Cache write failed", cacheWriteError.code);
        }

        return jsonResponse({
          translation: translated.text,
          provider: translated.provider,
          cached: false,
          status: "machine",
        }, 200, corsOrigin);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[PETATOE ETS] Request failed", message);

        if (message.includes("not configured") || message.includes("Unsupported")) {
          return jsonResponse({ error: "Translation provider is not configured" }, 503, corsOrigin);
        }
        if (message.includes("aborted")) {
          return jsonResponse({ error: "Translation provider timed out" }, 504, corsOrigin);
        }
        return jsonResponse({ error: "Translation service failed" }, 500, corsOrigin);
      }
    },
  ),
};
