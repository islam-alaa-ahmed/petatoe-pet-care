import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const checks = [];
const add = (name, ok, detail = '') => checks.push({ name, ok: Boolean(ok), detail });
const exists = (p) => fs.existsSync(path.join(root, p));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

const required = [
  'capacitor.config.ts',
  'native/ios/PetatoeNativeAuthPlugin.swift',
  'native/ios/PetatoeViewController.swift',
  'native/runtime/native-biometric-auth.js',
  'native/ios/PetatoeNativeUpdatePlugin.swift',
  'native/runtime/native-update-coordinator.js',
  'native-release.json',
  'scripts/build-native-web.mjs',
  'scripts/install-native-face-id.mjs',
  'scripts/install-native-update.mjs',
  'scripts/setup-native-ios.sh'
];
for (const file of required) add(`required:${file}`, exists(file), exists(file) ? 'present' : 'missing');

if (exists('capacitor.config.ts')) {
  const config = read('capacitor.config.ts');
  add('bundle-id', /appId\s*:\s*['"]com\.petatoe\.enterprise['"]/.test(config), 'expected com.petatoe.enterprise');
  add('web-dir', /webDir\s*:\s*['"]www['"]/.test(config), 'expected www');
}

if (exists('native/ios/PetatoeNativeAuthPlugin.swift')) {
  const swift = read('native/ios/PetatoeNativeAuthPlugin.swift');
  add('local-authentication', /import\s+LocalAuthentication/.test(swift), 'LocalAuthentication imported');
  add('keychain-device-only', /kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly/.test(swift), 'device-only Keychain access');
  add('biometry-current-set', /biometryCurrentSet/.test(swift), 'invalidates when biometrics change');
  const stripped = swift.replace(/kSecClassGenericPassword/g, '');
  add('no-password-storage', !/(userPassword|accountPassword|savedPassword|passwordValue|passwordData)/i.test(stripped), 'no application password fields are persisted');
}

if (exists('native/ios/PetatoeNativeUpdatePlugin.swift')) {
  const swift = read('native/ios/PetatoeNativeUpdatePlugin.swift');
  add('native-version-source', /CFBundleShortVersionString/.test(swift) && /CFBundleVersion/.test(swift), 'reads signed bundle metadata');
}

if (exists('native/runtime/native-update-coordinator.js')) {
  const js = read('native/runtime/native-update-coordinator.js');
  add('approved-update-hosts', /apps\.apple\.com/.test(js) && /testflight\.apple\.com/.test(js) && /github\.com/.test(js), 'approved hosts enforced');
  add('no-runtime-eval', !/\beval\s*\(|new\s+Function\s*\(/.test(js), 'no downloaded code execution');
}

if (exists('native-release.json')) {
  try {
    const release = JSON.parse(read('native-release.json'));
    add('release-json-valid', true, 'valid JSON');
    add('release-version-present', typeof release.latestVersion === 'string' || typeof release.version === 'string', 'version metadata present');
  } catch (error) {
    add('release-json-valid', false, error.message);
  }
}

if (exists('package.json')) {
  const pkg = JSON.parse(read('package.json'));
  add('capacitor-core', Boolean(pkg.dependencies?.['@capacitor/core']), 'dependency present');
  add('capacitor-ios', Boolean(pkg.dependencies?.['@capacitor/ios']), 'dependency present');
  add('certification-script', Boolean(pkg.scripts?.['native:certify']), 'npm command present');
}

const failures = checks.filter((item) => !item.ok);
const result = {
  certification: failures.length === 0 ? 'STATIC_GATE_PASSED' : 'FAILED',
  generatedAt: new Date().toISOString(),
  checks: checks.length,
  passed: checks.length - failures.length,
  failed: failures.length,
  limitation: 'Xcode compilation, code signing, Face ID, Keychain persistence and real-device lifecycle tests require macOS/Xcode and an iPhone.',
  details: checks
};
fs.writeFileSync(path.join(root, 'NATIVE_IOS_CERTIFICATION_RESULTS.json'), JSON.stringify(result, null, 2) + '\n');
console.log(`PETATOE Native iOS static certification: ${result.certification}`);
console.log(`Checks: ${result.checks} | Passed: ${result.passed} | Failed: ${result.failed}`);
for (const failure of failures) console.error(`FAIL ${failure.name}: ${failure.detail}`);
process.exitCode = failures.length ? 1 : 0;
