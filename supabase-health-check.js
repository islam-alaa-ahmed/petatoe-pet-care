/* PETATOE v8.0.2 — Supabase Health Check
   Read-only connection verification. This file does NOT migrate or modify data. */
(function(){
  'use strict';
  console.log('✅ PETATOE Supabase Health Check script loaded');

  function getConfig(){
    return window.PETATOE_SUPABASE_CONFIG || null;
  }

  function buildHeaders(){
    var cfg = getConfig();
    return {
      apikey: cfg.publishableKey,
      Authorization: 'Bearer ' + cfg.publishableKey,
      Accept: 'application/json'
    };
  }

  async function checkEndpoint(name, url, options){
    var started = Date.now();
    try{
      var response = await fetch(url, options || {});
      return {
        name: name,
        ok: response.ok,
        status: response.status,
        statusText: response.statusText || '',
        ms: Date.now() - started
      };
    }catch(error){
      return {
        name: name,
        ok: false,
        status: 0,
        statusText: error && error.message ? error.message : String(error),
        ms: Date.now() - started
      };
    }
  }

  function explainDatabaseStatus(result){
    if(result.ok){ return 'OK'; }
    if(result.status === 401 || result.status === 403){
      return 'Reachable, but blocked by Auth/RLS until a Supabase session is active';
    }
    if(result.status === 404){ return 'Endpoint/Table not found'; }
    if(result.status === 0){ return 'Network/CORS error'; }
    return result.statusText || 'Unknown error';
  }

  async function petatoeSupabaseHealthCheck(){
    var cfg = getConfig();
    if(!cfg || !cfg.url || !cfg.publishableKey){
      console.error('❌ PETATOE Supabase config missing — supabase-config.js did not load or config is incomplete');
      return { ok:false, error:'CONFIG_MISSING' };
    }

    var base = cfg.url.replace(/\/$/, '');
    var authUrl = base + '/auth/v1/settings';
    var dbUrl = base + '/rest/v1/roles?select=code&limit=1';

    console.group('🐾 PETATOE Supabase Health Check');
    console.log('Project URL:', base);
    console.log('Mode:', 'Connection only — no data migration, no writes');

    var auth = await checkEndpoint('Auth API', authUrl, { headers: buildHeaders() });
    var database = await checkEndpoint('Database REST API', dbUrl, { headers: buildHeaders() });

    var result = {
      ok: !!auth.ok && (database.ok || database.status === 401 || database.status === 403),
      auth: auth,
      database: database,
      databaseExplanation: explainDatabaseStatus(database),
      migrationEnabled: false,
      writeTestEnabled: false
    };

    if(auth.ok){
      console.log('✅ Auth API:', auth.status, auth.ms + 'ms');
    }else{
      console.warn('⚠️ Auth API:', auth.status, auth.statusText, auth.ms + 'ms');
    }

    if(database.ok){
      console.log('✅ Database REST API:', database.status, database.ms + 'ms');
    }else if(database.status === 401 || database.status === 403){
      console.warn('⚠️ Database REST API:', database.status, explainDatabaseStatus(database), database.ms + 'ms');
    }else{
      console.error('❌ Database REST API:', database.status, explainDatabaseStatus(database), database.ms + 'ms');
    }

    if(result.ok){
      console.log('✅ Supabase connection health check completed');
    }else{
      console.error('❌ Supabase connection health check failed');
    }
    console.groupEnd();
    window.PETATOE_SUPABASE_HEALTH_LAST_RESULT = result;
    return result;
  }

  window.petatoeSupabaseHealthCheck = petatoeSupabaseHealthCheck;
  window.supabaseHealthCheck = petatoeSupabaseHealthCheck;

  window.addEventListener('load', function(){
    setTimeout(function(){
      petatoeSupabaseHealthCheck().catch(function(error){
        console.error('❌ PETATOE Supabase health check crashed:', error);
      });
    }, 1200);
  }, { once:true });
})();
