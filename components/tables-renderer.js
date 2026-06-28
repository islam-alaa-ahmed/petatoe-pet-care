(function(window, document){
  'use strict';
  var Core = window.PETATOEReports || {};
  var Tables = window.PETATOETables || {};
  var esc = Core.escapeHtml || function(x){return String(x == null ? '' : x);};

  var renderCache = Tables.__renderCache || { entries: [], max: 8 };
  if(!Array.isArray(renderCache.entries)) renderCache = { entries: [], max: 8 };
  Tables.__renderCache = renderCache;

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
    while(renderCache.entries.length > (renderCache.max || 8)) renderCache.entries.pop();
  }

  function clearCache(){
    renderCache.entries = [];
    if(incrementalState && incrementalState.pending) incrementalState.pending = {};
    if(virtualState && virtualState.jobs) virtualState.jobs = {};
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

  function rowSignature(row, cols){
    if(!row) return '';
    return (cols || []).slice(0, 8).map(function(c){
      var key = c && c.key;
      var value = key ? row[key] : '';
      return String(value == null ? '' : value).slice(0, 80);
    }).join('~');
  }

  function tableSignature(rows, cols, limit, id){
    rows = Array.isArray(rows) ? rows : [];
    cols = Array.isArray(cols) ? cols : [];
    var len = rows.length;
    var mid = len ? Math.floor(len / 2) : 0;
    var colKey = cols.map(function(c){ return String((c && (c.key || c.label)) || ''); }).join('|');
    return [
      String(id || ''),
      len,
      limit,
      colKey,
      rowSignature(rows[0], cols),
      rowSignature(rows[mid], cols),
      rowSignature(rows[len - 1], cols)
    ].join('||');
  }

  function cell(row, col){
    if(typeof col.render === 'function') return col.render(row);
    return esc(row && row[col.key] != null ? row[col.key] : '');
  }

  var incrementalState = Tables.__incrementalState || { pending: {}, threshold: 350, chunk: 175 };
  Tables.__incrementalState = incrementalState;

  // Phase 9-B1 SAFE: opt-in virtual table engine.
  // It is disabled by default so existing reports, PDF/Excel and screen behavior remain unchanged.
  var virtualState = Tables.__virtualState || { jobs: {}, threshold: 2500, rowHeight: 38, overscan: 8, viewportRows: 40 };
  if(!virtualState.jobs) virtualState.jobs = {};
  Tables.__virtualState = virtualState;

  function buildRowsHtml(slice, cols){
    return slice.map(function(r){
      return '<tr>' + cols.map(function(c){ return '<td>' + cell(r,c) + '</td>'; }).join('') + '</tr>';
    }).join('');
  }

  function buildRowsFragment(slice, cols){
    var frag = document.createDocumentFragment();
    (slice || []).forEach(function(r){
      var tr = document.createElement('tr');
      (cols || []).forEach(function(c){
        var td = document.createElement('td');
        var value = cell(r, c);
        if(value == null) value = '';
        if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function') { window.PETATOESafeRender.htmlTrusted(td, String(value), 'tables-renderer cell html'); } else { td.textContent=''; td.insertAdjacentHTML('beforeend', String(value)); }
        tr.appendChild(td);
      });
      frag.appendChild(tr);
    });
    return frag;
  }

  function buildFullHtml(id, rows, cols, limit){
    var visible = rows.slice(0, limit);
    var header = cols.map(function(c){ return '<th>' + esc(c.label || c.key || '') + '</th>'; }).join('');
    var body = buildRowsHtml(visible, cols) || '<tr><td colspan="' + cols.length + '" class="pet-empty-cell">لا توجد بيانات</td></tr>';
    var more = rows.length > visible.length ? '<button type="button" class="pet-show-more-btn" data-pet-table-more="' + esc(id) + '">اضغط لعرض المزيد</button>' : '';
    return '<div class="pet-table-wrap" id="' + esc(id) + '" data-visible="' + visible.length + '" data-total="' + rows.length + '" data-pet-render-complete="1"><table class="pet-data-table"><thead><tr>' + header + '</tr></thead><tbody>' + body + '</tbody></table>' + more + '</div>';
  }

  function scheduleRenderTask(fn){
    if(Scheduler && typeof Scheduler.schedule === 'function') return Scheduler.schedule(fn);
    if(window.requestIdleCallback) return window.requestIdleCallback(fn, {timeout: 120});
    if(window.requestAnimationFrame) return window.requestAnimationFrame(function(){ setTimeout(fn, 0); });
    return setTimeout(fn, 0);
  }

  function scheduleIncrementalAppend(id, rows, cols, start, chunk, cacheKey, fullHtml){
    incrementalState.pending[id] = { rows: rows, cols: cols, index: start, chunk: chunk, cacheKey: cacheKey, fullHtml: fullHtml };
    scheduleRenderTask(function appendChunk(){
      var job = incrementalState.pending[id];
      if(!job) return;
      var wrap = document.getElementById(id);
      if(!wrap){ delete incrementalState.pending[id]; return; }
      var tbody = wrap.querySelector('tbody');
      if(!tbody){ delete incrementalState.pending[id]; return; }
      var next = Math.min(job.index + job.chunk, job.rows.length);
      tbody.appendChild(buildRowsFragment(job.rows.slice(job.index, next), job.cols));
      job.index = next;
      wrap.setAttribute('data-visible', String(next));
      if(next < job.rows.length){
        scheduleRenderTask(appendChunk);
      }else{
        wrap.setAttribute('data-pet-render-complete', '1');
        setCached(job.cacheKey, job.fullHtml);
        delete incrementalState.pending[id];
      }
    });
  }

  function buildVirtualRowsHtml(rows, cols, start, end, total, rowHeight){
    var topHeight = Math.max(0, start * rowHeight);
    var bottomHeight = Math.max(0, (total - end) * rowHeight);
    var html = '';
    if(topHeight) html += '<tr aria-hidden="true" class="pet-virtual-spacer"><td colspan="' + cols.length + '" style="height:' + topHeight + 'px;padding:0;border:0"></td></tr>';
    html += buildRowsHtml(rows.slice(start, end), cols);
    if(bottomHeight) html += '<tr aria-hidden="true" class="pet-virtual-spacer"><td colspan="' + cols.length + '" style="height:' + bottomHeight + 'px;padding:0;border:0"></td></tr>';
    return html || '<tr><td colspan="' + cols.length + '" class="pet-empty-cell">لا توجد بيانات</td></tr>';
  }

  function renderVirtualWindow(id){
    var job = virtualState.jobs[id];
    if(!job) return;
    var wrap = document.getElementById(id);
    if(!wrap) return;
    var tbody = wrap.querySelector('tbody');
    if(!tbody) return;
    var rowHeight = job.rowHeight || virtualState.rowHeight || 38;
    var viewportRows = job.viewportRows || virtualState.viewportRows || 40;
    var overscan = job.overscan || virtualState.overscan || 8;
    var start = Math.max(0, Math.floor((wrap.scrollTop || 0) / rowHeight) - overscan);
    var end = Math.min(job.rows.length, start + viewportRows + (overscan * 2));
    if(start === job.lastStart && end === job.lastEnd) return;
    job.lastStart = start;
    job.lastEnd = end;
    var virtualHtml = buildVirtualRowsHtml(job.rows, job.cols, start, end, job.rows.length, rowHeight);
    if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function') {
      window.PETATOESafeRender.htmlTrusted(tbody, virtualHtml, 'tables-renderer virtual rows');
    } else {
      tbody.textContent = '';
      tbody.insertAdjacentHTML('beforeend', virtualHtml);
    }
    wrap.setAttribute('data-visible', String(end - start));
    wrap.setAttribute('data-pet-virtual-start', String(start));
    wrap.setAttribute('data-pet-virtual-end', String(end));
  }

  function scheduleVirtualMount(id, attempts){
    attempts = attempts || 0;
    scheduleRenderTask(function(){
      var wrap = document.getElementById(id);
      if(!wrap){
        if(attempts < 8) scheduleVirtualMount(id, attempts + 1);
        return;
      }
      if(wrap.getAttribute('data-pet-virtual-bound') !== '1'){
        wrap.setAttribute('data-pet-virtual-bound', '1');
        wrap.addEventListener('scroll', function(){
          if(wrap.__petVirtualFrame) return;
          wrap.__petVirtualFrame = true;
          (window.requestAnimationFrame || function(fn){ return setTimeout(fn, 16); })(function(){
            wrap.__petVirtualFrame = false;
            renderVirtualWindow(id);
          });
        }, { passive: true });
      }
      renderVirtualWindow(id);
    });
  }

  function virtualTable(options){
    options = options || {};
    var rows = Array.isArray(options.rows) ? options.rows : [];
    var cols = Array.isArray(options.columns) ? options.columns : [];
    var id = options.id || ('petVirtualTable_' + Math.random().toString(36).slice(2));
    var rowHeight = Number(options.rowHeight || virtualState.rowHeight || 38);
    if(!isFinite(rowHeight) || rowHeight < 24) rowHeight = 38;
    var height = Number(options.height || 520);
    if(!isFinite(height) || height < 220) height = 520;
    var viewportRows = Math.max(12, Math.ceil(height / rowHeight));
    var header = cols.map(function(c){ return '<th>' + esc(c.label || c.key || '') + '</th>'; }).join('');
    virtualState.jobs[id] = {
      rows: rows,
      cols: cols,
      rowHeight: rowHeight,
      viewportRows: viewportRows,
      overscan: Number(options.overscan || virtualState.overscan || 8),
      lastStart: -1,
      lastEnd: -1
    };
    var body = buildVirtualRowsHtml(rows, cols, 0, Math.min(rows.length, viewportRows + (virtualState.overscan || 8)), rows.length, rowHeight);
    scheduleVirtualMount(id, 0);
    return '<div class="pet-table-wrap pet-virtual-table-wrap" id="' + esc(id) + '" data-total="' + rows.length + '" data-visible="0" data-pet-render-complete="virtual" data-pet-virtual="1" style="max-height:' + height + 'px;overflow:auto"><table class="pet-data-table"><thead><tr>' + header + '</tr></thead><tbody>' + body + '</tbody></table></div>';
  }

  function table(options){
    options = options || {};
    var rows = Array.isArray(options.rows) ? options.rows : [];
    var cols = Array.isArray(options.columns) ? options.columns : [];
    var limit = options.limit === 'all' ? rows.length : Number(options.limit || rows.length);
    if(!isFinite(limit) || limit < 0) limit = rows.length;
    var id = options.id || ('petTable_' + Math.random().toString(36).slice(2));
    var cacheKey = tableSignature(rows, cols, limit, id);
    var cachedHtml = getCached(cacheKey);
    if(cachedHtml) return cachedHtml;

    var virtualThreshold = Number(options.virtualThreshold || virtualState.threshold || 2500);
    if(!isFinite(virtualThreshold) || virtualThreshold < 50) virtualThreshold = virtualState.threshold || 2500;
    if(options.virtual === true && limit === rows.length && rows.length > virtualThreshold){
      return virtualTable({
        id: id,
        rows: rows,
        columns: cols,
        height: options.height,
        rowHeight: options.rowHeight,
        overscan: options.overscan
      });
    }

    var fullHtml = buildFullHtml(id, rows, cols, limit);
    var shouldIncrement = limit === rows.length && rows.length > (incrementalState.threshold || 350) && options.incremental !== false;
    if(shouldIncrement){
      var firstCount = Math.min(incrementalState.chunk || 175, rows.length);
      var header = cols.map(function(c){ return '<th>' + esc(c.label || c.key || '') + '</th>'; }).join('');
      var firstBody = buildRowsHtml(rows.slice(0, firstCount), cols);
      var html = '<div class="pet-table-wrap" id="' + esc(id) + '" data-visible="' + firstCount + '" data-total="' + rows.length + '" data-pet-render-complete="0"><table class="pet-data-table"><thead><tr>' + header + '</tr></thead><tbody>' + firstBody + '</tbody></table></div>';
      scheduleIncrementalAppend(id, rows, cols, firstCount, incrementalState.chunk || 175, cacheKey, fullHtml);
      return html;
    }
    setCached(cacheKey, fullHtml);
    return fullHtml;
  }


  function htmlToText(value){
    value = value == null ? '' : String(value);
    if(value.indexOf('<') < 0) return value;
    var div = document.createElement('div');
    if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function') { window.PETATOESafeRender.htmlTrusted(div, value, 'tables-renderer htmlToText'); } else { div.textContent=''; div.insertAdjacentHTML('beforeend', value); }
    return (div.innerText || div.textContent || '').trim();
  }

  function rowsForExport(id){
    var wrap = id && document.getElementById(String(id).replace(/^#/,''));
    var exportId = wrap ? wrap.id : String(id || '');
    var job = incrementalState && incrementalState.pending ? incrementalState.pending[exportId] : null;
    if((!job || !Array.isArray(job.rows) || !Array.isArray(job.cols)) && virtualState && virtualState.jobs){
      job = virtualState.jobs[exportId] || null;
    }
    if(!job || !Array.isArray(job.rows) || !Array.isArray(job.cols)) return null;
    var header = job.cols.map(function(c){ return htmlToText(c && (c.label || c.key) || ''); });
    var body = job.rows.map(function(r){
      return job.cols.map(function(c){ return htmlToText(cell(r, c)); });
    });
    return [header].concat(body);
  }

  function attachShowMore(registry){
    if(attachShowMore.bound) return;
    attachShowMore.bound = true;
    document.addEventListener('click', function(e){
      var btn = e.target && e.target.closest && e.target.closest('[data-pet-table-more]');
      if(!btn) return;
      var key = btn.getAttribute('data-pet-table-more');
      var item = registry && registry[key];
      if(item && typeof item.onMore === 'function') item.onMore(key);
    });
  }

  Tables.render = Tables.render || table;
  Tables.renderVirtual = Tables.renderVirtual || virtualTable;
  Tables.attachShowMore = Tables.attachShowMore || attachShowMore;
  Tables.clearCache = Tables.clearCache || clearCache;
  Tables.rowsForExport = Tables.rowsForExport || rowsForExport;
  Object.assign(window.PETATOETables, Tables);
})(window, document);
