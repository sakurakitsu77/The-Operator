const { getGuild } = require('../../discord/client');

async function sendMessage({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  const channelId = action.channel_id;
  const channelName = action.channel;

  let channel = null;
  await guild.channels.fetch();
  if (channelId) {
    channel = await guild.channels.fetch(channelId).catch(() => null);
  }

  if (!channel && channelName) {
    channel = guild.channels.cache.find((ch) => ch.name === channelName) || null;
  }

  if (!channel || !channel.isTextBased()) {
    return { ok: false, message: 'Channel not found or not text-based.' };
  }

  const content = action.content;
  if (!content) {
    return { ok: false, message: 'Missing message content.' };
  }

  await channel.send({ content });
  return { ok: true, message: 'Message sent.', channelId: channel.id };
}

module.exports = {
  sendMessage
};
