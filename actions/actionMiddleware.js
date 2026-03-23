const { loadPermissions, isAllowed } = require('./permissions');
const { createChannel, modifyChannel, deleteChannel } = require('./executors/channel');
const { createRole, assignRole, removeRole, modifyRole, deleteRole } = require('./executors/role');
const { sendMessage } = require('./executors/message');
const { createEvent } = require('./executors/event');
const { setRules } = require('./executors/rules');
const { handleEconomyAction } = require('./executors/economy');
const { requestOwnerPermission } = require('./executors/owner');
const { createInvite } = require('./executors/invite');
const { warn } = require('../core/logger');

const EXECUTORS = {
  create_channel: createChannel,
  modify_channel: modifyChannel,
  delete_channel: deleteChannel,
  create_role: createRole,
  assign_role: assignRole,
  remove_role: removeRole,
  modify_role: modifyRole,
  delete_role: deleteRole,
  send_message: sendMessage,
  create_event: createEvent,
  set_rules: setRules,
  create_invite: createInvite,
  create_shop_item: handleEconomyAction,
  create_job_role: handleEconomyAction,
  award_currency: handleEconomyAction,
  create_currency: handleEconomyAction,
  request_owner_permission: requestOwnerPermission
};

function validateAction(action) {
  if (!action || typeof action !== 'object') return 'Action must be an object.';
  if (!action.agent) return 'Missing agent name.';
  if (!action.action) return 'Missing action type.';
  return null;
}

async function processActions(actions, { client, config, memoryStore }) {
  const permissions = loadPermissions(config);
  const results = [];

  for (const action of actions) {
    const validationError = validateAction(action);
    if (validationError) {
      results.push({ action, status: 'invalid', message: validationError });
      memoryStore.logMemory(action?.agent || 'System', 'action_invalid', {
        action,
        reason: validationError
      });
      continue;
    }

    if (!isAllowed(permissions, action.action)) {
      results.push({ action, status: 'denied', message: 'Permission denied.' });
      memoryStore.logMemory(action.agent, 'action_denied', {
        action,
        reason: 'Permission denied by middleware.'
      });
      continue;
    }

    const executor = EXECUTORS[action.action];
    if (!executor) {
      results.push({ action, status: 'failed', message: 'No executor found.' });
      memoryStore.logMemory(action.agent, 'action_failed', {
        action,
        reason: 'No executor found.'
      });
      continue;
    }

    try {
      const result = await executor({
        client,
        config,
        guildId: config.discord.guildId,
        action,
        memoryStore
      });

      results.push({ action, status: result.ok ? 'ok' : 'failed', message: result.message });
      memoryStore.logMemory(action.agent, 'action_result', {
        action,
        result
      });
    } catch (err) {
      warn('Action executor error', err);
      results.push({ action, status: 'error', message: err.message });
      memoryStore.logMemory(action.agent, 'action_error', {
        action,
        error: err.message
      });
    }
  }

  return results;
}

module.exports = {
  processActions
};
