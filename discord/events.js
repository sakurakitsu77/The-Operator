const { log } = require('../core/logger');

function registerDiscordEvents(client, memoryStore) {
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
    memoryStore.addEvent({
      type: 'message',
      details: {
        userId: message.author.id,
        channelId: message.channel.id,
        length: message.content.length,
        createdAt: message.createdAt.toISOString()
      }
    });
  });
}

module.exports = {
  registerDiscordEvents
};
