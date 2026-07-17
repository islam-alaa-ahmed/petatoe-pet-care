/* PETATOE v6.1.118 - Export Print
   Commission Statement print/PDF has a dedicated print-only executive layout.
   Runtime screen, filters, calculations and data are not changed. */
(function(){
  'use strict';
  var ns = window.PETATOEExport;
  function esc(v){ return ns && ns.escapeHtml ? ns.escapeHtml(v == null ? '' : v) : String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }

  function captureSilentCatch(scope, error){
    try{
      if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
        window.PETATOEDiagnostics.captureSilentCatch('components/export/export-print.js', error, {scope: scope || 'export-print'});
        return;
      }
      if(window.PETATOEUtils && typeof window.PETATOEUtils.warnSilentCatch === 'function'){
        window.PETATOEUtils.warnSilentCatch('components/export/export-print.js', error);
      }
    }catch(_diagErr){ return; }
  }

  function openPrintHtml(html, features){
    try{
      var blob = new Blob([String(html || '')], {type:'text/html;charset=utf-8'});
      var url = URL.createObjectURL(blob);
      var w = window.open(url, '_blank', features || 'width=1100,height=800');
      if(w){ setTimeout(function(){ try{ URL.revokeObjectURL(url); }catch(_revokeErr){ captureSilentCatch('openPrintHtml.revokeObjectURL', _revokeErr); } }, 60000); }
      return w;
    }catch(_openErr){
      captureSilentCatch('openPrintHtml', _openErr);
      return null;
    }
  }

  function currentTheme(){
    try{
      if(window.PETATOETheme && typeof window.PETATOETheme.current === 'function') return window.PETATOETheme.current() === 'light' ? 'light' : 'dark';
    }catch(_e){ captureSilentCatch('currentTheme', _e); }
    var t = (document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme') || 'dark').toLowerCase();
    return t === 'light' ? 'light' : 'dark';
  }
  function assetUrl(path){
    try{ return new URL(path, window.location.href).href; }catch(_e){ captureSilentCatch('assetUrl', _e); return path; }
  }
  function selectedLabel(id, fallback){
    var el = document.getElementById(id);
    if(!el) return fallback || '';
    var opt = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null;
    return (opt && (opt.textContent || opt.innerText) || el.value || fallback || '').trim();
  }
  function text(selector, root, fallback){
    var el = root && root.querySelector ? root.querySelector(selector) : null;
    return (el && (el.innerText || el.textContent) || fallback || '').trim();
  }
  function stamp(){
    var d = new Date();
    var date = String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + d.getFullYear();
    var time = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
    return time + ' ' + date;
  }
  function tableHtmlFrom(root){
    var table = root && root.querySelector ? root.querySelector('.com-table table') : null;
    if(!table) return '<table><tbody><tr><td>لا توجد بيانات للطباعة</td></tr></tbody></table>';
    var clone = table.cloneNode(true);
    return clone.outerHTML;
  }
  function kpisFrom(root){
    var cards = Array.prototype.slice.call(root.querySelectorAll('.com-statement-kpis .com-kpi'));
    return cards.map(function(card){
      return {
        label: text('span', card, ''),
        value: text('b', card, ''),
        note: text('small', card, '')
      };
    });
  }
  function commissionPrintHtml(target, clone, title){
    // PETATOE v6.1.119:
    // Commission Statement print/PDF must always use the Light print template,
    // even when the application is running in Dark Mode.
    // Runtime screen theme is not changed.
    var theme = 'light';
    var dark = false;
    var logo = assetUrl('img/petatoe-logo-light-transparent.png');
    var source = target || clone;
    var issue = stamp();
    var issueDate = issue.replace(/^\d{2}:\d{2}\s+/, '');
    var periodLabel = (selectedLabel('comStatementMonth','') + ' ' + selectedLabel('comStatementYear','')).trim();
    var carLabel = selectedLabel('comStatementCar','كل السيارات') || 'كل السيارات';
    var employeeLabel = selectedLabel('comStatementPerson','كل الموظفين') || 'كل الموظفين';
    var cards = kpisFrom(source);
    if(cards.length < 3){
      cards = [
        {label:'إجمالي المبيعات / الخدمات', value:'-', note:''},
        {label:'متوسط نسبة العمولة', value:'-', note:''},
        {label:'إجمالي العمولة المستحقة', value:'-', note:''}
      ];
    }
    var table = tableHtmlFrom(source);
    return '<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>'+esc(title || 'كشف العمولة')+'</title>'+
      '<style>'+commissionPrintCss()+'</style></head><body class="pet-commission-print theme-light">'+
      '<main class="pet-commission-page">'+
        '<header class="pet-commission-header">'+
          '<section class="pet-pdf-badge"><div class="pet-pdf-icon">PDF</div><div><h3>نسخة PDF</h3><span>تاريخ الإصدار</span><b>'+esc(issue)+'</b></div></section>'+
          '<section class="pet-title-block"><h1>كشف العمولة</h1><h2>COMMISSION STATEMENT</h2><div class="pet-title-line"><i></i></div></section>'+
          '<section class="pet-brand-block"><div class="pet-brand-text"><strong>PETATOE</strong><span>Commission Statement</span></div><div class="pet-logo-glass"><img src="'+esc(logo)+'" alt="PETATOE"></div></section>'+
        '</header>'+
        '<section class="pet-info-strip">'+
          '<div><span class="pet-info-icon">☷</span><small>الموظف</small><b>'+esc(employeeLabel)+'</b></div>'+
          '<div><span class="pet-info-icon">▣</span><small>السيارة</small><b>'+esc(carLabel)+'</b></div>'+
          '<div><span class="pet-info-icon">▦</span><small>الفترة</small><b>'+esc(periodLabel || 'كل الفترات')+'</b></div>'+
          '<div><span class="pet-info-icon">◷</span><small>تاريخ الإصدار</small><b>'+esc(issueDate)+'</b></div>'+
        '</section>'+
        '<section class="pet-kpi-strip">'+
          kpiHtml(cards[2] || cards[0], 'money')+
          kpiHtml(cards[1], 'percent')+
          kpiHtml(cards[0], 'sales')+
        '</section>'+
        '<section class="pet-table-section"><h3>تفاصيل العمولات <span>☷</span></h3><div class="pet-commission-table">'+table+'</div></section>'+
        '<div class="pet-watermark"><img src="'+esc(logo)+'" alt=""></div>'+
        '<footer class="pet-commission-footer"><span>Page 1 of 1</span><span>www.petatoe.com</span><span>تم إنشاء التقرير بواسطة نظام PETATOE</span></footer>'+
      '</main></body></html>';
  }
  function kpiHtml(card, type){
    var icon = type === 'percent' ? '%' : (type === 'sales' ? '🛒' : '▣');
    return '<article class="pet-kpi-card pet-kpi-'+esc(type)+'"><div class="pet-kpi-icon">'+icon+'</div><div><span>'+esc(card.label)+'</span><b>'+esc(card.value)+'</b><small>'+esc(card.note)+'</small></div></article>';
  }
  function commissionPrintCss(){
    return [
      '@page{size:A4 landscape;margin:7mm}',
      '*{box-sizing:border-box;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}',
      'html,body{margin:0;padding:0;font-family:Cairo,Tahoma,Arial,sans-serif;direction:rtl}',
      'body.theme-dark{background:#061422;color:#f8fafc}',
      'body.theme-light{background:#f8fbff;color:#0f172a}',
      '.pet-commission-page{position:relative;min-height:190mm;padding:8mm;border-radius:18px;overflow:hidden}',
      '.theme-dark .pet-commission-page{background:radial-gradient(circle at 85% 0%,rgba(56,189,248,.18),transparent 35%),linear-gradient(135deg,#061422,#0a1f35 60%,#06111d);border:1px solid rgba(148,163,184,.32);box-shadow:inset 0 0 60px rgba(56,189,248,.06)}',
      '.theme-light .pet-commission-page{background:radial-gradient(circle at 85% 0%,rgba(59,130,246,.12),transparent 35%),#fff;border:1px solid #cbd5e1;box-shadow:0 8px 24px rgba(15,23,42,.08)}',
      '.pet-commission-header{display:grid;grid-template-columns:210px 1fr 360px;gap:18px;align-items:start;direction:ltr;margin-bottom:14px}',
      '.pet-pdf-badge,.pet-logo-glass,.pet-info-strip,.pet-kpi-card,.pet-commission-footer{border:1px solid rgba(148,163,184,.32);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}',
      '.theme-dark .pet-pdf-badge,.theme-dark .pet-logo-glass,.theme-dark .pet-info-strip,.theme-dark .pet-kpi-card,.theme-dark .pet-commission-footer{background:linear-gradient(145deg,rgba(255,255,255,.075),rgba(15,23,42,.38));box-shadow:0 0 22px rgba(147,197,253,.12),inset 0 1px 0 rgba(255,255,255,.12)}',
      '.theme-light .pet-pdf-badge,.theme-light .pet-logo-glass,.theme-light .pet-info-strip,.theme-light .pet-kpi-card,.theme-light .pet-commission-footer{background:rgba(255,255,255,.82);box-shadow:0 8px 18px rgba(15,23,42,.08),inset 0 1px 0 rgba(255,255,255,.88)}',
      '.pet-pdf-badge{border-radius:18px;padding:14px 16px;display:flex;align-items:center;gap:14px;direction:rtl;min-height:92px}.pet-pdf-badge h3{margin:0;font-size:18px}.pet-pdf-badge span{display:block;opacity:.7;font-size:11px;margin:8px 0 3px}.pet-pdf-badge b{font-size:12px}.pet-pdf-icon{width:44px;height:54px;border:2px solid currentColor;border-radius:6px;display:grid;place-items:center;font-weight:900;font-size:16px}',
      '.pet-title-block{text-align:center;direction:rtl}.pet-title-block h1{font-size:34px;line-height:1.05;margin:0 0 8px;font-weight:900;letter-spacing:.2px}.pet-title-block h2{font-size:17px;margin:0;letter-spacing:1.2px;font-weight:900}.pet-title-line{height:18px;margin:12px auto 0;width:170px;position:relative;border-bottom:2px solid #2f93ff}.pet-title-line i{position:absolute;bottom:-6px;left:50%;width:10px;height:10px;border-radius:50%;background:#2f93ff;transform:translateX(-50%)}',
      '.pet-brand-block{display:flex;align-items:flex-start;justify-content:flex-end;gap:16px;direction:ltr}.pet-brand-text{padding-top:25px;text-align:left}.pet-brand-text strong{display:block;font-size:30px;letter-spacing:1px;color:inherit}.pet-brand-text span{font-size:14px;opacity:.78}',
      '.pet-logo-glass{width:128px;height:128px;border-radius:22px;display:flex;align-items:center;justify-content:center;overflow:hidden;position:relative}.theme-dark .pet-logo-glass{border-color:rgba(191,219,254,.55);box-shadow:0 0 0 1px rgba(255,255,255,.08),0 0 25px rgba(147,197,253,.32),inset 0 0 26px rgba(147,197,253,.12)}.theme-light .pet-logo-glass{border-color:rgba(59,130,246,.22);box-shadow:0 14px 28px rgba(15,23,42,.12),inset 0 0 28px rgba(219,234,254,.95)}.pet-logo-glass:before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.28),transparent 38%,rgba(255,255,255,.08));pointer-events:none}.pet-logo-glass img{width:112px;height:112px;object-fit:contain;display:block;filter:none!important;mix-blend-mode:normal!important;opacity:1!important;position:relative;z-index:1}',
      '.pet-info-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-radius:16px;margin:10px 0 14px;overflow:hidden}.pet-info-strip div{padding:14px 18px;display:grid;grid-template-columns:36px 1fr;grid-template-rows:auto auto;column-gap:10px;align-items:center;border-left:1px solid rgba(148,163,184,.28)}.pet-info-strip div:last-child{border-left:0}.pet-info-icon{font-size:24px;grid-row:1/3;opacity:.95}.pet-info-strip small{font-size:11px;opacity:.72}.pet-info-strip b{font-size:14px}',
      '.pet-kpi-strip{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:0 0 14px}.pet-kpi-card{border-radius:16px;min-height:92px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:18px}.pet-kpi-card span{display:block;font-size:12px;opacity:.84;font-weight:700}.pet-kpi-card b{display:block;font-size:25px;margin:8px 0 5px;font-weight:900;direction:ltr}.pet-kpi-card small{font-size:11px;opacity:.74}.pet-kpi-icon{width:58px;height:58px;border-radius:50%;display:grid;place-items:center;font-size:32px;flex:0 0 auto}.pet-kpi-money .pet-kpi-icon{color:#55f06c;background:rgba(34,197,94,.15);border:1px solid rgba(34,197,94,.62)}.pet-kpi-percent .pet-kpi-icon{color:#fff;background:rgba(124,58,237,.28);border:1px solid rgba(168,85,247,.68)}.pet-kpi-sales .pet-kpi-icon{color:#fff;background:rgba(37,99,235,.30);border:1px solid rgba(59,130,246,.70)}',
      '.pet-table-section{position:relative;z-index:1}.pet-table-section h3{font-size:20px;margin:8px 0 10px;text-align:right}.pet-table-section h3 span{color:#268eff;margin-right:8px}.pet-commission-table{border-radius:14px;overflow:hidden;border:1px solid rgba(148,163,184,.38)}.pet-commission-table table{width:100%!important;border-collapse:collapse!important;table-layout:auto!important;direction:rtl}.pet-commission-table th,.pet-commission-table td{border:1px solid rgba(148,163,184,.30)!important;padding:7px 8px!important;font-size:11px!important;line-height:1.35;text-align:right;white-space:normal!important;word-break:break-word}.pet-commission-table th{font-weight:900!important}.theme-dark .pet-commission-table th{background:linear-gradient(180deg,#143553,#0b233a)!important;color:#fff!important}.theme-light .pet-commission-table th{background:#f1f7ff!important;color:#0f4f94!important}.theme-dark .pet-commission-table td{background:rgba(4,17,29,.74)!important;color:#f8fafc!important}.theme-dark .pet-commission-table tbody tr:nth-child(even) td{background:rgba(11,32,52,.74)!important}.theme-light .pet-commission-table td{background:#fff!important;color:#0f172a!important}.theme-light .pet-commission-table tbody tr:nth-child(even) td{background:#f8fbff!important}.pet-commission-table tfoot td{font-weight:900!important;font-size:13px!important}.theme-dark .pet-commission-table tfoot td{background:#102f4c!important;color:#fff!important}.theme-light .pet-commission-table tfoot td{background:#edf5ff!important;color:#0f4f94!important}',
      '.pet-watermark{position:absolute;left:50%;top:70%;transform:translate(-50%,-50%);width:280px;opacity:.055;z-index:0;pointer-events:none}.theme-light .pet-watermark{opacity:.045}.pet-watermark img{width:100%;height:auto;filter:none!important;mix-blend-mode:normal!important}',
      '.pet-commission-footer{margin-top:12px;border-radius:14px;padding:12px 16px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:12px;position:relative;z-index:1}.pet-commission-footer span:first-child{text-align:left;direction:ltr}.pet-commission-footer span:nth-child(2){text-align:center;direction:ltr}.pet-commission-footer span:last-child{text-align:right}',
      '@media print{body{margin:0!important}.pet-commission-page{break-inside:auto;page-break-inside:auto}.pet-pdf-badge,.pet-logo-glass,.pet-info-strip,.pet-kpi-card,.pet-commission-footer{break-inside:avoid;page-break-inside:avoid}.pet-commission-table table{page-break-inside:auto}.pet-commission-table tr{page-break-inside:avoid;page-break-after:auto}}'
    ].join('');
  }
  ns.printNode = function(options){
    options = options || {};
    var targetNode = ns.getNode ? ns.getNode(options.target || options.selector || 'body') : null;
    var clone = ns.cloneForExport(options.target || options.selector || 'body');
    if(!clone){ ns.notify && ns.notify(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر العثور على محتوى الطباعة'):'تعذر العثور على محتوى الطباعة'); return; }
    var title = options.title || document.title || 'PETATOE Report';
    var isCommission = (targetNode && (targetNode.id === 'commissionStatementExportArea' || targetNode.getAttribute('data-commission-print') === '1')) || (clone && (clone.id === 'commissionStatementExportArea' || clone.getAttribute('data-commission-print') === '1'));
    var printHtml = '';
    if(isCommission){
      printHtml = commissionPrintHtml(targetNode, clone, title);
    }else{
      var filters = ns.collectFilters ? ns.collectFilters(options.filterScope || options.target || document) : [];
      var safeFiltersHtml = ns.filtersHtml ? ns.filtersHtml(filters) : '';
      var exportHtml = safeFiltersHtml + clone.innerHTML;
      var safeExportHtml = '';
      if(window.PETATOESecurity && typeof window.PETATOESecurity.sanitizeHtml === 'function'){
        safeExportHtml = window.PETATOESecurity.sanitizeHtml(exportHtml);
      }else{
        var fallback = document.createElement('div');
        fallback.textContent = clone.innerText || clone.textContent || '';
        safeExportHtml = safeFiltersHtml + '<pre style="white-space:pre-wrap;font-family:Cairo,Arial,sans-serif">'+esc(fallback.textContent)+'</pre>';
      }
      printHtml = '<!doctype html><html dir="rtl"><head><meta charset="utf-8"><title>'+esc(title)+'</title>'+
        '<style>body{font-family:Cairo,Arial,sans-serif;margin:16px;color:#111827;background:#fff;direction:rtl}h2{margin:0 0 12px;font-size:20px}.com-statement-print,.com-card{border:1px solid #d1d5db;border-radius:14px;padding:12px;background:#fff}.com-statement-print-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:10px}.com-statement-print-meta{display:flex;gap:6px;flex-wrap:wrap}.com-statement-print-meta span,.pet-export-filters span{border:1px solid #d1d5db;border-radius:999px;padding:5px 9px;background:#f9fafb;font-size:11px;font-weight:700}.com-statement-toolbar,.com-actions,.exp-btn,.btn,.no-print{display:none!important}.com-kpis{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;margin:10px 0}.com-kpi{border:1px solid #d1d5db;border-radius:12px;padding:10px;background:#f8fafc;break-inside:avoid}.com-kpi span,.com-kpi small{display:block;color:#475569}.com-kpi b{display:block;font-size:18px;margin:5px 0;color:#0f172a}.com-table{overflow:visible!important;max-height:none!important;width:100%!important}.com-table table,table{width:100%!important;min-width:0!important;border-collapse:collapse!important;table-layout:auto!important}th,td{border:1px solid #d1d5db;padding:6px 7px;font-size:11px;white-space:normal;word-break:break-word}th{background:#e2e8f0;color:#0f172a;font-weight:900}tfoot td{font-weight:900;background:#f1f5f9}.pet-export-filters{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px}@page{size:A4 landscape;margin:8mm}@media print{body{margin:0}.com-statement-print,.com-card{box-shadow:none!important;break-inside:auto}}</style>'+
        '</head><body><h2>'+esc(title)+'</h2>'+ safeExportHtml + '<scr'+'ipt>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},450);});<\/scr'+'ipt></body></html>';
    }
    var w = openPrintHtml(printHtml);
    if(!w){ ns.notify && ns.notify(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('المتصفح منع نافذة الطباعة'):'المتصفح منع نافذة الطباعة'); return; }
  };
  ns.print = function(options){
    if(typeof options === 'function' || typeof options === 'string' && typeof window[options] === 'function') return ns.runLegacy(options);
    return ns.printNode(options || {});
  };
})();
