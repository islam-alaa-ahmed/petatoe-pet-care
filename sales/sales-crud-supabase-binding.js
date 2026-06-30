/* PETATOE v8.0.2 — Sales CRUD Supabase Binding
   Binds Records delete / delete all to Supabase sales_records. No LocalStorage migration. */
(function(){
  'use strict';
  if(window.__PETATOE_SALES_CRUD_SUPABASE_BINDING__) return;
  window.__PETATOE_SALES_CRUD_SUPABASE_BINDING__ = true;

  function toastMsg(msg){ try{ if(typeof toast==='function') toast(msg); else console.log(msg); }catch(_e){ console.log(msg); } }
  function warnSilent(scope,e){ try{ window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch(scope,e); }catch(_e){} }
  function getRows(){ try{ return window.PETATOEDataSource&&window.PETATOEDataSource.getRecordsSync ? (window.PETATOEDataSource.getRecordsSync()||[]) : (window.records||[]); }catch(_e){ return window.records||[]; } }
  function setRuntimeRows(rows, reason){
    rows = Array.isArray(rows) ? rows : [];
    try{ window.records = rows; }catch(_e){}
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.syncRecordsCache==='function'){
        window.PETATOEDataSource.syncRecordsCache(rows,{reason:reason||'sales-crud-supabase-binding'});
      }else if(window.PETATOEDataSource && typeof window.PETATOEDataSource.setRecordsSync==='function'){
        window.PETATOEDataSource.setRecordsSync(rows);
      }
    }catch(e){ warnSilent('sales/sales-crud-supabase-binding.js:setRuntimeRows',e); }
  }
  async function refreshRows(reason){
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.refreshSalesRecordsFromSupabase==='function'){
        var res = await window.PETATOEDataSource.refreshSalesRecordsFromSupabase(reason||'sales-crud-refresh');
        if(res && res.ok) return res;
      }
      if(window.PETATOEDataLayer && typeof window.PETATOEDataLayer.readSalesRecords==='function'){
        var dl = await window.PETATOEDataLayer.readSalesRecords({limit:20000});
        if(dl && dl.ok){ setRuntimeRows(dl.data||[],reason||'sales-crud-refresh-datalayer'); return {ok:true,rows:(dl.data||[]).length,result:dl}; }
      }
    }catch(e){ warnSilent('sales/sales-crud-supabase-binding.js:refreshRows',e); return {ok:false,error:e}; }
    return {ok:false,error:{message:'No Supabase sales refresh method is ready'}};
  }
  function renderAll(){
    try{ if(typeof _invalidateSearchIndex==='function') _invalidateSearchIndex(); }catch(e){ warnSilent('sales crud invalidate',e); }
    try{ if(typeof renderRecords==='function') renderRecords(); }catch(e){ warnSilent('sales crud renderRecords',e); }
    try{ if(typeof renderDashboardAll==='function') renderDashboardAll(); }catch(e){ warnSilent('sales crud renderDashboardAll',e); }
    try{ if(window.PETATOESmartTabs&&typeof window.PETATOESmartTabs.notifyDataChanged==='function') window.PETATOESmartTabs.notifyDataChanged('sales-crud-supabase-change'); }catch(e){ warnSilent('sales crud smart notify',e); }
    try{ window.dispatchEvent(new CustomEvent('petatoe:sales-crud-supabase-change')); }catch(e){ warnSilent('sales crud event',e); }
  }
  function findRecord(id){ return getRows().find(function(r){ return String(r&&r.id)===String(id) || String(r&&r.supabase_id)===String(id) || String(r&&r.legacy_id)===String(id); }); }
  function canDeleteNow(all){
    try{ if(typeof canDelete==='function' && !canDelete()){ toastMsg(all?'الصلاحية الحالية لا تسمح بحذف كل البيانات':'الصلاحية الحالية لا تسمح بالحذف'); return false; } }catch(e){ warnSilent('sales crud canDelete',e); }
    return true;
  }

  async function deleteOne(id){
    if(!canDeleteNow(false)) return false;
    var rec = findRecord(id) || {id:id};
    if(!confirm('حذف السجل من Supabase نهائيًا؟')) return false;
    if(!window.PETATOEDataLayer || typeof window.PETATOEDataLayer.deleteSalesRecord!=='function'){
      toastMsg('DataLayer غير جاهز لحذف السجل من Supabase'); return false;
    }
    var res = await window.PETATOEDataLayer.deleteSalesRecord(rec);
    if(!res || !res.ok){ console.error('[PETATOE Sales CRUD] delete failed',res); toastMsg('فشل حذف السجل من Supabase'); return false; }
    setRuntimeRows(getRows().filter(function(r){ return String(r&&r.id)!==String(rec.id) && String(r&&r.supabase_id)!==String(rec.supabase_id||id); }),'sales-delete-local-cache-after-supabase');
    try{ document.dispatchEvent(new CustomEvent('petatoe:record-deleted',{detail:{id:id,record:rec,source:'supabase'}})); }catch(e){ warnSilent('sales crud deleted event',e); }
    await refreshRows('sales-delete-refresh');
    renderAll();
    toastMsg('تم حذف السجل من Supabase');
    return true;
  }

  async function deleteAll(){
    if(!canDeleteNow(true)) return false;
    var n = getRows().length;
    if(!confirm('حذف كل بيانات المبيعات من Supabase؟\nعدد السجلات الحالية: '+n)) return false;
    if(!confirm('تأكيد نهائي: لن ترجع البيانات بعد التحديث إلا إذا رفعتها من Excel مرة أخرى.')) return false;
    if(!window.PETATOEDataLayer || typeof window.PETATOEDataLayer.deleteAllSalesRecords!=='function'){
      toastMsg('DataLayer غير جاهز لحذف كل السجلات من Supabase'); return false;
    }
    var res = await window.PETATOEDataLayer.deleteAllSalesRecords();
    if(!res || !res.ok){ console.error('[PETATOE Sales CRUD] delete all failed',res); toastMsg('فشل حذف كل السجلات من Supabase'); return false; }
    setRuntimeRows([],'sales-delete-all-local-cache-after-supabase');
    try{ document.dispatchEvent(new CustomEvent('petatoe:records-cleared',{detail:{source:'supabase'}})); }catch(e){ warnSilent('sales crud cleared event',e); }
    await refreshRows('sales-delete-all-refresh');
    renderAll();
    toastMsg('تم حذف كل بيانات المبيعات من Supabase');
    return true;
  }

  var previousDelRecord = window.delRecord;
  var previousClearAll = window.clearAll;
  window.delRecord = function(id){ deleteOne(id).catch(function(e){ console.error('[PETATOE Sales CRUD] delete crashed',e); toastMsg('حدث خطأ أثناء الحذف من Supabase'); }); };
  window.clearAll = function(){ deleteAll().catch(function(e){ console.error('[PETATOE Sales CRUD] delete all crashed',e); toastMsg('حدث خطأ أثناء حذف الكل من Supabase'); }); };
  window.petatoeSalesCrudSupabase = {
    phase:'SALES_CRUD_SUPABASE_BINDING',
    deleteOne: deleteOne,
    deleteAll: deleteAll,
    refreshRows: refreshRows,
    previousDelRecord: previousDelRecord,
    previousClearAll: previousClearAll
  };
  console.log('✅ PETATOE Sales CRUD Supabase binding loaded');
})();
