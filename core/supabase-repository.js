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
  }

  function missingColumn(err, col){
    var msg=String(err||'').toLowerCase();
    return msg.indexOf('could not find')>-1 && msg.indexOf(String(col||'').toLowerCase())>-1;
  }

  async function upsertJsonRow(table, id, data, extra){
    if(!id) throw new Error('Supabase row id is required for '+table);
    if(!hasClient()) return { ok:false, error:'Supabase client not ready' };
    data=data&&typeof data==='object'?clone(data):{};
    data.id=data.id||id;
    var base={ id:String(id), updated_at:new Date().toISOString() };
    var extraPayload=extra||{};
    var payload=Object.assign({}, base, { data:data }, extraPayload);
    var res=await client().from(table).upsert(payload, { onConflict:'id' });
    if(!res.error) return { ok:true, data:res.data };

    var err=resultError(res);
    if(missingColumn(err,'data')){
      var legacyPayload=Object.assign({}, base, { legacy_payload:data }, extraPayload);
      var legacyRes=await client().from(table).upsert(legacyPayload, { onConflict:'id' });
      if(!legacyRes.error) return { ok:true, data:legacyRes.data, schemaFallback:'legacy_payload' };
      var legacyErr=resultError(legacyRes);
      if(table==='payroll_slips' && missingColumn(legacyErr,'legacy_payload')){
        var flat=Object.assign({}, base, extraPayload);
        var flatRes=await client().from(table).upsert(flat, { onConflict:'id' });
        if(!flatRes.error) return { ok:true, data:flatRes.data, schemaFallback:'flat' };
        console.warn('PETATOESupabaseRepository upsert failed', table, resultError(flatRes));
        return { ok:false, error:resultError(flatRes) };
      }
      console.warn('PETATOESupabaseRepository upsert failed', table, legacyErr);
      return { ok:false, error:legacyErr };
    }

    console.warn('PETATOESupabaseRepository upsert failed', table, err);
    return { ok:false, error:err };
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
      // System settings are stored as a key/data JSONB row.
      // Do not query legacy id-based columns because older Supabase schemas may have uuid id columns or no id column at all.
      var res=await c.from('system_settings').select('key,data,value,updated_at').eq('key', String(id)).limit(1);
      if(res && !res.error){
        var row=Array.isArray(res.data)&&res.data.length?res.data[0]:null;
        if(row){
          if(row.data && typeof row.data==='object') return clone(row.data);
          if(row.value && typeof row.value==='object') return clone(row.value);
          if(typeof row.value==='string'){try{return JSON.parse(row.value)}catch(_e){}}
        }
      }else if(res && res.error){
        console.warn('PETATOESupabaseRepository getSystemSetting failed', resultError(res));
      }
    }catch(e){console.warn('PETATOESupabaseRepository getSystemSetting crashed', e)}
    return clone(def||{});
  }

  async function saveSystemSetting(id, data){
    if(!id) return {ok:false,error:'Missing system setting id'};
    if(!hasClient()) return {ok:false,error:'Supabase client not ready'};
    var c=client();
    var payloadData=data&&typeof data==='object'?clone(data):{};
    try{
      var payload={key:String(id),data:payloadData,value:payloadData,updated_at:new Date().toISOString()};
      var res=await c.from('system_settings').upsert(payload,{onConflict:'key'});
      if(!res.error) return {ok:true,data:res.data};
      console.warn('PETATOESupabaseRepository saveSystemSetting failed', resultError(res));
      return {ok:false,error:resultError(res)};
    }catch(e){
      console.warn('PETATOESupabaseRepository saveSystemSetting crashed', e);
      return {ok:false,error:String(e&&e.message?e.message:e)};
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
  var identityCache={users:[defaultAppUser()], permissions:{}, roles:null, audit:[], loaded:false, loading:null};
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
      auth_user_id:String(row.auth_user_id||d.auth_user_id||''),
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
  async function loadIdentityStore(){
    if(identityCache.loading) return identityCache.loading;
    identityCache.loading=(async function(){
      if(!hasClient()){identityCache.loaded=true;return identityCache;}
      var c=client();
      try{
        var ur=await c.from('app_users').select('*').order('created_at',{ascending:true});
        if(!ur.error){
          var list=(Array.isArray(ur.data)?ur.data:[]).map(normalizeAppUserRow).filter(function(u){return u&&u.username;});
          if(!list.length) list=[defaultAppUser()];
          identityCache.users=list;
        }else console.warn('PETATOE Identity users load failed', resultError(ur));
      }catch(e){console.warn('PETATOE Identity users load crashed', e)}
      try{
        var pr=await c.from('app_user_permissions').select('*');
        if(!pr.error){
          var map={};
          (Array.isArray(pr.data)?pr.data:[]).forEach(function(r){
            if(!r) return;
            var uid=String(r.user_id||'');
            if(!uid) return;
            var key=String(r.permission_key||'full');
            var data=(r.data&&typeof r.data==='object')?clone(r.data):{};
            if(key==='full'||data.screens||data.special||data.vehicleScope) map[uid]=data;
          });
          identityCache.permissions=map;
        }else console.warn('PETATOE Identity permissions load failed', resultError(pr));
      }catch(e){console.warn('PETATOE Identity permissions load crashed', e)}
      try{
        var rr=await c.from('roles').select('*').order('level',{ascending:true});
        if(!rr.error){
          var roles={};
          (Array.isArray(rr.data)?rr.data:[]).forEach(function(r){ if(r&&r.code) roles[String(r.code)]=String(r.name_en||r.name_ar||r.code); });
          identityCache.roles=Object.keys(roles).length?roles:null;
        }
      }catch(e){console.warn('PETATOE Identity roles load crashed', e)}
      identityCache.loaded=true;
      try{window.dispatchEvent(new CustomEvent('petatoe:identity-ready',{detail:{users:identityCache.users.length}}));}catch(_e){}
      return identityCache;
    })();
    return identityCache.loading;
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
  async function deleteAppUserPermission(uid){
    if(!uid) return {ok:false,error:'Missing user id'};
    delete identityCache.permissions[String(uid)];
    if(!hasClient()) return {ok:false,error:'Supabase client not ready'};
    var res=await client().from('app_user_permissions').delete().eq('user_id',String(uid));
    if(res.error){console.warn('PETATOE Identity permission delete failed', resultError(res)); return {ok:false,error:resultError(res)};}
    return {ok:true};
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
    savePermissions:saveAppPermissions,
    deletePermission:deleteAppUserPermission,
    appendAudit:appendAuditLog,
    updateUserCredential:updateAppUserCredential,
    _cache:identityCache,
    __ready:true
  };
  setTimeout(loadIdentityStore,0);


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
