'use strict';
const { spawnSync } = require('child_process');
const path = require('path');
const script = path.join(__dirname, 'version-single-source-audit.js');
const result = spawnSync(process.execPath, [script, '--strict'], {stdio:'inherit'});
process.exit(result.status === null ? 1 : result.status);
