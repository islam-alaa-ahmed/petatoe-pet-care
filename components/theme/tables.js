/* PETATOE v3.10.5 — Tables Theme Adapter */
(function(window, document){
  'use strict';
  function refresh(root){
    (root || document).querySelectorAll('table,.table-wrap').forEach(function(el){ el.classList.add('pet-theme-table-ready'); });
  }
  window.PETATOEThemeTables = { refresh:refresh };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){refresh(document);}); else refresh(document);
  window.addEventListener('petatoe:theme-change', function(){refresh(document);});
})(window, document);
