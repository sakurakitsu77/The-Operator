# Discord AI Civilization

This is an experimental multi-agent AI system that treats a Discord server like a living world. Agents plan, coordinate, and propose actions. A hidden permission layer decides what can actually happen.

## Folder Layout
- `agents/` multi-agent behaviors (Overseer, Social, Builder, Economy, Research, Diplomacy)
- `actions/` action middleware + executors
- `discord/` Discord client, observers, and event listeners
- `memory/` SQLite storage and memory utilities
- `core/` orchestration loop, logging, agent manager, LLM adapter
- `config/` config + permissions

## Quick Start
1. Install deps: `npm install`
2. Configure env: copy `.env.example` to `.env` and fill in Discord values.
3. Run: `npm start`

## Permissions
Edit `config/permissions.json` to grant/deny action types. Denied actions are logged so the Diplomacy agent can request access.

## Notes
- Agents only output JSON actions; they never call Discord APIs directly.
- The loop runs every `LOOP_INTERVAL_MINUTES` (default 5).
- LLM integration is stubbed and falls back to deterministic behavior until wired.
