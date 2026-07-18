/* PETATOE v9.4.14: Smart Reports data-readiness recovery guard
 * Keeps the last valid dashboard visible during background refreshes, waits for
 * authenticated data readiness, and never converts a timeout into a false empty state.
 */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_OPEN_REFRESH_GUARD_V9414__) return;
  window.__PETATOE_SMART_OPEN_REFRESH_GUARD_V9414__ = true;

  var renderTimer=null;
  var retryTimer=null;
  var syncPromise=null;
  var retryStartedAt=0;
  var retryCount=0;
  var DATA_WAIT_TIMEOUT_MS=30000;
  var dataState='unknown'; // unknown | loading | ready | empty
  var lastValidRows=[];

  function q(sel,root){try{return (root||document).querySelector(sel);}catch(_e){return null;}}
  function clean(v){return String(v==null?'':v).trim();}
  function now(){return Date.now?Date.now():(+new Date());}
  function isAuthenticated(){
    try{
      var u=window.currentUser;
      if(u&&typeof u==='object'&&(u.id||u.username||u.email||u.name))return true;
      if(window.PETATOEAuthSession&&typeof window.PETATOEAuthSession.getCurrentUser==='function')return !!window.PETATOEAuthSession.getCurrentUser();
    }catch(_e){}
    return false;
  }
  function activeSmartTab(){
    var btn=q('#smartTabs .smart-pill.active, [data-smart-tab].active');
    var sec=q('.smart-tab-section.active[data-smart-section]');
    return clean((btn&&(btn.getAttribute('data-smart-tab')||(btn.dataset&&btn.dataset.smartTab)))||(sec&&(sec.getAttribute('data-smart-section')||(sec.dataset&&sec.dataset.smartSection)))||'overview');
  }
  function smartIsOpen(){
    try{
      if(window.PETATOERouter&&window.PETATOERouter.current==='smart')return true;
      var area=q('#smartReportsArea');
      return !!(area&&area.offsetParent!==null);
    }catch(_e){return false;}
  }
  function runtimeRows(){
    try{
      if(window.PETATOEDataSource&&typeof window.PETATOEDataSource.getRecordsSync==='function'){
        var rows=window.PETATOEDataSource.getRecordsSync();
        if(Array.isArray(rows))return rows;
      }
    }catch(_e){}
    try{return Array.isArray(window.records)?window.records:[];}catch(_e){return [];}
  }
  function rowsCount(){return runtimeRows().length;}
  function rememberRows(rows){
    if(Array.isArray(rows)&&rows.length)lastValidRows=rows.slice();
    return rows;
  }
  function normalizeRows(rows){
    try{if(typeof window.petatoeNormalizeSalesRowsForReports==='function')return window.petatoeNormalizeSalesRowsForReports(rows||[]);}catch(_e){}
    return Array.isArray(rows)?rows:[];
  }
  function setRuntimeRows(rows,source){
    rows=normalizeRows(rows);
    rememberRows(rows);
    try{window.records=rows.slice();}catch(_e){}
    try{if(window.PETATOEDataSource&&typeof window.PETATOEDataSource.setRuntimeRecords==='function')window.PETATOEDataSource.setRuntimeRecords(rows,source||'smart-reports-v9414-sync');}catch(_e){}
    try{if(typeof window._invalidateSearchIndex==='function')window._invalidateSearchIndex();}catch(_e){}
    try{window.__PETATOE_SMART_DATA_READINESS__={state:rows.length?'ready':'empty',rows:rows.length,confirmed:true,at:now(),source:source||'sync'};}catch(_e){}
    dataState=rows.length?'ready':'empty';
    return rows;
  }
  function hasRenderedDashboard(){
    var area=q('#smartReportsArea');
    return !!(area&&area.querySelector('#smartTabs')&&area.querySelector('.smart-tab-section'));
  }
  function loadingText(){
    var lang='ar';
    try{lang=(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.getLanguage)?window.PETATOE_LOCALIZATION_CENTER.getLanguage():(document.documentElement.lang||'ar');}catch(_e){}
    return lang==='en'?'Loading Smart Reports data…':'جارٍ تحميل بيانات التقارير الذكية…';
  }
  function showLoading(){
    var area=q('#smartReportsArea');
    if(!area||rowsCount()||dataState==='ready'||hasRenderedDashboard())return;
    if(area.querySelector('[data-smart-v9414-loading]'))return;
    area.innerHTML='<div data-smart-v9414-loading="1" style="min-height:120px;display:flex;align-items:center;justify-content:center;border:1px dashed rgba(148,163,184,.24);border-radius:18px;font-weight:800;opacity:.86">'+loadingText()+'</div>';
  }
  function restoreLastValidRows(){
    if(rowsCount()||!lastValidRows.length)return false;
    setRuntimeRows(lastValidRows,'smart-reports-v9414-last-valid-cache');
    return true;
  }
  function dataLayerReady(){
    return !!(window.PETATOEDataLayer&&typeof window.PETATOEDataLayer.readSalesRecords==='function');
  }
  function silentSyncRows(force){
    if(syncPromise)return syncPromise;
    syncPromise=Promise.resolve().then(async function(){
      var existing=runtimeRows();
      rememberRows(existing);
      if(existing.length&&!force){dataState='ready';return{rows:existing.length,confirmed:true,empty:false,source:'runtime-cache'};}
      if(!dataLayerReady())return{rows:existing.length,confirmed:false,empty:false,source:'data-layer-not-ready'};
      dataState='loading';
      try{
        var res=await window.PETATOEDataLayer.readSalesRecords({maxRows:false,pageSize:1000});
        if(res&&res.ok&&Array.isArray(res.data)){
          if(res.data.length){setRuntimeRows(res.data,'smart-reports-v9414-supabase');return{rows:res.data.length,confirmed:true,empty:false,source:'supabase'};}
          // An empty response is only accepted after the full readiness window. Until
          // then keep the last valid dashboard/data and continue waiting for hydration.
          if(lastValidRows.length){restoreLastValidRows();return{rows:lastValidRows.length,confirmed:true,empty:false,source:'last-valid-cache'};}
          var elapsed=retryStartedAt?now()-retryStartedAt:0;
          if(elapsed>=DATA_WAIT_TIMEOUT_MS){setRuntimeRows([],'smart-reports-v9414-confirmed-empty');return{rows:0,confirmed:true,empty:true,source:'supabase-confirmed-empty'};}
          return{rows:0,confirmed:false,empty:false,source:'supabase-empty-grace'};
        }
      }catch(e){try{console.warn('[PETATOE Smart] data readiness deferred',e);}catch(_e){}}
      if(lastValidRows.length){restoreLastValidRows();return{rows:lastValidRows.length,confirmed:true,empty:false,source:'last-valid-cache'};}
      return{rows:rowsCount(),confirmed:false,empty:false,source:'sync-not-ready'};
    }).finally(function(){syncPromise=null;});
    return syncPromise;
  }
  function setSmartTabSafe(tab){
    tab=clean(tab||'overview')||'overview';
    try{if(typeof window.setSmartTab==='function')window.setSmartTab(tab);}catch(e){try{console.warn('[PETATOE Smart] setSmartTab skipped',e);}catch(_e){}}
  }
  function clearRetry(){clearTimeout(retryTimer);retryTimer=null;retryCount=0;retryStartedAt=0;}
  function scheduleRetry(tab,reason){
    clearTimeout(retryTimer);
    if(!retryStartedAt)retryStartedAt=now();
    var elapsed=now()-retryStartedAt;
    if(elapsed>=DATA_WAIT_TIMEOUT_MS){
      // One final synchronized read decides between confirmed empty and ready.
      retryTimer=setTimeout(function(){renderSmartReady(tab,reason||'readiness-final-check',true);},250);
      return;
    }
    retryCount++;
    var delay=Math.min(350+retryCount*125,1500);
    retryTimer=setTimeout(function(){renderSmartReady(tab,reason||'readiness-retry',true);},delay);
  }
  function renderSmartReady(tab,reason,forceSync){
    tab=clean(tab||activeSmartTab()||'overview')||'overview';
    clearTimeout(renderTimer);
    if(!isAuthenticated()||!smartIsOpen())return Promise.resolve(false);
    if(!retryStartedAt)retryStartedAt=now();
    if(!rowsCount()&&dataState!=='ready')showLoading();
    return silentSyncRows(!!forceSync).then(function(status){
      if(!status.confirmed){showLoading();scheduleRetry(tab,reason);return false;}
      clearRetry();
      try{
        if(typeof window.renderSmartReports==='function')window.renderSmartReports(tab);
        requestAnimationFrame(function(){setSmartTabSafe(tab);});
        try{if(window.PETATOENavigationState&&typeof window.PETATOENavigationState.save==='function')window.PETATOENavigationState.save(reason||'smart-ready-render');}catch(_e){}
        return true;
      }catch(e){try{console.error('[PETATOE Smart] render failed',e);}catch(_e){}return false;}
    });
  }
  function scheduleSmartRender(tab,delay,reason,forceSync){
    clearTimeout(renderTimer);
    renderTimer=setTimeout(function(){renderTimer=null;renderSmartReady(tab,reason,forceSync);},delay==null?80:delay);
  }
  function openSmartReports(tab,event){
    try{if(event&&event.preventDefault)event.preventDefault();}catch(_e){}
    tab=clean(tab||'overview')||'overview';
    try{
      if(window.PETATOERouter&&typeof window.PETATOERouter.openTab==='function')window.PETATOERouter.openTab('smart',tab);
      else if(window.tab)window.tab('smart');
    }catch(e){try{console.warn('[PETATOE Smart] route open skipped',e);}catch(_e){}}
    clearRetry();retryStartedAt=now();
    rememberRows(runtimeRows());
    if(!rowsCount()&&dataState!=='ready')showLoading();
    scheduleSmartRender(tab,80,'header-smart-open',false);
    return false;
  }

  window.PETATOEOpenSmartReports=openSmartReports;
  window.PETATOESmartReportsReadyRender=renderSmartReady;
  window.PETATOESmartReportsDataReadiness={
    state:function(){return{state:dataState,rows:rowsCount(),lastValidRows:lastValidRows.length,retryCount:retryCount,waitingSince:retryStartedAt||null};},
    isConfirmed:function(){return dataState==='ready'||dataState==='empty';},
    hasData:function(){return rowsCount()>0||lastValidRows.length>0;}
  };

  document.addEventListener('click',function(e){
    var el=e.target&&e.target.closest&&e.target.closest('[data-pet-action="smart-refresh"]');
    if(!el)return;
    e.preventDefault();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    rememberRows(runtimeRows());
    dataState=rowsCount()?'ready':'unknown';
    clearRetry();retryStartedAt=now();
    openSmartReports(activeSmartTab()||'overview',e);
    return false;
  },true);

  document.addEventListener('petatoe:tabchange',function(e){
    var d=e.detail||{};
    if(d.tabId!=='smart')return;
    var tab=clean(d.smartOpen||activeSmartTab()||'overview')||'overview';
    rememberRows(runtimeRows());
    clearRetry();retryStartedAt=now();
    if(!rowsCount()&&dataState!=='ready')showLoading();
    scheduleSmartRender(tab,rowsCount()?80:180,'smart-tabchange',false);
  });

  document.addEventListener('petatoe:userchanged',function(e){
    var user=e&&e.detail&&e.detail.user;
    if(!user){dataState='unknown';lastValidRows=[];clearRetry();clearTimeout(renderTimer);return;}
    if(smartIsOpen()){
      clearRetry();retryStartedAt=now();
      scheduleSmartRender(activeSmartTab(),150,'auth-restored-smart-refresh',true);
    }
  });

  window.addEventListener('petatoe:records-changed',function(){
    var rows=runtimeRows();
    if(rows.length){rememberRows(rows);dataState='ready';clearRetry();}
    try{if(smartIsOpen()&&isAuthenticated()&&rows.length)scheduleSmartRender(activeSmartTab(),80,'records-changed',false);}catch(_e){}
  });
})();
