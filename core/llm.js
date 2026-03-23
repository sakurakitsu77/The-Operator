const { warn } = require('./logger');

class LLMClient {
  constructor(config) {
    this.provider = config?.llm?.provider || 'none';
    this.config = config?.llm || {};
    this.defaultOpenRouterModel = 'qwen/qwen3-next-80b-a3b-instruct:free';

    const usage = this.config?.usage || {};
    this.usage = {
      maxCallsPerTick: Number(usage.maxCallsPerTick || 2),
      cooldownMinutes: Number(usage.cooldownMinutes || 10),
      cooldownMinutesOn402: Number(usage.cooldownMinutesOn402 || 60),
      allowedAgents: usage.allowedAgents || null
    };

    this.currentTickId = null;
    this.callsThisTick = 0;
    this.cooldownUntil = 0;
  }

  async generate(agent, context) {
    if (!this.provider || this.provider === 'none') {
      return agent.defaultPlan(context);
    }

    const provider = this.provider.toLowerCase();
    if (provider === 'openrouter' && this.config.openrouter?.apiKey) {
      if (!this.shouldUseLLM(agent, context)) {
        return agent.defaultPlan(context);
      }
      return this.generateOpenRouter(agent, context);
    }

    warn('LLM provider missing credentials or unsupported; using default plan for', agent.name);
    return agent.defaultPlan(context);
  }

  shouldUseLLM(agent, context) {
    const tickId = context?.tickId ?? null;
    if (tickId !== this.currentTickId) {
      this.currentTickId = tickId;
      this.callsThisTick = 0;
    }

    if (this.usage.allowedAgents && !this.usage.allowedAgents.includes(agent.name)) {
      return false;
    }

    const now = Date.now();
    if (this.cooldownUntil && now < this.cooldownUntil) {
      return false;
    }

    if (this.callsThisTick >= this.usage.maxCallsPerTick) {
      return false;
    }

    this.callsThisTick += 1;
    return true;
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
      `You are ${agent.name} (${agent.role}) running a Discord community.`,
      'Goal: make a thriving, structured server. Take initiative and be creative.',
      'Minimize questions; make reasonable assumptions and act.',
      'Return STRICT JSON: { actions, messages, memory, summary }.',
      'actions items must include { agent, action } plus needed fields.',
      'Allowed actions: create_channel, modify_channel, delete_channel, create_role, modify_role, delete_role, assign_role, remove_role, send_message, create_event, set_rules, create_invite, create_shop_item, create_job_role, award_currency, create_currency, request_owner_permission.'
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
    const resolvedModel = model || this.defaultOpenRouterModel;

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
          model: resolvedModel,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0.4
        })
      });

      if (!response.ok) {
        this.applyCooldown(response.status);
        warn('OpenRouter response not ok', response.status);
        return agent.defaultPlan(context);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content || '';
      this.resetCooldown();
      return this.parseModelOutput(content, agent, context);
    } catch (err) {
      this.applyCooldown();
      warn('OpenRouter call failed; using default plan for', agent.name);
      return agent.defaultPlan(context);
    }
  }

  applyCooldown(status) {
    const now = Date.now();
    let minutes = this.usage.cooldownMinutes;
    if (status === 402) {
      minutes = this.usage.cooldownMinutesOn402;
    }
    if (status === 429) {
      minutes = this.usage.cooldownMinutes;
    }
    const nextCooldown = now + minutes * 60 * 1000;
    this.cooldownUntil = Math.max(this.cooldownUntil, nextCooldown);
  }

  resetCooldown() {
    this.cooldownUntil = 0;
  }
}

module.exports = {
  LLMClient
};
