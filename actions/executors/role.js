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

async function findRole(guild, action) {
  await guild.roles.fetch();
  if (action.role_id) {
    return guild.roles.cache.get(action.role_id) || null;
  }
  const name = action.role || action.name;
  if (!name) return null;
  return guild.roles.cache.find((r) => r.name === name) || null;
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

  await guild.members.fetch();

  const role = await findRole(guild, { role: roleName });
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

async function removeRole({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  const userId = action.user_id;
  const roleName = action.role;
  if (!userId || !roleName) {
    return { ok: false, message: 'Missing user_id or role.' };
  }

  await guild.members.fetch();
  const role = await findRole(guild, { role: roleName });
  if (!role) {
    return { ok: false, message: `Role not found: ${roleName}` };
  }

  const member = await guild.members.fetch(userId).catch(() => null);
  if (!member) {
    return { ok: false, message: 'Member not found.' };
  }

  if (!member.roles.cache.has(role.id)) {
    return { ok: true, message: 'Member does not have role.', roleId: role.id };
  }

  await member.roles.remove(role, action.reason || 'AI request');
  return { ok: true, message: 'Role removed.', roleId: role.id, userId };
}

async function modifyRole({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  const role = await findRole(guild, action);
  if (!role) {
    return { ok: false, message: 'Role not found.' };
  }

  const patch = {};
  if (action.new_name) patch.name = action.new_name;
  if (action.color) patch.color = action.color;
  if (action.permissions) patch.permissions = action.permissions;
  if (typeof action.hoist === 'boolean') patch.hoist = action.hoist;
  if (typeof action.mentionable === 'boolean') patch.mentionable = action.mentionable;

  const updated = await role.edit(patch, action.reason || 'AI request');
  return { ok: true, message: 'Role updated.', roleId: updated.id };
}

async function deleteRole({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  const role = await findRole(guild, action);
  if (!role) {
    return { ok: false, message: 'Role not found.' };
  }

  await role.delete(action.reason || 'AI request');
  return { ok: true, message: 'Role deleted.', roleId: role.id };
}

module.exports = {
  createRole,
  assignRole,
  removeRole,
  modifyRole,
  deleteRole
};
