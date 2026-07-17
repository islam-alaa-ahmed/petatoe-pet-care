(function(){
  'use strict';
  if(window.__PETATOE_V38116_CONTRACT_DARK_SALES_FIX__) return;
  window.__PETATOE_V38116_CONTRACT_DARK_SALES_FIX__=true;

  function q(s,r){return (r||document).querySelector(s);}
  function qa(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));}
  function clean(v){return String(v==null?'':v).trim();}

  function closeReason(){
    var m=document.getElementById('contractReasonModal');
    if(!m) return;
    m.classList.remove('show');
    m.style.display='none';
    m.style.opacity='0';
    m.style.visibility='hidden';
    m.style.pointerEvents='none';
  }
  window.petatoeCloseContractCandidateReason=closeReason;

  function ensureReasonModal(){
    var m=document.getElementById('contractReasonModal');
    if(!m){
      m=document.createElement('div');
      m.id='contractReasonModal';
      m.className='contract-reason-modal-overlay';
      document.body.appendChild(m);
    }
    m.onclick=function(e){ if(e.target===m) closeReason(); };
    return m;
  }
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function moneyLocal(v){try{ if(typeof window.money==='function') return window.money(Number(v||0)); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/contract-candidates-dark-fix.js",e);} return 'SAR '+Number(v||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function clearNode(node){
    while(node && node.firstChild){ node.removeChild(node.firstChild); }
  }
  function node(tag, className, textValue){
    var el=document.createElement(tag||'div');
    if(className) el.className=className;
    if(textValue!==undefined) el.textContent=String(textValue==null?'':textValue);
    return el;
  }
  function reasonBox(label, value){
    var box=node('div','contract-reason-detail-box');
    box.appendChild(node('small','',label));
    box.appendChild(node('b','',value));
    return box;
  }
  window.petatoeShowContractCandidateReason=function(idx){
    var list=window.__petatoeContractCandidateDetails||[];
    var d=list[Number(idx)];
    if(!d){alert(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('لم يتم العثور على تفاصيل سبب الترشيح لهذا العميل. افتح التقرير مرة أخرى ثم جرّب.'):'لم يتم العثور على تفاصيل سبب الترشيح لهذا العميل. افتح التقرير مرة أخرى ثم جرّب.');return;}
    var score=Number(d.score||0);
    var action=score>=80?'عرض عقد سنوي مباشر':(score>=60?'عرض اتفاقية توريد دوري':'متابعة تجارية قبل عرض العقد');
    var m=ensureReasonModal();
    clearNode(m);
    var card=node('div','contract-reason-modal-card');
    var head=node('div','contract-reason-modal-head');
    var titleWrap=node('div');
    titleWrap.appendChild(node('h3','', 'تفاصيل سبب الترشيح'));
    titleWrap.appendChild(node('p','', String(d.name||'')+' — '+String(d.recommendation||'')));
    var closeBtn=node('button','contract-reason-close','×');
    closeBtn.type='button';
    closeBtn.setAttribute('data-contract-reason-close','1');
    head.appendChild(titleWrap);
    head.appendChild(closeBtn);
    card.appendChild(head);

    var grid=node('div','contract-reason-detail-grid');
    grid.appendChild(reasonBox('إجمالي الإنفاق', moneyLocal(d.value)));
    grid.appendChild(reasonBox('عدد الزيارات', d.visits));
    grid.appendChild(reasonBox('شهور النشاط', d.months));
    grid.appendChild(reasonBox('Score', score));
    grid.appendChild(reasonBox('آخر زيارة', d.lastDate));
    grid.appendChild(reasonBox('أيام الغياب', String(d.days||0)+' يوم'));
    grid.appendChild(reasonBox('متوسط الفاتورة', moneyLocal(d.avgInvoice)));
    grid.appendChild(reasonBox('التصنيف الحالي', d.tier));
    card.appendChild(grid);

    var lines=node('div','contract-reason-lines');
    lines.appendChild(node('span','ok','✓ التوصية: '+String(d.recommendation||'')+' — '+String(d.recommendationDesc||'')));
    lines.appendChild(node('span','', 'سبب الترشيح الكامل: '+String(d.reason||'')));
    lines.appendChild(node('span','ok','✓ الإجراء المقترح: '+action+' مع مراجعة آخر الخدمات والزيارات قبل التواصل.'));
    card.appendChild(lines);
    m.appendChild(card);
    m.style.display='flex';
    m.style.opacity='1';
    m.style.visibility='visible';
    m.style.pointerEvents='auto';
    m.classList.add('show');
  };

  function normalizeContractLimit(){
    var n=Number(window.contractCandidateLimit||0);
    if(!n || n<10) n=10;
    if(n>100) n=100;
    window.contractCandidateLimit=n;
  }

  function ensureSalesInvoiceShell(){
    var tabs=q('#smartTabs'), area=q('#smartReportsArea');
    if(!tabs||!area) return false;
    var btn=tabs.querySelector('[data-smart-tab="salesInvoices"]');
    if(!btn){
      btn=document.createElement('button');
      btn.className='smart-pill';
      btn.setAttribute('data-smart-tab','salesInvoices');
      btn.dataset.smartTab='salesInvoices';
      btn.type='button';
      btn.textContent=(window.PETATOE_LOCALIZATION_CENTER&&typeof window.PETATOE_LOCALIZATION_CENTER.t==='function'?window.PETATOE_LOCALIZATION_CENTER.t('smartReportsSource.tabs.salesInvoices',{}, {fallback:'تقرير فواتير المبيعات',allowKeyFallback:true}):'تقرير فواتير المبيعات');
      btn.onclick=function(){ if(typeof window.setSmartTab==='function') window.setSmartTab('salesInvoices'); };
      var business=tabs.querySelector('[data-smart-tab="forecast"]');
      if(business && business.nextSibling) tabs.insertBefore(btn,business.nextSibling); else tabs.appendChild(btn);
    }
    var sec=area.querySelector('[data-smart-section="salesInvoices"]');
    if(!sec){
      sec=document.createElement('div');
      sec.className='smart-tab-section';
      sec.setAttribute('data-smart-section','salesInvoices');
      sec.dataset.smartSection='salesInvoices';
      var holder=document.createElement('div');
      holder.id='salesInvoiceReportArea';
      sec.appendChild(holder);
      var bsec=area.querySelector('[data-smart-section="forecast"]');
      if(bsec && bsec.nextSibling) area.insertBefore(sec,bsec.nextSibling); else area.appendChild(sec);
    }else if(!q('#salesInvoiceReportArea',sec)){
      var holder=document.createElement('div');
      holder.id='salesInvoiceReportArea';
      sec.appendChild(holder);
    }
    return true;
  }

  function activateSmartTab(tab){
    qa('#smartTabs .smart-pill').forEach(function(b){ b.classList.toggle('active', clean(b.getAttribute('data-smart-tab')||b.dataset.smartTab)===tab); });
    qa('[data-smart-section]').forEach(function(sec){ sec.classList.toggle('active', clean(sec.getAttribute('data-smart-section')||sec.dataset.smartSection)===tab); });
  }

  function patchSmart(){
    normalizeContractLimit();
    ensureSalesInvoiceShell();
  }

  document.addEventListener('click',function(e){
    var more=e.target.closest&&e.target.closest('.new-cust-more-btn');
    if(more && /عميل مرشح|عرض المزيد/.test(more.textContent||'')){
      normalizeContractLimit();
      window.contractCandidateLimit=Math.min(100, Number(window.contractCandidateLimit||10)+10);
    }
    var detail=e.target.closest&&e.target.closest('[data-contract-reason-index]');
    if(detail){
      e.preventDefault();e.stopPropagation();
      window.petatoeShowContractCandidateReason(detail.getAttribute('data-contract-reason-index'));
    }
  },true);
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeReason(); });

  function cleanup(){
    normalizeContractLimit();
    ensureSalesInvoiceShell();
    var m=document.getElementById('contractReasonModal');
    if(m && !m.classList.contains('show')){
      m.style.display='none';m.style.opacity='0';m.style.visibility='hidden';m.style.pointerEvents='none';
    }
  }
  function init(){patchSmart(); cleanup();}
  function scheduleBoundedCleanup(){
    var runs=0;
    function tick(){
      runs+=1;
      cleanup();
      if(runs<8) setTimeout(tick, 1200);
    }
    setTimeout(tick, 1200);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  setTimeout(init,100); setTimeout(init,600); scheduleBoundedCleanup();
})();



(function(){
  if(window.__PETATOE_CONTRACT_DARK_CLOSE_DELEGATION__) return;
  window.__PETATOE_CONTRACT_DARK_CLOSE_DELEGATION__=true;
  document.addEventListener('click', function(e){
    var btn=e.target && e.target.closest && e.target.closest('[data-contract-reason-close]');
    if(!btn) return;
    e.preventDefault();
    if(typeof window.petatoeCloseContractCandidateReason==='function') return window.petatoeCloseContractCandidateReason();
    var m=document.getElementById('contractReasonModal'); if(m) m.classList.remove('show');
  });
})();
