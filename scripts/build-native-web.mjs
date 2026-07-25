import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const outDir = path.join(rootDir, 'www');

const excludedNames = new Set([
  '.git', '.github', '.idea', '.vscode', 'node_modules', 'ios', 'android', 'www',
  'native', 'scripts', 'package-lock.json', 'package.json', 'capacitor.config.ts',
  'README_NATIVE_IOS.md', 'README_NATIVE_FACE_ID.md', 'README_NATIVE_UPDATE.md'
]);
const excludedExtensions = new Set(['.zip', '.md', '.sql', '.log']);
const includedRootFiles = new Set(['index.html', '404.html', 'offline.html', 'manifest.webmanifest', 'browserconfig.xml', 'favicon.ico', 'RELEASE_VERSION', 'native-release.json']);

async function shouldCopy(sourcePath, entryName, isRoot) {
  if (excludedNames.has(entryName)) return false;
  const info = await stat(sourcePath);
  if (info.isDirectory()) return true;
  if (isRoot && includedRootFiles.has(entryName)) return true;
  return !excludedExtensions.has(path.extname(entryName).toLowerCase());
}
async function copyTree(sourceDir, targetDir, isRoot = false) {
  await mkdir(targetDir, { recursive: true });
  for (const entry of await readdir(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    if (!(await shouldCopy(sourcePath, entry.name, isRoot))) continue;
    const targetPath = path.join(targetDir, entry.name);
    if (entry.isDirectory()) await copyTree(sourcePath, targetPath, false);
    else await cp(sourcePath, targetPath, { force: true });
  }
}

await rm(outDir, { recursive: true, force: true });
await copyTree(rootDir, outDir, true);
await mkdir(path.join(outDir, 'native'), { recursive: true });
await cp(path.join(rootDir, 'native', 'runtime', 'native-biometric-auth.js'), path.join(outDir, 'native', 'native-biometric-auth.js'), { force: true });
await cp(path.join(rootDir, 'native', 'runtime', 'native-update-coordinator.js'), path.join(outDir, 'native', 'native-update-coordinator.js'), { force: true });

const indexPath = path.join(outDir, 'index.html');
let html = await readFile(indexPath, 'utf8');
const biometricTag = '<script src="native/native-biometric-auth.js?v=10.0.23-mobile-corrective-parity-c1"></script>';
const updateTag = '<script src="native/native-update-coordinator.js?v=10.0.0-n3" defer></script>';
if (!html.includes(biometricTag)) {
  const authScriptPattern = /<script\b[^>]*src=["'][^"']*security\/auth-session\.js[^"']*["'][^>]*><\/script>/i;
  if (authScriptPattern.test(html)) html = html.replace(authScriptPattern, biometricTag + '\n$&');
  else html = html.replace(/<\/body>/i, biometricTag + '\n</body>');
}
if (!html.includes(updateTag)) html = html.replace(/<\/body>/i, updateTag + '\n</body>');
const nativeCss = '<style id="petatoe-native-auth-style">html,body{background:#f8fafc!important}html.petatoe-native-ios #petAuthBiometricBtn,html.petatoe-native-ios .pet-auth-biometric,html.petatoe-native-ios .pet-auth-enroll{display:none!important}html.pet-native-auth-pending body{pointer-events:none!important}html.pet-native-auth-pending::before{content:"";position:fixed;inset:0;z-index:2147483646;background:linear-gradient(180deg,#f8fafc 0%,#eef2f7 100%)}html.pet-native-auth-pending::after{content:"";position:fixed;z-index:2147483647;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:18px;border:4px solid rgba(15,23,42,.12);border-top-color:#0f172a;animation:petNativeAuthSpin .8s linear infinite}@keyframes petNativeAuthSpin{to{transform:rotate(360deg)}}</style>'
if (!html.includes('petatoe-native-auth-style')) html = html.replace(/<\/head>/i, nativeCss + '\n</head>');
await writeFile(indexPath, html);
console.log(`PETATOE native web bundle created at ${outDir} with Face ID and safe native update coordination.`);
