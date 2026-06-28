/* === PETATOE v3.7 ENTRY SEARCHABLE REFERENCES PATCH ===
   Adds searchable customer/item references to Data Entry only.
   Safe: keeps original e_item and e_client input IDs so existing save/report logic remains unchanged. */
(function(){
  'use strict';

  var REF_KEYS = {
    item: 'petatoe_manual_items_v37',
    client: 'petatoe_manual_customers_v37'
  };

  function gid(id){ return document.getElementById(id); }
  function toastMsg(msg){
    try{ if(typeof toast === 'function') toast(msg); else window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"sales/entry-references.js",value:msg}); }catch(e){ window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"sales/entry-references.js",value:msg}); }
  }
  function clean(v){ return String(v == null ? '' : v).replace(/\s+/g,' ').trim(); }
  function norm(v){
    return clean(v)
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g,'')
      .replace(/[إأآا]/g,'ا')
      .replace(/ى/g,'ي')
      .replace(/ة/g,'ه')
      .replace(/ؤ/g,'و')
      .replace(/ئ/g,'ي')
      .replace(/ـ/g,'')
      .replace(/[\-–—_/\\.,،؛:()\[\]{}]+/g,' ')
      .replace(/\s+/g,' ')
      .trim();
  }

  function smartMatch(name, query){
    var n = norm(name), q = norm(query);
    if(!q) return true;
    if(n.indexOf(q) !== -1) return true;
    var tokens = q.split(' ').filter(Boolean);
    if(!tokens.length) return true;
    return tokens.every(function(t){ return n.indexOf(t) !== -1; });
  }

  function safeParse(key){
    try{
      var S=window.PETATOEStorage;var arr = S&&S.readJSON?S.readJSON(key,[]):[];
      return Array.isArray(arr) ? arr.map(clean).filter(Boolean) : [];
    }catch(e){ return []; }
  }
  function safeSave(key, arr){
    try{ var S=window.PETATOEStorage;if(S&&S.writeJSON)S.writeJSON(key, Array.from(new Set(arr.map(clean).filter(Boolean)))); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/entry-references.js",e);}
  }

  function recordsArray(){
    try{
      var fb = window.PETATOEDataSource && window.PETATOEDataSource.getRecordsSync ? window.PETATOEDataSource.getRecordsSync() : [];
      if(Array.isArray(fb)) return fb;
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/entry-references.js",e);}
    return [];
  }

  function buildStats(field){
    var map = new Map();
    recordsArray().forEach(function(r){
      var value = clean(r && r[field]);
      if(!value) return;
      var k = norm(value);
      if(!map.has(k)) map.set(k, {name:value, count:0, last:''});
      var obj = map.get(k);
      obj.count++;
      var d = clean(r.date);
      if(d && (!obj.last || String(d) > String(obj.last))) obj.last = d;
    });
    return map;
  }

  function getRefList(type){
    var field = type === 'client' ? 'client' : 'item';
    var stats = buildStats(field);
    safeParse(REF_KEYS[type]).forEach(function(v){
      var k = norm(v);
      if(!stats.has(k)) stats.set(k, {name:v, count:0, last:''});
    });
    return Array.from(stats.values()).sort(function(a,b){
      if(b.count !== a.count) return b.count - a.count;
      return a.name.localeCompare(b.name, 'ar');
    });
  }

  function addRef(type, value, silent){
    value = clean(value);
    if(!value){
      if(!silent) toastMsg(type === 'client' ? 'اكتب اسم العميل أولاً' : 'اكتب اسم الصنف أولاً');
      return false;
    }
    var key = REF_KEYS[type];
    var arr = safeParse(key);
    var exists = arr.some(function(x){ return norm(x) === norm(value); }) ||
      getRefList(type).some(function(x){ return norm(x.name) === norm(value); });
    if(exists){
      if(!silent) toastMsg(type === 'client' ? 'العميل موجود بالفعل' : 'الصنف موجود بالفعل');
      return false;
    }
    arr.push(value);
    safeSave(key, arr);
    if(!silent) toastMsg(type === 'client' ? 'تمت إضافة العميل للمرجع' : 'تمت إضافة الصنف للمرجع');
    return true;
  }

  function addRefFromPrompt(type, input){
    var current = clean(input && input.value);
    var label = type === 'client' ? 'اسم العميل الجديد' : 'اسم الصنف الجديد';
    var value = current || prompt(label);
    value = clean(value);
    if(!value) return;
    addRef(type, value, false);
    if(input){
      input.value = value;
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.dispatchEvent(new Event('change', {bubbles:true}));
      input.focus();
    }
  }

  function enhanceField(type){
    var field = type === 'client' ? 'client' : 'item';
    var input = gid('e_' + field);
    if(!input || input.dataset.petRefEnhanced === '1') return;

    input.dataset.petRefEnhanced = '1';
    input.setAttribute('autocomplete','off');
    input.setAttribute('placeholder', type === 'client' ? '🔍 ابحث أو اختر عميل' : '🔍 ابحث أو اختر صنف');

    var parent = input.parentNode;
    if(!parent) return;

    var wrap = document.createElement('div');
    wrap.className = 'pet-ref-combo pet-ref-' + type;
    parent.insertBefore(wrap, input);
    wrap.appendChild(input);

    var addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'pet-ref-add-btn';
    addBtn.title = type === 'client' ? 'إضافة عميل جديد' : 'إضافة صنف جديد';
    addBtn.textContent = '+';
    wrap.appendChild(addBtn);

    var menu = document.createElement('div');
    menu.className = 'pet-ref-menu';
    wrap.appendChild(menu);

    var hint = document.createElement('div');
    hint.className = 'pet-ref-hint';
    hint.textContent = type === 'client'
      ? 'اكتب للبحث في العملاء المرفوعين سابقاً، أو اضغط + لإضافة عميل جديد.'
      : 'اكتب للبحث في الأصناف المرفوعة سابقاً، أو اضغط + لإضافة صنف جديد.';
    parent.appendChild(hint);

    var activeIndex = -1;

    function rows(){
      return Array.prototype.slice.call(menu.querySelectorAll('.pet-ref-row'));
    }

    function setActive(idx){
      var rs = rows();
      rs.forEach(function(r){ r.classList.remove('active'); });
      if(idx >= 0 && idx < rs.length){
        activeIndex = idx;
        rs[idx].classList.add('active');
        try{ rs[idx].scrollIntoView({block:'nearest'}); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/entry-references.js",e);}
      }else activeIndex = -1;
    }

    function choose(value){
      input.value = value;
      input.dispatchEvent(new Event('input', {bubbles:true}));
      input.dispatchEvent(new Event('change', {bubbles:true}));
      hide();
    }

    function appendRefRow(item, isNew){
      var row = document.createElement('div');
      row.className = 'pet-ref-row' + (isNew ? ' add-new' : '');
      row.setAttribute('data-value', item.value || '');
      if(isNew) row.setAttribute('data-add', '1');

      var name = document.createElement('span');
      name.className = 'pet-ref-name';
      name.textContent = item.label || '';
      row.appendChild(name);

      var small = document.createElement('small');
      small.textContent = item.sub || '';
      row.appendChild(small);

      row.addEventListener('mousedown', function(ev){
        ev.preventDefault();
        var value = row.getAttribute('data-value') || '';
        if(row.getAttribute('data-add') === '1') addRef(type, value, false);
        choose(value);
      });

      menu.appendChild(row);
    }

    function appendEmpty(){
      var empty = document.createElement('div');
      empty.className = 'pet-ref-empty';
      empty.appendChild(document.createTextNode('لا توجد نتائج مطابقة'));
      empty.appendChild(document.createElement('br'));
      var small = document.createElement('small');
      small.textContent = 'اكتب أي جزء من الاسم أو كلمة من الاسم الثاني/الثالث';
      empty.appendChild(small);
      menu.appendChild(empty);
    }

    function render(){
      var q = norm(input.value);
      var list = getRefList(type);
      var filtered = list.filter(function(x){ return smartMatch(x.name, input.value); }).slice(0, 18);
      var exact = q && list.some(function(x){ return norm(x.name) === q; });
      var hasRows = false;

      menu.replaceChildren();

      filtered.forEach(function(x){
        var sub = x.count ? ((type === 'client' ? x.count + ' عملية' : 'تم استخدامه ' + x.count + ' مرة') + (x.last ? ' · آخر: ' + x.last : '')) : 'مضاف يدويًا';
        appendRefRow({ value: x.name, label: x.name, sub: sub }, false);
        hasRows = true;
      });

      if(q && !exact){
        var value = clean(input.value);
        appendRefRow({
          value: value,
          label: '➕ إضافة ' + (type === 'client' ? 'عميل' : 'صنف') + ' جديد',
          sub: value
        }, true);
        hasRows = true;
      }

      if(!hasRows) appendEmpty();
      activeIndex = -1;
    }

    function show(){ render(); menu.classList.add('show'); }
    function hide(){ setTimeout(function(){ menu.classList.remove('show'); }, 120); }

    function escapeHtml(v){
      return String(v).replace(/[&<>"']/g, function(ch){
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[ch];
      });
    }

    input.addEventListener('focus', show);
    input.addEventListener('input', show);
    input.addEventListener('keydown', function(ev){
      if(!menu.classList.contains('show') && ['ArrowDown','ArrowUp','Enter'].indexOf(ev.key) !== -1) show();
      var rs = rows();
      if(ev.key === 'ArrowDown'){
        ev.preventDefault(); setActive(Math.min(activeIndex + 1, rs.length - 1));
      }else if(ev.key === 'ArrowUp'){
        ev.preventDefault(); setActive(Math.max(activeIndex - 1, 0));
      }else if(ev.key === 'Enter' && activeIndex >= 0 && rs[activeIndex]){
        ev.preventDefault();
        var row = rs[activeIndex], value = row.getAttribute('data-value') || '';
        if(row.getAttribute('data-add') === '1') addRef(type, value, false);
        choose(value);
      }else if(ev.key === 'Escape'){
        menu.classList.remove('show');
      }
    });
    input.addEventListener('blur', hide);
    addBtn.addEventListener('click', function(){ addRefFromPrompt(type, input); });
  }

  function enhanceEntryReferences(){
    enhanceField('item');
    enhanceField('client');
  }

  function rememberCurrentRefs(){
    var item = gid('e_item'), client = gid('e_client');
    if(item && clean(item.value)) addRef('item', item.value, true);
    if(client && clean(client.value)) addRef('client', client.value, true);
  }

  function observeEntryForm(){
    var form = gid('entryForm');
    if(!form || form.__petRefObserver) return;
    form.__petRefObserver = true;
    try{
      var scheduled = false;
      var mo = new MutationObserver(function(){
        if(scheduled) return;
        scheduled = true;
        requestAnimationFrame(function(){
          scheduled = false;
          enhanceEntryReferences();
        });
      });
      form.__petRefMutationObserver = mo;
      mo.observe(form, {childList:true, subtree:true});
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("sales/entry-references.js",e);}
  }

  function init(){
    observeEntryForm();
    enhanceEntryReferences();

    if(window.__PETATOE_ENTRY_REFERENCES_BINDINGS__ === '1') return;
    window.__PETATOE_ENTRY_REFERENCES_BINDINGS__ = '1';

    document.addEventListener('petatoe:record-saved', rememberCurrentRefs);
    document.addEventListener('petatoe:tabchange', function(e){ if(e.detail && e.detail.tabId==='entry') setTimeout(function(){ observeEntryForm(); enhanceEntryReferences(); }, 80); });

    document.addEventListener('click', function(ev){
      if(!ev.target.closest || !ev.target.closest('.pet-ref-combo')){
        document.querySelectorAll('.pet-ref-menu.show').forEach(function(m){ m.classList.remove('show'); });
      }

      var tabBtn = ev.target.closest && ev.target.closest('[data-tab="entry"], button[onclick*="entry"]');
      if(tabBtn) setTimeout(enhanceEntryReferences, 150);
    }, true);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();



  window.petatoeEntryReferenceDebug = function(){
    return {
      recordsCount: recordsArray().length,
      clientsCount: getRefList('client').length,
      itemsCount: getRefList('item').length,
      sampleClients: getRefList('client').slice(0,5).map(function(x){return x.name;}),
      sampleItems: getRefList('item').slice(0,5).map(function(x){return x.name;})
    };
  };

  window.petatoeRefreshEntryReferences = enhanceEntryReferences;
  window.petatoeAddReferenceValue = addRef;
})();
