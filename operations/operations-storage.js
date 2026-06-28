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

  function storage(){ return window.PETATOEStorage || null; }

  function readJSON(key, fallback){
    try{
      var st = storage();
      if(st && typeof st.readJSON === 'function'){
        return st.readJSON(key, fallback);
      }
    }catch(e){ warn(e); }
    return fallback;
  }

  function writeJSON(key, value){
    try{
      var st = storage();
      if(st && typeof st.writeJSON === 'function'){
        return !!st.writeJSON(key, value);
      }
    }catch(e){ warn(e); }
    return false;
  }

  function readAppointments(){
    var rows = readJSON(KEYS.appointments, []);
    return Array.isArray(rows) ? rows : [];
  }

  function writeAppointments(rows){
    return writeJSON(KEYS.appointments, Array.isArray(rows) ? rows : []);
  }

  function readMasterData(fallback){
    return readJSON(KEYS.masterData, fallback == null ? null : fallback);
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
        updatedAt: v.updatedAt || ''
      };
      if(row.vehicle) map[row.vehicle] = row;
    });
    return Object.keys(map).map(function(k){ return map[k]; }).sort(function(a,b){ return String(a.vehicle).localeCompare(String(b.vehicle),'ar'); });
  }

  function normalizeMasterData(data){
    data = data && typeof data === 'object' ? data : {};
    var out = {
      animalTypes: uniqueSorted(data.animalTypes || []),
      sizes: uniqueSorted(data.sizes || []),
      services: normalizeMasterServices(isOnlyLegacyDefaultServices(data.services || []) ? [] : (data.services || [])),
      customers: normalizeMasterCustomers(data.customers || []),
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
