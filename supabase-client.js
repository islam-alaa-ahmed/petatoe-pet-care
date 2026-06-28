/* PETATOE v8.0.2 — Supabase REST Client Bootstrap
   Provides window.supabase for read/write calls without migrating data automatically. */
(function(){
  'use strict';

  function getConfig(){
    return window.PETATOE_SUPABASE_CONFIG || null;
  }

  function trimSlash(v){ return String(v || '').replace(/\/+$/, ''); }

  function encodeValue(v){
    if(v === null) return 'null';
    if(v === undefined) return '';
    return encodeURIComponent(String(v));
  }

  function buildHeaders(extra){
    var cfg = getConfig();
    var key = cfg && cfg.publishableKey;
    var headers = {
      apikey: key,
      Authorization: 'Bearer ' + key,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    };
    if(extra){ Object.keys(extra).forEach(function(k){ headers[k] = extra[k]; }); }
    return headers;
  }

  function createResult(data, error, response, count){
    return {
      data: data === undefined ? null : data,
      error: error || null,
      status: response ? response.status : 0,
      statusText: response ? (response.statusText || '') : '',
      count: count == null ? null : count
    };
  }

  function parseCount(response){
    var range = response && response.headers ? response.headers.get('content-range') : null;
    if(!range) return null;
    var m = String(range).match(/\/(\d+)$/);
    return m ? Number(m[1]) : null;
  }

  async function parseResponse(response, head){
    var data = null;
    if(!head){
      var text = await response.text();
      if(text){
        try{ data = JSON.parse(text); }
        catch(_e){ data = text; }
      }
    }
    if(response.ok){ return createResult(data, null, response, parseCount(response)); }
    var errMsg = (data && (data.message || data.error_description || data.error)) || response.statusText || 'Supabase request failed';
    return createResult(null, { message: errMsg, details: data, status: response.status }, response, parseCount(response));
  }

  function QueryBuilder(table){
    this.table = table;
    this.method = 'GET';
    this.payload = undefined;
    this.params = [];
    this.head = false;
    this.count = null;
    this.executed = false;
  }

  QueryBuilder.prototype._param = function(k,v){
    this.params.push(encodeURIComponent(k) + '=' + encodeValue(v));
    return this;
  };

  QueryBuilder.prototype.select = function(columns, options){
    options = options || {};
    this.method = this.method === 'GET' ? 'GET' : this.method;
    this._param('select', columns || '*');
    if(options.count) this.count = options.count;
    if(options.head) this.head = true;
    return this;
  };

  QueryBuilder.prototype.limit = function(n){ return this._param('limit', n); };
  QueryBuilder.prototype.offset = function(n){ return this._param('offset', Math.max(0, Number(n)||0)); };
  QueryBuilder.prototype.range = function(from, to){
    from = Math.max(0, Number(from)||0);
    to = Math.max(from, Number(to)||from);
    return this.offset(from).limit((to - from) + 1);
  };
  QueryBuilder.prototype.order = function(column, opts){
    opts = opts || {};
    if(Array.isArray(column)){
      var joined = column.map(function(o){
        if(typeof o === 'string') return o.indexOf('.') >= 0 ? o : (o + '.asc');
        return String(o.column || o.name || '').trim() + '.' + (o.ascending === false ? 'desc' : 'asc');
      }).filter(Boolean).join(',');
      return this._param('order', joined);
    }
    if(typeof column === 'string' && column.indexOf(',') >= 0){
      return this._param('order', column);
    }
    var c = String(column || '').trim();
    var value = (c.indexOf('.') >= 0) ? c : (c + '.' + (opts.ascending === false ? 'desc' : 'asc'));
    return this._param('order', value);
  };
  QueryBuilder.prototype.eq = function(column, value){ return this._param(column, 'eq.' + String(value)); };
  QueryBuilder.prototype.neq = function(column, value){ return this._param(column, 'neq.' + String(value)); };
  QueryBuilder.prototype.gt = function(column, value){ return this._param(column, 'gt.' + String(value)); };
  QueryBuilder.prototype.gte = function(column, value){ return this._param(column, 'gte.' + String(value)); };
  QueryBuilder.prototype.lt = function(column, value){ return this._param(column, 'lt.' + String(value)); };
  QueryBuilder.prototype.lte = function(column, value){ return this._param(column, 'lte.' + String(value)); };
  QueryBuilder.prototype.ilike = function(column, value){ return this._param(column, 'ilike.' + String(value)); };
  QueryBuilder.prototype.is = function(column, value){ return this._param(column, 'is.' + String(value)); };
  QueryBuilder.prototype.not = function(column, operator, value){
    var v = 'not.' + String(operator || 'eq');
    if(value !== undefined && value !== null) v += '.' + String(value);
    else if(String(operator) === 'is') v += '.null';
    return this._param(column, v);
  };
  QueryBuilder.prototype.rawFilter = function(column, expression){ return this._param(column, String(expression || '')); };

  QueryBuilder.prototype.insert = function(rows, options){
    this.method = 'POST';
    this.payload = Array.isArray(rows) ? rows : [rows];
    if(options && options.count) this.count = options.count;
    return this;
  };

  QueryBuilder.prototype.upsert = function(rows, options){
    this.method = 'POST';
    this.payload = Array.isArray(rows) ? rows : [rows];
    this.preferOverride = 'resolution=merge-duplicates,return=representation';
    if(options && options.onConflict) this._param('on_conflict', options.onConflict);
    return this;
  };

  QueryBuilder.prototype.update = function(values){
    this.method = 'PATCH';
    this.payload = values || {};
    return this;
  };

  QueryBuilder.prototype.delete = function(){
    this.method = 'DELETE';
    return this;
  };

  QueryBuilder.prototype.execute = async function(){
    var cfg = getConfig();
    if(!cfg || !cfg.url || !cfg.publishableKey){
      return createResult(null, { message:'PETATOE Supabase config missing' }, null, null);
    }
    var base = trimSlash(cfg.url) + '/rest/v1/' + encodeURIComponent(this.table);
    var url = base + (this.params.length ? '?' + this.params.join('&') : '');
    var prefer = this.preferOverride || 'return=representation';
    if(this.count) prefer += ',count=' + this.count;
    var options = {
      method: this.head ? 'HEAD' : this.method,
      headers: buildHeaders({ Prefer: prefer })
    };
    if(this.payload !== undefined && !this.head){ options.body = JSON.stringify(this.payload); }
    try{
      var response = await fetch(url, options);
      return await parseResponse(response, this.head);
    }catch(error){
      return createResult(null, { message: error && error.message ? error.message : String(error) }, null, null);
    }
  };

  QueryBuilder.prototype.then = function(resolve, reject){
    return this.execute().then(resolve, reject);
  };
  QueryBuilder.prototype.catch = function(reject){ return this.execute().catch(reject); };

  var client = {
    from: function(table){ return new QueryBuilder(table); },
    rpc: async function(fnName, params){
      var cfg = getConfig();
      if(!cfg || !cfg.url || !cfg.publishableKey){ return createResult(null, { message:'PETATOE Supabase config missing' }, null, null); }
      try{
        var response = await fetch(trimSlash(cfg.url) + '/rest/v1/rpc/' + encodeURIComponent(fnName), {
          method: 'POST',
          headers: buildHeaders(),
          body: JSON.stringify(params || {})
        });
        return await parseResponse(response, false);
      }catch(error){
        return createResult(null, { message: error && error.message ? error.message : String(error) }, null, null);
      }
    },
    __petatoeRestClient: true,
    __phase: 'SUPABASE_CLIENT_BOOTSTRAP_ONLY'
  };

  window.supabase = client;
  window.PETATOE_SUPABASE_CLIENT = client;
  console.log('✅ PETATOE Supabase Client Bootstrap loaded — window.supabase is ready');
})();
