// PETATOE v5.1.66 Phase 4.3: targeted QA helper for Heatmap, Vehicle Efficiency, One-Time/Recurring, At-Risk customers.
(function(){
  'use strict';
  function safeCount(v){return Array.isArray(v)?v.length:0;}
  window.PETATOEPhase43ReportsAudit=function(){
    var heatOverlay=!!document.getElementById('heatCalendarOverlay');
    var vehicleBody=document.getElementById('smartVehicleEfficiencyBody');
    var newReturning=window.PETATOENewReturningDetails||{};
    var atRisk=window.PETATOEAtRiskClients||[];
    var result={
      heatmap:{year:window.smartHeatmapYear||null, vehicle:window.smartHeatmapVan||'', modalExists:heatOverlay, vehicleFilterExists:!!document.querySelector('.heatmap-vehicle-filter select')},
      vehicleEfficiency:{filterExists:!!document.querySelector('[data-report-filter="vehicle-efficiency"]'), rows:vehicleBody?vehicleBody.querySelectorAll('tr').length:0},
      oneTimeRecurring:{oneTime:safeCount(newReturning.oneTime), recurring:safeCount(newReturning.returning), detailButtons:document.querySelectorAll('#newReturningSummary [data-client-kind]').length},
      atRisk:{rows:safeCount(atRisk), visibleLimit:window.smartAtRiskLimit||10, exportAvailable:typeof window.exportSmartAtRiskClients==='function'}
    };
    window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("console.table",{source:"inline-extracted/phase4-3-audit.js",value:result});
    return result;
  };
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      try{ if(typeof closeHeatCalendar==='function') closeHeatCalendar(); }catch(err){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/phase4-3-audit.js",err);}
      try{ if(typeof window.closeSmartNewReturningList==='function') window.closeSmartNewReturningList(); }catch(err){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/phase4-3-audit.js",err);}
    }
  });
})();