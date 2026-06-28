(function(window, document){
  'use strict';

  if(window.__PETATOE_REPORTS_ENGINE_READY__ && window.PETATOEReports){
    return;
  }
  window.__PETATOE_REPORTS_ENGINE_READY__ = true;

  var PETATOEReports = window.PETATOEReports || {};

  function escapeHtml(value){
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  }

  function toNumber(value){
    var n = Number(String(value == null ? 0 : value).replace(/,/g,''));
    return isFinite(n) ? n : 0;
  }

  function formatNumber(value, digits){
    var n = toNumber(value);
    return n.toLocaleString('en-US', {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits || 0
    });
  }

  function formatCash(value, currency){
    return formatNumber(value, 2) + (currency ? ' ' + currency : '');
  }

  function query(target){
    if(!target) return null;
    if(typeof target === 'string') return document.querySelector(target);
    return target;
  }

  function mount(target, html){
    var el = query(target);
    if(!el) return false;
    html = html || '';
    if(el.__petatoeLastReportHtml === html) return true;
    el.__petatoeLastReportHtml = html;
    if(window.PETATOESafeRender && typeof window.PETATOESafeRender.htmlTrusted === 'function') {
      window.PETATOESafeRender.htmlTrusted(el, html, 'reports-engine mount');
    } else {
      el.replaceChildren(document.createRange().createContextualFragment(html));
    }
    return true;
  }

  function append(target, html){
    var el = query(target);
    if(!el) return false;
    html = html || '';
    if(!html) return true;
    el.__petatoeLastReportHtml = '';
    if(window.PETATOESafeRender && typeof window.PETATOESafeRender.appendTrusted === 'function') {
      window.PETATOESafeRender.appendTrusted(el, html, 'reports-engine append');
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
    return true;
  }

  function clear(target){
    return mount(target, '');
  }

  function section(options){
    options = options || {};
    var cls = options.className ? ' ' + escapeHtml(options.className) : '';
    var title = options.title ? '<h3 class="pet-report-title">' + escapeHtml(options.title) + '</h3>' : '';
    var subtitle = options.subtitle ? '<p class="pet-report-subtitle">' + escapeHtml(options.subtitle) + '</p>' : '';
    var actions = options.actions || '';
    return '' +
      '<section class="pet-report-section' + cls + '">' +
        '<div class="pet-report-section-head">' +
          '<div>' + title + subtitle + '</div>' +
          '<div class="pet-report-section-actions">' + actions + '</div>' +
        '</div>' +
        '<div class="pet-report-section-body">' + (options.body || '') + '</div>' +
      '</section>';
  }

  function grid(items, className){
    return '<div class="pet-report-grid ' + escapeHtml(className || '') + '">' + (items || []).join('') + '</div>';
  }

  function safeRender(name, fn){
    try{
      if(typeof fn === 'function') return fn();
      return '';
    }catch(err){
      console.error('[PETATOEReports] render failed:', name, err);
      return '<div class="pet-report-error">حدث خطأ أثناء عرض التقرير: ' + escapeHtml(name || '') + '</div>';
    }
  }

  PETATOEReports.escapeHtml = PETATOEReports.escapeHtml || escapeHtml;
  PETATOEReports.toNumber = PETATOEReports.toNumber || toNumber;
  PETATOEReports.formatNumber = PETATOEReports.formatNumber || formatNumber;
  PETATOEReports.formatCash = PETATOEReports.formatCash || formatCash;
  PETATOEReports.mount = PETATOEReports.mount || mount;
  PETATOEReports.append = PETATOEReports.append || append;
  PETATOEReports.clear = PETATOEReports.clear || clear;
  PETATOEReports.section = PETATOEReports.section || section;
  PETATOEReports.grid = PETATOEReports.grid || grid;
  PETATOEReports.safeRender = PETATOEReports.safeRender || safeRender;

  window.PETATOEReports = PETATOEReports;
})(window, document);
