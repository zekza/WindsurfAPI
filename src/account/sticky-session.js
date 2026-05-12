/**
 * Optional sticky session manager.
 *
 * This is a coarse safety net for multi-turn clients: when enabled, a
 * (callerKey, modelKey) pair is kept on the last successful Windsurf account.
 * The narrower cascade continuation pool in conversation-pool.js remains the
 * primary Claude Code tool_result fix.
 */

const ENABLED = process.env.STICKY_SESSION_ENABLED === '1';

const TTL_MS = (() => {
  const n = parseInt(process.env.STICKY_SESSION_TTL_MS || '', 10);
  return Number.isFinite(n) && n > 0 ? n : 30 * 60 * 1000;
})();

const MAX_BINDINGS = (() => {
  const n = parseInt(process.env.STICKY_SESSION_MAX || '', 10);
  return Number.isFinite(n) && n > 0 ? n : 10000;
})();

const _bindings = new Map();
const _stats = { hits: 0, misses: 0, creates: 0, expires: 0, evictions: 0, clears: 0 };

function bindingKey(callerKey, modelKey) {
  return `${callerKey}\0${modelKey || '*'}`;
}

let _cleanupTimer = null;
function ensureCleanupTimer() {
  if (_cleanupTimer) return;
  _cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, binding] of _bindings) {
      if (now - binding.lastAccess > TTL_MS) {
        _bindings.delete(key);
        _stats.expires++;
      }
    }
  }, 5 * 60 * 1000).unref();
}

export function isStickyEnabled() {
  return ENABLED;
}

export function getStickyBinding(callerKey, modelKey = '') {
  if (!ENABLED || !callerKey) return null;
  ensureCleanupTimer();
  const key = bindingKey(callerKey, modelKey);
  const binding = _bindings.get(key);
  if (!binding) {
    _stats.misses++;
    return null;
  }
  const now = Date.now();
  if (now - binding.lastAccess > TTL_MS) {
    _bindings.delete(key);
    _stats.expires++;
    return null;
  }
  binding.lastAccess = now;
  _stats.hits++;
  return { accountId: binding.accountId, apiKey: binding.apiKey };
}

export function setStickyBinding(callerKey, modelKey, accountId, apiKey) {
  if (!ENABLED || !callerKey || !accountId || !apiKey) return;
  ensureCleanupTimer();
  const key = bindingKey(callerKey, modelKey);
  if (_bindings.size >= MAX_BINDINGS && !_bindings.has(key)) {
    let oldestKey = null;
    let oldestTime = Infinity;
    for (const [k, b] of _bindings) {
      if (b.lastAccess < oldestTime) {
        oldestTime = b.lastAccess;
        oldestKey = k;
      }
    }
    if (oldestKey) {
      _bindings.delete(oldestKey);
      _stats.evictions++;
    }
  }
  const now = Date.now();
  const existing = _bindings.get(key);
  _bindings.set(key, {
    accountId,
    apiKey,
    createdAt: existing?.createdAt || now,
    lastAccess: now,
  });
  if (!existing) _stats.creates++;
}

export function clearStickyBinding(callerKey, modelKey = '') {
  if (!ENABLED || !callerKey) return;
  if (_bindings.delete(bindingKey(callerKey, modelKey))) _stats.clears++;
}

export function clearCallerBindings(callerKey) {
  if (!ENABLED || !callerKey) return;
  const prefix = `${callerKey}\0`;
  for (const key of _bindings.keys()) {
    if (key.startsWith(prefix) && _bindings.delete(key)) _stats.clears++;
  }
}

export function resetAllBindings() {
  _bindings.clear();
}

export function getStickyStats() {
  return { ..._stats, size: _bindings.size };
}
