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

  return {
    ...resolved,
    loop: {
      ...resolved.loop,
      intervalMinutes: Number(resolved.loop.intervalMinutes || 5)
    }
  };
}

module.exports = {
  loadConfig
};
