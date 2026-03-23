const { observeServer } = require('../discord/observer');
const { log, warn } = require('./logger');
const { processActions } = require('../actions/actionMiddleware');

function createLoop({ client, config, memoryStore, agentManager }) {
  let running = false;
  let lastActionResults = [];

  async function tick() {
    if (running) return;
    running = true;

    try {
      const observation = await observeServer(client, config, memoryStore);
      if (observation.status === 'ok') {
        memoryStore.storeServerState(observation.guildId, observation);
      }

      const context = {
        observation,
        lastActionResults,
        timestamp: new Date().toISOString()
      };

      const actions = await agentManager.runCycle(context);
      const results = await processActions(actions, { client, config, memoryStore });
      lastActionResults = results;

      log(`Loop tick complete. Actions: ${actions.length}, Results: ${results.length}`);
    } catch (err) {
      warn('Loop tick error', err);
    } finally {
      running = false;
    }
  }

  function start() {
    const intervalMs = Math.max(1, config.loop.intervalMinutes || 5) * 60 * 1000;
    log(`Starting loop every ${intervalMs / 60000} minutes.`);
    tick();
    setInterval(tick, intervalMs);
  }

  return { start };
}

module.exports = {
  createLoop
};
