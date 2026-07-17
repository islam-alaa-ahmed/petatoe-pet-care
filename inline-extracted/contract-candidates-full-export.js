// PETATOE v5.1.76 - Contract candidates export uses the full report dataset, not only visible rows.
(function(){
  function petatoeOpenPrintHtml(html, features){try{var blob=new Blob([String(html||'')],{type:'text/html;charset=utf-8'});var url=URL.createObjectURL(blob);var w=window.open(url,'_blank',features||'width=1100,height=850');if(w)setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('inline-extracted/contract-candidates-full-export.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('inline-extracted/contract-candidates-full-export.js',_petatoeSilentCatch);}}},60000);return w;}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('inline-extracted/contract-candidates-full-export.js',e);return null;}}

  'use strict';
  function contractExportRows(){
    var rows = Array.isArray(window.__petatoeContractCandidateDetails) ? window.__petatoeContractCandidateDetails : [];
    return rows.map(function(x, i){
      return {
        '#': i + 1,
        'العميل': x.name || '—',
        'إجمالي الإنفاق': Number(x.value || 0),
        'عدد الزيارات': Number(x.visits || 0),
        'شهور النشاط': Number(x.months || 0),
        'آخر زيارة': x.lastDate || '—',
        'أيام الغياب': Number(x.days || 0),
        'Score': Number(x.score || 0),
        'التوصية': x.recommendation || '—',
        'وصف التوصية': x.recommendationDesc || '—',
        'تصنيف العميل': x.tier || '—',
        'متوسط الفاتورة': Number(x.avgInvoice || 0),
        'قيمة آخر فاتورة': Number(x.lastInvoiceValue || 0),
        'سبب الترشيح': x.reason || ''
      };
    });
  }
  window.petatoeExportContractCandidatesExcel=function(){
    var rows = contractExportRows();
    if(!rows.length){
      try{ toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('لا توجد بيانات للتصدير'):'لا توجد بيانات للتصدير'); }catch(e){ alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('لا توجد بيانات للتصدير'):'لا توجد بيانات للتصدير'); }
      return;
    }
    if(!window.XLSX){
      try{ toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('مكتبة Excel غير محملة'):'مكتبة Excel غير محملة'); }catch(e){ alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('مكتبة Excel غير محملة'):'مكتبة Excel غير محملة'); }
      return;
    }
    var ws = XLSX.utils.json_to_sheet(rows);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Contract Candidates');
    XLSX.writeFile(wb, 'PETATOE_Contract_Candidates_All.xlsx');
  };
  window.petatoeExportContractCandidatesPdf=function(){
    var rows = contractExportRows();
    if(!rows.length){
      try{ toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('لا توجد بيانات للطباعة'):'لا توجد بيانات للطباعة'); }catch(e){ alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('لا توجد بيانات للطباعة'):'لا توجد بيانات للطباعة'); }
      return;
    }
    var esc = function(v){
      return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});
    };
    var moneyCell=function(v){
      var n=Number(v||0);
      try{return 'SAR '+n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}catch(e){return 'SAR '+n;}
    };
    var body = rows.map(function(r){
      return '<tr>'+
        '<td>'+esc(r['#'])+'</td>'+
        '<td>'+esc(r['العميل'])+'</td>'+
        '<td>'+moneyCell(r['إجمالي الإنفاق'])+'</td>'+
        '<td>'+esc(r['عدد الزيارات'])+'</td>'+
        '<td>'+esc(r['شهور النشاط'])+'</td>'+
        '<td>'+esc(r['آخر زيارة'])+'</td>'+
        '<td>'+esc(r['أيام الغياب'])+'</td>'+
        '<td>'+esc(r['Score'])+'</td>'+
        '<td>'+esc(r['التوصية'])+'</td>'+
        '<td>'+esc(r['تصنيف العميل'])+'</td>'+
      '</tr>';
    }).join('');
    var html='<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>عملاء مرشحون لعمل عقود معهم</title><style>'+ 
      '@page{size:A4 landscape;margin:10mm}body{font-family:Cairo,Arial,sans-serif;background:#071221;color:#eaf2ff}'+
      'h1{font-size:22px;margin:0 0 8px;text-align:right}p{margin:0 0 12px;color:#b7c4d8}table{width:100%;border-collapse:collapse;background:#0f1b2d;border-radius:12px;overflow:hidden}'+
      'th{background:#55758e;color:#fff;font-weight:900;padding:9px;border:1px solid rgba(255,255,255,.16)}td{padding:8px;border:1px solid rgba(255,255,255,.10);font-size:11px}'+
      'tr:nth-child(even) td{background:rgba(255,255,255,.03)}.meta{display:flex;gap:12px;margin-bottom:10px}.pill{border:1px solid rgba(0,229,255,.5);border-radius:999px;padding:6px 12px;background:rgba(0,229,255,.09)}'+
      '</style></head><body><h1>⭐ عملاء مرشحون لعمل عقود معهم</h1><p>تصدير كامل بيانات العملاء المرشحين، بغض النظر عن عدد الصفوف المعروضة داخل الشاشة.</p><div class="meta"><span class="pill">إجمالي العملاء: '+rows.length+'</span></div><table><thead><tr><th>#</th><th>العميل</th><th>إجمالي الإنفاق</th><th>عدد الزيارات</th><th>شهور النشاط</th><th>آخر زيارة</th><th>أيام الغياب</th><th>Score</th><th>التوصية</th><th>تصنيف العميل</th></tr></thead><tbody>'+body+'</tbody></table><script>window.onload=function(){setTimeout(function(){window.print()},250)}<\/script></body></html>';
    var w=petatoeOpenPrintHtml(html,'width=1100,height=850');
    if(!w){ try{toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('المتصفح منع نافذة الطباعة'):'المتصفح منع نافذة الطباعة');}catch(e){alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('المتصفح منع نافذة الطباعة'):'المتصفح منع نافذة الطباعة');} return; }
  };
  window.PETATOEContractCandidatesExportAudit=function(){
    var visible=document.querySelectorAll('#contractCandidatesTable tbody tr').length;
    var full=Array.isArray(window.__petatoeContractCandidateDetails)?window.__petatoeContractCandidateDetails.length:0;
    var result={visibleRows:visible, exportRows:full, exportsFullDataset:full>=visible, excelFunction:typeof window.petatoeExportContractCandidatesExcel, pdfFunction:typeof window.petatoeExportContractCandidatesPdf};
    try{window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("console.table",{source:"inline-extracted/contract-candidates-full-export.js",value:result});}catch(e){window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"inline-extracted/contract-candidates-full-export.js",value:result});}
    return result;
  };
})();

function PETATOEAdvancedQuarterButtonsAudit(){
  return {
    reportQuarterTaxMode: reportQuarterTaxMode,
    reportMode: reportMode,
    hasQuarterChart: !!document.getElementById('reportQuarterChart'),
    buttons: Array.from(document.querySelectorAll('.advanced-tax-actions .metric-chip')).map(function(b){return {text:b.textContent.trim(), active:b.classList.contains('active')}}),
    tooltipDisabledForQuarterChart: true
  };
}