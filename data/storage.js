/* PETATOE v3.9.4 — API Ready Architecture
   Central client-side storage adapter.
   Current driver: Supabase-only for business data; browser storage is allowed only for UI/session preferences.
   Future driver: PHP API + MySQL/SQL Server without changing UI screens.
   v3.9.2: Added payroll module keys to KEY_MAP
   v3.9.3: Moved load position to line 15 (immediately after data-source.js) — before all modules that depend on it. (employees, slips, jobTypes, employeeConfig, commissionSnapshots).
   v3.9.4: Storage closure: load before data-source.js so DataSource can use PETATOEStorage instead of direct browser storage. */
(function(window){
  'use strict';

  // PETATOE v6.1.70 Phase 4-A: keep the storage adapter a singleton.
  // This prevents accidental re-initialization if the bootstrap scripts are injected twice.
  if(window.PETATOEStorage && window.PETATOEStorage.__ready){ return; }

  var VERSION='3.9.4-phase42.9E';
  var DEFAULT_DRIVER='supabase';
  // PETATOE v6.1.81 Phase 5-E: conservative raw snapshot limits.
  // These limits protect Restore from accidental oversized/unbounded localStorage writes
  // while keeping large PETATOE sales backup values valid.
  var MAX_RAW_SNAPSHOT_KEYS=1000;
  var MAX_RAW_VALUE_LENGTH=25*1024*1024;
  var Api=function(){return window.PETATOEApiClient||null;};

  var KEY_MAP={
    records:{key:'PETATOE_'+'FALLBACK',table:'sales_records',type:'array'},
    monthlyTargets:{key:'petatoe_monthly_sales_targets_v1',table:'sales_monthly_targets',type:'object'},
    manualInvoiceNext:{key:'petatoe_manual_invoice_next',table:'system_sequences',type:'number'},
    theme:{key:'petatoe_theme',table:'user_preferences',type:'string'},
    petImage:{key:'petatoe_pet_image',table:'company_assets',type:'string'},
    users:{key:'petatoe_users_v139',table:'users',type:'array'},
    currentUser:{key:'petatoe_current_user',table:'sessions',type:'string'},
    roleMatrix:{key:'petatoe_role_matrix_v139',table:'role_permissions',type:'object'},
    userCrudPermissions:{key:'petatoe_user_crud_permissions_v139',table:'user_permissions',type:'object'},
    settings:{key:'pet_settings_v110',table:'settings',type:'object'},
    auditLog:{key:'petatoe_audit_log_v1',table:'audit_logs',type:'array'},
    fleet:{key:'PETATOE_FLEET_MANAGEMENT_V1',table:'vehicles',type:'object'},
    commissions:{key:'PETATOE_v3_5_COMMISSION_SYSTEM',table:'commission_rules',type:'object'},
    commissionSnapshots:{key:'PETATOE_v3_5_COMMISSION_MONTHLY_SNAPSHOTS',table:'commission_snapshots',type:'object'},
    treasuryTransactions:{key:'PETATOE_TREASURY_TRANSACTIONS_V1',table:'treasury_transactions',type:'array'},
    warehouseItems:{key:'PETATOE_WAREHOUSE_ITEMS_V1',table:'warehouse_items',type:'array'},
    warehouseTransactions:{key:'PETATOE_WAREHOUSE_TRANSACTIONS_V1',table:'warehouse_transactions',type:'array'},
    treasuryAudit:{key:'PETATOE_TREASURY_AUDIT_V1',table:'treasury_audit_logs',type:'array'},
    treasuryCategories:{key:'PETATOE_TREASURY_EXPENSE_CATEGORIES_V1',table:'treasury_categories',type:'array'},
    movementCenter:{key:'petatoe_manual_movement_center_v383',table:'movement_center',type:'array'},
    manualCustomers:{key:'petatoe_manual_customers_v37',table:'manual_customers',type:'array'},
    manualItems:{key:'petatoe_manual_items_v37',table:'manual_items',type:'array'},
    warehouseLowLimit:{key:'PETATOE_WAREHOUSE_LOW_STOCK_LIMIT_V1',table:'warehouse_settings',type:'number'},
    settingsMain:{key:'pet_settings_v110_main',table:'ui_state',type:'string'},
    settingsSub:{key:'pet_settings_v110_sub',table:'ui_state',type:'string'},
    payrollEmployees:{key:'PETATOE_PAYROLL_EMPLOYEES_V1',table:'payroll_employees',type:'array'},
    payrollSlips:{key:'PETATOE_PAYROLL_SLIPS_V1',table:'payroll_slips',type:'array'},
    payrollJobTypes:{key:'PETATOE_PAYROLL_JOB_TYPES_V1',table:'payroll_job_types',type:'array'},
    payrollEmployeeConfig:{key:'PETATOE_PAYROLL_EMPLOYEE_CONFIG_V1',table:'payroll_employee_config',type:'object'},
    payrollCommissionSnapshots:{key:'PETATOE_v3_5_COMMISSION_MONTHLY_SNAPSHOTS',table:'payroll_commission_snapshots',type:'object'},
    childrenExpenses:{key:'PETATOE_CHILDREN_EXPENSES_V1',table:'children_expenses',type:'array'},
    childrenExpenseBudgets:{key:'PETATOE_CHILDREN_EXPENSE_BUDGETS_V1',table:'children_expense_budgets',type:'array'},
    appointments:{key:'petatoe_appointments_v1',table:'appointments',type:'array'},
    appointmentsMasterData:{key:'petatoe_appointments_master_data_v1',table:'appointments_master_data',type:'object'}
  };


  // Phase 42.9D: business data must not silently fall back to browser storage.
  // Only device/UI/session preferences may remain local.
  var LOCAL_ONLY_NAMES={
    theme:true,
    currentUser:true,
    settingsMain:true,
    settingsSub:true
  };
  function isLocalOnlyName(nameOrKey){
    if(LOCAL_ONLY_NAMES[nameOrKey]) return true;
    var key=resolveKey(nameOrKey);
    return key==='petatoe_theme' || key==='petatoe_current_user' || /^petatoe_ui_/i.test(key) || /^PETATOE_UI_/i.test(key) || /^PETATOE_SESSION_/i.test(key);
  }
  function blockBusinessLocalAccess(action,nameOrKey,fallback){
    if(typeof console!=='undefined' && console.warn){
      console.warn('PETATOEStorage '+action+' blocked for business key; use Supabase repository instead:', nameOrKey);
    }
    return fallback;
  }
  function supabaseRepo(){return window.PETATOESupabaseRepository||null;}
  function isObjectValue(v){return v&&typeof v==='object'&&!Array.isArray(v);}
  function cloneValue(v){try{return JSON.parse(JSON.stringify(v));}catch(_e){return v;}}
  function rowIdFor(value, idx){
    return String((value&&value.id)||(value&&value.code)||(value&&value.key)||(value&&value.invoiceNo)||(value&&value.invoice_no)||(value&&value.reference)||('row_'+idx));
  }
  function localSnapshotKeys(scope){
    var keys=[];
    try{
      var st=nativeStorage(scope);
      for(var i=0;i<st.length;i++){
        var k=st.key(i);
        if(isLocalOnlyName(k)) keys.push(k);
      }
    }catch(e){console.warn('PETATOEStorage.localSnapshotKeys failed', e);}
    return keys;
  }

  function nativeStorage(scope){return scope==='session'?window.sessionStorage:window.localStorage;}
  function resolveKey(nameOrKey){
    if(KEY_MAP[nameOrKey])return KEY_MAP[nameOrKey].key;
    return String(nameOrKey||'');
  }
  function safeParse(raw, fallback){
    if(raw===null||raw===undefined||raw==='')return fallback;
    try{return JSON.parse(raw);}catch(e){return fallback;}
  }
  function normalize(value, fallback){return value===undefined||value===null?fallback:value;}
  function isSafeStorageKey(key){
    key=String(key||'');
    return !!key && key.length<=180 && /^[A-Za-z0-9_:\-.]+$/.test(key);
  }
  function normalizeRawStorageValue(value){
    if(value===undefined)return null;
    if(value===null)return '';
    var out;
    if(typeof value==='string')out=value;
    else if(typeof value==='number'||typeof value==='boolean')out=String(value);
    else{try{out=JSON.stringify(value);}catch(e){return null;}}
    if(String(out).length>MAX_RAW_VALUE_LENGTH)return null;
    return out;
  }

  var Storage={
    version:VERSION,
    driver:DEFAULT_DRIVER,
    getMode:function(){return 'supabase';},
    setMode:function(mode){this.driver='supabase';var api=Api();if(api&&api.setMode)api.setMode('api');return this.driver;},
    isApiMode:function(){return true;},
    isLocalOnly:isLocalOnlyName,
    map:KEY_MAP,
    key:resolveKey,
    has:function(nameOrKey, opts){
      if(!isLocalOnlyName(nameOrKey)) return false;
      var st=nativeStorage(opts&&opts.scope);
      return st.getItem(resolveKey(nameOrKey))!==null;
    },
    get:function(nameOrKey, fallback, opts){
      if(!isLocalOnlyName(nameOrKey)) return blockBusinessLocalAccess('get', nameOrKey, fallback==null?null:fallback);
      try{return normalize(nativeStorage(opts&&opts.scope).getItem(resolveKey(nameOrKey)), fallback==null?null:fallback);}catch(e){return fallback==null?null:fallback;}
    },
    set:function(nameOrKey, value, opts){
      if(!isLocalOnlyName(nameOrKey)) return blockBusinessLocalAccess('set', nameOrKey, false);
      try{nativeStorage(opts&&opts.scope).setItem(resolveKey(nameOrKey), String(value));return true;}catch(e){console.warn('PETATOEStorage.set failed',nameOrKey,e);return false;}
    },
    remove:function(nameOrKey, opts){
      if(!isLocalOnlyName(nameOrKey)) return false;
      try{nativeStorage(opts&&opts.scope).removeItem(resolveKey(nameOrKey));return true;}catch(e){return false;}
    },
    readJSON:function(nameOrKey, fallback, opts){
      if(!isLocalOnlyName(nameOrKey)) return blockBusinessLocalAccess('readJSON', nameOrKey, fallback);
      try{return safeParse(nativeStorage(opts&&opts.scope).getItem(resolveKey(nameOrKey)), fallback);}catch(e){return fallback;}
    },
    writeJSON:function(nameOrKey, value, opts){
      if(!isLocalOnlyName(nameOrKey)) return blockBusinessLocalAccess('writeJSON', nameOrKey, false);
      try{nativeStorage(opts&&opts.scope).setItem(resolveKey(nameOrKey), JSON.stringify(value));return true;}catch(e){console.warn('PETATOEStorage.writeJSON failed',nameOrKey,e);return false;}
    },
    getRecords:function(){return window.PETATOEDataSource?window.PETATOEDataSource.getRecordsSync():[];},
    saveRecords:function(arr){if(window.PETATOEDataSource)return !!window.PETATOEDataSource.setRecordsSync(arr);return false;},
    getCurrentUserName:function(fallback){return window.PETATOEDataSource?window.PETATOEDataSource.getCurrentUserName(fallback||'User'):this.get('currentUser',fallback||'User');},
    setCurrentUser:function(value){if(window.PETATOEDataSource)return !!window.PETATOEDataSource.setCurrentUser(value);return this.set('currentUser',value);},
    push:function(nameOrKey, row, maxRows){
      if(!isLocalOnlyName(nameOrKey)) return [];
      var arr=this.readJSON(nameOrKey,[]);
      if(!Array.isArray(arr))arr=[];
      arr.unshift(row);
      if(maxRows&&arr.length>maxRows)arr=arr.slice(0,maxRows);
      this.writeJSON(nameOrKey,arr);
      return arr;
    },
    tableFor:function(name){return KEY_MAP[name]&&KEY_MAP[name].table;},
    endpointFor:function(nameOrKey){
      var meta=KEY_MAP[nameOrKey];
      var api=Api();
      if(meta&&api&&api.endpointForTable)return api.endpointForTable(meta.table);
      return 'storage/'+encodeURIComponent(resolveKey(nameOrKey));
    },
    apiReadJSON:function(nameOrKey, fallback){
      var self=this;
      if(isLocalOnlyName(nameOrKey)) return Promise.resolve(this.readJSON(nameOrKey,fallback));
      var meta=KEY_MAP[nameOrKey], table=this.tableFor(nameOrKey);
      var R=supabaseRepo();
      if(R&&R.hasClient&&R.hasClient()&&table){
        if(meta&&meta.type==='array'){
          return R.listJsonRows(table,{}).then(function(rows){return Array.isArray(rows)?rows:(fallback||[]);})
            .catch(function(e){console.warn('PETATOEStorage.supabaseReadJSON failed',nameOrKey,e);return fallback;});
        }
        return R.getSingleton(table,String(nameOrKey),fallback).then(function(v){return v===undefined||v===null?fallback:v;})
          .catch(function(e){console.warn('PETATOEStorage.supabaseReadJSON failed',nameOrKey,e);return fallback;});
      }
      var api=Api();
      if(!api||!api.isApiMode()) return Promise.resolve(fallback);
      var endpoint=this.endpointFor(nameOrKey);
      return api.get(endpoint).then(function(res){
        if(res&&res.data!==undefined)return res.data;
        return res===undefined||res===null?fallback:res;
      }).catch(function(e){console.warn('PETATOEStorage.apiReadJSON failed',nameOrKey,e);return fallback;});
    },
    apiWriteJSON:function(nameOrKey, value){
      if(isLocalOnlyName(nameOrKey)) return Promise.resolve(this.writeJSON(nameOrKey,value));
      var meta=KEY_MAP[nameOrKey], table=this.tableFor(nameOrKey);
      var R=supabaseRepo();
      if(R&&R.hasClient&&R.hasClient()&&table){
        if(meta&&meta.type==='array'){
          var rows=Array.isArray(value)?value:[];
          var desired={};
          rows.forEach(function(row,idx){desired[rowIdFor(row,idx)]=true;});
          return Promise.all(rows.map(function(row,idx){return R.upsertJsonRow(table,rowIdFor(row,idx),row,{});}))
            .then(function(){return (typeof R.listJsonRows==='function')?R.listJsonRows(table,{}):[];})
            .then(function(existing){
              existing=Array.isArray(existing)?existing:[];
              var removals=existing.filter(function(row){return row&&row.id!=null&&!desired[String(row.id)];});
              if(!removals.length||typeof R.deleteById!=='function') return true;
              return Promise.all(removals.map(function(row){return R.deleteById(table,row.id);})).then(function(){return true;});
            })
            .catch(function(e){console.warn('PETATOEStorage.supabaseWriteJSON failed',nameOrKey,e);return false;});
        }
        var payload=(meta&&meta.type==='object')?(isObjectValue(value)?value:{}):{ value:value };
        return R.saveSingleton(table,String(nameOrKey),payload).then(function(res){return !!(res&&res.ok);})
          .catch(function(e){console.warn('PETATOEStorage.supabaseWriteJSON failed',nameOrKey,e);return false;});
      }
      var api=Api();
      if(!api||!api.isApiMode()) return Promise.resolve(false);
      return api.put(this.endpointFor(nameOrKey),{data:value,key:resolveKey(nameOrKey),table:this.tableFor(nameOrKey)})
        .then(function(){return true;})
        .catch(function(e){console.warn('PETATOEStorage.apiWriteJSON failed',nameOrKey,e);return false;});
    },
    exportSnapshot:function(){
      var out={version:VERSION,createdAt:new Date().toISOString(),driver:this.driver,data:{},blockedBusinessKeys:[]};
      Object.keys(KEY_MAP).forEach(function(name){
        var meta=KEY_MAP[name];
        if(!isLocalOnlyName(name)){
          out.blockedBusinessKeys.push({name:name,key:meta.key,table:meta.table,type:meta.type});
          out.data[name]={key:meta.key,table:meta.table,type:meta.type,raw:null,supabaseOnly:true};
          return;
        }
        var raw=null;try{raw=nativeStorage().getItem(meta.key);}catch(e){console.warn('PETATOEStorage.exportSnapshot key read failed', meta.key, e);}
        out.data[name]={key:meta.key,table:meta.table,type:meta.type,raw:raw,localOnly:true};
      });
      return out;
    },
    rawSnapshot:function(opts){
      var out={};
      try{
        var st=nativeStorage(opts&&opts.scope);
        localSnapshotKeys(opts&&opts.scope).forEach(function(k){out[k]=st.getItem(k);});
      }catch(e){console.warn('PETATOEStorage.rawSnapshot failed', e);}
      return out;
    },
    applyRawSnapshot:function(data, opts){
      if(!data||typeof data!=='object'||Array.isArray(data))return false;
      try{
        var st=nativeStorage(opts&&opts.scope);
        var keys=Object.keys(data), applied=0, skipped=[];
        if(keys.length>MAX_RAW_SNAPSHOT_KEYS){
          console.warn('PETATOEStorage.applyRawSnapshot rejected oversized snapshot', keys.length);
          return false;
        }
        keys.forEach(function(k){
          if(!isSafeStorageKey(k)||!isLocalOnlyName(k)){skipped.push(k);return;}
          var v=normalizeRawStorageValue(data[k]);
          if(v===null){skipped.push(k);return;}
          st.setItem(k, v);
          applied++;
        });
        if(skipped.length)console.warn('PETATOEStorage.applyRawSnapshot skipped non-local or unsafe entries', skipped.slice(0,10));
        return applied>0||keys.length===0;
      }catch(e){console.warn('PETATOEStorage.applyRawSnapshot failed',e);return false;}
    },
    clearRaw:function(opts){
      try{
        var st=nativeStorage(opts&&opts.scope);
        localSnapshotKeys(opts&&opts.scope).forEach(function(k){st.removeItem(k);});
        return true;
      }catch(e){return false;}
    },
    scanInvalidJSON:function(opts){
      var bad=[];
      try{
        var st=nativeStorage(opts&&opts.scope);
        localSnapshotKeys(opts&&opts.scope).forEach(function(k){
          var v=st.getItem(k);
          if(v&&/^[\[{]/.test(String(v).trim())){try{JSON.parse(v)}catch(e){bad.push(k)}}
        });
      }catch(e){console.warn('PETATOEStorage.scanInvalidJSON failed', e);}
      return bad;
    },
    auditLocalBusinessKeys:function(opts){
      var findings=[];
      try{
        var st=nativeStorage(opts&&opts.scope);
        for(var i=0;i<st.length;i++){
          var k=st.key(i);
          if(!isLocalOnlyName(k)) findings.push(k);
        }
      }catch(e){console.warn('PETATOEStorage.auditLocalBusinessKeys failed', e);}
      return findings;
    }
  };

  Storage.__ready=true;
  window.PETATOEStorage=Storage;
})(window);
