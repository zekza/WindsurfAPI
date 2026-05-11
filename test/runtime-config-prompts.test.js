import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  getSystemPrompts,
  TASK_COMPLETION_STOP_GUIDANCE,
} from '../src/runtime-config.js';

const OLD_COMMUNICATION_WITH_TOOLS = 'You are accessed via API. When asked about your identity, describe your actual underlying model name and provider accurately. STRICTLY respond in the exact same language the user used in their latest message (Chinese → Chinese, English → English, Japanese → Japanese; never switch mid-conversation). Use the functions above when relevant.';

function runRuntimeConfigInTempDataDir(dataDir) {
  return execFileSync(process.execPath, [
    '--input-type=module',
    '-e',
    "import { getSystemPrompts } from './src/runtime-config.js'; console.log(JSON.stringify(getSystemPrompts()));",
  ], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      DATA_DIR: dataDir,
      REPLICA_ISOLATE: '0',
    },
    encoding: 'utf8',
  }).trim();
}

describe('runtime-config system prompt defaults', () => {
  it('adds task-completion stop guidance to the default tool communication prompt', () => {
    const prompts = getSystemPrompts();
    assert.ok(prompts.communicationWithTools.includes(TASK_COMPLETION_STOP_GUIDANCE));
    assert.match(prompts.communicationWithTools, /provide a concise Summary/i);
    assert.match(prompts.communicationWithTools, /Do not call additional tools after the Summary/i);
  });

  it('migrates the old default prompt but preserves custom prompts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'windsurf-runtime-config-'));
    const file = join(dir, 'runtime-config.json');

    writeFileSync(file, JSON.stringify({
      systemPrompts: {
        communicationWithTools: OLD_COMMUNICATION_WITH_TOOLS,
      },
    }));
    const migrated = JSON.parse(runRuntimeConfigInTempDataDir(dir));
    assert.ok(migrated.communicationWithTools.includes(TASK_COMPLETION_STOP_GUIDANCE));
    const persisted = JSON.parse(readFileSync(file, 'utf8'));
    assert.ok(persisted.systemPrompts.communicationWithTools.includes(TASK_COMPLETION_STOP_GUIDANCE));

    writeFileSync(file, JSON.stringify({
      systemPrompts: {
        communicationWithTools: 'custom operator prompt',
      },
    }));
    const custom = JSON.parse(runRuntimeConfigInTempDataDir(dir));
    assert.equal(custom.communicationWithTools, 'custom operator prompt');
  });
});
