(function(){
  function petatoeOpenPrintHtml(html, features){try{var blob=new Blob([String(html||'')],{type:'text/html;charset=utf-8'});var url=URL.createObjectURL(blob);var w=window.open(url,'_blank',features||'width=1100,height=850');if(w)setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('sales/contract-candidates-report.js', _e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }},60000);return w;}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('sales/contract-candidates-report.js',e);return null;}}

  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function moneyLocal(v){try{ if(typeof money==='function') return money(Number(v||0)); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/contract-candidates-report.js",e);} return 'SAR '+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function ensureContractReasonModal(){
    var m=document.getElementById('contractReasonModal');
    if(!m){
      m=document.createElement('div');
      m.id='contractReasonModal';
      m.className='contract-reason-modal-overlay';
      m.addEventListener('click',function(e){ if(e.target===m) m.classList.remove('show'); });
      document.body.appendChild(m);
    }
    return m;
  }
  // Final override: do not return if an old broken version already exists.
  function petatoeShowContractCandidateReasonLegacy(idx){
    var list=window.__petatoeContractCandidateDetails||[];
    var d=list[Number(idx)];
    if(!d){
      alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('لم يتم العثور على تفاصيل سبب الترشيح لهذا العميل. افتح التقرير مرة أخرى ثم جرّب.'):'لم يتم العثور على تفاصيل سبب الترشيح لهذا العميل. افتح التقرير مرة أخرى ثم جرّب.');
      return;
    }
    var score=Number(d.score||0);
    var action=score>=80?'عرض عقد سنوي مباشر':(score>=60?'عرض اتفاقية توريد دوري':'متابعة تجارية قبل عرض العقد');
    var m=ensureContractReasonModal();
    var contractReasonHtml='<div class="contract-reason-modal-card">'
      +'<div class="contract-reason-modal-head"><div><h3>تفاصيل سبب الترشيح</h3><p>'+esc(d.name)+' — '+esc(d.recommendation)+'</p></div><button class="contract-reason-close" type="button" data-contract-reason-close="1">×</button></div>'
      +'<div class="contract-reason-detail-grid">'
      +'<div class="contract-reason-detail-box"><small>إجمالي الإنفاق</small><b>'+moneyLocal(d.value)+'</b></div>'
      +'<div class="contract-reason-detail-box"><small>عدد الزيارات</small><b>'+esc(d.visits)+'</b></div>'
      +'<div class="contract-reason-detail-box"><small>شهور النشاط</small><b>'+esc(d.months)+'</b></div>'
      +'<div class="contract-reason-detail-box"><small>Score</small><b>'+esc(score)+'</b></div>'
      +'<div class="contract-reason-detail-box"><small>آخر زيارة</small><b>'+esc(d.lastDate)+'</b></div>'
      +'<div class="contract-reason-detail-box"><small>أيام الغياب</small><b>'+esc(d.days)+' يوم</b></div>'
      +'<div class="contract-reason-detail-box"><small>متوسط الفاتورة</small><b>'+moneyLocal(d.avgInvoice)+'</b></div>'
      +'<div class="contract-reason-detail-box"><small>التصنيف الحالي</small><b>'+esc(d.tier)+'</b></div>'
      +'</div>'
      +'<div class="contract-reason-lines">'
      +'<span class="ok">✓ التوصية: '+esc(d.recommendation)+' — '+esc(d.recommendationDesc)+'</span>'
      +'<span>سبب الترشيح الكامل: '+esc(d.reason)+'</span>'
      +'<span class="ok">✓ الإجراء المقترح: '+esc(action)+' مع مراجعة آخر الخدمات والزيارات قبل التواصل.</span>'
      +'</div></div>';
    (window.PETATOESecurity||{setInnerHTML:function(el,h){el.replaceChildren(document.createRange().createContextualFragment(String(h==null?'':h)));}}).setInnerHTML(m, contractReasonHtml);
    m.classList.add('show');
  };
  if(window.__PETATOE_CONTRACT_CANDIDATES_REPORT_BINDINGS__ !== '1'){
    window.__PETATOE_CONTRACT_CANDIDATES_REPORT_BINDINGS__ = '1';
    document.addEventListener('click',function(e){
      var btn=e.target.closest&&e.target.closest('[data-contract-reason-index]');
      if(btn){
        e.preventDefault();
        e.stopPropagation();
        window.petatoeShowContractCandidateReason(btn.getAttribute('data-contract-reason-index'));
      }
    },true);
    document.addEventListener('keydown',function(e){ if(e.key==='Escape'){var m=document.getElementById('contractReasonModal'); if(m)m.classList.remove('show');} });
  }

  function contractRows(){
    var rows=window.__petatoeContractCandidateDetails||[];
    if(rows.length) return rows;
    var table=document.getElementById('contractCandidatesTable');
    if(!table) return [];
    return [].slice.call(table.querySelectorAll('tbody tr')).map(function(tr){
      var c=tr.children;
      return {name:(c[1]&&c[1].innerText)||'', value:0, visits:(c[3]&&c[3].innerText)||'', months:(c[4]&&c[4].innerText)||'', lastDate:(c[5]&&c[5].innerText)||'', days:(c[6]&&c[6].innerText)||'', score:(c[7]&&c[7].innerText)||'', recommendation:(c[8]&&c[8].innerText)||'', reason:(c[9]&&c[9].innerText)||'', tier:(c[10]&&c[10].innerText)||''};
    });
  }
  window.petatoeExportContractCandidatesExcel=function(){
    try{
      var rows=contractRows();
      if(!rows.length){alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('لا توجد بيانات لتصدير تقرير العملاء المرشحين للعقود.'):'لا توجد بيانات لتصدير تقرير العملاء المرشحين للعقود.');return;}
      var header=['#','العميل','إجمالي الإنفاق','عدد الزيارات','شهور النشاط','آخر زيارة','أيام الغياب','Score','التوصية','التصنيف','سبب الترشيح'];
      var lines=[header].concat(rows.map(function(r,i){return [i+1,r.name,moneyLocal(r.value),r.visits,r.months,r.lastDate,r.days,r.score,r.recommendation,r.tier,r.reason];}));
      var csv='\ufeff'+lines.map(function(row){return row.map(function(v){return '"'+String(v==null?'':v).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
      var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
      var a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='PETATOE_Contract_Candidates_Top100.csv';
      document.body.appendChild(a);a.click();
      setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},1000);
    }catch(err){console.error(err);alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر تصدير تقرير العملاء المرشحين Excel.'):'تعذر تصدير تقرير العملاء المرشحين Excel.');}
  };
  window.petatoeExportContractCandidatesPdf=function(){
    try{
      var table=document.getElementById('contractCandidatesTable');
      if(!table){alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تقرير العملاء المرشحين للعقود غير مفتوح حالياً.'):'تقرير العملاء المرشحين للعقود غير مفتوح حالياً.');return;}
      var rows=contractRows();
      var now=new Date().toLocaleString('ar-SA');
      var style='<style>@page{size:A4 landscape;margin:8mm}body{font-family:Cairo,Arial,sans-serif;direction:rtl;color:#111827;background:#fff}h1{font-size:20px;margin:0 0 6px}.sub{color:#64748b;font-weight:700;margin-bottom:12px}.kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0 14px}.kpi{border:1px solid #ddd;border-radius:10px;padding:10px}.kpi span{display:block;color:#64748b;font-size:11px}.kpi b{display:block;font-size:15px;margin-top:5px}table{width:100%;border-collapse:collapse;font-size:9.2px}th{background:#6d28d9;color:#fff;padding:7px;text-align:right}td{border-bottom:1px solid #e5e7eb;padding:6px;text-align:right;vertical-align:top}tr:nth-child(even) td{background:#f8fafc}.score{font-weight:900;color:#16a34a}.footer{margin-top:12px;text-align:center;color:#94a3b8;font-size:10px}</style>';
      var bodyRows=rows.map(function(r,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(r.name)+'</td><td>'+esc(moneyLocal(r.value))+'</td><td>'+esc(r.visits)+'</td><td>'+esc(r.months)+'</td><td>'+esc(r.lastDate)+'</td><td>'+esc(r.days)+'</td><td class="score">'+esc(r.score)+'</td><td>'+esc(r.recommendation)+'</td><td>'+esc(r.tier)+'</td><td>'+esc(r.reason)+'</td></tr>';}).join('');
      var totalValue=rows.reduce(function(s,r){return s+Number(r.value||0);},0);
      var avgScore=rows.length?Math.round(rows.reduce(function(s,r){return s+Number(r.score||0);},0)/rows.length):0;
      var html='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>عملاء مرشحون للعقود</title>'+style+'</head><body>'
        +'<h1>⭐ تقرير العملاء المرشحين لعمل عقود معهم</h1><div class="sub">PETATOE Analytics System — تاريخ التصدير: '+esc(now)+'</div>'
        +'<div class="kpis"><div class="kpi"><span>عدد العملاء</span><b>'+rows.length+'</b></div><div class="kpi"><span>إجمالي الإنفاق</span><b>'+esc(moneyLocal(totalValue))+'</b></div><div class="kpi"><span>متوسط Score</span><b>'+avgScore+'</b></div><div class="kpi"><span>نطاق التقرير</span><b>Top 100</b></div></div>'
        +'<table><thead><tr><th>#</th><th>العميل</th><th>إجمالي الإنفاق</th><th>الزيارات</th><th>شهور النشاط</th><th>آخر زيارة</th><th>أيام الغياب</th><th>Score</th><th>التوصية</th><th>التصنيف</th><th>سبب الترشيح</th></tr></thead><tbody>'+bodyRows+'</tbody></table>'
        +'<div class="footer">تم إنشاء التقرير من PETATOE Analytics System</div></body></html>';
      var w=petatoeOpenPrintHtml(html,'width=1100,height=850');
      if(!w){alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم جرّب مرة أخرى.'):'المتصفح منع نافذة الطباعة. اسمح بالنوافذ المنبثقة ثم جرّب مرة أخرى.');return;}
      setTimeout(function(){try{w.focus();}catch(_e){ try{ if(window.PETATOECaptureSilentCatch) window.PETATOECaptureSilentCatch('sales/contract-candidates-report.js', _e, {phase:'v6.4.209-final'}); }catch(__petatoeDiagErr){ if(window.console&&console.warn) console.warn('[PETATOE] silent catch diagnostics failed', __petatoeDiagErr); } }},350);
    }catch(err){console.error(err);alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر تصدير تقرير العملاء المرشحين PDF.'):'تعذر تصدير تقرير العملاء المرشحين PDF.');}
  };
})();



(function(){
  if(window.__PETATOE_CONTRACT_REASON_DELEGATION__) return;
  window.__PETATOE_CONTRACT_REASON_DELEGATION__=true;
  document.addEventListener('click', function(e){
    var btn=e.target && e.target.closest && e.target.closest('[data-contract-reason-close]');
    if(!btn) return;
    e.preventDefault();
    if(typeof window.petatoeCloseContractCandidateReason==='function') return window.petatoeCloseContractCandidateReason();
    var m=document.getElementById('contractReasonModal'); if(m) m.classList.remove('show');
  });
})();
