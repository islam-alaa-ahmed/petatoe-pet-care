/* PETATOE v3.10.3 - PDF Export
   Uses the print pipeline as the safe browser-native PDF path. */
(function(){
  'use strict';
  var ns = window.PETATOEExport;
  ns.pdfNode = function(options){
    options = options || {};
    options.title = options.title || 'PETATOE PDF Report';
    return ns.printNode ? ns.printNode(options) : ns.runLegacy(options.legacy);
  };
  ns.pdf = function(options){
    if(typeof options === 'function' || (typeof options === 'string' && typeof window[options] === 'function')) return ns.runLegacy(options);
    return ns.pdfNode(options || {});
  };
})();
