/* ============================================================
   PETATOE PDF REPORT ENGINE v1.0 — v6.6.17 Runtime Stabilization
   تقرير شامل للإدارة العليا — PDF تلقائي
   يشمل: KPIs + عملاء + خدمات + سيارات + تحذيرات + تحليلات
   ============================================================ */
(function(){
  function petatoeOpenPrintHtml(html, features){try{var blob=new Blob([String(html||'')],{type:'text/html;charset=utf-8'});var url=URL.createObjectURL(blob);var w=window.open(url,'_blank',features||'width=1200,height=850');if(w)setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('inline-extracted/print-engine.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('inline-extracted/print-engine.js',_petatoeSilentCatch);}}},60000);return w;}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('inline-extracted/print-engine.js',e);return null;}}


  /* ---- helpers ---- */
  function block_4655_esc(v){ return window.PETATOESecurity?PETATOESecurity.escapeHtml(v):String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]}) }
  function fmtN(n){ return (+n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) }
  function fmtI(n){ return (+n||0).toLocaleString('en-US') }
  function mn(n){ return fmtN(n)+' SAR' }
  function pct(v,t){ return t ? ((v/t)*100).toFixed(1)+'%' : '0%' }
  function sum(rows,f){ return (rows||[]).reduce(function(s,r){return s+(+r[f]||0)},0) }
  function uniqInv(rows){ return new Set((rows||[]).map(function(r){return r.invoice||''}).filter(Boolean)).size }
  function groupTop(rows,keyFn,n){
    var o={};
    (rows||[]).forEach(function(r){var k=typeof keyFn==='function'?keyFn(r):(r[keyFn]||'غير محدد'); o[k]=(o[k]||0)+(+r.totalInc||0);});
    return Object.entries(o).sort(function(a,b){return b[1]-a[1]}).slice(0,n||10);
  }
  function clientName(r){ return String(r.client||r.clientName||'غير محدد') }
  function serviceName(r){ return String(r.item||r.service||'غير محدد') }
  function vanName(r){ return String(r.van||'غير محدد') }
  function nowLabel(){
    return new Date().toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric',weekday:'long'});
  }

  /* ---- filter rows by period ---- */
  /* ---- get records safely from global var (loaded from IndexedDB) ---- */
  function getSafeRecords(){
    try{
      var rows=window.PETATOEDataSource.getRecordsSync();
      if(Array.isArray(rows)) return rows;
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/print-engine.js",e);}
    return [];
  }

  /* ---- PETATOE PDF PERIOD SELECTORS FIX v3.5.2 ----
     السنة = كل السنوات أو السنوات الموجودة فعلياً في البيانات.
     الشهر = كل الشهور أو الشهور المتاحة حسب السنة المختارة.
     اليوم = كل الأيام أو الأيام المتاحة حسب السنة/الشهر المختارين.
     الفلترة لا تعتمد على تاريخ الجهاز نهائياً. */
  var PDF_MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  var petatoePdfPeriodReady = false;

  function validPdfDate(r){
    var d = r && r.date ? new Date(r.date) : null;
    return d && !isNaN(d.getTime()) ? d : null;
  }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function optionHtml(value,label,selected){ return '<option value="'+block_4655_esc(value)+'" '+(selected?'selected':'')+'>'+block_4655_esc(label)+'</option>'; }
  function replaceSelectOptions(sel, options){
    if(!sel) return;
    while(sel.firstChild) sel.removeChild(sel.firstChild);
    (options||[]).forEach(function(opt){
      var o=document.createElement('option');
      o.value=String(opt&&opt.value!=null?opt.value:'');
      o.textContent=String(opt&&opt.label!=null?opt.label:o.value);
      if(opt&&opt.selected) o.selected=true;
      sel.appendChild(o);
    });
  }
  function periodOptions(defaultValue, defaultLabel, selected, values, labelFn){
    var out=[{value:defaultValue,label:defaultLabel,selected:selected===defaultValue}];
    (values||[]).forEach(function(v){
      var value=String(v);
      out.push({value:value,label:String(labelFn?labelFn(v):v),selected:String(selected)===value});
    });
    return out;
  }
  function pdfAvailableYears(rows){
    var set={};
    (rows||[]).forEach(function(r){ var d=validPdfDate(r); if(d) set[d.getFullYear()]=true; });
    return Object.keys(set).map(Number).sort(function(a,b){return b-a});
  }
  function pdfAvailableMonths(rows,yearVal){
    var set={};
    (rows||[]).forEach(function(r){
      var d=validPdfDate(r); if(!d) return;
      if(yearVal !== 'all' && d.getFullYear() !== Number(yearVal)) return;
      set[d.getMonth()+1]=true;
    });
    return Object.keys(set).map(Number).sort(function(a,b){return a-b});
  }
  function pdfAvailableDays(rows,yearVal,monthVal){
    var set={};
    (rows||[]).forEach(function(r){
      var d=validPdfDate(r); if(!d) return;
      if(yearVal !== 'all' && d.getFullYear() !== Number(yearVal)) return;
      if(monthVal !== 'all' && (d.getMonth()+1) !== Number(monthVal)) return;
      set[d.getDate()]=true;
    });
    return Object.keys(set).map(Number).sort(function(a,b){return a-b});
  }
  function pdfLatestDate(rows, yearVal, monthVal){
    var candidates=[];
    (rows||[]).forEach(function(r){
      var d=validPdfDate(r); if(!d) return;
      if(yearVal && yearVal !== 'all' && d.getFullYear() !== Number(yearVal)) return;
      if(monthVal && monthVal !== 'all' && (d.getMonth()+1) !== Number(monthVal)) return;
      candidates.push(d);
    });
    candidates.sort(function(a,b){return b.getTime()-a.getTime()});
    return candidates[0] || null;
  }
  function pdfDefaultPeriod(rows){
    var latest = pdfLatestDate(rows);
    if(!latest) return {year:'all',month:'all',day:'all'};
    return {year:String(latest.getFullYear()),month:String(latest.getMonth()+1),day:String(latest.getDate())};
  }
  function petatoeSetupPdfPeriodSelectors(force){
    var rows = getSafeRecords();
    var ySel = document.getElementById('pdf-year-sel');
    var mSel = document.getElementById('pdf-month-sel');
    var dSel = document.getElementById('pdf-day-sel');
    if(!ySel || !mSel || !dSel) return;

    var years = pdfAvailableYears(rows);
    var oldY = ySel.value || '';
    var oldM = mSel.value || 'all';
    var oldD = dSel.value || 'all';

    // PETATOE v6.6.14: default PDF filters must open on the latest invoice data period:
    // السنة = سنة آخر فاتورة، الشهر = شهر آخر فاتورة، اليوم = آخر يوم بيانات داخل الشهر.
    var defaults = pdfDefaultPeriod(rows);
    var selectedYear = (!petatoePdfPeriodReady || force) ? defaults.year : (oldY || defaults.year || 'all');
    if(selectedYear !== 'all' && years.indexOf(Number(selectedYear)) === -1) selectedYear = defaults.year || (years.length ? String(years[0]) : 'all');

    replaceSelectOptions(ySel, periodOptions('all','كل السنوات', selectedYear, years, function(y){return String(y)}));

    var months = pdfAvailableMonths(rows, selectedYear);
    var selectedMonth = (!petatoePdfPeriodReady || force) ? defaults.month : (oldM || defaults.month || 'all');
    if(selectedMonth !== 'all' && months.indexOf(Number(selectedMonth)) === -1){
      var latestForYear = pdfLatestDate(rows, selectedYear);
      selectedMonth = latestForYear ? String(latestForYear.getMonth()+1) : 'all';
    }
    replaceSelectOptions(mSel, periodOptions('all','كل الشهور', selectedMonth, months, function(m){return PDF_MONTHS_AR[m-1]}));

    var days = pdfAvailableDays(rows, selectedYear, selectedMonth);
    var selectedDay = (!petatoePdfPeriodReady || force) ? defaults.day : (oldD || defaults.day || 'all');
    if(selectedDay !== 'all' && days.indexOf(Number(selectedDay)) === -1){
      var latestForMonth = pdfLatestDate(rows, selectedYear, selectedMonth);
      selectedDay = latestForMonth ? String(latestForMonth.getDate()) : 'all';
    }
    replaceSelectOptions(dSel, periodOptions('all','كل الأيام', selectedDay, days, function(day){return pad2(day)}));

    petatoePdfPeriodReady = true;
  }
  window.petatoePdfPeriodChanged = function(level){
    var rows = getSafeRecords();
    var ySel = document.getElementById('pdf-year-sel');
    var mSel = document.getElementById('pdf-month-sel');
    var dSel = document.getElementById('pdf-day-sel');
    if(!ySel || !mSel || !dSel){ petatoeRefreshPdfReport(); return; }

    var yearVal = ySel.value || 'all';
    var monthVal = mSel.value || 'all';
    var daysVal = dSel.value || 'all';

    var months = pdfAvailableMonths(rows, yearVal);
    if(level === 'year'){
      var latestForYear = pdfLatestDate(rows, yearVal);
      monthVal = latestForYear ? String(latestForYear.getMonth()+1) : 'all';
    }
    if(monthVal !== 'all' && months.indexOf(Number(monthVal)) === -1) monthVal = 'all';
    replaceSelectOptions(mSel, periodOptions('all','كل الشهور', monthVal, months, function(m){return PDF_MONTHS_AR[m-1]}));

    var days = pdfAvailableDays(rows, yearVal, monthVal);
    if(level === 'year' || level === 'month'){
      var latestForMonth = pdfLatestDate(rows, yearVal, monthVal);
      daysVal = latestForMonth ? String(latestForMonth.getDate()) : 'all';
    }
    if(daysVal !== 'all' && days.indexOf(Number(daysVal)) === -1) daysVal = 'all';
    replaceSelectOptions(dSel, periodOptions('all','كل الأيام', daysVal, days, function(day){return pad2(day)}));

    petatoeRefreshPdfReport();
  };

  function filterByPeriod(rows){
    if(!rows || !Array.isArray(rows)) rows = getSafeRecords();
    var yVal = (document.getElementById('pdf-year-sel')||{}).value || 'all';
    var mVal = (document.getElementById('pdf-month-sel')||{}).value || 'all';
    var dVal = (document.getElementById('pdf-day-sel')||{}).value || 'all';
    return (rows||[]).filter(function(r){
      var d = validPdfDate(r); if(!d) return false;
      if(yVal !== 'all' && d.getFullYear() !== Number(yVal)) return false;
      if(mVal !== 'all' && (d.getMonth()+1) !== Number(mVal)) return false;
      if(dVal !== 'all' && d.getDate() !== Number(dVal)) return false;
      return true;
    });
  }

  function periodLabel(){
    var yVal = (document.getElementById('pdf-year-sel')||{}).value || 'all';
    var mVal = (document.getElementById('pdf-month-sel')||{}).value || 'all';
    var dVal = (document.getElementById('pdf-day-sel')||{}).value || 'all';
    var parts=[];
    parts.push(yVal==='all' ? 'كل السنوات' : 'سنة '+yVal);
    if(mVal !== 'all') parts.push('شهر '+PDF_MONTHS_AR[Number(mVal)-1]);
    else parts.push('كل الشهور');
    if(dVal !== 'all') parts.push('يوم '+pad2(dVal));
    else parts.push('كل الأيام');
    return parts.join(' / ');
  }

  function companyName(){ return ((document.getElementById('pdf-company-name')||{}).value||'PETATOE').trim() || 'PETATOE' }

  /* ---- build alerts ---- */
  function buildAlerts(rows){
    var alerts=[];
    var total=sum(rows,'totalInc');
    var inv=uniqInv(rows);
    var avg=inv?total/inv:0;
    var clients=new Set(rows.map(clientName));
    var allRows=getSafeRecords();

    // تحذير: عملاء غير نشطين
    var thirtyDaysAgo=new Date(Date.now()-30*24*3600*1000);
    var activeClients=new Set(rows.map(clientName));
    var allClients=new Set(allRows.map(clientName));
    var inactiveCount=0;
    allClients.forEach(function(c){ if(!activeClients.has(c)) inactiveCount++; });
    if(inactiveCount>0) alerts.push({level:'high',text:'⚠️ '+inactiveCount+' عميل لم يظهر في الفترة الحالية — يحتاج متابعة استرجاع'});

    // تحذير: إجمالي صفر أو ضعيف
    if(total===0) alerts.push({level:'high',text:'🚨 لا توجد مبيعات مسجلة في هذه الفترة'});
    else if(inv<5) alerts.push({level:'med',text:'📋 عدد الفواتير منخفض جداً ('+fmtI(inv)+' فاتورة) — تحقق من اكتمال البيانات'});

    // فرصة: أعلى عميل
    var topC=groupTop(rows,clientName,1);
    if(topC.length && total>0){
      var share=(topC[0][1]/total*100).toFixed(1);
      if(+share>40) alerts.push({level:'med',text:'📌 العميل "'+topC[0][0]+'" يمثل '+share+'% من المبيعات — تركّز عالٍ يستوجب التنويع'});
    }

    // فرصة: خدمة هابطة
    var topS=groupTop(rows,serviceName,1);
    if(topS.length===0) alerts.push({level:'low',text:'✅ لا توجد بيانات خدمات كافية في الفترة المحددة'});

    // نمو
    if(alerts.length===0) alerts.push({level:'low',text:'✅ الأداء مستقر في الفترة الحالية — لا توجد تنبيهات حرجة'});

    return alerts;
  }

  /* ---- progress bar ---- */
  function barRow(label,val,max){
    var pctVal = max>0 ? Math.min(100,(val/max*100)) : 0;
    return '<div class="pdf-bar-row">'
      +'<span class="pdf-bar-label">'+block_4655_esc(String(label).slice(0,20))+'</span>'
      +'<div class="pdf-bar-track"><div class="pdf-bar-fill" style="width:'+pctVal.toFixed(1)+'%"></div></div>'
      +'<span class="pdf-bar-val">'+mn(val)+'</span>'
      +'</div>';
  }

  /* ---- health score ---- */
  function healthScore(rows,alerts){
    var score=100;
    alerts.forEach(function(a){ if(a.level==='high') score-=20; else if(a.level==='med') score-=8; });
    var inv=uniqInv(rows);
    if(inv<3) score-=15;
    return Math.max(0,Math.min(100,score));
  }

  /* ---- SVG half-ring ---- */
  function svgRing(score,color){
    color=color||'#7c3aed';
    var r=54, cx=65, cy=65;
    var circ=Math.PI*r;
    var dash=circ*(score/100);
    return '<svg width="130" height="80" viewBox="0 0 130 80" style="overflow:visible">'
      +'<path d="M 11 65 A 54 54 0 0 1 119 65" fill="none" stroke="#e2e8f0" stroke-width="10" stroke-linecap="round"/>'
      +'<path d="M 11 65 A 54 54 0 0 1 119 65" fill="none" stroke="'+color+'" stroke-width="10" stroke-linecap="round"'
      +' stroke-dasharray="'+dash.toFixed(1)+' '+circ.toFixed(1)+'"'
      +' style="transform-origin:65px 65px;transform:rotate(-180deg)"'
      +'/>'
      +'<text x="65" y="60" text-anchor="middle" font-size="20" font-weight="900" fill="#1e1b4b" font-family="Cairo,sans-serif">'+score+'%</text>'
      +'<text x="65" y="75" text-anchor="middle" font-size="10" fill="#6d28d9" font-family="Cairo,sans-serif" font-weight="800">Health Score</text>'
      +'</svg>';
  }



  /* ---- DAILY EXECUTIVE PDF SUMMARY v3.6.1 ----
     مكان التنفيذ: زر تقرير PDF الأحمر أعلى الداشبورد.
     يضيف: ملخص اليوم + تفاصيل فواتير اليوم + تراكمي اليوم + شهر حتى اليوم. */
  function pdfDateKey(d){ return d ? (d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())) : ''; }
  function pdfSameDate(d,key){ return d && pdfDateKey(d) === key; }
  function pdfMonthKeyFromDate(d){ return d ? (d.getFullYear()+'-'+pad2(d.getMonth()+1)) : ''; }
  function pdfPayName(r){ return String((r&&r.pay)||'غير محدد').trim() || 'غير محدد'; }
  function pdfFirstNonEmpty(r,keys){
    for(var i=0;i<keys.length;i++){ var v=r&&r[keys[i]]; if(v!=null && String(v).trim()!=='') return String(v).trim(); }
    return '';
  }
  function pdfSelectedReportDate(rows){
    var yVal = (document.getElementById('pdf-year-sel')||{}).value || 'all';
    var mVal = (document.getElementById('pdf-month-sel')||{}).value || 'all';
    var dVal = (document.getElementById('pdf-day-sel')||{}).value || 'all';
    var candidates = (rows||[]).map(validPdfDate).filter(Boolean);
    if(!candidates.length) return null;
    if(yVal !== 'all' && mVal !== 'all' && dVal !== 'all'){
      var exact = new Date(Number(yVal), Number(mVal)-1, Number(dVal));
      if(!isNaN(exact.getTime())) return exact;
    }
    candidates.sort(function(a,b){return b.getTime()-a.getTime()});
    return candidates[0];
  }
  function pdfRowsForDay(allRows,selectedDate){
    var key = pdfDateKey(selectedDate);
    return (allRows||[]).filter(function(r){ return pdfSameDate(validPdfDate(r),key); });
  }
  function pdfRowsMonthToDate(allRows,selectedDate){
    if(!selectedDate) return [];
    var y=selectedDate.getFullYear(), m=selectedDate.getMonth(), end=new Date(y,m,selectedDate.getDate(),23,59,59,999);
    var start=new Date(y,m,1,0,0,0,0);
    return (allRows||[]).filter(function(r){ var d=validPdfDate(r); return d && d>=start && d<=end; });
  }
  function pdfGroupVanPay(rows){
    var vans={}, pays={};
    (rows||[]).forEach(function(r){ var v=vanName(r), p=pdfPayName(r); vans[v]=vans[v]||{van:v,total:0,invoices:{},pays:{}}; vans[v].total+=(+r.totalInc||0); vans[v].pays[p]=(vans[v].pays[p]||0)+(+r.totalInc||0); if(r.invoice) vans[v].invoices[String(r.invoice)]=1; pays[p]=1; });
    var payList=Object.keys(pays).sort(function(a,b){ return a.localeCompare(b,'ar'); });
    var rowsOut=Object.keys(vans).sort(function(a,b){ return vans[b].total-vans[a].total; }).map(function(k){ var x=vans[k]; x.invoiceCount=Object.keys(x.invoices).length; return x; });
    return {pays:payList,rows:rowsOut};
  }
  function pdfInvoiceRows(rows){
    var map={};
    (rows||[]).forEach(function(r,idx){
      var inv=String(r.invoice||('NO-'+idx)).trim();
      var key=inv+'||'+vanName(r)+'||'+pdfPayName(r)+'||'+clientName(r);
      if(!map[key]) map[key]={invoice:inv,client:clientName(r),van:vanName(r),pay:pdfPayName(r),total:0,items:{},pet:'',employee:'',time:''};
      map[key].total+=(+r.totalInc||0);
      var srv=serviceName(r); if(srv) map[key].items[srv]=1;
      if(!map[key].pet) map[key].pet=pdfFirstNonEmpty(r,['pet','petName','animal','animalName','pet_type','petType','الحيوان','اسم الحيوان']);
      if(!map[key].employee) map[key].employee=pdfFirstNonEmpty(r,['employee','staff','groomer','driver','salesman','user','الموظف','المنفذ']);
      if(!map[key].time) map[key].time=pdfFirstNonEmpty(r,['time','invoiceTime','createdAt','created_at','الوقت']);
    });
    return Object.keys(map).map(function(k){ var x=map[k]; x.service=Object.keys(x.items).join('، '); return x; }).sort(function(a,b){ return String(a.invoice).localeCompare(String(b.invoice),'ar',{numeric:true}); });
  }
  function pdfVanPayTable(title,sub,rows){
    var g=pdfGroupVanPay(rows), pays=g.pays, total=sum(rows,'totalInc'), totalInv=uniqInv(rows);
    var html='<div class="pdf-section-title">'+block_4655_esc(title)+'</div>';
    if(sub) html+='<div style="font-size:11px;font-weight:900;color:#64748b;margin:-4px 0 10px;text-align:center">'+block_4655_esc(sub)+'</div>';
    html+='<table class="pdf-table pdf-daily-table"><thead><tr><th>السيارة 🚐</th>';
    pays.forEach(function(p){ html+='<th>'+block_4655_esc(p)+'</th>'; });
    html+='<th>الإجمالي</th><th>عدد الفواتير</th></tr></thead><tbody>';
    g.rows.forEach(function(v){
      html+='<tr><td><b>'+block_4655_esc(v.van)+'</b></td>';
      pays.forEach(function(p){ html+='<td class="pdf-num">'+fmtN(v.pays[p]||0)+'</td>'; });
      html+='<td class="pdf-num"><b>'+fmtN(v.total)+'</b></td><td>'+fmtI(v.invoiceCount)+'</td></tr>';
    });
    if(!g.rows.length) html+='<tr><td colspan="'+(pays.length+3)+'" style="text-align:center;color:#94a3b8">لا توجد بيانات</td></tr>';
    html+='</tbody><tfoot><tr><td><b>الإجمالي</b></td>';
    pays.forEach(function(p){ var v=(rows||[]).filter(function(r){return pdfPayName(r)===p}).reduce(function(s,r){return s+(+r.totalInc||0)},0); html+='<td class="pdf-num"><b>'+fmtN(v)+'</b></td>'; });
    html+='<td class="pdf-num"><b>'+fmtN(total)+'</b></td><td><b>'+fmtI(totalInv)+'</b></td></tr></tfoot></table>';
    return html;
  }
  function pdfDailyKpis(dayRows,dayInvoices){
    var total=sum(dayRows,'totalInc'), inv=uniqInv(dayRows), avg=inv?total/inv:0;
    var pay=groupTop(dayRows,function(r){return pdfPayName(r)},1);
    var van=groupTop(dayRows,vanName,1);
    return '<div class="pdf-kpi-grid pdf-daily-kpis">'
      +'<div class="pdf-kpi" style="--kc:#7c3aed"><div class="pk-label">إجمالي مبيعات اليوم</div><div class="pk-val">'+mn(total)+'</div><div class="pk-sub">حسب اليوم المحدد</div></div>'
      +'<div class="pdf-kpi" style="--kc:#16a34a"><div class="pk-label">عدد فواتير اليوم</div><div class="pk-val">'+fmtI(inv)+'</div><div class="pk-sub">فاتورة فريدة</div></div>'
      +'<div class="pdf-kpi" style="--kc:#2563eb"><div class="pk-label">متوسط الفاتورة</div><div class="pk-val">'+mn(avg)+'</div><div class="pk-sub">إجمالي / عدد الفواتير</div></div>'
      +'<div class="pdf-kpi" style="--kc:#f97316"><div class="pk-label">أعلى سيارة بيعاً</div><div class="pk-val">'+block_4655_esc(van.length?van[0][0]:'-')+'</div><div class="pk-sub">'+(van.length?mn(van[0][1]):'-')+'</div></div>'
      +'<div class="pdf-kpi" style="--kc:#0891b2"><div class="pk-label">أعلى طريقة دفع</div><div class="pk-val">'+block_4655_esc(pay.length?pay[0][0]:'-')+'</div><div class="pk-sub">'+(pay.length?mn(pay[0][1]):'-')+'</div></div>'
      +'<div class="pdf-kpi" style="--kc:#9333ea"><div class="pk-label">الخدمات بالفواتير</div><div class="pk-val">'+fmtI(new Set(dayRows.map(serviceName)).size)+'</div><div class="pk-sub">خدمة/صنف</div></div>'
      +'</div>';
  }
  function pdfPayClass(p){
    p=String(p||'');
    if(/كاش|cash/i.test(p)) return 'pdf-approved-pay-cash';
    if(/شبكة|مدى|فيزا|visa|card|network/i.test(p)) return 'pdf-approved-pay-net';
    if(/تحويل|transfer|bank/i.test(p)) return 'pdf-approved-pay-transfer';
    if(/آجل|اجل|credit/i.test(p)) return 'pdf-approved-pay-credit';
    return '';
  }
  function pdfPayIcon(p){
    p=String(p||'');
    if(/كاش|cash/i.test(p)) return '💵';
    if(/شبكة|مدى|فيزا|visa|card|network/i.test(p)) return '💳';
    if(/تحويل|transfer|bank/i.test(p)) return '🏦';
    if(/آجل|اجل|credit/i.test(p)) return '🕘';
    return '💰';
  }
  function pdfNormalizePayLabel(p){
    var x=String(p||'غير محدد').trim();
    if(/كاش|cash/i.test(x)) return 'كاش';
    if(/شبكة|مدى|فيزا|visa|card|network/i.test(x)) return 'شبكة';
    if(/تحويل|transfer|bank/i.test(x)) return 'تحويل';
    if(/آجل|اجل|credit/i.test(x)) return 'آجل';
    return x || 'غير محدد';
  }
  function pdfOrderedPays(rows){
    var found={};
    (rows||[]).forEach(function(r){ found[pdfNormalizePayLabel(pdfPayName(r))]=1; });
    var base=['كاش','شبكة','تحويل','آجل'];
    var out=base.filter(function(p){return found[p];});
    Object.keys(found).sort(function(a,b){return a.localeCompare(b,'ar')}).forEach(function(p){ if(out.indexOf(p)===-1) out.push(p); });
    return out.length?out:base;
  }
  function pdfHeaderApproved(title,dayLabel,pageNo){
    return '<div class="pdf-approved-head">'
      +'<div class="pdf-approved-brand"><div class="pdf-approved-logo">🐾</div><div><h2>PETATOE</h2><small>Analytics System</small></div></div>'
      +'<div class="pdf-approved-title"><h3>'+block_4655_esc(title)+'</h3></div>'
      +'<div class="pdf-approved-date">التاريخ<br>'+block_4655_esc(dayLabel)+'</div>'
      +'</div>';
  }
  function pdfFooterApproved(pageNo){
    return '<div class="pdf-approved-footer"><span>الصفحة '+pageNo+' من 5</span><span>تقرير ملخص اليوم</span><span>PETATOE Analytics System</span></div>';
  }
  function pdfApprovedMoney(n){ return fmtN(n||0); }
  function pdfApprovedSar(n){ return fmtN(n||0)+'<br><small>SAR</small>'; }
  function pdfGroupVanPayApproved(rows){
    var pays=pdfOrderedPays(rows), vans={};
    (rows||[]).forEach(function(r){
      var v=vanName(r), p=pdfNormalizePayLabel(pdfPayName(r));
      vans[v]=vans[v]||{van:v,total:0,invoices:{},pays:{}};
      vans[v].total+=(+r.totalInc||0);
      vans[v].pays[p]=(vans[v].pays[p]||0)+(+r.totalInc||0);
      if(r.invoice) vans[v].invoices[String(r.invoice)]=1;
    });
    var data=Object.keys(vans).sort(function(a,b){return vans[b].total-vans[a].total;}).map(function(k){ var x=vans[k]; x.invoiceCount=Object.keys(x.invoices).length; return x; });
    return {pays:pays,rows:data};
  }
  function pdfApprovedSummaryTable(rows, opts){
    opts=opts||{};
    var g=pdfGroupVanPayApproved(rows), pays=g.pays, total=sum(rows,'totalInc'), inv=uniqInv(rows);
    var html='<table class="pdf-approved-table"><thead><tr><th style="width:18%">السيارة</th>';
    pays.forEach(function(p){ html+='<th>'+block_4655_esc(p)+'<br>'+pdfPayIcon(p)+'</th>'; });
    html+='<th>إجمالي</th><th>عدد الفواتير</th></tr></thead><tbody>';
    if(g.rows.length){
      g.rows.forEach(function(v){
        html+='<tr><td class="pdf-approved-car">'+block_4655_esc(v.van)+' 🚐</td>';
        pays.forEach(function(p){ html+='<td class="pdf-approved-num '+pdfPayClass(p)+'">'+pdfApprovedMoney(v.pays[p]||0)+'</td>'; });
        html+='<td class="pdf-approved-num"><b>'+pdfApprovedMoney(v.total)+'</b></td><td><b>'+fmtI(v.invoiceCount)+'</b></td></tr>';
      });
    }else{
      html+='<tr><td colspan="'+(pays.length+3)+'" class="pdf-approved-no-data">لا توجد بيانات في هذا اليوم</td></tr>';
    }
    html+='</tbody><tfoot><tr><td><b>الإجمالي</b></td>';
    pays.forEach(function(p){ var v=(rows||[]).filter(function(r){return pdfNormalizePayLabel(pdfPayName(r))===p}).reduce(function(s,r){return s+(+r.totalInc||0)},0); html+='<td class="pdf-approved-num"><b>'+pdfApprovedMoney(v)+'</b></td>'; });
    html+='<td class="pdf-approved-num"><b>'+pdfApprovedMoney(total)+'</b></td><td><b>'+fmtI(inv)+'</b></td></tr></tfoot></table>';
    return html;
  }
  function pdfApprovedKpiStrip(rows){
    var total=sum(rows,'totalInc'), inv=uniqInv(rows), payTop=groupTop(rows,function(r){return pdfNormalizePayLabel(pdfPayName(r))},1);
    var pays=pdfOrderedPays(rows);
    var cash=(rows||[]).filter(function(r){return pdfNormalizePayLabel(pdfPayName(r))==='كاش'}).reduce(function(s,r){return s+(+r.totalInc||0)},0);
    var net=(rows||[]).filter(function(r){return pdfNormalizePayLabel(pdfPayName(r))==='شبكة'}).reduce(function(s,r){return s+(+r.totalInc||0)},0);
    var transfer=(rows||[]).filter(function(r){return pdfNormalizePayLabel(pdfPayName(r))==='تحويل'}).reduce(function(s,r){return s+(+r.totalInc||0)},0);
    var credit=(rows||[]).filter(function(r){return pdfNormalizePayLabel(pdfPayName(r))==='آجل'}).reduce(function(s,r){return s+(+r.totalInc||0)},0);
    return '<div class="pdf-approved-kpis">'
      +'<div class="pdf-approved-kpi"><span class="ico">📋</span><div class="lbl">إجمالي الفواتير</div><div class="val">'+fmtI(inv)+'</div><div class="sub">فاتورة</div></div>'
      +'<div class="pdf-approved-kpi"><span class="ico">📊</span><div class="lbl">إجمالي اليوم</div><div class="val">'+fmtN(total)+'</div><div class="sub">SAR</div></div>'
      +'<div class="pdf-approved-kpi"><span class="ico">🕘</span><div class="lbl">إجمالي الآجل</div><div class="val">'+fmtN(credit)+'</div><div class="sub">SAR</div></div>'
      +'<div class="pdf-approved-kpi"><span class="ico">🏦</span><div class="lbl">إجمالي التحويل</div><div class="val">'+fmtN(transfer)+'</div><div class="sub">SAR</div></div>'
      +'<div class="pdf-approved-kpi"><span class="ico">💳</span><div class="lbl">إجمالي الشبكة</div><div class="val">'+fmtN(net)+'</div><div class="sub">SAR</div></div>'
      +'<div class="pdf-approved-kpi"><span class="ico">💵</span><div class="lbl">إجمالي الكاش</div><div class="val">'+fmtN(cash)+'</div><div class="sub">SAR</div></div>'
      +'</div>';
  }
  function pdfApprovedInvoicePage(invRows, dayRows, dayLabel){
    var html='<div class="pdf-approved-page">'+pdfHeaderApproved('تفاصيل فواتير اليوم',dayLabel,2)+'<div class="pdf-approved-chip">جميع فواتير اليوم مع طريقة الدفع والقيمة</div>';
    html+='<table class="pdf-approved-table" style="font-size:9.6px"><thead><tr><th style="width:4%">#</th><th style="width:10%">رقم الفاتورة</th><th style="width:7%">الوقت</th><th style="width:12%">العميل</th><th style="width:12%">السيارة</th><th style="width:9%">طريقة الدفع</th><th style="width:16%">الخدمة</th><th style="width:9%">الحيوان</th><th style="width:10%">الموظف</th><th style="width:11%">القيمة (SAR)</th></tr></thead><tbody>';
    var maxRows=22;
    invRows.slice(0,maxRows).forEach(function(x,i){
      html+='<tr><td>'+(i+1)+'</td><td>'+block_4655_esc(x.invoice)+'</td><td>'+block_4655_esc(x.time||'-')+'</td><td>'+block_4655_esc(x.client)+'</td><td>'+block_4655_esc(x.van)+'</td><td class="'+pdfPayClass(x.pay)+'">'+block_4655_esc(x.pay)+' '+pdfPayIcon(x.pay)+'</td><td>'+block_4655_esc(x.service||'-')+'</td><td>'+block_4655_esc(x.pet||'-')+'</td><td>'+block_4655_esc(x.employee||'-')+'</td><td class="pdf-approved-num">'+fmtN(x.total)+'</td></tr>';
    });
    if(invRows.length>maxRows){ html+='<tr><td colspan="10" style="font-weight:900;color:#64748b">تم عرض أول '+maxRows+' فاتورة من إجمالي '+fmtI(invRows.length)+' فاتورة داخل الصفحة للحفاظ على التنسيق.</td></tr>'; }
    if(!invRows.length) html+='<tr><td colspan="10" class="pdf-approved-no-data">لا توجد فواتير في هذا اليوم</td></tr>';
    html+='</tbody><tfoot><tr><td colspan="9"><b>الإجمالي</b></td><td class="pdf-approved-num"><b>'+fmtN(sum(dayRows,'totalInc'))+'</b></td></tr></tfoot></table>'+pdfFooterApproved(2)+'</div>';
    return html;
  }
  function pdfApprovedDayCumulativePage(dayRows, dayLabel){
    var g=pdfGroupVanPayApproved(dayRows), pays=g.pays;
    var html='<div class="pdf-approved-page">'+pdfHeaderApproved('ملخص تراكمي اليوم حسب السيارة',dayLabel,3)+'<div class="pdf-approved-chip">إجمالي مبيعات اليوم لكل سيارة حسب طريقة الدفع</div>';
    if(g.rows.length){
      g.rows.slice(0,7).forEach(function(v){
        html+='<div class="pdf-approved-car-block"><div class="pdf-approved-car-title">'+block_4655_esc(v.van)+' 🚐</div><table class="pdf-approved-table" style="font-size:10px;margin-bottom:6px"><thead><tr>';
        pays.forEach(function(p){html+='<th>'+block_4655_esc(p)+'</th>';});
        html+='<th>إجمالي</th><th>إجمالي الفواتير</th></tr></thead><tbody><tr>';
        pays.forEach(function(p){html+='<td class="pdf-approved-num '+pdfPayClass(p)+'">'+fmtN(v.pays[p]||0)+'</td>';});
        html+='<td class="pdf-approved-num"><b>'+fmtN(v.total)+'</b></td><td><b>'+fmtI(v.invoiceCount)+'</b></td></tr></tbody></table></div>';
      });
    }else html+='<div class="pdf-approved-no-data">لا توجد بيانات في هذا اليوم</div>';
    html+=pdfFooterApproved(3)+'</div>';
    return html;
  }
  function pdfApprovedMtdPage(mtdRows, selected, dayLabel){
    var mtdLabel='تراكمي من 01 - '+pad2(selected.getMonth()+1)+' - '+selected.getFullYear()+' إلى '+dayLabel;
    var html='<div class="pdf-approved-page">'+pdfHeaderApproved('مبيعات من بداية الشهر حتى التاريخ المحدد',dayLabel,4)+'<div class="pdf-approved-mtd-chip">'+block_4655_esc(mtdLabel)+'</div>'+pdfApprovedSummaryTable(mtdRows)+pdfFooterApproved(4)+'</div>';
    return html;
  }
  function pdfApprovedLegendRows(list,total,colors){
    return list.map(function(x,i){ var pc=total?((x[1]/total)*100):0; return '<div class="pdf-approved-legend-row"><span class="pdf-approved-dot" style="background:'+colors[i%colors.length]+'"></span><span>'+block_4655_esc(x[0])+' ('+pc.toFixed(1)+'%)</span><span>'+fmtN(x[1])+' SAR</span></div>'; }).join('');
  }
  function pdfApprovedExecPage(dayRows, dayLabel){
    var total=sum(dayRows,'totalInc'), inv=uniqInv(dayRows), avg=inv?total/inv:0;
    var topVan=groupTop(dayRows,vanName,1)[0]||['-',0];
    var payTop=groupTop(dayRows,function(r){return pdfNormalizePayLabel(pdfPayName(r))},10);
    var vanTop=groupTop(dayRows,vanName,10);
    var topPay=payTop[0]||['-',0], lowPay=payTop.length?payTop[payTop.length-1]:['-',0];
    var mostInv='-', leastInv='-', vc={};
    dayRows.forEach(function(r){var v=vanName(r); vc[v]=vc[v]||{}; if(r.invoice) vc[v][String(r.invoice)]=1;});
    var invByVan=Object.keys(vc).map(function(v){return [v,Object.keys(vc[v]).length];}).sort(function(a,b){return b[1]-a[1];});
    if(invByVan.length){ mostInv=invByVan[0][0]+'<br><small>'+fmtI(invByVan[0][1])+' فاتورة</small>'; leastInv=invByVan[invByVan.length-1][0]+'<br><small>'+fmtI(invByVan[invByVan.length-1][1])+' فواتير</small>'; }
    var colors=['#6d4ab1','#22c55e','#22a7d8','#f59e0b','#ef4444','#3b82f6'];
    var a=payTop[0]&&total?(payTop[0][1]/total*100):40, b=(payTop[1]&&total?payTop[1][1]/total*100:35)+a, c=(payTop[2]&&total?payTop[2][1]/total*100:15)+b;
    var va=vanTop[0]&&total?(vanTop[0][1]/total*100):30, vb=(vanTop[1]&&total?vanTop[1][1]/total*100:24)+va, vcg=(vanTop[2]&&total?vanTop[2][1]/total*100:20)+vb;
    var html='<div class="pdf-approved-page">'+pdfHeaderApproved('الملخص التنفيذي',dayLabel,5);
    html+='<div class="pdf-approved-exec-grid">'
      +'<div class="pdf-approved-exec-card purple"><div class="lbl">إجمالي المبيعات اليوم</div><div class="val">'+fmtN(total)+'</div><div class="sub">SAR</div><div class="bigico">📊</div></div>'
      +'<div class="pdf-approved-exec-card green"><div class="lbl">عدد الفواتير</div><div class="val">'+fmtI(inv)+'</div><div class="sub">فاتورة</div><div class="bigico">📋</div></div>'
      +'<div class="pdf-approved-exec-card blue"><div class="lbl">متوسط الفاتورة</div><div class="val">'+fmtN(avg)+'</div><div class="sub">SAR</div><div class="bigico">👛</div></div>'
      +'<div class="pdf-approved-exec-card orange"><div class="lbl">أعلى سيارة بيعاً</div><div class="val" style="font-size:16px">'+block_4655_esc(topVan[0])+'</div><div class="sub">'+fmtN(topVan[1])+' SAR</div><div class="bigico">🏆</div></div>'
      +'</div>';
    html+='<div class="pdf-approved-charts"><div class="pdf-approved-chart-card"><h4>توزيع المبيعات حسب طريقة الدفع (اليوم)</h4><div class="pdf-approved-ring-wrap"><div class="pdf-approved-ring" style="--a:'+a+'%;--b:'+b+'%;--c:'+c+'%"></div><div class="pdf-approved-legend">'+(payTop.length?pdfApprovedLegendRows(payTop,total,colors):'<div class="pdf-approved-no-data">لا توجد بيانات</div>')+'</div></div></div>';
    html+='<div class="pdf-approved-chart-card"><h4>نسبة مساهمة كل سيارة (اليوم)</h4><div class="pdf-approved-ring-wrap"><div class="pdf-approved-ring" style="--a:'+va+'%;--b:'+vb+'%;--c:'+vcg+'%"></div><div class="pdf-approved-legend">'+(vanTop.length?pdfApprovedLegendRows(vanTop,total,colors):'<div class="pdf-approved-no-data">لا توجد بيانات</div>')+'</div></div></div></div>';
    html+='<div class="pdf-approved-indicators"><h4>أهم المؤشرات</h4><div class="pdf-approved-ind-grid">'
      +'<div class="pdf-approved-ind"><div class="ico">💳</div><div><b>أعلى طريقة دفع</b><span>'+block_4655_esc(topPay[0])+'<br>'+fmtN(topPay[1])+' SAR ('+(total?(topPay[1]/total*100).toFixed(1):0)+'%)</span></div></div>'
      +'<div class="pdf-approved-ind"><div class="ico">🚐</div><div><b>أكثر الفواتير</b><span>'+mostInv+'</span></div></div>'
      +'<div class="pdf-approved-ind"><div class="ico">🏦</div><div><b>أقل طريقة دفع</b><span>'+block_4655_esc(lowPay[0])+'<br>'+fmtN(lowPay[1])+' SAR ('+(total?(lowPay[1]/total*100).toFixed(1):0)+'%)</span></div></div>'
      +'<div class="pdf-approved-ind"><div class="ico">🚙</div><div><b>أقل الفواتير</b><span>'+leastInv+'</span></div></div>'
      +'</div></div>'+pdfFooterApproved(5)+'</div>';
    return html;
  }
  function buildDailyExecutivePdfSection(allRows,periodRows,company){
    var selected=pdfSelectedReportDate(periodRows && periodRows.length ? periodRows : allRows);
    if(!selected) return '';
    var dayLabel=pad2(selected.getDate())+' - '+pad2(selected.getMonth()+1)+' - '+selected.getFullYear();
    var dayRows=pdfRowsForDay(allRows,selected), mtdRows=pdfRowsMonthToDate(allRows,selected), invRows=pdfInvoiceRows(dayRows);
    var html='<div class="pdf-approved-pack">';
    html+='<div class="pdf-approved-page">'+pdfHeaderApproved('ملخص اليوم',dayLabel,1)+'<div class="pdf-approved-chip">ملخص مبيعات اليوم حسب السيارة وطريقة الدفع</div>'+pdfApprovedSummaryTable(dayRows)+pdfApprovedKpiStrip(dayRows)+pdfFooterApproved(1)+'</div>';
    html+=pdfApprovedInvoicePage(invRows,dayRows,dayLabel);
    html+=pdfApprovedDayCumulativePage(dayRows,dayLabel);
    html+=pdfApprovedMtdPage(mtdRows,selected,dayLabel);
    html+=pdfApprovedExecPage(dayRows,dayLabel);
    html+='</div>';
    return html;
  }

  /* ---- MAIN REPORT BUILDER ---- */
  function buildReport(){
    var allRec = getSafeRecords(); var rows = filterByPeriod(allRec);
    var period = periodLabel();
    var company = companyName();

    // Show friendly message if no data at all
    if(allRec.length === 0){
      return '<div style="text-align:center;padding:50px 20px;font-family:Cairo,sans-serif">'
        +'<div style="font-size:48px;margin-bottom:16px">📂</div>'
        +'<div style="font-size:16px;font-weight:900;color:#1e1b4b;margin-bottom:8px">لا توجد بيانات بعد</div>'
        +'<div style="font-size:13px;font-weight:800;color:#64748b;line-height:1.8">'
        +'قم برفع ملف Excel أو إدخال بيانات أولاً، ثم افتح التقرير مرة أخرى.'
        +'</div></div>';
    }
    // No data in selected period - show all-data fallback message
    if(rows.length === 0){
      return '<div style="text-align:center;padding:40px 20px;font-family:Cairo,sans-serif">'
        +'<div style="font-size:40px;margin-bottom:14px">📅</div>'
        +'<div style="font-size:15px;font-weight:900;color:#1e1b4b;margin-bottom:8px">لا توجد بيانات للفترة المحددة</div>'
        +'<div style="font-size:12px;font-weight:800;color:#64748b;line-height:1.8">'
        +'إجمالي السجلات المتاحة: <b>'+allRec.length+'</b> سجل<br>'
        +'جرب تغيير الفترة إلى <b>آخر سنة متاحة</b> أو <b>كل الفترات</b>'
        +'</div></div>';
    }

    var total=sum(rows,'totalInc');
    var totalEx=sum(rows,'totalEx');
    var tax=sum(rows,'tax');
    var inv=uniqInv(rows);
    var avg=inv?total/inv:0;
    var clientSet=new Set(rows.map(clientName));
    var clients=clientSet.size;
    var repeatClients=0;
    var cc={};
    rows.forEach(function(r){ var c=clientName(r); cc[c]=(cc[c]||0)+1; });
    Object.values(cc).forEach(function(v){ if(v>1) repeatClients++; });
    var retention=clients?((repeatClients/clients)*100).toFixed(1):0;

    var topClients=groupTop(rows,clientName,10);
    var topServices=groupTop(rows,serviceName,10);
    var topVans=groupTop(rows,vanName,8);
    var alerts=buildAlerts(rows);
    var score=healthScore(rows,alerts);

    // pay breakdown
    var payMap={};
    rows.forEach(function(r){ var k=r.pay||'غير محدد'; payMap[k]=(payMap[k]||0)+(+r.totalInc||0); });
    var payRows=Object.entries(payMap).sort(function(a,b){return b[1]-a[1]}).slice(0,5);

    /* ---- HTML ---- */
    var html = '';

    // APPROVED DAILY PDF PAGES - inserted before the old report, old report remains unchanged
    html += buildDailyExecutivePdfSection(allRec, rows, company);

    // HEADER
    html += '<div class="pdf-header">'
      +'<div class="pdf-logo-block">'
      +'<div class="pdf-logo-icon">🐾</div>'
      +'<div class="pdf-logo-text"><h1>'+block_4655_esc(company)+'</h1><p>Analytics System — تقرير الإدارة العليا</p></div>'
      +'</div>'
      +'<div class="pdf-meta">التاريخ: '+nowLabel()+'<br>الفترة: '+block_4655_esc(period)+'<br>إعداد: PETATOE v3.0</div>'
      +'</div>';

    // REPORT TITLE
    html += '<div class="pdf-report-title">'
      +'<h2>📊 تقرير الأداء التنفيذي الشامل</h2>'
      +'<span>الفترة: '+block_4655_esc(period)+'</span>'
      +'</div>';


    // HIGHLIGHT SUMMARY
    html += '<div class="pdf-highlight">'
      +'<div class="pdf-hl-item"><div class="hl-val">'+mn(total)+'</div><div class="hl-lbl">إجمالي المبيعات</div></div>'
      +'<div class="pdf-hl-item"><div class="hl-val">'+fmtI(inv)+'</div><div class="hl-lbl">عدد الفواتير</div></div>'
      +'<div class="pdf-hl-item"><div class="hl-val">'+fmtI(clients)+'</div><div class="hl-lbl">العملاء النشطين</div></div>'
      +'</div>';

    // KPIs
    html += '<div class="pdf-section-title">📌 مؤشرات الأداء الرئيسية (KPIs)</div>';
    html += '<div class="pdf-kpi-grid">';
    var kpis=[
      {lbl:'إجمالي المبيعات',val:mn(total),sub:'شامل الضريبة',c:'#7c3aed'},
      {lbl:'قبل الضريبة',val:mn(totalEx),sub:'صافي المبيعات',c:'#0891b2'},
      {lbl:'الضريبة',val:mn(tax),sub:'VAT',c:'#d97706'},
      {lbl:'عدد الفواتير',val:fmtI(inv),sub:'فاتورة فريدة',c:'#16a34a'},
      {lbl:'متوسط الفاتورة',val:mn(avg),sub:'per invoice',c:'#dc2626'},
      {lbl:'العملاء',val:fmtI(clients),sub:'عميل نشط',c:'#7c3aed'},
      {lbl:'معدل الاحتفاظ',val:retention+'%',sub:fmtI(repeatClients)+' عميل متكرر',c:'#0891b2'},
      {lbl:'عدد العمليات',val:fmtI(rows.length),sub:'سطر بيانات',c:'#16a34a'},
    ];
    kpis.forEach(function(k){
      html += '<div class="pdf-kpi" style="--kc:'+k.c+'">'
        +'<div class="pk-label">'+block_4655_esc(k.lbl)+'</div>'
        +'<div class="pk-val">'+block_4655_esc(k.val)+'</div>'
        +'<div class="pk-sub" style="color:'+k.c+'">'+block_4655_esc(k.sub)+'</div>'
        +'</div>';
    });
    html += '</div>';

    // HEALTH + ALERTS two-column
    html += '<div class="pdf-grid-2">';
    // health
    html += '<div class="pdf-card"><h4>❤️ مؤشر صحة النشاط</h4>'
      +'<div class="pdf-health-score-box">'+svgRing(score)+'</div>'
      +'<p class="pdf-health-score-note">'
      +(score>=80?'الوضع قوي — الأداء ممتاز':score>=60?'الوضع مقبول — تابع التنبيهات':'يحتاج مراجعة عاجلة')
      +'</p></div>';
    // alerts
    html += '<div class="pdf-card"><h4>🚨 التنبيهات والملاحظات</h4>'
      +'<div class="pdf-alerts-list">';
    alerts.forEach(function(a){
      html += '<div class="pdf-alert '+a.level+'">'+block_4655_esc(a.text)+'</div>';
    });
    html += '</div></div></div>';

    // TOP CLIENTS
    html += '<div class="pdf-section-title">👥 أعلى العملاء مبيعاً</div>';
    html += '<table class="pdf-table"><thead><tr><th>#</th><th>اسم العميل</th><th>المبيعات</th><th>النسبة</th></tr></thead><tbody>';
    topClients.forEach(function(x,i){
      html += '<tr><td>'+(i+1)+'</td><td>'+block_4655_esc(x[0])+'</td><td class="pdf-num">'+mn(x[1])+'</td><td class="pdf-num">'+pct(x[1],total)+'</td></tr>';
    });
    if(!topClients.length) html += '<tr><td colspan="4" style="text-align:center;color:#94a3b8">لا توجد بيانات</td></tr>';
    html += '</tbody></table>';

    // CLIENTS BAR CHART
    if(topClients.length){
      html += '<div style="margin-bottom:16px">';
      var maxC=topClients[0][1]||1;
      topClients.slice(0,5).forEach(function(x){ html+=barRow(x[0],x[1],maxC); });
      html += '</div>';
    }

    // TOP SERVICES
    html += '<div class="pdf-section-title">🧩 أعلى الخدمات مبيعاً</div>';
    html += '<table class="pdf-table"><thead><tr><th>#</th><th>الخدمة</th><th>المبيعات</th><th>النسبة</th></tr></thead><tbody>';
    topServices.forEach(function(x,i){
      html += '<tr><td>'+(i+1)+'</td><td>'+block_4655_esc(x[0])+'</td><td class="pdf-num">'+mn(x[1])+'</td><td class="pdf-num">'+pct(x[1],total)+'</td></tr>';
    });
    if(!topServices.length) html += '<tr><td colspan="4" style="text-align:center;color:#94a3b8">لا توجد بيانات</td></tr>';
    html += '</tbody></table>';

    // SERVICES BARS
    if(topServices.length){
      html += '<div style="margin-bottom:16px">';
      var maxS=topServices[0][1]||1;
      topServices.slice(0,5).forEach(function(x){ html+=barRow(x[0],x[1],maxS); });
      html += '</div>';
    }

    // TOP VANS + PAYMENT two-column
    html += '<div class="pdf-grid-2">';
    // vans
    html += '<div class="pdf-card"><h4>🚐 أداء السيارات</h4>';
    html += '<table class="pdf-table" style="font-size:10.5px"><thead><tr><th>السيارة</th><th>المبيعات</th><th>النسبة</th></tr></thead><tbody>';
    topVans.forEach(function(x){
      html += '<tr><td>'+block_4655_esc(x[0])+'</td><td class="pdf-num">'+mn(x[1])+'</td><td class="pdf-num">'+pct(x[1],total)+'</td></tr>';
    });
    if(!topVans.length) html += '<tr><td colspan="3" style="text-align:center;color:#94a3b8">لا توجد بيانات</td></tr>';
    html += '</tbody></table></div>';
    // payment
    html += '<div class="pdf-card"><h4>💳 طرق الدفع</h4>';
    html += '<table class="pdf-table" style="font-size:10.5px"><thead><tr><th>طريقة الدفع</th><th>المبيعات</th><th>النسبة</th></tr></thead><tbody>';
    payRows.forEach(function(x){
      html += '<tr><td>'+block_4655_esc(x[0])+'</td><td class="pdf-num">'+mn(x[1])+'</td><td class="pdf-num">'+pct(x[1],total)+'</td></tr>';
    });
    if(!payRows.length) html += '<tr><td colspan="3" style="text-align:center;color:#94a3b8">لا توجد بيانات</td></tr>';
    html += '</tbody></table></div>';
    html += '</div>'; // end grid-2

    // QUICK DECISIONS
    html += '<div class="pdf-section-title">🎯 توصيات وقرارات سريعة</div>';
    var recs=[
      {
        title:'استرجاع العملاء',
        text:topClients.length?'أعلى عميل: '+topClients[0][0]+' بقيمة '+mn(topClients[0][1])+'. يُنصح بالتواصل المنتظم مع العملاء المتوقفين.':'لا توجد بيانات عملاء كافية.',
        bg:'#f0fdf4',border:'#86efac'
      },
      {
        title:'تطوير الخدمات',
        text:topServices.length?'أعلى خدمة: '+topServices[0][0]+' بمساهمة '+pct(topServices[0][1],total)+'. ادرس توسيع هذه الخدمة.':'لا توجد بيانات خدمات.',
        bg:'#eff6ff',border:'#93c5fd'
      },
      {
        title:'كفاءة السيارات',
        text:topVans.length?'أفضل سيارة: '+topVans[0][0]+' بمبيعات '+mn(topVans[0][1])+'. راجع توزيع العمل على باقي السيارات.':'لا توجد بيانات سيارات.',
        bg:'#fefce8',border:'#fde68a'
      },
      {
        title:'صحة النشاط العام',
        text:score>=80?'الأداء ممتاز في هذه الفترة. استمر في نهجك الحالي وراقب الفترة القادمة.':score>=60?'الأداء مقبول لكن توجد فرص للتحسين. راجع التنبيهات أعلاه.':'الأداء يحتاج تدخل عاجل. راجع التنبيهات الحمراء وابدأ بها فوراً.',
        bg:score>=80?'#f0fdf4':score>=60?'#fffbeb':'#fef2f2',
        border:score>=80?'#86efac':score>=60?'#fde68a':'#fca5a5'
      }
    ];
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">';
    recs.forEach(function(r){
      html += '<div style="border:1px solid '+r.border+';border-right:4px solid '+r.border+';border-radius:10px;padding:11px 13px;background:'+r.bg+'">'
        +'<div style="font-size:12px;font-weight:900;color:#1e1b4b;margin-bottom:5px">'+block_4655_esc(r.title)+'</div>'
        +'<div style="font-size:11px;font-weight:800;color:#475569;line-height:1.7">'+block_4655_esc(r.text)+'</div>'
        +'</div>';
    });
    html += '</div>';

    // FOOTER
    html += '<div class="pdf-footer">'
      +'PETATOE Analytics System v3.0 — تقرير تلقائي للإدارة العليا — جميع القيم بالريال السعودي (SAR)<br>'
      +'الفترة: '+block_4655_esc(period)+' | التاريخ: '+nowLabel()+' | '+block_4655_esc(company)
      +'</div>';

    return html;
  }

  /* ---- public API ---- */
  window.petatoeOpenPdfModal = function(){
    var modal = document.getElementById('petatoe-pdf-modal');
    if(modal){ modal.style.display='flex'; modal.classList.add('show'); try{petatoeSetupPdfPeriodSelectors(!petatoePdfPeriodReady)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/print-engine.js",e);} petatoeApplyPdfZoneTheme(); petatoeRefreshPdfReport(); }
  };

  window.petatoeClosePdfModal = function(){
    var modal = document.getElementById('petatoe-pdf-modal');
    if(modal){ modal.classList.remove('show'); modal.style.display='none'; }
  };

  function petatoeCurrentTheme(){
    return (document.documentElement.getAttribute('data-theme') || 'dark').toLowerCase() === 'light' ? 'light' : 'dark';
  }
  function petatoeApplyPdfZoneTheme(){
    var zone = document.getElementById('petatoe-pdf-zone');
    if(!zone) return;
    var t = petatoeCurrentTheme();
    zone.classList.remove('petatoe-pdf-theme-dark','petatoe-pdf-theme-light');
    zone.classList.add('petatoe-pdf-theme-' + t);
  }

  window.petatoeRefreshPdfReport = function(){
    var zone = document.getElementById('petatoe-pdf-zone');
    if(!zone) return;
    try{
      try{petatoeSetupPdfPeriodSelectors(false)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/print-engine.js",e);}
      petatoeApplyPdfZoneTheme();
      (window.PETATOESecurity||{setInnerHTML:function(node,h){node.textContent=String(h==null?'':h);}}).setInnerHTML(zone, buildReport());
      petatoeApplyPdfZoneTheme();
    }catch(e){
      (window.PETATOESecurity||{setInnerHTML:function(el,h){el.textContent=String(h==null?'':h);}}).setInnerHTML(zone, '<div style="padding:30px;text-align:center;color:red;font:900 13px Cairo">خطأ في بناء التقرير: '+block_4655_esc(e.message)+'</div>');
      console.error('PDF Report Error:', e);
    }
  };

  // PETATOE v6.6.15: Header PDF toolbar reset button.
  // The report already re-renders automatically when filters change, so this control
  // must restore the default period: latest invoice year/month/day available in data.
  window.petatoeResetPdfPeriodDefaults = function(){
    try{
      petatoeSetupPdfPeriodSelectors(true);
      window.petatoeRefreshPdfReport();
    }catch(e){
      window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/print-engine.js",e);
      try{ window.petatoeRefreshPdfReport(); }catch(_e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('inline-extracted/print-engine.js',_e);}
    }
  };

  window.petatoePrintPdf = function(){
    // إعادة بناء التقرير قبل الطباعة لضمان أن المحتوى المطبوع هو آخر نسخة ظاهرة
    try{ window.petatoeRefreshPdfReport(); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("inline-extracted/print-engine.js",e);}
    var zone = document.getElementById('petatoe-pdf-zone');
    if(!zone || !zone.innerHTML || !zone.innerHTML.trim()){
      alert('لا يوجد محتوى للطباعة. اضغط "تحديث" أولاً.');
      return;
    }
    if(zone.innerText && zone.innerText.indexOf('لا توجد بيانات بعد') !== -1){
      alert('لا توجد بيانات متاحة للطباعة. قم باستيراد البيانات أولاً.');
      return;
    }

    var pdfTheme = (typeof petatoeCurrentTheme === 'function'
      ? petatoeCurrentTheme()
      : ((document.documentElement.getAttribute('data-theme') || 'dark') === 'light' ? 'light' : 'dark'));
    var pdfThemeClass = 'petatoe-pdf-theme-' + pdfTheme;
    var win = window.open('', '_blank', 'width=1200,height=850');
    if(!win){
      alert('لم يتمكن المتصفح من فتح نافذة الطباعة. تحقق من إعدادات الـ Popup.');
      return;
    }

    var reportHtml = zone.innerHTML;
    var printCss = ''
      + '*{box-sizing:border-box;margin:0;padding:0}'
      + 'html,body{font-family:Cairo,Arial,sans-serif;direction:rtl;background:#fff;color:#0f172a;}'
      + 'body{padding:0;}'
      + '#petatoe-print-root{width:100%;background:#fff;color:#0f172a;}'
      + '.petatoe-pdf-theme-dark{background:#07101f!important;color:#f8fafc!important}'
      + '.petatoe-pdf-theme-light{background:#fff!important;color:#0f172a!important}'
      + '.pdf-header{display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #7c3aed;padding-bottom:14px;margin-bottom:20px}'
      + '.pdf-logo-block{display:flex;align-items:center;gap:12px}.pdf-logo-icon{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;font-size:26px;background:linear-gradient(135deg,#8b5cf6,#6d5dfc);color:#fff}'
      + '.pdf-logo-text h1{font-size:22px;font-weight:900;color:#1e1b4b;margin:0}.pdf-logo-text p{font-size:11px;color:#6d28d9;margin:2px 0 0;font-weight:800}.pdf-meta{text-align:left;font-size:11px;color:#64748b;line-height:1.8;font-weight:800}'
      + '.pdf-report-title{background:linear-gradient(135deg,#7c3aed,#6d28d9);color:#fff;border-radius:14px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between}.pdf-report-title h2{font-size:18px;margin:0;font-weight:900}.pdf-report-title span{font-size:12px;opacity:.85;font-weight:800}'
      + '.pdf-kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.pdf-kpi{border:1px solid #e2e8f0;border-radius:12px;padding:13px;background:#f8fafc;position:relative;overflow:hidden}.pdf-kpi .pk-label{font-size:11px;color:#64748b;font-weight:800}.pdf-kpi .pk-val{font-size:19px;font-weight:900;color:#1e1b4b;margin:5px 0 3px;direction:ltr;text-align:right}.pdf-kpi .pk-sub{font-size:10px;font-weight:800;color:#7c3aed}'
      + '.pdf-section-title{font-size:14px;font-weight:900;color:#1e1b4b;margin:20px 0 10px;border-right:4px solid #7c3aed;padding-right:10px;display:flex;align-items:center;gap:8px}.pdf-table{width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:16px}.pdf-table thead tr{background:#7c3aed;color:#fff}.pdf-table th{padding:8px 10px;text-align:right;font-weight:900}.pdf-table td{padding:7px 10px;border-bottom:1px solid #e2e8f0;text-align:right;color:#0f172a}.pdf-table tbody tr:nth-child(even) td{background:#f8fafc}.pdf-table .pdf-num{direction:ltr;text-align:left}'
      + '.pdf-alerts-list{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}.pdf-alert{border-radius:10px;padding:10px 13px;font-size:11.5px;font-weight:800;color:#1e1b4b;line-height:1.7}.pdf-alert.high{background:#fef2f2;border:1px solid #fecaca;border-right:4px solid #ef4444}.pdf-alert.med{background:#fffbeb;border:1px solid #fde68a;border-right:4px solid #f59e0b}.pdf-alert.low{background:#f0fdf4;border:1px solid #bbf7d0;border-right:4px solid #22c55e}'
      + '.pdf-bar-row{display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:11px;font-weight:800;color:#1e1b4b}.pdf-bar-label{width:130px;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pdf-bar-track{flex:1;height:10px;background:#e2e8f0;border-radius:99px;overflow:hidden}.pdf-bar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#7c3aed,#8b5cf6)}.pdf-bar-val{width:90px;text-align:left;direction:ltr;color:#7c3aed}.pdf-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.pdf-card{border:1px solid #e2e8f0;border-radius:12px;padding:14px;background:#f8fafc}.pdf-card h4{font-size:13px;font-weight:900;color:#1e1b4b;margin:0 0 10px;border-bottom:1px solid #e2e8f0;padding-bottom:7px}'
      + '.pdf-highlight{background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1px solid #c4b5fd;border-radius:14px;padding:14px 16px;margin-bottom:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.pdf-hl-item{text-align:center}.pdf-hl-item .hl-val{font-size:17px;font-weight:900;color:#6d28d9}.pdf-hl-item .hl-lbl{font-size:10px;font-weight:900;color:#6d28d9;opacity:.7}.pdf-footer{border-top:1px solid #e2e8f0;margin-top:22px;padding-top:10px;font-size:10px;color:#94a3b8;text-align:center;font-weight:800}'
      + '.pdf-daily-title{background:linear-gradient(135deg,#4f46e5,#7c3aed)!important;margin-top:8px!important}.pdf-daily-kpis{grid-template-columns:repeat(6,1fr)!important}.pdf-daily-table tfoot tr,.pdf-invoice-table tfoot tr{background:#ede9fe!important;color:#1e1b4b!important;font-weight:900!important}.pdf-daily-table tfoot td,.pdf-invoice-table tfoot td{border-top:2px solid #c4b5fd!important;background:#ede9fe!important}.pdf-invoice-table{font-size:10.5px!important}.pdf-invoice-table th,.pdf-invoice-table td{padding:6px 7px!important;white-space:normal!important;line-height:1.55!important}.pdf-page-break{page-break-before:always;break-before:page;margin-top:22px!important}.pdf-exec-mini{page-break-inside:avoid;break-inside:avoid}'
      + '.pdf-approved-pack{font-family:Cairo,Arial,sans-serif;direction:rtl;color:#0f172a;background:#fff}.pdf-approved-page{background:#fff;border:1px solid #d8d3e6;margin:0 0 10mm;padding:8mm 6mm 0;min-height:270mm;page-break-after:always;break-after:page;position:relative;overflow:hidden}.pdf-approved-head{display:flex;align-items:flex-start;justify-content:space-between;border-bottom:2px solid #6d4ab1;padding-bottom:9px;margin-bottom:14px}.pdf-approved-brand{display:flex;align-items:center;gap:9px}.pdf-approved-logo{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(135deg,#8b5cf6,#6d5dfc);color:#fff;font-size:21px}.pdf-approved-brand h2{margin:0;color:#5b35b1;font-size:20px;line-height:1;font-weight:950}.pdf-approved-brand small{display:block;color:#111827;font-size:9px;font-weight:900;margin-top:2px}.pdf-approved-title{text-align:center;flex:1}.pdf-approved-title h3{margin:6px 0 0;font-size:22px;font-weight:950;color:#111827}.pdf-approved-date{text-align:left;color:#111827;font-size:11px;font-weight:900;line-height:1.65;min-width:90px}.pdf-approved-chip,.pdf-approved-mtd-chip{width:max-content;margin:0 auto 12px;background:linear-gradient(135deg,#5b35a3,#43287f);color:#fff;border-radius:7px;padding:8px 18px;font-size:11px;font-weight:950}'
      + '.pdf-approved-table{width:100%;max-width:100%;min-width:0!important;table-layout:fixed!important;border-collapse:separate!important;border-spacing:0!important;font-size:9.6px;margin:0 0 10px;border:1px solid #d8d3e6;border-radius:8px;overflow:hidden}.pdf-approved-table th{position:static!important;background:linear-gradient(135deg,#5b35a3,#43287f)!important;color:#fff!important;padding:5px 4px!important;text-align:center!important;font-weight:950!important;white-space:normal!important;word-break:break-word!important;line-height:1.35!important;border-left:1px solid rgba(255,255,255,.14)!important}.pdf-approved-table td{padding:5px 4px!important;text-align:center!important;color:#0f172a!important;border-bottom:1px solid #e6e0f4!important;border-left:1px solid #e6e0f4!important;background:#fff!important;white-space:normal!important;word-break:break-word!important;line-height:1.35!important;vertical-align:middle!important}.pdf-approved-table tbody tr:nth-child(even) td{background:#fbfaff!important}.pdf-approved-table tfoot td,.pdf-approved-total td{background:#eee9fb!important;color:#111827!important;font-weight:950!important}.pdf-approved-num{direction:ltr;text-align:center!important;font-weight:900}.pdf-approved-car{font-weight:950;color:#312e81}'
      + '.pdf-approved-kpis{display:grid;grid-template-columns:repeat(6,1fr);border:1px solid #d8d3e6;border-radius:12px;overflow:hidden;margin-top:14px}.pdf-approved-kpi{min-height:94px;text-align:center;padding:10px 5px;border-left:1px solid #e6e0f4;background:#fff}.pdf-approved-kpi .ico{font-size:22px;display:block;margin-bottom:7px}.pdf-approved-kpi .lbl{font-size:9.5px;font-weight:950;color:#312e81;min-height:24px}.pdf-approved-kpi .val{direction:ltr;margin-top:7px;font-size:16px;font-weight:950;color:#111827}.pdf-approved-kpi .sub{font-size:9px;font-weight:900;color:#111827;margin-top:3px}.pdf-approved-footer{position:absolute;bottom:0;left:0;right:0;height:30px;background:linear-gradient(135deg,#5b35a3,#3f246f);color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 18px;font-size:9px;font-weight:900}'
      + '.pdf-approved-car-block{margin-bottom:9px;page-break-inside:avoid;break-inside:avoid}.pdf-approved-car-title{display:flex;align-items:center;justify-content:flex-end;gap:7px;font-size:11px;font-weight:950;color:#111827;margin:0 0 5px}.pdf-approved-exec-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:8px 0 14px}.pdf-approved-exec-card{border:1px solid #cfc7eb;border-radius:18px;min-height:124px;text-align:center;padding:14px 8px;background:linear-gradient(135deg,#fff,#faf8ff)}.pdf-approved-exec-card .lbl{font-size:11px;font-weight:950;margin-bottom:12px}.pdf-approved-exec-card .val{font-size:20px;font-weight:950;direction:ltr;color:#4c1d95}.pdf-approved-exec-card .sub{font-size:9px;font-weight:900;margin-top:4px;color:#111827}.pdf-approved-exec-card .bigico{font-size:26px;margin-top:9px}.pdf-approved-charts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}.pdf-approved-chart-card{border:1px solid #e2e8f0;border-radius:16px;padding:10px;background:#fff;min-height:225px;page-break-inside:avoid}.pdf-approved-ring-wrap{display:grid;grid-template-columns:145px 1fr;align-items:center;gap:10px}.pdf-approved-ring{width:135px;height:135px;border-radius:50%;position:relative;margin:auto}.pdf-approved-ring:after{content:"";position:absolute;inset:37px;background:#fff;border-radius:50%}.pdf-approved-legend{display:flex;flex-direction:column;gap:6px;font-size:8.7px;font-weight:900;color:#111827}.pdf-approved-legend-row{display:grid;grid-template-columns:10px 1fr auto;gap:5px;align-items:center}.pdf-approved-indicators{border:1px solid #e2e8f0;border-radius:16px;padding:12px;margin-top:8px}.pdf-approved-ind-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pdf-approved-ind{display:grid;grid-template-columns:42px 1fr;gap:8px;align-items:center;padding:7px;border-left:1px solid #e2e8f0}.pdf-approved-ind .ico{width:38px;height:38px;border:1px solid #d8d3e6;border-radius:12px;display:grid;place-items:center;font-size:20px;background:#fff}.pdf-health-score-box{height:112px;min-height:112px;display:flex;align-items:center;justify-content:center;padding:8px 0 0;overflow:visible}.pdf-health-score-note{font-size:11px;font-weight:800;color:#64748b;text-align:center;margin:12px 0 0;line-height:1.8;clear:both}'
      + '.petatoe-pdf-theme-dark .pdf-header,.petatoe-pdf-theme-dark .pdf-approved-head{border-bottom-color:#8b5cf6!important}.petatoe-pdf-theme-dark .pdf-logo-text h1,.petatoe-pdf-theme-dark .pdf-section-title,.petatoe-pdf-theme-dark .pdf-card h4,.petatoe-pdf-theme-dark .pdf-approved-brand h2,.petatoe-pdf-theme-dark .pdf-approved-title h3,.petatoe-pdf-theme-dark .pdf-approved-date,.petatoe-pdf-theme-dark .pdf-approved-car-title,.petatoe-pdf-theme-dark .pdf-approved-brand small{color:#f8fafc!important}.petatoe-pdf-theme-dark .pdf-meta,.petatoe-pdf-theme-dark .pdf-footer,.petatoe-pdf-theme-dark .pdf-logo-text p,.petatoe-pdf-theme-dark .pdf-kpi .pk-label,.petatoe-pdf-theme-dark .pdf-health-score-note{color:#cbd5e1!important}.petatoe-pdf-theme-dark .pdf-kpi,.petatoe-pdf-theme-dark .pdf-card,.petatoe-pdf-theme-dark .pdf-approved-kpi,.petatoe-pdf-theme-dark .pdf-approved-chart-card,.petatoe-pdf-theme-dark .pdf-approved-indicators,.petatoe-pdf-theme-dark .pdf-approved-ind,.petatoe-pdf-theme-dark .pdf-approved-exec-card{background:#0f172a!important;border-color:#334155!important;color:#f8fafc!important}.petatoe-pdf-theme-dark .pdf-kpi .pk-val,.petatoe-pdf-theme-dark .pdf-hl-item .hl-val,.petatoe-pdf-theme-dark .pdf-approved-exec-card .val,.petatoe-pdf-theme-dark .pdf-approved-kpi .val,.petatoe-pdf-theme-dark .pdf-approved-num,.petatoe-pdf-theme-dark .pdf-approved-kpi .lbl,.petatoe-pdf-theme-dark .pdf-approved-section-label,.petatoe-pdf-theme-dark .pdf-approved-legend,.petatoe-pdf-theme-dark .pdf-approved-ind span{color:#f8fafc!important}.petatoe-pdf-theme-dark .pdf-highlight,.petatoe-pdf-theme-dark .pdf-approved-total td,.petatoe-pdf-theme-dark .pdf-approved-table tfoot td{background:#1e293b!important;color:#f8fafc!important;border-color:#475569!important}.petatoe-pdf-theme-dark .pdf-table td,.petatoe-pdf-theme-dark .pdf-approved-table td{background:#0f172a!important;color:#f8fafc!important;border-color:#334155!important}.petatoe-pdf-theme-dark .pdf-table tbody tr:nth-child(even) td,.petatoe-pdf-theme-dark .pdf-approved-table tbody tr:nth-child(even) td{background:#111c2e!important}.petatoe-pdf-theme-dark .pdf-alert,.petatoe-pdf-theme-dark .pdf-alert.high,.petatoe-pdf-theme-dark .pdf-alert.med,.petatoe-pdf-theme-dark .pdf-alert.low{color:#f8fafc!important;background:#0f172a!important;border-color:#334155!important}.petatoe-pdf-theme-dark .pdf-bar-row,.petatoe-pdf-theme-dark .pdf-bar-val{color:#e2e8f0!important}.petatoe-pdf-theme-dark .pdf-bar-track{background:#334155!important}.petatoe-pdf-theme-dark .pdf-approved-pack,.petatoe-pdf-theme-dark .pdf-approved-page{background:#07101f!important;color:#f8fafc!important}.petatoe-pdf-theme-dark .pdf-approved-ring:after{background:#07101f!important}'
      + '@media print{@page{size:A4 portrait;margin:8mm}body{padding:0!important}.pdf-approved-page{border:0!important;margin:0!important;padding:6mm 4mm 0!important;min-height:281mm!important;width:100%!important;max-width:100%!important;page-break-after:always!important;break-after:page!important}.pdf-approved-table{font-size:8.7px!important}.pdf-approved-table th,.pdf-approved-table td{padding:4px 3px!important}.pdf-approved-title h3{font-size:19px!important}.pdf-kpi-grid{grid-template-columns:repeat(4,1fr)}.pdf-grid-2{grid-template-columns:1fr 1fr}.pdf-table{page-break-inside:avoid}.pdf-section-title{page-break-after:avoid}}';

    // PETATOE v5.1.65: Force the final browser print preview to keep the active theme.
    // Chrome can render the last print preview using default white page styles unless the
    // print document itself has strong theme-specific rules on html/body/root/pages.
    if(pdfTheme === 'dark'){
      printCss += ''
        + 'html,body{background:#07101f!important;color:#f8fafc!important;color-scheme:dark!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}'
        + '#petatoe-print-root,.pdf-approved-pack,.pdf-approved-page{background:#07101f!important;color:#f8fafc!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}'
        + '.pdf-approved-page{box-shadow:inset 0 0 0 9999px #07101f!important;border-color:#334155!important;}'
        + '.pdf-approved-table,.pdf-table{background:#0f172a!important;color:#f8fafc!important;}'
        + '.pdf-approved-table td,.pdf-table td{background:#0f172a!important;color:#f8fafc!important;border-color:#334155!important;}'
        + '.pdf-approved-table tbody tr:nth-child(even) td,.pdf-table tbody tr:nth-child(even) td{background:#111c2e!important;}'
        + '.pdf-approved-kpis,.pdf-approved-kpi,.pdf-kpi,.pdf-card,.pdf-approved-chart-card,.pdf-approved-exec-card,.pdf-approved-indicators{background:#0f172a!important;color:#f8fafc!important;border-color:#334155!important;}'
        + '.pdf-approved-brand h2,.pdf-approved-brand small,.pdf-approved-title h3,.pdf-approved-date,.pdf-logo-text h1,.pdf-card h4,.pdf-section-title{color:#f8fafc!important;}'
        + '.pdf-meta,.pdf-footer,.pdf-logo-text p,.pdf-health-score-note{color:#cbd5e1!important;}'
        + '@media print{html,body,#petatoe-print-root,.pdf-approved-pack,.pdf-approved-page{background:#07101f!important;color:#f8fafc!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}.pdf-approved-page{box-shadow:inset 0 0 0 9999px #07101f!important;}.pdf-approved-table td,.pdf-table td{background:#0f172a!important;color:#f8fafc!important}.pdf-approved-table tbody tr:nth-child(even) td,.pdf-table tbody tr:nth-child(even) td{background:#111c2e!important}}';
    }else{
      printCss += 'html,body,#petatoe-print-root,.pdf-approved-pack,.pdf-approved-page{background:#fff!important;color:#0f172a!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}';
    }


    // PETATOE v6.6.13: prevent the header PDF report from being clipped in print preview.
    // Previous approved PDF pages used fixed A4 min-height + overflow:hidden, which could hide
    // the rest of long invoice/summary pages. Keep the approved design but allow full content flow.
    printCss += ''
      + '.pdf-approved-page{min-height:auto!important;height:auto!important;overflow:visible!important;padding-bottom:8mm!important;page-break-after:always!important;break-after:page!important;}'
      + '.pdf-approved-footer{position:static!important;margin:10px -4mm 0!important;min-height:30px!important;}'
      + '.pdf-approved-table{page-break-inside:auto!important;break-inside:auto!important;}'
      + '.pdf-approved-table thead{display:table-header-group!important;}'
      + '.pdf-approved-table tfoot{display:table-footer-group!important;}'
      + '.pdf-approved-table tr{page-break-inside:avoid!important;break-inside:avoid!important;}'
      + '@media print{.pdf-approved-page{min-height:auto!important;height:auto!important;overflow:visible!important;padding-bottom:8mm!important;}.pdf-approved-footer{position:static!important;margin:10px -4mm 0!important;}.pdf-approved-table{page-break-inside:auto!important;break-inside:auto!important;}.pdf-approved-table thead{display:table-header-group!important;}.pdf-approved-table tfoot{display:table-footer-group!important;}.pdf-approved-table tr{page-break-inside:avoid!important;break-inside:avoid!important;}}';

    var html = '<!DOCTYPE html><html lang="ar" dir="rtl"><head>'
      + '<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>تقرير الإدارة العليا - PETATOE</title>'
      + '<link rel="preconnect" href="https://fonts.googleapis.com">'
      + '<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800;900&display=swap" rel="stylesheet">'
      + '<style>' + printCss + '</style>'
      + '</head><body class="petatoe-print-approved ' + pdfThemeClass + '">'
      + '<div id="petatoe-print-root" class="' + pdfThemeClass + '">' + reportHtml + '</div>'
      + '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.focus();window.print();},800)};<\/scr'+'ipt>'
      + '</body></html>';

    try{
      win.document.open();
      win.document.write(html);
      win.document.close();
      try{ win.focus(); }catch(_focusErr){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('inline-extracted/print-engine.js',_focusErr);}
    }catch(writeErr){
      try{ win.close(); }catch(_closeErr){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('inline-extracted/print-engine.js',_closeErr);}
      petatoeOpenPrintHtml(html,'width=1200,height=850');
    }
  };

  function petatoeBindPdfModalControls(){
    function bindClick(id, fn){
      var el=document.getElementById(id);
      if(!el || el.__petatoePdfDirectBound) return;
      el.__petatoePdfDirectBound=true;
      el.addEventListener('click',function(e){
        e.preventDefault();
        e.stopPropagation();
        if(typeof fn==='function') fn();
      },true);
    }
    function bindChange(id, level){
      var el=document.getElementById(id);
      if(!el || el.__petatoePdfChangeBound) return;
      el.__petatoePdfChangeBound=true;
      el.addEventListener('change',function(){
        try{
          if(typeof window.petatoePdfPeriodChanged === 'function') window.petatoePdfPeriodChanged(level);
          else if(typeof window.petatoeRefreshPdfReport === 'function') window.petatoeRefreshPdfReport();
        }catch(e){
          if(window.PETATOEUtils && window.PETATOEUtils.warnSilentCatch){
            window.PETATOEUtils.warnSilentCatch('inline-extracted/print-engine.js',e);
          }else{
            console.error('PETATOE PDF filter change failed', e);
          }
        }
      },true);
    }

    // v6.6.17: bind controls directly inside the PDF engine as a runtime fallback.
    // filters-finalization.js may also bind data-pet-filter handlers, but the PDF
    // modal must remain functional even if that shared filter layer is delayed.
    bindClick('safePdfRefreshBtn', function(){ window.petatoeResetPdfPeriodDefaults(); });
    bindClick('safePdfPrintBtn', function(){ window.petatoePrintPdf(); });
    bindClick('safePdfCloseBtn', function(){ window.petatoeClosePdfModal(); });
    bindChange('pdf-year-sel','year');
    bindChange('pdf-month-sel','month');
    bindChange('pdf-day-sel','day');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', petatoeBindPdfModalControls);
  else petatoeBindPdfModalControls();

  // close modal on backdrop click
  var modal = document.getElementById('petatoe-pdf-modal');
  if(modal){
    modal.addEventListener('click',function(e){
      if(e.target===modal) window.petatoeClosePdfModal();
    });
  }

  // keyboard shortcut: Ctrl+Shift+P
  document.addEventListener('keydown',function(e){
    if(e.ctrlKey && e.shiftKey && e.key==='P'){
      e.preventDefault();
      if(typeof window.petatoeOpenPdfModal === 'function') window.petatoeOpenPdfModal();
    }
  });

  // v6.6.17: expose a stable topbar entry point for the header PDF button.
  window.PETATOEHeaderPdfSafeOpen = window.PETATOEHeaderPdfSafeOpen || function(event){
    try{ if(event && event.preventDefault) event.preventDefault(); }catch(_e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('inline-extracted/print-engine.js',_e);}
    if(typeof window.petatoeOpenPdfModal === 'function') window.petatoeOpenPdfModal();
    else alert('محرك تقرير PDF لم يكتمل تحميله بعد. أعد المحاولة خلال ثانية.');
    return false;
  };

})();