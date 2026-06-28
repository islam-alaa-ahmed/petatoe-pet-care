/* PETATOE v3.10.0 - Buttons Core
   واجهة موحدة مستقبلية للأزرار المشتركة. لا تغير سلوك الأزرار الحالية. */
(function(){
  'use strict';
  if(window.PETATOEButtons && window.PETATOEButtons.__v310) return;
  var bindSeq = 0;
  var boundKeys = {};
  function bind(selector, handler, opts){
    if(!selector || typeof handler !== 'function') return false;
    if(!handler.__petatoeButtonBindId) handler.__petatoeButtonBindId = 'h' + (++bindSeq);
    var key = String(selector) + '|' + handler.__petatoeButtonBindId + '|' + (opts && opts.preventDefault ? 'pd' : '');
    if(boundKeys[key]) return false;
    boundKeys[key] = true;
    document.addEventListener('click', function(e){
      var el = e.target && e.target.closest ? e.target.closest(selector) : null;
      if(!el) return;
      if(opts && opts.preventDefault) e.preventDefault();
      handler(el, e);
    });
    return true;
  }
  window.PETATOEButtons = {__v310:true, bind:bind, __boundKeys:boundKeys};
})();
