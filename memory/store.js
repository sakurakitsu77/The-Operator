const { createDb } = require('./db');
const { initTables } = require('./tables');

function now() {
  return new Date().toISOString();
}

function serialize(value) {
  return JSON.stringify(value ?? {});
}

function deserialize(value) {
  try {
    return JSON.parse(value);
  } catch (err) {
    return null;
  }
}

class MemoryStore {
  constructor(dbPath) {
    this.db = createDb(dbPath);
    initTables(this.db);

    this.insertServerState = this.db.prepare(
      'INSERT INTO server_state (created_at, guild_id, data) VALUES (@created_at, @guild_id, @data)'
    );
    this.insertGoal = this.db.prepare(
      'INSERT INTO goals (created_at, status, priority, goal_text, owner_agent) VALUES (@created_at, @status, @priority, @goal_text, @owner_agent)'
    );
    this.countGoalsStmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM goals'
    );
    this.updateGoalStatusStmt = this.db.prepare(
      'UPDATE goals SET status = @status WHERE id = @id'
    );
    this.insertStrategy = this.db.prepare(
      'INSERT INTO strategies (created_at, summary, outcome, score, owner_agent) VALUES (@created_at, @summary, @outcome, @score, @owner_agent)'
    );
    this.insertEvent = this.db.prepare(
      'INSERT INTO events (created_at, event_type, details) VALUES (@created_at, @event_type, @details)'
    );
    this.insertEconomy = this.db.prepare(
      'INSERT INTO economy (created_at, econ_type, data) VALUES (@created_at, @econ_type, @data)'
    );
    this.upsertUser = this.db.prepare(
      'INSERT INTO users (user_id, data) VALUES (@user_id, @data) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data'
    );
    this.fetchUser = this.db.prepare(
      'SELECT * FROM users WHERE user_id = @user_id LIMIT 1'
    );
    this.insertMemoryLog = this.db.prepare(
      'INSERT INTO memory_log (created_at, agent, memory_type, content) VALUES (@created_at, @agent, @memory_type, @content)'
    );
    this.insertAgentMessage = this.db.prepare(
      'INSERT INTO agent_messages (created_at, from_agent, to_agent, content, status) VALUES (@created_at, @from_agent, @to_agent, @content, @status)'
    );
    this.fetchAgentMessages = this.db.prepare(
      'SELECT * FROM agent_messages WHERE to_agent = @to_agent AND status = "new" ORDER BY id ASC LIMIT @limit'
    );
    this.markAgentMessageRead = this.db.prepare(
      'UPDATE agent_messages SET status = "read" WHERE id = @id'
    );
    this.fetchLatestServerState = this.db.prepare(
      'SELECT * FROM server_state WHERE guild_id = @guild_id ORDER BY id DESC LIMIT 1'
    );
    this.fetchRecentMemory = this.db.prepare(
      'SELECT * FROM memory_log WHERE agent = @agent ORDER BY id DESC LIMIT @limit'
    );
  }

  logMemory(agent, memoryType, content) {
    this.insertMemoryLog.run({
      created_at: now(),
      agent,
      memory_type: memoryType,
      content: serialize(content)
    });
  }

  addGoal(goal) {
    this.insertGoal.run({
      created_at: now(),
      status: goal.status ?? 'active',
      priority: goal.priority ?? 3,
      goal_text: goal.text,
      owner_agent: goal.owner ?? 'Overseer'
    });
  }

  getGoalCount() {
    const row = this.countGoalsStmt.get();
    return row?.count ?? 0;
  }

  updateGoalStatus(id, status) {
    this.updateGoalStatusStmt.run({ id, status });
  }

  addStrategy(strategy) {
    this.insertStrategy.run({
      created_at: now(),
      summary: strategy.summary,
      outcome: strategy.outcome ?? null,
      score: strategy.score ?? null,
      owner_agent: strategy.owner ?? 'Overseer'
    });
  }

  addEvent(event) {
    this.insertEvent.run({
      created_at: now(),
      event_type: event.type,
      details: serialize(event.details)
    });
  }

  addEconomyRecord(record) {
    this.insertEconomy.run({
      created_at: now(),
      econ_type: record.type,
      data: serialize(record.data)
    });
  }

  upsertUser(userId, data) {
    this.upsertUser.run({
      user_id: userId,
      data: serialize(data)
    });
  }

  getUser(userId) {
    const row = this.fetchUser.get({ user_id: userId });
    if (!row) return null;
    return {
      ...row,
      data: deserialize(row.data)
    };
  }

  storeServerState(guildId, data) {
    this.insertServerState.run({
      created_at: now(),
      guild_id: guildId,
      data: serialize(data)
    });
  }

  getLatestServerState(guildId) {
    const row = this.fetchLatestServerState.get({ guild_id: guildId });
    if (!row) return null;
    return {
      ...row,
      data: deserialize(row.data)
    };
  }

  addAgentMessage(from, to, content, status = 'new') {
    this.insertAgentMessage.run({
      created_at: now(),
      from_agent: from,
      to_agent: to,
      content: serialize(content),
      status
    });
  }

  getAgentMessages(to, limit = 20) {
    const rows = this.fetchAgentMessages.all({ to_agent: to, limit });
    rows.forEach((row) => this.markAgentMessageRead.run({ id: row.id }));
    return rows.map((row) => ({
      ...row,
      content: deserialize(row.content)
    }));
  }

  getRecentMemory(agent, limit = 20) {
    const rows = this.fetchRecentMemory.all({ agent, limit });
    return rows.map((row) => ({
      ...row,
      content: deserialize(row.content)
    }));
  }
}

module.exports = {
  MemoryStore
};
