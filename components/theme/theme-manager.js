/* PETATOE v3.10.5 — Theme Manager
   Bridges old dark-mode buttons with the new central theme engine. */
(function(window, document){
  'use strict';
  if(window.PETATOEThemeManager && window.PETATOEThemeManager.__bound) return;
  function syncControls(){
    var theme = window.PETATOETheme && window.PETATOETheme.current ? window.PETATOETheme.current() : (document.documentElement.getAttribute('data-theme') || 'dark');
    document.querySelectorAll('[data-theme-toggle], #darkModeToggle, .theme-toggle input[type="checkbox"]').forEach(function(el){
      if(el.type === 'checkbox') el.checked = (theme === 'dark');
      el.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    });
  }
  function bind(){
    if(bind.__done) { syncControls(); return; }
    bind.__done = true;
    document.addEventListener('click', function(e){
      var btn = e.target.closest && e.target.closest('[data-theme-toggle], .theme-toggle-btn');
      if(!btn) return;
      if(window.PETATOETheme && window.PETATOETheme.toggle){ window.PETATOETheme.toggle(); syncControls(); }
    }, true);
    document.addEventListener('change', function(e){
      var el = e.target;
      if(!el) return;
      if(el.matches && el.matches('#darkModeToggle, .theme-toggle input[type="checkbox"]')){
        if(window.PETATOETheme && window.PETATOETheme.apply){ window.PETATOETheme.apply(el.checked ? 'dark' : 'light'); syncControls(); }
      }
    }, true);
    window.addEventListener('petatoe:theme-change', syncControls);
    syncControls();
  }
  window.PETATOEThemeManager = { __bound:true, syncControls:syncControls, bind:bind };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
})(window, document);
