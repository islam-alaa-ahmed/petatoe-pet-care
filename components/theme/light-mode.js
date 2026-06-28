/* PETATOE v3.10.5 — Light Mode Adapter */
(function(window){
  'use strict';
  window.PETATOELightMode = {
    enable:function(){ return window.PETATOETheme && window.PETATOETheme.apply ? window.PETATOETheme.apply('light') : 'light'; }
  };
})(window);
