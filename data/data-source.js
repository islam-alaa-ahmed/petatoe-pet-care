/* PETATOE v3.11.23 Phase 1 — DataSource Final Lock
   Single synchronous facade for sales records and current user.
   Rules:
   - PETATOEDataSource is the only public read/write facade for sales records.
   - v8.0.2: Sales records are Supabase/runtime only; no LocalStorage/PETATOEStorage fallback.
   - IndexedDB loaders keep this facade synchronized through syncRecordsCache().
   - Legacy globals may be updated for compatibility, but are never read as source. */
(function(w){
  'use strict';
  // PETATOE v6.1.70 Phase 4-A: DataSource owns the sales records runtime cache.
  // Do not rebuild it if the script is accidentally loaded again.
  if(w.PETATOEDataSource && w.PETATOEDataSource.__ready){ return; }
  var RECORDS_KEY='PETATOE_'+'FALLBACK';
  var CURRENT_USER_KEY='petatoe_current_user';
  var USER_ALIASES=['PETATOE_CURRENT_USER','currentUser','petatoe_current_user_v108','petatoe_current_user_v139'];
  var recordsCache=null;

  // PETATOE v6.1.80 Phase 5-D: central safe parse for records cache reads.
  function parse(raw,fb){
    if(raw===null||raw===undefined||raw==='')return fb;
    try{
      if(w.PETATOESecurity&&typeof w.PETATOESecurity.safeJsonParse==='function')return w.PETATOESecurity.safeJsonParse(raw,fb);
      return JSON.parse(raw);
    }catch(e){
      if(w.PETATOEUtils&&w.PETATOEUtils.warnSilentCatch)w.PETATOEUtils.warnSilentCatch('data/data-source.js:parse',e);
      return fb;
    }
  }
  function normalizeArabicDigits(v){return String(v==null?'':v).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d)}).replace(/[۰-۹]/g,function(d){return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)});}
  function toNumber(v){
    if(typeof v==='number')return isFinite(v)?v:0;
    var raw=normalizeArabicDigits(v).replace(/SAR|ريال|ر\.س/ig,'').replace(/,/g,'').replace(/\s+/g,'').replace(/[^0-9.\-]/g,'');
    var n=parseFloat(raw);return isFinite(n)?n:0;
  }
  function roundMoney(v){var n=toNumber(v);if(Math.abs(n)<0.005)n=0;return Math.round(n*100)/100;}
  function text(v){return String(v==null?'':v).trim();}
  function pad(n){return String(n).padStart(2,'0')}
  function normalizeDate(v){
    if(!v)return '';
    if(v instanceof Date&&!isNaN(v))return v.getFullYear()+'-'+pad(v.getMonth()+1)+'-'+pad(v.getDate());
    var s=text(v); if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)){var a=s.split('-');return a[0]+'-'+pad(a[1])+'-'+pad(a[2]);}
    var d=new Date(s); if(!isNaN(d))return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
    return s;
  }
  function normalizeMonth(month,date){
    var m=text(month);
    var ar={'يناير':1,'فبراير':2,'مارس':3,'ابريل':4,'أبريل':4,'مايو':5,'يونيو':6,'يوليو':7,'اغسطس':8,'أغسطس':8,'سبتمبر':9,'اكتوبر':10,'أكتوبر':10,'نوفمبر':11,'ديسمبر':12};
    if(ar[m])return ar[m];
    var n=toNumber(m); if(n>=1&&n<=12)return n;
    var ds=normalizeDate(date); var mm=/^\d{4}-(\d{2})-/.exec(ds); if(mm)return Number(mm[1]);
    return m||'';
  }
  function normalizeRecord(r,idx){
    if(!r||typeof r!=='object')r={};
    var out={};
    Object.keys(r).forEach(function(k){out[k]=r[k]});
    out.id=out.id!=null?out.id:('rec_'+Date.now()+'_'+idx);
    out.invoice=text(out.invoice||out.invoiceNo||out.billNo||out.number);
    out.client=text(out.client||out.customer||out.customerName);
    out.item=text(out.item||out.service||out.name||out.product);
    out.van=text(out.van||out.vehicle||out.car||out.carName||out.vehicleName);
    out.pay=text(out.pay||out.payment||out.paymentMethod||out.paymentType);
    out.date=normalizeDate(out.date||out.invoiceDate||out.createdAt);
    out.month=normalizeMonth(out.month,out.date);
    ['price','qty','disc','tax','totalInc','totalEx'].forEach(function(f){out[f]=roundMoney(out[f]);});
    if(!out.qty&&toNumber(out.quantity))out.qty=roundMoney(out.quantity);
    var hasGross=!!out.totalInc, hasNet=!!out.totalEx, hasTax=!!out.tax;
    var base=roundMoney(out.price*out.qty);
    if(!hasNet&&hasGross)out.totalEx=roundMoney(out.totalInc-out.tax);
    if(!hasGross&&hasNet)out.totalInc=roundMoney(out.totalEx+out.tax);
    if(!out.totalInc&&!out.totalEx&&base){
      var discount=out.disc;
      var net=discount<0?roundMoney(base+discount):roundMoney(base-discount);
      out.totalEx=net;
      out.totalInc=roundMoney(net+out.tax);
    }
    if(!out.tax&&out.totalInc&&out.totalEx)out.tax=roundMoney(out.totalInc-out.totalEx);
    if(!out.invoiceType){
      var cash=(out.invoice+' '+out.client).toLowerCase();
      out.invoiceType=(cash.indexOf('cash')>-1||cash.indexOf('كاش')>-1||cash.indexOf('نقد')>-1)&&!out.tax?'CASH':'TAX';
    }
    return out;
  }
  function normalizeRecords(arr){return Array.isArray(arr)?arr.filter(Boolean).map(normalizeRecord):[]}
  function auditRecords(arr){
    var rows=normalizeRecords(arr), anomalies=[], seen={};
    rows.forEach(function(r,i){
      if(!r.invoice)anomalies.push({index:i,type:'missing_invoice'});
      if(!r.date)anomalies.push({index:i,type:'missing_date',invoice:r.invoice});
      if(r.totalInc&&r.totalEx&&Math.abs(roundMoney(r.totalInc-r.totalEx-r.tax))>0.05)anomalies.push({index:i,type:'gross_net_tax_mismatch',invoice:r.invoice,diff:roundMoney(r.totalInc-r.totalEx-r.tax)});
      var k=[r.invoice,r.client,r.item,r.van,roundMoney(r.totalInc)].join('|');
      if(seen[k]!=null)anomalies.push({index:i,type:'possible_duplicate',firstIndex:seen[k],invoice:r.invoice}); else seen[k]=i;
    });
    return {rows:rows.length,anomalies:anomalies,ok:!anomalies.length};
  }
  function readStoredRecords(){return []}
  function writeStoredRecords(arr){return false}
  function notifyRecordsChanged(reason){
    try{
      if(w.PETATOE && w.PETATOE.SmartReports && typeof w.PETATOE.SmartReports.notifyDataChanged === 'function'){
        w.PETATOE.SmartReports.notifyDataChanged(reason || 'records-change');
      }else if(w.PETATOESmartTabs && typeof w.PETATOESmartTabs.notifyDataChanged === 'function'){
        w.PETATOESmartTabs.notifyDataChanged(reason || 'records-change');
      }
    }catch(e){ if(w.PETATOEUtils&&w.PETATOEUtils.warnSilentCatch)w.PETATOEUtils.warnSilentCatch('data/data-source.js:notifyRecordsChanged',e); }
    try{ w.dispatchEvent && w.dispatchEvent(new CustomEvent('petatoe:records-changed',{detail:{reason:reason||'records-change'}})); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("data/data-source.js",e);}
  }

  function publishLegacy(arr){
    // Compatibility only: older inline modules still reference the legacy records global in a few places.
    // This is not used as a source of truth by PETATOEDataSource.
    try{w['records']=arr}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("data/data-source.js",e);}
  }
  function ensureCache(){
    if(!Array.isArray(recordsCache)) recordsCache=readStoredRecords();
    publishLegacy(recordsCache);
    return recordsCache;
  }
  function getRecordsSync(){return ensureCache()}
  function setRuntimeRecords(arr, reason){
    recordsCache=normalizeRecords(arr);
    publishLegacy(recordsCache);
    notifyRecordsChanged(reason || 'runtime-records-sync');
    try{ w.__PETATOE_SALES_SOURCE_STATUS__={source:'supabase-runtime-cache',rows:recordsCache.length,time:new Date().toISOString(),reason:reason||'runtime-records-sync'}; }catch(_e){}
    return recordsCache;
  }
  function setRecordsSync(arr){
    recordsCache=normalizeRecords(arr);
    publishLegacy(recordsCache);
    notifyRecordsChanged('set-records-runtime-only');
    return recordsCache;
  }
  function syncRecordsCache(arr, options){
    if(Array.isArray(arr)){
      options=options||{};
      if(options.persist === true) return setRecordsSync(arr);
      return setRuntimeRecords(arr, options.reason || 'sync-records-cache');
    }
    return getRecordsSync();
  }
  async function refreshSalesRecordsFromSupabase(reason){
    try{
      if(!w.PETOTOEDataLayer && !w.PETATOEDataLayer) return {ok:false,error:{message:'PETATOEDataLayer is not ready'}};
      var dl=w.PETATOEDataLayer;
      if(!dl || typeof dl.readSalesRecords!=='function') return {ok:false,error:{message:'PETATOEDataLayer.readSalesRecords is not ready'}};
      var res=await dl.readSalesRecords({limit:20000});
      if(!res || !res.ok){
        try{console.warn('[PETATOEDataSource] Supabase sales refresh failed',res)}catch(_e){}
        return res || {ok:false,error:{message:'Empty DataLayer response'}};
      }
      setRuntimeRecords(res.data || [], reason || 'supabase-sales-refresh');
      return {ok:true,rows:(res.data||[]).length,result:res};
    }catch(e){
      try{console.warn('[PETATOEDataSource] Supabase sales refresh crashed',e)}catch(_e){}
      return {ok:false,error:{message:e&&e.message?e.message:String(e)}};
    }
  }
  function bootSupabaseSalesRefresh(){
    var attempts=0;
    function tick(){
      attempts++;
      if(w.PETATOEDataLayer && typeof w.PETATOEDataLayer.readSalesRecords==='function'){
        refreshSalesRecordsFromSupabase('boot-supabase-sales-refresh');
        return;
      }
      if(attempts < 40) setTimeout(tick, 250);
    }
    setTimeout(tick, 250);
  }
  function getCurrentUserRaw(){
    try{if(w.currentUser){return typeof w.currentUser==='string'?w.currentUser:JSON.stringify(w.currentUser)}}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("data/data-source.js",e);}
    try{if(w.__PETATOE_CURRENT_USER_RAW__)return String(w.__PETATOE_CURRENT_USER_RAW__)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("data/data-source.js",e);}
    return '';
  }
  function setCurrentUser(value){
    var raw=value;
    if(value&&typeof value==='object'){try{raw=JSON.stringify(value)}catch(e){raw=String(value)}}
    raw=raw==null?'':String(raw);
    try{w.__PETATOE_CURRENT_USER_RAW__=raw;}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("data/data-source.js",e);}
    try{var obj=parse(raw,null); if(obj)w.currentUser=obj;}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("data/data-source.js",e);}
    return raw;
  }
  function getCurrentUserName(fallback){
    fallback=fallback||'User';
    try{if(w.currentUser&&(w.currentUser.name||w.currentUser.username||w.currentUser.email))return w.currentUser.name||w.currentUser.username||w.currentUser.email}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("data/data-source.js",e);}
    var raw=getCurrentUserRaw();
    if(!raw)return fallback;
    var obj=parse(raw,null);
    if(obj&&(obj.name||obj.username||obj.email||obj.fullName))return obj.name||obj.username||obj.email||obj.fullName;
    return raw||fallback;
  }
  function migrateCurrentUser(){var raw=getCurrentUserRaw(); if(raw)setCurrentUser(raw)}

  w.PETATOEDataSource=w.PETATOEDataSource||{};
  w.PETATOEDataSource.recordsKey=RECORDS_KEY;
  w.PETATOEDataSource.currentUserKey=CURRENT_USER_KEY;
  w.PETATOEDataSource.getRecordsSync=getRecordsSync;
  w.PETATOEDataSource.getRecords=getRecordsSync;
  w.PETATOEDataSource.setRecordsSync=setRecordsSync;
  w.PETATOEDataSource.setRecords=setRecordsSync;
  w.PETATOEDataSource.setRuntimeRecords=setRuntimeRecords;
  w.PETATOEDataSource.syncRecordsCache=syncRecordsCache;
  w.PETATOEDataSource.refreshSalesRecordsFromSupabase=refreshSalesRecordsFromSupabase;
  w.PETATOEDataSource.normalizeRecord=normalizeRecord;
  w.PETATOEDataSource.normalizeRecords=normalizeRecords;
  w.PETATOEDataSource.auditRecords=auditRecords;
  w.PETATOEDataSource.getImportRowsSync=function(){try{return Array.isArray(w.importData)?normalizeRecords(w.importData):[]}catch(e){return []}};
  w.PETATOEDataSource.getInvoiceRowsSync=function(opts){
    opts=opts||{};
    var out=getRecordsSync().slice();
    if(opts.includeImport!==false){try{out=out.concat(w.PETATOEDataSource.getImportRowsSync())}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("data/data-source.js",e);}}
    return out.filter(Boolean);
  };
  w.PETATOEDataSource.getCurrentUserRaw=getCurrentUserRaw;
  w.PETATOEDataSource.setCurrentUser=setCurrentUser;
  w.PETATOEDataSource.getCurrentUserName=getCurrentUserName;
  w.PETATOEDataSource.migrateCurrentUser=migrateCurrentUser;
  w.PETATOEDataSource.__ready=true;
  w.PETATOEDataSource.version='3.11.24-sales-supabase-unified';

  ensureCache();
  migrateCurrentUser();
  bootSupabaseSalesRefresh();
})(window);
