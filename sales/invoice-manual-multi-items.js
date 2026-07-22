(function(){
  if(window.__PETATOE_INVOICE_MANUAL_MULTI_ITEMS_SINGLETON__) return;
  window.__PETATOE_INVOICE_MANUAL_MULTI_ITEMS_SINGLETON__ = true;
  var STATE={mode:'new',selectedInvoice:'',baseSave:null,baseClear:null,booted:false,saving:false};
  function id(x){return document.getElementById(x)}

  function safeRender(target, html, reason){var el=(typeof target==='string')?id(target):target;if(!el)return false;try{if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.htmlTrusted==='function')return window.PETATOESafeRender.htmlTrusted(el,html,reason||'invoice manual trusted template')}catch(e){console.warn('invoice safeRender fallback',e)}el.textContent='';el.insertAdjacentHTML('beforeend',String(html==null?'':html));return true}
  function safeClear(target){var el=(typeof target==='string')?id(target):target;if(!el)return false;try{if(window.PETATOESafeRender&&window.PETATOESafeRender.clear)return window.PETATOESafeRender.clear(el)}catch(e){try{if(window.PETATOECaptureSilentCatch)window.PETATOECaptureSilentCatch('sales/invoice-manual-multi-items.js',e,{phase:'v6.5.9-risk-cleanup'});}catch(_petatoeSilentCatch){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('sales/invoice-manual-multi-items.js',_petatoeSilentCatch);}}el.textContent='';return true}
  function safeAppend(target, html, reason){var el=(typeof target==='string')?id(target):target;if(!el)return false;try{if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.appendTrusted==='function')return window.PETATOESafeRender.appendTrusted(el,html,reason||'invoice manual trusted append')}catch(e){console.warn('invoice safeAppend fallback',e)}el.insertAdjacentHTML('beforeend',String(html==null?'':html));return true}
  function qsa(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function n(v){try{return typeof parseNum==='function'?parseNum(v):(parseFloat(String(v||'').replace(/,/g,''))||0)}catch(e){return parseFloat(String(v||'').replace(/,/g,''))||0}}
  function mny(v){try{return typeof money==='function'?money(v):(Number(v||0).toFixed(2)+' SAR')}catch(e){return (Number(v||0).toFixed(2)+' SAR')}}
  function note(v){try{toast(v)}catch(e){if(window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info)window.PETATOEDiagnostics.info('invoice-manual-multi-items',{message:v});}}
  function arr(){try{return (window.PETATOEDataSource&&window.PETATOEDataSource.getRecordsSync)?window.PETATOEDataSource.getRecordsSync():[]}catch(e){return []}}
  async function commitManualRowsToSupabase(rows){
    rows=Array.isArray(rows)?rows.filter(function(r){return r && !r.supabase_id && !r.__petatoeManualSupabasePending;}):[];
    if(!rows.length) return {ok:true,skipped:true,rows:0};
    if(!(window.PETATOEDataLayer && typeof window.PETATOEDataLayer.insertSalesRecords==='function')){
      return {ok:false,error:'PETATOEDataLayer.insertSalesRecords unavailable'};
    }
    rows.forEach(function(r){try{r.__petatoeManualSupabasePending=true;}catch(_e){}});
    try{
      var res=await window.PETATOEDataLayer.insertSalesRecords(rows,{source:'manual-invoice-entry'});
      if(!res || !res.ok){
        console.warn('[PETATOE Manual Invoice] Supabase save failed',res);
        return res||{ok:false,error:'Supabase save failed'};
      }
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.refreshSalesRecordsFromSupabase==='function'){
        await window.PETATOEDataSource.refreshSalesRecordsFromSupabase('manual-invoice-supabase-commit');
      }
      return res;
    }catch(e){
      console.warn('[PETATOE Manual Invoice] Supabase save crashed',e);
      return {ok:false,error:e&&e.message?e.message:String(e)};
    }finally{
      rows.forEach(function(r){try{delete r.__petatoeManualSupabasePending;}catch(_e){}});
    }
  }

  async function assertCommissionRowsUnlocked(rows){
    var guard=window.PETATOECommissionPeriodGuard;
    if(!guard||typeof guard.assertRowsUnlocked!=='function'){
      note(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر التحقق من قفل شهر العمولات'):'Unable to verify the commission month lock');
      return false;
    }
    var result=await guard.assertRowsUnlocked(rows||[]);
    if(!result||result.ok!==true){
      var periods=result&&result.lockedPeriods&&result.lockedPeriods.length?result.lockedPeriods.join('، '):'';
      var msg='لا يمكن تعديل فواتير شهر عمولات مقفول';
      note((window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime(msg):msg)+(periods?' — '+periods:''));
      return false;
    }
    return true;
  }
  function setSaveBusy(busy){
    STATE.saving=!!busy;
    var btn=id('saveBtn');
    if(btn){btn.disabled=STATE.saving;btn.setAttribute('aria-busy',STATE.saving?'true':'false');}
  }
  async function deleteInvoiceFromSupabase(no, reason){
    no=invKey(no);
    if(!no) return {ok:false,error:'empty invoice number'};
    if(!(window.PETATOEDataLayer && typeof window.PETATOEDataLayer.deleteSalesInvoice==='function')){
      return {ok:true,skipped:true,reason:'PETATOEDataLayer.deleteSalesInvoice unavailable'};
    }
    try{
      var res=await window.PETATOEDataLayer.deleteSalesInvoice(no);
      if(!res || !res.ok){
        console.warn('[PETATOE Manual Invoice] Supabase invoice delete failed',no,res);
        return res||{ok:false,error:'Supabase delete failed'};
      }
      if(window.PETATOEDataSource && typeof window.PETATOEDataSource.refreshSalesRecordsFromSupabase==='function'){
        try{window.PETATOEDataSource.refreshSalesRecordsFromSupabase(reason||'manual-invoice-delete');}catch(_refreshErr){}
      }
      return res;
    }catch(e){
      console.warn('[PETATOE Manual Invoice] Supabase invoice delete crashed',e);
      return {ok:false,error:e&&e.message?e.message:String(e)};
    }
  }
  function stripSupabaseIdentity(rows){
    return (Array.isArray(rows)?rows:[]).map(function(row){
      var r=Object.assign({},row||{});
      try{delete r.supabase_id;delete r.__petatoeManualSupabasePending;delete r.__petatoeSupabasePending;}catch(_e){}
      return r;
    });
  }
  function setArr(v){
    try{
      var safe=Array.isArray(v)?v:[];
      if(window.PETATOEDataSource&&window.PETATOEDataSource.syncRecordsCache){
        window.PETATOEDataSource.syncRecordsCache(safe,{reason:'manual-invoice-runtime-sync'});
        commitManualRowsToSupabase(safe);
        return true;
      }
      if(window.PETATOEDataSource&&window.PETATOEDataSource.setRecordsSync){window.PETATOEDataSource.setRecordsSync(safe);return true}
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}return false}
  function normDate(v){try{return typeof parseDate==='function'?parseDate(v):(v||'')}catch(e){return v||''}}
  function rowDate(r){return normDate(r&&r.date)||String(r&&r.date||'')}
  function invKey(v){return String(v==null?'':v).trim()}
  function badInv(v){var s=invKey(v);return !s||/^__?row_/i.test(s)||s==='undefined'||s==='null'}
  function monthVal(r){try{return typeof normalizeMonth==='function'?normalizeMonth(r.month,r.date):(r.month||'')}catch(e){return r.month||''}}
  function yearVal(r){var d=rowDate(r);var m=String(d||'').match(/(20\d{2})/);return m?m[1]:''}
  function dayVal(r){var d=rowDate(r);var m=String(d||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]:''}
  function monthName(m){try{var raw=(typeof MAR==='object'&&MAR[m])?MAR[m]:m;return (window.PETATOE_GLOBAL_SCREEN_TRANSLATOR&&window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName)?window.PETATOE_GLOBAL_SCREEN_TRANSLATOR.monthName(raw):raw}catch(e){return m}}
  function nextLegacy(used){var x=30000001;while(used[String(x)])x++;return String(x)}
  function normalizeLegacyInvoices(){
    var data=arr(),used={},changed=false,rowMap={};
    data.forEach(function(r){var s=invKey(r.invoice);if(s&&!badInv(s))used[s]=1});
    data.forEach(function(r){var s=invKey(r.invoice);if(badInv(s)){var base='';try{base=String(r.id||'')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}; if(rowMap[s||base]){r.invoice=rowMap[s||base]}else{var no=nextLegacy(used);used[no]=1;rowMap[s||base]=no;r.invoice=no}r.__petatoeLegacyInvoiceNo=true;changed=true;}});
    if(changed){try{if(typeof _invalidateSearchIndex==='function')_invalidateSearchIndex()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);};try{save()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}}
  }
  function itemList(){
    var map={};arr().forEach(function(r){var it=String(r.item||'').trim();if(it)map[it]=1});
    return Object.keys(map).sort(function(a,b){return a.localeCompare(b,'ar')});
  }
  function itemOptions(selected){var list=itemList();selected=String(selected||'').trim();if(selected&&list.indexOf(selected)<0)list.unshift(selected);return list.map(function(x){return '<option value="'+esc(x)+'"></option>'}).join('')}
  function updateItemDatalist(){try{var dl=id('petEntryItemOptions');if(!dl){dl=document.createElement('datalist');dl.id='petEntryItemOptions';document.body.appendChild(dl)}safeRender(dl,itemOptions(''),'invoice item datalist')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}}
  function lastItemRecord(name){name=String(name||'').trim();if(!name)return null;var data=arr().slice().reverse();for(var i=0;i<data.length;i++){if(String(data[i].item||'').trim()===name)return data[i]}return null}
  function applyItemSuggestion(inp){try{if(!inp)return;var row=inp.closest('.entry-item-row');if(!row)return;var r=lastItemRecord(inp.value);if(!r)return;var price=row.querySelector('[data-field="price"]'),disc=row.querySelector('[data-field="disc"]'),tax=row.querySelector('[data-field="tax"]'),ex=row.querySelector('[data-field="totalEx"]'),inc=row.querySelector('[data-field="totalInc"]');if(price&&!String(price.value||'').trim()&&r.price!=null)price.value=r.price;if(disc&&!String(disc.value||'').trim()&&r.disc!=null)disc.value=r.disc;if(tax&&!String(tax.value||'').trim()&&r.tax!=null)tax.value=r.tax;if(ex&&!String(ex.value||'').trim()&&r.totalEx!=null)ex.value=r.totalEx;if(inc&&!String(inc.value||'').trim()&&r.totalInc!=null)inc.value=r.totalInc;if(typeof updateEntryInvoiceTotal==='function')updateEntryInvoiceTotal()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}}
  window.petatoeEntryApplyItemSuggestion=applyItemSuggestion;
  function overrideEntryItemRowHtml(){
    try{
      window.entryItemRowHtml=function(idx,row){row=row||{};var suf=idx===0?'':'_'+idx;var canDelete=idx===0?'':'<button type="button" class="entry-item-del" data-entry-action="remove-row">🗑️</button>';
        return '<div class="entry-item-row" data-entry-item-row="1">'+
        '<div><label>اسم الصنف</label><input id="e_item'+suf+'" data-field="item" type="search" list="petEntryItemOptions" value="'+esc(row.item||'')+'" placeholder="ابحث أو اختر صنف" autocomplete="off" data-entry-suggest="1"></div>'+
        '<div><label>الكمية</label><input id="e_qty'+suf+'" data-field="qty" type="number" step="0.01" value="'+esc(row.qty==null?1:row.qty)+'"></div>'+
        '<div><label>سعر الوحدة</label><input id="e_price'+suf+'" data-field="price" type="number" step="0.01" value="'+esc(row.price==null?'':row.price)+'"></div>'+
        '<div><label>الخصم</label><input id="e_disc'+suf+'" data-field="disc" type="number" step="0.01" value="'+esc(row.disc==null?'':row.disc)+'"></div>'+
        '<div><label>الضريبة</label><input id="e_tax'+suf+'" data-field="tax" type="number" step="0.01" value="'+esc(row.tax==null?'':row.tax)+'"></div>'+
        '<div><label>المبيعات قبل الضريبة</label><input id="e_totalEx'+suf+'" data-field="totalEx" type="number" step="0.01" value="'+esc(row.totalEx==null?'':row.totalEx)+'"></div>'+
        '<div><label>المبيعات شامل الضريبة</label><input id="e_totalInc'+suf+'" data-field="totalInc" type="number" step="0.01" value="'+esc(row.totalInc==null?'':row.totalInc)+'"></div>'+
        '<div class="entry-item-row-actions">'+canDelete+'</div></div>';
      };
      entryItemRowHtml=window.entryItemRowHtml;
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
  }
  function groupInvoices(){
    normalizeLegacyInvoices();var map={};
    arr().forEach(function(r,i){var k=invKey(r.invoice);if(!k)k='3000'+i;if(!map[k])map[k]={no:k,rows:[],client:'',van:'',date:'',pay:'',total:0,tax:0,ex:0,items:0,itemList:[]};var g=map[k];g.rows.push(r);g.items++;if(!g.client&&r.client)g.client=String(r.client);if(!g.van&&r.van)g.van=String(r.van);if(!g.date&&r.date)g.date=rowDate(r);if(!g.pay&&r.pay)g.pay=String(r.pay);if(r.item&&g.itemList.indexOf(String(r.item))<0)g.itemList.push(String(r.item));g.total+=n(r.totalInc);g.tax+=n(r.tax);g.ex+=n(r.totalEx);});
    return Object.keys(map).map(function(k){return map[k]}).sort(function(a,b){var da=rowDate(b.rows[0])||'',db=rowDate(a.rows[0])||''; if(da!==db)return da.localeCompare(db); return String(b.no).localeCompare(String(a.no),'ar',{numeric:true});});
  }
  function yearsList(){var m={};arr().forEach(function(r){var y=yearVal(r);if(y)m[y]=1});return Object.keys(m).sort().reverse()}
  function monthsList(y){var m={};arr().forEach(function(r){if(y&&yearVal(r)!==y)return;var mo=monthVal(r);if(mo)m[mo]=1});var order=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];return Object.keys(m).sort(function(a,b){return order.indexOf(a)-order.indexOf(b)})}
  function daysList(y,mo){var m={};arr().forEach(function(r){if(y&&yearVal(r)!==y)return;if(mo&&monthVal(r)!==mo)return;var d=dayVal(r);if(d)m[d]=1});return Object.keys(m).sort()}
  function ensureEntryUi(){
    var entry=id('entry'); if(!entry)return false; var card=entry.querySelector('.card'); if(!card)return false; card.classList.add('pet-entry-form-card');
    if(!id('petEntryTabs')){var tabs=document.createElement('div');tabs.id='petEntryTabs';tabs.className='pet-entry-tabs';safeRender(tabs,'<button type="button" id="petEntryNewBtn" class="pet-entry-tab-btn active">➕ إدخال فواتير جديدة</button><button type="button" id="petEntryEditBtn" class="pet-entry-tab-btn">🔎 تعديل / حذف فواتير</button>','invoice entry tabs');card.parentNode.insertBefore(tabs,card)}
    if(!id('petEntrySearchPanel')){var panel=document.createElement('div');panel.id='petEntrySearchPanel';panel.className='pet-entry-search-panel';safeSetEntryHTML(panel,'<div class="pet-entry-search-head"><div><h3>🔎 بحث واستعراض الفواتير</h3><p>ابحث من البيانات القديمة والمضافة حديثاً، ثم استعرض الفاتورة لتعديلها أو حذفها.</p></div></div><div class="pet-entry-filter-grid"><div><label>السنة</label><select id="petEntryYearFilter"></select></div><div><label>الشهر</label><select id="petEntryMonthFilter"></select></div><div><label>اليوم</label><select id="petEntryDayFilter"></select></div><div><label>طريقة الدفع</label><select id="petEntryPayFilter"><option value="">كل طرق الدفع</option><option>نقدي</option><option>شبكة</option><option>تحويل بنكي</option><option>أخرى</option></select></div></div><div class="pet-entry-search-actions"><input id="petEntryInvoiceSearch" placeholder="اكتب رقم الفاتورة أو اسم العميل أو السيارة..." autocomplete="off"><button type="button" id="petEntryRefreshSearch">تحديث القائمة</button><button type="button" id="petEntryClearSearch">مسح البحث</button></div><div id="petEntrySearchResults" class="pet-entry-results"></div>','manual invoice search shell');card.parentNode.insertBefore(panel,card)}
    if(!id('petEntryEditBanner')){var banner=document.createElement('div');banner.id='petEntryEditBanner';banner.className='pet-entry-edit-banner';safeSetEntryHTML(banner,'<span id="petEntryEditBannerText">وضع تعديل فاتورة</span><button type="button" class="pet-entry-small-btn" id="petEntryCancelEdit">إلغاء وضع التعديل</button>','manual invoice edit banner');card.parentNode.insertBefore(banner,card)}
    wire('petEntryNewBtn','click',function(){setMode('new')}); wire('petEntryEditBtn','click',function(){setMode('edit')}); wire('petEntryInvoiceSearch','input',function(){renderResults(true)}); wire('petEntryRefreshSearch','click',function(){refreshFilters();renderResults(true)}); wire('petEntryClearSearch','click',function(){['petEntryInvoiceSearch','petEntryYearFilter','petEntryMonthFilter','petEntryDayFilter','petEntryPayFilter'].forEach(function(x){if(id(x))id(x).value=''});refreshFilters();renderResults(true);var inp=id('petEntryInvoiceSearch');if(inp)inp.focus()}); wire('petEntryYearFilter','change',function(){refreshFilters('year');renderResults(true)}); wire('petEntryMonthFilter','change',function(){refreshFilters('month');renderResults(true)}); wire('petEntryDayFilter','change',function(){renderResults(true)}); wire('petEntryPayFilter','change',function(){renderResults(true)}); wire('petEntryCancelEdit','click',function(){STATE.selectedInvoice='';try{if(typeof buildForm==='function')buildForm()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}setMode('edit')});
    refreshFilters();return true;
  }
  function wire(el,ev,fn){var e=id(el);if(e&&!e['__pet36_'+ev]){e['__pet36_'+ev]=true;e.addEventListener(ev,fn)}}
  function fillEntrySelect(sel,placeholder,items,labelFn){if(!sel)return;while(sel.firstChild)sel.removeChild(sel.firstChild);var o=document.createElement('option');o.value='';o.textContent=placeholder;sel.appendChild(o);(items||[]).forEach(function(x){var opt=document.createElement('option');opt.value=String(x==null?'':x);opt.textContent=String(labelFn?labelFn(x):x);sel.appendChild(opt);});}
  function refreshFilters(changed){var y=id('petEntryYearFilter'),m=id('petEntryMonthFilter'),d=id('petEntryDayFilter');if(!y||!m||!d)return;var yv=y.value,mv=m.value,dv=d.value;if(changed==='year'){mv='';dv=''} if(changed==='month'){dv=''} var ys=yearsList();fillEntrySelect(y,'كل السنوات',ys);if(ys.indexOf(yv)>-1)y.value=yv;var ms=monthsList(y.value);fillEntrySelect(m,'كل الشهور',ms,monthName);if(ms.indexOf(mv)>-1)m.value=mv;var ds=daysList(y.value,m.value);fillEntrySelect(d,'كل الأيام',ds);if(ds.indexOf(dv)>-1)d.value=dv;}
  function filteredGroups(){var q=(id('petEntryInvoiceSearch')&&id('petEntryInvoiceSearch').value||'').trim().toLowerCase();var y=id('petEntryYearFilter')?id('petEntryYearFilter').value:'';var m=id('petEntryMonthFilter')?id('petEntryMonthFilter').value:'';var d=id('petEntryDayFilter')?id('petEntryDayFilter').value:'';var p=id('petEntryPayFilter')?id('petEntryPayFilter').value:'';return groupInvoices().filter(function(g){var r=g.rows[0]||{};if(y&&yearVal(r)!==y)return false;if(m&&monthVal(r)!==m)return false;if(d&&dayVal(r)!==d)return false;if(p&&String(g.pay||'')!==p)return false;if(!q)return true;return [g.no,g.client,g.van,g.date,g.pay,g.itemList.join(' ')].some(function(v){return String(v||'').toLowerCase().indexOf(q)>-1})}).slice(0,80)}
  
function safeSetEntryHTML(target, html, reason){
  try{
    if(window.PETATOESafeRender&&typeof window.PETATOESafeRender.htmlTrusted==='function'){
      return window.PETATOESafeRender.htmlTrusted(target,String(html==null?'':html),reason||'manual invoice trusted escaped template');
    }
  }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch('manual invoice safe render fallback',e);}
  target.textContent='';
  target.insertAdjacentHTML('beforeend',String(html==null?'':html));
  return true;
}
function renderResults(keepFocus){ensureEntryUi();var active=document.activeElement;var box=id('petEntrySearchResults');if(!box)return;var groups=filteredGroups();if(!groups.length){safeSetEntryHTML(box,'<div class="pet-entry-empty">لا توجد فواتير مطابقة من البيانات الموجودة حالياً.</div>','manual invoice empty results')}else{safeSetEntryHTML(box,groups.map(function(g){var cls=String(g.no)===String(STATE.selectedInvoice)?' active':'';var items=g.itemList.slice(0,5).join('، ')+(g.itemList.length>5?' ...':'');var safeNo=String(g.no).replace(/\\/g,'\\\\').replace(/'/g,"\\'");return '<div class="pet-entry-result-card'+cls+'"><div class="pet-entry-result-top"><b>#'+esc(g.no)+'</b><span>'+esc(g.date||'بدون تاريخ')+'</span></div><div class="pet-entry-result-meta"><div>العميل<strong>'+esc(g.client||'—')+'</strong></div><div>السيارة<strong>'+esc(g.van||'—')+'</strong></div><div>الإجمالي<strong>'+esc(mny(g.total))+'</strong></div><div>طريقة الدفع<strong>'+esc(g.pay||'—')+'</strong></div><div>عدد البنود<strong>'+esc(g.items)+'</strong></div><div>الضريبة<strong>'+esc(mny(g.tax))+'</strong></div></div><div class="pet-entry-items-line">الأصناف: '+esc(items||'—')+'</div><div class="pet-entry-result-actions"><button type="button" data-entry-action="load-invoice" data-entry-invoice-no="'+esc(g.no)+'">استعراض / تعديل</button><button type="button" class="danger" data-entry-action="delete-invoice" data-entry-invoice-no="'+esc(g.no)+'">حذف الفاتورة</button></div></div>'}).join(''),'manual invoice search results')} if(keepFocus&&active&&active.id&&id(active.id)){try{id(active.id).focus()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}}}
  function setMode(mode){ensureEntryUi();STATE.mode=mode||'new';var card=document.querySelector('#entry .pet-entry-form-card'),search=id('petEntrySearchPanel'),banner=id('petEntryEditBanner');if(id('petEntryNewBtn'))id('petEntryNewBtn').classList.toggle('active',STATE.mode==='new');if(id('petEntryEditBtn'))id('petEntryEditBtn').classList.toggle('active',STATE.mode==='edit');if(search)search.classList.toggle('show',STATE.mode==='edit');if(STATE.mode==='new'){STATE.selectedInvoice='';if(card)card.classList.remove('entry-hidden-until-select');if(banner)banner.classList.remove('show');try{if(typeof buildForm==='function')buildForm()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}if(id('entryModeText'))id('entryModeText').textContent='إدخال سجل جديد'}else{if(card&&!STATE.selectedInvoice)card.classList.add('entry-hidden-until-select');if(banner)banner.classList.toggle('show',!!STATE.selectedInvoice);if(id('entryModeText'))id('entryModeText').textContent='تعديل / حذف فواتير';renderResults(true);setTimeout(function(){var inp=id('petEntryInvoiceSearch');if(inp)inp.focus()},30)}}
  function setCommon(r,no){if(id('e_van'))id('e_van').value=r.van||id('e_van').value;if(id('e_date'))id('e_date').value=rowDate(r);if(id('e_month'))id('e_month').value=monthVal(r)||id('e_month').value;if(id('e_invoice'))id('e_invoice').value=no;if(id('e_client'))id('e_client').value=r.client||'';if(id('e_pay'))id('e_pay').value=r.pay||id('e_pay').value}
  function loadInvoice(no){normalizeLegacyInvoices();updateItemDatalist();no=invKey(no);var rows=arr().filter(function(r){return invKey(r.invoice)===no});if(!rows.length){note('لم يتم العثور على الفاتورة');renderResults(true);return}STATE.mode='edit';STATE.selectedInvoice=no;ensureEntryUi();overrideEntryItemRowHtml();try{if(typeof buildForm==='function')buildForm()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}setCommon(rows[0]||{},no);var wrap=id('entryItemsWrap');if(wrap){safeClear(wrap);try{entryItemRowSeq=0}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);};rows.forEach(function(r,idx){try{safeAppend(wrap,entryItemRowHtml(idx,r),'invoice item row')}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}});qsa('#entryItemsWrap .entry-item-row').forEach(function(row){try{wireEntryItemRow(row)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}})}try{updateEntryInvoiceTotal()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}var card=document.querySelector('#entry .pet-entry-form-card');if(card)card.classList.remove('entry-hidden-until-select');var banner=id('petEntryEditBanner');if(banner)banner.classList.add('show');var txt=id('petEntryEditBannerText');if(txt){txt.textContent='';txt.appendChild(document.createTextNode('وضع تعديل الفاتورة '));var b=document.createElement('b');b.textContent='#'+no;txt.appendChild(b);txt.appendChild(document.createTextNode(' — الحفظ سيستبدل بيانات الفاتورة بالكامل.'));}if(id('entryModeText'))id('entryModeText').textContent='تعديل فاتورة رقم '+no;renderResults(true);try{card.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}}
  async function deleteInvoice(no){
    normalizeLegacyInvoices();
    no=invKey(no);
    var invoiceRows=arr().filter(function(r){return invKey(r.invoice)===no});
    var cnt=invoiceRows.length;
    if(!cnt){note('الفاتورة غير موجودة');return false}
    if(!(await assertCommissionRowsUnlocked(invoiceRows)))return false;
    var deleteInvoicePrefix=(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('حذف الفاتورة رقم '):'حذف الفاتورة رقم ');if(!confirm(deleteInvoicePrefix+no+' بالكامل؟\nعدد البنود: '+cnt))return false;
    var supabaseDelete=await deleteInvoiceFromSupabase(no,'manual-invoice-delete-button');
    if(!supabaseDelete || supabaseDelete.ok!==true){
      note('تعذر حذف الفاتورة من Supabase، لم يتم حذفها محلياً');
      return false;
    }
    setArr(arr().filter(function(r){return invKey(r.invoice)!==no}));
    STATE.selectedInvoice='';
    try{editingId=null}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
    try{if(typeof _invalidateSearchIndex==='function')_invalidateSearchIndex()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
    try{save()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
    try{if(typeof renderRecords==='function')renderRecords()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
    try{if(window.PETATOESalesInvoiceReport&&window.PETATOESalesInvoiceReport.render)window.PETATOESalesInvoiceReport.render()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
    note('تم حذف الفاتورة');
    setMode('edit');
    return true;
  }
  function collectItems(){try{return typeof collectEntryItems==='function'?collectEntryItems():[]}catch(e){return []}}
  async function saveEntry(){
    if(STATE.saving)return false;
    setSaveBusy(true);
    try{
      try{if(typeof window.petatoeBeforeSaveRecord==='function'&&window.petatoeBeforeSaveRecord()===false)return false}catch(e){console.warn(e)}
      var common={van:id('e_van')?id('e_van').value:'',date:id('e_date')?normDate(id('e_date').value):'',month:id('e_month')?(typeof normalizeMonth==='function'?normalizeMonth(id('e_month').value,id('e_date')?id('e_date').value:''):id('e_month').value):'',invoice:id('e_invoice')?invKey(id('e_invoice').value):'',client:id('e_client')?id('e_client').value:'',pay:id('e_pay')?id('e_pay').value:''};
      var items=collectItems();
      if(!common.date||!common.invoice||!common.client||!items.length){note('املأ التاريخ والعميل وصنف واحد على الأقل');return false}
      var old=STATE.selectedInvoice?arr().filter(function(r){return invKey(r.invoice)===STATE.selectedInvoice}):[];
      var rows=items.map(function(it,idx){var r=Object.assign({},old[idx]||{},it,common);r.id=(old[idx]&&old[idx].id)||(Date.now()+Math.random()+idx);r.manualEntry=true;if(!n(r.totalEx)&&n(r.price))r.totalEx=(n(r.price)*(n(r.qty)||1))-Math.abs(n(r.disc));if(!n(r.totalInc))r.totalInc=n(r.totalEx)+n(r.tax);r.disc=Math.abs(n(r.disc));return r});
      var lockRows=(STATE.mode==='edit'&&STATE.selectedInvoice)?old.concat(rows):rows;
      if(!(await assertCommissionRowsUnlocked(lockRows)))return false;
      var duplicatePolicy=window.PETATOESalesDuplicatePolicy;
      if(!duplicatePolicy||typeof duplicatePolicy.validate!=='function'){
        note(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('تعذر تشغيل فحص تكرار الفاتورة'):'Unable to run invoice duplicate validation');
        return false;
      }
      var duplicateCheck=duplicatePolicy.validate(rows,arr(),{excludeInvoice:(STATE.mode==='edit'&&STATE.selectedInvoice)?STATE.selectedInvoice:''});
      if(!duplicateCheck.ok){
        var firstDuplicate=duplicateCheck.duplicates&&duplicateCheck.duplicates[0];
        var duplicateMessage=(firstDuplicate&&firstDuplicate.type==='within-batch')?'يوجد بند مكرر داخل الفاتورة الحالية':'هذا البند موجود بالفعل بنفس رقم الفاتورة والعميل والخدمة والسيارة والقيمة';
        note(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime(duplicateMessage):duplicateMessage);
        return false;
      }
      if(STATE.mode==='edit'&&STATE.selectedInvoice){
        var oldInvoice=STATE.selectedInvoice;
        rows=stripSupabaseIdentity(rows);
        if(!(window.PETATOEDataLayer&&typeof window.PETATOEDataLayer.replaceSalesInvoice==='function')){
          note('تعذر تحديث الفاتورة في Supabase، لم يتم حفظ التعديل');
          return false;
        }
        var replaceResult=await window.PETATOEDataLayer.replaceSalesInvoice(oldInvoice,rows,{source:'manual-invoice-edit'});
        if(!replaceResult || replaceResult.ok!==true){
          console.warn('[PETATOE Manual Invoice] Atomic invoice replacement failed',oldInvoice,replaceResult);
          note('تعذر تحديث الفاتورة في Supabase، لم يتم حفظ التعديل');
          return false;
        }
        if(window.PETATOEDataSource&&typeof window.PETATOEDataSource.refreshSalesRecordsFromSupabase==='function'){
          var refreshResult=await window.PETATOEDataSource.refreshSalesRecordsFromSupabase('manual-invoice-edit-atomic-replace');
          if(refreshResult&&refreshResult.ok===false){
            console.warn('[PETATOE Manual Invoice] Refresh after atomic replacement failed',refreshResult);
          }
        }
        STATE.selectedInvoice=common.invoice;
      }else{
        var persistResult=await commitManualRowsToSupabase(rows);
        if(!persistResult || persistResult.ok!==true){
          note(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('فشل حفظ البيانات في Supabase'):'Failed to save data to Supabase');
          return false;
        }
        try{if(typeof setNextManualInvoiceAfter==='function')setNextManualInvoiceAfter(common.invoice)}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
      }
      try{if(typeof _invalidateSearchIndex==='function')_invalidateSearchIndex()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
      try{save()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
      try{
        if(window.PETATOEReferenceRegistry&&typeof window.PETATOEReferenceRegistry.syncSalesRows==='function'){
          window.PETATOEReferenceRegistry.syncSalesRows(rows,{source:'manual-invoice'});
        }
      }catch(e){console.warn('PETATOE reference registry sync after manual invoice failed',e)}
      try{updateItemDatalist()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
      try{if(typeof renderRecords==='function')renderRecords()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
      try{if(window.PETATOESalesInvoiceReport&&window.PETATOESalesInvoiceReport.render)window.PETATOESalesInvoiceReport.render()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
      try{document.dispatchEvent(new CustomEvent('petatoe:record-saved',{detail:{mode:STATE.mode,invoice:common.invoice}}))}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}
      note((STATE.mode==='edit'?'تم تعديل الفاتورة رقم ':'تم حفظ الفاتورة رقم ')+common.invoice);
      if(STATE.mode==='edit')setTimeout(function(){loadInvoice(common.invoice)},50);else setMode('new');
      return true;
    }finally{
      setSaveBusy(false);
    }
  }
  function clearEntryForm(){STATE.selectedInvoice='';try{if(typeof buildForm==='function')buildForm()}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/invoice-manual-multi-items.js",e);}if(id('entryModeText'))id('entryModeText').textContent='إدخال سجل جديد';renderResults(true)}
  function bindEntryActions(){if(STATE.actionsBound)return;STATE.actionsBound=true;document.addEventListener('click',function(e){var save=e.target&&e.target.closest&&e.target.closest('#saveBtn');if(save){e.preventDefault();e.stopImmediatePropagation();saveEntry();return}var clear=e.target&&e.target.closest&&e.target.closest('#clearEntryBtn');if(clear){e.preventDefault();e.stopImmediatePropagation();clearEntryForm();return}},true)}
  function boot(){normalizeLegacyInvoices();updateItemDatalist();overrideEntryItemRowHtml();ensureEntryUi();if(!STATE.baseSave&&typeof saveRecord==='function')STATE.baseSave=saveRecord;if(!STATE.baseClear&&typeof clearForm==='function')STATE.baseClear=clearForm;window.petatoeEntryLoadInvoice=loadInvoice;window.petatoeEntryDeleteInvoice=deleteInvoice;window.petatoeManualSaveEntry=saveEntry;window.petatoeManualClearEntry=clearEntryForm;bindEntryActions();setMode('new')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(boot,80)});else setTimeout(boot,80);
  window.petInvoiceManualMultiItemsBoot=boot;document.addEventListener('petatoe:tabchange',function(e){if(e.detail&&e.detail.tabId==='entry')setTimeout(boot,120)});
})();



(function(){
  if(window.__PETATOE_ENTRY_DELEGATION__) return;
  window.__PETATOE_ENTRY_DELEGATION__=true;
  document.addEventListener('click', function(e){
    var btn=e.target && e.target.closest && e.target.closest('[data-entry-action]');
    if(!btn) return;
    var action=btn.getAttribute('data-entry-action');
    if(action==='remove-row' && typeof window.removeEntryItemRow==='function'){e.preventDefault();return window.removeEntryItemRow(btn);}
    var no=btn.getAttribute('data-entry-invoice-no')||'';
    if(action==='load-invoice' && typeof window.petatoeEntryLoadInvoice==='function'){e.preventDefault();return window.petatoeEntryLoadInvoice(no);}
    if(action==='delete-invoice' && typeof window.petatoeEntryDeleteInvoice==='function'){e.preventDefault();return window.petatoeEntryDeleteInvoice(no);}
  });
  document.addEventListener('input', function(e){var el=e.target;if(el&&el.matches&&el.matches('[data-entry-suggest]')&&typeof window.petatoeEntryApplyItemSuggestion==='function') window.petatoeEntryApplyItemSuggestion(el);});
  document.addEventListener('change', function(e){var el=e.target;if(el&&el.matches&&el.matches('[data-entry-suggest]')&&typeof window.petatoeEntryApplyItemSuggestion==='function') window.petatoeEntryApplyItemSuggestion(el);});
})();
