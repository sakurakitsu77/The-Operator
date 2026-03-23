const { warn } = require('./logger');

class LLMClient {
  constructor(config) {
    this.provider = config?.llm?.provider || 'none';
    this.config = config?.llm || {};
  }

  async generate(agent, context) {
    if (!this.provider || this.provider === 'none') {
      return agent.defaultPlan(context);
    }

    const provider = this.provider.toLowerCase();
    if (provider === 'openai' && this.config.openai?.apiKey) {
      warn('LLM provider not wired yet; using default plan for', agent.name);
      return agent.defaultPlan(context);
    }

    if (provider === 'gemini' && this.config.gemini?.apiKey) {
      warn('LLM provider not wired yet; using default plan for', agent.name);
      return agent.defaultPlan(context);
    }

    warn('LLM provider missing credentials; using default plan for', agent.name);
    return agent.defaultPlan(context);
  }
}

module.exports = {
  LLMClient
};
