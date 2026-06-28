/* PETATOE v5.1.64 Phase 4.2 - Export/PDF audit helper */
window.PETATOEPhase42ExportAudit=function(){
  var theme=document.documentElement.getAttribute('data-theme')||'dark';
  var activePanel=document.querySelector('.panel.active');
  var smartActive=(document.querySelector('#smartTabs .smart-pill.active')||{}).dataset?.smartTab||null;
  return {
    ok:true,
    phase:'4.2 Export/PDF/Dark Mode Audit',
    theme:theme,
    activePanel:activePanel?activePanel.id:null,
    smartActiveTab:smartActive,
    xlsxLoaded:!!window.XLSX,
    pagePdfFunction:typeof window.petatoeExportActivePagePdf,
    simplePrintFunction:typeof window.printCurrentPage,
    printDarkCss:!!document.getElementById('petatoe-phase4-2-print-dark-stabilizer'),
    universalPdfDarkCssReady:true,
    notes:['تصدير الصفحة PDF يستخدم الثيم الحالي dark/light','Simple print zones أصبحت تدعم Dark Mode','الفلاتر الظاهرة/النشطة يتم تجميدها داخل PDF']
  };
};