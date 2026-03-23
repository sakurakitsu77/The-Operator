const { Client, GatewayIntentBits, Partials } = require('discord.js');

function createDiscordClient() {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildScheduledEvents,
      GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
  });
}

async function getGuild(client, guildId) {
  if (!guildId) return null;
  const cached = client.guilds.cache.get(guildId);
  if (cached) return cached;
  try {
    return await client.guilds.fetch(guildId);
  } catch (err) {
    return null;
  }
}

module.exports = {
  createDiscordClient,
  getGuild
};
