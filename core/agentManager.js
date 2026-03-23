const { OverseerAgent } = require('../agents/overseerAgent');
const { SocialAgent } = require('../agents/socialAgent');
const { BuilderAgent } = require('../agents/builderAgent');
const { EconomyAgent } = require('../agents/economyAgent');
const { ResearchAgent } = require('../agents/researchAgent');
const { DiplomacyAgent } = require('../agents/diplomacyAgent');

class AgentManager {
  constructor({ memoryStore, llm, config }) {
    this.agents = [
      new OverseerAgent({ memoryStore, llm, config }),
      new ResearchAgent({ memoryStore, llm, config }),
      new SocialAgent({ memoryStore, llm, config }),
      new BuilderAgent({ memoryStore, llm, config }),
      new EconomyAgent({ memoryStore, llm, config }),
      new DiplomacyAgent({ memoryStore, llm, config })
    ];
  }

  async runCycle(context) {
    const allActions = [];
    for (const agent of this.agents) {
      const actions = await agent.runCycle(context);
      allActions.push(...actions);
    }
    return allActions;
  }
}

module.exports = {
  AgentManager
};
