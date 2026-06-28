// PETATOE v5.1.44: working details modal + Excel export for One-Time / Recurring clients.
(function(){
  'use strict';
  if(window.__PETATOE_ONE_TIME_RECURRING_MODAL_BOOTED__) return;
  window.__PETATOE_ONE_TIME_RECURRING_MODAL_BOOTED__ = true;
  function notify(msg){
    try{ if(typeof toast==='function') return toast(msg); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/one-time-recurring-modal.js",e);}
    try{ console.warn(msg); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/one-time-recurring-modal.js",e);}
  }
  function esc(v){
    if(window.PETATOEUtils && typeof PETATOEUtils.escapeHtml==='function') return PETATOEUtils.escapeHtml(v);
    return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]});
  }
  function n0(v){try{return typeof fmt0==='function'?fmt0(v):Number(v||0).toLocaleString('en-US')}catch(e){return String(v||0)}}
  function moneySafe(v){try{return typeof money==='function'?money(v):('SAR '+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}))}catch(e){return String(v||0)}}
  function dateSafe(v){try{return v&&typeof fmtDateAr==='function'?fmtDateAr(v):(v?String(v):'')}catch(e){return v?String(v):''}}
  function title(kind){return kind==='returning'?'العملاء المتكررون':'عملاء مرة واحدة'}
  function clearNode(el){while(el&&el.firstChild){el.removeChild(el.firstChild)}}
  function appendTextCell(tr, value){var td=document.createElement('td');td.textContent=String(value==null?'':value);tr.appendChild(td);return td}
  function renderEmpty(body){clearNode(body);var div=document.createElement('div');div.className='petatoe-client-detail-empty';div.textContent='لا توجد بيانات متاحة لهذه القائمة.';body.appendChild(div)}
  function renderDetailsTable(body, list){
    clearNode(body);
    var table=document.createElement('table');table.className='petatoe-client-detail-table';
    var thead=document.createElement('thead');var hr=document.createElement('tr');
    ['العميل','عدد العمليات','عدد الفواتير','إجمالي المبيعات','أول زيارة','آخر زيارة','آخر فاتورة','السيارات','طرق الدفع'].forEach(function(h){var th=document.createElement('th');th.textContent=h;hr.appendChild(th)});
    thead.appendChild(hr);table.appendChild(thead);
    var tbody=document.createElement('tbody');
    list.forEach(function(r){var tr=document.createElement('tr');appendTextCell(tr,r.name);appendTextCell(tr,n0(r.operations||0));appendTextCell(tr,n0(r.invoices||0));appendTextCell(tr,moneySafe(r.totalValue||0));appendTextCell(tr,r.first?dateSafe(r.first):'—');appendTextCell(tr,r.last?dateSafe(r.last):'—');appendTextCell(tr,r.lastInvoice||'—');appendTextCell(tr,r.vans||'—');appendTextCell(tr,r.pays||'—');tbody.appendChild(tr)});
    table.appendChild(tbody);body.appendChild(table);
  }
  function rows(kind){
    kind = kind==='returning'?'returning':'oneTime';
    var data = window.PETATOENewReturningDetails && window.PETATOENewReturningDetails[kind];
    return Array.isArray(data) ? data : [];
  }
  function ensureModal(){
    var modal=document.getElementById('petatoeClientDetailModal');
    if(modal) return modal;
    modal=document.createElement('div');
    modal.id='petatoeClientDetailModal';
    modal.className='petatoe-client-detail-modal';
    var box=document.createElement('div');box.className='petatoe-client-detail-box';box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');
    var head=document.createElement('div');head.className='petatoe-client-detail-head';
    var h3=document.createElement('h3');h3.id='petatoeClientDetailTitle';h3.textContent='تفاصيل العملاء';head.appendChild(h3);
    var actions=document.createElement('div');actions.className='petatoe-client-detail-actions';
    var exportButton=document.createElement('button');exportButton.className='btn btn-green';exportButton.id='petatoeClientDetailExportBtn';exportButton.type='button';exportButton.textContent='📊 تصدير Excel';
    var closeButton=document.createElement('button');closeButton.className='btn btn-ghost';closeButton.type='button';closeButton.id='petatoeClientDetailCloseBtn';closeButton.textContent='✕ إغلاق';
    actions.appendChild(exportButton);actions.appendChild(closeButton);head.appendChild(actions);box.appendChild(head);
    var detailBody=document.createElement('div');detailBody.className='petatoe-client-detail-body';detailBody.id='petatoeClientDetailBody';box.appendChild(detailBody);modal.appendChild(box);
    modal.addEventListener('click',function(e){if(e.target===modal) window.closeSmartNewReturningList();});
    document.body.appendChild(modal);
    var closeBtn=document.getElementById('petatoeClientDetailCloseBtn');
    if(closeBtn) closeBtn.addEventListener('click',function(){window.closeSmartNewReturningList();});
    return modal;
  }
  window.openSmartNewReturningList=function(kind){
    kind = kind==='returning'?'returning':'oneTime';
    var list=rows(kind);
    var modal=ensureModal();
    var titleEl=document.getElementById('petatoeClientDetailTitle');
    var body=document.getElementById('petatoeClientDetailBody');
    var exportBtn=document.getElementById('petatoeClientDetailExportBtn');
    if(titleEl) titleEl.textContent=title(kind)+' - '+n0(list.length)+' عميل';
    if(exportBtn){
      exportBtn.setAttribute('data-client-export-kind', kind);
      if(!exportBtn.__petatoeClientExportBound){
        exportBtn.__petatoeClientExportBound = true;
        exportBtn.addEventListener('click', function(){
          window.exportSmartNewReturningList(this.getAttribute('data-client-export-kind') || 'oneTime');
        });
      }
    }
    if(body){
      if(!list.length){
        renderEmpty(body);
      }else{
        renderDetailsTable(body, list);
      }
    }
    modal.classList.add('show');
  };
  window.closeSmartNewReturningList=function(){
    var modal=document.getElementById('petatoeClientDetailModal');
    if(modal) modal.classList.remove('show');
  };
  window.exportSmartNewReturningList=function(kind){
    kind = kind==='returning'?'returning':'oneTime';
    var list=rows(kind);
    if(!list.length){notify('لا توجد بيانات للتصدير');return;}
    var data=list.map(function(r){return {
      'العميل':r.name||'',
      'عدد العمليات':r.operations||0,
      'عدد الفواتير':r.invoices||0,
      'إجمالي المبيعات':+(r.totalValue||0),
      'أول زيارة':r.first?dateSafe(r.first):'',
      'آخر زيارة':r.last?dateSafe(r.last):'',
      'آخر فاتورة':r.lastInvoice||'',
      'السيارات':r.vans||'',
      'طرق الدفع':r.pays||''
    };});
    if(!window.XLSX){notify('مكتبة Excel غير متاحة');return;}
    var ws=XLSX.utils.json_to_sheet(data);
    ws['!cols']=[{wch:34},{wch:14},{wch:14},{wch:18},{wch:16},{wch:16},{wch:18},{wch:30},{wch:20}];
    var wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,title(kind).slice(0,31));
    XLSX.writeFile(wb,'PETATOE_'+(kind==='returning'?'Recurring_Customers':'One_Time_Customers')+'.xlsx');
  };
  document.addEventListener('click',function(e){
    var btn=e.target.closest && e.target.closest('#newReturningSummary [data-client-kind]');
    if(btn){
      e.preventDefault();
      e.stopPropagation();
      window.openSmartNewReturningList(btn.getAttribute('data-client-kind'));
    }
  },true);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')window.closeSmartNewReturningList();});
})();