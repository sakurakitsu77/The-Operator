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
    if (provider === 'openrouter' && this.config.openrouter?.apiKey) {
      return this.generateOpenRouter(agent, context);
    }

    warn('LLM provider missing credentials or unsupported; using default plan for', agent.name);
    return agent.defaultPlan(context);
  }

  buildPrompt(agent, context) {
    const compactContext = {
      agent: { name: agent.name, role: agent.role },
      observation: context.observation || null,
      inbox: (context.inbox || []).slice(0, 10),
      recentMemory: (context.recentMemory || []).slice(0, 10).map((row) => ({
        memory_type: row.memory_type,
        content: row.content
      })),
      lastActionResults: (context.lastActionResults || []).slice(0, 10),
      timestamp: context.timestamp
    };

    const system = [
      `You are the ${agent.name} agent (${agent.role}) in a multi-agent Discord simulation.`,
      'You do not execute Discord actions directly. You only output JSON action requests.',
      'Return STRICT JSON with keys: actions, messages, memory, summary.',
      'actions: array of objects. Each action MUST include { agent, action } and any fields needed.',
      'messages: array of { to, content } for inter-agent messages.',
      'memory: array of { type, content } entries for logging.',
      'summary: short string.',
      'Allowed action types: create_channel, create_role, send_message, create_event, set_rules, create_shop_item, create_job_role, award_currency, create_currency, request_owner_permission.',
      'If no action is needed, return empty arrays.'
    ].join(' ');

    const user = `Context:\n${JSON.stringify(compactContext, null, 2)}`;

    return { system, user };
  }

  parseModelOutput(raw, agent, context) {
    if (!raw) return agent.defaultPlan(context);
    let jsonText = raw.trim();
    if (!jsonText.startsWith('{')) {
      const first = jsonText.indexOf('{');
      const last = jsonText.lastIndexOf('}');
      if (first !== -1 && last !== -1) {
        jsonText = jsonText.slice(first, last + 1);
      }
    }

    try {
      const parsed = JSON.parse(jsonText);
      return {
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        memory: Array.isArray(parsed.memory) ? parsed.memory : [],
        summary: typeof parsed.summary === 'string' ? parsed.summary : ''
      };
    } catch (err) {
      warn('Failed to parse LLM JSON output; using default plan for', agent.name);
      return agent.defaultPlan(context);
    }
  }

  async generateOpenRouter(agent, context) {
    if (typeof fetch !== 'function') {
      warn('Global fetch is unavailable; using default plan for', agent.name);
      return agent.defaultPlan(context);
    }

    const { system, user } = this.buildPrompt(agent, context);
    const { apiKey, model, site, appName } = this.config.openrouter;

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          ...(site ? { 'HTTP-Referer': site } : {}),
          ...(appName ? { 'X-Title': appName } : {})
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0.4
        })
      });

      if (!response.ok) {
        warn('OpenRouter response not ok', response.status);
        return agent.defaultPlan(context);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      return this.parseModelOutput(content, agent, context);
    } catch (err) {
      warn('OpenRouter call failed; using default plan for', agent.name);
      return agent.defaultPlan(context);
    }
  }
}

module.exports = {
  LLMClient
};
