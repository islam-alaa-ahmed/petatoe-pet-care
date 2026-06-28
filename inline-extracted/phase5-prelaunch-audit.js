(function(){
  if(window.PETATOEPhase5PreLaunchAudit) return;
  function visibleTextCount(rx){
    try{ return (((document.body && document.body.innerText) || '').match(rx) || []).length; }catch(e){ return -1; }
  }
  function duplicateIds(){
    var seen={}, dup=[];
    document.querySelectorAll('[id]').forEach(function(el){
      var id=el.id;
      if(seen[id]){ if(dup.indexOf(id)===-1) dup.push(id); }
      else seen[id]=1;
    });
    return dup;
  }
  window.PETATOEPhase5PreLaunchAudit=function(){
    var result={
      timestamp:new Date().toISOString(),
      smartReportsRoot:!!document.getElementById('smartReportsCenter'),
      smartTabs:document.querySelectorAll('[data-smart-tab]').length,
      smartSections:document.querySelectorAll('[data-smart-section]').length,
      duplicateIds:duplicateIds(),
      visibleUndefined:visibleTextCount(/undefined/i),
      visibleNaN:visibleTextCount(/\bNaN\b/i),
      printHelpers:{exportPagePDF:typeof window.exportPagePDF,exportData:typeof window.exportData,XLSX:typeof window.XLSX},
      phaseHelpers:{phase41:typeof window.PETATOEPhase41FiltersAudit,phase42:typeof window.PETATOEPhase42ExportAudit,phase43:typeof window.PETATOEPhase43ReportsAudit,phase44:typeof window.PETATOEPhase44FinalAudit}
    };
    result.ok = result.smartReportsRoot && result.visibleUndefined===0 && result.visibleNaN===0;
    try{ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("console.table",{source:"inline-extracted/phase5-prelaunch-audit.js",value:result}); }catch(e){ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"inline-extracted/phase5-prelaunch-audit.js",value:result}); }
    return result;
  };
})();