const { log } = require('../core/logger');

function registerDiscordEvents(client, memoryStore, loopTrigger) {
  client.on('guildMemberAdd', (member) => {
    memoryStore.addEvent({
      type: 'member_join',
      details: {
        userId: member.user.id,
        username: member.user.username,
        joinedAt: member.joinedAt?.toISOString() ?? null
      }
    });
    memoryStore.addAgentMessage('System', 'Social', {
      type: 'member_join',
      userId: member.user.id,
      username: member.user.username
    });
    log(`Member joined: ${member.user.username}`);
  });

  client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    const isMention = client.user ? message.mentions.has(client.user) : false;
    memoryStore.addEvent({
      type: 'message',
      details: {
        userId: message.author.id,
        channelId: message.channel.id,
        content: message.content,
        mentionedBot: isMention,
        length: message.content.length,
        createdAt: message.createdAt.toISOString()
      }
    });

    if (isMention) {
      memoryStore.addAgentMessage('System', 'Social', {
        type: 'mention',
        userId: message.author.id,
        username: message.author.username,
        channelId: message.channel.id,
        content: message.content
      });

      if (typeof loopTrigger === 'function') {
        loopTrigger('mention');
      }
    }
  });
}

module.exports = {
  registerDiscordEvents
};
