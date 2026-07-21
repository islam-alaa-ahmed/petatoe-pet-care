import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(scriptDir, '..');
const outDir = path.join(rootDir, 'www');

const excludedNames = new Set([
  '.git', '.github', '.idea', '.vscode',
  'node_modules', 'ios', 'android', 'www',
  'native', 'scripts',
  'package-lock.json', 'package.json',
  'capacitor.config.ts',
  'README_NATIVE_IOS.md'
]);

const excludedExtensions = new Set(['.zip', '.md', '.sql', '.log']);
const includedRootFiles = new Set([
  'index.html', '404.html', 'offline.html', 'manifest.webmanifest',
  'browserconfig.xml', 'favicon.ico', 'RELEASE_VERSION'
]);

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
    if (entry.isDirectory()) {
      await copyTree(sourcePath, targetPath, false);
    } else {
      await cp(sourcePath, targetPath, { force: true });
    }
  }
}

await rm(outDir, { recursive: true, force: true });
await copyTree(rootDir, outDir, true);
console.log(`PETATOE native web bundle created at ${outDir}`);
