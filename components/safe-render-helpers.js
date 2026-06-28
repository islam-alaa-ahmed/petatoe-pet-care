/*
 * PETATOE v6.1.287 - Safe Render Helpers Boundary
 * Purpose: provide a single safe rendering utility layer before replacing legacy innerHTML usages.
 * This file does not change existing rendering behavior unless modules explicitly opt in.
 */
(function(window, document){
  'use strict';

  var ENTITY_MAP = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;'
  };

  function toStringSafe(value){
    if(value === null || value === undefined){
      return '';
    }
    return String(value);
  }

  function escapeHTML(value){
    return toStringSafe(value).replace(/[&<>"'`]/g, function(char){
      return ENTITY_MAP[char] || char;
    });
  }

  function setText(target, value){
    var el = resolveElement(target);
    if(!el){ return false; }
    el.textContent = toStringSafe(value);
    return true;
  }

  function clear(target){
    var el = resolveElement(target);
    if(!el){ return false; }
    while(el.firstChild){
      el.removeChild(el.firstChild);
    }
    return true;
  }

  function appendText(target, value){
    var el = resolveElement(target);
    if(!el){ return false; }
    el.appendChild(document.createTextNode(toStringSafe(value)));
    return true;
  }

  function setEscapedHTML(target, value){
    var el = resolveElement(target);
    if(!el){ return false; }
    (window.PETATOESecurity || { setInnerHTML: function(node, html){ node.innerHTML = html; } }).setInnerHTML(el, escapeHTML(value));
    return true;
  }

  function setTrustedHTML(target, html, reason){
    var el = resolveElement(target);
    if(!el){ return false; }
    if(window.console && !reason){
      console.warn('[PETATOE SafeRender] setTrustedHTML used without reason.');
    }
    (window.PETATOESecurity || { setInnerHTML: function(node, h){ node.innerHTML = h; } }).setInnerHTML(el, toStringSafe(html));
    return true;
  }

  function appendTrustedHTML(target, html, reason){
    var el = resolveElement(target);
    if(!el){ return false; }
    html = toStringSafe(html);
    if(!html){ return true; }
    if(window.console && !reason){
      console.warn('[PETATOE SafeRender] appendTrustedHTML used without reason.');
    }
    el.insertAdjacentHTML('beforeend', html);
    return true;
  }

  function setSanitizedHTML(target, html){
    var el = resolveElement(target);
    if(!el){ return false; }
    var security = window.PETATOESecurity || null;
    if(security && typeof security.setInnerHTML === 'function'){
      security.setInnerHTML(el, html);
    } else {
      (window.PETATOESecurity || { setInnerHTML: function(node, h){ node.innerHTML = h; } }).setInnerHTML(el, toStringSafe(html));
    }
    return true;
  }

  function createElement(tagName, options){
    var el = document.createElement(tagName || 'div');
    options = options || {};

    if(options.className){
      el.className = options.className;
    }
    if(options.text !== undefined){
      el.textContent = toStringSafe(options.text);
    }
    if(options.attrs && typeof options.attrs === 'object'){
      Object.keys(options.attrs).forEach(function(name){
        var value = options.attrs[name];
        if(value === null || value === undefined || value === false){ return; }
        el.setAttribute(name, String(value));
      });
    }
    return el;
  }

  function replaceChildren(target, children){
    var el = resolveElement(target);
    if(!el){ return false; }
    clear(el);
    (children || []).forEach(function(child){
      if(child === null || child === undefined){ return; }
      if(child.nodeType){
        el.appendChild(child);
      } else {
        el.appendChild(document.createTextNode(toStringSafe(child)));
      }
    });
    return true;
  }

  function resolveElement(target){
    if(!target){ return null; }
    if(typeof target === 'string'){
      return document.getElementById(target) || document.querySelector(target);
    }
    return target.nodeType ? target : null;
  }

  window.PETATOESafeRender = window.PETATOESafeRender || {
    escapeHTML: escapeHTML,
    text: setText,
    clear: clear,
    appendText: appendText,
    htmlEscaped: setEscapedHTML,
    htmlTrusted: setTrustedHTML,
    htmlSanitized: setSanitizedHTML,
    setHTML: setSanitizedHTML,
    setTrustedHTML: setTrustedHTML,
    appendTrusted: appendTrustedHTML,
    createElement: createElement,
    replaceChildren: replaceChildren,
    resolveElement: resolveElement
  };
})(window, document);
