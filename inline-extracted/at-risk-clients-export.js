// PETATOE v5.1.45: export Smart Reports > Overview > customers at risk list.
(function(){
  'use strict';
  function notify(msg){try{ if(typeof toast==='function') return toast(msg); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/at-risk-clients-export.js",e);} try{console.warn(msg);}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/at-risk-clients-export.js",e);}}
  function dateSafe(v){try{return v&&typeof fmtDateAr==='function'?fmtDateAr(v):(v?String(v):'')}catch(e){return v?String(v):''}}
  window.exportSmartAtRiskClients=function(){
    var rows=Array.isArray(window.PETATOEAtRiskClients)?window.PETATOEAtRiskClients:[];
    if(!rows.length){notify(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('لا توجد بيانات للتصدير'):'لا توجد بيانات للتصدير');return;}
    if(!window.XLSX){notify(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('مكتبة Excel غير متاحة'):'مكتبة Excel غير متاحة');return;}
    var data=rows.map(function(r,i){return {
      '#':i+1,
      'العميل':r.name||'',
      'آخر زيارة':r.last?dateSafe(r.last):'',
      'أيام الغياب':r.days||0,
      'عدد العمليات':r.visits||0,
      'عدد الفواتير':r.invoices||0,
      'إجمالي الإنفاق':+(r.value||0),
      'السيارات':r.vans||'',
      'طرق الدفع':r.pays||''
    };});
    var ws=XLSX.utils.json_to_sheet(data);
    ws['!cols']=[{wch:6},{wch:34},{wch:16},{wch:12},{wch:14},{wch:14},{wch:18},{wch:28},{wch:22}];
    var wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,'At Risk Customers');
    XLSX.writeFile(wb,'PETATOE_At_Risk_Customers.xlsx');
  };
})();