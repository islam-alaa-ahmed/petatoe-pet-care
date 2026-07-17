/* PETATOE v9.2.4 - Warehouse source localization pack. */
(function(){
  'use strict';
  var ar={
    allStores:'كل المخازن',allItems:'كل الأصناف',selectStore:'اختر المخزن',availableItem:'صنف متاح',availableItems:'أصناف متاحة',
    mainBalance:'إجمالي رصيد المخزن الرئيسي',vehicleBalances:'إجمالي أرصدة السيارات',allVehicleStores:'كل مخازن السيارات',itemsCount:'عدد الأصناف',fromDataAndMovements:'من البيانات والحركات',warehouseMovements:'حركات المخازن',independentMovements:'حركات مستقلة',
    mainStatement:'كشف حساب المخزن الرئيسي',storeStatement:'كشف حساب {store}',noVehicles:'لا توجد سيارات في البيانات الحالية.',availableFromSource:'المتاح من المصدر',
    movementTypeIn:'وارد',movementTypeTransfer:'تحويل',movementTypeReturn:'مرتجع',movementTypeAdjustPlus:'تسوية زيادة',movementTypeAdjustMinus:'تسوية نقص',movementTypeSaleOut:'صرف فاتورة',
    chooseItem:'اختر أو اكتب اسم الصنف',serviceItemBlocked:'هذا صنف خدمي ولا يتم استخدامه في حركات المخازن',validQuantity:'اكتب كمية صحيحة',responsibleRequired:'اكتب اسم المسؤول',quantityExceedsBalance:'الكمية أكبر من الرصيد المتاح في المخزن المصدر',sameStoreBlocked:'لا يمكن التحويل لنفس المخزن',movementSaved:'تم حفظ حركة المخزن',
    statement:'كشف',noMatchingBalances:'لا توجد أرصدة مطابقة.',noMatchingMovements:'لا توجد حركات مطابقة.',openStatementHint:'اضغط على أيقونة أي مخزن لعرض كشف الحساب.',statementTitle:'📒 كشف حساب: {store}',statementSubtitle:'حركات تفصيلية للوارد والصادر والرصيد بعد كل حركة.',movementCount:'عدد الحركات',totalIn:'إجمالي الوارد',totalOut:'إجمالي الصادر',totalBalance:'إجمالي الرصيد',openStatementFirst:'افتح كشف حساب أولاً',
    date:'التاريخ',movementType:'نوع الحركة',item:'الصنف',from:'من',to:'إلى',incoming:'وارد',outgoing:'صادر',balance:'الرصيد',responsible:'المسؤول',reference:'المرجع',notes:'ملاحظات',store:'المخزن',quantity:'الكمية',
    matched:'مطابق',noInventory:'لا توجد أرصدة للجرد.',noMovement:'لا توجد حركة',withoutMovement:'بدون حركة',day:'يوم',noSlowItems:'لا توجد أصناف راكدة حسب الفلتر.',veryFast:'سريع جدًا',active:'نشط',noFastItems:'لا توجد أصناف سريعة الحركة حسب الفلتر.',
    code:'الكود',name:'الاسم',type:'النوع',category:'التصنيف',unit:'الوحدة',minimum:'الحد الأدنى',status:'الحالة',bookBalance:'الرصيد الدفتري',actualBalance:'الرصيد الفعلي',inventoryDifference:'فرق الجرد',lastMovement:'آخر حركة',daysWithoutMovement:'أيام بدون حركة',movementsCount:'عدد الحركات',totalQuantity:'إجمالي الكمية',
    service:'خدمي',stock:'مخزني',inactive:'متوقف',edit:'تعديل',enable:'تفعيل',disable:'إيقاف',delete:'حذف',noMatchingItems:'لا توجد أصناف مطابقة.',noMovementsYet:'لا توجد حركات بعد.',chooseStoreFirst:'اختر المخزن أولاً',
    currentBalance:'الرصيد الحالي',alertLimit:'حد التنبيه',outOfStock:'نفد الرصيد',belowLimit:'أقل من الحد',noLowStock:'لا توجد أصناف مخزنية أقل من حد التنبيه الحالي.'
  };
  var en={
    allStores:'All Stores',allItems:'All Items',selectStore:'Select Store',availableItem:'available item',availableItems:'available items',
    mainBalance:'Main Warehouse Total Balance',vehicleBalances:'Vehicle Warehouse Total Balances',allVehicleStores:'All Vehicle Warehouses',itemsCount:'Items Count',fromDataAndMovements:'From data and movements',warehouseMovements:'Warehouse Movements',independentMovements:'Independent movements',
    mainStatement:'Main Warehouse Statement',storeStatement:'Statement: {store}',noVehicles:'No vehicles are available in the current data.',availableFromSource:'Available from source',
    movementTypeIn:'Inbound',movementTypeTransfer:'Transfer',movementTypeReturn:'Return',movementTypeAdjustPlus:'Positive Adjustment',movementTypeAdjustMinus:'Negative Adjustment',movementTypeSaleOut:'Invoice Issue',
    chooseItem:'Select or enter an item name',serviceItemBlocked:'Service items cannot be used in warehouse movements',validQuantity:'Enter a valid quantity',responsibleRequired:'Enter the responsible person name',quantityExceedsBalance:'The quantity exceeds the available source warehouse balance',sameStoreBlocked:'A transfer cannot use the same source and destination warehouse',movementSaved:'Warehouse movement saved',
    statement:'Statement',noMatchingBalances:'No matching balances.',noMatchingMovements:'No matching movements.',openStatementHint:'Select a warehouse statement icon to view its statement.',statementTitle:'📒 Statement: {store}',statementSubtitle:'Detailed inbound, outbound, and running-balance movements.',movementCount:'Movements Count',totalIn:'Total Inbound',totalOut:'Total Outbound',totalBalance:'Total Balance',openStatementFirst:'Open a warehouse statement first',
    date:'Date',movementType:'Movement Type',item:'Item',from:'From',to:'To',incoming:'Inbound',outgoing:'Outbound',balance:'Balance',responsible:'Responsible',reference:'Reference',notes:'Notes',store:'Warehouse',quantity:'Quantity',
    matched:'Matched',noInventory:'No balances are available for inventory.',noMovement:'No movement',withoutMovement:'No movement',day:'day',noSlowItems:'No slow-moving items match the filters.',veryFast:'Very Fast',active:'Active',noFastItems:'No fast-moving items match the filters.',
    code:'Code',name:'Name',type:'Type',category:'Category',unit:'Unit',minimum:'Minimum',status:'Status',bookBalance:'Book Balance',actualBalance:'Actual Balance',inventoryDifference:'Inventory Difference',lastMovement:'Last Movement',daysWithoutMovement:'Days Without Movement',movementsCount:'Movements Count',totalQuantity:'Total Quantity',
    service:'Service',stock:'Stock',inactive:'Inactive',edit:'Edit',enable:'Enable',disable:'Disable',delete:'Delete',noMatchingItems:'No matching items.',noMovementsYet:'No movements yet.',chooseStoreFirst:'Select a warehouse first',
    currentBalance:'Current Balance',alertLimit:'Alert Limit',outOfStock:'Out of Stock',belowLimit:'Below Limit',noLowStock:'No stock items are below the current alert limit.'
  };
  function lang(){var c=window.PETATOE_LOCALIZATION_CENTER;return c&&c.getLanguage?c.getLanguage():(document.documentElement.lang||'ar');}
  function fill(v,p){return String(v==null?'':v).replace(/\{(\w+)\}/g,function(_,k){return p&&p[k]!=null?p[k]:'';});}
  window.PETATOE_WAREHOUSE_I18N={version:'9.2.4-source-migration-pack3',t:function(key,params){var d=lang()==='en'?en:ar;return fill(d[key]||en[key]||key,params||{});},locale:function(){return lang()==='en'?'en-GB':'ar-EG';},dictionaries:{ar:ar,en:en}};
}());
