/* PETATOE v6.4.174 - Smart Reports Final Integration & Regression Guard (B5)
   Purpose: non-invasive integration validator for Smart Reports modular architecture.
   No UI changes, no data source changes. */
(function(){
  'use strict';
  if(window.__PETATOE_SMART_INTEGRATION_B5__) return;
  window.__PETATOE_SMART_INTEGRATION_B5__ = true;

  function now(){ try{return (performance&&performance.now)?performance.now():Date.now();}catch(e){return Date.now();} }
  function ok(name, pass, details){ return {name:name, status:pass?'OK':'FAIL', details:details||''}; }
  function warn(name, pass, details){ return {name:name, status:pass?'OK':'WARN', details:details||''}; }
  function scriptList(){
    return Array.prototype.slice.call(document.scripts||[]).map(function(s){ return s.getAttribute('src')||''; }).filter(Boolean);
  }
  function countBy(arr){
    var m=Object.create(null); arr.forEach(function(x){m[x]=(m[x]||0)+1;}); return m;
  }
  function smartScripts(){ return scriptList().filter(function(s){return s.indexOf('smart/')!==-1;}); }
  function duplicateSmartScripts(){
    var map=countBy(smartScripts());
    return Object.keys(map).filter(function(k){return map[k]>1;}).map(function(k){return {src:k,count:map[k]};});
  }
  function hasFn(path){
    var cur=window;
    var parts=String(path).split('.');
    for(var i=0;i<parts.length;i++){ cur=cur&&cur[parts[i]]; }
    return typeof cur === 'function';
  }
  function hasObj(path){
    var cur=window;
    var parts=String(path).split('.');
    for(var i=0;i<parts.length;i++){ cur=cur&&cur[parts[i]]; }
    return !!cur;
  }
  function checkOrder(){
    var s=smartScripts();
    function pos(name){
      for(var i=0;i<s.length;i++){ if(s[i].indexOf(name)!==-1) return i; }
      return -1;
    }
    var data=pos('smart-data-engine.js');
    var services=pos('smart-services.js');
    var vehicles=pos('smart-vehicles.js');
    var customers=pos('smart-customers.js');
    var core=pos('smart-reports-core.js');
    var router=pos('smart-router.js');
    return {
      order:{data:data,services:services,vehicles:vehicles,customers:customers,core:core,router:router},
      pass:data>-1 && services>-1 && vehicles>-1 && customers>-1 && core>-1 && router>-1 && data<services && services<core && vehicles<core && customers<core && core<router
    };
  }
  function getRows(){
    try{
      if(typeof window.petatoeSmartReportsRows === 'function'){
        var r0=window.petatoeSmartReportsRows();
        if(Array.isArray(r0)) return r0;
      }
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-integration.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    try{
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.getRecordsSync === 'function'){
        var r1=window.PETATOEDataSource.getRecordsSync();
        if(Array.isArray(r1)) return r1;
      }
    }catch(e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('smart/smart-integration.js', e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }
    return Array.isArray(window.records)?window.records:[];
  }
  function chartStats(){
    var charts=window.charts||{};
    var keys=Object.keys(charts);
    var alive=0, broken=0;
    keys.forEach(function(k){
      var c=charts[k];
      if(c && c.canvas && c.ctx) alive++; else if(c) broken++;
    });
    return {keys:keys.length,alive:alive,broken:broken};
  }
  function runIntegrationCheck(options){
    var start=now();
    var rows=getRows();
    var checks=[];
    var dup=duplicateSmartScripts();
    var order=checkOrder();
    checks.push(ok('Smart scripts are not duplicated', dup.length===0, dup.length?dup:''));
    checks.push(ok('Smart script load order is valid', !!order.pass, order.order));
    checks.push(ok('Smart Data Engine is available', hasObj('PETATOESmartDataEngine') || hasObj('PETATOE.SmartDataEngine'), 'PETATOESmartDataEngine'));
    checks.push(ok('Smart Router is available', hasFn('petatoeSmartRouteReport') || hasFn('PETATOE.SmartReports.route'), 'petatoeSmartRouteReport'));
    checks.push(ok('Services module renderer is available', hasFn('renderSmartServicesReport'), 'renderSmartServicesReport'));
    checks.push(ok('Vehicles module renderer is available', hasFn('renderSmartVans'), 'renderSmartVans'));
    checks.push(ok('Customers module renderer is available', hasFn('renderSmartCustomers'), 'renderSmartCustomers'));
    checks.push(warn('Invoice data source is readable', Array.isArray(rows), rows.length+' rows'));
    var charts=chartStats();
    checks.push(warn('Charts registry has no broken chart handles', charts.broken===0, charts));

    var engineMs=null;
    try{
      if(window.PETATOESmartDataEngine && typeof window.PETATOESmartDataEngine.buildSmartData === 'function'){
        var t=now();
        window.PETATOESmartDataEngine.buildSmartData(rows,{audit:true});
        engineMs=+(now()-t).toFixed(2);
      }
    }catch(e){ checks.push(ok('Smart Data Engine build smoke test', false, e && e.message)); }
    if(engineMs!==null) checks.push(warn('Smart Data Engine build smoke test', true, engineMs+'ms'));

    var failed=checks.filter(function(x){return x.status==='FAIL';});
    var warnings=checks.filter(function(x){return x.status==='WARN';});
    var report={
      version:'v6.4.174-B5',
      generatedAt:new Date().toISOString(),
      elapsedMs:+(now()-start).toFixed(2),
      rows:rows.length,
      checks:checks,
      failed:failed.length,
      warnings:warnings.length,
      recommendation: failed.length ? 'راجع عناصر FAIL قبل اعتماد النسخة.' : 'B5 Integration OK - يمكن تنفيذ اختبار Regression يدوي للتقارير.'
    };
    window.__PETATOE_SMART_INTEGRATION_LAST_REPORT__=report;
    if(!options || options.log!==false){
      try{
        console.groupCollapsed('%cPETATOE Smart Reports Integration B5','color:#7c3aed;font-weight:bold');
        console.table(checks.map(function(c){return {check:c.name,status:c.status,details:typeof c.details==='string'?c.details:JSON.stringify(c.details)};}));
        window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"smart/smart-integration.js",value:report});
        console.groupEnd();
      }catch(e){ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"smart/smart-integration.js",value:report}); }
    }
    return report;
  }
  window.petatoeSmartIntegrationCheck = runIntegrationCheck;
  window.petatoeSmartRegressionChecklist = function(){
    return [
      'تحليل الخدمات: فلاتر السنة/الترتيب + عرض المزيد + الشارت',
      'تحليل السيارات: فلاتر السنوات + الشارتات + جدول التفاصيل',
      'تحليل العملاء: سرعة الفتح + فلاتر السنة/الشهر',
      'متابعة العملاء الجدد: الشهر الافتراضي + الشارت الأسبوعي + عرض المزيد',
      'متابعة نشاط العملاء: جدول العملاء غير النشطين + الفلاتر',
      'التنقل بين الخدمات/السيارات/العملاء بدون اختفاء بيانات أو Console Errors'
    ];
  };
})();
