import { cp, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'ios', 'App', 'App');
const storyboardPath = path.join(appDir, 'Base.lproj', 'Main.storyboard');
const infoPlistPath = path.join(appDir, 'Info.plist');
const faceIdUsageDescription = 'PETATOE uses Face ID to securely unlock your saved session.';

async function exists(file) { try { await access(file); return true; } catch { return false; } }
if (!(await exists(appDir))) throw new Error('ios/App/App was not found. Run npx cap add ios first.');

for (const file of ['PetatoeNativeAuthPlugin.swift', 'PetatoeViewController.swift']) {
  await cp(path.join(root, 'native', 'ios', file), path.join(appDir, file), { force: true });
}

if (!(await exists(storyboardPath))) throw new Error('Main.storyboard was not found.');
let storyboard = await readFile(storyboardPath, 'utf8');
if (!storyboard.includes('customClass="PetatoeViewController"')) {
  storyboard = storyboard
    .replace(/customClass="CAPBridgeViewController"(?:\s+customModule="Capacitor")?/, 'customClass="PetatoeViewController" customModule="App" customModuleProvider="target"')
    .replace(/customClass="BridgeViewController"[^>]*/, 'customClass="PetatoeViewController" customModule="App" customModuleProvider="target"');
}
if (!storyboard.includes('customClass="PetatoeViewController"')) {
  throw new Error('Could not locate the Capacitor bridge view controller in Main.storyboard.');
}
await writeFile(storyboardPath, storyboard);

if (!(await exists(infoPlistPath))) throw new Error('Info.plist was not found.');
let infoPlist = await readFile(infoPlistPath, 'utf8');
const faceIdKeyPattern = /\s*<key>NSFaceIDUsageDescription<\/key>\s*<string>[\s\S]*?<\/string>/;
const faceIdEntry = `\n\t<key>NSFaceIDUsageDescription</key>\n\t<string>${faceIdUsageDescription}</string>`;

if (faceIdKeyPattern.test(infoPlist)) {
  infoPlist = infoPlist.replace(faceIdKeyPattern, faceIdEntry);
} else {
  const closingDictIndex = infoPlist.lastIndexOf('</dict>');
  if (closingDictIndex === -1) throw new Error('Info.plist does not contain a closing </dict> tag.');
  infoPlist = `${infoPlist.slice(0, closingDictIndex)}${faceIdEntry}\n${infoPlist.slice(closingDictIndex)}`;
}
await writeFile(infoPlistPath, infoPlist);

console.log('PETATOE native Face ID Swift files, view controller registration, and NSFaceIDUsageDescription installed.');
