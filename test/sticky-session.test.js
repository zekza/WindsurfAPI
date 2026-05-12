import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

describe('optional sticky session integration', () => {
  test('sticky sessions stay disabled unless explicitly enabled', () => {
    const script = `
      import { isStickyEnabled, setStickyBinding, getStickyBinding, getStickyStats } from './src/account/sticky-session.js';
      setStickyBinding('caller-a', 'model-a', 'acct-a', 'key-a');
      console.log(JSON.stringify({
        enabled: isStickyEnabled(),
        binding: getStickyBinding('caller-a', 'model-a'),
        stats: getStickyStats(),
      }));
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, STICKY_SESSION_ENABLED: '' },
    });
    assert.equal(result.status, 0, result.stderr);
    const body = JSON.parse(result.stdout);
    assert.equal(body.enabled, false);
    assert.equal(body.binding, null);
    assert.equal(body.stats.size, 0);
  });

  test('enabled sticky binding is caller and model scoped', () => {
    const script = `
      import { isStickyEnabled, setStickyBinding, getStickyBinding, getStickyStats } from './src/account/sticky-session.js';
      setStickyBinding('caller-a', 'model-a', 'acct-a', 'key-a');
      console.log(JSON.stringify({
        enabled: isStickyEnabled(),
        same: getStickyBinding('caller-a', 'model-a'),
        otherModel: getStickyBinding('caller-a', 'model-b'),
        otherCaller: getStickyBinding('caller-b', 'model-a'),
        stats: getStickyStats(),
      }));
    `;
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: { ...process.env, STICKY_SESSION_ENABLED: '1' },
    });
    assert.equal(result.status, 0, result.stderr);
    const body = JSON.parse(result.stdout);
    assert.equal(body.enabled, true);
    assert.deepEqual(body.same, { accountId: 'acct-a', apiKey: 'key-a' });
    assert.equal(body.otherModel, null);
    assert.equal(body.otherCaller, null);
    assert.equal(body.stats.size, 1);
  });
});
