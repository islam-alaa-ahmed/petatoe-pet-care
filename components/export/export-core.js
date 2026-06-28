/* PETATOE v3.10.3 - Export Core
   Unified export helpers used by PDF / Excel / Print engines.
   This file does not change existing report calculations. */
(function(){
  'use strict';
  var ns = window.PETATOEExport;
  ns.version = '3.10.3';
  ns.safeName = function(name){
    return String(name || 'PETATOE_Report')
      .replace(/[\/:*?"<>|]+/g,'_')
      .replace(/\s+/g,'_')
      .slice(0,120);
  };
  ns.notify = function(msg){
    if(typeof window.toast === 'function') window.toast(msg);
    else window.PETATOEDiagnostics&&window.PETATOEDiagnostics.info&&window.PETATOEDiagnostics.info("production-log",{source:"components/export/export-core.js",value:'[PETATOEExport]', msg});
  };
  ns.escapeHtml = function(v){
    return String(v == null ? '' : v).replace(/[&<>'"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c];
    });
  };
  ns.getNode = function(target){
    if(!target) return null;
    if(typeof target === 'string'){
      var value = String(target);
      var byId = document.getElementById(value.replace(/^#/,''));
      if(byId) return byId;
      try{
        return document.querySelector(value);
      }catch(_err){
        return null;
      }
    }
    return target.nodeType ? target : null;
  };
  ns.scrubExportClone = function(root){
    if(!root || !root.querySelectorAll) return root;
    var nodes = [root].concat(Array.prototype.slice.call(root.querySelectorAll('*')));
    nodes.forEach(function(el){
      if(!el || !el.attributes) return;
      Array.prototype.slice.call(el.attributes).forEach(function(attr){
        var name = String(attr.name || '').toLowerCase();
        var value = String(attr.value || '').trim();
        // Printed/PDF clones must not carry runtime event handlers or script URLs.
        if(/^on/.test(name) || ((name === 'href' || name === 'src' || name === 'xlink:href') && /^javascript:/i.test(value))){
          el.removeAttribute(attr.name);
        }
      });
    });
    return root;
  };

  ns.expandVirtualTablesInClone = function(clone){
    if(!clone || !clone.querySelectorAll || !window.PETATOETables || typeof window.PETATOETables.rowsForExport !== 'function') return clone;
    clone.querySelectorAll('[data-pet-virtual="1"], [data-pet-render-complete="virtual"]').forEach(function(wrap){
      var id = wrap && wrap.id;
      if(!id) return;
      var rows = window.PETATOETables.rowsForExport(id);
      if(!rows || !rows.length) return;
      var table = document.createElement('table');
      table.className = 'pet-data-table pet-export-expanded-table';
      var thead = document.createElement('thead');
      var tbody = document.createElement('tbody');
      rows.forEach(function(row, idx){
        var tr = document.createElement('tr');
        (row || []).forEach(function(cell){
          var el = document.createElement(idx === 0 ? 'th' : 'td');
          el.textContent = cell == null ? '' : String(cell);
          tr.appendChild(el);
        });
        (idx === 0 ? thead : tbody).appendChild(tr);
      });
      table.appendChild(thead);
      table.appendChild(tbody);
      if(window.PETATOESafeRender && typeof window.PETATOESafeRender.clear === 'function'){
        window.PETATOESafeRender.clear(wrap);
      } else {
        while(wrap.firstChild){ wrap.removeChild(wrap.firstChild); }
      }
      wrap.appendChild(table);
      wrap.setAttribute('data-pet-export-expanded','1');
      wrap.style.maxHeight = 'none';
      wrap.style.overflow = 'visible';
    });
    return clone;
  };
  ns.cloneForExport = function(target){
    var node = ns.getNode(target);
    if(!node) return null;
    var clone = node.cloneNode(true);
    clone.querySelectorAll('script,style,[data-export-ignore],.no-export,.pet-select-menu,.pet-select-face').forEach(function(x){x.remove();});
    if(ns.expandVirtualTablesInClone) ns.expandVirtualTablesInClone(clone);
    return ns.scrubExportClone ? ns.scrubExportClone(clone) : clone;
  };
  ns.tableToRows = function(table){
    var node = ns.getNode(table);
    if(!node) return [];
    var wrap = node.classList && node.classList.contains('pet-table-wrap') ? node : (node.closest ? node.closest('.pet-table-wrap') : null);
    if(wrap && window.PETATOETables && typeof window.PETATOETables.rowsForExport === 'function'){
      var renderState = wrap.getAttribute('data-pet-render-complete');
      var isVirtual = wrap.getAttribute('data-pet-virtual') === '1';
      if(renderState === '0' || renderState === 'virtual' || isVirtual){
        var fullRows = window.PETATOETables.rowsForExport(wrap.id);
        if(fullRows && fullRows.length) return fullRows;
      }
    }
    return Array.prototype.slice.call(node.querySelectorAll('tr')).map(function(tr){
      return Array.prototype.slice.call(tr.children).map(function(td){return (td.innerText || td.textContent || '').trim();});
    }).filter(function(row){return row.length;});
  };
  ns.safeCsvCell = function(cell){
    var v = String(cell == null ? '' : cell).replace(/\r?\n/g,' ');
    // Prevent CSV formula injection when files are opened in spreadsheet apps.
    // This only affects exported CSV text, not PETATOE runtime data.
    if(/^[\s]*[=+\-@]/.test(v)) v = "'" + v;
    return v.replace(/"/g,'""');
  };
  ns.rowsToCsv = function(rows){
    return (rows || []).map(function(row){
      return row.map(function(cell){
        var v = ns.safeCsvCell ? ns.safeCsvCell(cell) : String(cell == null ? '' : cell).replace(/\r?\n/g,' ').replace(/"/g,'""');
        return /[",\n;]/.test(v) ? '"'+v+'"' : v;
      }).join(',');
    }).join('\ufeff\n');
  };
  ns.downloadText = function(text, filename, mime){
    var blob = new Blob([text], {type:mime || 'text/plain;charset=utf-8'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);}, 1500);
  };
})();
