(function(window){
  'use strict';
  var Core = window.PETATOEReports || {};
  var Heatmap = window.PETATOEHeatmap || {};
  var esc = Core.escapeHtml || function(x){return String(x == null ? '' : x);};
  var renderCache = Heatmap.__renderCache || { entries: [], max: 6 };
  if(!Array.isArray(renderCache.entries)) renderCache = { entries: [], max: 6 };
  Heatmap.__renderCache = renderCache;

  function getCached(key){
    for(var i=0;i<renderCache.entries.length;i++){
      if(renderCache.entries[i].key === key){
        var hit = renderCache.entries.splice(i,1)[0];
        renderCache.entries.unshift(hit);
        return hit.html;
      }
    }
    return '';
  }

  function setCached(key, html){
    renderCache.entries.unshift({key:key, html:html});
    while(renderCache.entries.length > (renderCache.max || 6)) renderCache.entries.pop();
  }

  function clearCache(){
    renderCache.entries = [];
    if(incrementalState && incrementalState.pending) incrementalState.pending = {};
  }

  var Scheduler = window.PETATOERenderScheduler || null;
  if(!Scheduler){
    Scheduler = (function(){
      var queue = [];
      var scheduled = false;
      var maxPerTurn = 2;
      function requestDrain(fn){
        if(window.requestIdleCallback) return window.requestIdleCallback(fn, { timeout: 120 });
        if(window.requestAnimationFrame) return window.requestAnimationFrame(function(){ setTimeout(fn, 0); });
        return setTimeout(fn, 0);
      }
      function drain(){
        scheduled = false;
        var count = 0;
        while(queue.length && count < maxPerTurn){
          var task = queue.shift();
          count += 1;
          try{ task(); }catch(err){ if(window.console && console.warn) console.warn('PETATOE render scheduler task failed', err); }
        }
        if(queue.length) scheduleDrain();
      }
      function scheduleDrain(){
        if(scheduled) return;
        scheduled = true;
        requestDrain(drain);
      }
      return {
        schedule: function(task){
          if(typeof task !== 'function') return;
          queue.push(task);
          scheduleDrain();
        },
        clear: function(){ queue = []; scheduled = false; },
        size: function(){ return queue.length; }
      };
    })();
    window.PETATOERenderScheduler = Scheduler;
  }

  function heatmapSignature(rows, columns){
    rows = Array.isArray(rows) ? rows : [];
    columns = Array.isArray(columns) ? columns : [];
    var len = rows.length;
    var mid = len ? Math.floor(len / 2) : 0;
    function rowSig(row){
      if(!row) return '';
      return columns.slice(0, 10).map(function(c){
        var key = c.key || c;
        return String(row[key] == null ? '' : row[key]).slice(0, 80);
      }).join('~');
    }
    return [
      len,
      columns.map(function(c){ return String(c.key || c.label || c || ''); }).join('|'),
      rowSig(rows[0]),
      rowSig(rows[mid]),
      rowSig(rows[len - 1])
    ].join('||');
  }

  var incrementalState = Heatmap.__incrementalState || { pending: {}, threshold: 300, chunk: 150 };
  Heatmap.__incrementalState = incrementalState;

  function rowHtml(rowsSlice, columns){
    return rowsSlice.map(function(r){
      return '<tr>' + columns.map(function(c){
        var key = c.key || c;
        var value = r[key];
        var level = typeof c.level === 'function' ? c.level(value, r) : '';
        return '<td class="pet-heat-cell ' + esc(level || '') + '">' + esc(value == null ? '' : value) + '</td>';
      }).join('') + '</tr>';
    }).join('');
  }

  function buildHeatmapFragment(rowsSlice, columns){
    var frag = document.createDocumentFragment();
    (rowsSlice || []).forEach(function(r){
      var tr = document.createElement('tr');
      (columns || []).forEach(function(c){
        var key = c.key || c;
        var value = r[key];
        var level = typeof c.level === 'function' ? c.level(value, r) : '';
        var td = document.createElement('td');
        td.className = 'pet-heat-cell ' + String(level || '');
        td.textContent = value == null ? '' : String(value);
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    });
    return frag;
  }

  function scheduleRenderTask(fn){
    if(Scheduler && typeof Scheduler.schedule === 'function') return Scheduler.schedule(fn);
    if(window.requestIdleCallback) return window.requestIdleCallback(fn, {timeout: 120});
    if(window.requestAnimationFrame) return window.requestAnimationFrame(function(){ setTimeout(fn, 0); });
    return setTimeout(fn, 0);
  }

  function render(options){
    options = options || {};
    var columns = options.columns || [];
    var rows = options.rows || [];
    var cacheKey = heatmapSignature(rows, columns);
    var cachedHtml = getCached(cacheKey);
    if(cachedHtml) return cachedHtml;
    var head = columns.map(function(c){ return '<th>' + esc(c.label || c.key || c) + '</th>'; }).join('');
    var fullBody = rowHtml(rows, columns);
    var fullHtml = '<div class="pet-heatmap-wrap" data-pet-render-complete="1"><table class="pet-heatmap-table"><thead><tr>' + head + '</tr></thead><tbody>' + fullBody + '</tbody></table></div>';
    if(rows.length > (incrementalState.threshold || 300) && options.incremental !== false){
      var id = 'petHeatmap_' + Math.random().toString(36).slice(2);
      var firstCount = Math.min(incrementalState.chunk || 150, rows.length);
      incrementalState.pending[id] = { rows: rows, columns: columns, index: firstCount, cacheKey: cacheKey, fullHtml: fullHtml };
      scheduleRenderTask(function appendHeatChunk(){
        var job = incrementalState.pending[id];
        if(!job) return;
        var wrap = document.getElementById(id);
        if(!wrap){ delete incrementalState.pending[id]; return; }
        var tbody = wrap.querySelector('tbody');
        if(!tbody){ delete incrementalState.pending[id]; return; }
        var next = Math.min(job.index + (incrementalState.chunk || 150), job.rows.length);
        tbody.appendChild(buildHeatmapFragment(job.rows.slice(job.index, next), job.columns));
        job.index = next;
        wrap.setAttribute('data-visible', String(next));
        if(next < job.rows.length){
          scheduleRenderTask(appendHeatChunk);
        }else{
          wrap.setAttribute('data-pet-render-complete', '1');
          setCached(job.cacheKey, job.fullHtml);
          delete incrementalState.pending[id];
        }
      });
      return '<div class="pet-heatmap-wrap" id="' + esc(id) + '" data-visible="' + firstCount + '" data-total="' + rows.length + '" data-pet-render-complete="0"><table class="pet-heatmap-table"><thead><tr>' + head + '</tr></thead><tbody>' + rowHtml(rows.slice(0, firstCount), columns) + '</tbody></table></div>';
    }
    setCached(cacheKey, fullHtml);
    return fullHtml;
  }

  Heatmap.render = Heatmap.render || render;
  Heatmap.clearCache = Heatmap.clearCache || clearCache;
  window.PETATOEHeatmap = Heatmap;
})(window);
