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

  var __listReadPromises={};
  var __listReadCache={};
  function listReadKey(table,opts){opts=opts||{};return String(table||'')+'::'+JSON.stringify({columns:opts.columns||'*',order:opts.order||'',ascending:opts.ascending!==false});}
  function invalidateTableReadCaches(table){
    var prefix=String(table||'')+'::';
    Object.keys(__listReadCache).forEach(function(k){if(k.indexOf(prefix)===0)delete __listReadCache[k]});
  }

  async function listJsonRows(table, opts){
    opts=opts||{};
    if(!hasClient()) return [];
    var readKey=listReadKey(table,opts);
    var cached=__listReadCache[readKey];
    if(cached&&Date.now()-cached.at<2500)return clone(cached.value);
    if(__listReadPromises[readKey])return clone(await __listReadPromises[readKey]);
    __listReadPromises[readKey]=(async function(){
    var q=client().from(table).select(opts.columns||'*');
    if(opts.order) q=q.order(opts.order, { ascending: opts.ascending !== false });
    var res=await q;
    if(res.error){ console.warn('PETATOESupabaseRepository list failed', table, resultError(res)); return []; }
    var mapped=(Array.isArray(res.data)?res.data:[]).map(function(row){
      row=row||{};
      var data={};
      if(row.data && typeof row.data==='object') data=clone(row.data);
      else if(row.legacy_payload && typeof row.legacy_payload==='object') data=clone(row.legacy_payload);
      data=data&&typeof data==='object'?data:{};
      if(row.id != null && data.id == null) data.id=row.id;
      if(table==='payroll_slips'){
        data.employeeId=data.employeeId||data.employee_id||row.employee_id||'';
        data.period=data.period||row.period||'';
        data.status=data.status||row.status||'';
        data.paymentMethod=data.paymentMethod||data.payment_method||row.payment_method||'';
        data.netAmount=data.netAmount||data.net_amount||row.net_amount||0;
        data.updatedAt=data.updatedAt||row.updated_at||'';
      }
      return data;
    });
    __listReadCache[readKey]={at:Date.now(),value:clone(mapped)};
    return mapped;
    })();
    try{return clone(await __listReadPromises[readKey]);}finally{delete __listReadPromises[readKey];}
  }

  function missingColumn(err, col){
    var msg=String(err||'').toLowerCase();
    return msg.indexOf('could not find')>-1 && msg.indexOf(String(col||'').toLowerCase())>-1;
  }

  function missingColumnName(err){
    var msg=String(err||'');
    var m=msg.match(/Could not find the ['\"]([^'\"]+)['\"] column/i) || msg.match(/column ['\"]([^'\"]+)['\"]/i);
    return m && m[1] ? String(m[1]) : '';
  }

  function invalidUuidValue(err){
    var msg=String(err||'');
    var m=msg.match(/invalid input syntax for type uuid:\s*"([^"]+)"/i);
    return m && m[1] ? String(m[1]) : '';
  }


  function deterministicUuid(input){
    input=String(input||'');
    var h1=0x811c9dc5,h2=0x85ebca6b,h3=0xc2b2ae35,h4=0x27d4eb2f;
    for(var i=0;i<input.length;i++){
      var ch=input.charCodeAt(i);
      h1=Math.imul(h1^ch,0x01000193)>>>0;
      h2=Math.imul(h2^ch,0x85ebca6b)>>>0;
      h3=Math.imul(h3^ch,0xc2b2ae35)>>>0;
      h4=Math.imul(h4^ch,0x27d4eb2f)>>>0;
    }
    var hex=[h1,h2,h3,h4].map(function(n){return ('00000000'+(n>>>0).toString(16)).slice(-8)}).join('');
    hex=hex.slice(0,12)+'4'+hex.slice(13);
    hex=hex.slice(0,16)+(((parseInt(hex.charAt(16),16)||0)&3)|8).toString(16)+hex.slice(17);
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20,32);
  }

  function findPayloadKeyByValue(payload, value){
    if(!payload||!value) return '';
    var keys=Object.keys(payload);
    for(var i=0;i<keys.length;i++){
      var k=keys[i];
      if(payload[k] == null) continue;
      if(String(payload[k])===String(value)) return k;
    }
    return '';
  }

  async function normalizePayrollSlipPayload(payload, data){
    if(!payload||typeof payload!=='object') return payload;
    if(String(payload.employee_id||'') && !isUuid(payload.employee_id)){
      var resolved='';
      try{
        resolved=await findPayrollEmployeeRowId({id:String((data&&data.employeeId)||payload.employee_id||''), code:String((data&&data.employeeCode)||'')});
      }catch(_e){resolved='';}
      if(isUuid(resolved)) payload.employee_id=resolved;
      else delete payload.employee_id;
    }
    return payload;
  }

  async function upsertWithSchemaPrune(table, payload, protectedColumns){
    protectedColumns=protectedColumns||{};
    var p=clone(payload||{});
    var removed=[];
    for(var attempt=0;attempt<12;attempt++){
      var res=await client().from(table).upsert(p, { onConflict:'id' });
      if(!res.error) return { ok:true, data:res.data, removedColumns:removed };
      var err=resultError(res);
      var col=missingColumnName(err);
      if(col && Object.prototype.hasOwnProperty.call(p,col) && !protectedColumns[col]){
        delete p[col];
        removed.push(col);
        continue;
      }
      var badUuid=invalidUuidValue(err);
      var badKey=findPayloadKeyByValue(p,badUuid);
      if(badKey && !protectedColumns[badKey]){
        delete p[badKey];
        removed.push(badKey+':invalid_uuid');
        continue;
      }
      return { ok:false, error:err, removedColumns:removed };
    }
    return { ok:false, error:'Schema prune retry limit exceeded', removedColumns:removed };
  }

  function payrollSlipFlatPayload(rowId, data, extraPayload){
    var flat={ id:rowId };
    var extra=extraPayload&&typeof extraPayload==='object'?extraPayload:{};
    /* Phase 40: current Supabase payroll_slips schema is flat and does not expose
       JSON columns (data/legacy_payload) or UI-only columns (payment_method/updated_at).
       Send only the proven persistence columns first to avoid noisy failing fallback requests. */
    ['employee_id','period','status','net_amount'].forEach(function(k){
      if(extra[k]!==undefined && extra[k]!==null && String(extra[k])!=='') flat[k]=extra[k];
    });
    if(flat.period==null && data&&data.period!=null) flat.period=String(data.period||'');
    if(flat.status==null && data&&data.status!=null) flat.status=String(data.status||'');
    return flat;
  }

  async function upsertJsonRow(table, id, data, extra){
    invalidateTableReadCaches(table);
    if(!id) throw new Error('Supabase row id is required for '+table);
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    data=data&&typeof data==='object'?clone(data):{};
    var originalId=String(id);
    var rowId=String(id);
    if(table==='payroll_slips' && !isUuid(rowId)){
      rowId=deterministicUuid('payroll_slip:'+rowId);
      data.appSlipId=data.appSlipId||String(id);
    }
    if(isSingletonTable(table)){
      rowId=singletonRowId(table, originalId);
      data=normalizeSingletonPayload(table, rowId, originalId, data);
    }else{
      data.id=data.id||id;
    }
    var extraPayload=extra||{};

    if(table==='payroll_slips'){
      var slipPayload=payrollSlipFlatPayload(rowId, data, extraPayload);
      slipPayload=await normalizePayrollSlipPayload(slipPayload, data);
      var slipRes=await upsertWithSchemaPrune(table, slipPayload, { id:true });
      if(slipRes.ok) return Object.assign({ schemaFallback:'payroll_flat' }, slipRes);
      console.warn('PETATOESupabaseRepository upsert failed', table, slipRes.error);
      return { ok:false, error:slipRes.error };
    }

    var base={ id:rowId, updated_at:new Date().toISOString() };
    var payload=Object.assign({}, base, { data:data }, extraPayload);

    var primary=await upsertWithSchemaPrune(table, payload, { id:true, data:true });
    if(primary.ok) return Object.assign({ schemaFallback:'data' }, primary);

    var err=primary.error||'';
    if(missingColumn(err,'data')){
      var legacyPayload=Object.assign({}, base, { legacy_payload:data }, extraPayload);
      var legacy=await upsertWithSchemaPrune(table, legacyPayload, { id:true, legacy_payload:true });
      if(legacy.ok) return Object.assign({ schemaFallback:'legacy_payload' }, legacy);
      var legacyErr=legacy.error||'';
      if(missingColumn(legacyErr,'legacy_payload')){
        var flat=Object.assign({}, base, extraPayload);
        var flatRes=await upsertWithSchemaPrune(table, flat, { id:true });
        if(flatRes.ok) return Object.assign({ schemaFallback:'flat' }, flatRes);
        console.warn('PETATOESupabaseRepository upsert failed', table, flatRes.error);
        return { ok:false, error:flatRes.error };
      }
      console.warn('PETATOESupabaseRepository upsert failed', table, legacyErr);
      return { ok:false, error:legacyErr };
    }

    console.warn('PETATOESupabaseRepository upsert failed', table, err);
    return { ok:false, error:err };
  }

  async function deleteById(table, id){
    invalidateTableReadCaches(table);
    if(!id) return { ok:false, error:'Missing id' };
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    var rowId=String(id);
    if(table==='payroll_slips' && !isUuid(rowId)){
      rowId=deterministicUuid('payroll_slip:'+rowId);
    }
    var res=await client().from(table).delete().eq('id', rowId);
    if(res.error){ console.warn('PETATOESupabaseRepository delete failed', table, resultError(res)); return { ok:false, error:resultError(res) }; }
    return { ok:true, data:res.data };
  }

  function singletonValueFromRow(row, def){
    if(!row) return clone(def||{});
    var candidates=[row.data,row.legacy_payload,row.value,row.default,row.default_value];
    for(var i=0;i<candidates.length;i++){
      var v=candidates[i];
      if(v===undefined||v===null) continue;
      if(v&&typeof v==='object') return clone(v);
      if(typeof v==='string'){
        var t=v.trim();
        if(!t) continue;
        try{
          var parsed=JSON.parse(t);
          return (parsed&&typeof parsed==='object')?clone(parsed):parsed;
        }catch(_e){ return v; }
      }
      return v;
    }
    return clone(def||{});
  }

  var __singletonReadPromises={};
  var __singletonReadCache={};
  var __systemSettingReadPromises={};
  var __systemSettingReadCache={};
  function __cacheFresh(entry,ttl){return !!(entry&&Date.now()-entry.at<ttl);}
  function __cloneCached(entry,def){return entry?clone(entry.value):clone(def||{});}

  async function getSingleton(table, id, def){
    if(!hasClient()) return clone(def||{});
    var key=String(id||''), cacheKey=String(table||'')+'::'+key;
    if(__cacheFresh(__singletonReadCache[cacheKey],1500)) return __cloneCached(__singletonReadCache[cacheKey],def);
    if(__singletonReadPromises[cacheKey]) return clone(await __singletonReadPromises[cacheKey]);
    __singletonReadPromises[cacheKey]=(async function(){
      var rowId=singletonRowId(table, key);
      var res=await client().from(table).select('*').eq('id', rowId).limit(1);
      if(res.error){ console.warn('PETATOESupabaseRepository getSingleton failed', table, resultError(res)); return clone(def||{}); }
      var row=Array.isArray(res.data)&&res.data.length?res.data[0]:null;
      if(!row && isSingletonTable(table)){
        try{
          var fallback=await client().from(table).select('*').limit(1000);
          if(fallback && !fallback.error){
            var rows=Array.isArray(fallback.data)?fallback.data:[];
            row=rows.filter(function(r){return rowMatchesSingletonKey(r,key);})[0]||null;
          }
        }catch(_e){}
      }
      var value=singletonValueFromRow(row, def);
      __singletonReadCache[cacheKey]={at:Date.now(),value:clone(value)};
      return value;
    })();
    try{return clone(await __singletonReadPromises[cacheKey]);}finally{delete __singletonReadPromises[cacheKey];}
  }

  async function saveSingleton(table, id, data){
    invalidateTableReadCaches(table);
    var cacheKey=String(table||'')+'::'+String(id||'');
    delete __singletonReadCache[cacheKey];
    var result=await upsertJsonRow(table, id, data&&typeof data==='object'?data:{}, {});
    if(result&&result.ok)__singletonReadCache[cacheKey]={at:Date.now(),value:clone(data&&typeof data==='object'?data:{})};
    return result;
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

  function singletonRowId(table, id){
    var key=String(id||'');
    if(table==='operations_master_data' && !isUuid(key)){
      return deterministicUuid('singleton:'+String(table||'')+':'+key);
    }
    return key;
  }

  function isSingletonTable(table){
    return table==='operations_master_data';
  }

  function rowMatchesSingletonKey(row, key){
    row=row||{};
    key=String(key||'');
    if(!key) return false;
    var candidates=[row.singleton_key,row.data_key,row.key,row.module,row.name,row.code];
    var data=row.data&&typeof row.data==='object'?row.data:(row.legacy_payload&&typeof row.legacy_payload==='object'?row.legacy_payload:null);
    if(data){
      candidates.push(data.id,data.key,data.singletonKey,data.singleton_key,data.dataKey,data.module);
    }
    for(var i=0;i<candidates.length;i++){
      if(candidates[i]!=null && String(candidates[i])===key) return true;
    }
    return false;
  }

  function normalizeSingletonPayload(table, rowId, originalId, data){
    data=data&&typeof data==='object'?clone(data):{};
    if(isSingletonTable(table)){
      data.id=data.id||String(originalId||'');
      data.singletonKey=data.singletonKey||String(originalId||'');
      data.singleton_key=data.singleton_key||String(originalId||'');
      data.__rowId=rowId;
    }else{
      data.id=data.id||String(originalId||'');
    }
    return data;
  }

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
    if(rowId) payload.id=rowId;
    var res=await upsertWithSchemaPrune('payroll_employees', payload, rowId?{id:true,data:true}:{data:true});
    if(!res.ok){ console.warn('PETATOESupabaseRepository payroll employee upsert failed', res.error); return {ok:false,error:res.error,removedColumns:res.removedColumns||[]}; }
    return {ok:true,data:res.data,removedColumns:res.removedColumns||[]};
  }

  async function deletePayrollEmployee(employee){
    if(!hasClient()) return {ok:false,error:'Supabase client not ready'};
    var rowId=await findPayrollEmployeeRowId(employee);
    if(!rowId) return {ok:true, skipped:true};
    var res=await client().from('payroll_employees').delete().eq('id',rowId);
    if(res.error){ console.warn('PETATOESupabaseRepository payroll employee delete failed', resultError(res)); return {ok:false,error:resultError(res)}; }
    return {ok:true,data:res.data};
  }


  var systemSettingWritesBlocked=false;
  function isRlsOrUnauthorizedError(err){
    var msg=String(err||'').toLowerCase();
    return msg.indexOf('row-level security')>=0 || msg.indexOf('unauthorized')>=0 || msg.indexOf('401')>=0 || msg.indexOf('permission denied')>=0;
  }
  function remoteSystemSettingWritesEnabled(){
    return !systemSettingWritesBlocked;
  }

  async function getSystemSetting(id, def){
    if(!id) return clone(def||{});
    if(!hasClient()) return clone(def||{});
    var key=String(id);
    if(__cacheFresh(__systemSettingReadCache[key],1500)) return __cloneCached(__systemSettingReadCache[key],def);
    if(__systemSettingReadPromises[key]) return clone(await __systemSettingReadPromises[key]);
    __systemSettingReadPromises[key]=(async function(){
      var c=client(), value=clone(def||{});
      try{
        var res=await c.from('system_settings').select('key,data,value,updated_at').eq('key', key).limit(1);
        if(res && !res.error){
          var row=Array.isArray(res.data)&&res.data.length?res.data[0]:null;
          if(row){
            if(row.data && typeof row.data==='object') value=clone(row.data);
            else if(row.value && typeof row.value==='object') value=clone(row.value);
            else if(typeof row.value==='string'){try{value=JSON.parse(row.value)}catch(_e){}}
          }
        }else if(res && res.error){console.warn('PETATOESupabaseRepository getSystemSetting failed', resultError(res));}
      }catch(e){console.warn('PETATOESupabaseRepository getSystemSetting crashed', e)}
      __systemSettingReadCache[key]={at:Date.now(),value:clone(value)};
      return value;
    })();
    try{return clone(await __systemSettingReadPromises[key]);}finally{delete __systemSettingReadPromises[key];}
  }

  async function saveSystemSetting(id, data){
    if(!id) return {ok:false,error:'Missing system setting id'};
    delete __systemSettingReadCache[String(id)];
    var payloadData=data&&typeof data==='object'?clone(data):{};
    if(!hasClient()){
      return {ok:false,error:'Supabase client not ready'};
    }
    if(!remoteSystemSettingWritesEnabled()){
      return {ok:false,skipped:true,error:'system_settings writes blocked by RLS/permission policy'};
    }
    var c=client();
    try{
      var payload={key:String(id),data:payloadData,value:payloadData,updated_at:new Date().toISOString()};
      var res=await c.from('system_settings').upsert(payload,{onConflict:'key'});
      if(!res.error) return {ok:true,data:res.data};
      var err=resultError(res);
      if(isRlsOrUnauthorizedError(err)){
        systemSettingWritesBlocked=true;
        console.warn('PETATOESupabaseRepository saveSystemSetting blocked by Supabase RLS. Run system_settings_rls_fix.sql if system settings must be writable from the app.');
        return {ok:false,blocked:true,error:err};
      }
      console.warn('PETATOESupabaseRepository saveSystemSetting failed', err);
      return {ok:false,error:err};
    }catch(e){
      var msg=String(e&&e.message?e.message:e);
      if(isRlsOrUnauthorizedError(msg)){
        systemSettingWritesBlocked=true;
        console.warn('PETATOESupabaseRepository saveSystemSetting blocked by Supabase RLS. Run system_settings_rls_fix.sql if system settings must be writable from the app.');
        return {ok:false,blocked:true,error:msg};
      }
      console.warn('PETATOESupabaseRepository saveSystemSetting crashed', e);
      return {ok:false,error:msg};
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



  /* PETATOE Identity Store — Supabase-backed app users, permissions, roles and audit logs. */
  function defaultAppUser(){return {id:'u_admin',username:'Admin',fullName:'Admin',full_name:'Admin',job:'Super Admin',phone:'',email:'',role:'superadmin',role_code:'superadmin',status:'active',createdAt:new Date().toISOString()};}
  var identityRuntime=window.__PETATOE_IDENTITY_RUNTIME__||(window.__PETATOE_IDENTITY_RUNTIME__={
    cache:{users:[defaultAppUser()], permissions:{}, roles:null, audit:[], loaded:false, loading:null},
    lastAttemptAt:0,
    lastFailureAt:0,
    consecutiveFailures:0
  });
  var identityCache=identityRuntime.cache;
  var IDENTITY_RETRY_COOLDOWN_MS=15000;
  function normalizeAppUserRow(row){
    row=row||{};
    var d=(row.data&&typeof row.data==='object')?clone(row.data):{};
    if((!d||!Object.keys(d).length) && row.legacy_payload&&typeof row.legacy_payload==='object') d=clone(row.legacy_payload);
    d=d&&typeof d==='object'?d:{};
    var appId=String(d.id||d.app_id||d.legacy_id||row.username||row.id||'').trim();
    if(isUuid(appId) && d.username) appId=String(d.username);
    return {
      id:appId||('user_'+String(row.id||Date.now())),
      supabase_id:String(row.id||''),
      auth_user_id:String(row.auth_user_id||row.auth_uid||d.auth_user_id||d.auth_uid||''),
      auth_uid:String(row.auth_uid||row.auth_user_id||d.auth_uid||d.auth_user_id||''),
      username:String(row.username||d.username||appId||''),
      fullName:String(row.full_name||d.fullName||d.full_name||row.username||''),
      full_name:String(row.full_name||d.full_name||d.fullName||row.username||''),
      job:String(d.job||d.title||''),
      phone:String(row.phone||d.phone||''),
      email:String(row.email||d.email||''),
      role:String(row.role_code||d.role||d.role_code||'viewer'),
      role_code:String(row.role_code||d.role_code||d.role||'viewer'),
      status:String(row.status||d.status||'active'),
      createdAt:String(row.created_at||d.createdAt||''),
      lastLogin:String(d.lastLogin||''),
      passwordHash:d.passwordHash||d.password_hash||null,
      passwordUpdatedAt:String(d.passwordUpdatedAt||d.password_updated_at||''),
      passwordMigratedAt:String(d.passwordMigratedAt||''),
      passwordPolicy:String(d.passwordPolicy||''),
      mustChangePassword:!!d.mustChangePassword,
      bootstrapCredential:!!d.bootstrapCredential,
      bootstrapCredentialClearedAt:String(d.bootstrapCredentialClearedAt||''),
      passwordHashMeta:d.passwordHashMeta||null,
      passwordDigest:d.passwordDigest||'',
      passwordEncrypted:d.passwordEncrypted||''
    };
  }
  async function loadIdentityStore(options){
    options=options||{};
    if(identityCache.loading) return identityCache.loading;
    var nowMs=Date.now();
    if(!options.force && identityRuntime.lastFailureAt && (nowMs-identityRuntime.lastFailureAt)<IDENTITY_RETRY_COOLDOWN_MS){
      return identityCache;
    }
    identityRuntime.lastAttemptAt=nowMs;
    identityCache.loading=(async function(){
      if(!hasClient()){identityCache.loaded=true;return identityCache;}
      var c=client(), hadFailure=false;
      try{
        var ur=await c.from('app_users').select('*').order('created_at',{ascending:true});
        if(!ur.error){
          var list=(Array.isArray(ur.data)?ur.data:[]).map(normalizeAppUserRow).filter(function(u){return u&&u.username;});
          if(!list.length) list=[defaultAppUser()];
          identityCache.users=list;
        }else{hadFailure=true;console.warn('PETATOE Identity users load failed', resultError(ur));}
      }catch(e){hadFailure=true;console.warn('PETATOE Identity users load crashed', e)}
      try{
        var pr=await c.from('app_user_permissions').select('*');
        if(!pr.error){
          var map={};
          function emptyPermissionRecord(){return {screens:{},special:{}};}
          function permissionBoolean(value,defaultValue){
            if(value===true||value===1)return true;
            if(value===false||value===0)return false;
            var text=String(value==null?'':value).trim().toLowerCase();
            if(['true','1','yes','allow','allowed','on'].indexOf(text)>-1)return true;
            if(['false','0','no','deny','denied','off'].indexOf(text)>-1)return false;
            return defaultValue!==false;
          }
          function boolAllowed(row){
            if(row&&Object.prototype.hasOwnProperty.call(row,'allowed')) return permissionBoolean(row.allowed,true);
            if(row&&Object.prototype.hasOwnProperty.call(row,'enabled')) return permissionBoolean(row.enabled,true);
            if(row&&Object.prototype.hasOwnProperty.call(row,'granted')) return permissionBoolean(row.granted,true);
            return true;
          }
          function canonicalPermissionScreen(screen){
            var aliases={
              dashboard:'dashboardManagement',dashboardManagement:'dashboardManagement',dashboardOperationsPanel:'dashboardOperations',
              entry:'sales',import:'sales',records:'reports',logs:'audit',smart:'reports',executive:'reports',customer360:'customers',
              warehouses:'vehicles',warehouse:'vehicles',fleet:'vehicles',vans:'vehicles',
              appointmentsMaster:'appointments','appointments-master':'appointments',appointments:'appointments',
              vehicleOperations:'vehicleOperations',vehicleOperationsReports:'vehicleOperationsReports',operationKpis:'operationKpis',
              system:'settings',settings:'settings',setup:'setup',permissions:'permissions',users:'users',audit:'audit'
            };
            screen=String(screen||'').trim();
            return aliases[screen]||screen;
          }
          function canonicalPermissionAction(action){
            var aliases={read:'view',open:'view',list:'view',create:'add',insert:'add',update:'edit',write:'edit',remove:'delete',destroy:'delete'};
            action=String(action||'view').trim().toLowerCase();
            return aliases[action]||action;
          }
          function extractPermissionPayload(row){
            row=row&&typeof row==='object'?row:{};
            var source=(row.data&&typeof row.data==='object')?clone(row.data):((row.permissions&&typeof row.permissions==='object')?clone(row.permissions):((row.legacy_payload&&typeof row.legacy_payload==='object')?clone(row.legacy_payload):{}));
            if(source.permissions&&typeof source.permissions==='object'&&!source.screens&&!source.special&&!source.vehicleScope)source=clone(source.permissions);
            if(source.permission&&typeof source.permission==='object'&&!source.screens&&!source.special&&!source.vehicleScope)source=clone(source.permission);
            return source&&typeof source==='object'?source:{};
          }
          function mergePermissionRecord(target,source){
            target=target&&typeof target==='object'?target:emptyPermissionRecord();
            source=source&&typeof source==='object'?source:{};
            target.screens=target.screens&&typeof target.screens==='object'?target.screens:{};
            target.special=target.special&&typeof target.special==='object'?target.special:{};
            var screens=source.screens&&typeof source.screens==='object'?source.screens:{};
            Object.keys(screens).forEach(function(rawScreen){
              var screen=canonicalPermissionScreen(rawScreen), raw=screens[rawScreen];
              if(!screen)return;
              target.screens[screen]=target.screens[screen]||{};
              if(typeof raw==='boolean')target.screens[screen].view=raw;
              else if(raw&&typeof raw==='object')Object.keys(raw).forEach(function(rawAction){
                var action=canonicalPermissionAction(rawAction);
                if(['view','add','edit','delete'].indexOf(action)>-1)target.screens[screen][action]=permissionBoolean(raw[rawAction],false);
              });
            });
            Object.keys(source.special||{}).forEach(function(key){target.special[key]=permissionBoolean(source.special[key],false);});
            if(source.vehicleScope&&typeof source.vehicleScope==='object')target.vehicleScope=clone(source.vehicleScope);
            return target;
          }
          function applyGranularPermission(target,row,key,data){
            target=target||emptyPermissionRecord();
            data=data&&typeof data==='object'?data:{};
            var screen=String(row.screen||row.screen_key||row.module||data.screen||data.screen_key||data.module||'').trim();
            var action=canonicalPermissionAction(row.action||row.permission_action||data.action||data.permission_action||'');
            var special=String(row.special||row.special_key||data.special||data.special_key||'').trim();
            var normalized=String(key||'').trim().replace(/^screen[:.]/i,'').replace(/^permission[:.]/i,'');
            var parts=normalized.split(/[.:/]/).filter(Boolean);
            if(!screen && parts.length>1 && ['view','read','add','create','edit','update','delete','remove'].indexOf(String(parts[parts.length-1]).toLowerCase())>-1){
              action=canonicalPermissionAction(parts.pop());screen=parts.join('.');
            }
            if(!special && !screen && (/^special[:.]/i.test(String(key||''))||row.type==='special'||data.type==='special')){
              special=normalized.replace(/^special[:.]/i,'');
            }
            screen=canonicalPermissionScreen(screen);
            if(screen){
              action=action||'view';
              target.screens=target.screens||{};target.screens[screen]=target.screens[screen]||{};
              target.screens[screen][action]=boolAllowed(row);
              return target;
            }
            if(special){target.special=target.special||{};target.special[special]=boolAllowed(row);}
            return target;
          }
          function permissionRowAliases(row,data){
            var out=[],seen={};
            function add(value){value=String(value==null?'':value).trim();var key=value.toLowerCase();if(key&&!seen[key]){seen[key]=1;out.push(value);}}
            row=row&&typeof row==='object'?row:{}; data=data&&typeof data==='object'?data:{};
            [row.user_id,row.uid,row.app_user_id,row.auth_user_id,row.auth_uid,row.username,row.login,row.email,
             data.user_id,data.uid,data.app_user_id,data.auth_user_id,data.auth_uid,data.username,data.login,data.email].forEach(add);
            return out;
          }
          (Array.isArray(pr.data)?pr.data:[]).forEach(function(r){
            if(!r) return;
            var rawData=extractPermissionPayload(r);
            var aliases=permissionRowAliases(r,rawData);
            if(!aliases.length) return;
            var key=String(r.permission_key||r.key||'full').trim();
            var data=rawData;
            var target=emptyPermissionRecord();
            aliases.forEach(function(alias){if(map[alias])target=mergePermissionRecord(target,map[alias]);});
            if(key==='full'||data.screens||data.special||data.vehicleScope) target=mergePermissionRecord(target,data);
            else target=applyGranularPermission(target,r,key,data);
            aliases.forEach(function(alias){map[alias]=clone(target);});
          });
          /* Permission rows have existed under app ids, Supabase row UUIDs and usernames
             across older releases. Alias every loaded record to the canonical user identity so
             the current session and the navigation permission engine resolve the same payload. */
          (identityCache.users||[]).forEach(function(user){
            var aliases=[user.id,user.userId,user.uid,user.supabase_id,user.row_id,user.auth_user_id,user.auth_uid,user.username,user.login,user.email].map(function(v){return String(v||'').trim();}).filter(Boolean);
            var merged=null;
            aliases.forEach(function(alias){
              Object.keys(map).some(function(key){
                if(String(key).trim().toLowerCase()!==alias.toLowerCase())return false;
                merged=mergePermissionRecord(merged||emptyPermissionRecord(),map[key]);return true;
              });
            });
            if(!merged)return;
            aliases.forEach(function(alias){map[alias]=clone(merged);});
          });
          identityCache.permissions=map;
          identityCache.permissionsLoaded=true;
          identityCache.permissionLoadError='';
        }else{hadFailure=true;identityCache.permissionsLoaded=false;identityCache.permissionLoadError=resultError(pr);console.warn('PETATOE Identity permissions load failed', resultError(pr));}
      }catch(e){hadFailure=true;identityCache.permissionsLoaded=false;identityCache.permissionLoadError=String(e&&e.message||e||'');console.warn('PETATOE Identity permissions load crashed', e)}
      try{
        var rr=await c.from('roles').select('*').order('level',{ascending:true});
        if(!rr.error){
          var roles={};
          (Array.isArray(rr.data)?rr.data:[]).forEach(function(r){ if(r&&r.code) roles[String(r.code)]=String(r.name_en||r.name_ar||r.code); });
          identityCache.roles=Object.keys(roles).length?roles:null;
        }else{hadFailure=true;console.warn('PETATOE Identity roles load failed', resultError(rr));}
      }catch(e){hadFailure=true;console.warn('PETATOE Identity roles load crashed', e)}
      identityCache.loaded=true;
      if(hadFailure){identityRuntime.lastFailureAt=Date.now();identityRuntime.consecutiveFailures+=1;}else{identityRuntime.lastFailureAt=0;identityRuntime.consecutiveFailures=0;}
      try{window.dispatchEvent(new CustomEvent('petatoe:identity-ready',{detail:{users:identityCache.users.length}}));}catch(_e){}
      return identityCache;
    })();
    var activeLoad=identityCache.loading;
    try{return await activeLoad;}finally{if(identityCache.loading===activeLoad)identityCache.loading=null;}
  }
  function appUsersSync(){ if(!identityCache.loaded) loadIdentityStore(); return clone(identityCache.users||[defaultAppUser()]); }
  async function findAppUserRowId(u){
    if(!hasClient()) return '';
    u=u||{};
    if(isUuid(u.supabase_id)) return u.supabase_id;
    var appId=String(u.id||'').trim(), username=String(u.username||'').trim();
    var res=await client().from('app_users').select('id,username,legacy_payload').limit(1000);
    if(res.error) return '';
    var rows=Array.isArray(res.data)?res.data:[];
    for(var i=0;i<rows.length;i++){
      var r=rows[i]||{}, d=(r.legacy_payload&&typeof r.legacy_payload==='object')?r.legacy_payload:{};
      if(appId && String(d.id||d.app_id||'')===appId) return String(r.id||'');
      if(username && String(r.username||'').toLowerCase()===username.toLowerCase()) return String(r.id||'');
    }
    return '';
  }
  async function upsertAppUser(u){
    if(!u||typeof u!=='object') return {ok:false,error:'Invalid app user'};
    if(!hasClient()) return {ok:false,error:'Supabase client not ready'};
    var data=clone(u); data.id=String(data.id||data.username||('u_'+Date.now())).trim();
    data.role=data.role||data.role_code||'viewer'; data.role_code=data.role_code||data.role;
    data.fullName=data.fullName||data.full_name||data.username||''; data.full_name=data.full_name||data.fullName;
    var rowId=await findAppUserRowId(data);
    var payload={
      username:String(data.username||''),
      full_name:String(data.fullName||data.full_name||data.username||''),
      email:String(data.email||''),
      phone:String(data.phone||''),
      role_code:String(data.role||data.role_code||'viewer'),
      status:String(data.status||'active'),
      legacy_payload:data,
      updated_at:new Date().toISOString()
    };
    var res=rowId?await client().from('app_users').update(payload).eq('id',rowId).select().limit(1):await client().from('app_users').insert(payload).select().limit(1);
    if(res.error){console.warn('PETATOE Identity app user upsert failed', resultError(res)); return {ok:false,error:resultError(res)};}
    await loadIdentityStore(); identityCache.loading=null; await loadIdentityStore();
    return {ok:true,data:res.data};
  }
  async function saveAppUsers(list){
    list=Array.isArray(list)?list:[];
    identityCache.users=clone(list.length?list:[defaultAppUser()]);
    for(var i=0;i<identityCache.users.length;i++) await upsertAppUser(identityCache.users[i]);
    return {ok:true};
  }
  async function deleteAppUser(u){
    if(!hasClient()) return {ok:false,error:'Supabase client not ready'};
    var rowId=await findAppUserRowId(typeof u==='object'?u:{id:u});
    if(!rowId) return {ok:true,skipped:true};
    var res=await client().from('app_users').delete().eq('id',rowId);
    if(res.error){console.warn('PETATOE Identity app user delete failed', resultError(res)); return {ok:false,error:resultError(res)};}
    identityCache.users=(identityCache.users||[]).filter(function(x){return String(x.id)!==String(typeof u==='object'?u.id:u)});
    return {ok:true};
  }
  function appPermissionsSync(){ if(!identityCache.loaded) loadIdentityStore(); return clone(identityCache.permissions||{}); }
  async function saveAppUserPermission(uid, perm){
    if(!uid) return {ok:false,error:'Missing user id'};
    identityCache.permissions[String(uid)]=clone(perm||{});
    if(!hasClient()) return {ok:false,error:'Supabase client not ready'};
    var id='perm_'+String(uid).replace(/[^a-zA-Z0-9_-]/g,'_')+'_full';
    var payload={id:id,user_id:String(uid),permission_key:'full',allowed:true,data:clone(perm||{}),updated_at:new Date().toISOString()};
    var res=await client().from('app_user_permissions').upsert(payload,{onConflict:'id'});
    if(res.error){console.warn('PETATOE Identity permission upsert failed', resultError(res)); return {ok:false,error:resultError(res)};}
    return {ok:true};
  }
  async function saveAppPermissions(map){
    map=map&&typeof map==='object'?map:{};
    identityCache.permissions=clone(map);
    var keys=Object.keys(map);
    for(var i=0;i<keys.length;i++) await saveAppUserPermission(keys[i], map[keys[i]]);
    return {ok:true};
  }
  function normalizePermissionKeys(keys){
    var out=[],seen={};
    (Array.isArray(keys)?keys:[keys]).forEach(function(v){
      v=String(v==null?'':v).trim();var k=v.toLowerCase();
      if(k&&!seen[k]){seen[k]=1;out.push(v)}
    });
    return out;
  }
  function deletePermissionKeysFromCache(keys){
    var wanted=normalizePermissionKeys(keys).map(function(x){return x.toLowerCase()});
    Object.keys(identityCache.permissions||{}).forEach(function(k){if(wanted.indexOf(String(k).trim().toLowerCase())>-1)delete identityCache.permissions[k]});
  }
  async function deleteAppUserPermissionAliases(keys){
    keys=normalizePermissionKeys(keys);
    if(!keys.length)return {ok:false,error:'Missing permission keys'};
    deletePermissionKeysFromCache(keys);
    if(!hasClient())return {ok:false,error:'Supabase client not ready'};
    /* The project REST client exposes bounded eq() filters, not supabase-js in().
       Delete aliases one by one so canonical permission persistence cannot fail after a successful save. */
    for(var i=0;i<keys.length;i++){
      var res=await client().from('app_user_permissions').delete().eq('user_id',keys[i]);
      if(res.error){console.warn('PETATOE Identity permission alias delete failed',keys[i],resultError(res));return {ok:false,error:resultError(res),failedKey:keys[i]};}
    }
    return {ok:true,deletedKeys:keys};
  }
  async function replaceAppUserPermission(canonicalKey,aliases,perm){
    canonicalKey=String(canonicalKey||'').trim();
    if(!canonicalKey)return {ok:false,error:'Missing canonical permission key'};
    var saved=await saveAppUserPermission(canonicalKey,perm);
    if(saved&&saved.ok===false)return saved;
    var stale=normalizePermissionKeys(aliases).filter(function(k){return k.toLowerCase()!==canonicalKey.toLowerCase()});
    if(!stale.length)return saved||{ok:true};
    var cleaned=await deleteAppUserPermissionAliases(stale);
    if(cleaned&&cleaned.ok===false)return cleaned;
    return {ok:true,canonicalKey:canonicalKey,removedAliases:stale};
  }
  async function deleteAppUserPermission(uid){
    return deleteAppUserPermissionAliases([uid]);
  }
  async function updateAppUserCredential(u){
    if(!u||typeof u!=='object') return {ok:false,error:'Invalid app user'};
    if(!hasClient()) return {ok:false,error:'Supabase client not ready'};
    var rowId=await findAppUserRowId(u);
    if(!rowId) return {ok:false,error:'App user row not found'};
    var existing=(identityCache.users||[]).find(function(x){return String(x.id)===String(u.id)||String(x.username||'').toLowerCase()===String(u.username||'').toLowerCase();})||{};
    var data=clone(existing);
    Object.keys(u).forEach(function(k){data[k]=clone(u[k]);});
    data.id=String(data.id||data.username||'').trim();
    data.username=String(data.username||'').trim();
    data.role=data.role||data.role_code||'viewer';
    data.role_code=data.role_code||data.role;
    data.fullName=data.fullName||data.full_name||data.username||'';
    data.full_name=data.full_name||data.fullName;
    data.passwordUpdatedAt=data.passwordUpdatedAt||new Date().toISOString();
    var payload={
      username:String(data.username||''),
      full_name:String(data.fullName||data.full_name||data.username||''),
      email:String(data.email||''),
      phone:String(data.phone||''),
      role_code:String(data.role||data.role_code||'viewer'),
      status:String(data.status||'active'),
      legacy_payload:data,
      updated_at:new Date().toISOString()
    };
    var res=await client().from('app_users').update(payload).eq('id',rowId).select().limit(1);
    if(res.error){console.warn('PETATOE Identity credential update failed', resultError(res)); return {ok:false,error:resultError(res)};}
    identityCache.users=(identityCache.users||[]).map(function(x){return (String(x.id)===String(data.id)||String(x.username||'').toLowerCase()===String(data.username||'').toLowerCase())?clone(data):x;});
    identityCache.loading=null;
    await loadIdentityStore();
    return {ok:true,data:res.data};
  }
  async function appendAuditLog(entry){
    entry=entry&&typeof entry==='object'?clone(entry):{details:String(entry||'')};
    identityCache.audit.unshift(entry);
    if(!hasClient()) return {ok:true,localOnly:true};
    var payload={action:String(entry.action||'Audit'),details:String(entry.details||''),level:String(entry.level||'info'),payload:entry,created_at:entry.time||new Date().toISOString()};
    try{
      var res=await client().from('audit_logs').insert(payload);
      if(res.error){console.warn('PETATOE Identity audit insert skipped', resultError(res)); return {ok:true,skipped:true,error:resultError(res)};}
      return {ok:true};
    }catch(e){ console.warn('PETATOE Identity audit insert crashed/skipped', e); return {ok:true,skipped:true,error:String(e&&e.message||e||'')}; }
  }
  window.PETATOEIdentityStore={
    load:loadIdentityStore,
    usersSync:appUsersSync,
    saveUsers:saveAppUsers,
    upsertUser:upsertAppUser,
    deleteUser:deleteAppUser,
    permissionsSync:appPermissionsSync,
    savePermission:saveAppUserPermission,
    replacePermission:replaceAppUserPermission,
    savePermissions:saveAppPermissions,
    deletePermission:deleteAppUserPermission,
    deletePermissionAliases:deleteAppUserPermissionAliases,
    appendAudit:appendAuditLog,
    updateUserCredential:updateAppUserCredential,
    _cache:identityCache,
    _runtime:identityRuntime,
    __ready:true
  };
  setTimeout(loadIdentityStore,0);


  window.PETATOESupabaseRepository={
    version:'8.0.3-console-fix',
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
