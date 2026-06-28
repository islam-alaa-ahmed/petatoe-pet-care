/* PETATOE v3.11.13 - Shared safe utilities */
(function(){
  window.PETATOEUtils = window.PETATOEUtils || {};
  if(!window.PETATOEUtils.escapeHtml){
    window.PETATOEUtils.escapeHtml = function(v){
      return String(v==null?'':v).replace(/[&<>"']/g,function(c){
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
      });
    };
  }
})();