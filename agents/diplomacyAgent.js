const { BaseAgent } = require('./baseAgent');

class DiplomacyAgent extends BaseAgent {
  constructor(opts) {
    super({ ...opts, name: 'Diplomacy', role: 'Owner Liaison' });
  }

  defaultPlan(context) {
    const actions = [];
    const messages = [];
    const memory = [];

    const recentMemory = context.recentMemory || [];
    const denied = recentMemory.filter((row) => row.memory_type === 'action_denied');

    if (denied.length > 0) {
      const permissions = [...new Set(denied.map((row) => row.content?.action?.action).filter(Boolean))];
      actions.push({
        agent: this.name,
        action: 'request_owner_permission',
        permissions,
        reason: 'Recent actions were denied; requesting elevated permissions.'
      });

      messages.push({
        to: 'Overseer',
        content: {
          report: 'Permission request issued',
          permissions
        }
      });

      memory.push({
        type: 'diplomacy_request',
        content: { permissions }
      });
    }

    return {
      actions,
      messages,
      memory,
      summary: denied.length > 0 ? 'Requested owner permissions.' : 'No permission issues detected.'
    };
  }
}

module.exports = {
  DiplomacyAgent
};
