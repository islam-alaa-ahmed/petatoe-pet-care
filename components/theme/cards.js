/* PETATOE v3.10.5 — Cards Theme Adapter */
(function(window, document){
  'use strict';
  function normalize(root){
    (root || document).querySelectorAll('.kpi,.card,.report-card,.smart-card,.analytics-card').forEach(function(el){
      el.classList.add('pet-theme-card-ready');
    });
  }
  window.PETATOEThemeCards = { normalize:normalize };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function(){normalize(document);}); else normalize(document);
  window.addEventListener('petatoe:theme-change', function(){normalize(document);});
})(window, document);
