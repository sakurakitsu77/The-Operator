const { BaseAgent } = require('./baseAgent');

class SocialAgent extends BaseAgent {
  constructor(opts) {
    super({ ...opts, name: 'Social', role: 'Community' });
  }

  defaultPlan(context) {
    const actions = [];
    const messages = [];
    const memory = [];

    const observation = context.observation;
    const inbox = context.inbox || [];
    const announcementChannel = this.config.discord.announcementChannel || 'announcements';
    const townSquare = 'town-square';

    const memberJoins = inbox.filter((msg) => msg.content?.type === 'member_join');
    if (memberJoins.length > 0) {
      const names = memberJoins.map((msg) => msg.content.username).join(', ');
      actions.push({
        agent: this.name,
        action: 'send_message',
        channel: townSquare,
        content: `Welcome ${names}! Introduce yourselves and tell us what you're excited about.`
      });
      memory.push({
        type: 'welcome',
        content: { count: memberJoins.length, names }
      });
    }

    const mentions = inbox.filter((msg) => msg.content?.type === 'mention');
    const recentMemory = context.recentMemory || [];
    const channels = observation?.channels || [];

    const recentlyReplied = (userId, channelId, intent) => {
      return recentMemory.some((row) => {
        if (row.memory_type !== 'mention_reply') return false;
        if (row.content?.userId !== userId) return false;
        if (row.content?.channelId !== channelId) return false;
        if (row.content?.intent !== intent) return false;
        const createdAt = Date.parse(row.created_at || '');
        return Number.isFinite(createdAt) && (Date.now() - createdAt) < 60 * 1000;
      });
    };

    const hasChannel = (name) => channels.includes(name);

    mentions.forEach((msg) => {
      const userId = msg.content.userId;
      const channelId = msg.content.channelId;
      const text = (msg.content.content || '').toLowerCase();

      const wantsRoles = text.includes('role');
      const wantsChannels = text.includes('channel');
      const wantsStatus = text.includes('what are you doing') || text.includes('status');

      let intent = 'generic';
      if (wantsRoles && wantsChannels) intent = 'roles_channels';
      else if (wantsRoles) intent = 'roles';
      else if (wantsChannels) intent = 'channels';
      else if (wantsStatus) intent = 'status';

      if (recentlyReplied(userId, channelId, intent)) return;

      let reply = `<@${userId}> I'm setting up the server world right now. Tell me what you'd like to see here.`;

      if (intent === 'status') {
        reply = `<@${userId}> I'm building out channels, rules, and the economy. Tell me your top priority and I'll focus on it.`;
      } else if (intent === 'roles') {
        reply = `<@${userId}> I can create roles, but assigning them may require Owner permission. Tell me the role names you want.`;
      } else if (intent === 'channels') {
        reply = `<@${userId}> I can create new channels. Tell me the names you want, or say "starter channels" for introductions and help.`;
      } else if (intent === 'roles_channels') {
        reply = `<@${userId}> I can create roles and channels. Share the role names and channel names you want, and I'll start building.`;
      }

      if (text.includes('starter channels')) {
        const starterChannels = ['introductions', 'help'];
        starterChannels.forEach((name) => {
          if (!hasChannel(name)) {
            actions.push({
              agent: this.name,
              action: 'create_channel',
              name,
              channel_type: 'text',
              reason: 'User requested starter channels.'
            });
          }
        });
      }

      if (wantsRoles && text.includes('assign')) {
        actions.push({
          agent: this.name,
          action: 'assign_role',
          user_id: userId,
          role: 'Citizen',
          reason: 'User requested role assignment.'
        });

        actions.push({
          agent: this.name,
          action: 'request_owner_permission',
          permissions: ['assign_role'],
          reason: 'User requested role assignment.'
        });
      }

      actions.push({
        agent: this.name,
        action: 'send_message',
        channel_id: channelId,
        content: reply
      });

      memory.push({
        type: 'mention_reply',
        content: { userId, channelId, intent }
      });
    });

    if (observation?.memberDelta > 0 && memberJoins.length === 0) {
      actions.push({
        agent: this.name,
        action: 'send_message',
        channel: townSquare,
        content: 'Welcome to all the new arrivals! Jump into #town-square and say hi.'
      });
    }

    const requestedEvent = inbox.find((msg) =>
      (msg.content?.instruction || '').toLowerCase().includes('event')
    );

    if (requestedEvent) {
      const start = new Date(Date.now() + 24 * 60 * 60 * 1000);
      start.setMinutes(0, 0, 0);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      actions.push({
        agent: this.name,
        action: 'create_event',
        name: 'Community Kickoff',
        description: 'Meet the community and share ideas for the server world.',
        scheduled_start_time: start.toISOString(),
        scheduled_end_time: end.toISOString(),
        location: 'Town Square'
      });

      actions.push({
        agent: this.name,
        action: 'send_message',
        channel: announcementChannel,
        content: 'New event planned: Community Kickoff tomorrow. Bring your ideas!'
      });

      memory.push({
        type: 'event_plan',
        content: { name: 'Community Kickoff', start: start.toISOString() }
      });
    }

    return {
      actions,
      messages,
      memory,
      summary: 'Welcomed members and coordinated engagement.'
    };
  }
}

module.exports = {
  SocialAgent
};
