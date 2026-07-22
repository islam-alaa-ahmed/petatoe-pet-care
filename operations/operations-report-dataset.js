(function(){
  'use strict';

  if(window.PETATOEOperationsReportDataset && window.PETATOEOperationsReportDataset.version === 'OPS-RPT-4A') return;

  var COMPLETED = ['تمت الجلسة','تم التحصيل','مغلق','مؤكد'];
  var CLOSED = ['مغلق','مؤكد','غير مكتملة'];
  var CANCELLED = ['ملغي'];
  var POSTPONED = ['مؤجل'];

  function text(v){ return String(v == null ? '' : v).trim(); }
  function lower(v){ return text(v).toLowerCase(); }
  function num(v){ v=Number(v||0); return isFinite(v)?v:0; }
  function normalizePhone(v){ return text(v).replace(/[^0-9+]/g,'').replace(/^00/,'+'); }
  function normalizeName(v){ return lower(v).replace(/\s+/g,' '); }

  function statusOf(row, normalizeStatus){
    var raw=row&&row.status;
    return typeof normalizeStatus==='function' ? text(normalizeStatus(raw)) : text(raw);
  }

  function paymentOf(row, financials){
    var total=num(financials.totalAmount), paid=num(financials.paidAmount), remaining=Math.max(0,num(financials.remainingAmount));
    if(total<=0 && paid<=0) return 'unpaid';
    if(paid<=0) return 'unpaid';
    if(remaining>0 || paid+0.0001<total) return 'partial';
    return 'paid';
  }

  function customerIdentityKey(row){
    row=row||{};
    var snapshot=row.customerSnapshot&&typeof row.customerSnapshot==='object'?row.customerSnapshot:{};
    var id=text(row.customerId||snapshot.id||row.customerCode||snapshot.code);
    if(id) return 'customer:'+lower(id);
    var phone=normalizePhone(row.customerPhoneSnapshot||snapshot.phone||row.phone);
    if(phone) return 'phone:'+phone;
    var name=normalizeName(row.customerNameSnapshot||snapshot.name||row.client);
    return name?'name:'+name:'';
  }

  var ENTITY_FIELDS={
    vehicle:{id:['vehicleId'],name:['vehicleNameSnapshot','vehicle']},
    driver:{id:['driverId'],name:['driverNameSnapshot','driver']},
    groomer:{id:['groomerId'],name:['groomerNameSnapshot','groomer']},
    service:{id:['serviceId'],name:['serviceNameSnapshot','service']},
    customer:{id:['customerId'],name:['customerNameSnapshot','client']}
  };

  function firstValue(row, fields){
    for(var i=0;i<fields.length;i++){var v=text(row&&row[fields[i]]);if(v)return v;}
    return '';
  }

  function entityIdentity(row, entity, emptyLabel){
    var cfg=ENTITY_FIELDS[entity]||{id:[entity+'Id'],name:[entity+'NameSnapshot',entity]};
    var id=firstValue(row,cfg.id), name=firstValue(row,cfg.name);
    if(entity==='customer'){
      var customerKey=customerIdentityKey(row);
      return {key:customerKey||('empty:'+text(emptyLabel||'غير محدد')),name:name||text(emptyLabel||'غير محدد'),id:id};
    }
    return {key:id?entity+':'+lower(id):(name?entity+'-name:'+normalizeName(name):'empty:'+text(emptyLabel||'غير محدد')),name:name||text(emptyLabel||'غير محدد'),id:id};
  }

  function normalizeRow(row, options){
    options=options||{};
    row=row&&typeof row==='object'?row:{};
    var f=typeof options.calcFinancials==='function'?options.calcFinancials(row):row;
    f=f&&typeof f==='object'?f:row;
    var status=statusOf(f,options.normalizeStatus);
    var financials={
      totalAmount:num(f.totalAmount),
      paidAmount:num(f.paidAmount),
      remainingAmount:Math.max(0,num(f.remainingAmount)),
      discountAmount:num(f.discountAmount||f.discount)
    };
    var entities={};
    Object.keys(ENTITY_FIELDS).forEach(function(k){entities[k]=entityIdentity(f,k,'غير محدد');});
    return {
      source:f,
      appointmentId:text(f.appointment_uid||f.appointmentUid||f.id),
      status:status,
      statusClass:{
        completed:COMPLETED.indexOf(status)>-1,
        closed:CLOSED.indexOf(status)>-1,
        confirmed:status==='مؤكد',
        cancelled:CANCELLED.indexOf(status)>-1,
        postponed:POSTPONED.indexOf(status)>-1,
        incomplete:status==='غير مكتملة'
      },
      paymentClass:paymentOf(f,financials),
      financials:financials,
      customerKey:customerIdentityKey(f),
      entities:entities
    };
  }

  function build(rows, options){
    return (Array.isArray(rows)?rows:[]).map(function(r){return normalizeRow(r,options);});
  }

  function groupRows(rows, entity, emptyLabel, options){
    var map={};
    build(rows,options).forEach(function(item){
      var ident=item.entities[entity]||entityIdentity(item.source,entity,emptyLabel);
      var key=ident.key||('empty:'+text(emptyLabel||'غير محدد'));
      if(!map[key])map[key]={key:key,id:ident.id||'',name:ident.name||text(emptyLabel||'غير محدد'),rows:[],datasetRows:[]};
      map[key].rows.push(item.source);
      map[key].datasetRows.push(item);
    });
    return Object.keys(map).map(function(k){
      map[k].rows.sort(function(a,b){return text(a.start).localeCompare(text(b.start));});
      return map[k];
    }).sort(function(a,b){return text(a.name).localeCompare(text(b.name),'ar');});
  }

  window.PETATOEOperationsReportDataset={
    version:'OPS-RPT-4A',
    completedStatuses:COMPLETED.slice(),
    closedStatuses:CLOSED.slice(),
    normalizePhone:normalizePhone,
    normalizeName:normalizeName,
    customerIdentityKey:customerIdentityKey,
    entityIdentity:entityIdentity,
    normalizeRow:normalizeRow,
    build:build,
    groupRows:groupRows
  };
})();
