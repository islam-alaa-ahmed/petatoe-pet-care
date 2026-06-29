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
  var appointmentsCache = [];
  var masterDataCache = null;
  var bootStarted = false;
  var bootDone = false;
  var appointmentsRevision = 0;
  var masterDataRevision = 0;
  var writeQueue = Promise.resolve();

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

  async function replaceAppointmentsSupabase(rows){
    if(!isClientReady()) return false;
    rows = Array.isArray(rows) ? rows : [];
    var c = client();
    var del = await c.from(TABLE_APPOINTMENTS).delete().not('id', 'is', null);
    if(del && del.error) throw del.error;
    if(!rows.length) return true;
    var payload = rows.map(appointmentPayload);
    var ins = await c.from(TABLE_APPOINTMENTS).insert(payload);
    if(ins && ins.error) throw ins.error;
    return true;
  }

  async function replaceMasterSupabase(data){
    if(!isClientReady()) return false;
    var c = client();
    var del = await c.from(TABLE_MASTER).delete().not('id', 'is', null);
    if(del && del.error) throw del.error;
    var ins = await c.from(TABLE_MASTER).insert([{ data: normalizeMasterData(data), updated_at: new Date().toISOString() }]);
    if(ins && ins.error) throw ins.error;
    return true;
  }

  async function loadAppointmentsSupabase(){
    if(!isClientReady()) return [];
    var res = await client().from(TABLE_APPOINTMENTS).select('data,appointment_date,created_at').order('appointment_date', { ascending:true }).order('created_at', { ascending:true });
    if(res && res.error) throw res.error;
    return (Array.isArray(res && res.data) ? res.data : []).map(normalizeAppointmentRow);
  }

  async function loadMasterSupabase(){
    if(!isClientReady()) return null;
    var res = await client().from(TABLE_MASTER).select('data,updated_at,created_at').order('updated_at', { ascending:false, nullsFirst:false }).order('created_at', { ascending:false, nullsFirst:false }).limit(1);
    if(res && res.error) throw res.error;
    var row = Array.isArray(res && res.data) && res.data.length ? res.data[0] : null;
    return row && row.data ? row.data : null;
  }

  function queueWrite(task){
    writeQueue = writeQueue.then(task).catch(function(e){ warn(e); });
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
      queueWrite(function(){ return replaceAppointmentsSupabase(snapshot); });
      emitChange('appointments');
      return true;
    }
    if(key === KEYS.masterData){
      masterDataCache = normalizeMasterData(value);
      masterDataRevision += 1;
      var snapshotMaster = cloneJSON(masterDataCache);
      queueWrite(function(){ return replaceMasterSupabase(snapshotMaster); });
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
        updatedAt: c.updatedAt || ''
      };
      if(!row.code) row.code = row.phone ? ('phone:' + row.phone.replace(/\s+/g,'')) : (row.name ? ('name:' + row.name.toLowerCase()) : '');
      if(!row.code && !row.name && !row.phone && !row.address) return;
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
    version: 'OPS-19-storage-final-extraction',
    keys: Object.assign({}, KEYS),
    readJSON: readJSON,
    writeJSON: writeJSON,
    readAppointments: readAppointments,
    writeAppointments: writeAppointments,
    readMasterData: readMasterData,
    writeMasterData: writeMasterData,
    uniqueSorted: uniqueSorted,
    cloneDefaultMaster: cloneDefaultMaster,
    normalizeMasterData: normalizeMasterData,
    readNormalizedMasterData: readNormalizedMasterData,
    writeNormalizedMasterData: writeNormalizedMasterData
  };

  window.PETATOEOperationsStorage = api;
})();
