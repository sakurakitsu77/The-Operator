# Discord AI Civilization

This is an experimental multi-agent AI system that treats a Discord server like a living world. Agents plan, coordinate, and propose actions. A hidden permission layer decides what can actually happen.

## Folder Layout
- `agents/` multi-agent behaviors (Overseer, Social, Builder, Economy, Research, Diplomacy)
- `actions/` action middleware + executors
- `discord/` Discord client, observers, and event listeners
- `memory/` SQLite storage and memory utilities
- `core/` orchestration loop, logging, agent manager, LLM adapter
- `config/` config + permissions

## Local Run
1. Install deps: `npm install`
2. Export the required env vars in your shell (see Railway section for the list).
3. Run: `npm start`

## Railway Deploy
This repo includes `railway.json` with a `npm start` deploy command.

Required environment variables to set in Railway:
- `DISCORD_TOKEN`
- `DISCORD_GUILD_ID`
- `DISCORD_OWNER_ID`
- `LLM_PROVIDER` (use `openrouter`)
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (use `qwen/qwen3-next-80b-a3b-instruct:free`)
- `OPENROUTER_SITE` (optional)
- `OPENROUTER_APP` (optional)
- `LLM_MAX_CALLS_PER_TICK` (optional, default 2)
- `LLM_COOLDOWN_MINUTES` (optional, default 10)
- `LLM_COOLDOWN_MINUTES_402` (optional, default 60)
- `LLM_ALLOWED_AGENTS` (optional, comma-separated list)
- `LOOP_INTERVAL_MINUTES` (optional, default 5)
- `ANNOUNCEMENTS_CHANNEL` (optional)
- `RULES_CHANNEL` (optional)
- `OWNER_REQUESTS_CHANNEL` (optional)
- `DB_PATH` (optional, default `memory/ai_civ.db`)
- `PERMISSIONS_ALLOW_ALL` (optional, `true` to bypass internal action checks)

Note: SQLite data is stored on disk. For persistent memory across deploys, attach a Railway Volume and point `DB_PATH` at that mount.

## Permissions
Edit `config/permissions.json` to grant/deny action types. Denied actions are logged so the Diplomacy agent can request access.

## Notes
- Agents only output JSON actions; they never call Discord APIs directly.
- The loop runs every `LOOP_INTERVAL_MINUTES` (default 5).
- LLM integration uses OpenRouter; if credentials are missing, it falls back to deterministic behavior.
