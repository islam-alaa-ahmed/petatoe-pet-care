/* PETATOE v9 ELC Phase 6A - Dashboard runtime migration pilot */
(function(){
  'use strict';
  var stats={version:'9.0.0-elc-phase6a',applyCount:0,renderCount:0,lastApplyMs:0,lastRenderMs:0,lastSource:null,lastLanguage:null,lastError:null};
  function now(){return window.performance&&performance.now?performance.now():Date.now();}
  function root(){return document.getElementById('dashboard');}
  function applyDashboard(){
    var el=root();if(!el)return false;var start=now();
    try{
      if(window.PETATOE_I18N&&window.PETATOE_I18N.applySubtree)window.PETATOE_I18N.applySubtree(el);
      stats.applyCount++;stats.lastApplyMs=Math.max(0,Math.round(now()-start));
      var center=window.PETATOE_LOCALIZATION_CENTER,status=center&&center.getStatus?center.getStatus():null;
      stats.lastSource=status&&status.loader?status.loader.source:null;
      stats.lastLanguage=status?status.currentLanguage:null;stats.lastError=null;return true;
    }catch(error){stats.lastError=error&&error.message?error.message:String(error);return false;}
  }
  function rerenderDashboardVisuals(){
    if(typeof window.renderDashboardAll!=='function'||!root())return false;
    var start=now();
    try{window.renderDashboardAll();stats.renderCount++;stats.lastRenderMs=Math.max(0,Math.round(now()-start));stats.lastError=null;return true;}
    catch(error){stats.lastError=error&&error.message?error.message:String(error);console.warn('[PETATOE ELC Phase 6A] Dashboard visual rerender skipped.',error);return false;}
  }
  function synchronize(options){options=options||{};applyDashboard();if(options.rerender!==false)rerenderDashboardVisuals();applyDashboard();return Object.assign({},stats);}
  window.addEventListener('petatoe:localization-ready',function(){synchronize({rerender:true});});
  window.addEventListener('petatoe:language-changed',function(){synchronize({rerender:true});});
  document.addEventListener('petatoe:tabchange',function(event){if(!event||!event.detail||event.detail.tab==='dashboard')applyDashboard();});
  window.PETATOE_DASHBOARD_LOCALIZATION_PILOT={version:stats.version,synchronize:synchronize,getStatus:function(){return Object.assign({},stats);}};
  window.petatoeDashboardLocalizationStatus=function(){return {pilot:Object.assign({},stats),localization:window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.getStatus?window.PETATOE_LOCALIZATION_CENTER.getStatus():null};};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){applyDashboard();},{once:true});else applyDashboard();
})();
