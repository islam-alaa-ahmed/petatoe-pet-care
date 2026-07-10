# PETATOE Translation Edge Function

Deploy only after running `petatoe_translation_service_migration.sql`.

Required Edge Function secrets:
- `ALLOWED_ORIGINS`: comma-separated GitHub Pages and production origins.
- `TRANSLATION_API_URL`: OpenAI-compatible chat-completions endpoint.
- `TRANSLATION_API_KEY`: provider secret; never expose it in GitHub.
- `TRANSLATION_MODEL`: model identifier configured for translation.

The built-in Supabase secrets `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are used for the server cache.

Keep browser config `remoteEnabled: false` until the function, database migration, origin allowlist, rate controls, and provider billing limit are verified.
