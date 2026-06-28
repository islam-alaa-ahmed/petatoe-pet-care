// PETATOE v5.1.67 Phase 4.4: final production hardening audit helper. Non-invasive runtime checks only.
(function(){
  'use strict';
  function textOf(el){return (el && el.textContent ? el.textContent : '').trim();}
  function visible(el){
    if(!el) return false;
    var st=window.getComputedStyle ? getComputedStyle(el) : null;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && (!st || (st.display!=='none' && st.visibility!=='hidden'));
  }
  function countVisibleText(pattern){
    var rx=pattern instanceof RegExp ? pattern : new RegExp(String(pattern),'i');
    return Array.from(document.querySelectorAll('body *')).filter(function(el){
      var children=el.children ? el.children.length : 0;
      return children===0 && visible(el) && rx.test(textOf(el));
    }).length;
  }
  function duplicateIds(){
    var seen={}, dup=[];
    Array.from(document.querySelectorAll('[id]')).forEach(function(el){
      var id=el.id;
      if(seen[id] && dup.indexOf(id)===-1) dup.push(id);
      seen[id]=true;
    });
    return dup;
  }
  window.PETATOEPhase44FinalAudit=function(){
    var result={
      ok:true,
      duplicateIds:duplicateIds(),
      visibleUndefined:countVisibleText(/undefined/i),
      visibleNaN:countVisibleText(/\bNaN\b/i),
      smartReportsRootExists:!!document.getElementById('smartReportsCenter'),
      smartTabs:document.querySelectorAll('[data-smart-tab],.smart-pill').length,
      activeElements:document.querySelectorAll('.active').length,
      exportPagePdf:typeof window.exportPagePDF==='function' || typeof window.petatoeOpenPdfModal==='function',
      xlsxLoaded:!!window.XLSX,
      phaseHelpers:{
        phase41:typeof window.PETATOEPhase41FiltersAudit==='function',
        phase42:typeof window.PETATOEPhase42ExportAudit==='function',
        phase43:typeof window.PETATOEPhase43ReportsAudit==='function'
      }
    };
    result.ok = result.duplicateIds.length===0 && result.visibleUndefined===0 && result.visibleNaN===0;
    try{ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("console.table",{source:"inline-extracted/phase4-4-audit.js",value:result}); }catch(e){ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"inline-extracted/phase4-4-audit.js",value:result}); }
    return result;
  };
})();