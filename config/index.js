const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

function resolveEnv(value) {
  if (typeof value !== 'string') return value;
  const envMatch = value.match(/^\$\{(.+?)\}$/);
  if (!envMatch) return value;
  const envKey = envMatch[1];
  return process.env[envKey] ?? '';
}

function deepResolve(obj) {
  if (Array.isArray(obj)) return obj.map(deepResolve);
  if (obj && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([key, val]) => [key, deepResolve(val)])
    );
  }
  return resolveEnv(obj);
}

function loadConfig() {
  const configPath = path.join(__dirname, 'default.json');
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = JSON.parse(raw);
  const resolved = deepResolve(parsed);

  const usage = resolved?.llm?.usage || {};
  const allowedAgents = (() => {
    if (!usage.allowedAgents) return null;
    if (Array.isArray(usage.allowedAgents)) return usage.allowedAgents;
    if (typeof usage.allowedAgents === 'string') {
      const list = usage.allowedAgents
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      return list.length > 0 ? list : null;
    }
    return null;
  })();

  return {
    ...resolved,
    loop: {
      ...resolved.loop,
      intervalMinutes: Number(resolved.loop.intervalMinutes || 5)
    },
    llm: {
      ...resolved.llm,
      usage: {
        maxCallsPerTick: Number(usage.maxCallsPerTick || 2),
        cooldownMinutes: Number(usage.cooldownMinutes || 10),
        cooldownMinutesOn402: Number(usage.cooldownMinutesOn402 || 60),
        allowedAgents
      }
    },
    permissions: {
      ...resolved.permissions,
      allowAll: String(resolved.permissions?.allowAll || '').toLowerCase() === 'true'
    }
  };
}

module.exports = {
  loadConfig
};
