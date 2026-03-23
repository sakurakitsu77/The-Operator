const { GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel } = require('discord.js');
const { getGuild } = require('../../discord/client');

async function createEvent({ client, guildId, action }) {
  const guild = await getGuild(client, guildId);
  if (!guild) {
    return { ok: false, message: 'Guild not found.' };
  }

  const name = action.name;
  const description = action.description || '';
  const startTime = action.scheduled_start_time;
  const endTime = action.scheduled_end_time;

  if (!name || !startTime || !endTime) {
    return { ok: false, message: 'Missing event name or schedule times.' };
  }

  const event = await guild.scheduledEvents.create({
    name,
    description,
    scheduledStartTime: new Date(startTime),
    scheduledEndTime: new Date(endTime),
    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
    entityType: GuildScheduledEventEntityType.External,
    entityMetadata: {
      location: action.location || 'Discord'
    }
  });

  return { ok: true, message: 'Event created.', eventId: event.id };
}

module.exports = {
  createEvent
};
