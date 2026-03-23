const { getGuild } = require('../../discord/client');

async function requestOwnerPermission({ client, config, action }) {
  const ownerId = config.discord.ownerId;
  if (!ownerId) {
    return { ok: false, message: 'Owner ID not configured.' };
  }

  const permissions = action.permissions || [];
  const reason = action.reason || 'Requesting additional permissions.';
  const message = `Permission request:\n- Permissions: ${permissions.join(', ') || 'unspecified'}\n- Reason: ${reason}`;

  let delivered = false;

  try {
    const ownerUser = await client.users.fetch(ownerId);
    if (ownerUser) {
      await ownerUser.send(message);
      delivered = true;
    }
  } catch (err) {
    delivered = false;
  }

  if (!delivered) {
    const guild = await getGuild(client, config.discord.guildId);
    if (!guild) {
      return { ok: false, message: 'Failed to reach owner and guild not found.' };
    }
    const fallbackChannelName = config.discord.ownerRequestsChannel || 'owner-requests';
    const channel = guild.channels.cache.find((ch) => ch.name === fallbackChannelName && ch.isTextBased());
    if (!channel) {
      return { ok: false, message: 'Owner request channel not found.' };
    }
    await channel.send({ content: message });
  }

  return { ok: true, message: 'Owner permission request delivered.' };
}

module.exports = {
  requestOwnerPermission
};
