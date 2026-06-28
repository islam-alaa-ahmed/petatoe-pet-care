/* PETATOE v6.5.5 External Library Guard
   Runtime guards for optional external libraries (Chart.js / XLSX).
   Goal: opening tabs and pressing export/import/PDF/Excel buttons must not throw when CDN is unavailable.
   Excel fallback now exports useful CSV/TXT data instead of a placeholder JSON file.
*/
(function(){
  'use strict';
  if(window.PETATOERuntimeLibrariesGuard && window.PETATOERuntimeLibrariesGuard.__ready && window.PETATOERuntimeLibrariesGuard.stage >= 2) return;
  function notify(msg){
    try{ if(typeof window.toast==='function') return window.toast(msg); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/runtime-libraries-guard.js",e);}
    try{ console.warn(msg); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/runtime-libraries-guard.js",e);}
  }
  function safeName(name){
    return String(name || 'PETATOE_export')
      .replace(/[\\/:*?"<>|]+/g,'_')
      .replace(/\s+/g,'_')
      .slice(0,120) || 'PETATOE_export';
  }
  function downloadText(text, filename, mime){
    try{
      var blob=new Blob([text],{type:mime || 'text/plain;charset=utf-8'});
      var a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download=filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function(){try{URL.revokeObjectURL(a.href)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/runtime-libraries-guard.js",e);}},1000);
      return true;
    }catch(e){
      console.error('[PETATOE Runtime Guard] fallback download failed', e);
      return false;
    }
  }
  function cell(v){
    if(v == null) return '';
    if(typeof v === 'object'){
      try{ v = JSON.stringify(v); }catch(e){ v = String(v); }
    }
    v=String(v).replace(/\r?\n/g,' ').replace(/"/g,'""');
    return /[",;\n]/.test(v) ? '"'+v+'"' : v;
  }
  function rowsToCsv(rows){
    rows = Array.isArray(rows) ? rows : [];
    return '\ufeff' + rows.map(function(row){
      return (Array.isArray(row) ? row : [row]).map(cell).join(',');
    }).join('\n');
  }
  function jsonRowsToSheet(rows){
    rows = Array.isArray(rows) ? rows : [];
    var keys=[];
    rows.forEach(function(r){
      if(r && typeof r === 'object' && !Array.isArray(r)){
        Object.keys(r).forEach(function(k){ if(keys.indexOf(k) === -1) keys.push(k); });
      }
    });
    if(!keys.length) return {__petatoeRows:rows.map(function(r){return Array.isArray(r)?r:[r];})};
    return {__petatoeRows:[keys].concat(rows.map(function(r){return keys.map(function(k){return r ? r[k] : '';});}))};
  }
  function sheetRows(ws){
    if(!ws) return [];
    if(Array.isArray(ws.__petatoeRows)) return ws.__petatoeRows;
    return [];
  }
  function workbookToText(wb){
    if(!wb || !Array.isArray(wb.SheetNames) || !wb.SheetNames.length) return '';
    if(wb.SheetNames.length === 1){
      return rowsToCsv(sheetRows(wb.Sheets && wb.Sheets[wb.SheetNames[0]]));
    }
    return '\ufeff' + wb.SheetNames.map(function(name){
      return '### '+name+' ###\n' + rowsToCsv(sheetRows(wb.Sheets && wb.Sheets[name])).replace(/^\ufeff/,'');
    }).join('\n\n');
  }
  if(!window.Chart){
    var StubChart=function(){ this.__petatoeStub=true; };
    StubChart.prototype.destroy=function(){};
    StubChart.prototype.resize=function(){};
    StubChart.prototype.update=function(){};
    window.Chart=StubChart;
    window.__PETATOE_CHART_STUB__=true;
  }
  if(!window.XLSX){
    var utils={
      aoa_to_sheet:function(rows){return {__petatoeRows:Array.isArray(rows)?rows:[]};},
      json_to_sheet:jsonRowsToSheet,
      sheet_to_json:function(){notify('مكتبة Excel غير متاحة حالياً، لا يمكن قراءة ملف Excel.'); return [];},
      book_new:function(){return {SheetNames:[],Sheets:{}};},
      book_append_sheet:function(wb,ws,name){
        if(!wb.SheetNames) wb.SheetNames=[];
        if(!wb.Sheets) wb.Sheets={};
        name=String(name||'Sheet1').slice(0,31)||'Sheet1';
        var base=name, i=2;
        while(wb.Sheets[name]){ name=String(base).slice(0,28)+'_'+(i++); }
        wb.SheetNames.push(name);
        wb.Sheets[name]=ws||{};
      }
    };
    window.XLSX={
      utils:utils,
      read:function(){notify('مكتبة Excel غير متاحة حالياً، لا يمكن قراءة الملف.'); return {SheetNames:[],Sheets:{}};},
      writeFile:function(wb,filename){
        var outName=safeName(String(filename||'PETATOE_export.xlsx').replace(/\.xlsx$/i,''));
        var multi=wb && Array.isArray(wb.SheetNames) && wb.SheetNames.length>1;
        var text=workbookToText(wb);
        if(!text) text='\ufeffلا توجد بيانات للتصدير';
        downloadText(text, outName + (multi ? '_fallback.txt' : '_fallback.csv'), multi ? 'text/plain;charset=utf-8' : 'text/csv;charset=utf-8');
        notify('مكتبة Excel غير متاحة، تم تصدير نسخة CSV بديلة بدون كسر الصفحة.');
      }
    };
    window.__PETATOE_XLSX_STUB__=true;
  }
  window.PETATOERuntimeLibrariesGuard={__ready:true, stage:3, version:'v6.5.5', chartStub:!!window.__PETATOE_CHART_STUB__, xlsxStub:!!window.__PETATOE_XLSX_STUB__, chartPresent:!!window.Chart, xlsxPresent:!!window.XLSX, getSnapshot:function(){return {ready:true, stage:3, version:'v6.5.5', chartPresent:!!window.Chart, xlsxPresent:!!window.XLSX, chartStub:!!window.__PETATOE_CHART_STUB__, xlsxStub:!!window.__PETATOE_XLSX_STUB__};}};
})();
