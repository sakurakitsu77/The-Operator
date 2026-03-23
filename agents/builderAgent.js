const { BaseAgent } = require('./baseAgent');

class BuilderAgent extends BaseAgent {
  constructor(opts) {
    super({ ...opts, name: 'Builder', role: 'World Builder' });
  }

  defaultPlan(context) {
    const actions = [];
    const messages = [];
    const memory = [];

    const observation = context.observation;
    if (!observation || observation.status !== 'ok') {
      return { actions, messages, memory, summary: 'No observation available.' };
    }

    const channels = observation.channels || [];
    const roles = observation.roles || [];
    const announcementChannel = this.config.discord.announcementChannel || 'announcements';
    const rulesChannel = this.config.discord.rulesChannel || 'rules';

    const ensureChannel = (name, reason) => {
      if (!channels.includes(name)) {
        actions.push({
          agent: this.name,
          action: 'create_channel',
          name,
          channel_type: 'text',
          reason
        });
      }
    };

    ensureChannel('town-square', 'Central social hub for members.');
    ensureChannel(announcementChannel, 'Broadcast key updates and events.');
    ensureChannel(rulesChannel, 'Publish community rules and expectations.');
    ensureChannel('marketplace', 'Place for economy and shop interactions.');

    if (!roles.includes('Citizen')) {
      actions.push({
        agent: this.name,
        action: 'create_role',
        name: 'Citizen',
        color: '#3BA55D',
        reason: 'Base role for community members.'
      });
    }

    const inbox = context.inbox || [];
    inbox.forEach((msg) => {
      if (msg.content?.instruction?.toLowerCase().includes('create')) {
        memory.push({
          type: 'builder_instruction',
          content: msg.content
        });
      }
    });

    const recentMemory = context.recentMemory || [];
    const rulesSeeded = recentMemory.some((row) => row.memory_type === 'rules_seeded');
    if (!rulesSeeded) {
      actions.push({
        agent: this.name,
        action: 'set_rules',
        rules: [
          'Be respectful and constructive.',
          'Keep discussions in the right channels.',
          'No spam or self-promotion without permission.',
          'Help newcomers feel welcome.'
        ]
      });
      memory.push({
        type: 'rules_seeded',
        content: { createdAt: new Date().toISOString() }
      });
    }

    return {
      actions,
      messages,
      memory,
      summary: 'Ensured core channels and roles exist.'
    };
  }
}

module.exports = {
  BuilderAgent
};
