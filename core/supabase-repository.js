/* PETATOE v8.0.2 — Shared Supabase Repository
   Generic async helpers for module-specific Supabase storage.
   No LocalStorage migration is performed here. */
(function(window){
  'use strict';
  if(window.PETATOESupabaseRepository && window.PETATOESupabaseRepository.__ready) return;

  function client(){ return window.supabase || window.PETATOE_SUPABASE_CLIENT || null; }
  function hasClient(){ var c=client(); return !!(c && typeof c.from==='function'); }
  function resultError(res){ return res && res.error ? (res.error.message || JSON.stringify(res.error)) : ''; }
  function clone(obj){ try{return JSON.parse(JSON.stringify(obj));}catch(_e){return obj;} }

  async function listJsonRows(table, opts){
    opts=opts||{};
    if(!hasClient()) return [];
    var q=client().from(table).select(opts.columns||'*');
    if(opts.order) q=q.order(opts.order, { ascending: opts.ascending !== false });
    var res=await q;
    if(res.error){ console.warn('PETATOESupabaseRepository list failed', table, resultError(res)); return []; }
    return (Array.isArray(res.data)?res.data:[]).map(function(row){
      var data=row && row.data && typeof row.data==='object' ? clone(row.data) : {};
      if(row && row.id != null && data.id == null) data.id=row.id;
      return data;
    });
  }

  async function upsertJsonRow(table, id, data, extra){
    if(!id) throw new Error('Supabase row id is required for '+table);
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    data=data&&typeof data==='object'?clone(data):{};
    data.id=data.id||id;
    var payload=Object.assign({ id:String(id), data:data, updated_at:new Date().toISOString() }, extra||{});
    var res=await client().from(table).upsert(payload, { onConflict:'id' });
    if(res.error){ console.warn('PETATOESupabaseRepository upsert failed', table, resultError(res)); return { ok:false, error:resultError(res) }; }
    return { ok:true, data:res.data };
  }

  async function deleteById(table, id){
    if(!id) return { ok:false, error:'Missing id' };
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    var res=await client().from(table).delete().eq('id', String(id));
    if(res.error){ console.warn('PETATOESupabaseRepository delete failed', table, resultError(res)); return { ok:false, error:resultError(res) }; }
    return { ok:true, data:res.data };
  }

  async function getSingleton(table, id, def){
    if(!hasClient()) return clone(def||{});
    var res=await client().from(table).select('*').eq('id', String(id)).limit(1);
    if(res.error){ console.warn('PETATOESupabaseRepository getSingleton failed', table, resultError(res)); return clone(def||{}); }
    var row=Array.isArray(res.data)&&res.data.length?res.data[0]:null;
    return row && row.data && typeof row.data==='object' ? clone(row.data) : clone(def||{});
  }

  async function saveSingleton(table, id, data){
    return upsertJsonRow(table, id, data&&typeof data==='object'?data:{}, {});
  }

  function makeJsonTable(table, opts){
    opts=opts||{};
    return {
      table:table,
      list:function(){return listJsonRows(table, opts);},
      upsert:function(id, data, extra){return upsertJsonRow(table, id, data, extra);},
      remove:function(id){return deleteById(table, id);}
    };
  }

  window.PETATOESupabaseRepository={
    version:'8.0.2',
    hasClient:hasClient,
    listJsonRows:listJsonRows,
    upsertJsonRow:upsertJsonRow,
    deleteById:deleteById,
    getSingleton:getSingleton,
    saveSingleton:saveSingleton,
    makeJsonTable:makeJsonTable,
    __ready:true
  };
  console.log('✅ PETATOE Shared Supabase Repository loaded');
})(window);
