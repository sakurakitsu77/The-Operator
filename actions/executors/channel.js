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

async function findChannel(guild, action) {
  await guild.channels.fetch();
  if (action.channel_id) {
    return guild.channels.cache.get(action.channel_id) || null;
  }
  const targetName = action.channel || action.name;
  if (!targetName) return null;
  return guild.channels.cache.find((channel) => channel.name === targetName) || null;
}

async function modifyChannel({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  const channel = await findChannel(guild, action);
  if (!channel) {
    return { ok: false, message: 'Channel not found.' };
  }

  const patch = {};
  if (action.new_name) patch.name = action.new_name;
  if (typeof action.topic === 'string') patch.topic = action.topic;
  if (typeof action.nsfw === 'boolean') patch.nsfw = action.nsfw;
  if (typeof action.rate_limit_per_user === 'number') {
    patch.rateLimitPerUser = action.rate_limit_per_user;
  }
  if (typeof action.position === 'number') patch.position = action.position;

  if (action.parent_id || action.parent) {
    const parent = action.parent_id
      ? guild.channels.cache.get(action.parent_id)
      : guild.channels.cache.find((ch) => ch.name === action.parent);
    if (parent) patch.parent = parent.id;
  }

  const updated = await channel.edit(patch, action.reason || 'AI request');
  return { ok: true, message: 'Channel updated.', channelId: updated.id };
}

async function deleteChannel({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  const channel = await findChannel(guild, action);
  if (!channel) {
    return { ok: false, message: 'Channel not found.' };
  }

  await channel.delete(action.reason || 'AI request');
  return { ok: true, message: 'Channel deleted.', channelId: channel.id };
}

module.exports = {
  createChannel,
  modifyChannel,
  deleteChannel
};
