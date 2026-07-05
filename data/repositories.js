/* PETATOE v8.0.2 — Supabase-backed Repository facade.
   Phase 42.9D: business repositories no longer use PETATOEStorage/localStorage. */
(function(window){
  'use strict';
  if(window.PETATOERepositories && window.PETATOERepositories.__ready){ return; }

  var S=window.PETATOEStorage||{};
  var cache={};
  function repo(){return window.PETATOESupabaseRepository||null;}
  function tableFor(name){return (S.tableFor&&S.tableFor(name)) || (S.map&&S.map[name]&&S.map[name].table) || String(name||'');}
  function clone(v){try{return JSON.parse(JSON.stringify(v));}catch(_e){return v;}}
  function rowId(row, idx){return String((row&&row.id)||(row&&row.code)||(row&&row.key)||('row_'+Date.now().toString(36)+'_'+idx));}

  async function loadArray(name){
    var R=repo(), table=tableFor(name);
    if(!R||!R.hasClient||!R.hasClient()||!table) return cache[name]||[];
    var rows=await R.listJsonRows(table,{});
    cache[name]=Array.isArray(rows)?rows:[];
    return cache[name];
  }
  async function saveArray(name, rows){
    rows=Array.isArray(rows)?rows:[];
    cache[name]=clone(rows)||[];
    var R=repo(), table=tableFor(name);
    if(!R||!R.hasClient||!R.hasClient()||!table) return false;
    for(var i=0;i<rows.length;i++){
      await R.upsertJsonRow(table,rowId(rows[i],i),rows[i],{});
    }
    return true;
  }
  async function loadObject(name){
    var R=repo(), table=tableFor(name);
    if(!R||!R.hasClient||!R.hasClient()||!table) return cache[name]||{};
    var obj=await R.getSingleton(table,name,{});
    cache[name]=obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{};
    return cache[name];
  }
  async function saveObject(name,obj){
    obj=obj&&typeof obj==='object'&&!Array.isArray(obj)?obj:{};
    cache[name]=clone(obj)||{};
    var R=repo(), table=tableFor(name);
    if(!R||!R.hasClient||!R.hasClient()||!table) return false;
    var res=await R.saveSingleton(table,name,obj);
    return !!(res&&res.ok);
  }

  function arrayRepo(name){
    return {
      key:S.key?S.key(name):name,
      table:tableFor(name),
      all:function(){return Array.isArray(cache[name])?cache[name]:[];},
      saveAll:function(rows){cache[name]=Array.isArray(rows)?clone(rows):[]; saveArray(name,cache[name]); return true;},
      allAsync:function(){return loadArray(name);},
      saveAllAsync:function(rows){return saveArray(name,Array.isArray(rows)?rows:[]);},
      findById:function(id){return this.all().find(function(x){return String(x&&x.id)===String(id);})||null;},
      upsert:function(row){
        var rows=this.all().slice();
        var id=row&&row.id, done=false;
        rows=rows.map(function(x){if(String(x&&x.id)===String(id)){done=true;return Object.assign({},x,row);}return x;});
        if(!done)rows.push(row);
        this.saveAll(rows);
        return row;
      },
      remove:function(id){var rows=this.all().filter(function(x){return String(x&&x.id)!==String(id);});this.saveAll(rows);return rows;}
    };
  }
  function objectRepo(name){
    return {
      key:S.key?S.key(name):name,
      table:tableFor(name),
      get:function(){var v=cache[name];return v&&typeof v==='object'&&!Array.isArray(v)?v:{};},
      save:function(obj){cache[name]=obj&&typeof obj==='object'?clone(obj):{};saveObject(name,cache[name]);return true;},
      getAsync:function(){return loadObject(name);},
      saveAsync:function(obj){return saveObject(name,obj&&typeof obj==='object'?obj:{});},
      patch:function(partial){var cur=this.get();Object.assign(cur,partial||{});this.save(cur);return cur;}
    };
  }

  window.PETATOERepositories={
    version:'8.0.2-phase42.9D-supabase-only',
    Users:arrayRepo('users'),
    SalesRecords:arrayRepo('records'),
    AuditLogs:arrayRepo('auditLog'),
    TreasuryTransactions:arrayRepo('treasuryTransactions'),
    WarehouseItems:arrayRepo('warehouseItems'),
    WarehouseTransactions:arrayRepo('warehouseTransactions'),
    UserPermissions:objectRepo('userCrudPermissions'),
    RoleMatrix:objectRepo('roleMatrix'),
    Settings:objectRepo('settings'),
    MonthlyTargets:objectRepo('monthlyTargets'),
    Fleet:objectRepo('fleet'),
    Commissions:objectRepo('commissions'),
    CommissionSnapshots:objectRepo('commissionSnapshots'),
    _cache:cache,
    raw:function(){return S;},
    __ready:true
  };
})(window);
