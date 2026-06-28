(function(window){
  'use strict';
  window.PETATOEKPI = window.PETATOEKPI || {
    render: function(options){
      return window.PETATOECards && window.PETATOECards.kpi ? window.PETATOECards.kpi(options || {}) : '';
    },
    renderGrid: function(items, className){
      return window.PETATOECards && window.PETATOECards.kpiGrid ? window.PETATOECards.kpiGrid(items || [], className || '') : '';
    }
  };
})(window);
