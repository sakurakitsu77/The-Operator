const fs = require('fs');
const path = require('path');

function loadPermissions(config) {
  const permPath = config?.permissions?.path;
  if (!permPath) return { actions: {} };
  const resolved = path.resolve(permPath);
  const raw = fs.readFileSync(resolved, 'utf8');
  const parsed = JSON.parse(raw);
  return {
    ...parsed,
    allowAll: Boolean(config?.permissions?.allowAll)
  };
}

function isAllowed(permissions, actionType) {
  if (permissions?.allowAll) return true;
  if (!permissions?.actions) return false;
  return Boolean(permissions.actions[actionType]);
}

module.exports = {
  loadPermissions,
  isAllowed
};
