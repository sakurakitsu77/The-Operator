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

async function assignRole({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  const userId = action.user_id;
  const roleName = action.role;
  if (!userId || !roleName) {
    return { ok: false, message: 'Missing user_id or role.' };
  }

  await guild.roles.fetch();
  await guild.members.fetch();

  const role = guild.roles.cache.find((r) => r.name === roleName) || null;
  if (!role) {
    return { ok: false, message: `Role not found: ${roleName}` };
  }

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) {
    return { ok: false, message: 'Member not found.' };
  }

  if (member.roles.cache.has(role.id)) {
    return { ok: true, message: 'Member already has role.', roleId: role.id };
  }

  await member.roles.add(role, action.reason || 'AI request');
  return { ok: true, message: 'Role assigned.', roleId: role.id, userId };
}

module.exports = {
  createRole,
  assignRole
};
