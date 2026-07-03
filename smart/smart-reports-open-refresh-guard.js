/* PETATOE v8.0.2 Phase 28: Smart Reports open/refresh guard
 * Purpose:
 * - Opening Smart Reports from the top header must render data on first click.
 * - Smart refresh must update Smart Reports in-place without dashboard render flicker.
 * - Browser refresh restore should re-render Smart Reports after data is ready.
 */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_OPEN_REFRESH_GUARD_V802_PHASE28__) return;
  window.__PETATOE_SMART_OPEN_REFRESH_GUARD_V802_PHASE28__ = true;

  var renderTimer = null;
  var syncPromise = null;

  function q(sel, root){ try{return (root||document).querySelector(sel);}catch(_e){return null;} }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function activeSmartTab(){
    var btn = q('#smartTabs .smart-pill.active, [data-smart-tab].active');
    var sec = q('.smart-tab-section.active[data-smart-section]');
    return clean((btn && (btn.getAttribute('data-smart-tab') || (btn.dataset && btn.dataset.smartTab))) ||
                 (sec && (sec.getAttribute('data-smart-section') || (sec.dataset && sec.dataset.smartSection))) ||
                 'overview');
  }
  function rowsCount(){
    try{ if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function'){ var r=window.PETATOEDataSource.getRecordsSync(); return Array.isArray(r)?r.length:0; } }catch(_e){}
    try{ return Array.isArray(window.records) ? window.records.length : 0; }catch(_e){ return 0; }
  }
  function normalizeRows(rows){
    try{ if(typeof window.petatoeNormalizeSalesRowsForReports === 'function') return window.petatoeNormalizeSalesRowsForReports(rows||[]); }catch(_e){}
    return Array.isArray(rows) ? rows : [];
  }
  function setRuntimeRows(rows){
    rows = normalizeRows(rows);
    try{ window.records = rows.slice(); }catch(_e){}
    try{ if(window.PETATOEDataSource && typeof window.PETATOEDataSource.setRuntimeRecords === 'function') window.PETATOEDataSource.setRuntimeRecords(rows, 'smart-reports-silent-sync'); }catch(_e){}
    try{ if(typeof window._invalidateSearchIndex === 'function') window._invalidateSearchIndex(); }catch(_e){}
    try{ window.__PETATOE_SMART_SILENT_SYNC_STATUS__ = {rows: rows.length, at: Date.now()}; }catch(_e){}
    return rows;
  }
  function silentSyncRows(){
    if(syncPromise) return syncPromise;
    syncPromise = Promise.resolve().then(async function(){
      try{
        if(window.PETATOEDataLayer && typeof window.PETATOEDataLayer.readSalesRecords === 'function'){
          var res = await window.PETATOEDataLayer.readSalesRecords({maxRows:false,pageSize:1000});
          if(res && res.ok && Array.isArray(res.data)){
            setRuntimeRows(res.data);
            return rowsCount();
          }
        }
      }catch(e){ try{ console.warn('[PETATOE Smart] silent Supabase sync skipped', e); }catch(_e){} }
      try{
        if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function'){
          var rows = window.PETATOEDataSource.getRecordsSync();
          if(Array.isArray(rows)) setRuntimeRows(rows);
        }
      }catch(_e){}
      return rowsCount();
    }).finally(function(){ syncPromise = null; });
    return syncPromise;
  }
  function setSmartTabSafe(tab){
    tab = clean(tab || 'overview') || 'overview';
    try{ if(typeof window.setSmartTab === 'function') window.setSmartTab(tab); }catch(e){ try{ console.warn('[PETATOE Smart] setSmartTab skipped', e); }catch(_e){} }
  }
  function renderSmartReady(tab, reason){
    tab = clean(tab || activeSmartTab() || 'overview') || 'overview';
    clearTimeout(renderTimer);
    return silentSyncRows().then(function(){
      try{
        if(typeof window.renderSmartReports === 'function') window.renderSmartReports(tab);
        setTimeout(function(){ setSmartTabSafe(tab); }, 0);
        setTimeout(function(){ setSmartTabSafe(tab); }, 180);
        try{ if(window.PETATOENavigationState && typeof window.PETATOENavigationState.save === 'function') window.PETATOENavigationState.save(reason || 'smart-ready-render'); }catch(_e){}
      }catch(e){ try{ console.error('[PETATOE Smart] render failed', e); }catch(_e){} }
    });
  }
  function scheduleSmartRender(tab, delay, reason){
    clearTimeout(renderTimer);
    renderTimer = setTimeout(function(){ renderTimer = null; renderSmartReady(tab, reason); }, delay == null ? 80 : delay);
  }
  function openSmartReports(tab, event){
    try{ if(event && event.preventDefault) event.preventDefault(); }catch(_e){}
    tab = clean(tab || 'overview') || 'overview';
    try{
      if(window.PETATOERouter && typeof window.PETATOERouter.openTab === 'function') window.PETATOERouter.openTab('smart', tab);
      else if(window.tab) window.tab('smart');
    }catch(e){ try{ console.warn('[PETATOE Smart] route open skipped', e); }catch(_e){} }
    scheduleSmartRender(tab, 60, 'header-smart-open');
    setTimeout(function(){ renderSmartReady(tab, 'header-smart-open-late'); }, 520);
    return false;
  }

  window.PETATOEOpenSmartReports = openSmartReports;
  window.PETATOESmartReportsReadyRender = renderSmartReady;

  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest && e.target.closest('[data-pet-action="smart-refresh"]');
    if(!el) return;
    e.preventDefault();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    openSmartReports(activeSmartTab() || 'overview', e);
    return false;
  }, true);

  document.addEventListener('petatoe:tabchange', function(e){
    var d = e.detail || {};
    if(d.tabId !== 'smart') return;
    var tab = clean(d.smartOpen || activeSmartTab() || 'overview') || 'overview';
    scheduleSmartRender(tab, rowsCount() ? 120 : 260, 'smart-tabchange');
  });

  document.addEventListener('petatoe:records-changed', function(){
    try{ if(window.PETATOERouter && window.PETATOERouter.current === 'smart') scheduleSmartRender(activeSmartTab(), 180, 'records-changed'); }catch(_e){}
  });
})();
