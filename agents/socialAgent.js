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
