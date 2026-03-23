const { sendMessage } = require('./message');

async function setRules({ client, guildId, action, config, memoryStore }) {
  const rules = action.rules;
  if (!rules) {
    return { ok: false, message: 'Missing rules content.' };
  }

  const rulesText = Array.isArray(rules) ? rules.map((rule, idx) => `${idx + 1}. ${rule}`).join('\n') : rules;

  memoryStore.addEvent({
    type: 'rules_update',
    details: { rules: rulesText }
  });

  const channelName = config.discord.rulesChannel || 'rules';
  const result = await sendMessage({
    client,
    guildId,
    action: {
      channel: channelName,
      content: `Server Rules:\n${rulesText}`
    }
  });

  return result;
}

module.exports = {
  setRules
};
