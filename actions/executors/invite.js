const { getGuild } = require('../../discord/client');

async function createInvite({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  await guild.channels.fetch();
  let channel = null;
  if (action.channel_id) {
    channel = guild.channels.cache.get(action.channel_id) || null;
  }
  if (!channel && action.channel) {
    channel = guild.channels.cache.find((ch) => ch.name === action.channel) || null;
  }

  if (!channel) {
    return { ok: false, message: 'Channel not found.' };
  }

  const options = {};
  if (typeof action.max_age === 'number') options.maxAge = action.max_age;
  if (typeof action.max_uses === 'number') options.maxUses = action.max_uses;
  if (typeof action.temporary === 'boolean') options.temporary = action.temporary;
  if (typeof action.unique === 'boolean') options.unique = action.unique;
  if (action.reason) options.reason = action.reason;

  const invite = await channel.createInvite(options);
  return { ok: true, message: 'Invite created.', code: invite.code, url: invite.url };
}

module.exports = {
  createInvite
};
