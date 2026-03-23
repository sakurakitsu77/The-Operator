const { log } = require('../core/logger');

class BaseAgent {
  constructor({ name, role, memoryStore, llm, config }) {
    this.name = name;
    this.role = role;
    this.memory = memoryStore;
    this.llm = llm;
    this.config = config;
  }

  async runCycle(context) {
    const inbox = this.memory.getAgentMessages(this.name, 50);
    const recentMemory = this.memory.getRecentMemory(this.name, 20);

    const agentContext = {
      ...context,
      inbox,
      recentMemory,
      agent: {
        name: this.name,
        role: this.role
      }
    };

    const result = await this.decide(agentContext);
    const actions = result?.actions ?? [];
    const messages = result?.messages ?? [];
    const memoryNotes = result?.memory ?? [];

    memoryNotes.forEach((note) => {
      this.memory.logMemory(this.name, note.type ?? 'note', note.content ?? note);
    });

    messages.forEach((msg) => {
      this.memory.addAgentMessage(this.name, msg.to, msg.content);
    });

    this.memory.logMemory(this.name, 'cycle', {
      actions,
      messages,
      summary: result?.summary ?? ''
    });

    log(`[Agent:${this.name}] produced ${actions.length} actions, ${messages.length} messages.`);
    return actions;
  }

  async decide(context) {
    return this.llm.generate(this, context);
  }

  defaultPlan() {
    return { actions: [], messages: [], memory: [], summary: 'No-op default plan.' };
  }
}

module.exports = {
  BaseAgent
};
