const { BaseAgent } = require('./baseAgent');

class OverseerAgent extends BaseAgent {
  constructor(opts) {
    super({ ...opts, name: 'Overseer', role: 'Planner' });
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
    const hasTownSquare = channels.includes('town-square');
    const hasAnnouncements = channels.includes(this.config.discord.announcementChannel || 'announcements');
    const hasRules = channels.includes(this.config.discord.rulesChannel || 'rules');

    if (!hasTownSquare) {
      messages.push({
        to: 'Builder',
        content: {
          instruction: 'Create a central social hub channel named town-square.'
        }
      });
    }

    if (!hasAnnouncements) {
      messages.push({
        to: 'Builder',
        content: {
          instruction: 'Create an announcements channel for broadcasts.'
        }
      });
    }

    if (!hasRules) {
      messages.push({
        to: 'Builder',
        content: {
          instruction: 'Create a rules channel so we can post server guidelines.'
        }
      });
    }

    if (this.memory.getGoalCount() === 0) {
      this.memory.addGoal({
        text: 'Grow this Discord server into an active and structured community.',
        priority: 1,
        owner: this.name
      });
    }

    if (observation.memberCount < 20) {
      messages.push({
        to: 'Research',
        content: {
          instruction: 'Propose 3 growth experiments to increase member count.'
        }
      });
    }

    if (observation.memberCount >= 20 && observation.memberCount < 100) {
      messages.push({
        to: 'Social',
        content: {
          instruction: 'Plan a weekly community event to boost engagement.'
        }
      });
    }

    memory.push({
      type: 'goal_update',
      content: {
        mainGoal: 'Grow this Discord server into an active and structured community.',
        subGoals: [
          'Increase member count',
          'Increase daily activity',
          'Create social structure',
          'Create economy',
          'Create events',
          'Retain members'
        ]
      }
    });

    return {
      actions,
      messages,
      memory,
      summary: 'Issued strategic orders based on current server state.'
    };
  }
}

module.exports = {
  OverseerAgent
};
