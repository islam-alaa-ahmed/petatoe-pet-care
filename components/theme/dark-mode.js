/* PETATOE v3.10.5 — Dark Mode Adapter */
(function(window){
  'use strict';
  window.PETATOEDarkMode = {
    enable:function(){ return window.PETATOETheme && window.PETATOETheme.apply ? window.PETATOETheme.apply('dark') : 'dark'; },
    disable:function(){ return window.PETATOETheme && window.PETATOETheme.apply ? window.PETATOETheme.apply('light') : 'light'; },
    toggle:function(){ return window.PETATOETheme && window.PETATOETheme.toggle ? window.PETATOETheme.toggle() : 'dark'; }
  };
})(window);
