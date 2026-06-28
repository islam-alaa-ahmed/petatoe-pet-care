/* === PETATOE v3.6 MULTI IMPORT ENGINE - SAFE OVERRIDE === */
(function(){
  if(window.__PETATOE_SALES_IMPORT_ENGINE_SINGLETON__) return;
  window.__PETATOE_SALES_IMPORT_ENGINE_SINGLETON__ = true;
  const MODES={
    full:{title:'اسحب ملف التقرير التفصيلي الشامل هنا أو اضغط للاختيار',desc:'الأعمدة المطلوبة: اسم الصنف، السيارة، التاريخ، الشهر، رقم الفاتورة، العميل، سعر الوحدة، الكمية، الخصم، الضريبة، شامل الضريبة، قبل الضريبة، طريقة السداد'},
    items:{title:'اسحب ملف مبيعات البنود حسب التصنيف هنا أو اضغط للاختيار',desc:'الأعمدة المطلوبة: الاسم، التاريخ، رقم الفاتورة، العميل، سعر الوحدة، الكمية، الخصم، الضرائب، الإجمالي (SAR)، السياره'},
    payments:{title:'اسحب ملف تحديد طريقة المدفوعات هنا أو اضغط للاختيار',desc:'الأعمدة المطلوبة: رقم الفاتورة، طريقه الدفع. يتم ربطها على البنود بنفس رقم الفاتورة.'}
  };
  let importMode='full';
  let stagedPaymentMap={};
  let lastImportErrors=[];
  let pendingOverrideReplace=false;
  let pendingOverrideContext='validation';
  const arLetters='أإآاىيهةؤئء';
  function normText(v){return String(v??'').trim().replace(/\s+/g,' ').replace(/ي/g,'ى').replace(/ة/g,'ه').toLowerCase();}
  function normHeader(v){return normText(v).replace(/[\u064B-\u065F]/g,'').replace(/[()\[\]{}\-_/\\.:،,]/g,'').replace(/\s+/g,'');}
  function colLetter(n){let s='';n=Number(n)||1;while(n>0){let m=(n-1)%26;s=String.fromCharCode(65+m)+s;n=Math.floor((n-1)/26)}return s;}
  function cellRef(r,c){return colLetter(c)+String(r)}
  function excelRowIndex(i){return i+1}
  function isBlank(v){return v==null || String(v).trim()===''}
  function safeNum(v){return (typeof parseNum==='function')?parseNum(v):Number(String(v||'').replace(/,/g,''))||0}
  function cleanInvoice(v){return String(v??'').trim()}
  function isCashText(v){const x=normText(v);return ['cash','كاش','نقدى','نقدي'].some(k=>x===k||x.includes(k));}
  function detectInvoiceType(r){return ((isCashText(r.invoice)||isCashText(r.client)) && safeNum(r.tax)===0)?'CASH':'TAX'}
  function recordDuplicateKey(r){
    // DUPLICATE_RULE_MULTI_FIELD_FIX:
    // يتم الحكم على تكرار البند عند تطابق: رقم الفاتورة + العميل + الصنف/الخدمة + السيارة + قيمة الصنف.
    // لذلك فواتير متعددة البنود لن تظهر كتكرار لمجرد أن رقم الفاتورة واحد.
    const lineValue=safeNum(r.totalInc||r.total||r.totalWithVat||r.amount||r.lineTotal||r.price).toFixed(2);
    const parts=[r.invoice,r.client,r.item,(r.van||r.vehicle||r.car||r.carName||r.vehicleName),lineValue];
    return parts.map(x=>normText(x)).join('|');
  }
  function makeError(row,col,msg,value){return {row,col,cell:cellRef(row,col),msg,value};}


  function storageReadJSON(key, fallback){
    try{ if(window.PETATOEStorage && typeof window.PETATOEStorage.readJSON==='function') return window.PETATOEStorage.readJSON(key, fallback); }catch(_e){}
    try{ const raw=localStorage.getItem(key); return raw?JSON.parse(raw):fallback; }catch(_e){ return fallback; }
  }
  function findCurrentFullUser(){
    let cu=null;
    try{ cu=(window.PETATOEAuth&&typeof window.PETATOEAuth.currentUser==='function')?window.PETATOEAuth.currentUser():null; }catch(_e){}
    if(!cu){ try{ cu=window.__PETATOE_ACTIVE_USER__||window.currentUser||null; }catch(_e){} }
    const id=String((cu&&(cu.id||cu.username||cu.email||cu.fullName))||'').trim().toLowerCase();
    const keys=['petatoe_users_v108','petatoe_users_v139','petatoe_users_v2','petatoe_users','PETATOE_USERS'];
    for(const k of keys){
      const arr=storageReadJSON(k,[]);
      if(!Array.isArray(arr)) continue;
      const u=arr.find(x=>{
        if(!x||typeof x!=='object') return false;
        return [x.id,x.username,x.email,x.fullName,x.name,x.login].some(v=>String(v||'').trim().toLowerCase()===id);
      });
      if(u) return u;
    }
    return cu;
  }
  function isSuperAdminUser(u){
    const role=normText((u&&(u.role||u.job||u.type||u.permission))||'');
    const id=normText((u&&(u.id||u.username||u.fullName||u.name))||'');
    return id==='admin'||id==='u_admin'||role.indexOf('super')>=0||role.indexOf('سوبر')>=0;
  }
  function verifyOverridePassword(password){
    const full=findCurrentFullUser();
    if(!isSuperAdminUser(full)) return {ok:false, reason:'هذه العملية متاحة فقط لمستخدم Super Admin'};
    const p=String(password||'');
    if(!p) return {ok:false, reason:'أدخل كلمة مرور Super Admin'};
    try{ if(window.PETATOEPasswordSecurity && typeof window.PETATOEPasswordSecurity.verifyPassword==='function' && window.PETATOEPasswordSecurity.verifyPassword(p, full)) return {ok:true,user:full}; }catch(_e){}
    if(full && full.password && String(full.password)===p) return {ok:true,user:full};
    return {ok:false, reason:'كلمة مرور Super Admin غير صحيحة'};
  }
  function auditOverride(reason, replace){
    try{
      const u=findCurrentFullUser()||{};
      const detail='Override import by '+String(u.username||u.fullName||u.id||'Super Admin')+' | rows='+String((importData||[]).length)+' | errors='+String((lastImportErrors||[]).length)+' | mode='+String(importMode)+' | replace='+String(!!replace)+' | reason='+(reason||'-');
      if(window.__PETATOE_SETTINGS_API__ && typeof window.__PETATOE_SETTINGS_API__.audit==='function') window.__PETATOE_SETTINGS_API__.audit('Import Validation Override', detail, 'warn');
      const key='petatoe_import_override_audit';
      const list=storageReadJSON(key,[]); if(Array.isArray(list)){ list.push({time:new Date().toISOString(),user:u.username||u.fullName||u.id||'Super Admin',rows:(importData||[]).length,errors:(lastImportErrors||[]).length,mode:importMode,replace:!!replace,reason:reason||''}); localStorage.setItem(key,JSON.stringify(list.slice(-300))); }
    }catch(e){ try{ console.warn('[PETATOE Import Override] audit failed', e); }catch(_e){} }
  }
  function forceImportAfterOverride(reason){
    if(!(importData&&importData.length)){ toast('لا توجد بيانات قابلة للرفع بعد التخطي'); return; }
    const replace=!!pendingOverrideReplace;
    auditOverride(reason, replace);
    const existingRows=dsRecords().slice();
    const nextRows=replace?[...importData]:existingRows.concat(importData);
    commitImportedRows(nextRows,'import-override-confirmed','تم رفع البيانات بتجاوز قواعد التحقق بواسطة Super Admin');
  }
  function ensureOverrideStyle(){
    if(document.getElementById('pet-import-override-style')) return;
    const st=document.createElement('style'); st.id='pet-import-override-style';
    st.textContent='.pet-import-override-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;align-items:center}.pet-import-override-btn{border:1px solid rgba(245,158,11,.65);background:linear-gradient(135deg,rgba(245,158,11,.24),rgba(239,68,68,.18));color:#fff;border-radius:16px;padding:10px 14px;font-weight:900;cursor:pointer;box-shadow:0 12px 30px rgba(245,158,11,.18)}.pet-import-override-note{font-size:12px;color:var(--muted)}.pet-override-modal-backdrop{position:fixed;inset:0;z-index:999999;background:rgba(2,6,23,.58);backdrop-filter:blur(10px);display:grid;place-items:center;padding:20px}.pet-override-modal{width:min(520px,96vw);border-radius:24px;border:1px solid rgba(148,163,184,.35);background:linear-gradient(135deg,rgba(15,23,42,.96),rgba(30,41,59,.92));box-shadow:0 30px 90px rgba(0,0,0,.45);padding:22px;color:#fff;direction:rtl}.pet-override-modal h3{margin:0 0 8px;font-size:22px}.pet-override-modal p{margin:0 0 14px;color:rgba(226,232,240,.82);line-height:1.7}.pet-override-modal label{display:block;margin:12px 0 6px;font-weight:800}.pet-override-modal input,.pet-override-modal textarea{width:100%;box-sizing:border-box;border-radius:14px;border:1px solid rgba(148,163,184,.35);background:rgba(15,23,42,.66);color:#fff;padding:11px 12px;outline:none}.pet-override-modal textarea{min-height:70px;resize:vertical}.pet-override-modal .pet-override-check{display:flex;gap:8px;align-items:flex-start;margin:12px 0;color:rgba(226,232,240,.86)}.pet-override-modal .pet-override-check input{width:auto;margin-top:4px}.pet-override-modal .pet-override-error{color:#fecaca;font-weight:800;min-height:20px;margin-top:8px}.pet-override-modal .pet-override-actions{display:flex;gap:10px;justify-content:flex-start;margin-top:14px}.pet-override-modal button{border:0;border-radius:14px;padding:10px 14px;font-weight:900;cursor:pointer}.pet-override-cancel{background:rgba(148,163,184,.22);color:#e5e7eb}.pet-override-confirm{background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff}';
    document.head.appendChild(st);
  }
  function openOverrideModal(){
    ensureOverrideStyle();
    const full=findCurrentFullUser();
    if(!isSuperAdminUser(full)){ toast('تخطي قواعد الرفع متاح فقط لـ Super Admin'); return; }
    const old=document.getElementById('petImportOverrideModal'); if(old)old.remove();
    const bd=document.createElement('div'); bd.className='pet-override-modal-backdrop'; bd.id='petImportOverrideModal';
    bd.innerHTML='<div class="pet-override-modal" role="dialog" aria-modal="true"><h3>🛡️ تخطي قواعد التحقق والرفع</h3><p>سيتم رفع البيانات رغم وجود أخطاء أو تكرار. استخدم هذا الإجراء فقط عند التأكد من صحة الملف ومسؤوليتك عن التجاوز.</p><label>سبب التجاوز / ملاحظة</label><textarea id="petOverrideReason" placeholder="مثال: استيراد اضطراري بعد مراجعة الملف"></textarea><label>كلمة مرور Super Admin</label><input id="petOverridePassword" type="password" autocomplete="current-password" placeholder="أدخل كلمة المرور"><label class="pet-override-check"><input id="petOverrideAcknowledge" type="checkbox"><span>أقر أن هذا الإجراء قد يرفع بيانات مخالفة لقواعد التحقق أو مكررة.</span></label><div class="pet-override-error" id="petOverrideError"></div><div class="pet-override-actions"><button type="button" class="pet-override-confirm" id="petOverrideConfirmBtn">تخطي والرفع</button><button type="button" class="pet-override-cancel" id="petOverrideCancelBtn">إلغاء</button></div></div>';
    document.body.appendChild(bd);
    const close=()=>bd.remove();
    bd.querySelector('#petOverrideCancelBtn').addEventListener('click', close);
    bd.addEventListener('click', e=>{ if(e.target===bd) close(); });
    setTimeout(()=>{try{bd.querySelector('#petOverridePassword').focus();}catch(_e){}},30);
    bd.querySelector('#petOverrideConfirmBtn').addEventListener('click', ()=>{
      const err=bd.querySelector('#petOverrideError');
      if(!bd.querySelector('#petOverrideAcknowledge').checked){ err.textContent='يجب تأكيد الإقرار قبل التخطي.'; return; }
      const check=verifyOverridePassword(bd.querySelector('#petOverridePassword').value);
      if(!check.ok){ err.textContent=check.reason; return; }
      const reason=bd.querySelector('#petOverrideReason').value||'';
      close(); forceImportAfterOverride(reason);
    });
  }
  function appendOverrideButton(box){
    if(!box || document.getElementById('petImportOverrideBtn')) return;
    ensureOverrideStyle();
    const wrap=document.createElement('div'); wrap.className='pet-import-override-actions';
    const btn=document.createElement('button'); btn.type='button'; btn.id='petImportOverrideBtn'; btn.className='pet-import-override-btn'; btn.textContent='🛡️ تخطي الشروط والرفع (Super Admin)';
    const note=document.createElement('span'); note.className='pet-import-override-note'; note.textContent='يتطلب كلمة مرور Super Admin ويتم تسجيل العملية في سجل التجاوز.';
    btn.addEventListener('click', openOverrideModal);
    wrap.appendChild(btn); wrap.appendChild(note); box.appendChild(wrap);
  }

  function clearNode(node){while(node&&node.firstChild)node.removeChild(node.firstChild);}
  function appendText(parent, tag, text, className){const el=document.createElement(tag); if(className)el.className=className; el.textContent=String(text??''); parent.appendChild(el); return el;}
  function appendMiniStat(parent,label,value){const mini=document.createElement('div'); mini.className='mini'; appendText(mini,'span',label); appendText(mini,'b',value); parent.appendChild(mini); return mini;}
  function renderImportStats(stats){const box=document.getElementById('importStats'); if(!box)return; clearNode(box); (stats||[]).forEach(s=>appendMiniStat(box,s.label,s.value));}
  function ensureXlsxReady(){return !!(window.XLSX&&window.XLSX.read&&window.XLSX.utils&&window.XLSX.utils.sheet_to_json);}
  function renderErrors(errors){
    lastImportErrors=errors||[];
    const box=document.getElementById('importErrors');
    if(!box)return;
    if(!lastImportErrors.length){box.style.display='none';clearNode(box);return;}
    box.style.display='block';
    clearNode(box);
    appendText(box,'h3','❌ تم منع الرفع بسبب وجود أخطاء');
    const summary=document.createElement('div');
    summary.appendChild(document.createTextNode('تم العثور على '));
    appendText(summary,'b',lastImportErrors.length);
    summary.appendChild(document.createTextNode(' خطأ. لازم تصلح الملف وترفعه مرة أخرى.'));
    box.appendChild(summary);
    const ul=document.createElement('ul');
    lastImportErrors.slice(0,80).forEach(e=>{
      const li=document.createElement('li');
      appendText(li,'b','الصف '+String(e.row));
      li.appendChild(document.createTextNode(' - الخلية '));
      appendText(li,'b',e.cell);
      li.appendChild(document.createTextNode(': '+String(e.msg??'')));
      if(e.value!==undefined){li.appendChild(document.createTextNode(' — القيمة: ')); appendText(li,'b',e.value);}
      ul.appendChild(li);
    });
    box.appendChild(ul);
    if(lastImportErrors.length>80){const more=appendText(box,'div','تم عرض أول 80 خطأ فقط.'); more.style.marginTop='8px'; more.style.color='var(--muted)';}
    appendOverrideButton(box);
    const pv=document.getElementById('previewCard'); if(pv)pv.style.display='none';
    if(typeof toast==='function')toast('تم منع الرفع - راجع تفاصيل الأخطاء');
  }
  function clearErrors(){renderErrors([])}
  function findHeaderRow(data, wanted){
    const limit=Math.min(10,data.length);
    for(let r=0;r<limit;r++){
      const arr=(data[r]||[]).map(normHeader);
      let score=0;
      wanted.forEach(w=>{if(arr.includes(normHeader(w)))score++;});
      if(score>=Math.min(3,wanted.length))return r;
    }
    return 0;
  }
  function buildHeaderMap(row){const map={};(row||[]).forEach((h,i)=>{const k=normHeader(h); if(k && map[k]==null)map[k]=i;});return map;}
  function pick(map, aliases){for(const a of aliases){const k=normHeader(a); if(map[k]!=null)return map[k];}return -1;}
  function requiredIndex(map, aliases, label, errors){const idx=pick(map,aliases);if(idx<0)errors.push(makeError(1,1,`العمود المطلوب "${label}" غير موجود`));return idx;}
  function readCell(row, idx){return idx>=0?row[idx]:''}
  function validateRequired(rowIndex, colIndex, label, value, errors){if(isBlank(value))errors.push(makeError(rowIndex,colIndex+1,`قيمة "${label}" فارغة`,value));}
  function validateNumber(rowIndex, colIndex, label, value, errors, allowBlank){if(allowBlank&&isBlank(value))return;const n=safeNum(value);if(isBlank(value))errors.push(makeError(rowIndex,colIndex+1,`قيمة "${label}" فارغة`,value));else if(isNaN(n))errors.push(makeError(rowIndex,colIndex+1,`قيمة "${label}" يجب أن تكون رقم`,value));}
  function finalizeRecord(r){
    r.date=(typeof parseDate==='function')?parseDate(r.date):String(r.date||'');
    r.month=(typeof normalizeMonth==='function')?normalizeMonth(r.month,r.date):r.month;
    ['price','qty','disc','tax','totalInc','totalEx'].forEach(f=>r[f]=safeNum(r[f]));
    if(!r.totalEx && r.totalInc)r.totalEx=r.totalInc-r.tax;
    if(!r.totalInc && r.totalEx)r.totalInc=r.totalEx+r.tax;
    r.invoiceType=detectInvoiceType(r);
    return r;
  }
  function parseFull(data){
    const errors=[]; const hr=findHeaderRow(data,HEADERS||[]); const map=buildHeaderMap(data[hr]||[]); const out=[];
    const idx={
      item:requiredIndex(map,['اسم الصنف','الصنف','الخدمة','الخدمه','item','service'],'اسم الصنف',errors),
      van:requiredIndex(map,['السيارة','السياره','car','vehicle','van'],'السيارة',errors),
      date:requiredIndex(map,['التاريخ','date'],'التاريخ',errors),
      month:pick(map,['الشهر','month']),
      invoice:requiredIndex(map,['رقم الفاتورة','رقم الفاتوره','invoice','invoice no'],'رقم الفاتورة',errors),
      client:requiredIndex(map,['العميل','client','customer'],'العميل',errors),
      price:requiredIndex(map,['سعر الوحدة','سعر الوحده','unit price','price'],'سعر الوحدة',errors),
      qty:requiredIndex(map,['الكمية','الكميه','qty','quantity'],'الكمية',errors),
      disc:pick(map,['الخصم','discount','disc']),
      tax:pick(map,['الضريبة','الضرائب','tax','vat']),
      totalInc:requiredIndex(map,['المبيعات شامل الضريبة','الإجمالي (SAR)','الاجمالي sar','الإجمالي','الاجمالي','total inc','total','gross'],'المبيعات شامل الضريبة',errors),
      totalEx:pick(map,['المبيعات قبل الضريبة','قبل الضريبة','net','total ex','before tax']),
      pay:pick(map,['طريقة السداد','طريقة الدفع','طريقه الدفع','payment','pay'])
    };
    if(errors.length)return {rows:[],errors};
    for(let i=hr+1;i<data.length;i++){
      const row=data[i]||[]; if(row.every(isBlank))continue; const erow=excelRowIndex(i+1);
      ['item','van','date','invoice','client'].forEach(k=>validateRequired(erow,idx[k],k,readCell(row,idx[k]),errors));
      ['price','qty','totalInc'].forEach(k=>validateNumber(erow,idx[k],k,readCell(row,idx[k]),errors,false));
      ['disc','tax','totalEx'].forEach(k=>{if(idx[k]>=0)validateNumber(erow,idx[k],k,readCell(row,idx[k]),errors,true)});
      const r={id:Date.now()+i+Math.random(),item:readCell(row,idx.item),van:readCell(row,idx.van),date:readCell(row,idx.date),month:idx.month>=0?readCell(row,idx.month):'',invoice:readCell(row,idx.invoice),client:readCell(row,idx.client),price:readCell(row,idx.price),qty:readCell(row,idx.qty),disc:idx.disc>=0?readCell(row,idx.disc):0,tax:idx.tax>=0?readCell(row,idx.tax):0,totalInc:readCell(row,idx.totalInc),totalEx:idx.totalEx>=0?readCell(row,idx.totalEx):0,pay:idx.pay>=0?readCell(row,idx.pay):'',sourceUploadMethod:'full'};
      finalizeRecord(r); out.push(r);
    }
    validateRowsBusiness(out,errors);
    return {rows:out,errors};
  }
  function parseItems(data){
    const errors=[]; const wanted=['الاسم','التاريخ','رقم الفاتورة','العميل','سعر الوحدة','الكمية','الخصم','الضرائب','الإجمالي (SAR)','السياره'];
    const hr=findHeaderRow(data,wanted); const map=buildHeaderMap(data[hr]||[]); const out=[];
    const idx={
      item:requiredIndex(map,['الاسم','اسم الصنف','الصنف','الخدمة','الخدمه','item','service'],'الاسم / الصنف أو الخدمة',errors),
      date:requiredIndex(map,['التاريخ','date'],'التاريخ',errors),
      invoice:requiredIndex(map,['رقم الفاتورة','رقم الفاتوره','invoice','invoice no'],'رقم الفاتورة',errors),
      client:requiredIndex(map,['العميل','client','customer'],'العميل',errors),
      price:requiredIndex(map,['سعر الوحدة','سعر الوحده','unit price','price'],'سعر الوحدة',errors),
      qty:requiredIndex(map,['الكمية','الكميه','qty','quantity'],'الكمية',errors),
      disc:requiredIndex(map,['الخصم','discount','disc'],'الخصم',errors),
      tax:requiredIndex(map,['الضرائب','الضريبة','tax','vat'],'الضرائب',errors),
      totalInc:requiredIndex(map,['الإجمالي (SAR)','الاجمالي sar','الإجمالي','الاجمالي','total','gross'],'الإجمالي (SAR)',errors),
      van:requiredIndex(map,['السياره','السيارة','car','vehicle','van'],'السياره',errors)
    };
    if(errors.length)return {rows:[],errors};
    for(let i=hr+1;i<data.length;i++){
      const row=data[i]||[]; if(row.every(isBlank))continue; const erow=excelRowIndex(i+1);
      ['item','date','invoice','client','van'].forEach(k=>validateRequired(erow,idx[k],k,readCell(row,idx[k]),errors));
      ['price','qty','disc','tax','totalInc'].forEach(k=>validateNumber(erow,idx[k],k,readCell(row,idx[k]),errors,false));
      const r={id:Date.now()+i+Math.random(),item:readCell(row,idx.item),van:readCell(row,idx.van),date:readCell(row,idx.date),month:'',invoice:readCell(row,idx.invoice),client:readCell(row,idx.client),price:readCell(row,idx.price),qty:readCell(row,idx.qty),disc:readCell(row,idx.disc),tax:readCell(row,idx.tax),totalInc:readCell(row,idx.totalInc),totalEx:0,pay:'',sourceUploadMethod:'items_plus_payments'};
      finalizeRecord(r);
      // PETATOE v3.6 DISCOUNT SIGN FIX:
      // بعض ملفات البيع تُصدر الخصم كرقم سالب مثل -43.10.
      // في هذه الحالة الصيغة الصحيحة: سعر الوحدة × الكمية + الخصم + الضريبة.
      // ولو الخصم موجب، نطرحه بالطريقة المعتادة.
      const baseAmount=safeNum(r.price)*safeNum(r.qty);
      const discountValue=safeNum(r.disc);
      const signedDiscount=(discountValue<0)?discountValue:-discountValue;
      const expected=baseAmount+signedDiscount+safeNum(r.tax);
      if(Math.abs(expected-safeNum(r.totalInc))>0.10){errors.push(makeError(erow,idx.totalInc+1,`الإجمالي لا يطابق: سعر الوحدة × الكمية ${discountValue<0?'+ الخصم السالب':'- الخصم'} + الضرائب. المتوقع ${expected.toFixed(2)}`,readCell(row,idx.totalInc)));}
      out.push(r);
    }
    validateRowsBusiness(out,errors);
    return {rows:out,errors};
  }
  function parsePayments(data){
    const errors=[]; const hr=findHeaderRow(data,['رقم الفاتورة','طريقه الدفع']); const map=buildHeaderMap(data[hr]||[]);
    const invIdx=requiredIndex(map,['رقم الفاتورة','رقم الفاتوره','invoice','invoice no'],'رقم الفاتورة',errors);
    const payIdx=requiredIndex(map,['طريقه الدفع','طريقة الدفع','طريقة السداد','payment','pay'],'طريقه الدفع',errors);
    if(errors.length)return {payments:{},errors};
    const payMap={}; const seenRows={};
    for(let i=hr+1;i<data.length;i++){
      const row=data[i]||[]; if(row.every(isBlank))continue; const erow=excelRowIndex(i+1);
      const inv=cleanInvoice(readCell(row,invIdx)); const pay=String(readCell(row,payIdx)||'').trim();
      validateRequired(erow,invIdx,'رقم الفاتورة',inv,errors); validateRequired(erow,payIdx,'طريقه الدفع',pay,errors);
      if(!inv||!pay)continue;
      const key=normText(inv);
      if(payMap[key] && normText(payMap[key])!==normText(pay)) errors.push(makeError(erow,payIdx+1,`رقم الفاتورة "${inv}" له أكثر من طريقة دفع مختلفة. الصف السابق ${seenRows[key]}`,pay));
      else {payMap[key]=pay; seenRows[key]=erow;}
    }
    return {payments:payMap,errors};
  }
  function validateRowsBusiness(rows,errors){
    const inside={};
    rows.forEach((r,i)=>{const row=i+2; const k=recordDuplicateKey(r); if(inside[k]!=null)errors.push(makeError(row,1,`السطر مكرر داخل نفس الملف مع الصف ${inside[k]}`,r.invoice)); else inside[k]=row; if(!r.date)errors.push(makeError(row,3,'التاريخ غير صالح',r.date)); if(safeNum(r.totalInc)<0 && !String(r.invoice).includes('-')){} });
  }

  function dsRecords(){
    try{return (window.PETATOEDataSource&&window.PETATOEDataSource.getRecordsSync)?window.PETATOEDataSource.getRecordsSync():[]}catch(e){}
    try{ if(typeof records!=='undefined' && Array.isArray(records)) return records; }catch(_e){}
    return [];
  }
  function dsSetRecords(arr){
    const safe=Array.isArray(arr)?arr:[];
    let ok=false;
    try{ if(window.PETATOEDataSource&&typeof window.PETATOEDataSource.setRecordsSync==='function'){ window.PETATOEDataSource.setRecordsSync(safe); ok=true; } }catch(e){console.warn('PETATOEImport setRecordsSync failed',e)}
    try{ if(window.PETATOEDataSource&&typeof window.PETATOEDataSource.syncRecordsCache==='function'){ window.PETATOEDataSource.syncRecordsCache(safe); ok=true; } }catch(e){console.warn('PETATOEImport syncRecordsCache failed',e)}
    try{ if(typeof records!=='undefined'){ records=safe; ok=true; } }catch(e){console.warn('PETATOEImport records assignment failed',e)}
    try{ window.__PETATOE_LAST_IMPORT_COMMIT__={time:new Date().toISOString(),rows:safe.length,ok:ok}; }catch(_e){}
    return ok;
  }
  function commitImportedRows(nextRows, eventName, message){
    const ok=dsSetRecords(nextRows);
    try{if(window.PETATOESmartTabs&&typeof window.PETATOESmartTabs.notifyDataChanged==='function')window.PETATOESmartTabs.notifyDataChanged(eventName||'import-confirmed');}catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/import-engine.js",e);}
    try{ if(typeof _invalidateSearchIndex==='function')_invalidateSearchIndex(); }catch(_e){}
    try{ if(typeof persistRecords==='function') persistRecords(); }catch(e){console.warn('PETATOEImport persistRecords failed',e)}
    try{ if(typeof save==='function') save(); }catch(e){console.warn('PETATOEImport save failed',e)}
    try{ if(typeof renderRecords==='function') renderRecords(); }catch(_e){}
    try{ if(typeof refreshCurrentPage==='function') refreshCurrentPage(); }catch(_e){}
    importData=[];
    const pc=document.getElementById('previewCard'); if(pc)pc.style.display='none';
    const box=document.getElementById('importErrors'); if(box){box.style.display='none'; clearNode(box);}
    if(typeof toast==='function')toast(message || (ok?'تم اعتماد البيانات بنجاح':'تمت محاولة حفظ البيانات'));
    return ok;
  }
  function applyPaymentsToRows(rows,payMap){let matched=0,missing=[];(rows||[]).forEach(r=>{const k=normText(r.invoice);if(payMap[k]){r.pay=payMap[k];matched++;}else missing.push(r.invoice);});return {matched,missing:[...new Set(missing.filter(Boolean))]};}
  function duplicateErrorsAgainstExisting(rows,replace){
    if(replace)return [];
    const errors=[]; const existing={};
    dsRecords().forEach((r,i)=>{existing[recordDuplicateKey(r)]=i+1;});
    rows.forEach((r,i)=>{const k=recordDuplicateKey(r); if(existing[k]!=null)errors.push(makeError(i+2,5,`هذا البند موجود بالفعل بنفس رقم الفاتورة + العميل + الصنف/الخدمة + السيارة + قيمة الصنف. السجل الحالي رقم ${existing[k]}`,r.invoice));});
    return errors;
  }
  function updateImportModeUI(){
    document.querySelectorAll('[data-import-mode]').forEach(b=>b.classList.toggle('active',b.dataset.importMode===importMode));
    const m=MODES[importMode]||MODES.full;
    const t=document.getElementById('importDropTitle'); if(t)t.textContent=m.title;
    const d=document.getElementById('importDropDesc'); if(d)d.textContent=m.desc;
    const n=document.getElementById('importWorkflowNote');
    if(n){
      if(importMode==='full')n.textContent='رفع تقرير تفصيلي شامل: يتم إضافة كل البيانات دفعة واحدة مع فحص التكرار على مستوى البند وليس رقم الفاتورة فقط.';
      if(importMode==='items')n.textContent='ارفع مبيعات البنود حسب التصنيف أولاً، ثم ارفع ملف طريقة المدفوعات لربط طريقة الدفع بالفواتير قبل الاعتماد.';
      if(importMode==='payments')n.textContent='ملف المدفوعات لا يضيف بنود جديدة، لكنه يربط طريقة الدفع برقم الفاتورة في بيانات البنود المرفوعة أو السجلات الحالية.';
    }
  }
  window.setImportMode=function(mode){importMode=MODES[mode]?mode:'full';clearErrors();updateImportModeUI(); if(typeof toast==='function')toast('تم اختيار: '+(importMode==='full'?'رفع تقرير تفصيلي شامل':importMode==='items'?'مبيعات البنود حسب التصنيف':'تحديد طريقة المدفوعات'));};
  window.downloadTemplate=function(){
    let headers;
    if(importMode==='items')headers=['الاسم','التاريخ','رقم الفاتورة','العميل','سعر الوحدة','الكمية','الخصم','الضرائب','الإجمالي (SAR)','السياره'];
    else if(importMode==='payments')headers=['رقم الفاتورة','طريقه الدفع'];
    else headers=HEADERS;
    const ws=XLSX.utils.aoa_to_sheet([headers]); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Template');
    XLSX.writeFile(wb,importMode==='items'?'PETATOE_Items_By_Category_Template.xlsx':importMode==='payments'?'PETATOE_Payment_Method_Template.xlsx':'PETATOE_Full_Detailed_Template.xlsx');
  };
  window.processFile=function(file){
    clearErrors();
    if(!file){renderErrors([makeError(1,1,'لم يتم اختيار ملف')]);return;}
    if(!ensureXlsxReady()){renderErrors([makeError(1,1,'مكتبة قراءة Excel غير جاهزة. أعد تحميل الصفحة ثم حاول مرة أخرى')]);return;}
    const reader=new FileReader();
    reader.onload=e=>{
      try{
        const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});
        if(!wb||!Array.isArray(wb.SheetNames)||!wb.SheetNames.length){renderErrors([makeError(1,1,'ملف Excel لا يحتوي على شيتات قابلة للقراءة')]);return;}
        const ws=wb.Sheets[wb.SheetNames[0]], data=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
        if(!Array.isArray(data)||!data.length){renderErrors([makeError(1,1,'الشيت الأول فارغ أو غير قابل للقراءة')]);return;}
        let result;
        if(importMode==='payments'){
          result=parsePayments(data);
          if(result.errors.length){renderErrors(result.errors);return;}
          stagedPaymentMap=Object.assign(stagedPaymentMap,result.payments);
          let existingRows=dsRecords();
          let targetRows=(importData&&importData.length)?importData:existingRows;
          const ap=applyPaymentsToRows(targetRows,stagedPaymentMap);
          if(targetRows===existingRows && ap.matched){dsSetRecords(existingRows); try{save()}catch(_e){console.warn('PETATOEImport post-payment save failed',_e)}}
          renderImportStats([{label:'طرق الدفع المقروءة',value:fmt0(Object.keys(result.payments).length)},{label:'تم ربطها',value:fmt0(ap.matched)},{label:'غير موجودة',value:fmt0(ap.missing.length)},{label:'الحالة',value:'جاهز'}]);
          if(importData&&importData.length)showPreview();
          else {const pc=document.getElementById('previewCard'); if(pc)pc.style.display='none';}
          toast(ap.matched?'تم ربط طرق الدفع بنجاح':'تم قراءة طرق الدفع، لكن لا توجد فواتير مطابقة حالياً');
          return;
        }
        result=(importMode==='items')?parseItems(data):parseFull(data);
        if(result.errors.length){ if(result.rows&&result.rows.length) importData=result.rows; pendingOverrideContext='validation'; pendingOverrideReplace=false; renderErrors(result.errors);return;}
        importData=result.rows;
        if(Object.keys(stagedPaymentMap).length)applyPaymentsToRows(importData,stagedPaymentMap);
        showPreview();
      }catch(err){renderErrors([makeError(1,1,'تعذر قراءة الملف أو نوع الملف غير مدعوم',err&&err.message?err.message:String(err))]);}
    };
    reader.readAsArrayBuffer(file);
  };
  window.showPreview=function(){
    clearErrors();
    const payMissing=(importData||[]).filter(r=>!String(r.pay||'').trim()).length;
    const gross=(importData||[]).reduce((s,r)=>s+safeNum(r.totalInc),0);
    const net=(importData||[]).reduce((s,r)=>s+safeNum(r.totalEx),0);
    const tax=(importData||[]).reduce((s,r)=>s+safeNum(r.tax),0);
    renderImportStats([{label:'عدد البنود',value:fmt0(importData.length)},{label:'شامل الضريبة',value:money(gross)},{label:'قبل الضريبة',value:money(net)},{label:'طرق دفع ناقصة',value:fmt0(payMissing)}]);
    const pc=document.getElementById('previewCard'); if(pc)pc.style.display='block';
    const pt=document.getElementById('previewTitle'); if(pt)pt.textContent=importMode==='items'?'معاينة مبيعات البنود حسب التصنيف':'معاينة أول 30 سجل';
    const headers=HEADERS; const flds=fields;
    const table=document.getElementById('previewTable');
    if(table){
      clearNode(table);
      const thead=document.createElement('thead'); const headRow=document.createElement('tr');
      headers.forEach(h=>appendText(headRow,'th',h)); thead.appendChild(headRow); table.appendChild(thead);
      const tbody=document.createElement('tbody');
      importData.slice(0,30).forEach(r=>{const tr=document.createElement('tr'); flds.forEach(f=>appendText(tr,'td',r[f]??'')); tbody.appendChild(tr);});
      table.appendChild(tbody);
    }
  };
  window.confirmImport=function(replace){
    if(!(importData&&importData.length)){toast('لا توجد بيانات جاهزة للاعتماد');return;}
    pendingOverrideReplace=!!replace; pendingOverrideContext='confirm';
    const errs=[];
    const dup=duplicateErrorsAgainstExisting(importData,replace); errs.push(...dup);
    if(errs.length){renderErrors(errs);return;}
    var existingRows=dsRecords().slice();
    var nextRows=replace?[...importData]:existingRows.concat(importData);
    commitImportedRows(nextRows,'import-confirmed','تم اعتماد البيانات بنجاح بدون تكرار');
  };

  // PETATOE IMPORT OVERRIDE PUBLIC API
  // Runtime verification helper. No data is written by these helpers unless open() is confirmed by Super Admin.
  window.petatoeImportOverride = {
    version: 'v8.0.2-import-override-commit-fix',
    isLoaded: true,
    getLastErrors: function(){ return (lastImportErrors||[]).slice(); },
    getPendingRowsCount: function(){ try{return (importData||[]).length;}catch(_e){return 0;} },
    getRecordsCount: function(){ try{return dsRecords().length;}catch(_e){return 0;} },
    getLastCommit: function(){ return window.__PETATOE_LAST_IMPORT_COMMIT__||null; },
    canOverride: function(){ try{ return isSuperAdminUser(findCurrentFullUser()); }catch(_e){ return false; } },
    open: function(){ return openOverrideModal(); },
    renderButton: function(){
      const box=document.getElementById('importErrors');
      if(box) appendOverrideButton(box);
      return !!document.getElementById('petImportOverrideBtn');
    }
  };

  document.addEventListener('DOMContentLoaded',updateImportModeUI);
  setTimeout(updateImportModeUI,0);
})();
