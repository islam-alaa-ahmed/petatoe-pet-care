(function(){
'use strict';
if(window.PETATOE_FULL_PAGE_PDF_EXPORT_READY) return;
window.PETATOE_FULL_PAGE_PDF_EXPORT_READY = true;

function petBlock5852_q(sel,root){return (root||document).querySelector(sel)}
function qa(sel,root){return Array.prototype.slice.call((root||document).querySelectorAll(sel))}
function block_5843_esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function cleanText(v){return String(v||'').replace(/\s+/g,' ').trim()}
function todayStamp(){return (window.PETATOEDate&&PETATOEDate.todayString)?PETATOEDate.todayString():(new Date()).toISOString().slice(0,10)}
function notify(msg){try{ if(typeof toast==='function') toast(msg); else console.log(msg); }catch(e){console.log(msg)}}

function getActivePanel(){
  var panel=petBlock5852_q('.panel.active') || petBlock5852_q('#dashboard');
  try{
    if(panel && panel.id==='commissionStatement' && window.renderCommissionStatementPage){
      window.renderCommissionStatementPage();
      panel=petBlock5852_q('#commissionStatement') || panel;
    }
  }catch(e){console.warn('PETATOE page PDF pre-render skipped',e)}
  return panel;
}
function getPanelTitle(panel){
  if(!panel) return 'PETATOE Report';
  var smart=petBlock5852_q('.smart-tab-section.active h3',panel) || petBlock5852_q('.smart-tab-section.active .chart-head b',panel);
  var h=petBlock5852_q('.section-head h2',panel) || petBlock5852_q('.smart-hero h2',panel) || petBlock5852_q('.exec-hero h2',panel) || petBlock5852_q('.fleet-hero h2',panel) || smart || petBlock5852_q('h2,h3',panel);
  return cleanText(h?h.textContent:panel.id||'PETATOE Report') || 'PETATOE Report';
}
function syncFormValues(src,clone){
  var srcEls=qa('input,textarea,select',src), cloneEls=qa('input,textarea,select',clone);
  srcEls.forEach(function(el,i){
    var c=cloneEls[i]; if(!c) return;
    if(el.tagName==='SELECT'){
      var selectedText='';
      c.value = el.value;
      Array.prototype.forEach.call(c.options,function(o){
        var isSel=(o.value===el.value);
        o.selected=isSel;
        if(isSel){ o.setAttribute('selected','selected'); selectedText=cleanText(o.textContent||o.value); }
        else o.removeAttribute('selected');
      });
      c.setAttribute('value', el.value||'');
      c.setAttribute('data-print-selected-text', selectedText || el.value || '');
    }else if(el.type==='checkbox'||el.type==='radio'){
      if(el.checked){ c.checked=true; c.setAttribute('checked','checked'); } else { c.checked=false; c.removeAttribute('checked'); }
    }else{
      c.value = el.value||'';
      c.setAttribute('value',el.value||'');
      if(c.tagName==='TEXTAREA') c.textContent=el.value||'';
    }
  });
}
function nearestLabelText(el){
  var id=el && el.id;
  var label='';
  if(id){
    var l=document.querySelector('label[for="'+String(id).replace(/"/g,'\\"')+'"]');
    if(l) label=cleanText(l.textContent);
  }
  if(!label){
    var p=el && el.closest && el.closest('label');
    if(p) label=cleanText(p.textContent).replace(cleanText(el.value||''),'');
  }
  if(!label && el){
    var ph=el.getAttribute('placeholder')||el.getAttribute('aria-label')||el.name||el.id||'';
    label=cleanText(ph);
  }
  return label;
}
function collectActiveFilterSummary(src){
  var zonesSel='.filters,.smart-controls,.exec-toolbar,.fleet-toolbar,.report-tabs,.year-strip,.new-cust-controls,.new-cust-year-controls,.advanced-tax-actions,.sales-target-year-row,.sales-target-month-row,.yoy-control-panel,.inactive-sort-actions';
  var parts=[];
  var seen={};
  function add(label,val){
    label=cleanText(label||'فلتر'); val=cleanText(val||'');
    if(!val || /^(الكل|كل|all)$/i.test(val)) return;
    var key=label+'='+val;
    if(seen[key]) return; seen[key]=1;
    parts.push({label:label,val:val});
  }
  qa(zonesSel,src).forEach(function(zone){
    qa('select',zone).forEach(function(s){
      var opt=s.options && s.selectedIndex>=0 ? s.options[s.selectedIndex] : null;
      var txt=cleanText(opt ? opt.textContent : s.value);
      var lbl=nearestLabelText(s) || cleanText(zone.getAttribute('data-filter-label')||'فلتر');
      add(lbl,txt);
    });
    qa('input:not([type=file]):not([type=hidden])',zone).forEach(function(inp){
      if((inp.type==='checkbox'||inp.type==='radio') && !inp.checked) return;
      var val=(inp.type==='checkbox'||inp.type==='radio') ? (nearestLabelText(inp)||inp.value) : inp.value;
      add(nearestLabelText(inp)||'فلتر',val);
    });
    qa('.active,[aria-pressed="true"]',zone).forEach(function(a){
      if(a.tagName==='SELECT'||a.tagName==='OPTION'||a.tagName==='INPUT') return;
      var txt=cleanText(a.textContent);
      if(!txt) return;
      if(txt.length>45) txt=txt.slice(0,45)+'…';
      var label='الاختيار الحالي';
      if(zone.classList.contains('year-strip') || /year/i.test(zone.className)) label='السنة';
      else if(/month/i.test(zone.className)) label='الشهر';
      else if(zone.classList.contains('report-tabs')) label='تبويب التقرير';
      else if(zone.classList.contains('inactive-sort-actions')) label='ترتيب العرض';
      add(label,txt);
    });
  });
  return parts;
}
function injectPrintFilterSummary(clone,filters){
  if(!filters || !filters.length) return;
  var box=document.createElement('div');
  box.className='pet-print-filter-summary';
  box.innerHTML='<b>الفلاتر المطبقة في هذا التصدير:</b> '+filters.map(function(f){return '<span><strong>'+block_5843_esc(f.label)+'</strong>: '+block_5843_esc(f.val)+'</span>';}).join('');
  clone.insertBefore(box, clone.firstChild);
}
function freezeFilterControls(clone){
  var zonesSel='.filters,.smart-controls,.exec-toolbar,.fleet-toolbar,.report-tabs,.year-strip,.new-cust-controls,.new-cust-year-controls,.advanced-tax-actions,.sales-target-year-row,.sales-target-month-row,.yoy-control-panel,.inactive-sort-actions';
  qa(zonesSel,clone).forEach(function(zone){
    qa('select',zone).forEach(function(s){
      var txt=s.getAttribute('data-print-selected-text') || (s.options && s.selectedIndex>=0 ? s.options[s.selectedIndex].textContent : s.value) || '';
      var span=document.createElement('span');
      span.className='pet-print-frozen-filter';
      span.textContent=cleanText(txt) || '—';
      s.parentNode.replaceChild(span,s);
    });
    qa('input:not([type=file]):not([type=hidden])',zone).forEach(function(inp){
      if(inp.type==='checkbox'||inp.type==='radio') return;
      var span=document.createElement('span');
      span.className='pet-print-frozen-filter';
      span.textContent=cleanText(inp.value||'—');
      inp.parentNode.replaceChild(span,inp);
    });
  });
}
function replaceCanvasesWithImages(src,clone){
  var srcCan=qa('canvas',src), cloneCan=qa('canvas',clone);
  cloneCan.forEach(function(c,i){
    var s=srcCan[i];
    if(!s) return;
    try{
      var img=document.createElement('img');
      img.src=s.toDataURL('image/png',1.0);
      img.className=(c.className||'')+' pet-print-canvas-img';
      img.style.cssText='display:block;width:100%;max-width:100%;height:auto;object-fit:contain;margin:0 auto;';
      var h=s.getBoundingClientRect().height||c.height||260;
      img.style.maxHeight=Math.max(220,Math.min(520,h))+'px';
      c.parentNode.replaceChild(img,c);
    }catch(e){
      var ph=document.createElement('div');
      ph.textContent='تعذر نقل الشارت إلى نسخة الطباعة';
      ph.style.cssText='padding:18px;text-align:center;border:1px dashed #cbd5e1;border-radius:12px;color:#64748b;font-weight:900';
      c.parentNode.replaceChild(ph,c);
    }
  });
}

function expandVirtualTablesForPrintClone(clone){
  try{
    if(!clone || !clone.querySelectorAll || !window.PETATOETables || typeof window.PETATOETables.rowsForExport !== 'function') return clone;
    qa('[data-pet-virtual="1"], [data-pet-render-complete="virtual"]', clone).forEach(function(wrap){
      var id=wrap && wrap.id;
      if(!id) return;
      var rows=window.PETATOETables.rowsForExport(id);
      if(!rows || !rows.length) return;
      var table=document.createElement('table');
      table.className='pet-data-table pet-export-expanded-table';
      var thead=document.createElement('thead');
      var tbody=document.createElement('tbody');
      rows.forEach(function(row,idx){
        var tr=document.createElement('tr');
        (row||[]).forEach(function(cell){
          var el=document.createElement(idx===0?'th':'td');
          el.textContent=cell==null?'':String(cell);
          tr.appendChild(el);
        });
        (idx===0?thead:tbody).appendChild(tr);
      });
      table.appendChild(thead);
      table.appendChild(tbody);
      wrap.innerHTML='';
      wrap.appendChild(table);
      wrap.setAttribute('data-pet-export-expanded','1');
      wrap.style.maxHeight='none';
      wrap.style.overflow='visible';
    });
  }catch(e){console.warn('PETATOE virtual print expansion skipped',e)}
  return clone;
}
function prepareSmartReportsPrintClone(src,clone){
  try{
    if(!src || !clone || src.id !== 'smart') return clone;
    clone.classList.add('pet-smart-print-document');
    clone.setAttribute('data-smart-print-layout','rc2');
    var active = clone.querySelector('.smart-tab-section.active[data-smart-section]') || clone.querySelector('[data-smart-section].active');
    var activeKey = active ? (active.getAttribute('data-smart-section') || '') : '';
    qa('.smart-tab-section[data-smart-section]', clone).forEach(function(sec){
      if(sec !== active){ sec.remove(); }
    });
    qa('#smartTabs,.smart-actions-row,.smart-hero-actions,.smart-icon,.report-tabs,.smart-controls,.new-cust-controls,.new-cust-year-controls,.customer-yoy-controls,.year-strip,.advanced-tax-actions,.sales-target-year-row,.sales-target-month-row,.inactive-sort-actions,.contract-actions,.new-cust-table-footer button', clone).forEach(function(x){x.remove();});
    qa('button,.btn,.exp-btn,.pet-page-pdf-btn,.smart-pill,.chip', clone).forEach(function(x){x.remove();});
    qa('.new-cust-table-footer', clone).forEach(function(x){
      x.style.justifyContent='center';
      x.style.fontSize='9px';
      x.style.border='0';
      x.style.background='transparent';
    });
    var hero = clone.querySelector('.smart-hero');
    if(hero){
      hero.classList.add('pet-smart-print-hero');
      var p=hero.querySelector('p');
      if(p) p.textContent='تقرير PDF منسق للتقارير الذكية — يعرض التبويب النشط فقط مع الفلاتر المختارة والرسوم والجداول بدون أزرار الواجهة.';
    }
    if(active && activeKey){
      var title = active.querySelector('h3,h4,.chart-head b');
      if(title){
        var stamp=document.createElement('div');
        stamp.className='pet-smart-print-section-stamp';
        stamp.textContent='التقرير النشط: '+cleanText(title.textContent||activeKey);
        active.insertBefore(stamp, active.firstChild);
      }
    }
    qa('.new-cust-tier-tooltip,.pet-tooltip,.tooltip', clone).forEach(function(x){x.remove();});
    qa('.smart-empty', clone).forEach(function(x){
      if(!cleanText(x.textContent)) x.remove();
    });
  }catch(e){console.warn('PETATOE smart print clone cleanup skipped',e)}
  return clone;
}

function prepareClone(src){
  var filters=collectActiveFilterSummary(src);
  var clone=src.cloneNode(true);
  prepareSmartReportsPrintClone(src,clone);
  syncFormValues(src,clone);
  freezeFilterControls(clone);
  injectPrintFilterSummary(clone,filters);
  replaceCanvasesWithImages(src,clone);
  expandVirtualTablesForPrintClone(clone);
  qa('script, .pet-page-pdf-bar, .pdf-modal-toolbar, .pdf-period-bar, #petatoeLoader, #globalSearchOverlay, .pet-modal-overlay, .heat-calendar-overlay, .treasury-tabs-v82, .wh-tabs',clone).forEach(function(x){x.remove()});
  qa('.exp-btn, .btn, button, input[type="file"]',clone).forEach(function(x){
    if(x.closest('.filters') || x.closest('.smart-controls') || x.closest('.exec-toolbar') || x.closest('.fleet-toolbar') || x.closest('.report-tabs') || x.closest('.year-strip') || x.closest('.new-cust-controls') || x.closest('.advanced-tax-actions') || x.closest('.sales-target-control-box')) return;
    if(x.classList.contains('cust360-back-btn')) x.remove();
  });
  /* PETATOE v3.8.9 FIX:
     لا نحذف display:none من العناصر المفلترة؛ لأن الفلاتر غالباً تخفي الصفوف غير المطلوبة
     بـ inline style. حذفها كان يصدّر كل البيانات بدل نتيجة الفلتر الحالية. */
  qa('.table-wrap,.smart-table-clean,.sales-intel-table,.bi-table,.exec-table,.pet-dd-table,.gov-table,.report-scroll,.com-table',clone).forEach(function(w){
    w.style.overflow='visible'; w.style.maxHeight='none'; w.style.maxWidth='100%'; w.style.width='100%';
  });
  /* PETATOE v3.8.87 PDF SANITIZE:
     The new treasury/warehouse sections use scroll containers in the live UI.
     Chrome prints the native scroll track as a silver horizontal line even when the scrollbar is hidden.
     In the exported clone only, remove wrapper borders/shadows and force the real table to carry the visual structure. */
  qa('.tr-table,.tr-statement-table,.wh-table,.warehouse-table,.treasury-movements-card .tr-table',clone).forEach(function(w){
    w.style.overflow='visible';
    w.style.maxHeight='none';
    w.style.maxWidth='100%';
    w.style.width='100%';
    w.style.border='0';
    w.style.borderRadius='0';
    w.style.background='transparent';
    w.style.boxShadow='none';
    w.style.padding='0';
  });
  qa('.tr-table table,.tr-statement-table table,.wh-table table,.warehouse-table table',clone).forEach(function(t){
    t.style.minWidth='0';
    t.style.width='100%';
    t.style.tableLayout='fixed';
  });
  return clone;
}
function collectStyles(theme){
  theme = theme || (document.documentElement.getAttribute('data-theme') || 'dark');
  var isDark = theme === 'dark';
  var pageBg = isDark ? '#070b14' : '#ffffff';
  var cardBg = isDark ? '#0f172a' : '#ffffff';
  var cardBg2 = isDark ? '#111827' : '#f8fafc';
  var textColor = isDark ? '#f8fafc' : '#0f172a';
  var mutedColor = isDark ? '#cbd5e1' : '#475569';
  var borderColor = isDark ? 'rgba(148,163,184,.24)' : '#dbe2ef';
  var tableHead = isDark ? '#5b21b6' : '#6d28d9';
  var out='';
  qa('style').forEach(function(st){out += '\n<style>'+st.textContent+'</style>';});
  qa('link[rel="stylesheet"]').forEach(function(l){ if(l.href) out += '\n<link rel="stylesheet" href="'+block_5843_esc(l.href)+'">'; });
  out += '<style>\n'+
    '@page{size:A4 landscape;margin:8mm;}\n'+
    '*{box-sizing:border-box!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}\n'+
    'html,body{margin:0!important;padding:0!important;background:'+pageBg+'!important;color:'+textColor+'!important;direction:rtl;font-family:Cairo,Arial,sans-serif!important;overflow:visible!important;}\n'+
    'body:before,body:after,.sidebar,.topbar,.side-launcher,.overlay,.toast,#toast,.pet-page-pdf-bar,.export-toolbar,.pager{display:none!important;}\n'+
    '#petatoe-universal-print-shell .treasury-tabs-v82,#petatoe-universal-print-shell .wh-tabs{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;box-shadow:none!important;overflow:hidden!important;}\n'+
    '.pet-print-shell{padding:0;background:'+pageBg+'!important;color:'+textColor+'!important;}\n'+
    '.pet-print-header{display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:3px solid #7c3aed;margin:0 0 14px;padding:0 0 10px;color:'+textColor+'!important;background:'+pageBg+'!important;}\n'+
    '.pet-print-brand{display:flex;align-items:center;gap:10px;font-weight:950;color:'+(isDark?'#ddd6fe':'#4c1d95')+'!important}.pet-print-logo{width:42px;height:42px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,#8b5cf6,#6d5dfc);color:#fff!important;font-size:23px}.pet-print-meta{text-align:left;font-size:10px;font-weight:900;color:'+mutedColor+'!important;line-height:1.7}.pet-print-title{text-align:center;flex:1}.pet-print-title b{font-size:19px;color:'+textColor+'!important}.pet-print-title small{display:block;color:'+(isDark?'#c4b5fd':'#6d28d9')+'!important;font-weight:900;margin-top:3px}\n'+
    '#petatoe-universal-print-shell .pet-print-filter-summary{display:flex!important;align-items:center!important;gap:6px!important;flex-wrap:wrap!important;margin:0 0 5mm!important;padding:7px 9px!important;border:1px solid '+borderColor+'!important;border-radius:10px!important;background:'+cardBg2+'!important;color:'+textColor+'!important;font:900 10px Cairo,Arial,sans-serif!important;break-inside:avoid!important;page-break-inside:avoid!important;}\n'+
    '#petatoe-universal-print-shell .pet-print-filter-summary b{color:'+(isDark?'#ddd6fe':'#4c1d95')+'!important;margin-inline-end:4px!important;}#petatoe-universal-print-shell .pet-print-filter-summary span{display:inline-flex!important;align-items:center!important;gap:3px!important;border:1px solid '+borderColor+'!important;border-radius:999px!important;padding:3px 8px!important;background:'+cardBg+'!important;color:'+textColor+'!important;}#petatoe-universal-print-shell .pet-print-filter-summary strong{color:'+(isDark?'#93c5fd':'#6d28d9')+'!important;}\n'+
    '#petatoe-universal-print-shell .pet-print-frozen-filter{display:inline-flex!important;align-items:center!important;justify-content:center!important;min-height:22px!important;border:1px solid '+borderColor+'!important;border-radius:9px!important;background:'+cardBg2+'!important;color:'+textColor+'!important;padding:3px 8px!important;font:900 9px Cairo,Arial,sans-serif!important;}\n'+
    '#petatoe-universal-print-shell,#petatoe-universal-print-shell *{text-shadow:none!important;}\n'+
    '#petatoe-universal-print-shell .panel{display:block!important;width:100%!important;max-width:100%!important;background:'+pageBg+'!important;color:'+textColor+'!important;}\n'+
    '#petatoe-universal-print-shell .panel:not(.active){display:none!important}#petatoe-universal-print-shell .smart-tab-section:not(.active){display:none!important}\n'+
    '#petatoe-universal-print-shell .card,#petatoe-universal-print-shell .kpi,#petatoe-universal-print-shell .smart-card,#petatoe-universal-print-shell .smart-kpi,#petatoe-universal-print-shell .smart-panel,#petatoe-universal-print-shell .exec-card,#petatoe-universal-print-shell .exec-kpi,#petatoe-universal-print-shell .bi-panel,#petatoe-universal-print-shell .bi-kpi,#petatoe-universal-print-shell .sales-intel-panel,#petatoe-universal-print-shell .new-cust-kpi,#petatoe-universal-print-shell .inactive-cust-kpi,#petatoe-universal-print-shell .fleet-card,#petatoe-universal-print-shell .gov-panel{background:'+cardBg+'!important;color:'+textColor+'!important;border:1px solid '+borderColor+'!important;box-shadow:none!important;break-inside:avoid;page-break-inside:avoid;}\n'+
    '#petatoe-universal-print-shell .section-head,#petatoe-universal-print-shell .smart-hero,#petatoe-universal-print-shell .exec-hero,#petatoe-universal-print-shell .bi-hero,#petatoe-universal-print-shell .ai-forecast-hero,#petatoe-universal-print-shell .fleet-hero{background:'+cardBg+'!important;color:'+textColor+'!important;box-shadow:none!important;border:1px solid '+borderColor+'!important;border-radius:16px!important;padding:12px!important;margin-bottom:12px!important;break-inside:avoid;}\n'+
    '#petatoe-universal-print-shell h1,#petatoe-universal-print-shell h2,#petatoe-universal-print-shell h3,#petatoe-universal-print-shell h4,#petatoe-universal-print-shell b,#petatoe-universal-print-shell span,#petatoe-universal-print-shell p,#petatoe-universal-print-shell small,#petatoe-universal-print-shell div,#petatoe-universal-print-shell label{color:inherit!important;}\n'+
    '#petatoe-universal-print-shell small,#petatoe-universal-print-shell p,#petatoe-universal-print-shell .muted,#petatoe-universal-print-shell .chart-head small{color:'+mutedColor+'!important;}\n'+
    '#petatoe-universal-print-shell .chart,#petatoe-universal-print-shell .smart-chart,#petatoe-universal-print-shell .exec-chart,#petatoe-universal-print-shell .bi-chart,#petatoe-universal-print-shell .sales-intel-chart,#petatoe-universal-print-shell .new-cust-chart,#petatoe-universal-print-shell .inactive-cust-chart{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;break-inside:avoid;}\n'+
    '#petatoe-universal-print-shell .pet-print-canvas-img{break-inside:avoid;page-break-inside:avoid;background:'+cardBg+'!important;border-radius:12px;}\n'+
    '#petatoe-universal-print-shell .grid,#petatoe-universal-print-shell .grid-2,#petatoe-universal-print-shell .grid-3,#petatoe-universal-print-shell .smart-grid,#petatoe-universal-print-shell .smart-grid-3,#petatoe-universal-print-shell .smart-dash-grid,#petatoe-universal-print-shell .smart-dash-grid.two,#petatoe-universal-print-shell .sales-intel-grid,#petatoe-universal-print-shell .sales-intel-grid.two,#petatoe-universal-print-shell .sales-intel-grid.four,#petatoe-universal-print-shell .bi-grid,#petatoe-universal-print-shell .exec-grid,#petatoe-universal-print-shell .exec-grid.three,#petatoe-universal-print-shell .new-cust-grid,#petatoe-universal-print-shell .inactive-cust-section{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;width:100%!important;}\n'+
    '#petatoe-universal-print-shell .kpis,#petatoe-universal-print-shell .smart-kpis,#petatoe-universal-print-shell .smart-exec-grid,#petatoe-universal-print-shell .exec-kpi-grid,#petatoe-universal-print-shell .bi-kpi-grid,#petatoe-universal-print-shell .report-kpis,#petatoe-universal-print-shell .new-cust-kpis,#petatoe-universal-print-shell .inactive-cust-kpis,#petatoe-universal-print-shell .sales-target-kpi-grid{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;}\n'+
    '#petatoe-universal-print-shell .table-wrap,#petatoe-universal-print-shell .smart-table-clean,#petatoe-universal-print-shell .sales-intel-table,#petatoe-universal-print-shell .bi-table,#petatoe-universal-print-shell .exec-table,#petatoe-universal-print-shell .gov-table,#petatoe-universal-print-shell .report-scroll{overflow:visible!important;max-height:none!important;border-radius:12px!important;}\n'+
    '#petatoe-universal-print-shell table{width:100%!important;min-width:0!important;table-layout:auto!important;border-collapse:collapse!important;font-size:9.2px!important;background:'+cardBg+'!important;}\n'+
    '#petatoe-universal-print-shell th,#petatoe-universal-print-shell td{white-space:normal!important;word-break:break-word!important;padding:5px 6px!important;color:'+textColor+'!important;border:1px solid '+borderColor+'!important;background:'+cardBg+'!important;position:static!important;}\n'+
    '#petatoe-universal-print-shell th{background:'+tableHead+'!important;color:#fff!important;font-weight:950!important;}\n'+
    '#petatoe-universal-print-shell tr:nth-child(even) td{background:'+cardBg2+'!important;}\n'+
    '#petatoe-universal-print-shell input,#petatoe-universal-print-shell select,#petatoe-universal-print-shell textarea{background:'+cardBg2+'!important;color:'+textColor+'!important;border:1px solid '+borderColor+'!important;}\n'+
    '#petatoe-universal-print-shell .filters,#petatoe-universal-print-shell .smart-controls,#petatoe-universal-print-shell .exec-toolbar,#petatoe-universal-print-shell .fleet-toolbar,#petatoe-universal-print-shell .report-tabs,#petatoe-universal-print-shell .year-strip,#petatoe-universal-print-shell .new-cust-controls,#petatoe-universal-print-shell .advanced-tax-actions,#petatoe-universal-print-shell .sales-target-control-box{break-inside:avoid;page-break-inside:avoid;}\n'+
    '#petatoe-universal-print-shell .pet-print-footer{margin-top:14px;border-top:1px solid '+borderColor+';padding-top:8px;text-align:center;font-size:9px;font-weight:900;color:'+mutedColor+'!important;}\n'+
    '@media print{#petatoe-universal-print-shell{width:100%;}.card,.smart-panel,.exec-card,.bi-panel,.sales-intel-panel{break-inside:avoid;page-break-inside:avoid;}}\n'+
    '/* PETATOE UNIVERSAL EXPORT BLANK PAGE FIX: overrides older print zones (#printZone / #petatoe-print-frame) */\n'+
    '@media print{html body > #petatoe-universal-print-shell{display:block!important;visibility:visible!important;position:static!important;width:100%!important;height:auto!important;overflow:visible!important;}html body > #petatoe-universal-print-shell *{visibility:visible!important;}html body > *:not(#petatoe-universal-print-shell){display:none!important;visibility:hidden!important;}#petatoe-universal-print-shell .panel{display:block!important;}#petatoe-universal-print-shell .panel:not(.active){display:none!important;}#petatoe-universal-print-shell #printZone,#petatoe-universal-print-shell #petatoe-print-frame{display:none!important;}}\n'+
    '/* PETATOE A4 FIT PATCH: keeps full-page export inside A4 without cutting tables/charts */\n'+
    '@media print{@page{size:A4 landscape;margin:7mm!important;}html,body{width:297mm!important;min-height:210mm!important;background:'+pageBg+'!important;}body{margin:0!important;padding:0!important;}#petatoe-universal-print-shell{width:283mm!important;max-width:283mm!important;margin:0 auto!important;padding:0!important;background:'+pageBg+'!important;color:'+textColor+'!important;}#petatoe-universal-print-shell .pet-print-header{min-height:16mm!important;margin-bottom:5mm!important;padding-bottom:3mm!important;break-inside:avoid!important;page-break-inside:avoid!important;}#petatoe-universal-print-shell .pet-print-title b{font-size:15px!important;}#petatoe-universal-print-shell .pet-print-title small,#petatoe-universal-print-shell .pet-print-meta{font-size:8.5px!important;}#petatoe-universal-print-shell .pet-print-logo{width:32px!important;height:32px!important;font-size:18px!important;}#petatoe-universal-print-shell .section-head,#petatoe-universal-print-shell .smart-hero,#petatoe-universal-print-shell .exec-hero,#petatoe-universal-print-shell .bi-hero,#petatoe-universal-print-shell .ai-forecast-hero,#petatoe-universal-print-shell .fleet-hero{padding:8px 10px!important;margin:0 0 4mm!important;border-radius:10px!important;}#petatoe-universal-print-shell .section-head h2,#petatoe-universal-print-shell h2{font-size:17px!important;}#petatoe-universal-print-shell h3{font-size:14px!important;}#petatoe-universal-print-shell .card,#petatoe-universal-print-shell .kpi,#petatoe-universal-print-shell .smart-card,#petatoe-universal-print-shell .smart-panel,#petatoe-universal-print-shell .exec-card,#petatoe-universal-print-shell .bi-panel,#petatoe-universal-print-shell .sales-intel-panel,#petatoe-universal-print-shell .gov-panel{padding:9px!important;margin-bottom:4mm!important;border-radius:9px!important;}#petatoe-universal-print-shell .grid,#petatoe-universal-print-shell .grid-2,#petatoe-universal-print-shell .grid-3,#petatoe-universal-print-shell .smart-grid,#petatoe-universal-print-shell .smart-grid-3,#petatoe-universal-print-shell .smart-dash-grid,#petatoe-universal-print-shell .smart-dash-grid.two,#petatoe-universal-print-shell .sales-intel-grid,#petatoe-universal-print-shell .sales-intel-grid.two,#petatoe-universal-print-shell .sales-intel-grid.four,#petatoe-universal-print-shell .bi-grid,#petatoe-universal-print-shell .exec-grid,#petatoe-universal-print-shell .exec-grid.three,#petatoe-universal-print-shell .new-cust-grid,#petatoe-universal-print-shell .inactive-cust-section{gap:4mm!important;}#petatoe-universal-print-shell .kpis,#petatoe-universal-print-shell .smart-kpis,#petatoe-universal-print-shell .smart-exec-grid,#petatoe-universal-print-shell .exec-kpi-grid,#petatoe-universal-print-shell .bi-kpi-grid,#petatoe-universal-print-shell .report-kpis,#petatoe-universal-print-shell .new-cust-kpis,#petatoe-universal-print-shell .inactive-cust-kpis,#petatoe-universal-print-shell .sales-target-kpi-grid{grid-template-columns:repeat(4,1fr)!important;gap:2.5mm!important;margin-bottom:4mm!important;}#petatoe-universal-print-shell .kpi,#petatoe-universal-print-shell .smart-kpi,#petatoe-universal-print-shell .exec-kpi,#petatoe-universal-print-shell .bi-kpi,#petatoe-universal-print-shell .new-cust-kpi,#petatoe-universal-print-shell .inactive-cust-kpi{min-height:auto!important;padding:7px!important;}#petatoe-universal-print-shell .kpi b,#petatoe-universal-print-shell .smart-kpi b,#petatoe-universal-print-shell .exec-kpi b,#petatoe-universal-print-shell .bi-kpi b,#petatoe-universal-print-shell .metric b{font-size:13px!important;margin-top:3px!important;}#petatoe-universal-print-shell .kpi span,#petatoe-universal-print-shell .smart-kpi span,#petatoe-universal-print-shell .exec-kpi span,#petatoe-universal-print-shell .bi-kpi span,#petatoe-universal-print-shell .metric span{font-size:8.5px!important;}#petatoe-universal-print-shell .table-wrap,#petatoe-universal-print-shell .smart-table-clean,#petatoe-universal-print-shell .sales-intel-table,#petatoe-universal-print-shell .bi-table,#petatoe-universal-print-shell .exec-table,#petatoe-universal-print-shell .gov-table,#petatoe-universal-print-shell .report-scroll{width:100%!important;max-width:100%!important;overflow:visible!important;break-inside:auto!important;page-break-inside:auto!important;}#petatoe-universal-print-shell table{width:100%!important;max-width:100%!important;min-width:0!important;table-layout:fixed!important;font-size:7.2px!important;line-height:1.25!important;}#petatoe-universal-print-shell th,#petatoe-universal-print-shell td{padding:3px 3px!important;line-height:1.25!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;}#petatoe-universal-print-shell thead{display:table-header-group!important;}#petatoe-universal-print-shell tfoot{display:table-footer-group!important;}#petatoe-universal-print-shell tr{break-inside:avoid!important;page-break-inside:avoid!important;}#petatoe-universal-print-shell .chart,#petatoe-universal-print-shell .smart-chart,#petatoe-universal-print-shell .exec-chart,#petatoe-universal-print-shell .bi-chart,#petatoe-universal-print-shell .sales-intel-chart,#petatoe-universal-print-shell .new-cust-chart,#petatoe-universal-print-shell .inactive-cust-chart{height:auto!important;max-height:95mm!important;min-height:0!important;margin:0 auto!important;break-inside:avoid!important;page-break-inside:avoid!important;}#petatoe-universal-print-shell .pet-print-canvas-img{max-height:90mm!important;width:auto!important;max-width:100%!important;object-fit:contain!important;}#petatoe-universal-print-shell img{max-width:100%!important;}#petatoe-universal-print-shell .filters,#petatoe-universal-print-shell .smart-controls,#petatoe-universal-print-shell .exec-toolbar,#petatoe-universal-print-shell .fleet-toolbar,#petatoe-universal-print-shell .report-tabs,#petatoe-universal-print-shell .year-strip,#petatoe-universal-print-shell .new-cust-controls,#petatoe-universal-print-shell .advanced-tax-actions,#petatoe-universal-print-shell .sales-target-control-box{padding:5px!important;margin-bottom:3mm!important;gap:2mm!important;font-size:8px!important;border-radius:8px!important;}#petatoe-universal-print-shell input,#petatoe-universal-print-shell select,#petatoe-universal-print-shell textarea{height:auto!important;min-height:20px!important;padding:3px 5px!important;font-size:8px!important;}#petatoe-universal-print-shell button,#petatoe-universal-print-shell .btn,#petatoe-universal-print-shell .exp-btn,#petatoe-universal-print-shell .pet-mini-btn,#petatoe-universal-print-shell .cust360-back-btn{display:none!important;}#petatoe-universal-print-shell .pet-print-footer{font-size:7.5px!important;margin-top:4mm!important;padding-top:2mm!important;}#petatoe-universal-print-shell .badge,#petatoe-universal-print-shell .smart-tag,#petatoe-universal-print-shell .bi-health-pill{font-size:7px!important;padding:1px 4px!important;}#petatoe-universal-print-shell .report-scroll::after{display:none!important;}}\n'+
    '\n/* PETATOE v3.8.86 - Full Page PDF scrollbar/silver-line fix for new internal reports */\n#petatoe-universal-print-shell .tr-table,\n#petatoe-universal-print-shell .tr-statement-table,\n#petatoe-universal-print-shell .wh-table,\n#petatoe-universal-print-shell .warehouse-table,\n#petatoe-universal-print-shell .treasury-movements-card .tr-table{\n  overflow:visible!important;\n  max-height:none!important;\n  max-width:100%!important;\n  width:100%!important;\n  scrollbar-width:none!important;\n  -ms-overflow-style:none!important;\n}\n#petatoe-universal-print-shell .tr-table::-webkit-scrollbar,\n#petatoe-universal-print-shell .tr-statement-table::-webkit-scrollbar,\n#petatoe-universal-print-shell .wh-table::-webkit-scrollbar,\n#petatoe-universal-print-shell .warehouse-table::-webkit-scrollbar,\n#petatoe-universal-print-shell *::-webkit-scrollbar{\n  display:none!important;\n  width:0!important;\n  height:0!important;\n  background:transparent!important;\n}\n#petatoe-universal-print-shell .tr-table table,\n#petatoe-universal-print-shell .tr-statement-table table,\n#petatoe-universal-print-shell .wh-table table,\n#petatoe-universal-print-shell .warehouse-table table{\n  min-width:0!important;\n  width:100%!important;\n  table-layout:fixed!important;\n}\n#petatoe-universal-print-shell .treasury-section-v82:not(.active),\n#petatoe-universal-print-shell .warehouse-section-v82:not(.active),\n#petatoe-universal-print-shell .wh-section:not(.active){\n  display:none!important;\n}\n#petatoe-universal-print-shell .treasury-tabs-v82,\n#petatoe-universal-print-shell .wh-tabs,\n#petatoe-universal-print-shell .warehouse-tabs,\n#petatoe-universal-print-shell .report-tabs:empty{\n  display:none!important;\n  height:0!important;\n  min-height:0!important;\n  margin:0!important;\n  padding:0!important;\n  border:0!important;\n  box-shadow:none!important;\n  background:transparent!important;\n  overflow:hidden!important;\n}\n    \n/* PETATOE v3.8.87 - ROOT FIX FOR SILVER LINE IN FULL PAGE PDF\n   Remove printed scrollbar tracks/borders from cloned scroll wrappers only. */\n#petatoe-universal-print-shell .tr-table,\n#petatoe-universal-print-shell .tr-statement-table,\n#petatoe-universal-print-shell .wh-table,\n#petatoe-universal-print-shell .warehouse-table,\n#petatoe-universal-print-shell .treasury-movements-card .tr-table{\n  overflow:visible!important;\n  max-height:none!important;\n  max-width:100%!important;\n  width:100%!important;\n  border:0!important;\n  border-radius:0!important;\n  background:transparent!important;\n  box-shadow:none!important;\n  outline:0!important;\n  padding:0!important;\n  scrollbar-width:none!important;\n  -ms-overflow-style:none!important;\n}\n#petatoe-universal-print-shell .tr-table::-webkit-scrollbar,\n#petatoe-universal-print-shell .tr-statement-table::-webkit-scrollbar,\n#petatoe-universal-print-shell .wh-table::-webkit-scrollbar,\n#petatoe-universal-print-shell .warehouse-table::-webkit-scrollbar,\n#petatoe-universal-print-shell .tr-table *::-webkit-scrollbar,\n#petatoe-universal-print-shell .tr-statement-table *::-webkit-scrollbar,\n#petatoe-universal-print-shell .wh-table *::-webkit-scrollbar,\n#petatoe-universal-print-shell .warehouse-table *::-webkit-scrollbar{\n  display:none!important;\n  width:0!important;\n  height:0!important;\n  background:transparent!important;\n}\n#petatoe-universal-print-shell .tr-table:before,\n#petatoe-universal-print-shell .tr-table:after,\n#petatoe-universal-print-shell .tr-statement-table:before,\n#petatoe-universal-print-shell .tr-statement-table:after,\n#petatoe-universal-print-shell .wh-table:before,\n#petatoe-universal-print-shell .wh-table:after,\n#petatoe-universal-print-shell .warehouse-table:before,\n#petatoe-universal-print-shell .warehouse-table:after{\n  display:none!important;\n  content:none!important;\n}\n#petatoe-universal-print-shell .tr-table table,\n#petatoe-universal-print-shell .tr-statement-table table,\n#petatoe-universal-print-shell .wh-table table,\n#petatoe-universal-print-shell .warehouse-table table{\n  min-width:0!important;\n  width:100%!important;\n  max-width:100%!important;\n  table-layout:fixed!important;\n  border-collapse:collapse!important;\n}\n#petatoe-universal-print-shell .tr-card,\n#petatoe-universal-print-shell .wh-card{\n  overflow:visible!important;\n}\n@media print{\n  #petatoe-universal-print-shell .tr-table,\n  #petatoe-universal-print-shell .tr-statement-table,\n  #petatoe-universal-print-shell .wh-table,\n  #petatoe-universal-print-shell .warehouse-table{\n    border:0!important;box-shadow:none!important;background:transparent!important;outline:0!important;\n  }\n}\n' +
    ''; 

  out += '<style id="petatoe-v800rc2-smart-pdf-layout">\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document{width:100%!important;max-width:100%!important;overflow:visible!important;background:transparent!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document #smartReportsScreen{overflow:visible!important;background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .smart-hero{display:flex!important;align-items:flex-start!important;justify-content:space-between!important;gap:10px!important;margin:0 0 6mm!important;padding:10px 12px!important;border-radius:12px!important;break-inside:avoid!important;page-break-inside:avoid!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .smart-hero h2{font-size:18px!important;margin:0 0 3px!important;line-height:1.2!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .smart-hero p{font-size:9px!important;line-height:1.5!important;margin:0!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document #smartTabs,#petatoe-universal-print-shell .pet-smart-print-document .smart-actions-row,#petatoe-universal-print-shell .pet-smart-print-document .smart-hero-actions,#petatoe-universal-print-shell .pet-smart-print-document .report-tabs,#petatoe-universal-print-shell .pet-smart-print-document .smart-controls,#petatoe-universal-print-shell .pet-smart-print-document .new-cust-controls,#petatoe-universal-print-shell .pet-smart-print-document .new-cust-year-controls,#petatoe-universal-print-shell .pet-smart-print-document .customer-yoy-controls,#petatoe-universal-print-shell .pet-smart-print-document .contract-actions,#petatoe-universal-print-shell .pet-smart-print-document button{display:none!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .smart-tab-section{display:block!important;visibility:visible!important;opacity:1!important;overflow:visible!important;max-height:none!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-section-stamp{display:block!important;margin:0 0 4mm!important;padding:5px 8px!important;border-radius:999px!important;border:1px solid '+borderColor+'!important;background:'+cardBg2+'!important;color:'+textColor+'!important;font-size:9px!important;font-weight:900!important;break-inside:avoid!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .smart-panel,#petatoe-universal-print-shell .pet-smart-print-document .smart-card,#petatoe-universal-print-shell .pet-smart-print-document .new-cust-kpi,#petatoe-universal-print-shell .pet-smart-print-document .inactive-cust-kpi{break-inside:avoid!important;page-break-inside:avoid!important;margin-bottom:4mm!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .new-cust-kpis,#petatoe-universal-print-shell .pet-smart-print-document .inactive-cust-kpis{grid-template-columns:repeat(4,1fr)!important;gap:3mm!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .new-cust-grid,#petatoe-universal-print-shell .pet-smart-print-document .inactive-cust-section,#petatoe-universal-print-shell .pet-smart-print-document .smart-grid,#petatoe-universal-print-shell .pet-smart-print-document .smart-grid-3{display:grid!important;grid-template-columns:1fr 1fr!important;gap:4mm!important;align-items:start!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .new-cust-grid.single,#petatoe-universal-print-shell .pet-smart-print-document .smart-grid.single{grid-template-columns:1fr!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .new-cust-chart,#petatoe-universal-print-shell .pet-smart-print-document .inactive-cust-chart,#petatoe-universal-print-shell .pet-smart-print-document .smart-chart{height:auto!important;min-height:0!important;max-height:78mm!important;overflow:visible!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .pet-print-canvas-img{max-height:72mm!important;width:auto!important;max-width:100%!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document .smart-table-clean{overflow:visible!important;max-height:none!important;width:100%!important;border:0!important;background:transparent!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document table{width:100%!important;min-width:0!important;max-width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;font-size:7px!important;}\n'+
    '#petatoe-universal-print-shell .pet-smart-print-document th,#petatoe-universal-print-shell .pet-smart-print-document td{padding:3px!important;white-space:normal!important;overflow-wrap:anywhere!important;word-break:break-word!important;}\n'+
    '@media print{#petatoe-universal-print-shell .pet-smart-print-document .smart-panel,#petatoe-universal-print-shell .pet-smart-print-document .new-cust-grid>*,#petatoe-universal-print-shell .pet-smart-print-document .smart-grid>*{break-inside:avoid!important;page-break-inside:avoid!important;}#petatoe-universal-print-shell .pet-smart-print-document .smart-table-clean{break-inside:auto!important;page-break-inside:auto!important;}}\n'+
    '</style>';

  out += '<style id="petatoe-commission-statement-pdf-fix">\n'+
    '#petatoe-universal-print-shell .com-statement-card,#petatoe-universal-print-shell .com-card{overflow:visible!important;max-height:none!important;width:100%!important;break-inside:auto!important;page-break-inside:auto!important;}\n'+
    '#petatoe-universal-print-shell .com-statement-print-head{display:flex!important;justify-content:space-between!important;gap:8px!important;border-bottom:1px solid '+borderColor+'!important;padding-bottom:8px!important;margin-bottom:10px!important;}\n'+
    '#petatoe-universal-print-shell .com-statement-print-meta{display:flex!important;gap:6px!important;flex-wrap:wrap!important;}\n'+
    '#petatoe-universal-print-shell .com-statement-print-meta span{display:inline-flex!important;border:1px solid '+borderColor+'!important;border-radius:999px!important;padding:4px 8px!important;background:'+cardBg2+'!important;font-size:8px!important;font-weight:900!important;}\n'+
    '#petatoe-universal-print-shell .com-table{overflow:visible!important;max-height:none!important;width:100%!important;page-break-inside:auto!important;}\n'+
    '#petatoe-universal-print-shell .com-table table{width:100%!important;max-width:100%!important;min-width:0!important;table-layout:auto!important;border-collapse:collapse!important;}\n'+
    '#petatoe-universal-print-shell .com-kpis{display:grid!important;grid-template-columns:repeat(3,1fr)!important;gap:8px!important;}\n'+
    '#petatoe-universal-print-shell .com-statement-toolbar,#petatoe-universal-print-shell .com-actions,.pet-page-pdf-btn{display:none!important;}\n'+
    '</style>';
  out += '<style id="petatoe-phase4-2-universal-export-overrides">\n'+
    '/* PETATOE v5.1.64 Phase 4.2 - final PDF theme overrides */\n'+
    '#petatoe-universal-print-shell.pet-export-theme-dark{background:#070b14!important;color:#f8fafc!important;}\n'+
    '#petatoe-universal-print-shell.pet-export-theme-dark .card,#petatoe-universal-print-shell.pet-export-theme-dark .smart-panel,#petatoe-universal-print-shell.pet-export-theme-dark .smart-card,#petatoe-universal-print-shell.pet-export-theme-dark .exec-card,#petatoe-universal-print-shell.pet-export-theme-dark .bi-panel,#petatoe-universal-print-shell.pet-export-theme-dark .sales-intel-panel,#petatoe-universal-print-shell.pet-export-theme-dark .gov-panel,#petatoe-universal-print-shell.pet-export-theme-dark .kpi,#petatoe-universal-print-shell.pet-export-theme-dark .smart-kpi{background:#0f172a!important;color:#f8fafc!important;border-color:rgba(148,163,184,.24)!important;}\n'+
    '#petatoe-universal-print-shell.pet-export-theme-dark table{background:#0f172a!important;color:#f8fafc!important;}\n'+
    '#petatoe-universal-print-shell.pet-export-theme-dark th{background:#5b21b6!important;color:#fff!important;}\n'+
    '#petatoe-universal-print-shell.pet-export-theme-dark td{border-color:rgba(148,163,184,.24)!important;color:#f8fafc!important;}\n'+
    '#petatoe-universal-print-shell.pet-export-theme-light{background:#ffffff!important;color:#0f172a!important;}\n'+
    '#petatoe-universal-print-shell.pet-export-theme-light .card,#petatoe-universal-print-shell.pet-export-theme-light .smart-panel,#petatoe-universal-print-shell.pet-export-theme-light .smart-card,#petatoe-universal-print-shell.pet-export-theme-light .exec-card,#petatoe-universal-print-shell.pet-export-theme-light .bi-panel,#petatoe-universal-print-shell.pet-export-theme-light .sales-intel-panel,#petatoe-universal-print-shell.pet-export-theme-light .gov-panel,#petatoe-universal-print-shell.pet-export-theme-light .kpi,#petatoe-universal-print-shell.pet-export-theme-light .smart-kpi{background:#ffffff!important;color:#0f172a!important;border-color:#dbe2ef!important;}\n'+
    '</style>';
  return out;
}


function petatoeOpenPrintHtmlBlob(html, features){
  try{
    var blob=new Blob([String(html||'')],{type:'text/html;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var win=window.open(url,'_blank',features||'width=1200,height=800');
    if(win){setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_e){}},60000);}
    return win;
  }catch(e){console.error('PETATOE print blob open error:',e);return null;}
}

window.petatoeExportActivePagePdf = function(){
  var panel=getActivePanel();
  if(!panel){alert('لا توجد صفحة نشطة للتصدير');return;}
  var title=getPanelTitle(panel);
  if(!cleanText(panel.textContent)){alert('الصفحة الحالية لا تحتوي على بيانات للتصدير');return;}
  notify('⏳ جاري تجهيز PDF للصفحة الحالية...');
  setTimeout(function(){
    try{
      var clone=prepareClone(panel);
      var theme=document.documentElement.getAttribute('data-theme') || 'dark';
      clone.setAttribute('data-export-theme', theme);
      var html='<!DOCTYPE html><html lang="ar" dir="rtl" data-theme="'+block_5843_esc(theme)+'"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+block_5843_esc(title)+' - PETATOE PDF</title>'+collectStyles(theme)+'</head><body class="pet-export-theme-'+block_5843_esc(theme)+'"><div id="petatoe-universal-print-shell" class="pet-print-shell pet-export-theme-'+block_5843_esc(theme)+'"><div class="pet-print-header"><div class="pet-print-brand"><div class="pet-print-logo">🐾</div><div>PETATOE<br><small>Analytics System</small></div></div><div class="pet-print-title"><b>'+block_5843_esc(title)+'</b><small>تصدير PDF منسق بنفس بيانات العرض الحالية</small></div><div class="pet-print-meta">التاريخ: '+block_5843_esc(new Date().toLocaleString('ar-SA'))+'<br>Save as PDF</div></div>'+clone.outerHTML+'<div class="pet-print-footer">PETATOE Analytics System — Full Page PDF Export — '+block_5843_esc(todayStamp())+'</div></div><scr'+'ipt>window.onload=function(){setTimeout(function(){window.focus();window.print();},350)}<\/scr'+'ipt></body></html>';
      var win=petatoeOpenPrintHtmlBlob(html,'width=1200,height=800');
      if(!win){alert('المتصفح منع فتح نافذة الطباعة. فعّل Popups للموقع ثم جرّب مرة أخرى.');return;}
      notify('✅ تم تجهيز نافذة PDF — اختر Save as PDF');
    }catch(e){
      console.error('Full Page PDF export error:',e);
      alert('حدث خطأ أثناء تجهيز PDF: '+(e&&e.message?e.message:e));
    }
  },160);
};

function makeBar(scopeLabel){
  var bar=document.createElement('div');
  bar.className='pet-page-pdf-bar';
  bar.setAttribute('data-pet-universal-pdf','1');
  bar.innerHTML='<div class="pet-page-pdf-title"><b>📄 تصدير PDF للصفحة بالكامل</b><small>يحافظ على الفلاتر الحالية ويظهرها داخل PDF، مع وضع الدارك/اللايت والشارتات والجداول المعروضة.</small></div><button type="button" class="pet-page-pdf-btn" onclick="petatoeExportActivePagePdf()">🖨️ تصدير الصفحة PDF</button>';
  return bar;
}
function shouldSkipPanel(panel){
  if(!panel||!panel.id) return true;
  return ['dashboard','entry','import','settings','smart'].indexOf(panel.id)>-1;
}
window.petatoeEnsureFullPagePdfButtons = function(){
  qa('.panel').forEach(function(panel){
    if(shouldSkipPanel(panel)) return;
    if(panel.querySelector(':scope > .pet-page-pdf-bar')) return;
    var first=panel.firstElementChild;
    panel.insertBefore(makeBar(panel.id), first||null);
  });
};

document.addEventListener('petatoe:tabchange',function(){setTimeout(window.petatoeEnsureFullPagePdfButtons,120)});
var mo=null, pdfEnsureRuns=0;
function fullPagePdfButtonsInit(){
  try{window.petatoeEnsureFullPagePdfButtons()}catch(e){console.error(e)}
  try{
    if(!window.MutationObserver || mo) return;
    mo=new MutationObserver(function(){
      clearTimeout(window.__petPdfEnsureTimer);
      window.__petPdfEnsureTimer=setTimeout(function(){
        pdfEnsureRuns++;
        try{window.petatoeEnsureFullPagePdfButtons()}catch(e){console.error(e)}
        if(pdfEnsureRuns>=6 && mo){try{mo.disconnect()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);} mo=null;}
      },180);
    });
    mo.observe(document.body,{childList:true,subtree:true});
    setTimeout(function(){if(mo){try{mo.disconnect()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);} mo=null;}},4000);
  }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("index.html",e);}
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',fullPagePdfButtonsInit); else fullPagePdfButtonsInit();
})();
