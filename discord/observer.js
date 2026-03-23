const { getGuild } = require('./client');

function now() {
  return new Date().toISOString();
}

async function observeServer(client, config, memoryStore) {
  const guildId = config.discord.guildId;
  if (!guildId) {
    return { status: 'missing_guild_id', timestamp: now() };
  }

  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { status: 'guild_not_found', guildId, timestamp: now() };
  }

  await guild.channels.fetch();
  await guild.roles.fetch();

  const channels = guild.channels.cache
    .filter((channel) => channel.isTextBased())
    .map((channel) => channel.name);
  const roles = guild.roles.cache.map((role) => role.name);

  const memberCount = guild.memberCount;
  const lastState = memoryStore.getLatestServerState(guildId);
  const lastMemberCount = lastState?.data?.memberCount ?? null;
  const memberDelta = lastMemberCount === null ? 0 : memberCount - lastMemberCount;

  return {
    status: 'ok',
    guildId,
    memberCount,
    channelCount: channels.length,
    roleCount: roles.length,
    channels,
    roles,
    memberDelta,
    timestamp: now()
  };
}

module.exports = {
  observeServer
};
