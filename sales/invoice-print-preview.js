/* === PETATOE v3.8.27 SALES INVOICE PRINT + PREVIEW CLOSE FINAL FIX ===
   Scoped only to Sales Invoices Report. It does not touch the old red PDF engine. */
(function(){
  if(window.__PETATOE_SALES_INVOICE_PRINT_CLOSE_FIX__) return;
  window.__PETATOE_SALES_INVOICE_PRINT_CLOSE_FIX__ = true;

  function getSalesState(){
    window.petSalesInvoiceReportState = window.petSalesInvoiceReportState || {};
    return window.petSalesInvoiceReportState;
  }

  function closeSalesPreviewSafe(){
    var st = getSalesState();
    st.previewOpen = false;
    st.selected = '';
    try{
      var mod = window.PETATOESalesInvoiceReport;
      if(mod && typeof mod.closePreview === 'function'){
        return mod.closePreview();
      }
      if(mod && typeof mod.render === 'function'){
        return mod.render();
      }
      var grid = document.querySelector('#salesInvoiceReportArea .sir-main-grid');
      var card = document.querySelector('#salesInvoiceReportArea .sir-preview-card');
      if(grid) grid.classList.remove('preview-open');
      if(card) card.style.display = 'none';
    }catch(e){
      var grid2 = document.querySelector('#salesInvoiceReportArea .sir-main-grid');
      var card2 = document.querySelector('#salesInvoiceReportArea .sir-preview-card');
      if(grid2) grid2.classList.remove('preview-open');
      if(card2) card2.style.display = 'none';
    }
  }

  window.petatoeCloseSalesInvoicePreview = closeSalesPreviewSafe;

  document.addEventListener('click', function(e){
    var btn = e.target && e.target.closest && e.target.closest('.sir-close-preview,[data-sir-close-preview]');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    closeSalesPreviewSafe();
  }, true);

  function standaloneInvoiceCss(){
    return `
      @page{size:A4 portrait;margin:10mm;}
      *{box-sizing:border-box!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
      html,body{margin:0!important;padding:0!important;background:#fff!important;color:#050505!important;font-family:Cairo,Arial,sans-serif!important;direction:rtl!important;}
      body{padding:10mm!important;}
      body:before,body:after{display:none!important;content:none!important;}
      .sir-print-toolbar{display:flex;gap:8px;align-items:center;justify-content:center;margin:0 0 10px;padding:10px;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc;}
      .sir-print-toolbar button{border:0;border-radius:10px;padding:8px 14px;font:900 12px Cairo,Arial;background:#7c3aed;color:#fff;cursor:pointer;}
      .petatoe-tax-invoice{width:100%!important;max-width:190mm!important;min-width:0!important;margin:0 auto!important;background:#fff!important;color:#050505!important;border-radius:0!important;padding:0!important;direction:rtl!important;font-family:Cairo,Arial,sans-serif!important;box-shadow:none!important;font-size:11px!important;overflow:visible!important;}
      .petatoe-tax-head{display:grid!important;grid-template-columns:42mm 1fr 34mm!important;gap:8mm!important;align-items:start!important;min-height:44mm!important;}
      .petatoe-tax-title{text-align:left!important;direction:ltr!important;color:#000!important;}
      .petatoe-tax-title b{display:block!important;font-size:25px!important;line-height:1.08!important;color:#000!important;font-weight:950!important;}
      .petatoe-tax-title span{display:block!important;font-weight:950!important;font-size:18px!important;margin-top:5px!important;color:#000!important;}
      .petatoe-company{text-align:center!important;line-height:1.55!important;font-weight:900!important;color:#000!important;}
      .petatoe-company h4{font-size:14px!important;margin:0 0 4px!important;color:#000!important;line-height:1.45!important;}
      .petatoe-logo-inv{text-align:center!important;line-height:1!important;color:#111!important;font-weight:950!important;}
      .petatoe-logo-inv img{width:30mm!important;height:30mm!important;object-fit:contain!important;display:block!important;margin:0 auto 3mm!important;border-radius:0!important;}
      .petatoe-logo-inv small{display:block!important;font-size:10px!important;font-weight:950!important;margin-top:2px!important;color:#111!important;line-height:1.3!important;}
      .petatoe-qr{width:31mm!important;height:31mm!important;margin-top:6mm!important;background:#fff!important;border:1px solid #111!important;box-shadow:none!important;display:grid!important;place-items:center!important;padding:1.5mm!important;}
      .petatoe-qr img{width:100%!important;height:100%!important;object-fit:contain!important;display:block!important;}
      .petatoe-tax-line{border-top:3px double #111!important;margin:7mm 0!important;}
      .petatoe-tax-meta{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10mm!important;margin-bottom:6mm!important;color:#000!important;}
      .petatoe-tax-meta .left{text-align:left!important;direction:ltr!important;}
      .petatoe-tax-meta .right{text-align:right!important;line-height:1.65!important;}
      .petatoe-meta-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:5mm!important;margin-bottom:3mm!important;font-weight:900!important;color:#000!important;}
      .petatoe-meta-row b{font-size:11px!important;color:#000!important;line-height:1.35!important;}
      .petatoe-meta-row span{font-size:11px!important;color:#000!important;}
      .petatoe-tax-table{width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;font-size:8.7px!important;min-width:0!important;color:#000!important;}
      .petatoe-tax-table th{position:static!important;background:#e5e5e5!important;color:#000!important;border:1px solid #222!important;text-align:center!important;padding:4px 3px!important;white-space:normal!important;line-height:1.22!important;font-weight:950!important;}
      .petatoe-tax-table td{border:1px solid #222!important;color:#000!important;background:#fff!important;text-align:center!important;padding:4px 3px!important;white-space:normal!important;line-height:1.28!important;vertical-align:middle!important;}
      .petatoe-tax-summary{width:48%!important;min-width:72mm!important;margin:5mm 0 0 auto!important;border-collapse:collapse!important;font-size:10px!important;color:#000!important;}
      .petatoe-tax-summary td{border-bottom:1.8px solid #111!important;padding:4px 5px!important;color:#000!important;background:#fff!important;}
      .petatoe-tax-summary td:first-child{font-weight:950!important;text-align:right!important;}
      .petatoe-tax-summary td:last-child{text-align:left!important;direction:ltr!important;}
      .petatoe-tax-summary tr.highlight td{background:#e6e6e6!important;font-weight:950!important;font-size:11px!important;}
      .petatoe-tax-foot{text-align:center!important;margin-top:10mm!important;color:#111!important;font-weight:900!important;}
      @media print{
        body{padding:0!important;background:#fff!important;}
        .sir-print-toolbar{display:none!important;}
        .petatoe-tax-invoice{max-width:100%!important;width:100%!important;}
      }
    `;
  }


  function openPrintHtml(html, features){
    try{var blob=new Blob([String(html||'')],{type:'text/html;charset=utf-8'});var url=URL.createObjectURL(blob);var w=window.open(url,'_blank',features||'width=920,height=900');if(w)setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('sales/invoice-print-preview.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('sales/invoice-print-preview.js',_petatoeSilentCatch);}}},60000);return w;}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('sales/invoice-print-preview.js',e);return null;}
  }

  function findInvoiceInDom(){
    var node = document.querySelector('#salesInvoiceReportArea .sir-preview-frame .petatoe-tax-invoice');
    return node ? node.outerHTML : '';
  }

  function openPrintableInvoice(html, autoPrint){
    if(!html){ alert('افتح معاينة الفاتورة الأول من زر العين أو رقم الفاتورة'); return false; }
    var printHtml='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PETATOE Invoice</title><style>'+standaloneInvoiceCss()+'</style></head><body><div class="sir-print-toolbar"><button id="petInvoicePrintBtn" type="button">طباعة / حفظ PDF</button><button id="petInvoiceCloseBtn" type="button">إغلاق</button><script>document.addEventListener("click",function(e){if(e.target&&e.target.id==="petInvoicePrintBtn")window.print();if(e.target&&e.target.id==="petInvoiceCloseBtn")window.close();});<\/script></div>'+html+(autoPrint?'<scr'+'ipt>window.addEventListener("load",function(){setTimeout(function(){window.focus();window.print();},900);});<\/scr'+'ipt>':'')+ '</body></html>';
    var w=openPrintHtml(printHtml,'width=920,height=900');
    if(!w){ alert('المتصفح منع فتح نافذة الطباعة. اسمح بالـ Popups وجرب تاني.'); return false; }
    return true;
  }

  function corePrint(no){
    var mod = window.PETATOESalesInvoiceReport;
    if(mod && typeof mod.print === 'function') return mod.print(no);
    if(typeof window.PETATOESalesInvoiceCorePrint === 'function') return window.PETATOESalesInvoiceCorePrint(no);
    return false;
  }

  function coreOpen(no){
    var mod = window.PETATOESalesInvoiceReport;
    if(mod && typeof mod.printInvoice === 'function') return mod.printInvoice(no);
    if(typeof window.PETATOESalesInvoiceCoreOpen === 'function') return window.PETATOESalesInvoiceCoreOpen(no);
    return false;
  }

  window.petatoePrintSalesInvoice = function(no){
    /* Report PDF is owned by the sales invoice report core. */
    if(no === 'report') return corePrint(no);

    /* Invoice preview print: use the already-rendered invoice HTML to avoid global @media print rules that caused blank pages. */
    var html = findInvoiceInDom();
    if(html) return openPrintableInvoice(html, true);

    return corePrint(no);
  };

  window.petatoeOpenSalesInvoice = function(no){
    var html = findInvoiceInDom();
    if(html) return openPrintableInvoice(html, false);
    return coreOpen(no);
  };
})();
