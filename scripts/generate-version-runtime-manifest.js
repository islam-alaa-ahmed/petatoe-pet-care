'use strict';
const path = require('path');
const { rootDir, readManifest } = require('./version-manifest-lib');
const fs = require('fs');
const root = rootDir();
const { data } = readManifest(root);
const target = path.join(root, 'runtime', 'version-manifest.js');
const payload = {
  schemaVersion: data.schemaVersion,
  product: data.product,
  releaseVersion: data.releaseVersion,
  releaseLabel: data.releaseLabel,
  releaseName: data.releaseName,
  buildVersion: data.buildVersion,
  cacheVersion: data.cacheVersion,
  runtimeContracts: data.runtimeContracts,
  native: data.native
};
const output = `/* Generated from config/petatoe-version.json. Do not edit manually. */\n(function(global){\n  'use strict';\n  var manifest = ${JSON.stringify(payload, null, 2)};\n  try{ Object.freeze(manifest.runtimeContracts); Object.freeze(manifest.native); Object.freeze(manifest); }catch(_e){}\n  global.PETATOEVersionManifest = manifest;\n})(typeof window !== 'undefined' ? window : globalThis);\n`;
fs.mkdirSync(path.dirname(target), {recursive:true});
fs.writeFileSync(target, output);
console.log(`Generated ${path.relative(root, target)}`);
