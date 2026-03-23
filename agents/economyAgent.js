const { BaseAgent } = require('./baseAgent');

class EconomyAgent extends BaseAgent {
  constructor(opts) {
    super({ ...opts, name: 'Economy', role: 'Economy' });
  }

  defaultPlan(context) {
    const actions = [];
    const messages = [];
    const memory = [];

    const recentMemory = context.recentMemory || [];
    const hasEconomyInit = recentMemory.some((row) => row.memory_type === 'economy_init');

    if (!hasEconomyInit) {
      actions.push({
        agent: this.name,
        action: 'create_currency',
        name: 'CivCoin',
        symbol: 'CC',
        reason: 'Establish a base currency for the server economy.'
      });

      actions.push({
        agent: this.name,
        action: 'create_shop_item',
        name: 'Town Banner',
        price: 25,
        description: 'A collectible banner for active citizens.'
      });

      actions.push({
        agent: this.name,
        action: 'create_job_role',
        name: 'Greeter',
        salary: 5,
        description: 'Welcome new members and earn CivCoin.'
      });

      memory.push({
        type: 'economy_init',
        content: { currency: 'CivCoin', symbol: 'CC' }
      });
    }

    return {
      actions,
      messages,
      memory,
      summary: 'Initialized economy scaffolding.'
    };
  }
}

module.exports = {
  EconomyAgent
};
