/* ===== PETATOE v2.5 - Executive Dynamic Insight Tooltips Safe Module ===== */
(function(){
  if(window.__PETATOE_EXEC_INSIGHT_TOOLTIP_DELEGATES_BOUND__)return;
  window.__PETATOE_EXEC_INSIGHT_TOOLTIP_DELEGATES_BOUND__=true;
  function text(el,sel){var x=sel?el.querySelector(sel):el;return (x&&x.textContent||'').trim()}
  function block_4159_esc(v){return window.PETATOEUtils.escapeHtml(v)}
  function ensureTip(){
    var t=document.getElementById('execInsightTooltip');
    if(!t){t=document.createElement('div');t.id='execInsightTooltip';document.body.appendChild(t)}
    return t;
  }
  /* v3.11.10: using global clamp */
  function numberFromText(v){var n=String(v||'').replace(/[^0-9.\-]/g,'');return n?Number(n):0}
  function makeHtml(ico,title,desc,boxes,hint){
    return '<div class="eit-head"><span class="eit-ico">'+block_4159_esc(ico||'ℹ️')+'</span><span>'+block_4159_esc(title||'معلومة')+'</span></div>'+
      '<div class="eit-desc">'+desc+'</div>'+
      (boxes&&boxes.length?'<div class="eit-grid">'+boxes.map(function(b){return '<div class="eit-box"><small>'+block_4159_esc(b[0])+'</small><b>'+block_4159_esc(b[1])+'</b></div>'}).join('')+'</div>':'')+
      (hint?'<div class="eit-hint">'+hint+'</div>':'');
  }
  function getKpiTip(el){
    var label=text(el,'span'),value=text(el,'b'),small=text(el,'small');
    var map={
      'إجمالي المبيعات':['👑','إجمالي المبيعات','إجمالي قيمة المبيعات داخل الفلاتر الحالية. استخدمه كمؤشر سريع لحجم النشاط، واضغط على الكارت لفتح تفاصيل الفواتير المرتبطة بنفس الفلتر.','يقيس حجم الإيراد شامل الضريبة.'],
      'عدد الفواتير':['🧾','عدد الفواتير','عدد الفواتير الفريدة داخل النطاق الحالي. يساعدك على معرفة هل النمو ناتج عن زيادة عدد العمليات أم عن ارتفاع متوسط الفاتورة.','اضغط لعرض الفواتير.'],
      'العملاء':['👥','العملاء','عدد العملاء النشطين داخل الفلتر الحالي. الرقم لا يعني كل قاعدة العملاء، بل العملاء الذين ظهر لهم تعامل في الفترة المختارة.','مفيد لتقييم انتشار المبيعات.'],
      'قبل الضريبة':['💰','قبل الضريبة','قيمة المبيعات قبل ضريبة القيمة المضافة. هذا الرقم مناسب للتحليل المالي الصافي بعيدًا عن تأثير الضريبة.','VAT excluded.'],
      'الضريبة':['🧾','الضريبة','إجمالي ضريبة القيمة المضافة المحسوبة من العمليات داخل الفلتر الحالي. يستخدم للمراجعة المالية ومطابقة الضريبة.','VAT فقط.'],
      'التنبيهات':['🚨','التنبيهات','عدد التنبيهات التي رصدها Alerts Engine بناءً على العملاء المتوقفين، انخفاض الخدمات، أو فرص العملاء الجدد.','اضغط للانتقال لقسم التنبيهات.']
    };
    var m=map[label]||['ℹ️',label||'مؤشر إداري','هذا المؤشر محسوب من نفس بيانات الفلتر الحالي في Executive Dashboard، ولا يغيّر أي تقرير قديم.',''];
    return makeHtml(m[0],m[1],block_4159_esc(m[2]),[['القيمة الحالية',value||'-'],['قراءة سريعة',small||m[3]||'-']],m[3]?block_4159_esc(m[3]):'');
  }
  function getHealthTip(el){
    var score=text(el,'b')||text(el);
    var n=numberFromText(score);
    var status=n>=80?'قوي':n>=60?'مقبول':'يحتاج متابعة';
    var desc='مؤشر صحة النشاط يلخص وضع المبيعات من زاوية إدارية: النمو مقارنة بالفترة السابقة، عدد الفواتير، وعدد التنبيهات الحرجة والمتوسطة. هو مؤشر مساعد للقرار وليس بديلًا عن التقارير التفصيلية.';
    return makeHtml('❤️','Business Health',desc,[['الدرجة',score||'-'],['التقييم',status]],'كلما زادت التنبيهات أو انخفض النمو، تقل الدرجة تلقائيًا.');
  }
  function getAlertTip(el){
    var title=text(el,'b'),sub=text(el,'span'),level=text(el,'.alert-badge');
    return makeHtml('🚨',title||'تنبيه إداري',block_4159_esc(sub||'تنبيه مبني على قراءة البيانات الحالية.'),[['المستوى',level||'-'],['الإجراء','اضغط لفتح التفاصيل']], 'التنبيهات هنا قابلة للضغط وتفتح Drill Down بنفس البيانات المرتبطة بها.');
  }
  function getRecTip(el){
    var title=text(el,'b'),body=text(el,'span');
    return makeHtml('🎯',title||'توصية إدارية',block_4159_esc(body||'اقتراح مبني على قراءة البيانات الحالية.'),[['نوعها','توصية تشغيلية'],['الاستخدام','دعم القرار']], 'استخدمها كبداية للتحليل، ثم افتح التفاصيل من الجداول أو التنبيهات.');
  }
  function getCardTitleTip(el){
    var title=text(el),card=el.closest('.exec-card'),p=text(card,'p');
    var desc=p||'قسم إداري داخل Executive Dashboard يلخص جزءًا من أداء النشاط.';
    var ico=title.includes('صحة')?'❤️':title.includes('Alerts')||title.includes('تنبيه')?'🚨':title.includes('قرارات')?'🎯':title.includes('العملاء')?'🏆':title.includes('الخدمات')?'🧩':title.includes('السيارات')?'🚐':'📌';
    return makeHtml(ico,title||'قسم إداري',block_4159_esc(desc),[['طريقة القراءة','Hover للشرح'],['التفاصيل','اضغط على العناصر المتاحة']], 'الفقاعة تظهر داخل حدود الشاشة وتغيّر مكانها تلقائيًا حسب المساحة.');
  }
  function getTableRowTip(el){
    var card=el.closest('.exec-card'),title=text(card,'h3'),cells=[].map.call(el.children,function(td){return td.textContent.trim()}).filter(Boolean);
    if(!cells.length)return '';
    var main=cells[0]||'-',value=cells[1]||'-';
    var icon=title.includes('العملاء')?'🏆':title.includes('الخدمات')?'🧩':title.includes('السيارات')?'🚐':'📊';
    return makeHtml(icon,main,'هذا الصف يمثل عنصرًا من '+block_4159_esc(title||'القائمة')+'. القيمة المعروضة محسوبة طبقًا للفلاتر الحالية داخل Executive Dashboard.',[['القيمة',value],['القسم',title||'-']], 'استخدم زر الإجراء داخل الصف لفتح Customer 360 أو Drill Down.');
  }
  function build(el){
    if(!document.getElementById('executive')?.classList.contains('active'))return '';
    var k=el.closest('.exec-kpi'); if(k)return getKpiTip(k);
    var h=el.closest('.exec-health-ring'); if(h)return getHealthTip(h);
    var a=el.closest('.alert-row'); if(a)return getAlertTip(a);
    var r=el.closest('.exec-rec'); if(r)return getRecTip(r);
    var tr=el.closest('.exec-table tbody tr'); if(tr)return getTableRowTip(tr);
    var h3=el.closest('.exec-card h3'); if(h3)return getCardTitleTip(h3);
    return '';
  }
  var current=null, hideTimer=null;
  var execTipRaf=0;
  function scheduleExecTipPosition(){
    if(execTipRaf)return;
    execTipRaf=requestAnimationFrame(function(){
      execTipRaf=0;
      var t=document.getElementById('execInsightTooltip');
      if(t&&t.classList.contains('show')&&current)positionTip(t,current);
    });
  }
  function positionTip(t,anchor){
    var rect=anchor.getBoundingClientRect(), vw=window.innerWidth||document.documentElement.clientWidth, vh=window.innerHeight||document.documentElement.clientHeight, margin=12, gap=12;
    t.classList.remove('arrow-right','arrow-bottom');
    t.style.width='auto';
    var tw=Math.min(t.offsetWidth||360, vw-2*margin), th=Math.min(t.offsetHeight||220, vh-2*margin);
    var left=rect.left-gap-tw, top=rect.top+(rect.height/2)-(th/2), arrowTop=clamp(rect.top+rect.height/2-top-6,18,Math.max(18,th-30));
    if(left<margin){left=rect.right+gap;t.classList.add('arrow-right')}
    if(left+tw>vw-margin){left=clamp(rect.left+rect.width/2-tw/2,margin,vw-tw-margin);top=rect.top-gap-th;t.classList.add('arrow-bottom');arrowTop=22}
    top=clamp(top,margin,vh-th-margin);
    if(t.classList.contains('arrow-bottom')){
      var arrowLeft=clamp(rect.left+rect.width/2-left-6,18,Math.max(18,tw-28));
      t.style.setProperty('--exec-tip-arrow-left',arrowLeft+'px');
    }else{
      t.style.setProperty('--exec-tip-arrow-top',arrowTop+'px');
    }
    t.style.left=Math.round(left)+'px';
    t.style.top=Math.round(top)+'px';
  }
  function show(anchor,html){
    clearTimeout(hideTimer);
    var t=ensureTip();
    (window.PETATOESafeRender&&window.PETATOESafeRender.setHTML?window.PETATOESafeRender.setHTML(t,html):t.insertAdjacentHTML('beforeend',html));
    t.classList.add('show');
    current=anchor;
    requestAnimationFrame(function(){positionTip(t,anchor)});
  }
  function hide(){
    clearTimeout(hideTimer);
    hideTimer=setTimeout(function(){var t=document.getElementById('execInsightTooltip');if(t)t.classList.remove('show');current=null;},90);
  }
  document.addEventListener('mouseover',function(e){
    var anchor=e.target.closest&&e.target.closest('#executive .exec-kpi,#executive .exec-health-ring,#executive .alert-row,#executive .exec-rec,#executive .exec-table tbody tr,#executive .exec-card h3');
    if(!anchor)return;
    var html=build(anchor); if(html)show(anchor,html);
  },true);
  document.addEventListener('mouseout',function(e){
    var anchor=e.target.closest&&e.target.closest('#executive .exec-kpi,#executive .exec-health-ring,#executive .alert-row,#executive .exec-rec,#executive .exec-table tbody tr,#executive .exec-card h3');
    if(anchor)hide();
  },true);
  document.addEventListener('focusin',function(e){
    var anchor=e.target.closest&&e.target.closest('#executive .exec-kpi,#executive .exec-health-ring,#executive .alert-row,#executive .exec-rec,#executive .exec-table tbody tr,#executive .exec-card h3');
    if(!anchor)return; var html=build(anchor); if(html)show(anchor,html);
  },true);
  document.addEventListener('focusout',function(e){if(current)hide()},true);
  window.addEventListener('resize',scheduleExecTipPosition);
  window.addEventListener('scroll',scheduleExecTipPosition,true);
})();


/* ===== PETATOE v2.7 - Business Intelligence Safe Add-on ===== */
(function(){
  if(window.__PETATOE_BI_DELEGATES_BOUND__)return;
  window.__PETATOE_BI_DELEGATES_BOUND__=true;
  function block_4289_esc(v){return window.PETATOEUtils.escapeHtml(v)}
  function rowsBySmartYear(){try{return (records||[]).slice()}catch(e){return []}}
  function dateObj(r){var s=parseDate(r&&r.date);var m=String(s||'').match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(!m)return null;var d=new Date(+m[1],+m[2]-1,+m[3]);return isNaN(d)?null:d}
  function daysBetween(a,b){return Math.max(0,Math.round((b-a)/86400000))}
  function group(rows,keyFn){var m={};(rows||[]).forEach(function(r){var k=keyFn(r)||'غير محدد';(m[k]=m[k]||[]).push(r)});return m}
  function total(rows,f){return (rows||[]).reduce(function(s,r){return s+parseNum(r[f])},0)}
  function uniqueInvoices(rows){return new Set((rows||[]).map(function(r){return String(r.invoice||'')})).size}
  function maxDate(rows){var ds=(rows||[]).map(dateObj).filter(Boolean);return ds.length?new Date(Math.max.apply(null,ds.map(Number))):new Date()}
  function clientKey(r){return String((r&&r.client)||'غير محدد').trim()||'غير محدد'}
  function serviceKey(r){return String((r&&r.item)||'غير محدد').trim()||'غير محدد'}
  function vanKey(r){return String((r&&r.van)||'غير محدد').trim()||'غير محدد'}
  function monthIndex(r){var m=normalizeMonth(r.month,r.date);var idx=MONTHS.indexOf(String(m||'').toLowerCase());return idx<0?null:idx}
  function trendOf(rows){var arr=Array(12).fill(0);(rows||[]).forEach(function(r){var i=monthIndex(r);if(i!=null)arr[i]+=parseNum(r.totalInc)});var lastNon=-1;for(var i=11;i>=0;i--){if(arr[i]>0){lastNon=i;break}}if(lastNon<0)return {last3:0,prev3:0,change:0,arr:arr};var lastStart=Math.max(0,lastNon-2),prevEnd=lastStart-1,prevStart=Math.max(0,prevEnd-2);var last3=arr.slice(lastStart,lastNon+1).reduce((a,b)=>a+b,0);var prev3=prevEnd>=0?arr.slice(prevStart,prevEnd+1).reduce((a,b)=>a+b,0):0;return {last3:last3,prev3:prev3,change:prev3?((last3-prev3)/prev3)*100:0,arr:arr};}
  function customerHealth(rows){var ref=maxDate(rows), gm=group(rows,clientKey), out=[];Object.keys(gm).forEach(function(name){var rs=gm[name], val=total(rs,'totalInc'), inv=uniqueInvoices(rs), ds=rs.map(dateObj).filter(Boolean).sort(function(a,b){return a-b}), last=ds[ds.length-1]||ref, first=ds[0]||ref, rec=daysBetween(last,ref);var tr=trendOf(rs);var recScore=Math.max(0,100-(rec/90)*100), freqScore=Math.min(100,inv*12), moneyScore=Math.min(100,(val/Math.max(1,total(rows,'totalInc')))*900), trendScore=Math.max(0,Math.min(100,50+tr.change));var score=Math.round(recScore*.38+freqScore*.22+moneyScore*.25+trendScore*.15);var cls=score>=75?'good':score>=45?'warn':'bad';out.push({name:name,rows:rs,value:val,inv:inv,last:last,rec:rec,trend:tr.change,score:score,cls:cls})});return out.sort(function(a,b){return a.score-b.score})}
  function leakage(rows){var ref=maxDate(rows), clients=customerHealth(rows);var inactive=clients.filter(function(c){return c.rec>=45}).map(function(c){var activeMonths=new Set(c.rows.map(function(r){return String(getYear(r))+'-'+normalizeMonth(r.month,r.date)})).size||1;var avg=c.value/activeMonths;var missed=Math.max(1,Math.floor(c.rec/30));return Object.assign({},c,{avg:avg,missed:missed,lost:avg*missed})}).sort(function(a,b){return b.lost-a.lost});var serviceGroups=group(rows,serviceKey), vanGroups=group(rows,vanKey);var svc=Object.keys(serviceGroups).map(function(k){var rs=serviceGroups[k], tr=trendOf(rs);return {name:k,value:total(rs,'totalInc'),change:tr.change,last3:tr.last3,prev3:tr.prev3,loss:tr.change<0?(tr.prev3-tr.last3):0,rows:rs}}).sort(function(a,b){return b.loss-a.loss});var vans=Object.keys(vanGroups).map(function(k){var rs=vanGroups[k], tr=trendOf(rs);return {name:k,value:total(rs,'totalInc'),change:tr.change,loss:tr.change<0?(tr.prev3-tr.last3):0,rows:rs}}).sort(function(a,b){return b.loss-a.loss});return {inactive:inactive,services:svc,vans:vans,totalLost:inactive.slice(0,10).reduce(function(s,x){return s+x.lost},0)+svc.slice(0,5).reduce(function(s,x){return s+x.loss},0)+vans.slice(0,3).reduce(function(s,x){return s+x.loss},0)}}
  var biCache={stamp:'',data:null};
  function biRowsStamp(rows){
    rows=Array.isArray(rows)?rows:[];
    var len=rows.length, first=len?(rows[0]||{}):{}, last=len?(rows[len-1]||{}):{}, sample=0;
    var step=len>100?Math.max(1,Math.floor(len/16)):1;
    for(var i=0;i<len;i+=step){
      var r=rows[i]||{};
      var raw=String(r.id||r.invoice||'')+'|'+String(r.date||'')+'|'+String(clientKey(r)||'')+'|'+String(serviceKey(r)||'')+'|'+String(r.totalInc||r.totalEx||r.qty||'');
      for(var j=0;j<raw.length;j++){sample=((sample*33)+raw.charCodeAt(j))>>>0;}
    }
    return [len,first.id||first.invoice||first.date||'',last.id||last.invoice||last.date||'',last.totalInc||last.totalEx||last.qty||'',sample,window.petatoeBiHealthLimit||10,window.petatoeBiBestLimit||10,window.petatoeBiLeakageLimit||10,window.petatoeBiServicesLimit||10].join('|');
  }
  function biData(){var rows=rowsBySmartYear(), stamp=biRowsStamp(rows);if(biCache.data&&biCache.stamp===stamp)return biCache.data;var inv=uniqueInvoices(rows), revenue=total(rows,'totalInc'), clients=customerHealth(rows), leak=leakage(rows), active=clients.filter(function(c){return c.rec<45}).length, atRisk=clients.filter(function(c){return c.score<45||c.rec>=60}).length, returning=clients.filter(function(c){return c.inv>1}).length, health=clients.length?Math.round(clients.reduce(function(s,c){return s+c.score},0)/clients.length):0, tr=trendOf(rows), retention=clients.length?(returning/clients.length)*100:0;var bestClients=clients.slice().sort(function(a,b){return b.score-a.score});var valueClients=clients.slice().sort(function(a,b){return b.value-a.value});biCache={stamp:stamp,data:{rows:rows,stamp:stamp,inv:inv,revenue:revenue,clients:clients,bestClients:bestClients,valueClients:valueClients,leak:leak,active:active,atRisk:atRisk,returning:returning,health:health,trend:tr,retention:retention,avgInvoice:inv?revenue/inv:0,revPerClient:clients.length?revenue/clients.length:0}};return biCache.data}
  function actionCards(d){var a=[];if(d.atRisk>0)a.push(['bad','🚨 استرجاع العملاء','ابدأ بأعلى العملاء في جدول Customer Health الأقل من 45 أو الغائبين أكثر من 60 يوم.']);if(d.leak.totalLost>0)a.push(['warn','💸 سد تسريب الإيراد','راجع فرص التسريب الأعلى في الخدمات والسيارات والعملاء؛ القيمة تقديرية للمساعدة في ترتيب الأولويات.']);if(d.trend.change<0)a.push(['bad','📉 معالجة الهبوط','المبيعات في آخر 3 شهور أقل من الثلاث شهور السابقة. راجع الخدمات الهابطة وقدّم عرضًا مركزًا عليها.']);else a.push(['good','📈 دعم النمو','الاتجاه العام إيجابي؛ زوّد التركيز على الخدمات والعملاء الأعلى نموًا بدل تغيير الخطة بالكامل.']);var best=(d.valueClients||d.clients||[])[0];if(best)a.push(['info','🏆 حماية أفضل عميل','أعلى عميل حاليًا: '+best.name+' بقيمة '+money(best.value)+'. راقبه كعميل استراتيجي.']);if(!a.length)a.push(['good','✅ الوضع مستقر','لا توجد مخاطر واضحة حاليًا؛ استمر في متابعة المؤشرات أسبوعيًا.']);return a.slice(0,5)}
  function injectBusinessIntelligence(preferred){var area=document.getElementById('smartReportsArea'),tabs=document.getElementById('smartTabs');if(!area||!tabs)return;var legacy=tabs.querySelector('[data-smart-tab="business"]');if(legacy)legacy.remove();var fbtn=tabs.querySelector('[data-smart-tab="forecast"]');if(fbtn){fbtn.classList.add('smart-pill-merged-ai');fbtn.textContent='التوقعات وذكاء الأعمال';}var legacySec=area.querySelector('[data-smart-section="business"]');if(legacySec)legacySec.remove();var fsec=area.querySelector('[data-smart-section="forecast"]');if(fsec&&!fsec.querySelector('#biArea')){var wrap=document.createElement('div');wrap.className='merged-ai-divider';var wrapSpan=document.createElement('span');wrapSpan.textContent='ذكاء الأعمال التنفيذي';wrap.appendChild(wrapSpan);var bi=document.createElement('div');bi.id='biArea';bi.className='merged-bi-area';fsec.appendChild(wrap);fsec.appendChild(bi);}renderBusinessIntelligence();if(preferred==='business'&&typeof setSmartTab==='function')setSmartTab('forecast')}
  function badge(score){return score>=75?'<span class="bi-health-pill good">ممتاز '+score+'</span>':score>=45?'<span class="bi-health-pill warn">متوسط '+score+'</span>':'<span class="bi-health-pill bad">خطر '+score+'</span>'}
  function tipAttr(title,txt){return ' data-bi-title="'+block_4289_esc(title)+'" data-bi-tip="'+block_4289_esc(txt)+'"'}
  function petatoeBiEnsureLimit(name,def){
    var k='petatoeBi'+name+'Limit';
    if(!window[k])window[k]=def;
    return window[k];
  }
  function petatoeBiMoreBtn(name,shown,total){
    if(total<=shown)return '';
    return '<div class="smart-table-actions"><button type="button" class="btn btn-ghost" data-bi-more="'+name+'">انقر لعرض المزيد ('+Math.min(total,shown+10)+' / '+total+')</button></div>';
  }
  function petatoeBiPanelHead(title,sub,exportType){
    return '<div class="smart-report-head-actions bi-report-head"><div><h3>'+title+'</h3>'+(sub?'<p>'+sub+'</p>':'')+'</div><div class="smart-report-head-buttons"><button type="button" class="btn btn-green" data-bi-export-type="'+exportType+'">⬇️ Excel</button></div></div>';
  }
  function petatoeBiRenderTable(id,allRows,shownRows,columns,headersHtml,bodyHtml){
    allRows=Array.isArray(allRows)?allRows:[];
    shownRows=Array.isArray(shownRows)?shownRows:[];
    var canVirtual=!!(window.PETATOETables&&typeof window.PETATOETables.render==='function'&&allRows.length>0&&shownRows.length>=allRows.length);
    if(canVirtual){
      return window.PETATOETables.render({
        id:id,
        rows:allRows,
        columns:columns,
        limit:allRows.length,
        virtual:true,
        virtualThreshold:120,
        height:520,
        rowHeight:38
      });
    }
    return '<div class="bi-table"><table><thead><tr>'+headersHtml+'</tr></thead><tbody>'+bodyHtml+'</tbody></table></div>';
  }
  function petatoeBiSheet(wb,name,header,rows){
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([header].concat(rows)),name.slice(0,31));
  }
  window.exportPetatoeBIReport=function(type){
    try{
      if(!window.XLSX){toast(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('مكتبة Excel غير محملة'):'مكتبة Excel غير محملة');return}
      var d=biData(), wb=XLSX.utils.book_new(), rows=[];
      if(type==='health'){
        rows=d.clients.map(function(c){return [c.name,c.score,c.rec,c.value,c.inv]});
        petatoeBiSheet(wb,'Customer Health',['العميل','Score','أيام الغياب','الإنفاق','الفواتير'],rows);
        XLSX.writeFile(wb,'PETATOE_Customer_Health_All.xlsx');
      }else if(type==='best'){
        rows=(d.bestClients||d.clients||[]).map(function(c){return [c.name,c.score,c.value,c.inv,c.rec]});
        petatoeBiSheet(wb,'Best Customers',['العميل','Score','الإنفاق','الفواتير','أيام الغياب'],rows);
        XLSX.writeFile(wb,'PETATOE_Best_Healthy_Customers_All.xlsx');
      }else if(type==='leakage'){
        rows=d.leak.inactive.map(function(c){return [c.name,c.rec,c.avg,c.lost]});
        petatoeBiSheet(wb,'Revenue Leakage',['العميل','أيام الغياب','متوسط شهري','قيمة مفقودة تقديرية'],rows);
        XLSX.writeFile(wb,'PETATOE_Revenue_Leakage_All.xlsx');
      }else if(type==='services'){
        rows=d.leak.services.map(function(v){return [v.name,v.change,v.last3,v.prev3,v.loss]});
        petatoeBiSheet(wb,'Declining Services',['الخدمة','التغير %','آخر 3 شهور','قبلها','تسريب محتمل'],rows);
        XLSX.writeFile(wb,'PETATOE_Declining_Services_All.xlsx');
      }
    }catch(e){console.error(e);toast(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تعذر تصدير التقرير'):'تعذر تصدير التقرير')}
  };
  var biTableCache={key:'',risk:'',best:'',leak:'',services:''};
  function biTableKey(d,healthLimit,bestLimit,leakageLimit,svcLimit){
    return [d.stamp||'',healthLimit,bestLimit,leakageLimit,svcLimit].join('|');
  }
  function biBuildTables(d,healthLimit,bestLimit,leakageLimit,svcLimit){
    var key=biTableKey(d,healthLimit,bestLimit,leakageLimit,svcLimit);
    if(biTableCache.key===key)return biTableCache;
    var healthAll=d.clients.slice(), bestAll=(d.bestClients||d.clients||[]), leakageAll=d.leak.inactive.slice(), servicesAll=d.leak.services.slice();
    var riskCustomers=healthAll.slice(0,healthLimit), bestCustomers=bestAll.slice(0,bestLimit), leakClients=leakageAll.slice(0,leakageLimit), leakSvc=servicesAll.slice(0,svcLimit);
    biTableCache={key:key,healthAll:healthAll,bestAll:bestAll,leakageAll:leakageAll,servicesAll:servicesAll,riskCustomers:riskCustomers,bestCustomers:bestCustomers,leakClients:leakClients,leakSvc:leakSvc,
      risk:riskCustomers.map(function(c){return `<tr><td>${block_4289_esc(c.name)}</td><td>${badge(c.score)}</td><td>${fmt0(c.rec)} يوم</td><td>${money(c.value)}</td><td>${fmt0(c.inv)}</td><td><button class="btn btn-ghost">Customer 360</button></td></tr>`}).join(''),
      best:bestCustomers.map(function(c){return `<tr><td>${block_4289_esc(c.name)}</td><td>${badge(c.score)}</td><td>${money(c.value)}</td><td>${fmt0(c.inv)}</td><td><button class="btn btn-ghost">فتح</button></td></tr>`}).join(''),
      leak:leakClients.map(function(c){return `<tr><td>${block_4289_esc(c.name)}</td><td>${fmt0(c.rec)}</td><td>${money(c.avg)}</td><td>${money(c.lost)}</td><td><button class="btn btn-ghost">متابعة</button></td></tr>`}).join(''),
      services:leakSvc.map(function(s){var t='الخدمة انخفضت بنسبة '+s.change.toFixed(1)+'%. آخر 3 شهور '+money(s.last3)+' مقابل '+money(s.prev3)+' في الفترة السابقة. التسريب المحتمل '+money(s.loss)+'.';return `<tr class="bi-data-row"${tipAttr(s.name,t)}><td>${block_4289_esc(s.name)} <span class="bi-tip-mark">i</span></td><td class="bi-tip-cell"${tipAttr('نسبة التغير', 'مقارنة آخر 3 شهور بالثلاث شهور السابقة. النسبة السالبة تعني هبوط.')}>${s.change.toFixed(1)}%</td><td>${money(s.last3)}</td><td>${money(s.prev3)}</td><td class="bi-tip-cell"${tipAttr('تسريب محتمل', 'الفرق بين الفترة السابقة وآخر 3 شهور عند وجود انخفاض.')}>${money(s.loss)}</td></tr>`}).join('')
    };
    return biTableCache;
  }
  function petatoeClearBICache(reason){
    biCache={stamp:'',data:null};
    biTableCache={key:'',risk:'',best:'',leak:'',services:''};
    try{biRenderState.lastHtml='';biRenderState.lastChartStamp='';}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/bi-kpi-chart.js",e);}
    return true;
  }
  window.petatoeClearBICache=petatoeClearBICache;
  var biRenderState={raf:0,pending:false,lastHtml:'',lastChartStamp:''};
  function mountBiHtml(el,html){
    html=String(html||'');
    if(el.__petatoeBiLastHtml===html)return false;
    el.__petatoeBiLastHtml=html;
    (window.PETATOESafeRender&&window.PETATOESafeRender.setHTML?window.PETATOESafeRender.setHTML(el,html):el.insertAdjacentHTML('beforeend',html));
    return true;
  }
  window.renderBusinessIntelligence=function(){
    var el=document.getElementById('biArea');if(!el)return;
    if(biRenderState.pending)return;
    biRenderState.pending=true;
    var run=function(){
      biRenderState.pending=false;
      biRenderState.raf=0;
      var el=document.getElementById('biArea');if(!el)return;
      var d=biData();
    if(!d.rows.length){mountBiHtml(el,'<div class="smart-empty">لا توجد بيانات كافية لعرض ذكاء الأعمال.</div>');return}
    var healthLimit=petatoeBiEnsureLimit('Health',10), bestLimit=petatoeBiEnsureLimit('Best',10), leakageLimit=petatoeBiEnsureLimit('Leakage',10), svcLimit=petatoeBiEnsureLimit('Services',10);
    var tables=biBuildTables(d,healthLimit,bestLimit,leakageLimit,svcLimit), healthAll=tables.healthAll, bestAll=tables.bestAll, leakageAll=tables.leakageAll, servicesAll=tables.servicesAll;
    var riskCustomers=tables.riskCustomers, bestCustomers=tables.bestCustomers, leakClients=tables.leakClients, leakSvc=tables.leakSvc, acts=actionCards(d);
    var biHtml=`
    <div class="bi-hero"><div><h3>🧭 Business Intelligence Layer</h3><p>طبقة قرار تنفيذية: تقرأ الأرقام وتحوّلها لإجراءات، درجات صحة العملاء، وتسريب الإيراد المتوقع بدون تعديل أي تقرير قديم.</p></div><span class="bi-badge">AI-like Advisor</span></div>
    <div class="bi-export-row"><button class="exp-btn exp-btn-excel" data-bi-action="export-business-intelligence">⬇️ Excel ذكاء الأعمال</button><button class="exp-btn exp-btn-copy" data-bi-action="refresh-business-intelligence">🔄 تحديث الطبقة</button></div>
    <div class="bi-kpi-grid">
      <div class="bi-kpi" style="--accent:var(--purple)" data-bi-tip="متوسط درجة صحة العملاء حسب آخر زيارة، التكرار، قيمة الإنفاق، واتجاه النشاط."><span>Customer Health</span><b>${d.health}%</b><small>${d.health>=75?'مستقر وقوي':d.health>=45?'يحتاج متابعة':'خطر مرتفع'}</small></div>
      <div class="bi-kpi" style="--accent:var(--red)" data-bi-tip="عدد العملاء المعرضين للفقد بسبب ضعف الدرجة أو طول مدة الغياب."><span>عملاء معرضون للفقد</span><b>${fmt0(d.atRisk)}</b><small>Score منخفض أو غياب طويل</small></div>
      <div class="bi-kpi" style="--accent:var(--orange)" data-bi-tip="تقدير فرص مبيعات مفقودة من العملاء الغائبين والخدمات والسيارات الهابطة."><span>Revenue Leakage</span><b>${money(d.leak.totalLost)}</b><small>قيمة تقديرية للأولوية</small></div>
      <div class="bi-kpi" style="--accent:var(--green)" data-bi-tip="نسبة العملاء الذين ظهر لهم أكثر من فاتورة، كمؤشر احتفاظ مبسط."><span>Retention Rate</span><b>${d.retention.toFixed(1)}%</b><small>${fmt0(d.returning)} عميل متكرر</small></div>
      <div class="bi-kpi" style="--accent:var(--cyan)" data-bi-tip="إجمالي الإيراد مقسوم على عدد العملاء داخل النطاق المختار."><span>Revenue / Customer</span><b>${money(d.revPerClient)}</b><small>متوسط قيمة العميل</small></div>
      <div class="bi-kpi" style="--accent:var(--blue)" data-bi-tip="متوسط قيمة الفاتورة داخل نطاق التقارير الذكية الحالي."><span>Average Invoice</span><b>${money(d.avgInvoice)}</b><small>${fmt0(d.inv)} فاتورة</small></div>
    </div>
    <div class="bi-grid">
      <div class="bi-panel"><h3>🧠 AI Business Advisor</h3><p>إجراءات عملية مقترحة حسب قراءة النشاط الحالية.</p><div class="bi-action-list">${acts.map(function(x){return `<div class="bi-action ${x[0]}"><b>${block_4289_esc(x[1])}</b><span>${block_4289_esc(x[2])}</span></div>`}).join('')}</div></div>
      <div class="bi-panel"><h3>📊 KPI Center</h3><p>مؤشرات إدارية مركزة لا تغير أرقام التقارير الأصلية.</p><div class="bi-chart"><canvas id="biKpiChart"></canvas></div></div>
    </div>
    <div class="bi-grid bi-full-stack">
      <div class="bi-panel">${petatoeBiPanelHead('❤️ Customer Health Score','أقل العملاء صحة — اضغط Customer 360 للمتابعة.','health')}${petatoeBiRenderTable('biCustomerHealthVirtualTable',healthAll,riskCustomers,[{label:'العميل',render:function(c){return block_4289_esc(c.name)}},{label:'Score',render:function(c){return badge(c.score)}},{label:'آخر غياب',render:function(c){return fmt0(c.rec)+' يوم'}},{label:'الإنفاق',render:function(c){return money(c.value)}},{label:'الفواتير',render:function(c){return fmt0(c.inv)}},{label:'الإجراء',render:function(){return '<button class="btn btn-ghost">Customer 360</button>'}}],'<th>العميل</th><th>Score</th><th>آخر غياب</th><th>الإنفاق</th><th>الفواتير</th><th>الإجراء</th>',tables.risk)}${petatoeBiMoreBtn('Health',riskCustomers.length,healthAll.length)}</div>
      <div class="bi-panel">${petatoeBiPanelHead('🏆 أفضل العملاء صحة','عملاء يجب الحفاظ عليهم وتنمية مبيعاتهم.','best')}${petatoeBiRenderTable('biBestCustomersVirtualTable',bestAll,bestCustomers,[{label:'العميل',render:function(c){return block_4289_esc(c.name)}},{label:'Score',render:function(c){return badge(c.score)}},{label:'الإنفاق',render:function(c){return money(c.value)}},{label:'الفواتير',render:function(c){return fmt0(c.inv)}},{label:'الإجراء',render:function(){return '<button class="btn btn-ghost">فتح</button>'}}],'<th>العميل</th><th>Score</th><th>الإنفاق</th><th>الفواتير</th><th>الإجراء</th>',tables.best)}${petatoeBiMoreBtn('Best',bestCustomers.length,bestAll.length)}</div>
    </div>
    <div class="bi-grid bi-full-stack">
      <div class="bi-panel">${petatoeBiPanelHead('💸 Revenue Leakage Detection','أعلى فرص التسريب المقدرة من العملاء الغائبين.','leakage')}${petatoeBiRenderTable('biRevenueLeakageVirtualTable',leakageAll,leakClients,[{label:'العميل',render:function(c){return block_4289_esc(c.name)}},{label:'أيام الغياب',render:function(c){return fmt0(c.rec)}},{label:'متوسط شهري',render:function(c){return money(c.avg)}},{label:'قيمة مفقودة تقديرية',render:function(c){return money(c.lost)}},{label:'الإجراء',render:function(){return '<button class="btn btn-ghost">متابعة</button>'}}],'<th>العميل</th><th>أيام الغياب</th><th>متوسط شهري</th><th>قيمة مفقودة تقديرية</th><th>الإجراء</th>',tables.leak)}${petatoeBiMoreBtn('Leakage',leakClients.length,leakageAll.length)}</div>
      <div class="bi-panel">${petatoeBiPanelHead('📉 خدمات هابطة','خدمات انخفضت آخر 3 شهور مقارنة بالثلاث شهور السابقة.','services')}${petatoeBiRenderTable('biDecliningServicesVirtualTable',servicesAll,leakSvc,[{label:'الخدمة',render:function(s){var t='الخدمة انخفضت بنسبة '+s.change.toFixed(1)+'%. آخر 3 شهور '+money(s.last3)+' مقابل '+money(s.prev3)+' في الفترة السابقة. التسريب المحتمل '+money(s.loss)+'.';return block_4289_esc(s.name)+' <span class="bi-tip-mark">i</span>'}},{label:'التغير',render:function(s){return s.change.toFixed(1)+'%'}},{label:'آخر 3 شهور',render:function(s){return money(s.last3)}},{label:'قبلها',render:function(s){return money(s.prev3)}},{label:'تسريب محتمل',render:function(s){return money(s.loss)}}],'<th>الخدمة</th><th>التغير</th><th>آخر 3 شهور</th><th>قبلها</th><th>تسريب محتمل</th>',tables.services)}${petatoeBiMoreBtn('Services',leakSvc.length,servicesAll.length)}</div>
    </div>`;
    var htmlChanged=mountBiHtml(el,biHtml);
    var chartStamp=[d.health,Math.round(d.retention),d.atRisk,d.trend.change].join('|');
    if(htmlChanged||biRenderState.lastChartStamp!==chartStamp){biRenderState.lastChartStamp=chartStamp;try{chart('biKpiChart',{type:'bar',data:{labels:['Health','Retention','At Risk','Growth'],datasets:[{label:'BI Index',data:[d.health,Math.round(d.retention),Math.min(100,d.atRisk*10),Math.max(-100,Math.min(100,d.trend.change))],backgroundColor:[css('--green'),css('--cyan'),css('--red'),css('--purple')]}]},options:{...baseOpts(),scales:{y:{beginAtZero:true,ticks:{color:css('--chart-label')},grid:{color:'rgba(148,163,184,.12)'}},x:{ticks:{color:css('--chart-label')},grid:{display:false}}},plugins:{...baseOpts().plugins,legend:{display:false},petatoeLabels:{enabled:true,money:false,font:'900 11px Cairo'}}}})}catch(e){console.warn(e)}}
    };
    if(window.requestIdleCallback){biRenderState.raf=requestIdleCallback(run,{timeout:260});}else if(window.requestAnimationFrame){biRenderState.raf=requestAnimationFrame(run);}else{setTimeout(run,0);}
  };
  window.exportBusinessIntelligenceExcel=function(){try{var d=biData(),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['المؤشر','القيمة'],['Customer Health',d.health],['At Risk Customers',d.atRisk],['Revenue Leakage',d.leak.totalLost],['Retention Rate',d.retention],['Revenue Per Customer',d.revPerClient],['Average Invoice',d.avgInvoice]]),'BI Summary');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['العميل','Score','أيام الغياب','الإنفاق','الفواتير'],...d.clients.map(function(c){return [c.name,c.score,c.rec,c.value,c.inv]})]),'Customer Health');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['العميل','Score','الإنفاق','الفواتير','أيام الغياب'],...(d.bestClients||d.clients||[]).map(function(c){return [c.name,c.score,c.value,c.inv,c.rec]})]),'Best Customers');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['العميل','أيام الغياب','متوسط شهري','قيمة مفقودة'],...d.leak.inactive.map(function(c){return [c.name,c.rec,c.avg,c.lost]})]),'Revenue Leakage');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['الخدمة','التغير %','آخر 3 شهور','قبلها','تسريب محتمل'],...d.leak.services.map(function(s){return [s.name,s.change,s.last3,s.prev3,s.loss]})]),'Declining Services');XLSX.writeFile(wb,'PETATOE_Business_Intelligence.xlsx')}catch(e){console.error(e);toast(window.PETATOE_I18N&&window.PETATOE_I18N.translateRuntime?window.PETATOE_I18N.translateRuntime('تعذر تصدير ذكاء الأعمال'):'تعذر تصدير ذكاء الأعمال')}};
  window.injectBusinessIntelligence=injectBusinessIntelligence;

  function petBiDecodeHtml(v){var t=document.createElement('textarea');t.textContent=String(v||'');return t.value}
  document.addEventListener('click',function(e){
    var more=e.target.closest&&e.target.closest('[data-bi-more]');
    if(more){var name=more.getAttribute('data-bi-more');window['petatoeBi'+name+'Limit']=(window['petatoeBi'+name+'Limit']||10)+10;renderBusinessIntelligence();return}
    var exp=e.target.closest&&e.target.closest('[data-bi-export-type]');
    if(exp){window.exportPetatoeBIReport(exp.getAttribute('data-bi-export-type'));return}
    var act=e.target.closest&&e.target.closest('[data-bi-action]');
    if(act){var a=act.getAttribute('data-bi-action');if(a==='export-business-intelligence')exportBusinessIntelligenceExcel();else if(a==='refresh-business-intelligence')renderBusinessIntelligence();return}
    var client=e.target.closest&&e.target.closest('[data-pet-client360]');
    if(client){openPetClient360(petBiDecodeHtml(client.getAttribute('data-pet-client360')));return}
    if(e.target.closest&&e.target.closest('[data-payroll-action],#payrollArea,#salarySlipArea,.payroll-shell,.salary-slip-redesign-shell,.salary-slip-self-service'))return;
    var btn=e.target.closest&&e.target.closest('button.btn-ghost');
    if(btn && /Customer 360|فتح|متابعة/.test(btn.textContent||'')){var row=btn.closest('tr');var first=row&&row.children&&row.children[0];if(first)openPetClient360(first.textContent||'');return}
  },true);
  function ensureTip(){var t=document.getElementById('biInsightTooltip');if(!t){t=document.createElement('div');t.id='biInsightTooltip';document.body.appendChild(t)}return t}
  /* v3.11.10: using global clamp */
  function positionTip(t,anchor){var rect=anchor.getBoundingClientRect(),vw=window.innerWidth||document.documentElement.clientWidth,vh=window.innerHeight||document.documentElement.clientHeight,margin=12,gap=12;t.classList.remove('arrow-right','arrow-bottom');var tw=Math.min(t.offsetWidth||380,vw-2*margin),th=Math.min(t.offsetHeight||220,vh-2*margin),left=rect.left-gap-tw,top=rect.top+rect.height/2-th/2,arrowTop=clamp(rect.top+rect.height/2-top-6,18,Math.max(18,th-30));if(left<margin){left=rect.right+gap;t.classList.add('arrow-right')}if(left+tw>vw-margin){left=clamp(rect.left+rect.width/2-tw/2,margin,vw-tw-margin);top=rect.top-gap-th;t.classList.add('arrow-bottom');var al=clamp(rect.left+rect.width/2-left-6,18,Math.max(18,tw-28));t.style.setProperty('--bi-tip-arrow-left',al+'px')}top=clamp(top,margin,vh-th-margin);t.style.setProperty('--bi-tip-arrow-top',arrowTop+'px');t.style.left=Math.round(left)+'px';t.style.top=Math.round(top)+'px'}
  var biTipAnchor=null, biTipHideTimer=null, biTipPositionTimer=null;
  function scheduleBiTipPosition(){
    clearTimeout(biTipPositionTimer);
    biTipPositionTimer=setTimeout(function(){
      try{
        var t=document.getElementById('biInsightTooltip');
        if(t && t.classList && t.classList.contains('show') && biTipAnchor){
          positionTip(t, biTipAnchor);
        }
      }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('inline-extracted/bi-kpi-chart.js scheduleBiTipPosition',e);}
    },60);
  }
  function biBuildTip(a){
    var title=a.getAttribute('data-bi-title')||(a.querySelector&&a.querySelector('span')?a.querySelector('span').textContent:a.textContent||'معلومة');
    var txt=a.getAttribute('data-bi-tip')||(a.querySelector&&a.querySelector('p')?a.querySelector('p').textContent:'هذا العنصر جزء من طبقة ذكاء الأعمال وهدفه تحويل الأرقام إلى قرار واضح.');
    return '<span class="bi-tip-title">'+block_4289_esc(String(title).trim())+'</span><span class="bi-tip-desc">'+block_4289_esc(String(txt).trim())+'</span><div class="bi-tip-mini"><div><small>المصدر</small><strong>Current Data</strong></div><div><small>الاستخدام</small><strong>Decision Support</strong></div></div>';
  }
  function biShowTip(a){clearTimeout(biTipHideTimer);biTipAnchor=a;var t=ensureTip();if(window.PETATOESafeRender&&window.PETATOESafeRender.setHTML){window.PETATOESafeRender.setHTML(t,biBuildTip(a));}else{t.textContent='';t.insertAdjacentHTML('beforeend',biBuildTip(a));}t.classList.add('show');requestAnimationFrame(function(){positionTip(t,a)})}
  function biHideTipSoon(){clearTimeout(biTipHideTimer);biTipHideTimer=setTimeout(function(){var t=document.getElementById('biInsightTooltip');if(t&&!t.matches(':hover'))t.classList.remove('show');biTipAnchor=null;},140)}
  document.addEventListener('mouseover',function(e){var a=e.target.closest&&e.target.closest('.bi-kpi,.bi-action,.bi-panel h3,.bi-data-row,.bi-tip-cell');if(!a)return;biShowTip(a)},true);
  document.addEventListener('mouseout',function(e){var a=e.target.closest&&e.target.closest('.bi-kpi,.bi-action,.bi-panel h3,.bi-data-row,.bi-tip-cell');if(a)biHideTipSoon()},true);
  document.addEventListener('mouseover',function(e){var t=e.target.closest&&e.target.closest('#biInsightTooltip');if(t)clearTimeout(biTipHideTimer)},true);
  document.addEventListener('mouseout',function(e){var t=e.target.closest&&e.target.closest('#biInsightTooltip');if(t)biHideTipSoon()},true);
  window.addEventListener('resize',scheduleBiTipPosition);
  window.addEventListener('scroll',scheduleBiTipPosition,true);
  setTimeout(function(){try{if(document.getElementById('smartReportsArea'))injectBusinessIntelligence()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/bi-kpi-chart.js",e);}},500);
})();