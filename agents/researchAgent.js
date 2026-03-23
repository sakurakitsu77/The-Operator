const { BaseAgent } = require('./baseAgent');

class ResearchAgent extends BaseAgent {
  constructor(opts) {
    super({ ...opts, name: 'Research', role: 'Research' });
  }

  defaultPlan(context) {
    const actions = [];
    const messages = [];
    const memory = [];

    const ideas = [
      'Run a weekly themed event (e.g., build-a-world night) to increase retention.',
      'Create a referral reward: invite a friend and earn CivCoin.',
      'Publish a newcomer questline to help members find roles and channels.'
    ];

    messages.push({
      to: 'Overseer',
      content: {
        report: 'Growth experiment ideas',
        ideas
      }
    });

    memory.push({
      type: 'research_report',
      content: { ideas }
    });

    return {
      actions,
      messages,
      memory,
      summary: 'Shared growth experiments with Overseer.'
    };
  }
}

module.exports = {
  ResearchAgent
};
