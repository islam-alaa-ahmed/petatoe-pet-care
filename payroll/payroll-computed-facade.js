/* PETATOE v6.2.42 — Phase 9C-SAFE Payroll Computed Read Facade
   Scope: computed read-only facade for payroll calculations.
   Safety rules:
   - No DOM writes.
   - No event listeners.
   - No storage writes.
   - No payroll-core.js changes.
   - No approval/save/delete/edit takeover.
*/
(function(){
  'use strict';
  if(window.PETATOEPayrollComputedFacade) return;

  function clone(value, fallback){
    try{
      if(value == null) return fallback;
      return JSON.parse(JSON.stringify(value));
    }catch(e){
      return fallback;
    }
  }

  function reader(){
    return window.PETATOEPayrollReadFacade || null;
  }

  function num(value){
    if(value == null || value === '') return 0;
    if(typeof value === 'number') return isFinite(value) ? value : 0;
    var cleaned = String(value).replace(/,/g,'').replace(/SAR|sar|ريال|ر\.س/gi,'').trim();
    var n = parseFloat(cleaned);
    return isNaN(n) ? 0 : n;
  }

  function str(value){ return String(value == null ? '' : value); }
  function norm(value){ return str(value).trim().toLowerCase().replace(/\s+/g,' '); }
  function asArray(value){ return Array.isArray(value) ? value : []; }
  function asObject(value){ return value && typeof value === 'object' && !Array.isArray(value) ? value : {}; }

  function sumLines(lines){
    return asArray(lines).reduce(function(total, row){
      return total + num(row && row.value);
    }, 0);
  }

  function commissionPersonName(row){
    row = row || {};
    return row.person || row.name || row.employee || row.employeeName || row.salesPerson || row.driver || row.groomer || '';
  }

  function employeeAliases(emp){
    emp = emp || {};
    var raw = [emp.commissionEmployeeName,emp.name,emp.fullName,emp.employeeName,emp.username,emp.userKey,emp.code];
    var out = [];
    raw.forEach(function(item){ item = norm(item); if(item && out.indexOf(item) === -1) out.push(item); });
    return out;
  }

  function employeeIdentityKeys(emp){
    emp = emp || {};
    var raw = [emp.commissionEmployeeId,emp.employeeId,emp.employee_id,emp.id,emp.supabase_id,emp.userId,emp.user_id];
    var out = [];
    raw.forEach(function(item){ item = str(item).trim(); if(item && out.indexOf(item) === -1) out.push(item); });
    return out;
  }

  function rowIdentity(row){ row=row||{}; return str(row.employeeId||row.employee_id||row.personId||row.person_id).trim(); }
  function snapshotHasIdentity(snap){
    if(!snap || typeof snap !== 'object') return false;
    if(str(snap.identitySchemaVersion).indexOf('commission-identity-') === 0) return true;
    if(/^commission-snapshot-v(?:2|3|4|[5-9]|[1-9][0-9]+)/.test(str(snap.schemaVersion))) return true;
    return ['groomer','driver','sales'].some(function(type){ return asArray(snap[type]).some(function(row){ return !!rowIdentity(row); }); });
  }

  function commissionDetail(emp, period){
    var R = reader();
    var snaps = R && typeof R.commissionSnapshots === 'function' ? R.commissionSnapshots() : {};
    var snap = asObject(snaps)[period];
    var mappedName = str(emp && emp.commissionEmployeeName).trim();
    var ids = employeeIdentityKeys(emp);
    var matches = [];
    var identitySnapshot = snapshotHasIdentity(snap);

    if(!snap) return { total:0, matches:matches, source:'no_snapshot', mappedName:mappedName, mode:'identity', employeeIds:ids };

    ['groomer','driver','sales'].forEach(function(type){
      asArray(snap[type]).forEach(function(row){
        var id = rowIdentity(row);
        if(id && ids.indexOf(id) > -1) matches.push({type:type,person:commissionPersonName(row),employeeId:id,car:row&&row.car||'',vehicleId:row&&row.vehicleId||'',commission:num(row&&row.commission)});
      });
    });

    if(!matches.length && !identitySnapshot){
      var aliases = mappedName ? [norm(mappedName)] : employeeAliases(emp);
      ['groomer','driver','sales'].forEach(function(type){
        asArray(snap[type]).forEach(function(row){
          var person = norm(commissionPersonName(row));
          if(!rowIdentity(row) && person && aliases.indexOf(person) > -1) matches.push({type:type,person:commissionPersonName(row),employeeId:'',car:row&&row.car||'',vehicleId:row&&row.vehicleId||'',commission:num(row&&row.commission),legacyNameMatch:true});
        });
      });
    }

    return {total:matches.reduce(function(total,item){return total+num(item.commission);},0),matches:matches,source:matches.length?'matched':'not_matched',mappedName:mappedName,mode:matches.some(function(item){return item.legacyNameMatch;})?'legacy':'identity',employeeIds:ids,identitySnapshot:identitySnapshot};
  }

  function employeeForSlip(slip){
    var R = reader();
    if(!R || typeof R.getEmployeeById !== 'function') return null;
    return R.getEmployeeById(slip && slip.employeeId);
  }

  function slipTotals(slip){
    slip = slip || {};
    var emp = employeeForSlip(slip) || {};
    var commission = commissionDetail(emp, slip.period);
    var additions = sumLines(slip.additions);
    var deductions = sumLines(slip.deductions);
    var base = num(slip.base);
    var housing = num(slip.housing);
    var transport = num(slip.transport);
    var incentives = num(slip.incentives);
    var gross = base + housing + transport + commission.total + incentives + additions;
    var net = gross - deductions;

    return {
      id: str(slip.id),
      employeeId: str(slip.employeeId),
      period: str(slip.period),
      status: str(slip.status),
      paymentMethod: str(slip.paymentMethod),
      base: base,
      housing: housing,
      transport: transport,
      commission: commission.total,
      commissionDetail: commission,
      incentives: incentives,
      additions: additions,
      deductions: deductions,
      gross: gross,
      net: net
    };
  }

  function allSlipTotals(){
    var R = reader();
    var slips = R && typeof R.slips === 'function' ? R.slips() : [];
    return asArray(slips).map(slipTotals);
  }

  function totalsByPeriod(period){
    period = str(period);
    return allSlipTotals().filter(function(row){ return row.period === period; });
  }

  function totalsByEmployee(employeeId){
    employeeId = str(employeeId);
    return allSlipTotals().filter(function(row){ return row.employeeId === employeeId; });
  }

  function aggregate(rows){
    rows = asArray(rows);
    return rows.reduce(function(acc, row){
      acc.count += 1;
      acc.base += num(row.base);
      acc.housing += num(row.housing);
      acc.transport += num(row.transport);
      acc.commission += num(row.commission);
      acc.incentives += num(row.incentives);
      acc.additions += num(row.additions);
      acc.deductions += num(row.deductions);
      acc.gross += num(row.gross);
      acc.net += num(row.net);
      acc.byStatus[row.status || 'unknown'] = (acc.byStatus[row.status || 'unknown'] || 0) + 1;
      return acc;
    }, {count:0,base:0,housing:0,transport:0,commission:0,incentives:0,additions:0,deductions:0,gross:0,net:0,byStatus:{}});
  }

  function monthlyTotals(period){
    return aggregate(totalsByPeriod(period));
  }

  function employeeTotals(employeeId){
    return aggregate(totalsByEmployee(employeeId));
  }

  function overallTotals(){
    return aggregate(allSlipTotals());
  }

  function periods(){
    var list = [];
    allSlipTotals().forEach(function(row){
      if(row.period && list.indexOf(row.period) === -1) list.push(row.period);
    });
    list.sort();
    return list;
  }

  function snapshot(){
    return {
      mode: 'computed-read-only',
      periods: periods(),
      totals: overallTotals()
    };
  }

  var api = {
    version: 'v6.2.42-phase9c-safe',
    mode: 'computed-read-only',
    num: num,
    sumLines: sumLines,
    commissionDetail: function(employeeId, period){
      var R = reader();
      var emp = R && typeof R.getEmployeeById === 'function' ? R.getEmployeeById(employeeId) : null;
      return commissionDetail(emp || {}, period);
    },
    slipTotals: function(slipOrId){
      var R = reader();
      var slip = typeof slipOrId === 'string' && R && typeof R.getSlipById === 'function' ? R.getSlipById(slipOrId) : slipOrId;
      return slipTotals(slip || {});
    },
    allSlipTotals: allSlipTotals,
    totalsByPeriod: totalsByPeriod,
    totalsByEmployee: totalsByEmployee,
    monthlyTotals: monthlyTotals,
    employeeTotals: employeeTotals,
    overallTotals: overallTotals,
    periods: periods,
    snapshot: snapshot
  };

  try{ Object.freeze(api); }catch(e){
    if(window.PETATOEDiagnostics && typeof window.PETATOEDiagnostics.captureSilentCatch === 'function'){
      window.PETATOEDiagnostics.captureSilentCatch('payroll/payroll-computed-facade.js::freeze-api', e);
    }
  }
  window.PETATOEPayrollComputedFacade = api;
})();
