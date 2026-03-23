const { ChannelType } = require('discord.js');
const { getGuild } = require('../../discord/client');

async function createChannel({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  const name = action.name;
  if (!name) {
    return { ok: false, message: 'Missing channel name.' };
  }

  await guild.channels.fetch();
  const existing = guild.channels.cache.find((channel) => channel.name === name);
  if (existing) {
    return { ok: true, message: 'Channel already exists.', channelId: existing.id };
  }

  const type = action.channel_type === 'category'
    ? ChannelType.GuildCategory
    : ChannelType.GuildText;

  const channel = await guild.channels.create({
    name,
    type,
    reason: action.reason || 'AI request'
  });

  return { ok: true, message: 'Channel created.', channelId: channel.id };
}

module.exports = {
  createChannel
};
