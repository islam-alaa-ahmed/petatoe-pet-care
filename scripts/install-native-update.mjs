import { access, cp } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appDir = path.join(root, 'ios', 'App', 'App');
async function exists(file) { try { await access(file); return true; } catch { return false; } }
if (!(await exists(appDir))) throw new Error('ios/App/App was not found. Run npx cap add ios first.');
await cp(path.join(root, 'native', 'ios', 'PetatoeNativeUpdatePlugin.swift'), path.join(appDir, 'PetatoeNativeUpdatePlugin.swift'), { force: true });
console.log('PETATOE native update plugin installed.');
