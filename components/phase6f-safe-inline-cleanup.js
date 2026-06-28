/*
 * PETATOE Phase 6F-SAFE-1 / SAFE-2 / SAFE-3
 * Limited inline handler cleanup bridge.
 * Scope is intentionally small and excludes boot, navigation, storage,
 * warehouse, operations, and router paths.
 */
(function(){
  'use strict';

  function callGlobal(fnName, args){
    var fn = window[fnName];
    if (typeof fn !== 'function') {
      console.warn('[PETATOE][6F-SAFE] Missing handler:', fnName);
      return;
    }
    return fn.apply(window, args || []);
  }

  function on(id, eventName, fnName, argsFactory){
    var el = document.getElementById(id);
    if (!el || el.__petatoeSafeInlineBound) return;
    el.__petatoeSafeInlineBound = true;
    el.addEventListener(eventName, function(event){
      var args = typeof argsFactory === 'function' ? argsFactory(event) : [];
      return callGlobal(fnName, args);
    });
  }

  function bind(){
    on('petatoeDataQualityBtn', 'click', 'petatoeRunDataQuality');
    on('petatoeExportBackupBtn', 'click', 'petatoeExportBackup');
    on('petatoeRestorePickerBtn', 'click', 'petatoeRestorePicker');
    on('petatoeRestoreInput', 'change', 'petatoeRestoreBackup', function(event){ return [event]; });

    on('petatoeExportLogsExcelBtn', 'click', 'petatoeExportLogsExcel');
    on('petatoeClearLogsBtn', 'click', 'petatoeClearLogs');

    on('saveBtn', 'click', 'saveRecord');
    on('clearEntryBtn', 'click', 'clearForm');

    on('recordsExportAllBtn', 'click', 'exportExcel');
    on('recordsExportFilteredBtn', 'click', 'exportRecordsFilteredExcel');
    on('recordsPrintBtn', 'click', 'print', function(){ return []; });
    on('recordsClearAllBtn', 'click', 'clearAll');
    on('recordsPrevPageBtn', 'click', 'prevPage');
    on('recordsNextPageBtn', 'click', 'nextPage');

    // Phase 6F-SAFE-2: limited report export/refresh buttons only.
    // No boot/navigation/storage/warehouse/operations handlers are touched.
    on('safeDashboardPdfBtn', 'click', 'petatoeExportActivePagePdf');
    on('safeExportSalesPdfBtn', 'click', 'exportSalesPdf');
    on('safeExportSalesExcelBtn', 'click', 'exportSalesExcel');
    on('safeExportVansPdfBtn', 'click', 'exportVansPdf');
    on('safeExportVansExcelBtn', 'click', 'exportVansExcel');
    on('safeExportServicesPdfBtn', 'click', 'exportServicesPdf');
    on('safeExportServicesExcelBtn', 'click', 'exportServicesExcel');
    on('safeExportExecutiveExcelBtn', 'click', 'exportExecutiveExcel');
    on('safeCustomer360RefreshBtn', 'click', 'renderCustomer360Panel');
    on('safeCustomer360ExcelBtn', 'click', 'exportCustomer360Excel');

    // Phase 6F-SAFE-3: limited simple modal/input/upload handlers only.
    // Still excludes boot, navigation, storage, warehouse, operations, and router paths.
    on('safePdfRefreshBtn', 'click', 'petatoeResetPdfPeriodDefaults');
    on('safePdfPrintBtn', 'click', 'petatoePrintPdf');
    on('safePdfCloseBtn', 'click', 'petatoeClosePdfModal');
    on('pdf-company-name', 'input', 'petatoeRefreshPdfReport');

    on('safeDownloadTemplateBtn', 'click', 'downloadTemplate');
    on('safeImportModeFullBtn', 'click', 'setImportMode', function(){ return ['full']; });
    on('safeImportModeItemsBtn', 'click', 'setImportMode', function(){ return ['items']; });
    on('safeImportModePaymentsBtn', 'click', 'setImportMode', function(){ return ['payments']; });
    on('fileInput', 'change', 'handleFile', function(event){ return [event]; });
    on('safeConfirmImportAppendBtn', 'click', 'confirmImport', function(){ return [false]; });
    on('safeConfirmImportReplaceBtn', 'click', 'confirmImport', function(){ return [true]; });

    var drop = document.getElementById('drop');
    if (drop && !drop.__petatoeSafeDropBound) {
      drop.__petatoeSafeDropBound = true;
      drop.addEventListener('click', function(){
        var input = document.getElementById('fileInput');
        if (input && typeof input.click === 'function') input.click();
      });
      drop.addEventListener('dragover', function(event){ callGlobal('dragOver', [event]); });
      drop.addEventListener('dragleave', function(event){ callGlobal('dragLeave', [event]); });
      drop.addEventListener('drop', function(event){ callGlobal('dropFile', [event]); });
    }

    on('petImageInput', 'change', 'handlePetImageUpload', function(event){ return [event]; });
    var petPicker = document.getElementById('safePetImagePickerBtn');
    if (petPicker && !petPicker.__petatoeSafeInlineBound) {
      petPicker.__petatoeSafeInlineBound = true;
      petPicker.addEventListener('click', function(){
        var input = document.getElementById('petImageInput');
        if (input && typeof input.click === 'function') input.click();
      });
    }
    on('safePetImageResetBtn', 'click', 'resetPetImage');

  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
