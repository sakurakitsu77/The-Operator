const fs = require('fs');
const path = require('path');

function loadPermissions(config) {
  const permPath = config?.permissions?.path;
  if (!permPath) return { actions: {} };
  const resolved = path.resolve(permPath);
  const raw = fs.readFileSync(resolved, 'utf8');
  return JSON.parse(raw);
}

function isAllowed(permissions, actionType) {
  if (!permissions?.actions) return false;
  return Boolean(permissions.actions[actionType]);
}

module.exports = {
  loadPermissions,
  isAllowed
};
