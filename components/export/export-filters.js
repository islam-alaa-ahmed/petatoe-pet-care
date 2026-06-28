/* PETATOE v3.10.3 - Export Filters
   Captures visible filter values so printed/PDF reports show the active context. */
(function(){
  'use strict';
  var ns = window.PETATOEExport;
  function labelOf(el){
    if(!el) return '';
    var label = el.getAttribute('aria-label') || el.getAttribute('data-label') || el.getAttribute('title') || '';
    if(!label && el.id){
      var l = null;
      try{
        var safeId = (window.CSS && CSS.escape) ? CSS.escape(el.id) : String(el.id).replace(/\"/g,'\\\"');
        l = document.querySelector('label[for="'+safeId+'"]');
      }catch(e){ l = null; }
      if(l) label = l.innerText || l.textContent || '';
    }
    if(!label){
      var p = el.closest('.filter-control,.pet-filter,.field,.control,.yoy-filter-item');
      if(p){
        var b = p.querySelector('label,b,span,small');
        if(b) label = b.innerText || b.textContent || '';
      }
    }
    return String(label || el.id || el.name || 'فلتر').trim().replace(/[:：]+$/,'');
  }
  function valueOf(el){
    if(!el) return '';
    if(el.tagName === 'SELECT'){
      var opt = el.options[el.selectedIndex];
      return opt ? (opt.text || opt.value || '').trim() : (el.value || '');
    }
    return (el.value || el.getAttribute('value') || '').trim();
  }
  ns.collectFilters = function(scope){
    var root = ns.getNode ? (ns.getNode(scope) || document) : document;
    var controls = root.querySelectorAll('select,input[type="date"],input[type="search"],input[data-export-filter]');
    var out = [];
    controls.forEach(function(el){
      if(el.disabled || el.offsetParent === null) return;
      var value = valueOf(el);
      if(!value) return;
      out.push({label:labelOf(el), value:value});
    });
    return out;
  };
  ns.filtersHtml = function(filters){
    if(!filters || !filters.length) return '';
    return '<div class="pet-export-filters">'+filters.map(function(f){
      var label = ns.escapeHtml ? ns.escapeHtml(f.label) : String(f.label || '');
      var value = ns.escapeHtml ? ns.escapeHtml(f.value) : String(f.value || '');
      return '<span><b>'+label+':</b> '+value+'</span>';
    }).join('')+'</div>';
  };
})();
