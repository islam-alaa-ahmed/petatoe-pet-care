/* PETATOE v3.11.4 - Dropdown Close On Navigation Fix
   One safe custom dropdown engine for all <select> filters.
   Critical rule: the original <select> remains the source of truth; when a
   custom option is chosen we set selectedIndex/value and dispatch native input/change events.
*/
(function(){
  'use strict';
  if(window.PETATOEFiltersRender && window.PETATOEFiltersRender.__v3114) return;

  var openWrap = null;
  var raf = 0;
  var mo = null;
  var normalizing = false;

  function esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;');
  }
  function textOf(opt){ return (opt && (opt.textContent || opt.label || opt.value) || '').trim(); }
  function byTag(el, tag){ return el && String(el.tagName||'').toUpperCase() === tag; }
  function shouldSkip(sel){
    if(!sel || !byTag(sel,'SELECT')) return true;
    if(sel.multiple) return true;
    if(sel.closest && sel.closest('.pet-no-enhance,.pet-native-select-only,.tox,.ql-toolbar')) return true;
    return false;
  }
  function selectedLabel(sel){
    var opt = sel.options && sel.options[sel.selectedIndex];
    return textOf(opt) || sel.getAttribute('data-placeholder') || sel.value || 'اختر';
  }
  function menuForWrap(wrap){
    if(!wrap) return null;
    var menu = wrap.__petMenu;
    if(menu && document.body && document.body.contains(menu)) return menu;
    menu = document.createElement('div');
    menu.className = 'pet-select-menu';
    menu.setAttribute('role','listbox');
    menu.id = 'pet_select_menu_' + Math.random().toString(36).slice(2);
    wrap.setAttribute('data-menu-id', menu.id);
    menu.setAttribute('data-owner-id', wrap.getAttribute('data-pet-wrap-id') || '');
    document.body.appendChild(menu);
    wrap.__petMenu = menu;
    return menu;
  }
  function closeAll(except){
    document.querySelectorAll('.pet-select-wrap.open').forEach(function(wrap){
      if(except && wrap === except) return;
      wrap.classList.remove('open');
      var menu = wrap.__petMenu || document.getElementById(wrap.getAttribute('data-menu-id')||'');
      if(menu){
        menu.classList.remove('show');
        menu.style.display = 'none';
      }
    });
    document.querySelectorAll('.pet-select-menu').forEach(function(menu){
      var keep = false;
      if(except && except.__petMenu === menu) keep = true;
      if(!keep){ menu.classList.remove('show'); menu.style.display='none'; }
    });
    if(!except) openWrap = null;
  }
  function updateFace(wrap){
    if(!wrap || !wrap.__petSelect) return;
    var label = wrap.querySelector('.pet-select-label');
    if(label) label.textContent = selectedLabel(wrap.__petSelect);
    if(wrap.classList.contains('open')){ fillMenu(wrap); positionMenu(wrap); }
  }
  function fillMenu(wrap){
    var sel = wrap && wrap.__petSelect;
    var menu = menuForWrap(wrap);
    if(!sel || !menu) return menu;
    var html = '';
    Array.prototype.forEach.call(sel.options || [], function(opt, idx){
      var active = idx === sel.selectedIndex || opt.value === sel.value;
      html += '<button type="button" class="pet-select-option'+(active?' active':'')+(opt.disabled?' disabled':'')+'" data-index="'+idx+'" data-value="'+esc(opt.value)+'" '+(opt.disabled?'disabled aria-disabled="true"':'')+'><span>'+esc(textOf(opt))+'</span>'+(active?'<b class="pet-select-check">✓</b>':'')+'</button>';
    });
    if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function') {
      window.PETATOESafeRender.htmlTrusted(menu, html || '<button type="button" class="pet-select-option disabled" disabled>لا توجد اختيارات</button>', 'filters-render dropdown menu');
    } else {
      menu.replaceChildren(document.createRange().createContextualFragment(html || '<button type="button" class="pet-select-option disabled" disabled>لا توجد اختيارات</button>'));
    }
    return menu;
  }
  function positionMenu(wrap){
    var menu = menuForWrap(wrap);
    var face = wrap && wrap.querySelector('.pet-select-face');
    if(!menu || !face) return;
    var r = face.getBoundingClientRect();
    var vw = document.documentElement.clientWidth || window.innerWidth || 1200;
    var vh = document.documentElement.clientHeight || window.innerHeight || 800;
    var w = Math.max(r.width, 170);
    var top = r.bottom + 6;
    var left = r.left;
    if(left + w > vw - 8) left = Math.max(8, vw - w - 8);
    var maxH = Math.min(320, vh - 24);
    menu.style.maxHeight = maxH + 'px';
    if(top + maxH > vh && r.top > 180) top = Math.max(8, r.top - Math.min(maxH, menu.scrollHeight || maxH) - 6);
    menu.style.width = w + 'px';
    menu.style.left = left + 'px';
    menu.style.top = top + 'px';
  }
  function applySelectValue(sel, value, index){
    if(!sel) return;
    var oldValue = sel.value;
    var oldIndex = sel.selectedIndex;
    var matched = false;
    if(index != null && !isNaN(index) && sel.options[index]){
      sel.selectedIndex = Number(index);
      matched = true;
    }else{
      Array.prototype.some.call(sel.options || [], function(opt, i){
        if(String(opt.value) === String(value)){
          sel.selectedIndex = i;
          matched = true;
          return true;
        }
        return false;
      });
      if(!matched) sel.value = value;
    }
    // Keep DOM selected attributes in sync for code that reads selected option directly.
    try{
      Array.prototype.forEach.call(sel.options || [], function(opt, i){ opt.selected = (i === sel.selectedIndex); });
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/filters-render.js",e);}
    var changed = oldValue !== sel.value || oldIndex !== sel.selectedIndex;
    var inputEv, changeEv;
    try{ inputEv = new Event('input', {bubbles:true, cancelable:false}); }catch(e){ inputEv = document.createEvent('Event'); inputEv.initEvent('input', true, false); }
    try{ changeEv = new Event('change', {bubbles:true, cancelable:false}); }catch(e){ changeEv = document.createEvent('HTMLEvents'); changeEv.initEvent('change', true, false); }
    sel.dispatchEvent(inputEv);
    sel.dispatchEvent(changeEv);
    // A few old inline handlers in PETATOE are assigned as properties and some browsers do not run them in file:// reliably.
    if(typeof sel.onchange === 'function'){
      try{ sel.onchange.call(sel, changeEv); }catch(err){ console.error('PETATOE select onchange failed', err); }
    }
    if(window.PETATOEFiltersState && sel.id){
      var scope = sel.closest && sel.closest('[data-filter-scope]');
      window.PETATOEFiltersState.write(sel.id, sel.value, scope ? scope.getAttribute('data-filter-scope') : 'global');
    }
    return changed;
  }
  function enhance(sel){
    if(shouldSkip(sel)) return;
    if(sel.parentElement && sel.parentElement.classList && sel.parentElement.classList.contains('pet-select-wrap')){
      sel.parentElement.__petSelect = sel;
      updateFace(sel.parentElement);
      return;
    }
    var wrap = document.createElement('span');
    wrap.className = 'pet-select-wrap';
    wrap.setAttribute('data-pet-wrap-id','pet_wrap_' + Math.random().toString(36).slice(2));
    var cs = window.getComputedStyle ? getComputedStyle(sel) : null;
    var w = sel.offsetWidth || parseInt((cs && cs.width) || '0',10) || 0;
    if(w > 0) wrap.style.minWidth = Math.max(w, 120) + 'px';
    if((cs && cs.width && cs.width.indexOf('%') > -1) || sel.style.width === '100%') wrap.classList.add('pet-select-block');
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('pet-select-native');
    var face = document.createElement('button');
    face.type = 'button';
    face.className = 'pet-select-face';
    var arrow = document.createElement('span');
    arrow.className = 'pet-select-arrow';
    arrow.textContent = '⌄';
    var labelSpan = document.createElement('span');
    labelSpan.className = 'pet-select-label';
    face.appendChild(arrow);
    face.appendChild(labelSpan);
    wrap.appendChild(face);
    wrap.__petSelect = sel;
    face.addEventListener('click', function(e){
      e.preventDefault();
      e.stopPropagation();
      var willOpen = !wrap.classList.contains('open');
      closeAll(willOpen ? wrap : null);
      if(!willOpen){ closeAll(); return; }
      fillMenu(wrap);
      wrap.classList.add('open');
      var menu = menuForWrap(wrap);
      if(menu){ menu.style.display='block'; menu.classList.add('show'); }
      positionMenu(wrap);
      openWrap = wrap;
    });
    sel.addEventListener('change', function(){ updateFace(wrap); }, false);
    updateFace(wrap);
  }
  function normalize(scope){
    if(normalizing) return;
    normalizing = true;
    try{
      (scope || document).querySelectorAll('select').forEach(enhance);
      (scope || document).querySelectorAll('.pet-select-wrap').forEach(updateFace);
    }catch(e){ console.error('PETATOE filter normalize failed', e); }
    normalizing = false;
  }
  function restoreHorizontalBars(scope){
    try{
      (scope || document).querySelectorAll('.filters,.filters-row,.filter-row,.report-filters,.pet-filter-bar,.top-filters').forEach(function(bar){
        bar.classList.add('pet-filters-horizontal-ready');
      });
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/filters-render.js",e);}
  }
  function ownerWrapFromMenu(menu){
    if(!menu) return null;
    var id = menu.id || '';
    if(id){
      var wrap = document.querySelector('.pet-select-wrap.open[data-menu-id="'+id+'"]');
      if(wrap) return wrap;
    }
    return openWrap;
  }
  function optionPointer(e){
    var btn = e.target && e.target.closest && e.target.closest('.pet-select-option');
    if(!btn || btn.classList.contains('disabled') || btn.disabled) return;
    var menu = btn.closest('.pet-select-menu');
    if(!menu) return;
    var wrap = ownerWrapFromMenu(menu);
    var sel = wrap && wrap.__petSelect;
    if(!sel) return;
    e.preventDefault();
    e.stopPropagation();
    applySelectValue(sel, btn.getAttribute('data-value'), btn.getAttribute('data-index'));
    updateFace(wrap);
    closeAll();
  }
  // Use pointerdown/mousedown capture so selection is applied before any report re-render removes the menu.
  document.addEventListener('pointerdown', optionPointer, true);
  document.addEventListener('mousedown', optionPointer, true);
  // Close open dropdowns before any navigation/report tab click can re-render the page.
  document.addEventListener('pointerdown', function(e){
    if(e.target && e.target.closest && (e.target.closest('.pet-select-wrap') || e.target.closest('.pet-select-menu'))) return;
    closeAll();
  }, true);
  document.addEventListener('click', function(e){
    if(e.target && e.target.closest && e.target.closest('.pet-select-option')){ optionPointer(e); return; }
    if(e.target && e.target.closest && (e.target.closest('.pet-select-wrap') || e.target.closest('.pet-select-menu'))) return;
    closeAll();
  }, true);
  function isMenuScrollTarget(t){
    try{
      return !!(t && t.closest && t.closest('.pet-select-menu'));
    }catch(e){ return false; }
  }
  window.addEventListener('scroll', function(e){
    // Do not close the dropdown when the user drags/scrolls the menu itself.
    // This fixes long month lists in Smart Reports and the main dashboard.
    if(isMenuScrollTarget(e && e.target)) return;
    if(openWrap) closeAll();
  }, true);
  var resizeRaf=0;
  window.addEventListener('resize', function(){
    if(!openWrap) return;
    cancelAnimationFrame(resizeRaf);
    resizeRaf=requestAnimationFrame(function(){ if(openWrap) positionMenu(openWrap); });
  });
  function schedule(){
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function(){ normalize(document); restoreHorizontalBars(document); });
  }
  try{
    mo = new MutationObserver(function(muts){
      // Ignore pure menu-content mutations to avoid rebuilding while selecting an option.
      var real = false;
      for(var i=0;i<muts.length;i++){
        var t = muts[i].target;
        if(t && t.closest && t.closest('.pet-select-menu')) continue;
        real = true; break;
      }
      if(real) schedule();
    });
    if(document.body) mo.observe(document.body,{childList:true,subtree:true});
    else document.addEventListener('DOMContentLoaded', function(){ try{ mo.observe(document.body,{childList:true,subtree:true}); }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/filters-render.js",e);} });
  }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("components/filters-render.js",e);}
  window.PETATOEFiltersRender = {
    __v3114:true,
    normalize:normalize,
    restoreHorizontalBars:restoreHorizontalBars,
    closeAll:closeAll,
    update:function(){ normalize(document); restoreHorizontalBars(document); },
    applySelectValue:applySelectValue
  };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule); else schedule();
})();
