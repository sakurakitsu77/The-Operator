const { loadConfig } = require('./config');
const { MemoryStore } = require('./memory/store');
const { createDiscordClient } = require('./discord/client');
const { registerDiscordEvents } = require('./discord/events');
const { AgentManager } = require('./core/agentManager');
const { LLMClient } = require('./core/llm');
const { createLoop } = require('./core/loop');
const { log, warn } = require('./core/logger');

async function start() {
  const config = loadConfig();

  if (!config.discord.token) {
    warn('Missing DISCORD_TOKEN. Set it in .env before running.');
    process.exit(1);
  }

  const memoryStore = new MemoryStore(config.db.path || 'memory/ai_civ.db');
  const client = createDiscordClient();
  const llm = new LLMClient(config);
  const agentManager = new AgentManager({ memoryStore, llm, config });

  registerDiscordEvents(client, memoryStore);

  client.once('ready', () => {
    log(`Logged in as ${client.user.tag}`);
    const loop = createLoop({ client, config, memoryStore, agentManager });
    loop.start();
  });

  client.on('error', (err) => {
    warn('Discord client error', err);
  });

  await client.login(config.discord.token);
}

start().catch((err) => {
  console.error('Fatal startup error', err);
  process.exit(1);
});
