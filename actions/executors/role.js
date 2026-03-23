const { getGuild } = require('../../discord/client');

async function createRole({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  const name = action.name;
  if (!name) {
    return { ok: false, message: 'Missing role name.' };
  }

  await guild.roles.fetch();
  const existing = guild.roles.cache.find((role) => role.name === name);
  if (existing) {
    return { ok: true, message: 'Role already exists.', roleId: existing.id };
  }

  const role = await guild.roles.create({
    name,
    color: action.color || null,
    reason: action.reason || 'AI request'
  });

  return { ok: true, message: 'Role created.', roleId: role.id };
}

module.exports = {
  createRole
};
