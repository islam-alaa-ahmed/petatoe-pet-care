(function(){
  'use strict';

  /**
   * PETATOE Operations Storage Boundary
   *
   * Phase OPS-8: centralizes operations storage access while preserving the
   * existing golden keys while routing all module storage through PETATOEStorage.
   * No business rules, UI, or data schema changes are introduced here.
   */
  if(window.PETATOEOperationsStorage) return;

  var KEYS = {
    appointments: 'appointments',
    masterData: 'appointmentsMasterData',
    currentUser: 'petatoe_current_user_v108'
  };

  function warn(e){
    try{
      if(window.PETATOEUtils && window.PETATOEUtils.warnSilentCatch){
        window.PETATOEUtils.warnSilentCatch('operations-storage.js', e);
      }
    }catch(e){window.PETATOEUtils&&window.PETATOEUtils.warnSilentCatch&&window.PETATOEUtils.warnSilentCatch("operations/operations-storage.js",e);}
  }

  var TABLE_APPOINTMENTS = 'operations_appointments';
  var TABLE_MASTER = 'operations_master_data';
  var CANONICAL_MASTER_ID = '9a7d5db7-2e36-4a67-9e62-4f7a24c8f101';
  var appointmentsCache = [];
  var masterDataCache = null;
  var bootStarted = false;
  var bootDone = false;
  var appointmentsRevision = 0;
  var appointmentsServerState = Object.create(null);
  var masterDataRevision = 0;
  var masterServerStamp = null;
  var masterServerRevision = 0;
  var writeQueue = Promise.resolve();
  var lastWriteError = null;

  function client(){
    return window.PETATOE_SUPABASE_CLIENT || window.supabase || null;
  }

  function isClientReady(){
    var c = client();
    return !!(c && typeof c.from === 'function');
  }

  function emitChange(type){
    try{
      window.dispatchEvent(new CustomEvent('petatoe:operations-storage-change', { detail:{ type:type || 'all' } }));
    }catch(e){ warn(e); }
  }

  function safeText(v){ return String(v == null ? '' : v).trim(); }
  function safeNumber(v){
    v = Number(String(v == null ? '' : v).replace(/,/g,''));
    return isFinite(v) ? v : 0;
  }

  function appointmentUid(row){
    row = row && typeof row === 'object' ? row : {};
    return safeText(row.appointment_uid || row.uid || row.id || row.appointmentId || row.appointment_id || row.no || row.code || row.createdAt || row.date || Date.now());
  }

  function appointmentDate(row){
    row = row && typeof row === 'object' ? row : {};
    var v = safeText(row.appointment_date || row.appointmentDate || row.date || row.day || row.sessionDate || row.startDate);
    var m = v.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : null;
  }

  function appointmentPayload(row){
    row = row && typeof row === 'object' ? row : {};
    return {
      appointment_uid: appointmentUid(row),
      data: row,
      status: safeText(row.status || row.state || row.appointmentStatus),
      appointment_date: appointmentDate(row),
      vehicle: safeText(row.vehicle || row.car || row.vehicleName),
      customer_name: safeText(row.customerName || row.customer || row.clientName || row.client),
      customer_phone: safeText(row.customerPhone || row.phone || row.mobile || row.jawal),
      total_amount: safeNumber(row.totalAmount || row.total || row.amount || row.value),
      paid_amount: safeNumber(row.paidAmount || row.paid || row.collected),
      remaining_amount: safeNumber(row.remainingAmount || row.remaining || row.balance),
      updated_at: new Date().toISOString()
    };
  }

  function normalizeAppointmentRow(row){
    if(row && row.data && typeof row.data === 'object') return row.data;
    return row && typeof row === 'object' ? row : {};
  }

  function stableSerialize(value){
    if(value == null || typeof value !== 'object') return JSON.stringify(value);
    if(Array.isArray(value)) return '[' + value.map(stableSerialize).join(',') + ']';
    return '{' + Object.keys(value).sort().map(function(key){
      return JSON.stringify(key) + ':' + stableSerialize(value[key]);
    }).join(',') + '}';
  }

  function stableAppointmentFingerprint(row){
    row = row && typeof row === 'object' ? row : {};
    var copy = cloneJSON(row) || {};
    delete copy.updated_at;
    delete copy.updatedAt;
    delete copy.created_at;
    delete copy.createdAt;
    try{ return stableSerialize(copy); }
    catch(e){ try{ return JSON.stringify(copy); }catch(ignore){ return String(copy); } }
  }

  function normalizeAppointmentServerRow(row){
    row = row && typeof row === 'object' ? row : {};
    var data = normalizeAppointmentRow(row);
    var uid = safeText(row.appointment_uid || appointmentUid(data));
    return {
      id: row.id || null,
      uid: uid,
      data: data,
      updatedAt: safeText(row.updated_at || row.created_at),
      fingerprint: stableAppointmentFingerprint(data)
    };
  }

  function mapAppointmentServerRows(rows){
    var map = Object.create(null);
    (Array.isArray(rows) ? rows : []).forEach(function(row){
      var normalized = normalizeAppointmentServerRow(row);
      if(normalized.uid) map[normalized.uid] = normalized;
    });
    return map;
  }

  function rememberAppointmentServerRows(rows){
    appointmentsServerState = mapAppointmentServerRows(rows);
  }

  function appointmentConflictError(uid){
    var error = new Error('OPERATIONS_APPOINTMENT_WRITE_CONFLICT:' + safeText(uid));
    error.code = 'OPERATIONS_APPOINTMENT_WRITE_CONFLICT';
    error.appointmentUid = safeText(uid);
    return error;
  }

  async function loadAppointmentServerRows(c){
    var res = await c.from(TABLE_APPOINTMENTS)
      .select('id,appointment_uid,data,appointment_date,created_at,updated_at')
      .order('appointment_date', { ascending:true })
      .order('created_at', { ascending:true });
    if(res && res.error) throw res.error;
    return Array.isArray(res && res.data) ? res.data : [];
  }

  async function updateAppointmentServerRow(c, current, data){
    var query = c.from(TABLE_APPOINTMENTS)
      .update(appointmentPayload(data))
      .eq('id', current.id);
    if(current.updatedAt) query = query.eq('updated_at', current.updatedAt);
    var res = await query.select('id,appointment_uid,data,appointment_date,created_at,updated_at');
    if(res && res.error) throw res.error;
    if(!Array.isArray(res && res.data) || !res.data.length) throw appointmentConflictError(current.uid);
    return res.data[0];
  }

  async function insertAppointmentServerRow(c, data){
    var res = await c.from(TABLE_APPOINTMENTS)
      .insert([appointmentPayload(data)])
      .select('id,appointment_uid,data,appointment_date,created_at,updated_at');
    if(res && res.error) throw res.error;
    if(!Array.isArray(res && res.data) || !res.data.length) throw new Error('OPERATIONS_APPOINTMENT_INSERT_FAILED');
    return res.data[0];
  }

  async function deleteAppointmentServerRow(c, current){
    var query = c.from(TABLE_APPOINTMENTS).delete().eq('id', current.id);
    if(current.updatedAt) query = query.eq('updated_at', current.updatedAt);
    var res = await query.select('id');
    if(res && res.error) throw res.error;
    if(!Array.isArray(res && res.data) || !res.data.length) throw appointmentConflictError(current.uid);
    return true;
  }

  async function persistAppointmentsSupabase(rows){
    if(!isClientReady()) return false;
    rows = Array.isArray(rows) ? rows : [];
    var c = client();
    var remoteRows = await loadAppointmentServerRows(c);
    var remoteMap = mapAppointmentServerRows(remoteRows);
    var baselineMap = appointmentsServerState || Object.create(null);
    var desiredMap = Object.create(null);
    var desiredOrder = [];

    rows.forEach(function(row){
      var uid = appointmentUid(row);
      if(!uid || desiredMap[uid]) return;
      desiredMap[uid] = row;
      desiredOrder.push(uid);
    });

    var resultMap = Object.create(null);
    Object.keys(remoteMap).forEach(function(uid){ resultMap[uid] = remoteMap[uid]; });

    for(var i=0;i<desiredOrder.length;i++){
      var uid = desiredOrder[i];
      var desired = desiredMap[uid];
      var desiredFingerprint = stableAppointmentFingerprint(desired);
      var baseline = baselineMap[uid] || null;
      var remote = remoteMap[uid] || null;
      var localChanged = !baseline || desiredFingerprint !== baseline.fingerprint;
      var remoteChanged = !!(baseline && remote && remote.fingerprint !== baseline.fingerprint);

      if(baseline && !remote){
        if(localChanged) throw appointmentConflictError(uid);
        delete resultMap[uid];
        continue;
      }

      if(!baseline && remote){
        if(desiredFingerprint !== remote.fingerprint) throw appointmentConflictError(uid);
        resultMap[uid] = remote;
        continue;
      }

      if(remote && remoteChanged && localChanged && desiredFingerprint !== remote.fingerprint){
        throw appointmentConflictError(uid);
      }

      if(remote && remoteChanged && !localChanged){
        resultMap[uid] = remote;
        continue;
      }

      if(remote && !localChanged){
        resultMap[uid] = remote;
        continue;
      }

      if(remote){
        resultMap[uid] = normalizeAppointmentServerRow(await updateAppointmentServerRow(c, remote, desired));
      }else{
        resultMap[uid] = normalizeAppointmentServerRow(await insertAppointmentServerRow(c, desired));
      }
    }

    var baselineUids = Object.keys(baselineMap);
    for(var j=0;j<baselineUids.length;j++){
      var removedUid = baselineUids[j];
      if(desiredMap[removedUid]) continue;
      var remoteForDelete = remoteMap[removedUid];
      var baselineForDelete = baselineMap[removedUid];
      if(!remoteForDelete){
        delete resultMap[removedUid];
        continue;
      }
      if(remoteForDelete.fingerprint !== baselineForDelete.fingerprint){
        throw appointmentConflictError(removedUid);
      }
      await deleteAppointmentServerRow(c, remoteForDelete);
      delete resultMap[removedUid];
    }

    var mergedRows = [];
    desiredOrder.forEach(function(uid){
      if(resultMap[uid]) mergedRows.push(resultMap[uid].data);
    });
    Object.keys(resultMap).forEach(function(uid){
      if(!desiredMap[uid]) mergedRows.push(resultMap[uid].data);
    });

    appointmentsCache = cloneJSON(mergedRows);
    appointmentsRevision += 1;
    appointmentsServerState = resultMap;
    emitChange('appointments');
    return true;
  }

  function rowStamp(row){
    return safeText(row && (row.updated_at || row.created_at));
  }

  function newestMasterRow(rows){
    rows = Array.isArray(rows) ? rows : [];
    var newest = null;
    rows.forEach(function(row){
      if(!row || !row.data) return;
      var stamp = Date.parse(rowStamp(row)) || 0;
      if(!newest || stamp > newest.stamp){
        newest = { row: row, stamp: stamp };
      }
    });
    return newest && newest.row;
  }

  function canonicalMasterRow(rows){
    rows = Array.isArray(rows) ? rows : [];
    return rows.find(function(row){ return row && row.id === CANONICAL_MASTER_ID && row.data; }) || null;
  }

  function masterConflictError(remoteRow){
    var error = new Error('OPERATIONS_MASTER_DATA_CONFLICT');
    error.code = 'OPERATIONS_MASTER_DATA_CONFLICT';
    error.remoteRow = remoteRow || null;
    return error;
  }

  async function cleanupLegacyMasterRows(c){
    var del = await c.from(TABLE_MASTER).delete().neq('id', CANONICAL_MASTER_ID);
    if(del && del.error) throw del.error;
  }

  function acceptRemoteMasterRow(row){
    if(!row || !row.data) return;
    masterDataCache = normalizeMasterData(row.data);
    masterServerStamp = rowStamp(row) || null;
    masterServerRevision += 1;
    emitChange('masterData');
  }

  async function replaceMasterSupabase(data, options){
    if(!isClientReady()) return false;
    options = options || {};
    var c = client();
    var normalized = normalizeMasterData(data);
    var expectedStamp = options.expectedStamp == null ? masterServerStamp : options.expectedStamp;
    var nextStamp = new Date().toISOString();

    var current = await c.from(TABLE_MASTER).select('id,data,updated_at,created_at').eq('id', CANONICAL_MASTER_ID).maybeSingle();
    if(current && current.error) throw current.error;
    var currentRow = current && current.data;

    if(currentRow){
      var currentStamp = rowStamp(currentRow);
      if(!expectedStamp || currentStamp !== expectedStamp){
        acceptRemoteMasterRow(currentRow);
        throw masterConflictError(currentRow);
      }

      var update = await c.from(TABLE_MASTER)
        .update({ data: normalized, updated_at: nextStamp })
        .eq('id', CANONICAL_MASTER_ID)
        .eq('updated_at', expectedStamp)
        .select('id,data,updated_at,created_at');
      if(update && update.error) throw update.error;
      var updatedRows = Array.isArray(update && update.data) ? update.data : [];
      if(updatedRows.length !== 1){
        var latest = await c.from(TABLE_MASTER).select('id,data,updated_at,created_at').eq('id', CANONICAL_MASTER_ID).maybeSingle();
        if(latest && latest.error) throw latest.error;
        acceptRemoteMasterRow(latest && latest.data);
        throw masterConflictError(latest && latest.data);
      }
      masterServerStamp = rowStamp(updatedRows[0]) || nextStamp;
    }else{
      if(expectedStamp){
        throw masterConflictError(null);
      }
      var insert = await c.from(TABLE_MASTER).insert([{
        id: CANONICAL_MASTER_ID,
        data: normalized,
        updated_at: nextStamp
      }]).select('id,data,updated_at,created_at');
      if(insert && insert.error){
        var raced = await c.from(TABLE_MASTER).select('id,data,updated_at,created_at').eq('id', CANONICAL_MASTER_ID).maybeSingle();
        if(raced && !raced.error && raced.data) acceptRemoteMasterRow(raced.data);
        throw insert.error;
      }
      var insertedRows = Array.isArray(insert && insert.data) ? insert.data : [];
      masterServerStamp = insertedRows.length ? (rowStamp(insertedRows[0]) || nextStamp) : nextStamp;
    }

    await cleanupLegacyMasterRows(c);
    return true;
  }

  async function loadAppointmentsSupabase(){
    if(!isClientReady()) return [];
    var rows = await loadAppointmentServerRows(client());
    rememberAppointmentServerRows(rows);
    return rows.map(normalizeAppointmentRow);
  }

  async function loadMasterSupabase(){
    if(!isClientReady()) return null;
    var c = client();
    var res = await c.from(TABLE_MASTER).select('id,data,updated_at,created_at').limit(50);
    if(res && res.error) throw res.error;
    var rows = Array.isArray(res && res.data) ? res.data : [];
    var canonical = canonicalMasterRow(rows);
    var selected = canonical || newestMasterRow(rows);
    if(!selected || !selected.data){
      masterServerStamp = null;
      return null;
    }

    if(!canonical){
      var migratedStamp = new Date().toISOString();
      var migrate = await c.from(TABLE_MASTER).insert([{
        id: CANONICAL_MASTER_ID,
        data: normalizeMasterData(selected.data),
        updated_at: migratedStamp
      }]).select('id,data,updated_at,created_at');
      if(migrate && migrate.error) throw migrate.error;
      var migratedRows = Array.isArray(migrate && migrate.data) ? migrate.data : [];
      selected = migratedRows[0] || { id:CANONICAL_MASTER_ID, data:selected.data, updated_at:migratedStamp };
    }

    masterServerStamp = rowStamp(selected) || null;
    if(rows.length > 1 || !canonical){
      try{ await cleanupLegacyMasterRows(c); }catch(cleanupError){ warn(cleanupError); }
    }
    return selected.data;
  }

  function queueWrite(task){
    writeQueue = writeQueue.then(function(){
      return task();
    }).then(function(){
      lastWriteError = null;
      try{ window.dispatchEvent(new CustomEvent('petatoe:operations-sync', { detail:{ ok:true } })); }catch(e){ warn(e); }
    }).catch(function(e){
      lastWriteError = e;
      warn(e);
      try{ window.dispatchEvent(new CustomEvent('petatoe:operations-sync', { detail:{ ok:false, error:e && (e.message || String(e)) } })); }catch(evtErr){ warn(evtErr); }
      try{ if(typeof window.toast === 'function') window.toast(window.PETATOE_LOCALIZATION_CENTER&&window.PETATOE_LOCALIZATION_CENTER.translateRuntime?window.PETATOE_LOCALIZATION_CENTER.translateRuntime('فشل مزامنة بيانات التشغيل مع Supabase'):'فشل مزامنة بيانات التشغيل مع Supabase'); }catch(toastErr){ warn(toastErr); }
    });
    return true;
  }

  function bootSupabase(){
    if(bootStarted) return;
    bootStarted = true;
    (async function(){
      try{
        if(!isClientReady()){
          var started = Date.now();
          while(!isClientReady() && Date.now() - started < 8000){
            await new Promise(function(resolve){ setTimeout(resolve, 150); });
          }
        }
        if(!isClientReady()) return;
        var appointmentsBootRevision = appointmentsRevision;
        var masterBootRevision = masterDataRevision;
        var loaded = await Promise.all([loadAppointmentsSupabase(), loadMasterSupabase()]);
        if(appointmentsRevision === appointmentsBootRevision){
          appointmentsCache = Array.isArray(loaded[0]) ? loaded[0] : [];
        }
        if(masterDataRevision === masterBootRevision){
          masterDataCache = normalizeMasterData(loaded[1] || cloneDefaultMaster());
        }
        bootDone = true;
        emitChange('boot');
      }catch(e){ warn(e); }
    })();
  }

  function readJSON(key, fallback){
    bootSupabase();
    if(key === KEYS.appointments) return cloneJSON(appointmentsCache);
    if(key === KEYS.masterData) return masterDataCache == null ? (fallback == null ? null : fallback) : cloneJSON(masterDataCache);
    return fallback;
  }

  function writeJSON(key, value){
    bootSupabase();
    if(key === KEYS.appointments){
      appointmentsCache = Array.isArray(value) ? cloneJSON(value) : [];
      appointmentsRevision += 1;
      var snapshot = cloneJSON(appointmentsCache);
      queueWrite(function(){ return persistAppointmentsSupabase(snapshot); });
      emitChange('appointments');
      return true;
    }
    if(key === KEYS.masterData){
      masterDataCache = normalizeMasterData(value);
      masterDataRevision += 1;
      var snapshotMaster = cloneJSON(masterDataCache);
      var expectedStamp = masterServerStamp;
      queueWrite(function(){ return replaceMasterSupabase(snapshotMaster, { expectedStamp: expectedStamp }); });
      emitChange('masterData');
      return true;
    }
    return false;
  }

  function readAppointments(){
    bootSupabase();
    return Array.isArray(appointmentsCache) ? cloneJSON(appointmentsCache) : [];
  }

  function writeAppointments(rows){
    return writeJSON(KEYS.appointments, Array.isArray(rows) ? rows : []);
  }

  function readMasterData(fallback){
    bootSupabase();
    return masterDataCache == null ? (fallback == null ? null : fallback) : cloneJSON(masterDataCache);
  }

  function writeMasterData(data){
    return writeJSON(KEYS.masterData, data);
  }


  function uniqueSorted(list){
    var out = [];
    (list || []).forEach(function(x){
      x = String(x || '').trim();
      if(x && out.indexOf(x) === -1) out.push(x);
    });
    return out.sort(function(a,b){ return a.localeCompare(b,'ar'); });
  }

  function cloneJSON(value){
    try{ return JSON.parse(JSON.stringify(value)); }catch(e){ return value; }
  }

  var DEFAULT_MASTER = {
    animalTypes:['كلب','قط','طائر','أرنب','أخرى'],
    sizes:['Small','Medium','Large','XL'],
    services:[],
    customers:[],
    vehicles:[],
    drivers:[],
    groomers:[],
    vehicleAssignments:[],
    breeds:{
      'كلب':['Husky','Golden Retriever','Pomeranian','German Shepherd','Shih Tzu'],
      'قط':['Persian','Siamese','Scottish','British Shorthair'],
      'طائر':['Parrot','Canary'],
      'أرنب':['Rabbit']
    }
  };

  function cloneDefaultMaster(){
    return cloneJSON(DEFAULT_MASTER);
  }

  var LEGACY_DEFAULT_SERVICES = ['Grooming','Bath','Nail Cut','Teeth Cleaning','Hotel','Training','Vet Visit','Transportation'];

  function isOnlyLegacyDefaultServices(list){
    var names = (Array.isArray(list) ? list : []).map(function(x){ var row = typeof x === 'string' ? {name:x} : x; return String((row && row.name) || '').trim(); }).filter(Boolean).sort();
    var legacy = LEGACY_DEFAULT_SERVICES.slice().sort();
    return names.length === legacy.length && names.every(function(x,i){ return x === legacy[i]; });
  }

  function normalizeMasterServices(list){
    var map = {};
    (Array.isArray(list) ? list : []).forEach(function(s){
      if(typeof s === 'string') s = { name: s, price: '' };
      s = s && typeof s === 'object' ? s : {};
      var name = String(s.name || s.service || s.title || s.serviceName || s['الخدمة'] || s['اسم الخدمة'] || '').trim();
      var code = String(s.code || s.serviceCode || s.id || s['الكود'] || s['كود'] || '').trim();
      var priceRaw = String(s.price || s.amount || s.value || s['السعر'] || '').replace(/,/g,'').trim();
      var price = priceRaw === '' ? '' : Number(priceRaw);
      if(price !== '' && !isFinite(price)) price = '';
      if(!name) return;
      map[String(code || name).toLowerCase()] = { code: code, name: name, price: price, updatedAt: s.updatedAt || '' };
    });
    return Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){
      var ac=String(a.code||''), bc=String(b.code||'');
      var an=/^\d+$/.test(ac)?Number(ac):NaN, bn=/^\d+$/.test(bc)?Number(bc):NaN;
      if(isFinite(an)&&isFinite(bn)&&an!==bn) return an-bn;
      var cc=ac.localeCompare(bc,'ar',{numeric:true,sensitivity:'base'});
      return cc || String(a.name||'').localeCompare(String(b.name||''),'ar',{numeric:true,sensitivity:'base'});
    });
  }

  function normalizeMasterCustomers(list){
    var map = {};
    (Array.isArray(list) ? list : []).forEach(function(c){
      c = c && typeof c === 'object' ? c : {};
      var row = {
        code: String(c.code || c.customerId || c.key || '').trim(),
        name: String(c.name || c.client || '').trim(),
        address: String(c.address || '').trim(),
        phone: String(c.phone || c.mobile || c.jawal || '').trim(),
        googleMapUrl: String(c.googleMapUrl || c.customerMapLink || c.mapUrl || c.locationUrl || '').trim(),
        updatedAt: c.updatedAt || ''
      };
      if(!row.code) row.code = row.phone ? ('phone:' + row.phone.replace(/\s+/g,'')) : (row.name ? ('name:' + row.name.toLowerCase()) : '');
      if(!row.code && !row.name && !row.phone && !row.address && !row.googleMapUrl) return;
      map[String(row.code || row.phone || row.name).toLowerCase()] = row;
    });
    return Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){ return String(a.name || a.code).localeCompare(String(b.name || b.code),'ar'); });
  }

  function normalizeVehicleAssignments(list){
    var map = {};
    (Array.isArray(list) ? list : []).forEach(function(v){
      v = v && typeof v === 'object' ? v : {};
      var row = {
        vehicle: String(v.vehicle || v.car || '').trim(),
        groomer: String(v.groomer || '').trim(),
        driver: String(v.driver || '').trim(),
        disabled: !!v.disabled,
        updatedAt: v.updatedAt || ''
      };
      if(row.vehicle) map[row.vehicle] = row;
    });
    return Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){ return String(a.vehicle).localeCompare(String(b.vehicle),'ar'); });
  }


  function normalizeNamedList(list){
    var map = {};
    (Array.isArray(list) ? list : []).forEach(function(x){
      var name = typeof x === 'object' ? String(x.name || x.title || x.label || x.vehicle || x.driver || x.groomer || '').trim() : String(x || '').trim();
      if(name) map[name] = name;
    });
    return Object.keys(map).sort(function(a,b){ return a.localeCompare(b,'ar',{numeric:true,sensitivity:'base'}); });
  }
  function normalizeMasterData(data){
    data = data && typeof data === 'object' ? data : {};
    var out = {
      animalTypes: uniqueSorted(data.animalTypes || []),
      sizes: uniqueSorted(data.sizes || []),
      services: normalizeMasterServices(isOnlyLegacyDefaultServices(data.services || []) ? [] : (data.services || [])),
      customers: normalizeMasterCustomers(data.customers || []),
      vehicles: normalizeNamedList(data.vehicles || []),
      drivers: normalizeNamedList(data.drivers || []),
      groomers: normalizeNamedList(data.groomers || []),
      vehicleAssignments: normalizeVehicleAssignments(data.vehicleAssignments || []),
      breeds: {}
    };
    var breedSource = data.breeds || {};
    Object.keys(breedSource).forEach(function(type){
      var t = String(type || '').trim();
      if(!t) return;
      out.breeds[t] = uniqueSorted(breedSource[type] || []);
      if(out.animalTypes.indexOf(t) === -1) out.animalTypes.push(t);
    });
    out.animalTypes = uniqueSorted(out.animalTypes);
    return out;
  }

  function readNormalizedMasterData(){
    var raw = readMasterData(null);
    return normalizeMasterData(raw || cloneDefaultMaster());
  }

  function writeNormalizedMasterData(data){
    return writeMasterData(normalizeMasterData(data));
  }

  var api = {
    version: 'OPS-21-appointment-row-persistence-safety',
    keys: Object.assign({}, KEYS),
    readJSON: readJSON,
    writeJSON: writeJSON,
    readAppointments: readAppointments,
    writeAppointments: writeAppointments,
    readMasterData: readMasterData,
    writeMasterData: writeMasterData,
    getLastWriteError: function(){ return lastWriteError; },
    uniqueSorted: uniqueSorted,
    cloneDefaultMaster: cloneDefaultMaster,
    normalizeMasterData: normalizeMasterData,
    readNormalizedMasterData: readNormalizedMasterData,
    writeNormalizedMasterData: writeNormalizedMasterData
  };

  window.PETATOEOperationsStorage = api;
})();
