/* TOPBAR PAW SCROLL CONTROLLER - CLICK TO TOP + DOUBLE CLICK TO BOTTOM + DRAG SCROLL */
if(typeof window.__pawDragDidMove!=='boolean')window.__pawDragDidMove=false;

function pawMaxScroll(){
  return Math.max(
    document.documentElement.scrollHeight || 0,
    document.body.scrollHeight || 0,
    document.documentElement.offsetHeight || 0,
    document.body.offsetHeight || 0
  ) - window.innerHeight;
}

function scrollDashboardToTop(ev){
  if(ev && window.__pawDragDidMove){
    ev.preventDefault();
    ev.stopPropagation();
    if(typeof window.__pawDragDidMove!=='boolean')window.__pawDragDidMove=false;
    return;
  }
  try{
    window.scrollTo({top:0,behavior:'smooth'});
    document.documentElement.scrollTo && document.documentElement.scrollTo({top:0,behavior:'smooth'});
    document.body.scrollTo && document.body.scrollTo({top:0,behavior:'smooth'});
    const activePanel=document.querySelector('.panel.active');
    if(activePanel && typeof activePanel.scrollIntoView==='function'){
      (window.requestAnimationFrame||function(cb){return setTimeout(cb,16)})(function(){activePanel.scrollIntoView({block:'start',behavior:'smooth'});});
    }
  }catch(e){
    window.scrollTo(0,0);
  }
}

function scrollDashboardToBottom(ev){
  if(ev){
    ev.preventDefault();
    ev.stopPropagation();
  }
  try{
    var bottom=Math.max(0,pawMaxScroll());
    window.scrollTo({top:bottom,behavior:'smooth'});
    document.documentElement.scrollTo && document.documentElement.scrollTo({top:bottom,behavior:'smooth'});
    document.body.scrollTo && document.body.scrollTo({top:bottom,behavior:'smooth'});
  }catch(e){
    window.scrollTo(0,document.body.scrollHeight || document.documentElement.scrollHeight || 999999);
  }
}

(function(){
  if(window.__PETATOE_PAW_DRAG_BOOT_BOUND__)return;
  window.__PETATOE_PAW_DRAG_BOOT_BOUND__=true;
  function setupPawDragScroll(){
    var btn=document.getElementById('topPawBackToTopBtn');
    if(!btn || btn.dataset.dragScrollReady==='1') return;
    btn.dataset.dragScrollReady='1';

    var isDown=false;
    var startY=0;
    var lastY=0;
    var speed=0;
    var raf=0;
    var moved=false;
    var clickTimer=0;

    /* v3.11.10: using global clamp */
    function tick(){
      if(!isDown) return;
      if(Math.abs(speed)>0.2){
        var next=clamp(window.scrollY + speed,0,Math.max(0,pawMaxScroll()));
        window.scrollTo(0,next);
      }
      raf=requestAnimationFrame(tick);
    }
    function clearClickTimer(){
      if(clickTimer){
        clearTimeout(clickTimer);
        clickTimer=0;
      }
    }
    function endDrag(){
      if(!isDown) return;
      isDown=false;
      speed=0;
      btn.classList.remove('drag-scrolling');
      try{btn.releasePointerCapture && btn.releasePointerCapture(btn._activePointerId);}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/exec-alerts-block.js",e);}
      if(raf){cancelAnimationFrame(raf);raf=0;}
      // يمنع تنفيذ click بعد السحب، ثم يرجع يسمح بالضغط العادي
      if(moved){
        window.__pawDragDidMove=true;
        setTimeout(function(){if(typeof window.__pawDragDidMove!=='boolean')window.__pawDragDidMove=false;},180);
      }
    }

    btn.addEventListener('pointerdown',function(e){
      if(e.button !== undefined && e.button !== 0) return;
      isDown=true;
      moved=false;
      startY=lastY=e.clientY;
      speed=0;
      btn._activePointerId=e.pointerId;
      btn.classList.add('drag-scrolling');
      try{btn.setPointerCapture && btn.setPointerCapture(e.pointerId);}catch(err){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/exec-alerts-block.js",err);}
      if(raf) cancelAnimationFrame(raf);
      raf=requestAnimationFrame(tick);
      e.preventDefault();
    });

    btn.addEventListener('pointermove',function(e){
      if(!isDown) return;
      var dy=e.clientY - startY;
      if(Math.abs(dy)>4) moved=true;
      lastY=e.clientY;
      // اسحب لتحت = نزول، اسحب لفوق = طلوع
      speed=clamp(dy*0.42,-34,34);
      e.preventDefault();
    });

    btn.addEventListener('pointerup',endDrag);
    btn.addEventListener('pointercancel',endDrag);
    btn.addEventListener('lostpointercapture',endDrag);
    window.addEventListener('blur',endDrag);

    // Click واحد = أعلى الصفحة، مع تأخير بسيط حتى لا يتعارض مع Double Click
    btn.addEventListener('click',function(e){
      e.preventDefault();
      e.stopPropagation();
      if(window.__pawDragDidMove){
        if(typeof window.__pawDragDidMove!=='boolean')window.__pawDragDidMove=false;
        clearClickTimer();
        return;
      }
      clearClickTimer();
      clickTimer=setTimeout(function(){
        clickTimer=0;
        scrollDashboardToTop(e);
      },240);
    });

    // Double Click = آخر الصفحة
    btn.addEventListener('dblclick',function(e){
      clearClickTimer();
      if(typeof window.__pawDragDidMove!=='boolean')window.__pawDragDidMove=false;
      scrollDashboardToBottom(e);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',setupPawDragScroll);
  else setupPawDragScroll();
})();




/* ===== PETATOE v2.4 - Executive Dashboard + Alerts Engine Safe Module ===== */
(function(){
  if(window.__PETATOE_EXEC_ALERTS_DELEGATES_BOUND__)return;
  window.__PETATOE_EXEC_ALERTS_DELEGATES_BOUND__=true;
  function execEsc(v){return String(v??'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}

  function execSafeHtml(target, html, reason){
    const el=(typeof target==='string')?document.getElementById(target):target;
    if(!el)return false;
    try{if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.htmlTrusted==='function')return window.PETATOESafeRender.htmlTrusted(el,String(html==null?'':html),reason||'exec alerts trusted escaped template');}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('exec alerts safe render fallback',e);}
    el.textContent='';el.insertAdjacentHTML('beforeend',String(html==null?'':html));return true;
  }
  function clientName(r){return String((r&&r.client)||'غير محدد').trim()||'غير محدد'}
  function serviceName(r){return String((r&&r.item)||'غير محدد').trim()||'غير محدد'}
  function rowDateVal(r){try{return dateObj(r)||new Date(parseDate(r.date))}catch(e){return null}}
  function sortRows(rows){return (rows||[]).slice().sort(function(a,b){let da=rowDateVal(a),db=rowDateVal(b);return (db?db.getTime():0)-(da?da.getTime():0)})}
  function sum(rows,f){return (rows||[]).reduce(function(s,r){return s+parseNum(r[f])},0)}
  function uniqueInv(rows){return new Set((rows||[]).map(function(r){return r.invoice||''}).filter(Boolean)).size}
  function groupRows(rows,keyFn){return (rows||[]).reduce(function(o,r){let k=keyFn(r);(o[k]=o[k]||[]).push(r);return o},{})}
  function groupTotal(rows,keyFn){let o={};(rows||[]).forEach(function(r){let k=keyFn(r);o[k]=(o[k]||0)+parseNum(r.totalInc)});return o}
  function ym(r){let y=getYear(r)||'';let m=normalizeMonth(r.month,r.date)||'';return y+'-'+String(m).padStart(2,'0')}
  function monthArabic(m){var raw=MAR[String(m)]||MAR[Number(m)]||String(m||'');return (window.PETATOE_GLOBAL_SCREEN_TRANSLATOR&&window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName)?window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName(raw):raw}
  function execFiltered(){let y=document.getElementById('execYear')?.value||'all',m=document.getElementById('execMonth')?.value||'',v=document.getElementById('execVan')?.value||'';return (records||[]).filter(function(r){let ok=true;if(y!=='all')ok=ok&&String(getYear(r))===String(y);if(m)ok=ok&&String(normalizeMonth(r.month,r.date))===String(m);if(v)ok=ok&&String(r.van||'')===String(v);return ok})}
  function ensureExecFilters(){let ySel=document.getElementById('execYear'),mSel=document.getElementById('execMonth'),vSel=document.getElementById('execVan');if(!ySel||!mSel||!vSel)return;let years=[...new Set((records||[]).map(getYear).filter(Boolean))].sort();let oldY=ySel.value||'all';execSafeHtml(ySel,'<option value="all">كل السنوات</option>'+years.map(y=>`<option value="${execEsc(y)}">${execEsc(y)}</option>`).join(''),'executive year options');ySel.value=[...years.map(String),'all'].includes(String(oldY))?oldY:'all';let oldM=mSel.value||'';execSafeHtml(mSel,'<option value="">كل الشهور</option>'+Array.from({length:12},(_,i)=>`<option value="${i+1}">${monthArabic(i+1)}</option>`).join(''),'executive month options');mSel.value=oldM;let vans=[...new Set((records||[]).map(r=>r.van).filter(Boolean))].sort();let oldV=vSel.value||'';execSafeHtml(vSel,'<option value="">كل السيارات</option>'+vans.map(v=>`<option value="${execEsc(v)}">${execEsc(v)}</option>`).join(''),'executive van options');vSel.value=vans.includes(oldV)?oldV:''}
  function topList(rows,keyFn,n){return Object.entries(groupTotal(rows,keyFn)).sort(function(a,b){return b[1]-a[1]}).slice(0,n||10)}
  function previousPeriodRows(baseRows){let months=[...new Set((records||[]).map(ym).filter(x=>x.length>=6))].sort();let selected=[...new Set((baseRows||[]).map(ym).filter(x=>x.length>=6))].sort();if(!selected.length||months.length<2)return [];let first=selected[0],last=selected[selected.length-1];let idx=months.indexOf(first);if(idx<=0)return [];let prevLast=months[idx-1];return (records||[]).filter(function(r){return ym(r)===prevLast})}
  function buildAlerts(rows){let alerts=[],now=sortRows(records)[0]?rowDateVal(sortRows(records)[0]):new Date();let byClient=groupRows(records,clientName);let inactive=Object.entries(byClient).map(function(x){let sr=sortRows(x[1]),last=sr[0],days=last&&rowDateVal(last)?Math.floor((now-rowDateVal(last))/86400000):0,total=sum(x[1],'totalInc');return {name:x[0],rows:x[1],days,total,last:last?last.date:'-'}}).filter(c=>c.days>=60).sort((a,b)=>b.total-a.total).slice(0,20);if(inactive.length)alerts.push({type:'inactive',level:'high',ico:'🔴',title:'عملاء مهمين متوقفين',sub:`${inactive.length} عميل لم يتعامل منذ 60 يوم أو أكثر`,rows:inactive.flatMap(c=>c.rows),items:inactive});let curBySvc=groupTotal(rows,serviceName),prev=previousPeriodRows(rows),prevBySvc=groupTotal(prev,serviceName);let drops=Object.keys(prevBySvc).map(function(k){let p=prevBySvc[k],c=curBySvc[k]||0,drop=p?((p-c)/p)*100:0;return {name:k,prev:p,cur:c,drop:drop,rows:records.filter(r=>serviceName(r)===k)}}).filter(x=>x.drop>=30&&x.prev>0).sort((a,b)=>b.drop-a.drop).slice(0,15);if(drops.length)alerts.push({type:'serviceDrop',level:'med',ico:'🟠',title:'خدمات انخفضت مبيعاتها',sub:`${drops.length} خدمة أقل من الفترة السابقة بنسبة 30%+`,rows:drops.flatMap(d=>d.rows),items:drops});let byVan=groupRows(records,r=>String(r.van||'غير محدد'));let inactiveVans=Object.entries(byVan).map(function(x){let sr=sortRows(x[1]),last=sr[0],days=last&&rowDateVal(last)?Math.floor((now-rowDateVal(last))/86400000):0;return {name:x[0],days,last:last?last.date:'-',rows:x[1]}}).filter(v=>v.days>=30&&v.name!=='غير محدد').sort((a,b)=>b.days-a.days);if(inactiveVans.length)alerts.push({type:'vanInactive',level:'med',ico:'🚐',title:'سيارات منخفضة النشاط',sub:`${inactiveVans.length} سيارة لم يظهر لها نشاط منذ 30 يوم+`,rows:inactiveVans.flatMap(v=>v.rows),items:inactiveVans});let customers=Object.entries(byClient).map(function(x){let sr=sortRows(x[1]);return {name:x[0],rows:x[1],total:sum(x[1],'totalInc'),first:sr[sr.length-1],last:sr[0],invoices:uniqueInv(x[1])}});let newHot=customers.filter(function(c){let fd=c.first&&rowDateVal(c.first),ld=c.last&&rowDateVal(c.last);let age=fd?Math.floor((now-fd)/86400000):999;return age<=45&&c.total>0}).sort((a,b)=>b.total-a.total).slice(0,10);if(newHot.length)alerts.push({type:'newHot',level:'low',ico:'🟢',title:'عملاء جدد واعدين',sub:`${newHot.length} عميل جديد بقيمة شراء مرتفعة نسبيًا`,rows:newHot.flatMap(c=>c.rows),items:newHot});return alerts}
  function healthScore(rows,alerts){let total=sum(rows,'totalInc'),prev=sum(previousPeriodRows(rows),'totalInc');let growth=prev?((total-prev)/prev)*100:0;let score=72;score+=Math.max(-18,Math.min(18,growth/2));score-=alerts.filter(a=>a.level==='high').length*10;score-=alerts.filter(a=>a.level==='med').length*5;score+=Math.min(8,uniqueInv(rows)/50);return Math.max(0,Math.min(100,Math.round(score)))}
  function tableRows(title,arr,headers,rowFn){return `<div class="exec-card"><h3>${title}</h3><div class="exec-table"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${arr.map(rowFn).join('')}</tbody></table></div></div>`}
  window.renderExecutiveDashboard=function(){ensureExecFilters();let area=document.getElementById('execArea');if(!area)return;let rows=execFiltered();let alerts=buildAlerts(rows);let total=sum(rows,'totalInc'),net=sum(rows,'totalEx'),tax=sum(rows,'tax'),inv=uniqueInv(rows),clients=new Set(rows.map(clientName)).size,avg=inv?total/inv:0,prev=sum(previousPeriodRows(rows),'totalInc'),growth=prev?((total-prev)/prev)*100:0,score=healthScore(rows,alerts);let topCustomers=topList(rows,clientName,10),topServices=topList(rows,serviceName,10),topVans=topList(rows,r=>String(r.van||'غير محدد'),8);let alertsHtml=alerts.map(function(a,idx){return `<div class="alert-row" data-exec-alert-index="${idx}" tabindex="0" role="button"><div class="a-ico">${a.ico}</div><div><b>${execEsc(a.title)}</b><span>${execEsc(a.sub)}</span></div><div class="alert-badge ${a.level==='high'?'high':a.level==='med'?'med':'low'}">${a.level==='high'?'حرج':a.level==='med'?'متوسط':'فرصة'}</div></div>`}).join('')||'<div class="alert-empty">✅ لا توجد تنبيهات حرجة بناءً على البيانات الحالية</div>';(window.PETATOESecurity||{setInnerHTML:function(node,h){node.replaceChildren(document.createRange().createContextualFragment(String(h==null?'':h)));}}).setInnerHTML(area, `<div class="exec-kpi-grid"><div class="exec-kpi" style="--accent:var(--purple)" data-exec-drill="total" tabindex="0" role="button"><span>إجمالي المبيعات</span><b>${money(total)}</b><small>${growth>=0?'▲':'▼'} ${Math.abs(growth).toFixed(1)}% عن الفترة السابقة</small></div><div class="exec-kpi" style="--accent:var(--cyan)" data-exec-drill="invoices" tabindex="0" role="button"><span>عدد الفواتير</span><b>${fmt0(inv)}</b><small>متوسط: ${money(avg)}</small></div><div class="exec-kpi" style="--accent:var(--green)" data-exec-drill="clients" tabindex="0" role="button"><span>العملاء</span><b>${fmt0(clients)}</b><small>عميل نشط داخل النطاق</small></div><div class="exec-kpi" style="--accent:var(--orange)"><span>قبل الضريبة</span><b>${money(net)}</b><small>VAT excluded</small></div><div class="exec-kpi" style="--accent:var(--pink)"><span>الضريبة</span><b>${money(tax)}</b><small>VAT</small></div><div class="exec-kpi" style="--accent:var(--red)" data-exec-drill="alerts" tabindex="0" role="button"><span>التنبيهات</span><b>${fmt0(alerts.length)}</b><small>Alerts Engine</small></div></div><div class="exec-grid three" style="margin-top:18px"><div class="exec-card"><h3>❤️ صحة النشاط</h3><p>مؤشر إداري سريع مبني على النمو والتنبيهات وحجم الفواتير، ولا يغير أي تقرير قديم.</p><div class="exec-health-wrap"><div class="exec-health-ring" style="--p:${score}%"><div><b>${score}%</b><span>Business Health</span></div></div><div class="exec-score-note">${score>=80?'الوضع قوي، ركّز على العملاء الواعدين.':score>=60?'الوضع مقبول، راقب التنبيهات المتوسطة.':'الوضع يحتاج متابعة عاجلة للتنبيهات الحرجة.'}</div></div></div><div class="exec-card" id="execAlertsBlock"><h3>🚨 Alerts Engine</h3><p>تنبيهات قابلة للضغط لفتح تفاصيلها مباشرة.</p><div class="alert-center">${alertsHtml}</div></div><div class="exec-card"><h3>🎯 قرارات سريعة</h3><p>اقتراحات تشغيلية بناءً على قراءة البيانات الحالية.</p><div class="exec-rec-grid" style="grid-template-columns:1fr"><div class="exec-rec ${alerts.some(a=>a.type==='inactive')?'bad':'good'}"><b>استرجاع العملاء</b><span>${alerts.some(a=>a.type==='inactive')?'ابدأ بقائمة العملاء المتوقفين ذات أعلى قيمة شراء.':'لا توجد فجوة كبيرة في العملاء المتوقفين.'}</span></div><div class="exec-rec ${growth<0?'warn':'good'}"><b>اتجاه المبيعات</b><span>${growth<0?'يوجد انخفاض عن الفترة السابقة؛ راجع الخدمات والسيارات الأعلى هبوطًا.':'النمو إيجابي أو مستقر مقارنة بالفترة السابقة.'}</span></div><div class="exec-rec info"><b>أفضل فرصة</b><span>${topCustomers[0]?`أعلى عميل حاليًا: ${execEsc(topCustomers[0][0])} بقيمة ${money(topCustomers[0][1])}`:'لا توجد بيانات كافية.'}</span></div></div></div></div><div class="exec-grid" style="margin-top:18px">${tableRows('🏆 أعلى العملاء',topCustomers,['العميل','المبيعات','إجراء'],function(x){return `<tr><td>${execEsc(x[0])}</td><td>${money(x[1])}</td><td><button class="btn btn-ghost">Customer 360</button></td></tr>`})}${tableRows('🧩 أعلى الخدمات',topServices,['الخدمة','المبيعات','إجراء'],function(x){return `<tr><td>${execEsc(x[0])}</td><td>${money(x[1])}</td><td><button class="btn btn-ghost" data-exec-filter="service" data-exec-value="${execEsc(x[0])}">تفاصيل</button></td></tr>`})}</div><div class="exec-grid" style="margin-top:18px">${tableRows('🚐 أفضل السيارات',topVans,['السيارة','المبيعات','تفاصيل'],function(x){return `<tr><td>${execEsc(x[0])}</td><td>${money(x[1])}</td><td><button class="btn btn-ghost" data-exec-filter="van" data-exec-value="${execEsc(x[0])}">فتح</button></td></tr>`})}<div class="exec-card"><h3>📌 ملخص إداري</h3><div class="exec-rec-grid"><div class="exec-rec info"><b>متوسط الفاتورة</b><span>${money(avg)}</span></div><div class="exec-rec good"><b>أفضل خدمة</b><span>${topServices[0]?execEsc(topServices[0][0]):'-'}</span></div><div class="exec-rec warn"><b>أعلى سيارة</b><span>${topVans[0]?execEsc(topVans[0][0]):'-'}</span></div><div class="exec-rec ${alerts.length?'bad':'good'}"><b>حالة المخاطر</b><span>${alerts.length?`${alerts.length} تنبيه يحتاج مراجعة`:'لا توجد مخاطر واضحة'}</span></div></div></div></div>`);window.__execAlerts=alerts;window.__execRows=rows;}
  window.openExecutiveAlert=function(idx){let a=(window.__execAlerts||[])[idx];if(!a)return;if(a.type==='inactive'){let html='<div class="exec-table"><table><thead><tr><th>العميل</th><th>آخر تعامل</th><th>أيام توقف</th><th>إجمالي سابق</th><th>فتح</th></tr></thead><tbody>'+a.items.map(function(c){return `<tr><td>${execEsc(c.name)}</td><td>${execEsc(c.last)}</td><td>${fmt0(c.days)}</td><td>${money(c.total)}</td><td><button class="btn btn-ghost">Customer 360</button></td></tr>`}).join('')+'</tbody></table></div>';if(window.openPetDrill)openPetDrill(a.title,a.sub,a.rows);(window.requestAnimationFrame||function(cb){return setTimeout(cb,16)})(function(){let b=document.getElementById('petDrillBody');if(b)execSafeHtml(b, html, 'executive alert drill render')});return} if(window.openPetDrill)openPetDrill(a.title,a.sub,a.rows||[])}
  window.exportExecutiveExcel=function(){try{let rows=execFiltered(),alerts=buildAlerts(rows),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['المؤشر','القيمة'],['إجمالي المبيعات',sum(rows,'totalInc')],['قبل الضريبة',sum(rows,'totalEx')],['الضريبة',sum(rows,'tax')],['الفواتير',uniqueInv(rows)],['العملاء',new Set(rows.map(clientName)).size],['التنبيهات',alerts.length]]),'Executive Summary');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['نوع التنبيه','المستوى','الوصف'],...alerts.map(a=>[a.title,a.level,a.sub])]),'Alerts');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([HEADERS,...rows.map(r=>fields.map(f=>r[f]))]),'Filtered Records');XLSX.writeFile(wb,'PETATOE_Executive_Dashboard.xlsx')}catch(e){console.error(e);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر تصدير الإدارة العليا'):'تعذر تصدير الإدارة العليا')}}
  function scheduleExecutiveDashboard(){clearTimeout(scheduleExecutiveDashboard._t);scheduleExecutiveDashboard._t=setTimeout(renderExecutiveDashboard,90)}
  document.addEventListener('petatoe:tabchange',function(e){if(e.detail&&e.detail.tabId==='executive')scheduleExecutiveDashboard()});
})();

/* ===== PETATOE v2.3 - Drill Down + Customer 360 Safe Module ===== */
(function(){
  if(window.__PETATOE_DRILL_CUSTOMER360_DELEGATES_BOUND__)return;
  window.__PETATOE_DRILL_CUSTOMER360_DELEGATES_BOUND__=true;
  function localHtmlEsc(v){return String(v??'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function rowDateVal(r){try{return dateObj(r)||new Date(parseDate(r.date))}catch(e){return null}}
  function sortedRows(rows){return (rows||[]).slice().sort(function(a,b){let da=rowDateVal(a),db=rowDateVal(b);return (db?db.getTime():0)-(da?da.getTime():0)})}
  function uniqueInvoices(rows){return new Set((rows||[]).map(function(r){return r.invoice||''}).filter(Boolean)).size}
  function sumField(rows,f){return (rows||[]).reduce(function(s,r){return s+parseNum(r[f])},0)}
  function clientName(r){return String((r&&r.client)||'غير محدد').trim()||'غير محدد'}
  function serviceName(r){return String((r&&r.item)||'غير محدد').trim()||'غير محدد'}
  function monthKey(r){return monthArabic(normalizeMonth(r.month,r.date))+' '+(getYear(r)||'')}
  window.closePetDrillModal=function(){var m=document.getElementById('petDrillModal'); if(m)m.classList.remove('show')}
  function showModal(title,sub,html){window.PETATOESafeRender.text(document.getElementById('petDrillTitle'),title);window.PETATOESafeRender.text(document.getElementById('petDrillSub'),sub);window.PETATOESafeRender.setHTML(document.getElementById('petDrillBody'),html);document.getElementById('petDrillModal').classList.add('show')}
  function baseKpis(rows){let total=sumField(rows,'totalInc'),net=sumField(rows,'totalEx'),tax=sumField(rows,'tax'),inv=uniqueInvoices(rows),clients=new Set(rows.map(clientName)).size;return `<div class="pet-dd-kpis"><div class="pet-dd-kpi"><span>إجمالي المبيعات</span><b>${money(total)}</b></div><div class="pet-dd-kpi"><span>قبل الضريبة</span><b>${money(net)}</b></div><div class="pet-dd-kpi"><span>الضريبة</span><b>${money(tax)}</b></div><div class="pet-dd-kpi"><span>الفواتير</span><b>${fmt0(inv)}</b></div><div class="pet-dd-kpi"><span>العملاء</span><b>${fmt0(clients)}</b></div></div>`}
  function recordsTable(rows,limit){rows=sortedRows(rows);let show=limit?rows.slice(0,limit):rows;return `<div class="pet-dd-actions"><input class="pet-dd-search" placeholder="بحث داخل التفاصيل..." data-pet-drill-filter="1"><button class="exp-btn exp-btn-excel" data-pet-drill-export="1">⬇️ Excel</button><span class="pill">${fmt0(show.length)} / ${fmt0(rows.length)} سجل</span></div><div class="pet-dd-table"><table id="petDrillTable"><thead><tr><th>التاريخ</th><th>الفاتورة</th><th>العميل</th><th>الخدمة</th><th>السيارة</th><th>طريقة الدفع</th><th>الكمية</th><th>قبل الضريبة</th><th>الضريبة</th><th>شامل الضريبة</th></tr></thead><tbody>${show.map(function(r){return `<tr><td>${localHtmlEsc(r.date)}</td><td>${localHtmlEsc(r.invoice)}</td><td>${localHtmlEsc(clientName(r))}</td><td>${localHtmlEsc(serviceName(r))}</td><td>${localHtmlEsc(r.van)}</td><td>${localHtmlEsc(r.pay)}</td><td>${fmt0(parseNum(r.qty))}</td><td>${money(parseNum(r.totalEx))}</td><td>${money(parseNum(r.tax))}</td><td>${money(parseNum(r.totalInc))}</td></tr>`}).join('')}</tbody></table></div>`}
  window.petCurrentDrillRows=[];
  window.openPetDrill=function(title,sub,rows){window.petCurrentDrillRows=sortedRows(rows||[]);showModal(localHtmlEsc(title),localHtmlEsc(sub),baseKpis(window.petCurrentDrillRows)+recordsTable(window.petCurrentDrillRows));}
  window.openPetInvoiceDrill=function(inv){let rows=records.filter(function(r){return String(r.invoice||'')===String(inv||'')});window.petCurrentDrillRows=sortedRows(rows);let c=rows[0]?clientName(rows[0]):'-';showModal('🧾 فاتورة '+localHtmlEsc(inv),'العميل: '+localHtmlEsc(c),baseKpis(rows)+recordsTable(rows));}
  window.PETATOEOpenPetClient360Core=function(name){var runtime=window.PETATOECustomer360Runtime;if(runtime&&typeof runtime.open==='function')return runtime.open(name);return false}
  window.petFilterDrillRows=function(q){q=String(q||'').toLowerCase();let trs=document.querySelectorAll('#petDrillTable tbody tr');trs.forEach(function(tr){tr.style.display=(!q||tr.innerText.toLowerCase().includes(q))?'':'none'})}
  window.petExportCurrentDrill=function(){try{let rows=window.petCurrentDrillRows||[];let ws=XLSX.utils.aoa_to_sheet([HEADERS,...rows.map(function(r){return fields.map(function(f){return r[f]})})]);let wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'DrillDown');XLSX.writeFile(wb,'PETATOE_DrillDown.xlsx')}catch(e){console.error(e);toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر التصدير'):'تعذر التصدير')}}
  function attachDrillHints(){try{document.querySelectorAll('#kpis .kpi,#vanCards .mini,#insights .insight,.payment-row').forEach(function(el){el.classList.add('drill-clickable')})}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/exec-alerts-block.js",e);}}
  function scheduleAttachDrillHints(delay){clearTimeout(scheduleAttachDrillHints._t);scheduleAttachDrillHints._t=setTimeout(attachDrillHints,delay||100)}

  function petDecodeHtml(v){var t=document.createElement('textarea');t.innerHTML=String(v||'');return t.value}
  function petOpenCustomer360Safe(name){
    name=petDecodeHtml(name||'').trim();
    function openNow(){
      if(typeof window.openPetClient360==='function'){ window.openPetClient360(name); return true; }
      if(window.PETATOERouter && typeof window.PETATOERouter.openTab==='function'){
        window.PETATOERouter.openTab('customer360');
        window.setTimeout(function(){
          var search=document.getElementById('customer360Search');
          if(search) search.value=name;
          if(typeof window.renderCustomer360Panel==='function') window.renderCustomer360Panel(name);
          if(typeof window.showCustomer360==='function') window.showCustomer360(name);
        },60);
        return true;
      }
      return false;
    }
    if(openNow()) return Promise.resolve(true);
    var gate=window.PETATOEMobileStartupGate;
    if(!gate || typeof gate.ensureGroup!=='function') return Promise.resolve(false);
    return Promise.resolve(gate.ensureGroup('customer360')).then(function(ready){
      if(ready!==true) throw new Error('customer360 readiness failed');
      if(!openNow()) throw new Error('openPetClient360 unavailable after customer360 readiness');
      return true;
    }).catch(function(error){
      try{console.error('[PETATOE Customer360] runtime open failed',error);}catch(_e){}
      return false;
    });
  }
  function handleExecDelegatedClick(e){
    var alertEl=e.target.closest&&e.target.closest('[data-exec-alert-index]');
    if(alertEl){openExecutiveAlert(parseInt(alertEl.getAttribute('data-exec-alert-index'),10)||0);return true}
    var drill=e.target.closest&&e.target.closest('[data-exec-drill]');
    if(drill){var kind=drill.getAttribute('data-exec-drill');if(kind==='total')openPetDrill('👑 إجمالي مبيعات الإدارة','تفاصيل الفلتر الإداري الحالي',execFiltered());else if(kind==='invoices')openPetDrill('🧾 الفواتير','كل فواتير الفلتر الإداري',execFiltered());else if(kind==='clients')openPetDrill('👥 العملاء','كل عمليات العملاء داخل الفلتر',execFiltered());else if(kind==='alerts'){var block=document.getElementById('execAlertsBlock');if(block)block.scrollIntoView({behavior:'smooth'});}return true}
    var client=e.target.closest&&e.target.closest('[data-pet-client360]');
    if(client){petOpenCustomer360Safe(client.getAttribute('data-pet-client360'));return true}
    var filterBtn=e.target.closest&&e.target.closest('[data-exec-filter]');
    if(filterBtn){var type=filterBtn.getAttribute('data-exec-filter'),val=petDecodeHtml(filterBtn.getAttribute('data-exec-value'));if(type==='service')openPetDrill('🧩 '+val,'تفاصيل الخدمة',execFiltered().filter(function(r){return String(r.item||'غير محدد')===val}));else if(type==='van')openPetDrill('🚐 '+val,'تفاصيل السيارة',execFiltered().filter(function(r){return String(r.van||'غير محدد')===val}));return true}
    var exp=e.target.closest&&e.target.closest('[data-pet-drill-export]');
    if(exp){petExportCurrentDrill();return true}
    var invoice=e.target.closest&&e.target.closest('[data-pet-invoice]');
    if(invoice){openPetInvoiceDrill(petDecodeHtml(invoice.getAttribute('data-pet-invoice')));return true}
    var customer=e.target.closest&&e.target.closest('[data-customer360-name]');
    if(customer){showCustomer360(petDecodeHtml(customer.getAttribute('data-customer360-name')));return true}
    var card=e.target.closest&&e.target.closest('.customer360-card');
    if(card){var cb=card.querySelector('b');if(cb)showCustomer360(cb.textContent||'');return true}
    var svc=e.target.closest&&e.target.closest('[data-customer-service]');
    if(svc){openPetClientServiceDrill(petDecodeHtml(svc.getAttribute('data-customer-name')),petDecodeHtml(svc.getAttribute('data-service-name')));return true}
    var invRow=e.target.closest&&e.target.closest('#petDrillTable tbody tr');
    if(invRow){var invCell=invRow.children&&invRow.children[1];if(invCell)openPetInvoiceDrill(invCell.textContent||'');return true}
    if(e.target.closest&&e.target.closest('[data-payroll-action],#payrollArea,#salarySlipArea,.payroll-shell,.salary-slip-redesign-shell,.salary-slip-self-service'))return false;
    var customerBtn=e.target.closest&&e.target.closest('button.btn-ghost');
    if(customerBtn && /Customer 360|متابعة|فتح/.test(customerBtn.textContent||'')){var explicit=customerBtn.getAttribute('data-bi-client')||customerBtn.getAttribute('data-pet-client360')||customerBtn.getAttribute('data-client-name')||'';var row=customerBtn.closest('tr');var named=row&&row.querySelector&&row.querySelector('[data-bi-client],[data-client-name],[data-customer-name]');var name=explicit||(named&&(named.getAttribute('data-bi-client')||named.getAttribute('data-client-name')||named.getAttribute('data-customer-name')))||'';if(!name&&row){var cells=row.children||[];for(var ci=cells.length-1;ci>=0;ci--){var txt=String(cells[ci].textContent||'').trim();if(txt&&!/^(Customer 360|متابعة|فتح)$/.test(txt)){name=txt;break;}}}petOpenCustomer360Safe(name);return true}
    return false;
  }
  document.addEventListener('click',function(e){
    if(handleExecDelegatedClick(e))return;
    if(e.target.closest('.kpi-info-btn,.kpi-tooltip,button,a,input,select'))return;
    let k=e.target.closest('#kpis .kpi');
    if(k){let idx=[].indexOf.call(document.querySelectorAll('#kpis .kpi'),k);let data=filtered();let titles=['إجمالي المبيعات','المبيعات قبل الضريبة','الضريبة','عدد العمليات','عدد العملاء','متوسط الفاتورة'];openPetDrill('🔎 '+(titles[idx]||'تفاصيل المؤشر'),'تفاصيل مبنية على نفس فلاتر الشاشة الرئيسية الحالية',data);return}
    let pay=e.target.closest('#payValues .payment-row');
    if(pay && !pay.classList.contains('payment-total-row')){let name=(pay.querySelector('.pay-name span')||{}).textContent||'';openPetDrill('💳 '+name,'كل العمليات لطريقة الدفع المحددة',filtered().filter(function(r){return String(r.pay||'')===name}));return}
    let van=e.target.closest('#vanCards .mini');
    if(van){let name=(van.querySelector('b')||{}).textContent||'';openPetDrill('🚐 '+name,'كل عمليات السيارة المحددة',filtered().filter(function(r){return String(r.van||'')===name}));return}
    let ins=e.target.closest('#insights .insight');
    if(ins){let txt=(ins.querySelector('.big')||{}).textContent||'';let i=[].indexOf.call(document.querySelectorAll('#insights .insight'),ins);let data=filtered();let rows=data;if(i===0){rows=data.filter(function(r){return monthKey(r).includes(txt) || (MAR[normalizeMonth(r.month,r.date)]||'')===txt})} if(i===1){rows=data.filter(function(r){return String(r.van||'')===txt})} if(i===2){rows=data.filter(function(r){return String(r.pay||'')===txt})} if(i===3){rows=data.filter(function(r){return serviceName(r)===txt})}openPetDrill('🔎 '+txt,'تفاصيل المؤشر السريع',rows);return}
  },true);
  document.addEventListener('input',function(e){var f=e.target.closest&&e.target.closest('[data-pet-drill-filter]');if(f)petFilterDrillRows(f.value)},true);
  document.addEventListener('keydown',function(e){if(e.key!=='Enter'&&e.key!==' ')return;if(handleExecDelegatedClick(e)){e.preventDefault();}},true);
  document.addEventListener('petatoe:tabchange',function(e){var d=e.detail||{}; if(d.tabId==='dashboard')scheduleAttachDrillHints(100);});
  scheduleAttachDrillHints(800);
  // Customer 360 rendering/export ownership moved to PETATOECustomer360Runtime.
  window.openPetClientServiceDrill=function(name,svc){let rows=records.filter(function(r){return clientName(r)===String(name)&&serviceName(r)===String(svc)});openPetDrill('🧩 '+svc,'خدمات العميل: '+name,rows)}
})();