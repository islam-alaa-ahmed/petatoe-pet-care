/* PETATOE v9.0.0 FINAL7: Smart Reports refresh/data readiness guard
 * Purpose:
 * - Prevent the empty-data fallback from flashing/sticking after browser refresh.
 * - Wait for restored authentication and Supabase sales data before first render.
 * - Re-render automatically when records arrive, without changing report logic.
 */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_OPEN_REFRESH_GUARD_FINAL7__) return;
  window.__PETATOE_SMART_OPEN_REFRESH_GUARD_FINAL7__ = true;

  var renderTimer = null;
  var syncPromise = null;
  var retryTimer = null;
  var retryCount = 0;
  var MAX_RETRIES = 30;
  var dataConfirmed = false;

  function q(sel, root){ try{return (root||document).querySelector(sel);}catch(_e){return null;} }
  function clean(v){ return String(v == null ? '' : v).trim(); }
  function isAuthenticated(){
    try{
      var u = window.currentUser;
      if(u && typeof u === 'object' && (u.id || u.username || u.email || u.name)) return true;
      if(window.PETATOEAuthSession && typeof window.PETATOEAuthSession.getCurrentUser === 'function'){
        var a = window.PETATOEAuthSession.getCurrentUser();
        if(a) return true;
      }
    }catch(_e){}
    return false;
  }
  function activeSmartTab(){
    var btn = q('#smartTabs .smart-pill.active, [data-smart-tab].active');
    var sec = q('.smart-tab-section.active[data-smart-section]');
    return clean((btn && (btn.getAttribute('data-smart-tab') || (btn.dataset && btn.dataset.smartTab))) ||
                 (sec && (sec.getAttribute('data-smart-section') || (sec.dataset && sec.dataset.smartSection))) ||
                 'overview');
  }
  function smartIsOpen(){
    try{
      if(window.PETATOERouter && window.PETATOERouter.current === 'smart') return true;
      var area=q('#smartReportsArea');
      return !!(area && area.offsetParent !== null);
    }catch(_e){ return false; }
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
    try{ if(window.PETATOEDataSource && typeof window.PETATOEDataSource.setRuntimeRecords === 'function') window.PETATOEDataSource.setRuntimeRecords(rows, 'smart-reports-final7-sync'); }catch(_e){}
    try{ if(typeof window._invalidateSearchIndex === 'function') window._invalidateSearchIndex(); }catch(_e){}
    try{ window.__PETATOE_SMART_SILENT_SYNC_STATUS__ = {rows: rows.length, confirmed:true, at: Date.now()}; }catch(_e){}
    dataConfirmed = true;
    return rows;
  }
  function loadingText(){
    var lang='ar';
    try{ lang=(window.PETATOE_I18N&&window.PETATOE_I18N.getLanguage)?window.PETATOE_I18N.getLanguage():(document.documentElement.lang||'ar'); }catch(_e){}
    return lang === 'en' ? 'Loading Smart Reports data…' : 'جارٍ تحميل بيانات التقارير الذكية…';
  }
  function showLoading(){
    var area=q('#smartReportsArea');
    if(!area || rowsCount() || dataConfirmed) return;
    var current=area.querySelector('[data-smart-final7-loading]');
    if(current) return;
    area.innerHTML='<div data-smart-final7-loading="1" style="min-height:120px;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(148,163,184,.24);border-radius:18px;font-weight:800;opacity:.86">'+loadingText()+'</div>';
  }
  function silentSyncRows(){
    if(syncPromise) return syncPromise;
    syncPromise = Promise.resolve().then(async function(){
      var existing=rowsCount();
      if(existing>0){ dataConfirmed=true; return {rows:existing,confirmed:true,source:'runtime-cache'}; }
      try{
        if(window.PETATOEDataLayer && typeof window.PETATOEDataLayer.readSalesRecords === 'function'){
          var res = await window.PETATOEDataLayer.readSalesRecords({maxRows:false,pageSize:1000});
          if(res && res.ok && Array.isArray(res.data)){
            setRuntimeRows(res.data);
            return {rows:rowsCount(),confirmed:true,source:'supabase'};
          }
          return {rows:0,confirmed:false,source:'supabase-not-ready'};
        }
      }catch(e){ try{ console.warn('[PETATOE Smart] refresh sync deferred', e); }catch(_e){} }
      return {rows:rowsCount(),confirmed:false,source:'data-layer-not-ready'};
    }).finally(function(){ syncPromise = null; });
    return syncPromise;
  }
  function setSmartTabSafe(tab){
    tab = clean(tab || 'overview') || 'overview';
    try{ if(typeof window.setSmartTab === 'function') window.setSmartTab(tab); }catch(e){ try{ console.warn('[PETATOE Smart] setSmartTab skipped', e); }catch(_e){} }
  }
  function scheduleRetry(tab, reason){
    clearTimeout(retryTimer);
    if(retryCount >= MAX_RETRIES) return;
    retryCount++;
    retryTimer=setTimeout(function(){ renderSmartReady(tab, reason||'refresh-readiness-retry'); }, Math.min(300 + retryCount*80, 1000));
  }
  function renderSmartReady(tab, reason){
    tab = clean(tab || activeSmartTab() || 'overview') || 'overview';
    clearTimeout(renderTimer);
    if(!isAuthenticated()) return Promise.resolve(false);
    if(!smartIsOpen()) return Promise.resolve(false);
    if(!rowsCount() && !dataConfirmed) showLoading();
    return silentSyncRows().then(function(status){
      if(!status.confirmed){
        showLoading();
        scheduleRetry(tab, reason);
        return false;
      }
      retryCount=0;
      clearTimeout(retryTimer);
      try{
        if(typeof window.renderSmartReports === 'function') window.renderSmartReports(tab);
        setTimeout(function(){ setSmartTabSafe(tab); }, 0);
        setTimeout(function(){ setSmartTabSafe(tab); }, 180);
        try{ if(window.PETATOENavigationState && typeof window.PETATOENavigationState.save === 'function') window.PETATOENavigationState.save(reason || 'smart-ready-render'); }catch(_e){}
        return true;
      }catch(e){ try{ console.error('[PETATOE Smart] render failed', e); }catch(_e){} return false; }
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
    retryCount=0;
    if(!rowsCount() && !dataConfirmed) showLoading();
    scheduleSmartRender(tab, 80, 'header-smart-open');
    return false;
  }

  window.PETATOEOpenSmartReports = openSmartReports;
  window.PETATOESmartReportsReadyRender = renderSmartReady;

  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest && e.target.closest('[data-pet-action="smart-refresh"]');
    if(!el) return;
    e.preventDefault();
    if(e.stopImmediatePropagation) e.stopImmediatePropagation();
    dataConfirmed=false;
    retryCount=0;
    openSmartReports(activeSmartTab() || 'overview', e);
    return false;
  }, true);

  document.addEventListener('petatoe:tabchange', function(e){
    var d = e.detail || {};
    if(d.tabId !== 'smart') return;
    var tab = clean(d.smartOpen || activeSmartTab() || 'overview') || 'overview';
    retryCount=0;
    if(!rowsCount() && !dataConfirmed) showLoading();
    scheduleSmartRender(tab, rowsCount() ? 100 : 220, 'smart-tabchange');
  });

  document.addEventListener('petatoe:userchanged', function(e){
    var user=e&&e.detail&&e.detail.user;
    if(!user){
      dataConfirmed=false; retryCount=0; clearTimeout(retryTimer); clearTimeout(renderTimer); return;
    }
    if(smartIsOpen()){
      retryCount=0;
      scheduleSmartRender(activeSmartTab(), 180, 'auth-restored-smart-refresh');
    }
  });

  window.addEventListener('petatoe:records-changed', function(){
    var count=rowsCount();
    if(count>0) dataConfirmed=true;
    try{ if(smartIsOpen() && isAuthenticated()) scheduleSmartRender(activeSmartTab(), 120, 'records-changed'); }catch(_e){}
  });
})();
