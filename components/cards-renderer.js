(function(window){
  'use strict';
  var Core = window.PETATOEReports || {};
  var Cards = window.PETATOECards || {};

  function esc(v){ return (Core.escapeHtml || function(x){return String(x == null ? '' : x);})(v); }

  function kpi(card){
    card = card || {};
    var cls = card.className ? ' ' + esc(card.className) : '';
    return '' +
      '<div class="pet-kpi-card' + cls + '">' +
        '<div class="pet-kpi-icon">' + esc(card.icon || '') + '</div>' +
        '<div class="pet-kpi-content">' +
          '<span>' + esc(card.label || card.title || '') + '</span>' +
          '<b>' + esc(card.value == null ? '' : card.value) + '</b>' +
          (card.hint ? '<small>' + esc(card.hint) + '</small>' : '') +
        '</div>' +
      '</div>';
  }

  function info(card){
    card = card || {};
    return '' +
      '<div class="pet-info-card ' + esc(card.className || '') + '">' +
        (card.title ? '<h4>' + esc(card.title) + '</h4>' : '') +
        (card.body || '') +
      '</div>';
  }

  function kpiGrid(cards, className){
    return '<div class="pet-kpi-grid ' + esc(className || '') + '">' + (cards || []).map(kpi).join('') + '</div>';
  }

  Cards.kpi = Cards.kpi || kpi;
  Cards.info = Cards.info || info;
  Cards.kpiGrid = Cards.kpiGrid || kpiGrid;
  window.PETATOECards = Cards;
})(window);
