/* PETATOE v3.10.3 - Export Engine
   Public API facade for future reports. Legacy export functions remain untouched. */
(function(){
  'use strict';
  var ns = window.PETATOEExport;
  ns.exportReport = function(config){
    config = config || {};
    var type = String(config.type || '').toLowerCase();
    if(type === 'pdf') return ns.pdf(config);
    if(type === 'print') return ns.print(config);
    if(type === 'excel' || type === 'xlsx' || type === 'csv') return ns.excel(config);
    ns.notify && ns.notify(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('نوع التصدير غير معروف'):'نوع التصدير غير معروف');
  };
  ns.attachButtons = function(scope){
    var root = ns.getNode ? (ns.getNode(scope) || document) : document;
    if(!root || root.__petExportDelegateBound) return;
    root.__petExportDelegateBound = true;
    root.addEventListener('click', function(ev){
      var btn = ev.target && ev.target.closest ? ev.target.closest('[data-export-type]') : null;
      if(!btn || (root !== document && !root.contains(btn))) return;
      ns.exportReport({
        type: btn.getAttribute('data-export-type'),
        target: btn.getAttribute('data-export-target') || btn.closest('.card,.panel,section') || document.body,
        filename: btn.getAttribute('data-export-filename') || document.title || 'PETATOE_Report',
        title: btn.getAttribute('data-export-title') || document.title || 'PETATOE Report'
      });
    });
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){ns.attachButtons();}, {once:true});
  else ns.attachButtons();
})();
