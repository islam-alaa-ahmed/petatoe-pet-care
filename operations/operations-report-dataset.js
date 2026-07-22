(function(){
  'use strict';

  if(window.PETATOEOperationsReportDataset && window.PETATOEOperationsReportDataset.version === 'OPS-RPT-4D') return;

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


  function customerIdentityTokens(row){
    row=row||{};
    var snapshot=row.customerSnapshot&&typeof row.customerSnapshot==='object'?row.customerSnapshot:{};
    var aliases=Array.isArray(row.aliases)?row.aliases:(Array.isArray(snapshot.aliases)?snapshot.aliases:[]);
    var tokens=[];
    function add(prefix,value,normalizer){
      var v=normalizer?normalizer(value):lower(value);
      if(v)tokens.push(prefix+v);
    }
    add('customer:',row.customerId||snapshot.id||row.customerCode||snapshot.code,lower);
    add('code:',row.customerCode||snapshot.code||row.code,lower);
    add('phone:',row.customerPhoneSnapshot||snapshot.phone||row.phone,normalizePhone);
    add('name:',row.customerNameSnapshot||snapshot.name||row.client||row.name,normalizeName);
    aliases.forEach(function(alias){
      if(alias&&typeof alias==='object'){
        add('customer:',alias.id||alias.customerId,lower);
        add('code:',alias.code||alias.customerCode,lower);
        add('phone:',alias.phone,normalizePhone);
        add('name:',alias.name,normalizeName);
      }else{
        add('alias:',alias,normalizeName);
      }
    });
    return tokens.filter(function(v,i,a){return a.indexOf(v)===i;});
  }

  function buildCustomerIdentityIndex(rows){
    var tokenToKey={};
    (Array.isArray(rows)?rows:[]).forEach(function(row){
      var preferred=customerIdentityKey(row);
      if(!preferred)return;
      customerIdentityTokens(row).forEach(function(token){
        if(!tokenToKey[token])tokenToKey[token]=preferred;
      });
    });
    return tokenToKey;
  }

  function resolveCustomerIdentity(row,index){
    var tokens=customerIdentityTokens(row);
    for(var i=0;i<tokens.length;i++)if(index&&index[tokens[i]])return index[tokens[i]];
    return customerIdentityKey(row);
  }

  function entityAliasRegistry(rows,entity){
    var cfg=ENTITY_FIELDS[entity]||{id:[entity+'Id'],name:[entity+'NameSnapshot',entity]};
    var names={};
    (Array.isArray(rows)?rows:[]).forEach(function(row){
      var id=firstValue(row,cfg.id), name=firstValue(row,cfg.name);
      if(!id||!name)return;
      var nk=normalizeName(name);
      if(!nk)return;
      if(!names[nk])names[nk]={id:id,ambiguous:false};
      else if(lower(names[nk].id)!==lower(id))names[nk].ambiguous=true;
    });
    var out={};
    Object.keys(names).forEach(function(k){if(!names[k].ambiguous)out[k]=names[k].id;});
    return out;
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

  function entityIdentity(row, entity, emptyLabel, registry, customerIndex){
    var cfg=ENTITY_FIELDS[entity]||{id:[entity+'Id'],name:[entity+'NameSnapshot',entity]};
    var id=firstValue(row,cfg.id), name=firstValue(row,cfg.name);
    if(entity==='customer'){
      var customerKey=resolveCustomerIdentity(row,customerIndex);
      return {key:customerKey||('empty:'+text(emptyLabel||'غير محدد')),name:name||text(emptyLabel||'غير محدد'),id:id};
    }
    if(!id&&name&&registry&&registry[normalizeName(name)])id=registry[normalizeName(name)];
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

  function financialRole(item){
    item=item||{};
    var state=item.statusClass||{};
    if(state.cancelled) return 'cancelled';
    if(state.postponed) return 'postponed';
    if(state.completed) return 'executed';
    return 'booked';
  }

  function aggregateFinancials(rows, options){
    return build(rows,options).reduce(function(a,item){
      var f=item.financials||{}, total=num(f.totalAmount), paid=num(f.paidAmount), remaining=Math.max(0,num(f.remainingAmount));
      var role=financialRole(item);
      a.appointmentCount+=1;
      if(role!=='cancelled'){
        a.bookedCount+=1;
        a.bookedValue+=total;
      }
      if(role==='executed'){
        a.executedCount+=1;
        a.executedRevenue+=total;
        a.collectedRevenue+=paid;
        a.outstandingBalance+=remaining;
        if(item.paymentClass==='paid')a.fullyPaidCount+=1;
        else if(item.paymentClass==='partial')a.partiallyPaidCount+=1;
        else a.unpaidCount+=1;
      }else if(role==='booked'||role==='postponed'){
        a.advanceCollected+=paid;
      }
      if(role==='cancelled'){
        a.cancelledCount+=1;
        a.cancelledValue+=total;
        a.cancelledPaidAmount+=paid;
      }
      if(role==='postponed'){
        a.postponedCount+=1;
        a.postponedValue+=total;
      }
      return a;
    },{
      appointmentCount:0,bookedCount:0,executedCount:0,cancelledCount:0,postponedCount:0,
      fullyPaidCount:0,partiallyPaidCount:0,unpaidCount:0,
      bookedValue:0,executedRevenue:0,collectedRevenue:0,advanceCollected:0,
      outstandingBalance:0,cancelledValue:0,cancelledPaidAmount:0,postponedValue:0
    });
  }

  function filterByFinancialRole(rows, role, options){
    var wanted=Array.isArray(role)?role:[role];
    return build(rows,options).filter(function(item){return wanted.indexOf(financialRole(item))>-1}).map(function(item){return item.source;});
  }

  function groupRows(rows, entity, emptyLabel, options){
    var sourceRows=Array.isArray(rows)?rows:[];
    var map={}, registry=entity==='customer'?null:entityAliasRegistry(sourceRows,entity);
    var customerIndex=entity==='customer'?buildCustomerIdentityIndex(sourceRows):null;
    build(sourceRows,options).forEach(function(item){
      var ident=entityIdentity(item.source,entity,emptyLabel,registry,customerIndex);
      var key=ident.key||('empty:'+text(emptyLabel||'غير محدد'));
      var stamp=text(item.source.date)+'T'+text(item.source.start||'00:00');
      if(!map[key])map[key]={key:key,id:ident.id||'',name:ident.name||text(emptyLabel||'غير محدد'),rows:[],datasetRows:[],latestStamp:''};
      if(stamp>=map[key].latestStamp&&ident.name){map[key].name=ident.name;map[key].latestStamp=stamp;}
      if(!map[key].id&&ident.id)map[key].id=ident.id;
      map[key].rows.push(item.source);
      map[key].datasetRows.push(item);
    });
    return Object.keys(map).map(function(k){
      map[k].rows.sort(function(a,b){return text(a.start).localeCompare(text(b.start));});
      return map[k];
    }).sort(function(a,b){return text(a.name).localeCompare(text(b.name),'ar');});
  }


  function reportSnapshot(rows, options){
    var source=Array.isArray(rows)?rows:[];
    var normalized=build(source,options);
    var financials=aggregateFinancials(source,options);
    var groups={
      vehicle:groupRows(source,'vehicle','بدون سيارة',options),
      driver:groupRows(source,'driver','بدون سائق',options),
      groomer:groupRows(source,'groomer','بدون جرومر',options),
      customer:groupRows(source,'customer','عميل غير محدد',options)
    };
    return {rows:source.slice(),normalized:normalized,financials:financials,groups:groups};
  }

  function consistencyAudit(rows, options){
    var snapshot=reportSnapshot(rows,options), issues=[];
    var expectedCount=snapshot.rows.length;
    ['vehicle','driver','groomer','customer'].forEach(function(entity){
      var groupedCount=snapshot.groups[entity].reduce(function(sum,g){return sum+g.rows.length;},0);
      if(groupedCount!==expectedCount)issues.push({code:'group-count-mismatch',entity:entity,expected:expectedCount,actual:groupedCount});
      var groupFinancial=snapshot.groups[entity].reduce(function(acc,g){
        var f=aggregateFinancials(g.rows,options);
        acc.bookedValue+=f.bookedValue;
        acc.executedRevenue+=f.executedRevenue;
        acc.collectedRevenue+=f.collectedRevenue;
        acc.outstandingBalance+=f.outstandingBalance;
        acc.cancelledValue+=f.cancelledValue;
        return acc;
      },{bookedValue:0,executedRevenue:0,collectedRevenue:0,outstandingBalance:0,cancelledValue:0});
      ['bookedValue','executedRevenue','collectedRevenue','outstandingBalance','cancelledValue'].forEach(function(metric){
        if(Math.abs(num(groupFinancial[metric])-num(snapshot.financials[metric]))>0.001){
          issues.push({code:'group-financial-mismatch',entity:entity,metric:metric,expected:num(snapshot.financials[metric]),actual:num(groupFinancial[metric])});
        }
      });
    });
    return {passed:issues.length===0,issues:issues,snapshot:snapshot};
  }

  window.PETATOEOperationsReportDataset={
    version:'OPS-RPT-4D',
    completedStatuses:COMPLETED.slice(),
    closedStatuses:CLOSED.slice(),
    normalizePhone:normalizePhone,
    normalizeName:normalizeName,
    customerIdentityKey:customerIdentityKey,
    customerIdentityTokens:customerIdentityTokens,
    buildCustomerIdentityIndex:buildCustomerIdentityIndex,
    resolveCustomerIdentity:resolveCustomerIdentity,
    entityAliasRegistry:entityAliasRegistry,
    entityIdentity:entityIdentity,
    normalizeRow:normalizeRow,
    build:build,
    financialRole:financialRole,
    aggregateFinancials:aggregateFinancials,
    filterByFinancialRole:filterByFinancialRole,
    groupRows:groupRows,
    reportSnapshot:reportSnapshot,
    consistencyAudit:consistencyAudit
  };
})();
