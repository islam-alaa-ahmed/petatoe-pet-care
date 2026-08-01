'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function rootDir(){ return path.resolve(__dirname, '..'); }
function readUtf8(file){ return fs.readFileSync(file, 'utf8'); }
function readManifest(root = rootDir()){
  const file = path.join(root, 'config', 'petatoe-version.json');
  const data = JSON.parse(readUtf8(file));
  validateManifest(data);
  return { file, data };
}
function validateManifest(m){
  const required = ['schemaVersion','product','releaseVersion','releaseLabel','releaseName','buildVersion','cacheVersion','runtimeContracts'];
  for (const key of required) if (m[key] === undefined || m[key] === null || m[key] === '') throw new Error(`Missing version manifest field: ${key}`);
  if (!/^\d+\.\d+\.\d+$/.test(m.releaseVersion)) throw new Error('releaseVersion must use semantic x.y.z format');
  if (m.releaseLabel !== `v${m.releaseVersion}`) throw new Error('releaseLabel must equal v + releaseVersion');
  if (!m.runtimeContracts || typeof m.runtimeContracts !== 'object' || Array.isArray(m.runtimeContracts)) throw new Error('runtimeContracts must be an object');
}
function sha256(text){ return crypto.createHash('sha256').update(text).digest('hex'); }
function writeJson(file, value){ fs.mkdirSync(path.dirname(file), {recursive:true}); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n'); }
function relative(root, file){ return path.relative(root, file).split(path.sep).join('/'); }
function walk(root, dir = root, out = []){
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})){
    if (['.git','node_modules'].includes(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(root, full, out); else out.push(full);
  }
  return out;
}
module.exports = { rootDir, readUtf8, readManifest, validateManifest, sha256, writeJson, relative, walk };
