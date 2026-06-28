/* PETATOE Security Hardening v6.1.51
   Centralized HTML escaping/sanitizing helpers for legacy innerHTML renderers.
   Scope: defensive XSS hardening only; no UI/data/report logic changes. */
(function(w){
  'use strict';
  if(w.PETATOESecurity && (w.PETATOESecurity.__v6151 || w.PETATOESecurity.__v6128)) return;

  var ENTITY_MAP = {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;'};
  var BLOCKED_TAGS = /^(script|iframe|object|embed|applet|base|meta|link)$/i;
  var URL_ATTRS = /^(href|src|xlink:href|formaction|poster)$/i;
  var UNSAFE_STYLE = /(expression\s*\(|url\s*\(\s*[\"']?\s*(javascript|vbscript|data):)/i;

  function toText(value){
    return String(value == null ? '' : value);
  }

  function escapeHtml(value){
    return toText(value).replace(/[&<>"'`]/g,function(ch){ return ENTITY_MAP[ch] || ch; });
  }

  function escapeAttr(value){
    return escapeHtml(value);
  }

  function isUnsafeUrl(value){
    var v = toText(value).replace(/[\u0000-\u001F\u007F\s]+/g,'').toLowerCase();
    return /^(javascript|vbscript|data):/i.test(v) && !/^data:image\//i.test(v);
  }

  function sanitizeNode(node){
    if(!node) return;
    var children = Array.prototype.slice.call(node.children || []);
    children.forEach(function(child){
      if(BLOCKED_TAGS.test(child.tagName || '')){
        child.parentNode && child.parentNode.removeChild(child);
        return;
      }
      Array.prototype.slice.call(child.attributes || []).forEach(function(attr){
        var name = attr.name || '';
        var value = attr.value || '';
        if(/^on/i.test(name) || name.toLowerCase() === 'srcdoc' || (URL_ATTRS.test(name) && isUnsafeUrl(value)) || (name.toLowerCase() === 'style' && UNSAFE_STYLE.test(value))){
          child.removeAttribute(name);
        }
        if(name.toLowerCase() === 'target' && value === '_blank' && !child.getAttribute('rel')){
          child.setAttribute('rel','noopener noreferrer');
        }
      });
      sanitizeNode(child);
    });
  }

  function sanitizeHtml(html){
    html = toText(html);
    if(!html) return '';
    try{
      var template = document.createElement('template');
      template.innerHTML = html; // setInnerHTML internal sanitizer parse boundary
      sanitizeNode(template.content);
      return template.innerHTML;
    }catch(e){
      return escapeHtml(html);
    }
  }

  function setInnerHTML(element, html){
    if(element) element.innerHTML = sanitizeHtml(html);
  }

  function safeJsonParse(value, fallback){
    try{
      if(typeof value !== 'string') return fallback;
      return JSON.parse(value);
    }catch(e){
      return fallback;
    }
  }

  w.PETATOESecurity = {
    __v6128: true,
    __v6151: true,
    escapeHtml: escapeHtml,
    escapeAttr: escapeAttr,
    sanitizeHtml: sanitizeHtml,
    setInnerHTML: setInnerHTML,
    safeJsonParse: safeJsonParse
  };
})(window);
