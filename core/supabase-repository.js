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


  function isUuid(v){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v||'')); }

  function normalizePayrollEmployeeRow(row){
    row=row||{};
    var data=(row.data&&typeof row.data==='object')?clone(row.data):{};
    if((!data||Object.keys(data).length===0) && row.legacy_payload&&typeof row.legacy_payload==='object') data=clone(row.legacy_payload);
    data=data&&typeof data==='object'?data:{};
    data.supabase_id=row.id||data.supabase_id||'';
    data.id=data.id||data.employee_id||data.employeeId||data.app_id||String(row.id||'');
    data.code=data.code||row.employee_code||'';
    data.name=data.name||row.name||'';
    data.job=data.job||row.job_title||'';
    data.phone=data.phone||row.phone||'';
    data.status=data.status||row.status||'active';
    return data;
  }

  async function listPayrollEmployees(){
    if(!hasClient()) return [];
    var res=await client().from('payroll_employees').select('*').order('created_at',{ascending:true});
    if(res.error){ console.warn('PETATOESupabaseRepository payroll employees list failed', resultError(res)); return []; }
    return (Array.isArray(res.data)?res.data:[]).map(normalizePayrollEmployeeRow);
  }

  async function findPayrollEmployeeRowId(employee){
    if(!hasClient()) return '';
    var appId=typeof employee==='object'?String(employee.id||''):String(employee||'');
    var supabaseId=typeof employee==='object'?String(employee.supabase_id||''):'';
    var code=typeof employee==='object'?String(employee.code||employee.employee_code||''):'';
    if(isUuid(supabaseId)) return supabaseId;
    var res=await client().from('payroll_employees').select('id,employee_code,data,legacy_payload').limit(1000);
    if(res.error){ console.warn('PETATOESupabaseRepository payroll employee lookup failed', resultError(res)); return ''; }
    var rows=Array.isArray(res.data)?res.data:[];
    for(var i=0;i<rows.length;i++){
      var r=rows[i]||{};
      var d=(r.data&&typeof r.data==='object')?r.data:((r.legacy_payload&&typeof r.legacy_payload==='object')?r.legacy_payload:{});
      if(appId && d && String(d.id||d.employee_id||d.employeeId||'')===appId) return String(r.id||'');
    }
    if(code){
      var byCode=rows.find(function(r){return String((r||{}).employee_code||'')===code});
      if(byCode&&byCode.id) return String(byCode.id);
    }
    return '';
  }

  async function upsertPayrollEmployee(employee){
    if(!employee||typeof employee!=='object') return {ok:false,error:'Invalid payroll employee'};
    if(!hasClient()) return {ok:false,error:'Supabase client not ready'};
    var data=clone(employee);
    data.id=String(data.id||'').trim()||('emp-'+Date.now().toString(36));
    var rowId=await findPayrollEmployeeRowId(data);
    var payload={
      data:data,
      legacy_payload:data,
      employee_code:String(data.code||''),
      name:String(data.name||''),
      job_title:String(data.job||''),
      phone:String(data.phone||''),
      status:String(data.status||'active'),
      updated_at:new Date().toISOString()
    };
    var res;
    if(rowId){
      res=await client().from('payroll_employees').update(payload).eq('id',rowId).select().limit(1);
    }else{
      res=await client().from('payroll_employees').insert(payload).select().limit(1);
    }
    if(res.error){ console.warn('PETATOESupabaseRepository payroll employee upsert failed', resultError(res)); return {ok:false,error:resultError(res)}; }
    return {ok:true,data:res.data};
  }

  async function deletePayrollEmployee(employee){
    if(!hasClient()) return {ok:false,error:'Supabase client not ready'};
    var rowId=await findPayrollEmployeeRowId(employee);
    if(!rowId) return {ok:true, skipped:true};
    var res=await client().from('payroll_employees').delete().eq('id',rowId);
    if(res.error){ console.warn('PETATOESupabaseRepository payroll employee delete failed', resultError(res)); return {ok:false,error:resultError(res)}; }
    return {ok:true,data:res.data};
  }


  async function getSystemSetting(id, def){
    if(!id) return clone(def||{});
    if(!hasClient()) return clone(def||{});
    var c=client();
    try{
      var res=await c.from('system_settings').select('*').eq('id', String(id)).limit(1);
      if(res && !res.error){
        var row=Array.isArray(res.data)&&res.data.length?res.data[0]:null;
        if(row){
          if(row.data && typeof row.data==='object') return clone(row.data);
          if(row.value && typeof row.value==='object') return clone(row.value);
          if(typeof row.value==='string'){try{return JSON.parse(row.value)}catch(_e){}}
        }
        return clone(def||{});
      }
    }catch(_e){}
    try{
      var res2=await c.from('system_settings').select('*').eq('key', String(id)).limit(1);
      if(res2 && !res2.error){
        var row2=Array.isArray(res2.data)&&res2.data.length?res2.data[0]:null;
        if(row2){
          if(row2.data && typeof row2.data==='object') return clone(row2.data);
          if(row2.value && typeof row2.value==='object') return clone(row2.value);
          if(typeof row2.value==='string'){try{return JSON.parse(row2.value)}catch(_e){}}
        }
      }
    }catch(_e){}
    return clone(def||{});
  }

  async function saveSystemSetting(id, data){
    if(!id) return {ok:false,error:'Missing system setting id'};
    if(!hasClient()) return {ok:false,error:'Supabase client not ready'};
    var c=client();
    var payloadData=data&&typeof data==='object'?clone(data):{};
    try{
      var res=await c.from('system_settings').upsert({id:String(id),data:payloadData,updated_at:new Date().toISOString()},{onConflict:'id'});
      if(!res.error) return {ok:true,data:res.data};
      console.warn('PETATOESupabaseRepository saveSystemSetting id/data failed', resultError(res));
    }catch(e){console.warn('PETATOESupabaseRepository saveSystemSetting id/data crashed', e)}
    try{
      var res2=await c.from('system_settings').upsert({key:String(id),value:payloadData,updated_at:new Date().toISOString()},{onConflict:'key'});
      if(!res2.error) return {ok:true,data:res2.data};
      console.warn('PETATOESupabaseRepository saveSystemSetting key/value failed', resultError(res2));
      return {ok:false,error:resultError(res2)};
    }catch(e2){
      console.warn('PETATOESupabaseRepository saveSystemSetting key/value crashed', e2);
      return {ok:false,error:String(e2&&e2.message?e2.message:e2)};
    }
  }

  async function appendSystemList(id, entry, limit){
    limit=Number(limit)||300;
    var cur=await getSystemSetting(id,{items:[]});
    var items=Array.isArray(cur)?cur:(Array.isArray(cur.items)?cur.items:[]);
    items.push(entry&&typeof entry==='object'?clone(entry):{value:entry});
    items=items.slice(-limit);
    return saveSystemSetting(id,{items:items,updatedAt:new Date().toISOString()});
  }


  window.PETATOESupabaseRepository={
    version:'8.0.2',
    hasClient:hasClient,
    listJsonRows:listJsonRows,
    upsertJsonRow:upsertJsonRow,
    deleteById:deleteById,
    getSingleton:getSingleton,
    saveSingleton:saveSingleton,
    getSystemSetting:getSystemSetting,
    saveSystemSetting:saveSystemSetting,
    appendSystemList:appendSystemList,
    makeJsonTable:makeJsonTable,
    listPayrollEmployees:listPayrollEmployees,
    upsertPayrollEmployee:upsertPayrollEmployee,
    deletePayrollEmployee:deletePayrollEmployee,
    __ready:true
  };
  console.log('✅ PETATOE Shared Supabase Repository loaded');
})(window);
