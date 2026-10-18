# Current implementation

The Bean Keeper uses a React/Vite frontend and an Express API. Supabase Auth handles Notion sign-in; the backend validates Bearer tokens and persists each user's Notion connection. Coffee entries are stored in Notion and mirrored to Supabase for sync and analytics.

See [CLAUDE.md](CLAUDE.md) for the current architecture, [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for setup, and [DEPLOYMENT.md](DEPLOYMENT.md) for release steps. Earlier implementation details are retained in Git history.
