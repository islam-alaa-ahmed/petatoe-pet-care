# PETATOE Translation Edge Function — Production

## Dashboard deployment

1. Create the function as `petatoe-translate` using **Via Editor**.
2. Replace the default `index.ts` content with this file.
3. Deploy the function.
4. The modern Supabase wrapper validates `publishable` or `secret` API keys. Keep legacy `verify_jwt` disabled if Supabase exposes that separate option, because authorization is handled by `withSupabase`.

## Required secrets

Always add:

- `ALLOWED_ORIGINS`: comma-separated exact origins, without paths. Example: `https://example.github.io,http://localhost:5500`
- `TRANSLATION_PROVIDER`: `openai`, `deepl`, or `google`

For OpenAI:

- `OPENAI_API_KEY`
- `OPENAI_TRANSLATION_MODEL` (optional; defaults to `gpt-4.1-mini`)

For DeepL:

- `DEEPL_API_KEY`
- `DEEPL_API_URL` (optional; defaults to the free API endpoint)

For Google Cloud Translation:

- `GOOGLE_TRANSLATE_API_KEY`

The built-in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables are used for the private server cache.

## Required database

Run `petatoe_translation_service_migration.sql` before testing this function.
