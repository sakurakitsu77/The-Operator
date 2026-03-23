function now() {
  return new Date().toISOString();
}

function adjustBalance(memoryStore, userId, amount, reason) {
  const existing = memoryStore.getUser(userId);
  const data = existing?.data || { balance: 0, history: [] };
  data.balance = (data.balance || 0) + amount;
  data.history = data.history || [];
  data.history.push({
    at: now(),
    amount,
    reason
  });
  memoryStore.upsertUser(userId, data);
}

async function handleEconomyAction({ action, memoryStore }) {
  switch (action.action) {
    case 'create_currency':
      memoryStore.addEconomyRecord({
        type: 'currency',
        data: {
          name: action.name,
          symbol: action.symbol,
          reason: action.reason
        }
      });
      return { ok: true, message: 'Currency created.' };

    case 'create_shop_item':
      memoryStore.addEconomyRecord({
        type: 'shop_item',
        data: {
          name: action.name,
          price: action.price,
          description: action.description
        }
      });
      return { ok: true, message: 'Shop item recorded.' };

    case 'create_job_role':
      memoryStore.addEconomyRecord({
        type: 'job_role',
        data: {
          name: action.name,
          salary: action.salary,
          description: action.description
        }
      });
      return { ok: true, message: 'Job role recorded.' };

    case 'award_currency':
      if (!action.user_id || !action.amount) {
        return { ok: false, message: 'Missing user_id or amount.' };
      }
      adjustBalance(memoryStore, action.user_id, action.amount, action.reason || 'reward');
      memoryStore.addEconomyRecord({
        type: 'award',
        data: {
          userId: action.user_id,
          amount: action.amount,
          reason: action.reason
        }
      });
      return { ok: true, message: 'Currency awarded.' };

    default:
      return { ok: false, message: `Unknown economy action ${action.action}` };
  }
}

module.exports = {
  handleEconomyAction
};
