/* PETATOE v3.10.5 — Forms Theme Adapter */
(function(window, document){
  'use strict';
  function refresh(root){
    (root || document).querySelectorAll('select,input,textarea,button').forEach(function(el){ el.classList.add('pet-theme-form-ready'); });
  }
  window.PETATOEThemeForms = { refresh:refresh };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){refresh(document);}); else refresh(document);
  window.addEventListener('petatoe:theme-change', function(){refresh(document);});
})(window, document);
