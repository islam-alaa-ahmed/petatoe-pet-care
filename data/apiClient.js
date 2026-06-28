/* PETATOE v3.9.1 — API Ready Architecture
   Future-safe API client. Default mode is disabled/local, so current LocalStorage screens keep working.
   When PHP API is ready, set PETATOE_API_CONFIG.mode = 'api' and baseUrl = 'api/'. */
(function(window){
  'use strict';

  var DEFAULTS = {
    version: '3.9.1',
    mode: 'local',
    baseUrl: 'api/',
    timeoutMs: 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };

  var config = Object.assign({}, DEFAULTS, window.PETATOE_API_CONFIG || {});
  config.headers = Object.assign({}, DEFAULTS.headers, (window.PETATOE_API_CONFIG && window.PETATOE_API_CONFIG.headers) || {});

  function trimSlashes(value){
    return String(value || '').replace(/^\/+|\/+$/g, '');
  }

  function buildUrl(path, query){
    var base = String(config.baseUrl || '').replace(/\/?$/, '/');
    var url = base + trimSlashes(path);
    if(query && typeof query === 'object'){
      var qs = Object.keys(query).filter(function(k){ return query[k] !== undefined && query[k] !== null && query[k] !== ''; })
        .map(function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(query[k]); }).join('&');
      if(qs) url += (url.indexOf('?') === -1 ? '?' : '&') + qs;
    }
    return url;
  }

  function withTimeout(promise, ms){
    if(!ms) return promise;
    var timer;
    var timeout = new Promise(function(_, reject){
      timer = setTimeout(function(){ reject(new Error('API timeout after ' + ms + 'ms')); }, ms);
    });
    return Promise.race([promise, timeout]).finally(function(){ clearTimeout(timer); });
  }

  // PETATOE v6.1.80 Phase 5-D: keep API JSON parsing explicit and non-destructive.
  // Valid JSON responses are parsed; non-JSON text is preserved for backward compatibility.
  function safeResponseParse(text){
    if(text === undefined || text === null || text === '') return null;
    var raw = String(text);
    var trimmed = raw.trim();
    if(!trimmed) return null;
    if(!/^[\[{"0-9tfn\-]/.test(trimmed)) return raw;
    try{
      if(window.PETATOESecurity && typeof window.PETATOESecurity.safeJsonParse === 'function'){
        var parsed = window.PETATOESecurity.safeJsonParse(trimmed, undefined);
        return parsed === undefined ? raw : parsed;
      }
      return JSON.parse(trimmed);
    }catch(e){
      if(window.PETATOEUtils && window.PETATOEUtils.warnSilentCatch){
        window.PETATOEUtils.warnSilentCatch('data/apiClient.js:safeResponseParse', e);
      }
      return raw;
    }
  }

  function request(method, path, body, options){
    options = options || {};
    var headers = Object.assign({}, config.headers, options.headers || {});
    var fetchOptions = { method: method, headers: headers, credentials: options.credentials || 'same-origin' };
    if(body !== undefined && body !== null){
      fetchOptions.body = (typeof body === 'string') ? body : JSON.stringify(body);
    }
    var url = buildUrl(path, options.query);
    return withTimeout(fetch(url, fetchOptions), options.timeoutMs || config.timeoutMs)
      .then(function(res){
        return res.text().then(function(text){
          var data = safeResponseParse(text);
          if(!res.ok){
            var err = new Error((data && data.message) || ('HTTP ' + res.status));
            err.status = res.status;
            err.data = data;
            throw err;
          }
          return data;
        });
      });
  }

  var ApiClient = {
    version: '3.9.1',
    config: config,
    isApiMode: function(){ return String(config.mode || 'local').toLowerCase() === 'api'; },
    setMode: function(mode){ config.mode = mode === 'api' ? 'api' : 'local'; return config.mode; },
    setBaseUrl: function(baseUrl){ config.baseUrl = baseUrl || 'api/'; return config.baseUrl; },
    endpointForTable: function(table){ return 'tables/' + encodeURIComponent(table); },
    get: function(path, query, options){ options = options || {}; options.query = query; return request('GET', path, null, options); },
    post: function(path, body, options){ return request('POST', path, body, options); },
    put: function(path, body, options){ return request('PUT', path, body, options); },
    delete: function(path, body, options){ return request('DELETE', path, body, options); },
    table: {
      list: function(table, query){ return ApiClient.get(ApiClient.endpointForTable(table), query); },
      save: function(table, payload){ return ApiClient.put(ApiClient.endpointForTable(table), payload); },
      append: function(table, row){ return ApiClient.post(ApiClient.endpointForTable(table), row); },
      remove: function(table, id){ return ApiClient.delete(ApiClient.endpointForTable(table) + '/' + encodeURIComponent(id)); }
    }
  };

  window.PETATOEApiClient = ApiClient;
})(window);
