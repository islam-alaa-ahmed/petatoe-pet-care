/* PETATOE v6.1.266 — Children Expenses legacy engine.
   Scope: isolated CRUD + monthly budgets + section-only reports/export + sub-permission enforcement for the private children expenses section only.
   No sales, commission, reports, filters, or print logic touched. */
(function(){
  'use strict';
  if(window.PETATOEChildrenExpenses && window.PETATOEChildrenExpenses.__ready) return;
  var KEY = 'childrenExpenses';
  var LEGACY_KEY = 'PETATOE_CHILDREN_EXPENSES_V1';
  var BUDGET_KEY = 'childrenExpenseBudgets';
  var BUDGET_LEGACY_KEY = 'PETATOE_CHILDREN_EXPENSE_BUDGETS_V1';
  var currency = 'SAR';

  function warn(e){ try{ if(window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch) window.PETATOEUtils.warnSilentCatch('children-expenses-core.js', e); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("children-expenses/children-legacy-engine.js",e);} }
  function S(){ return window.PETATOEStorage || null; }
  function storageApi(){
    try{
      var mod = childrenModule('storage');
      return mod || window.PETATOEChildrenExpensesStorage || null;
    }catch(e){ warn(e); return window.PETATOEChildrenExpensesStorage || null; }
  }
  function read(){
    try{
      var api = storageApi();
      if(api && typeof api.read === 'function') return api.read();
      var st=S(), arr=st&&st.readJSON?st.readJSON(KEY, null):null;
      if(!Array.isArray(arr) && st&&st.readJSON) arr=st.readJSON(LEGACY_KEY, []);
      return Array.isArray(arr)?arr:[];
    }catch(e){ warn(e); return []; }
  }
  function write(arr){
    try{
      var api = storageApi();
      if(api && typeof api.write === 'function') return api.write(arr);
      var st=S(); if(st&&st.writeJSON) return st.writeJSON(KEY, Array.isArray(arr)?arr:[]);
    }catch(e){ warn(e); }
    return false;
  }
  function readBudgets(){
    try{
      var api = storageApi();
      if(api && typeof api.readBudgets === 'function') return api.readBudgets();
      var st=S(), arr=st&&st.readJSON?st.readJSON(BUDGET_KEY, null):null;
      if(!Array.isArray(arr) && st&&st.readJSON) arr=st.readJSON(BUDGET_LEGACY_KEY, []);
      return Array.isArray(arr)?arr:[];
    }catch(e){ warn(e); return []; }
  }
  function writeBudgets(arr){
    try{
      var api = storageApi();
      if(api && typeof api.writeBudgets === 'function') return api.writeBudgets(arr);
      var st=S(); if(st&&st.writeJSON) return st.writeJSON(BUDGET_KEY, Array.isArray(arr)?arr:[]);
    }catch(e){ warn(e); }
    return false;
  }
  function byId(id){ return document.getElementById(id); }
  function val(id){ var el=byId(id); return el ? String(el.value||'').trim() : ''; }
  function setVal(id,v){ var el=byId(id); if(el) el.value = v == null ? '' : String(v); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function currentYear(){ return today().slice(0,4); }
  function currentMonth(){ return today().slice(0,7); }
  var MONTH_OPTIONS=[['01','يناير'],['02','فبراير'],['03','مارس'],['04','أبريل'],['05','مايو'],['06','يونيو'],['07','يوليو'],['08','أغسطس'],['09','سبتمبر'],['10','أكتوبر'],['11','نوفمبر'],['12','ديسمبر']];
  function monthNameByNumber(mm){
    mm=pad2(mm);
    var found=(MONTH_OPTIONS||[]).filter(function(pair){ return pair[0]===mm; })[0];
    return found ? found[1] : mm;
  }
  function monthNameFromKey(key){
    var p=dateParts(String(key||'')+'-01');
    return p ? monthNameByNumber(p.month) : String(key||'');
  }
  function normalizeTrendMonthFilter(v){
    var raw=String(v==null?'':v).trim();
    if(!raw || raw==='all') return 'all';
    if(/^\d{1,2}$/.test(raw)) return pad2(raw);
    var found=(MONTH_OPTIONS||[]).filter(function(pair){ return pair[1]===raw || pair[0]===raw; })[0];
    return found ? found[0] : raw;
  }
  function pad2(v){ v=String(v==null?'':v).trim(); return v.length===1 ? '0'+v : v; }
  function dateParts(date){
    var raw=String(date||'').trim();
    var m=raw.match(/^(\d{4})[-\/](\d{1,2})(?:[-\/](\d{1,2}))?/);
    if(m) return {year:m[1], month:pad2(m[2]), day:pad2(m[3]||'01')};
    return null;
  }
  function monthOf(date){ var p=dateParts(date); return p ? (p.year+'-'+p.month) : (String(date||'').slice(0,7) || 'غير محدد'); }
  function yearOf(date){ var p=dateParts(date); return p ? p.year : (String(date||'').slice(0,4) || 'غير محدد'); }
  function normalizedMonth(value){ return monthOf(value); }
  function escText(v){
    if(window.PETATOESafeRender && typeof window.PETATOESafeRender.escapeHTML === 'function') return window.PETATOESafeRender.escapeHTML(v);
    if(typeof window.htmlSafe === 'function') return window.htmlSafe(v);
    return String(v==null?'':v).replace(/[&<>\"'`]/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;','`':'&#96;'}[ch]||ch;});
  }
  function fmt(n){
    var num=Number(n)||0;
    try{return num.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+' '+currency;}catch(e){return num.toFixed(2)+' '+currency;}
  }
  function makeId(prefix){ return String(prefix||'ce')+'_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7); }
  function currentUserId(){
    try{
      var api = storageApi();
      if(api && typeof api.currentUserId === 'function') return api.currentUserId();
      var st=S();
      if(st&&st.get) return st.get('petatoe_current_user_v108','') || st.get('petatoe_current_user_v139','') || st.get('petatoe_current_user_v2','') || st.get('petatoe_current_user','') || '';
    }catch(e){ warn(e); }
    return '';
  }
  function can(action){
    try{
      if(window.PETATOEPermissions&&typeof window.PETATOEPermissions.can==='function') return !!window.PETATOEPermissions.can(currentUserId(),'childrenExpenses',action||'view');
    }catch(e){ warn(e); }
    return true;
  }
  function canSpecial(key){
    try{
      if(window.PETATOEPermissions&&typeof window.PETATOEPermissions.canSpecial==='function') return !!window.PETATOEPermissions.canSpecial(currentUserId(),key);
    }catch(e){ warn(e); }
    return true;
  }
  function deny(msg){ if(window.toast) window.toast(msg||'ليس لديك صلاحية لتنفيذ هذا الإجراء'); else alert(msg||'ليس لديك صلاحية لتنفيذ هذا الإجراء'); }
  function setVisible(el, show){ if(el) el.style.display = show ? '' : 'none'; }
  var activeTab='budget';
  var childrenAnnualTrendChart = null;
  function childrenModule(name){
    try{
      var root = window.PETATOEChildrenExpensesModule;
      return root && typeof root.getModule === 'function' ? root.getModule(name) : null;
    }catch(e){ warn(e); return null; }
  }
  function callChildrenModule(name, method, args, fallback){
    try{
      var mod = childrenModule(name);
      if(mod && typeof mod[method] === 'function'){
        return mod[method].apply(mod, args || []);
      }
    }catch(e){ warn(e); }
    return typeof fallback === 'function' ? fallback.apply(null, args || []) : undefined;
  }
  function setTab(tab){
    activeTab = tab || 'budget';
    var tabs = Array.prototype.slice.call(document.querySelectorAll('#childrenExpenses [data-children-expenses-tab]'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('#childrenExpenses [data-children-expenses-panel]'));
    tabs.forEach(function(btn){
      var isActive = btn.getAttribute('data-children-expenses-tab')===activeTab;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    panels.forEach(function(panel){ panel.classList.toggle('active', panel.getAttribute('data-children-expenses-panel')===activeTab); });
  }
  function applyActiveTab(){ setTab(activeTab || 'budget'); }
  function applyPermissionsUi(){
    var view=can('view'), add=can('add'), edit=can('edit'), del=can('delete'), budget=canSpecial('children_expenses_budget'), exp=canSpecial('children_expenses_export');
    var panel=byId('childrenExpenses');
    if(panel){ panel.classList.toggle('children-expenses-readonly', !add&&!edit&&!del&&!budget&&!exp); }
    var form=document.querySelector('#childrenExpenses .children-expenses-form-card'); setVisible(form, view && add);
    var budgetCard=document.querySelector('#childrenExpenses .children-expenses-budget-card'); setVisible(budgetCard, view && budget);
    var reportActions=document.querySelector('#childrenExpenses .children-expenses-report-actions'); setVisible(reportActions, view && exp);
    var clearButtons=Array.prototype.slice.call(document.querySelectorAll('#childrenExpenses button[onclick*="clearForm"]'));
    clearButtons.forEach(function(b){ setVisible(b, view && add); });
  }
  function unique(arr){ var seen={}; return arr.filter(function(x){ x=String(x||'').trim(); if(!x||seen[x])return false; seen[x]=true; return true; }); }
  function expenseTotalFor(child, month, rows){
    rows = Array.isArray(rows) ? rows : read();
    return rows.reduce(function(sum,r){
      if(String(r.child||'')!==String(child||'')) return sum;
      if(monthOf(r.date)!==String(month||'')) return sum;
      return sum + (Number(r.amount)||0);
    },0);
  }
  function budgetStatus(budget, spent){
    budget = Number(budget)||0; spent = Number(spent)||0;
    if(budget<=0) return {text:'بدون ميزانية', cls:'is-neutral'};
    if(spent>budget) return {text:'تجاوز الميزانية', cls:'is-danger'};
    if(spent>=budget*0.85) return {text:'اقترب من الحد', cls:'is-warning'};
    return {text:'داخل الميزانية', cls:'is-ok'};
  }
  function currentRowsInternal(){
    var rows=read().slice().sort(function(a,b){ return String(b.date||'').localeCompare(String(a.date||'')) || String(b.createdAt||'').localeCompare(String(a.createdAt||'')); });
    var q=val('childrenExpensesSearch').toLowerCase(), y=val('childrenExpensesYear') || currentYear(), m=val('childrenExpensesMonth') || currentMonth(), child=val('childrenExpensesChildFilter');
    return rows.filter(function(r){
      if(y && y!=='all' && yearOf(r.date)!==y) return false;
      if(m && m!=='all' && monthOf(r.date)!==m) return false;
      if(child && child!=='all' && String(r.child||'')!==child) return false;
      if(q){ var hay=[r.child,r.category,r.payment,r.notes,r.date].join(' ').toLowerCase(); if(hay.indexOf(q)<0) return false; }
      return true;
    });
  }
  function fillSelect(id, items, keep, allLabel){
    var el=byId(id); if(!el) return;
    var current = keep==null ? el.value : keep;
    while(el.firstChild) el.removeChild(el.firstChild);
    var opt=document.createElement('option'); opt.value='all'; opt.textContent=allLabel||'الكل'; el.appendChild(opt);
    items.forEach(function(x){ var o=document.createElement('option'); o.value=x; o.textContent=x; el.appendChild(o); });
    el.value = current && Array.prototype.some.call(el.options,function(o){return o.value===current;}) ? current : 'all';
  }
  function fillSelectPairs(id, pairs, keep, allLabel){
    var el=byId(id); if(!el) return;
    var current = keep==null ? el.value : keep;
    while(el.firstChild) el.removeChild(el.firstChild);
    var opt=document.createElement('option'); opt.value='all'; opt.textContent=allLabel||'الكل'; el.appendChild(opt);
    (pairs||[]).forEach(function(pair){ var o=document.createElement('option'); o.value=pair[0]; o.textContent=pair[1]; el.appendChild(o); });
    el.value = current && Array.prototype.some.call(el.options,function(o){return o.value===current;}) ? current : 'all';
  }
  function matchesLogFilterInternal(r, skip){
    var q=val('childrenExpensesSearch').toLowerCase(), y=val('childrenExpensesYear') || currentYear(), m=val('childrenExpensesMonth') || currentMonth(), child=val('childrenExpensesChildFilter');
    if(skip!=='year' && y && y!=='all' && yearOf(r.date)!==y) return false;
    if(skip!=='month' && m && m!=='all' && monthOf(r.date)!==m) return false;
    if(skip!=='child' && child && child!=='all' && String(r.child||'')!==child) return false;
    if(q){ var hay=[r.child,r.category,r.payment,r.notes,r.date].join(' ').toLowerCase(); if(hay.indexOf(q)<0) return false; }
    return true;
  }
  function renderFiltersInternal(rows){
    rows = Array.isArray(rows) ? rows : read();
    var yearEl=byId('childrenExpensesYear'), monthEl=byId('childrenExpensesMonth');
    var firstLogFilterRender = !!((yearEl && yearEl.getAttribute('data-ce-log-defaulted')!=='1') || (monthEl && monthEl.getAttribute('data-ce-log-defaulted')!=='1'));
    var selectedYear = val('childrenExpensesYear');
    var selectedMonth = val('childrenExpensesMonth');
    /* Log filters must open on current year/month. The HTML placeholder options use "all",
       so relying on an empty value keeps the default stuck on "كل الشهور". */
    if(firstLogFilterRender){
      selectedYear = currentYear();
      selectedMonth = currentMonth();
      if(yearEl) yearEl.setAttribute('data-ce-log-defaulted','1');
      if(monthEl) monthEl.setAttribute('data-ce-log-defaulted','1');
    }else{
      selectedYear = selectedYear || currentYear();
      selectedMonth = selectedMonth || currentMonth();
    }
    if(yearEl) yearEl.value = selectedYear;
    if(monthEl) monthEl.value = selectedMonth;
    var years = unique(rows.filter(function(r){return matchesLogFilterInternal(r,'year');}).map(function(r){return yearOf(r.date);})).sort().reverse();
    if(years.indexOf(currentYear())<0) years.unshift(currentYear());
    fillSelect('childrenExpensesYear', years, selectedYear, 'كل السنوات');
    var months = unique(rows.filter(function(r){return matchesLogFilterInternal(r,'month');}).map(function(r){return monthOf(r.date);})).sort().reverse();
    if(months.indexOf(currentMonth())<0) months.unshift(currentMonth());
    fillSelectPairs('childrenExpensesMonth', months.map(function(monthKey){ return [monthKey, monthNameFromKey(monthKey)]; }), selectedMonth, 'كل الشهور');
    fillSelect('childrenExpensesChildFilter', unique(rows.filter(function(r){return matchesLogFilterInternal(r,'child');}).map(function(r){return r.child;})).sort(), null, 'كل الأبناء');
    var dl=byId('childrenExpenseNames'); if(dl){ while(dl.firstChild) dl.removeChild(dl.firstChild); unique(rows.map(function(r){return r.child;})).sort().forEach(function(n){ var o=document.createElement('option'); o.value=n; dl.appendChild(o); }); }
  }
  function renderKpisInternal(rows){
    var box=byId('childrenExpensesKpis'); if(!box) return;
    while(box.firstChild) box.removeChild(box.firstChild);
    var nowMonth=currentMonth(), monthRows=rows.filter(function(r){return monthOf(r.date)===nowMonth;});
    var total=rows.reduce(function(s,r){return s+(Number(r.amount)||0);},0);
    var monthTotal=monthRows.reduce(function(s,r){return s+(Number(r.amount)||0);},0);
    var children=unique(rows.map(function(r){return r.child;})).length;
    var budgets=readBudgets(), monthBudget=budgets.filter(function(b){return normalizedMonth(b.month)===nowMonth;}).reduce(function(s,b){return s+(Number(b.amount)||0);},0);
    var remaining=monthBudget-monthTotal;
    [['إجمالي المصروفات',fmt(total),'كل السجلات'],['مصروفات الشهر',fmt(monthTotal),nowMonth],['ميزانية الشهر',fmt(monthBudget),monthBudget>0?'المتبقي: '+fmt(remaining):'لم يتم تحديدها'],['عدد الأبناء',children+'','حسب السجل']].forEach(function(k){
      var card=document.createElement('div'); card.className='children-expenses-kpi';
      var s=document.createElement('span'); s.textContent=k[0]; var b=document.createElement('b'); b.textContent=k[1]; var sm=document.createElement('small'); sm.textContent=k[2];
      card.appendChild(s); card.appendChild(b); card.appendChild(sm); box.appendChild(card);
    });
  }
  function addCell(tr, txt, cls){ var td=document.createElement('td'); if(cls)td.className=cls; td.textContent=escText(txt); tr.appendChild(td); return td; }
  function renderTableInternal(rows){
    var body=byId('childrenExpensesBody'); if(!body) return;
    while(body.firstChild) body.removeChild(body.firstChild);
    var filtered=currentRowsInternal();
    if(!filtered.length){ var tr=document.createElement('tr'), td=document.createElement('td'); td.colSpan=8; td.className='children-expenses-empty'; td.textContent='لا توجد مصروفات مسجلة في الفلتر الحالي'; tr.appendChild(td); body.appendChild(tr); return; }
    filtered.forEach(function(r,i){
      var tr=document.createElement('tr');
      addCell(tr,i+1); addCell(tr,r.date); addCell(tr,r.child); addCell(tr,r.category); addCell(tr,r.payment); addCell(tr,fmt(r.amount)); addCell(tr,r.notes||'-');
      var td=document.createElement('td'), wrap=document.createElement('div'); wrap.className='children-expenses-row-actions';
      if(can('edit')){ var edit=document.createElement('button'); edit.type='button'; edit.className='btn btn-ghost'; edit.textContent='تعديل'; edit.addEventListener('click',function(){ editRow(r.id); }); wrap.appendChild(edit); }
      if(can('delete')){ var del=document.createElement('button'); del.type='button'; del.className='btn btn-danger'; del.textContent='حذف'; del.addEventListener('click',function(){ deleteRow(r.id); }); wrap.appendChild(del); }
      if(!wrap.childNodes.length){ var ro=document.createElement('span'); ro.className='children-expenses-readonly-note'; ro.textContent='عرض فقط'; wrap.appendChild(ro); }
      td.appendChild(wrap); tr.appendChild(td); body.appendChild(tr);
    });
    var total=filtered.reduce(function(sum,r){return sum+numberOnly(r.amount);},0);
    var totalTr=document.createElement('tr'); totalTr.className='children-expenses-total-row';
    addCell(totalTr,'الإجمالي'); addCell(totalTr,''); addCell(totalTr,filtered.length+' عملية'); addCell(totalTr,''); addCell(totalTr,''); addCell(totalTr,fmt(total)); addCell(totalTr,''); addCell(totalTr,'');
    body.appendChild(totalTr);
  }
  function renderBudgetsInternal(rows){
    var body=byId('childrenBudgetsBody'); if(!body) return;
    while(body.firstChild) body.removeChild(body.firstChild);
    var budgets=readBudgets().slice().sort(function(a,b){ return String(b.month||'').localeCompare(String(a.month||'')) || String(a.child||'').localeCompare(String(b.child||'')); });
    if(!budgets.length){ var tr=document.createElement('tr'), td=document.createElement('td'); td.colSpan=7; td.className='children-expenses-empty'; td.textContent='لا توجد ميزانيات مسجلة حتى الآن'; tr.appendChild(td); body.appendChild(tr); return; }
    budgets.forEach(function(b){
      var spent=expenseTotalFor(b.child,b.month,rows), budget=Number(b.amount)||0, remaining=budget-spent, status=budgetStatus(budget,spent);
      var tr=document.createElement('tr');
      addCell(tr,b.month); addCell(tr,b.child); addCell(tr,fmt(budget)); addCell(tr,fmt(spent)); addCell(tr,fmt(remaining),remaining<0?'children-expenses-negative':'');
      var tdStatus=document.createElement('td'), badge=document.createElement('span'); badge.className='children-expenses-status '+status.cls; badge.textContent=status.text; tdStatus.appendChild(badge); tr.appendChild(tdStatus);
      var td=document.createElement('td'), wrap=document.createElement('div'); wrap.className='children-expenses-row-actions';
      if(canSpecial('children_expenses_budget')){ var edit=document.createElement('button'); edit.type='button'; edit.className='btn btn-ghost'; edit.textContent='تعديل'; edit.addEventListener('click',function(){ editBudget(b.id); }); wrap.appendChild(edit); var del=document.createElement('button'); del.type='button'; del.className='btn btn-danger'; del.textContent='حذف'; del.addEventListener('click',function(){ deleteBudget(b.id); }); wrap.appendChild(del); }
      if(!wrap.childNodes.length){ var ro=document.createElement('span'); ro.className='children-expenses-readonly-note'; ro.textContent='عرض فقط'; wrap.appendChild(ro); }
      td.appendChild(wrap); tr.appendChild(td); body.appendChild(tr);
    });
  }

  function numberOnly(n){ return Number(n)||0; }
  function yearOf(date){ var m=monthOf(date); return m ? m.slice(0,4) : ''; }
  function reportFilterRowsInternal(rows){
    var y=val('childrenReportYear'), m=val('childrenReportMonth'), child=val('childrenReportChild'), cat=val('childrenReportCategory');
    return (Array.isArray(rows)?rows:read()).filter(function(r){
      if(y && y!=='all' && yearOf(r.date)!==y) return false;
      if(m && m!=='all' && monthOf(r.date)!==m) return false;
      if(child && child!=='all' && String(r.child||'')!==child) return false;
      if(cat && cat!=='all' && String(r.category||'')!==cat) return false;
      return true;
    });
  }
  function annualFilterRows(rows){
    var y=val('childrenAnnualYear'), child=val('childrenAnnualChild'), cat=val('childrenAnnualCategory');
    return (Array.isArray(rows)?rows:read()).filter(function(r){
      if(y && y!=='all' && yearOf(r.date)!==y) return false;
      if(child && child!=='all' && String(r.child||'')!==child) return false;
      if(cat && cat!=='all' && String(r.category||'')!==cat) return false;
      return true;
    });
  }
  function groupRows(rows, fieldFn){
    var out={};
    rows.forEach(function(r){ var key=fieldFn(r)||'غير محدد'; if(!out[key]) out[key]={key:key,count:0,total:0}; out[key].count+=1; out[key].total+=numberOnly(r.amount); });
    return Object.keys(out).map(function(k){return out[k];}).sort(function(a,b){return b.total-a.total || String(a.key).localeCompare(String(b.key));});
  }
  function applyDefaultCurrentYear(id, years){
    var el=byId(id); if(!el) return;
    var already=el.getAttribute('data-children-default-year-applied')==='1';
    if(already && el.value && el.value!=='all') return;
    var cy=currentYear(), fallback=(years&&years.length?years[0]:'all');
    if(Array.prototype.some.call(el.options,function(o){return o.value===cy;})) el.value=cy;
    else if(fallback && Array.prototype.some.call(el.options,function(o){return o.value===fallback;})) el.value=fallback;
    el.setAttribute('data-children-default-year-applied','1');
  }
  function filterRowsByState(rows, state, skip){
    return (Array.isArray(rows)?rows:read()).filter(function(r){
      if(skip!=='year' && state.year && state.year!=='all' && yearOf(r.date)!==state.year) return false;
      if(skip!=='month' && state.month && state.month!=='all' && monthOf(r.date)!==state.month) return false;
      if(skip!=='child' && state.child && state.child!=='all' && String(r.child||'')!==state.child) return false;
      if(skip!=='category' && state.category && state.category!=='all' && String(r.category||'')!==state.category) return false;
      return true;
    });
  }
  function refillReportFilterSet(rows){
    var state={year:val('childrenReportYear'),month:val('childrenReportMonth'),child:val('childrenReportChild'),category:val('childrenReportCategory')};
    fillSelect('childrenReportYear', unique(filterRowsByState(rows,state,'year').map(function(r){return yearOf(r.date);})).sort().reverse(), null, 'كل السنوات');
    state.year=val('childrenReportYear');
    fillSelect('childrenReportMonth', unique(filterRowsByState(rows,state,'month').map(function(r){return monthOf(r.date);})).sort().reverse(), null, 'كل الشهور');
    state.month=val('childrenReportMonth');
    fillSelect('childrenReportChild', unique(filterRowsByState(rows,state,'child').map(function(r){return r.child;})).sort(), null, 'كل الأبناء');
    state.child=val('childrenReportChild');
    fillSelect('childrenReportCategory', unique(filterRowsByState(rows,state,'category').map(function(r){return r.category;})).sort(), null, 'كل الأنواع');
  }
  function refillAnnualFilterSet(rows, years){
    var state={year:val('childrenAnnualYear'),child:val('childrenAnnualChild'),category:val('childrenAnnualCategory')};
    fillSelect('childrenAnnualYear', unique(filterRowsByState(rows,state,'year').map(function(r){return yearOf(r.date);})).sort().reverse(), null, 'كل السنوات');
    applyDefaultCurrentYear('childrenAnnualYear', years);
    state.year=val('childrenAnnualYear');
    fillSelect('childrenAnnualChild', unique(filterRowsByState(rows,state,'child').map(function(r){return r.child;})).sort(), null, 'كل الأبناء');
    state.child=val('childrenAnnualChild');
    fillSelect('childrenAnnualCategory', unique(filterRowsByState(rows,state,'category').map(function(r){return r.category;})).sort(), null, 'كل الأنواع');
  }
  function refillTrendFilterSet(rows, years){
    var state={year:val('childrenTrendYear'),month:normalizeTrendMonthFilter(val('childrenTrendMonth')),child:val('childrenTrendChild')};
    fillSelect('childrenTrendYear', unique(filterRowsByState(rows,state,'year').map(function(r){return yearOf(r.date);})).sort().reverse(), null, 'كل السنوات');
    applyDefaultCurrentYear('childrenTrendYear', years);
    state.year=val('childrenTrendYear');
    var monthRows=filterRowsByState(rows,state,'month');
    var available=unique(monthRows.map(function(r){ var m=monthOf(r.date); return m ? m.slice(5,7) : ''; })).filter(Boolean);
    var monthPairs=MONTH_OPTIONS.filter(function(pair){ return available.indexOf(pair[0])!==-1; });
    fillSelectPairs('childrenTrendMonth', monthPairs, null, 'كل الشهور');
    state.month=normalizeTrendMonthFilter(val('childrenTrendMonth'));
    fillSelect('childrenTrendChild', unique(filterRowsByState(rows,state,'child').map(function(r){return r.child;})).sort(), null, 'كل الأبناء');
  }
  function fillReportFiltersInternal(rows){
    rows = Array.isArray(rows) ? rows : read();
    var years=unique(rows.map(function(r){return yearOf(r.date);})).sort().reverse();
    refillReportFilterSet(rows);
    refillAnnualFilterSet(rows, years);
    refillTrendFilterSet(rows, years);
    /* second pass keeps cascading lists consistent if a previous selection was reset because it became unavailable */
    refillReportFilterSet(rows);
    refillAnnualFilterSet(rows, years);
    refillTrendFilterSet(rows, years);
  }
  function addEmpty(body, span, text){ var tr=document.createElement('tr'), td=document.createElement('td'); td.colSpan=span; td.className='children-expenses-empty'; td.textContent=text; tr.appendChild(td); body.appendChild(tr); }
  function renderGroupTableInternal(id, rows, label){
    var body=byId(id); if(!body) return;
    while(body.firstChild) body.removeChild(body.firstChild);
    if(!rows.length){ addEmpty(body,3,'لا توجد بيانات في هذا التقرير'); return; }
    rows.forEach(function(r){ var tr=document.createElement('tr'); addCell(tr,r.key); addCell(tr,r.count); addCell(tr,fmt(r.total)); body.appendChild(tr); });
    var totalCount=rows.reduce(function(s,r){return s+numberOnly(r.count);},0), totalAmount=rows.reduce(function(s,r){return s+numberOnly(r.total);},0);
    var totalTr=document.createElement('tr'); totalTr.className='children-expenses-total-row';
    addCell(totalTr,'الإجمالي'); addCell(totalTr,totalCount); addCell(totalTr,fmt(totalAmount)); body.appendChild(totalTr);
  }
  function renderMonthReportInternal(rows, targetId){
    var body=byId(targetId||'childrenReportByMonth'); if(!body) return;
    while(body.firstChild) body.removeChild(body.firstChild);
    var months=groupRows(rows,function(r){return monthOf(r.date);});
    if(!months.length){ addEmpty(body,5,'لا توجد بيانات شهرية في الفلتر الحالي'); return; }
    var budgets=readBudgets();
    var totalCount=0, totalExpense=0, totalBudget=0;
    months.forEach(function(m){
      var budgetTotal=budgets.filter(function(b){return normalizedMonth(b.month)===m.key;}).reduce(function(s,b){return s+numberOnly(b.amount);},0);
      var remaining=budgetTotal-m.total;
      totalCount+=numberOnly(m.count); totalExpense+=numberOnly(m.total); totalBudget+=budgetTotal;
      var tr=document.createElement('tr'); addCell(tr,m.key); addCell(tr,m.count); addCell(tr,fmt(m.total)); addCell(tr,fmt(budgetTotal)); addCell(tr,fmt(remaining),remaining<0?'children-expenses-negative':''); body.appendChild(tr);
    });
    var totalTr=document.createElement('tr'); totalTr.className='children-expenses-total-row';
    addCell(totalTr,'الإجمالي'); addCell(totalTr,totalCount); addCell(totalTr,fmt(totalExpense)); addCell(totalTr,fmt(totalBudget)); addCell(totalTr,fmt(totalBudget-totalExpense),(totalBudget-totalExpense)<0?'children-expenses-negative':''); body.appendChild(totalTr);
  }
  function renderReportSummaryInternal(rows, targetId){
    var box=byId(targetId||'childrenReportSummary'); if(!box) return;
    while(box.firstChild) box.removeChild(box.firstChild);
    var total=rows.reduce(function(s,r){return s+numberOnly(r.amount);},0), count=rows.length;
    var topChild=groupRows(rows,function(r){return r.child;})[0];
    var topCat=groupRows(rows,function(r){return r.category;})[0];
    [['إجمالي التقرير',fmt(total)],['عدد العمليات',String(count)],['أعلى ابن',topChild?topChild.key+' — '+fmt(topChild.total):'-'],['أعلى بند',topCat?topCat.key+' — '+fmt(topCat.total):'-']].forEach(function(x){ var c=document.createElement('div'); c.className='children-expenses-report-pill'; var s=document.createElement('span'); s.textContent=x[0]; var b=document.createElement('b'); b.textContent=x[1]; c.appendChild(s); c.appendChild(b); box.appendChild(c); });
  }
  function renderReportsInternal(rows){
    fillReportFiltersInternal(rows);
    var filtered=reportFilterRowsInternal(rows);
    renderReportSummaryInternal(filtered);
    renderGroupTableInternal('childrenReportByChild', groupRows(filtered,function(r){return r.child;}), 'الابن');
    renderGroupTableInternal('childrenReportByCategory', groupRows(filtered,function(r){return r.category;}), 'نوع المصروف');
    renderMonthReportInternal(filtered, 'childrenReportByMonth');
    renderAnnualReports(rows);
  }
  function trendFilterRowsInternal(rows){
    var y=val('childrenTrendYear'), m=normalizeTrendMonthFilter(val('childrenTrendMonth')), child=val('childrenTrendChild');
    return (Array.isArray(rows)?rows:read()).filter(function(r){
      var p=dateParts(r.date);
      if(y && y!=='all' && yearOf(r.date)!==y) return false;
      if(m && m!=='all' && (!p || p.month!==m)) return false;
      if(child && child!=='all' && String(r.child||'')!==child) return false;
      return true;
    });
  }
  function renderAnnualTrendDashboardInternal(rows){
    var box=byId('childrenAnnualTrendDashboard'), summary=byId('childrenTrendSummary'), canvas=byId('childrenAnnualTrendChart');
    if(box){ while(box.firstChild) box.removeChild(box.firstChild); box.style.display='none'; box.setAttribute('aria-hidden','true'); }
    if(summary){ while(summary.firstChild) summary.removeChild(summary.firstChild); }
    var filtered=trendFilterRowsInternal(rows), months=['01','02','03','04','05','06','07','08','09','10','11','12'];
    var monthLabels=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    var totals={}, counts={}, max=0, total=0;
    months.forEach(function(mm){ totals[mm]=0; counts[mm]=0; });
    filtered.forEach(function(r){ var mo=monthOf(r.date), m=String(mo||'').slice(5,7); if(!totals.hasOwnProperty(m)) return; totals[m]+=numberOnly(r.amount); counts[m]+=1; total+=numberOnly(r.amount); if(totals[m]>max) max=totals[m]; });
    if(summary){ [['إجمالي الاتجاه',fmt(total)],['عدد العمليات',String(filtered.length)],['متوسط شهري',fmt(total/12)]].forEach(function(x){ var p=document.createElement('div'); p.className='children-expenses-trend-pill'; var s=document.createElement('span'); s.textContent=x[0]; var b=document.createElement('b'); b.textContent=x[1]; p.appendChild(s); p.appendChild(b); summary.appendChild(p); }); }
    var values=months.map(function(mm){return totals[mm]||0;});
    if(canvas && window.Chart){
      try{
        if(childrenAnnualTrendChart && typeof childrenAnnualTrendChart.destroy==='function') childrenAnnualTrendChart.destroy();
        var ctx=canvas.getContext('2d');
        var g=ctx.createLinearGradient(0,0,0,260); g.addColorStop(0,'rgba(124,58,237,.95)'); g.addColorStop(1,'rgba(64,214,255,.55)');
        childrenAnnualTrendChart=new Chart(ctx,{
          type:'bar',
          data:{
            labels:monthLabels,
            datasets:[{
              label:'مصروفات الأبناء',
              data:values,
              backgroundColor:g,
              borderColor:'rgba(103,232,249,.90)',
              borderWidth:1.5,
              borderRadius:10,
              barThickness:'flex',
              maxBarThickness:42
            }]
          },
          options:{
            responsive:true,
            maintainAspectRatio:false,
            layout:{padding:{top:24,right:8,left:8,bottom:2}},
            plugins:{
              legend:{display:false},
              tooltip:{
                rtl:true,
                bodyFont:{family:'Cairo'},
                titleFont:{family:'Cairo',weight:'900'},
                callbacks:{label:function(c){return fmt(c.parsed.y||0);}}
              },
              petatoeLabels:{enabled:true,money:false,fullMoney:true,color:'#ffffff',strokeColor:'rgba(15,23,42,.85)',strokeWidth:4}
            },
            scales:{
              x:{
                ticks:{color:'#ffffff',font:{family:'Cairo',weight:'800'}},
                grid:{display:false}
              },
              y:{
                beginAtZero:true,
                ticks:{color:'#ffffff',callback:function(v){return Number(v||0).toLocaleString('en-US');}},
                grid:{color:'rgba(148,163,184,.13)'}
              }
            }
          }
        });
        if(box) box.style.display='none';
        return;
      }catch(e){ if(box) box.style.display='none'; }
    }
    if(!box) return;
    box.style.display='none';
    return;
    months.forEach(function(mm){
      var row=document.createElement('div'); row.className='children-expenses-trend-row';
      var label=document.createElement('b'); label.textContent=mm;
      var track=document.createElement('div'); track.className='children-expenses-trend-track';
      var bar=document.createElement('span'); bar.style.width=(max>0?Math.max(4,(totals[mm]/max)*100):0)+'%'; track.appendChild(bar);
      var value=document.createElement('strong'); value.textContent=fmt(totals[mm])+' / '+counts[mm]+' عملية';
      row.appendChild(label); row.appendChild(track); row.appendChild(value); box.appendChild(row);
    });
  }
  function renderAnnualReportsInternal(rows){
    var filtered=annualFilterRows(rows);
    renderReportSummaryInternal(filtered, 'childrenAnnualSummary');
    renderMonthReportInternal(filtered, 'childrenAnnualByMonth');
    renderGroupTableInternal('childrenAnnualByChild', groupRows(filtered,function(r){return r.child;}), 'الابن');
    renderGroupTableInternal('childrenAnnualByCategory', groupRows(filtered,function(r){return r.category;}), 'نوع المصروف');
    renderAnnualTrendDashboard(rows);
  }
  function resetReportFiltersInternal(){ setVal('childrenReportYear','all'); setVal('childrenReportMonth','all'); setVal('childrenReportChild','all'); setVal('childrenReportCategory','all'); render(); }
  function resetAnnualFiltersInternal(){ setVal('childrenAnnualYear','all'); setVal('childrenAnnualChild','all'); setVal('childrenAnnualCategory','all'); render(); }
  function csvCell(v){ return '"'+String(v==null?'':v).replace(/"/g,'""')+'"'; }
  function exportReportExcelInternal(){
    if(!canSpecial('children_expenses_export')){ deny('ليس لديك صلاحية تصدير تقارير مصروفات الأبناء'); return; }
    var rows=reportFilterRowsInternal(read());
    if(!rows.length){ if(window.toast) window.toast('لا توجد بيانات للتصدير'); else alert('لا توجد بيانات للتصدير'); return; }
    var lines=[['التاريخ','الابن','نوع المصروف','طريقة الدفع','المبلغ','ملاحظات'].map(csvCell).join(',')];
    rows.forEach(function(r){ lines.push([r.date,r.child,r.category,r.payment,numberOnly(r.amount),r.notes||''].map(csvCell).join(',')); });
    var blob=new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8;'});
    var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='children-expenses-report-'+today()+'.csv'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); if(a.parentNode) a.parentNode.removeChild(a); },0);
    if(window.toast) window.toast('تم تصدير تقرير المصروفات');
  }
  function openPrintHtml(html, features){try{var blob=new Blob([String(html||'')],{type:'text/html;charset=utf-8'});var url=URL.createObjectURL(blob);var w=window.open(url,'_blank',features||'width=1100,height=800');if(w)setTimeout(function(){try{URL.revokeObjectURL(url)}catch(_e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('children-expenses/children-legacy-engine.js',_e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('children-expenses/children-legacy-engine.js',_petatoeSilentCatch);}}},60000);return w;}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('children-expenses/children-legacy-engine.js',e);return null;}}
  function htmlEsc(v){ return String(v==null?'':v).replace(/[&<>"']/g,function(ch){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]; }); }
  function printReportInternal(){
    if(!canSpecial('children_expenses_export')){ deny('ليس لديك صلاحية طباعة تقارير مصروفات الأبناء'); return; }
    var rows=reportFilterRowsInternal(read());
    if(!rows.length){ if(window.toast) window.toast('لا توجد بيانات للطباعة'); else alert('لا توجد بيانات للطباعة'); return; }
    var total=rows.reduce(function(s,r){return s+numberOnly(r.amount);},0);
    var trs=rows.map(function(r,i){ return '<tr><td>'+htmlEsc(i+1)+'</td><td>'+htmlEsc(r.date)+'</td><td>'+htmlEsc(r.child)+'</td><td>'+htmlEsc(r.category)+'</td><td>'+htmlEsc(r.payment)+'</td><td>'+htmlEsc(fmt(r.amount))+'</td><td>'+htmlEsc(r.notes||'-')+'</td></tr>'; }).join('');
    var printHtml='<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>تقرير مصروفات الأبناء</title><style>body{font-family:Cairo,Arial,sans-serif;margin:24px;color:#111827}h1{margin:0 0 8px}.meta{display:flex;gap:12px;flex-wrap:wrap;margin:10px 0 18px}.pill{border:1px solid #d1d5db;border-radius:12px;padding:8px 12px;background:#f9fafb}table{width:100%;border-collapse:collapse}th,td{border:1px solid #d1d5db;padding:8px;text-align:right;font-size:12px}th{background:#f3f4f6}.total{margin-top:14px;font-weight:800}@media print{button{display:none}}</style></head><body><h1>تقرير مصروفات الأبناء</h1><div class="meta"><div class="pill">تاريخ التقرير: '+htmlEsc(today())+'</div><div class="pill">عدد العمليات: '+htmlEsc(rows.length)+'</div><div class="pill">الإجمالي: '+htmlEsc(fmt(total))+'</div></div><table><thead><tr><th>#</th><th>التاريخ</th><th>الابن</th><th>النوع</th><th>طريقة الدفع</th><th>المبلغ</th><th>ملاحظات</th></tr></thead><tbody>'+trs+'</tbody></table><div class="total">الإجمالي: '+htmlEsc(fmt(total))+'</div><script>window.onload=function(){setTimeout(function(){window.print();},150)}<\/script></body></html>';
    var w=openPrintHtml(printHtml,'width=1100,height=800');
    if(!w){ alert('المتصفح منع نافذة الطباعة'); return; }
  }

  function ensureAnnualResetPlacement(){
    var filters=document.querySelector('#childrenExpenses [data-children-expenses-panel="annual"] .children-expenses-annual-filters');
    if(!filters) return;
    var typeLabel=filters.querySelector('.children-expenses-annual-type-filter');
    var resetBtn=filters.querySelector('.children-expenses-annual-reset-inline, .children-expenses-filter-reset[onclick*="resetAnnualFilters"]');
    if(!typeLabel || !resetBtn) return;
    var row=filters.querySelector('.children-expenses-annual-type-reset-row');
    if(!row){
      row=document.createElement('div');
      row.className='children-expenses-annual-type-reset-row';
      filters.appendChild(row);
    }
    if(typeLabel.parentElement!==row) row.appendChild(typeLabel);
    if(resetBtn.parentElement!==row) row.appendChild(resetBtn);
  }

  function render(){
    ensureAnnualResetPlacement(); if(!can('view')){ var panel=byId('childrenExpenses'); if(panel){ var card=document.createElement('div'); card.className='children-expenses-card'; var h=document.createElement('h3'); h.textContent='غير متاح'; var p=document.createElement('p'); p.textContent='ليس لديك صلاحية عرض قسم مصروفات الأبناء.'; card.appendChild(h); card.appendChild(p); panel.replaceChildren(card); } return; } applyPermissionsUi(); var rows=read(); renderFilters(rows); renderKpis(rows); renderBudgets(rows); renderReports(rows); renderTable(rows); applyPermissionsUi(); applyActiveTab(); }
  function clearForm(){ setVal('childrenExpenseId',''); setVal('childrenExpenseDate',today()); setVal('childrenExpenseChild',''); setVal('childrenExpenseCategory','مصروف يومي'); setVal('childrenExpensePayment','كاش'); setVal('childrenExpenseAmount',''); setVal('childrenExpenseNotes',''); }
  function clearBudgetFormInternal(){ setVal('childrenBudgetMonth',currentMonth()); setVal('childrenBudgetChild',''); setVal('childrenBudgetAmount',''); }
  function resetFiltersInternal(){ setVal('childrenExpensesSearch',''); setVal('childrenExpensesYear',currentYear()); setVal('childrenExpensesMonth',currentMonth()); setVal('childrenExpensesChildFilter','all'); render(); }
  function saveFromFormInternal(){
    if(!can('add')){ deny('ليس لديك صلاحية إضافة مصروفات الأبناء'); return; }
    var child=val('childrenExpenseChild'), date=val('childrenExpenseDate')||today(), amount=Number(val('childrenExpenseAmount'));
    if(!child){ if(window.toast) window.toast('اكتب اسم الابن'); else alert('اكتب اسم الابن'); return; }
    if(!isFinite(amount) || amount<=0){ if(window.toast) window.toast('اكتب مبلغ صحيح'); else alert('اكتب مبلغ صحيح'); return; }
    var rows=read(), id=val('childrenExpenseId'), now=new Date().toISOString();
    var row={id:id||makeId('ce'),date:date,child:child,category:val('childrenExpenseCategory')||'أخرى',payment:val('childrenExpensePayment')||'كاش',amount:Math.round(amount*100)/100,notes:val('childrenExpenseNotes'),createdAt:now,updatedAt:now};
    var idx=rows.findIndex(function(x){return x.id===id;});
    if(idx>=0){ row.createdAt=rows[idx].createdAt||now; rows[idx]=row; } else rows.push(row);
    write(rows); clearForm(); render();
    if(window.toast) window.toast(idx>=0?'تم تعديل المصروف':'تم حفظ المصروف');
  }
  function saveBudgetFromFormInternal(){
    if(!canSpecial('children_expenses_budget')){ deny('ليس لديك صلاحية إدارة ميزانية مصروفات الأبناء'); return; }
    var month=val('childrenBudgetMonth')||currentMonth(), child=val('childrenBudgetChild'), amount=Number(val('childrenBudgetAmount'));
    if(!/^\d{4}-\d{2}$/.test(month)){ if(window.toast) window.toast('حدد شهر صحيح'); else alert('حدد شهر صحيح'); return; }
    if(!child){ if(window.toast) window.toast('اكتب اسم الابن'); else alert('اكتب اسم الابن'); return; }
    if(!isFinite(amount) || amount<0){ if(window.toast) window.toast('اكتب ميزانية صحيحة'); else alert('اكتب ميزانية صحيحة'); return; }
    var rows=readBudgets(), now=new Date().toISOString();
    var idx=rows.findIndex(function(x){return String(x.month||'')===month && String(x.child||'')===child;});
    var row={id:idx>=0?rows[idx].id:makeId('ceb'),month:month,child:child,amount:Math.round(amount*100)/100,createdAt:idx>=0?(rows[idx].createdAt||now):now,updatedAt:now};
    if(idx>=0) rows[idx]=row; else rows.push(row);
    writeBudgets(rows); clearBudgetForm(); render();
    if(window.toast) window.toast(idx>=0?'تم تعديل الميزانية':'تم حفظ الميزانية');
  }
  function editRowInternal(id){
    if(!can('edit')){ deny('ليس لديك صلاحية تعديل مصروفات الأبناء'); return; }
    var r=read().find(function(x){return x.id===id;}); if(!r) return;
    setVal('childrenExpenseId',r.id); setVal('childrenExpenseDate',r.date||today()); setVal('childrenExpenseChild',r.child); setVal('childrenExpenseCategory',r.category||'أخرى'); setVal('childrenExpensePayment',r.payment||'كاش'); setVal('childrenExpenseAmount',r.amount); setVal('childrenExpenseNotes',r.notes||'');
    setTab('entry'); var panel=byId('childrenExpenses'); if(panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function editBudgetInternal(id){
    if(!canSpecial('children_expenses_budget')){ deny('ليس لديك صلاحية إدارة ميزانية مصروفات الأبناء'); return; }
    var b=readBudgets().find(function(x){return x.id===id;}); if(!b) return;
    setVal('childrenBudgetMonth',b.month||currentMonth()); setVal('childrenBudgetChild',b.child||''); setVal('childrenBudgetAmount',b.amount||0);
    setTab('budget'); var el=byId('childrenBudgetMonth'); if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
  }
  function deleteRowInternal(id){
    if(!can('delete')){ deny('ليس لديك صلاحية حذف مصروفات الأبناء'); return; }
    var rows=read(), r=rows.find(function(x){return x.id===id;}); if(!r) return;
    if(!confirm('حذف مصروف '+(r.child||'')+'؟')) return;
    write(rows.filter(function(x){return x.id!==id;})); render(); if(window.toast) window.toast('تم حذف المصروف');
  }
  function deleteBudgetInternal(id){
    if(!canSpecial('children_expenses_budget')){ deny('ليس لديك صلاحية إدارة ميزانية مصروفات الأبناء'); return; }
    var rows=readBudgets(), b=rows.find(function(x){return x.id===id;}); if(!b) return;
    if(!confirm('حذف ميزانية '+(b.child||'')+' لشهر '+(b.month||'')+'؟')) return;
    writeBudgets(rows.filter(function(x){return x.id!==id;})); render(); if(window.toast) window.toast('تم حذف الميزانية');
  }
  window.__PETATOEChildrenExpensesEntryInternal = {
    clearForm: clearForm,
    saveFromForm: saveFromFormInternal,
    editRow: editRowInternal,
    deleteRow: deleteRowInternal,
    read: read,
    write: write
  };
  window.__PETATOEChildrenExpensesBudgetInternal = {
    renderBudgets: renderBudgetsInternal,
    clearBudgetForm: clearBudgetFormInternal,
    saveBudgetFromForm: saveBudgetFromFormInternal,
    editBudget: editBudgetInternal,
    deleteBudget: deleteBudgetInternal,
    readBudgets: readBudgets,
    writeBudgets: writeBudgets,
    budgetStatus: budgetStatus
  };
  window.__PETATOEChildrenExpensesRecordsInternal = {
    currentRows: currentRowsInternal,
    matchesLogFilter: matchesLogFilterInternal,
    renderFilters: renderFiltersInternal,
    renderKpis: renderKpisInternal,
    renderTable: renderTableInternal,
    resetFilters: resetFiltersInternal,
    read: read
  };
  window.__PETATOEChildrenExpensesReportsInternal = {
    reportFilterRows: reportFilterRowsInternal,
    fillReportFilters: fillReportFiltersInternal,
    groupRows: groupRows,
    renderGroupTable: renderGroupTableInternal,
    renderMonthReport: renderMonthReportInternal,
    renderReportSummary: renderReportSummaryInternal,
    renderReports: renderReportsInternal,
    resetReportFilters: resetReportFiltersInternal,
    exportReportExcel: exportReportExcelInternal,
    printReport: printReportInternal,
    read: read
  };
  window.__PETATOEChildrenExpensesChartsInternal = {
    trendFilterRows: trendFilterRowsInternal,
    renderAnnualTrendDashboard: renderAnnualTrendDashboardInternal,
    read: read
  };
  window.__PETATOEChildrenExpensesAnnualInternal = {
    annualFilterRows: annualFilterRows,
    renderAnnualReports: renderAnnualReportsInternal,
    resetAnnualFilters: resetAnnualFiltersInternal,
    renderAnnualTrendDashboard: renderAnnualTrendDashboard,
    read: read
  };
  function renderBudgets(rows){ return callChildrenModule('budget','renderBudgets',arguments,renderBudgetsInternal); }
  function clearBudgetForm(){ return callChildrenModule('budget','clearBudgetForm',arguments,clearBudgetFormInternal); }
  function saveBudgetFromForm(){ return callChildrenModule('budget','saveBudgetFromForm',arguments,saveBudgetFromFormInternal); }
  function editBudget(id){ return callChildrenModule('budget','editBudget',arguments,editBudgetInternal); }
  function deleteBudget(id){ return callChildrenModule('budget','deleteBudget',arguments,deleteBudgetInternal); }
  function currentRows(){ return callChildrenModule('records','currentRows',arguments,currentRowsInternal); }
  function renderFilters(rows){ return callChildrenModule('records','renderFilters',arguments,renderFiltersInternal); }
  function renderKpis(rows){ return callChildrenModule('records','renderKpis',arguments,renderKpisInternal); }
  function renderTable(rows){ return callChildrenModule('records','renderTable',arguments,renderTableInternal); }
  function resetFilters(){ return callChildrenModule('records','resetFilters',arguments,resetFiltersInternal); }
  function renderReports(rows){ return callChildrenModule('reports','renderReports',arguments,renderReportsInternal); }
  function trendFilterRows(rows){ return callChildrenModule('charts','trendFilterRows',arguments,trendFilterRowsInternal); }
  function renderAnnualTrendDashboard(rows){ return callChildrenModule('charts','renderAnnualTrendDashboard',arguments,renderAnnualTrendDashboardInternal); }
  function renderAnnualReports(rows){ return callChildrenModule('annual','renderAnnualReports',arguments,renderAnnualReportsInternal); }
  function resetAnnualFilters(){ return callChildrenModule('annual','resetAnnualFilters',arguments,resetAnnualFiltersInternal); }
  function resetReportFilters(){ return callChildrenModule('reports','resetReportFilters',arguments,resetReportFiltersInternal); }
  function exportReportExcel(){ return callChildrenModule('reports','exportReportExcel',arguments,exportReportExcelInternal); }
  function printReport(){ return callChildrenModule('reports','printReport',arguments,printReportInternal); }
  function saveFromForm(){ return callChildrenModule('entry','saveFromForm',arguments,saveFromFormInternal); }
  function editRow(id){ return callChildrenModule('entry','editRow',arguments,editRowInternal); }
  function deleteRow(id){ return callChildrenModule('entry','deleteRow',arguments,deleteRowInternal); }
  function init(){ clearForm(); clearBudgetForm(); render(); }
  var legacyApi={__ready:true,__legacyEngine:true,render:render,setTab:setTab,clearForm:clearForm,clearBudgetForm:clearBudgetForm,resetFilters:resetFilters,resetReportFilters:resetReportFilters,resetAnnualFilters:resetAnnualFilters,saveFromForm:saveFromForm,saveBudgetFromForm:saveBudgetFromForm,editRow:editRow,deleteRow:deleteRow,editBudget:editBudget,deleteBudget:deleteBudget,exportReportExcel:exportReportExcel,printReport:printReport,read:read,readBudgets:readBudgets};
  window.__PETATOEChildrenExpensesLegacyEngine = legacyApi;
  window.PETATOEChildrenExpenses = legacyApi;
  document.addEventListener('petatoe:tabchange', function(e){ if(e&&e.detail&&e.detail.tabId==='childrenExpenses') setTimeout(render,40); });
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
