/* PETATOE v3.11.41 - Excel Export Audit Hardening
   Ensures exports never break when XLSX CDN is unavailable and CSV fallback contains the same filtered rows. */
(function(){
  'use strict';
  var ns = window.PETATOEExport;
  ns.safeSheetName = function(name){
    var out = String(name || 'Report').replace(/[\/\?\*\[\]:]/g,'_').trim() || 'Report';
    return out.slice(0,31);
  };
  ns.excelRows = function(rows, filename, sheetName){
    rows = Array.isArray(rows) ? rows : [];
    filename = ns.safeName(filename || 'PETATOE_Report') + '.xlsx';
    if(window.XLSX && XLSX.utils && !window.__PETATOE_XLSX_STUB__){
      var wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), ns.safeSheetName(sheetName));
      XLSX.writeFile(wb, filename);
    }else{
      ns.downloadText(ns.rowsToCsv(rows), filename.replace(/\.xlsx$/i,'.csv'), 'text/csv;charset=utf-8');
      ns.notify && ns.notify('تم تصدير CSV بديل لأن مكتبة Excel غير متاحة.');
    }
  };
  ns.excelTable = function(table, filename, sheetName){
    var rows = ns.tableToRows(table);
    if(!rows.length){ ns.notify && ns.notify('لا توجد بيانات للتصدير'); return; }
    return ns.excelRows(rows, filename, sheetName);
  };
  ns.excelWorkbook = function(sheets, filename){
    sheets = Array.isArray(sheets) ? sheets : [];
    filename = ns.safeName(filename || 'PETATOE_Report') + '.xlsx';
    if(window.XLSX && XLSX.utils && !window.__PETATOE_XLSX_STUB__){
      var wb = XLSX.utils.book_new();
      sheets.forEach(function(sh){
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sh.rows || []), ns.safeSheetName(sh.name));
      });
      XLSX.writeFile(wb, filename);
    }else{
      var text = '\ufeff' + sheets.map(function(sh){
        return '### '+ns.safeSheetName(sh.name)+' ###\n' + ns.rowsToCsv(sh.rows || []).replace(/^\ufeff/,'');
      }).join('\n\n');
      ns.downloadText(text, filename.replace(/\.xlsx$/i,'_fallback.txt'), 'text/plain;charset=utf-8');
      ns.notify && ns.notify('تم تصدير TXT/CSV بديل لأن مكتبة Excel غير متاحة.');
    }
  };
  ns.excel = function(options){
    if(typeof options === 'function' || (typeof options === 'string' && typeof window[options] === 'function')) return ns.runLegacy(options);
    options = options || {};
    if(options.sheets) return ns.excelWorkbook(options.sheets, options.filename || options.title);
    if(options.rows) return ns.excelRows(options.rows, options.filename || options.title, options.sheetName);
    return ns.excelTable(options.table || options.target || options.selector, options.filename || options.title, options.sheetName);
  };
})();
