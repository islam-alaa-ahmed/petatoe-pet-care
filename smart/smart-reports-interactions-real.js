/* PETATOE v6.4.51 Phase G1 - Smart Reports Interactions / Search / Bootstrap Real Extraction.
   Extracted from smart-reports-core.js without changing runtime behavior. */

function smartInteractionT(key, fallback, params){
  try{
    if(window.PETATOE_I18N&&typeof window.PETATOE_I18N.t==='function'){
      const value=window.PETATOE_I18N.t('smartReportsSource.interactions.'+key,params||{});
      if(typeof value==='string'&&value.trim()) return value;
    }
  }catch(_){ }
  let out=String(fallback==null?'':fallback);
  Object.keys(params||{}).forEach(k=>{out=out.replace(new RegExp('\\{'+k+'\\}','g'),String(params[k]));});
  return out;
}

// Recommendation report navigation: keeps all report calculations unchanged and only controls tab routing/back button.
function petatoeResolveSmartRecTarget(rec){
  const valid=['overview','sales','vehicles','customers','services','advanced','forecast','recommendations'];
  const report=String((rec&&rec.report)||'').toLowerCase();
  const cat=String((rec&&rec.cat)||'').toLowerCase();
  if(report.includes('heatmap') || report.includes('خريطة')) return 'overview';
  if(report.includes('customer') || report.includes('عميل') || report.includes('عملاء')) return 'customers';
  if(report.includes('خدمات') || report.includes('service')) return 'services';
  if(report.includes('سيارات') || report.includes('vehicle') || report.includes('van')) return 'vehicles';
  if(report.includes('توقع') || report.includes('forecast')) return 'forecast';
  if(report.includes('دفع') || report.includes('مبيعات') || report.includes('إيراد') || report.includes('ايراد') || report.includes('sales')) return 'sales';
  if(report.includes('business') || report.includes('ذكاء')) return 'forecast';
  if(report.includes('executive') || report.includes('متقدمة')) return 'advanced';
  if(rec && rec.tab && valid.includes(rec.tab)) return rec.tab;
  if(cat==='forecast') return 'forecast';
  if(cat==='vehicles') return 'vehicles';
  if(cat==='services' || cat==='profit') return 'services';
  if(cat==='customers' || cat==='pets' || cat==='management') return 'customers';
  return 'sales';
}
function petatoeEnsureSmartRecBackNote(){
  const tabs=document.getElementById('smartTabs');
  if(!tabs) return null;
  let note=document.getElementById('smartRecBackToRecommendationsNote');
  if(!note){
    note=document.createElement('div');
    note.id='smartRecBackToRecommendationsNote';
    note.className='smart-rec-return-note';
    tabs.insertAdjacentElement('afterend',note);
  }
  return note;
}
function petatoeRenderSmartRecBackButton(activeTab){
  const note=petatoeEnsureSmartRecBackNote();
  const show=!!window.petatoeSmartRecReturnActive && activeTab!=='recommendations';
  const label=window.petatoeSmartRecReturnLabel||smartInteractionT('linkedReport','التقرير المرتبط');
  if(note){
    note.classList.toggle('show',show);
    if(show){
      window.PETATOESafeRender.setHTML(note,`<span>📌 ${smartInteractionT('openedFromRecommendations','تم فتح {report} من شاشة التوصيات.',{report:'<b>'+htmlSafe(label)+'</b>'})}</span><div class="smart-rec-return-actions"><button class="smart-rec-back-btn" data-smart-action="back-smart-recommendations">↩️ ${smartInteractionT('backToRecommendations','رجوع لتقرير التوصيات')}</button></div>`);
    }
  }
  try{petatoeRenderSmartRecFloatingBack(activeTab)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
}
function petatoeOpenSmartRecReport(target,reportName){
  const valid=['overview','sales','vehicles','customers','services','advanced','forecast','recommendations'];
  const safeTarget=valid.includes(target)?target:'overview';
  try{window.petatoeSmartRecReturnScrollY=window.scrollY||document.documentElement.scrollTop||0;}catch(e){window.petatoeSmartRecReturnScrollY=0;}
  window.petatoeSmartRecReturnActive=true;
  window.petatoeSmartRecReturnLabel=reportName||'التقرير المرتبط';
  setSmartTab(safeTarget);
  try{petatoeRenderSmartRecFloatingBack(safeTarget)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
  setTimeout(()=>{
    petatoeRenderSmartRecBackButton(safeTarget);
    try{window.scrollTo({top:0,behavior:'smooth'});}catch(e){window.scrollTo(0,0);}
  },90);
}
function petatoeBackToSmartRecommendations(){
  const y=Number(window.petatoeSmartRecReturnScrollY||0);
  window.petatoeSmartRecReturnActive=false;
  window.petatoeSmartRecReturnLabel='';
  setSmartTab('recommendations');
  try{petatoeRenderSmartRecFloatingBack('recommendations')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
  setTimeout(()=>{
    if(y>0){try{window.scrollTo({top:y,behavior:'smooth'});}catch(e){window.scrollTo(0,y);}}
    else{const sec=document.querySelector('[data-smart-section="recommendations"]'); if(sec&&sec.scrollIntoView)sec.scrollIntoView({behavior:'smooth',block:'start'});}
  },80);
}
function petatoeEnsureSmartRecFloatingBack(){
  let btn=document.getElementById('smartRecFloatingBackBtn');
  if(!btn){
    btn=document.createElement('button');
    btn.id='smartRecFloatingBackBtn';
    btn.type='button';
    btn.className='smart-rec-floating-back';
    btn.setAttribute('aria-label','رجوع لتقرير التوصيات');
    btn.addEventListener('click',petatoeBackToSmartRecommendations,{once:false});
    document.body.appendChild(btn);
  }
  return btn;
}
function petatoeRenderSmartRecFloatingBack(activeTab){
  const btn=petatoeEnsureSmartRecFloatingBack();
  const show=!!window.petatoeSmartRecReturnActive && activeTab!=='recommendations';
  const label=window.petatoeSmartRecReturnLabel||smartInteractionT('linkedReport','التقرير المرتبط');
  btn.classList.toggle('show',show);
  if(show){
    window.PETATOESafeRender.setHTML(btn,`<span class="smart-rec-floating-ico">↩️</span><span class="smart-rec-floating-text"><b>رجوع للتوصيات</b><small>${htmlSafe(label)}</small></span>`);
  }
}
window.petatoeOpenSmartRecReport=petatoeOpenSmartRecReport;
window.petatoeBackToSmartRecommendations=petatoeBackToSmartRecommendations;
window.petatoeResolveSmartRecTarget=petatoeResolveSmartRecTarget;
window.petatoeRenderSmartRecFloatingBack=petatoeRenderSmartRecFloatingBack;


// Smart Recommendations filter interaction
function petatoeFilterSmartRecs(cat){
  const safeCat=cat||'revenue';
  window.petatoeSmartRecActiveFilter=safeCat;
  document.querySelectorAll('.smart-rec-filter').forEach(b=>{
    const isActive=b.dataset.recFilter===safeCat;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
  let visibleCount=0;
  document.querySelectorAll('#smartRecommendationsGrid .smart-rec-pro-card').forEach(card=>{
    const show=card.dataset.recCat===safeCat;
    card.classList.toggle('smart-rec-hidden', !show);
    if(show) visibleCount++;
  });
  const counter=document.getElementById('smartRecVisibleCount');
  if(counter) counter.textContent=visibleCount;
}
window.petatoeFilterSmartRecs=petatoeFilterSmartRecs;

let petatoeCeoTooltipTimer=null;
function petatoeCeoTooltipEl(){
  let el=document.getElementById('petatoeCeoKpiTooltip');
  if(!el){
    el=document.createElement('div');
    el.id='petatoeCeoKpiTooltip';
    el.className='petatoe-ceo-kpi-tooltip';
    el.addEventListener('mouseenter',()=>{ if(petatoeCeoTooltipTimer) clearTimeout(petatoeCeoTooltipTimer); });
    el.addEventListener('mouseleave',petatoeScheduleHideCeoKpiTooltip);
    document.body.appendChild(el);
  }
  return el;
}
function petatoeCeoKpiItems(type){
  const list=Array.isArray(window.petatoeSmartRecommendationsCache)?window.petatoeSmartRecommendationsCache:[];
  if(type==='growth') return list.filter(r=>['revenue','profit','pets','services'].includes(r.cat));
  if(type==='high') return list.filter(r=>String(r.prio||'').includes('عالي'));
  if(type==='urgent') return list.filter(r=>String(r.prio||'').includes('عاجل'));
  return [];
}
function petatoeShowCeoKpiTooltip(ev,type){
  if(petatoeCeoTooltipTimer) clearTimeout(petatoeCeoTooltipTimer);
  const labels={growth:'فرص النمو',high:'أولوية عالية',urgent:'تدخل عاجل'};
  const items=petatoeCeoKpiItems(type).slice(0,12);
  const el=petatoeCeoTooltipEl();
  const rows=items.length?items.map((r,i)=>`<div class="ceo-tip-row"><span>${i+1}</span><b>${htmlSafe(r.title||'')}</b><small>${htmlSafe(r.report||'')}</small></div>`).join(''):'<div class="ceo-tip-empty">'+smartInteractionT('noItems','لا توجد عناصر في هذا القسم حاليًا.')+'</div>';
  window.PETATOESafeRender.setHTML(el,`<div class="ceo-tip-head"><strong>${labels[type]||'تفاصيل'}</strong><em>${items.length} عنصر</em></div><div class="ceo-tip-body">${rows}</div>`);
  el.classList.add('show');
  const anchor=ev.currentTarget||ev.target;
  const rect=anchor.getBoundingClientRect();
  const margin=14;
  el.style.left='0px'; el.style.top='0px';
  const tipRect=el.getBoundingClientRect();
  let left=rect.left;
  let top=rect.bottom+10;
  if(left+tipRect.width+margin>window.innerWidth) left=window.innerWidth-tipRect.width-margin;
  if(left<margin) left=margin;
  if(top+tipRect.height+margin>window.innerHeight) top=rect.top-tipRect.height-10;
  if(top<margin) top=margin;
  el.style.left=left+'px';
  el.style.top=top+'px';
}
function petatoeScheduleHideCeoKpiTooltip(){
  if(petatoeCeoTooltipTimer) clearTimeout(petatoeCeoTooltipTimer);
  petatoeCeoTooltipTimer=setTimeout(()=>{
    const el=document.getElementById('petatoeCeoKpiTooltip');
    if(el) el.classList.remove('show');
  },160);
}
window.petatoeShowCeoKpiTooltip=petatoeShowCeoKpiTooltip;
window.petatoeScheduleHideCeoKpiTooltip=petatoeScheduleHideCeoKpiTooltip;

/* PETATOE v3.11.35: setSmartTab moved to smart/smart-tabs.js */


function setCustomerAnalysisTab(tab){
  const allowed=['overview','contracts','compare','ai'];
  const safe=allowed.includes(tab)?tab:'overview';
  window.customerAnalysisSubTab=safe;
  document.querySelectorAll('[data-customer-analysis-tab]').forEach(b=>b.classList.toggle('active', b.dataset.customerAnalysisTab===safe));
  document.querySelectorAll('[data-customer-analysis-pane]').forEach(p=>p.classList.toggle('active', p.dataset.customerAnalysisPane===safe));
  setTimeout(()=>{Object.values(charts||{}).forEach(c=>{try{c.resize();c.update('none')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}})},80);
}

window.setCustomerAnalysisTab=setCustomerAnalysisTab;window.setSmartVanYear=setSmartVanYear;window.setSmartVanDetailsYear=setSmartVanDetailsYear;window.toggleSmartServicesMore=toggleSmartServicesMore;window.setSmartSalesYear=setSmartSalesYear;window.setSmartSalesTaxMode=setSmartSalesTaxMode;window.setSmartServicesYear=setSmartServicesYear;window.setSmartServicesSort=setSmartServicesSort;

window.setReportMode=setReportMode;window.setReportYear=setReportYear;window.setReportMetric=setReportMetric;window.setReportView=setReportView;window.setSalesYear=setSalesYear;window.setVanYear=setVanYear;



/* ===== PETATOE v2.2 - EXPORT ENGINE ===== */

/* ---- Helpers ---- */
function openGlobalSearch(){
  const ov=document.getElementById('globalSearchOverlay');
  const inp=document.getElementById('globalSearchInput');
  if(!ov||!inp)return;
  ov.classList.add('show');
  inp.value='';
  window.PETATOESafeRender.setHTML(document.getElementById('globalSearchResults'),'<div class="gsearch-empty">'+smartInteractionT('searchStart','ابدأ الكتابة للبحث في العملاء والخدمات والسيارات والفواتير...')+'</div>');
  setTimeout(()=>inp.focus(),80);
}
function closeGlobalSearch(){
  const ov=document.getElementById('globalSearchOverlay');
  if(ov)ov.classList.remove('show');
}
document.addEventListener('keydown',function(e){
  if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();openGlobalSearch();return;}
  if(e.key==='/'&&!['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)){e.preventDefault();openGlobalSearch();return;}
  if(e.key==='Escape'){closeGlobalSearch();}
});
function doGlobalSearch(q){
  clearTimeout(_searchDebounce);
  _searchDebounce=setTimeout(()=>_execSearch(q),120);
}
/* _searchIndex: single-pass pre-aggregated index, rebuilt only when records change */
let _searchIndex=null;
function _invalidateSearchIndex(){ _searchIndex=null; }
function _buildSearchIndex(){
  if(_searchIndex) return _searchIndex;  // valid until explicitly invalidated
  // O(n) single pass — aggregates everything in one loop, no nested filters
  const ci={}, si={}, ii={}, vi={};
  records.forEach(r=>{
    const cl=(r.client||'').trim(), svc=(r.item||'').trim();
    const inv=(r.invoice||'').trim(), van=(r.van||'').trim();
    const val=parseNum(r.totalInc), date=r.date||'';
    if(cl){
      if(!ci[cl]) ci[cl]={total:0,count:0};
      ci[cl].total+=val; ci[cl].count++;
    }
    if(svc){
      if(!si[svc]) si[svc]={total:0,count:0};
      si[svc].total+=val; si[svc].count++;
    }
    if(inv){
      if(!ii[inv]) ii[inv]={total:0,client:cl,date};
      else ii[inv].total+=val;
    }
    if(van){
      if(!vi[van]) vi[van]={total:0,count:0};
      vi[van].total+=val; vi[van].count++;
    }
  });
  _searchIndex={clients:ci,services:si,invoices:ii,vans:vi};
  return _searchIndex;
}
// Index invalidation is done directly inside saveRecord, confirmImport, clearAll, delRecord
// (no window.save override — avoids fragile patching when length stays the same after edits)

function _execSearch(q){
  const el=document.getElementById('globalSearchResults');
  if(!el)return;
  q=(q||'').trim().toLowerCase();
  if(!q||q.length<2){smartSafeHtml(el, '<div class="gsearch-empty">'+smartInteractionT('searchMinChars','ابدأ الكتابة للبحث — حرفان على الأقل')+'</div>', 'smart global search min chars render');return;}
  if(!records||!records.length){smartSafeHtml(el, '<div class="gsearch-empty">'+smartInteractionT('searchNoData','لا توجد بيانات مرفوعة بعد')+'</div>', 'smart global search no data render');return;}

  // O(k) where k = number of unique keys, not O(n²)
  const idx=_buildSearchIndex();
  const clients=Object.entries(idx.clients).filter(([k])=>k.toLowerCase().includes(q)).map(([name,v])=>({name,...v}));
  const services=Object.entries(idx.services).filter(([k])=>k.toLowerCase().includes(q)).map(([name,v])=>({name,...v}));
  const invoices=Object.entries(idx.invoices).filter(([k])=>k.toLowerCase().includes(q)).map(([inv,v])=>({inv,...v}));
  const vans=Object.entries(idx.vans).filter(([k])=>k.toLowerCase().includes(q)).map(([name,v])=>({name,...v}));

  if(!clients.length&&!services.length&&!invoices.length&&!vans.length){
    smartSafeHtml(el, '<div class="gsearch-empty">'+smartInteractionT('searchNoResults','لا توجد نتائج لـ "{query}"',{query:htmlSafe(q)})+'</div>', 'smart global search no results render');return;
  }

  let html='';
  if(clients.length){
    html+='<div class="gsearch-section">👥 '+smartInteractionT('customers','العملاء')+'</div>';
    clients.sort((a,b)=>b.total-a.total).slice(0,6).forEach(x=>{
      html+=`<div class="gsearch-row" data-smart-action="global-search-tab" data-tab="customers"><span class="g-ico">👤</span><div class="g-main"><div class="g-title">${htmlSafe(x.name)}</div><div class="g-sub">${fmt0(x.count)} ${smartInteractionT('transactions','معاملة')}</div></div><span class="g-badge">${money(x.total)}</span></div>`;
    });
  }
  if(services.length){
    html+='<div class="gsearch-section">🔧 '+smartInteractionT('services','الخدمات')+'</div>';
    services.sort((a,b)=>b.total-a.total).slice(0,5).forEach(x=>{
      html+=`<div class="gsearch-row" data-smart-action="global-search-tab" data-tab="services"><span class="g-ico">🔧</span><div class="g-main"><div class="g-title">${htmlSafe(x.name)}</div><div class="g-sub">${fmt0(x.count)} ${smartInteractionT('operations','عملية')}</div></div><span class="g-badge">${money(x.total)}</span></div>`;
    });
  }
  if(vans.length){
    html+='<div class="gsearch-section">🚐 '+smartInteractionT('vehicles','السيارات')+'</div>';
    vans.sort((a,b)=>b.total-a.total).slice(0,4).forEach(x=>{
      html+=`<div class="gsearch-row" data-smart-action="global-search-tab" data-tab="vehicles"><span class="g-ico">🚐</span><div class="g-main"><div class="g-title">${htmlSafe(x.name)}</div><div class="g-sub">${fmt0(x.count)} ${smartInteractionT('operations','عملية')}</div></div><span class="g-badge">${money(x.total)}</span></div>`;
    });
  }
  if(invoices.length){
    html+='<div class="gsearch-section">🧾 '+smartInteractionT('invoices','الفواتير')+'</div>';
    invoices.sort((a,b)=>b.total-a.total).slice(0,5).forEach(x=>{
      html+=`<div class="gsearch-row" data-smart-action="global-search-invoice" data-invoice="${htmlSafe(x.inv)}"><span class="g-ico">🧾</span><div class="g-main"><div class="g-title">${smartInteractionT('invoiceNumber','فاتورة رقم {number}',{number:htmlSafe(x.inv)})}</div><div class="g-sub">${htmlSafe(x.client)} — ${htmlSafe(x.date||'')}</div></div><span class="g-badge">${money(x.total)}</span></div>`;
    });
  }
  smartSafeHtml(el, html, 'smart global search results render');
}
window.openGlobalSearch=openGlobalSearch;
window.closeGlobalSearch=closeGlobalSearch;
window.doGlobalSearch=doGlobalSearch;


/* PETATOE v6.2.6 Phase 6A - Smart Reports delegated handlers.
   Keeps existing global functions intact while removing inline Smart Reports event handlers from rendered markup. */
function petatoeSmartHandleAction(el, ev){
  if(!el || !el.dataset) return false;
  const action=el.dataset.smartAction;
  if(!action) return false;
  switch(action){
    case 'export-page-pdf': if(window.petatoeExportActivePagePdf) window.petatoeExportActivePagePdf(); return true;
    case 'export-excel': if(window.exportExcel) window.exportExcel(); return true;
    case 'vehicle-efficiency-filter': setSmartVehicleEfficiencyFilter(el.dataset.smartKey, el.value); return true;
    case 'vehicle-efficiency-reset': resetSmartVehicleEfficiencyFilters(); return true;
    case 'overview-year': window.smartOverviewCardsYear=el.dataset.year==='all'?'all':Number(el.dataset.year); renderSmartReports(); setSmartTab('overview'); return true;
    case 'open-customer360': if(window.openCustomer360) window.openCustomer360(el.dataset.name||''); return true;
    case 'new-customer-more': if(window.petatoeSmartCustomersHandleLocalFilter) return window.petatoeSmartCustomersHandleLocalFilter(el,ev)!==false; window.smartNewCustomerTableLimit=Number(el.dataset.limit||10); renderSmartReports(); setSmartTab('customers'); return true;
    case 'new-customer-year': if(window.petatoeSmartCustomersHandleLocalFilter) return window.petatoeSmartCustomersHandleLocalFilter(el,ev)!==false; window.smartNewCustomerManualSelection=true; window.smartNewCustomerYear=el.dataset.year||'all'; window.smartNewCustomerPeriod=''; window.smartNewCustomerTableLimit=10; renderSmartReports(); setSmartTab('customers'); return true;
    case 'new-customer-period': if(window.petatoeSmartCustomersHandleLocalFilter) return window.petatoeSmartCustomersHandleLocalFilter(el,ev)!==false; window.smartNewCustomerManualSelection=true; window.smartNewCustomerPeriod=el.dataset.period||''; window.smartNewCustomerTableLimit=10; renderSmartReports(); setSmartTab('customers'); return true;
    case 'target-year': selectSmartTargetYear(Number(el.dataset.year)); return true;
    case 'target-period': selectSmartTargetPeriod(el.dataset.period||''); return true;
    case 'customer-insight-more': window.customerInsightTableLimit=Number(el.dataset.limit||10); renderSmartReports(); setSmartTab('customers'); return true;
    case 'customer-compare-tax': customerCompareSetFilter('tax',el.dataset.tax||'gross'); return true;
    case 'customer-compare-more': customerCompareShowMore(el.dataset.key||''); return true;
    case 'customer-compare-export': exportCustomerCompareSection(el.dataset.kind||''); return true;
    case 'inactive-recovery-more': window.inactiveRecoveryTableLimit=Number(el.dataset.limit||15); renderSmartReports(); setSmartTab('customers'); return true;
    case 'inactive-sort': window.inactiveCustomerSort=el.dataset.sort||'spend'; window.inactiveCustTableLimit=15; renderSmartReports(); setSmartTab('customers'); return true;
    case 'inactive-more': window.inactiveCustTableLimit=Number(el.dataset.limit||15); renderSmartReports(); setSmartTab('customers'); return true;
    case 'customer-activity-export': petatoeExportCustomerActivityFollowup(el.dataset.kind||''); return true;
    case 'contract-reason': if(window.petatoeShowContractCandidateReason) window.petatoeShowContractCandidateReason(Number(el.dataset.index||0)); return true;
    case 'customer-analysis-tab': setCustomerAnalysisTab(el.dataset.tab||'overview'); return true;
    case 'contract-candidates-excel': petatoeExportContractCandidatesExcel(); return true;
    case 'contract-candidates-pdf': petatoeExportContractCandidatesPdf(); return true;
    case 'report-mode': setReportMode(el.dataset.mode||'months'); return true;
    case 'recommendation-filter': petatoeFilterSmartRecs(el.dataset.filter||'revenue'); return true;
    case 'new-returning-list': if(window.openSmartNewReturningList) window.openSmartNewReturningList(el.dataset.kind||'returning'); return true;
    case 'back-smart-recommendations': petatoeBackToSmartRecommendations(); return true;
    case 'global-search-tab': closeGlobalSearch(); PETATOEInlineHandlers.moduleCall('router','openTab','smart',el.dataset.tab||'overview'); return true;
    case 'global-search-invoice':
      closeGlobalSearch();
      PETATOEInlineHandlers.moduleCall('router','openTab','records');
      setTimeout(function(){const rs=$('recordSearch'); if(rs) rs.value=el.dataset.invoice||''; if(window.renderRecords) renderRecords();},100);
      return true;
    case 'sales-yoy-year':
      { const yr=Number(el.dataset.year); window.salesYoYCustomMode=false; window.salesYoYSelectedYear=yr; window.salesYoYBaseYear=Number(el.dataset.base||yr-1); window.salesYoYCompareYear=yr; renderSmartReports(); }
      return true;
    case 'sales-yoy-custom-toggle': toggleSalesYoYCustomMode(ev); return true;
    case 'contract-candidate-more': window.contractCandidateLimit=Number(el.dataset.limit||10); renderSmartReports(); setSmartTab('customers'); return true;
    case 'recommendation-toggle': { const card=el.closest('.smart-rec-pro-card'); if(card) card.classList.toggle('open'); } return true;
    case 'recommendation-open': petatoeOpenSmartRecReport(el.dataset.target||'',el.dataset.report||''); return true;
    case 'smart-tab': setSmartTab(el.dataset.tab||'overview'); return true;
    case 'export-at-risk-clients': if(window.exportSmartAtRiskClients) window.exportSmartAtRiskClients(); return true;
    case 'at-risk-more': window.smartAtRiskLimit=(window.smartAtRiskLimit||10)+10; renderSmartReports(); return true;
    case 'sales-target-toggle': toggleSalesTargetEditor(ev); return true;
    case 'sales-target-enable-edit': enableSmartTargetEdit(); return true;
    case 'sales-target-save': saveSmartMonthlyTarget(el.dataset.clear==='true'); return true;
    case 'sales-monthly-mode': if(window.setSalesIntelMonthlyMode) window.setSalesIntelMonthlyMode(el.dataset.mode||'gross'); return true;
    case 'sales-month-compare-mode': if(window.setSalesIntelMonthCompareMode) window.setSalesIntelMonthCompareMode(el.dataset.mode||'gross'); return true;
    case 'heatmap-year': if(window.setSmartYear) window.setSmartYear(el.dataset.year||'all'); return true;
    case 'heatmap-month': if(window.showHeatMonthCalendar) window.showHeatMonthCalendar(el.dataset.year||'all', Number(el.dataset.month||0)); return true;
    case 'service-year': if(window.setSmartServicesYear) window.setSmartServicesYear(el.dataset.year||'all'); return true;
    case 'service-sort': if(window.setSmartServicesSort) window.setSmartServicesSort(el.dataset.sort||'valueDesc'); return true;
    case 'service-more': if(window.toggleSmartServicesMore) window.toggleSmartServicesMore(); return true;
  }
  return false;
}
function petatoeSmartHandleChange(el){
  if(!el || !el.dataset) return false;
  if(el.dataset.smartAction==='customer-compare-filter'){
    customerCompareSetFilter(el.dataset.customerCompareFilter||'', el.value);
    return true;
  }
  if(el.dataset.smartAction==='vehicle-efficiency-filter'){
    setSmartVehicleEfficiencyFilter(el.dataset.smartKey, el.value);
    return true;
  }
  if(el.dataset.smartAction==='sales-yoy-base'){ window.salesYoYBaseYear=+el.value; renderSmartReports(); return true; }
  if(el.dataset.smartAction==='sales-yoy-compare'){ window.salesYoYCompareYear=+el.value; renderSmartReports(); return true; }
  if(el.dataset.smartAction==='sales-monthly-filter'){ if(window.setSalesIntelMonthlyFilter) window.setSalesIntelMonthlyFilter(el.dataset.smartKey||'', el.value); return true; }
  if(el.dataset.smartAction==='heatmap-vehicle'){ if(window.setSmartHeatmapVan) window.setSmartHeatmapVan(el.value); return true; }
  return false;
}
function petatoeSmartBindDelegatedHandlers(){
  if(window.__petatoeSmartDelegatedHandlersBound) return;
  window.__petatoeSmartDelegatedHandlersBound=true;
  document.addEventListener('click',function(ev){
    const el=ev.target && ev.target.closest ? ev.target.closest('[data-smart-action]') : null;
    if(el && petatoeSmartHandleAction(el,ev)){ ev.preventDefault(); }
  });
  document.addEventListener('change',function(ev){
    const el=ev.target;
    if(el && petatoeSmartHandleChange(el)){ ev.preventDefault(); }
  });
  document.addEventListener('input',function(ev){
    const el=ev.target;
    if(el && el.dataset && el.dataset.smartAction==='what-if-input' && window.petatoeUpdateWhatIf){ window.petatoeUpdateWhatIf(); }
  });
}
petatoeSmartBindDelegatedHandlers();

/* --- Print / PDF current page --- */
function printCurrentPage(){window.print();}
window.printCurrentPage=printCurrentPage;

/* --- Dashboard filter debounce (single source - HTML onchange handles it) --- */
// No extra listener added — filters already have data-pet-filter="dashboard" in HTML.
// Adding another listener here caused double render. Fixed in v2.1.

/* v3.11.19: lazy tab wrapper removed; navigation is owned by PETATOERouter. */

/* --- Updated init with loader hide --- */
(async function dashboardBoot(){initPetImage();buildForm();records=await loadRecords();records.forEach(r=>{r.date=parseDate(r.date);r.month=normalizeMonth(r.month,r.date)});populateFilters();if($('fYear')) $('fYear').value=getDashboardDefaultYear();renderDashboardAll();renderDeep()})();
/* Hide loader after init */
(function(){
  const loader=document.getElementById('petatoeLoader');
  if(loader){setTimeout(()=>loader.classList.add('hidden'),650);}
})();


