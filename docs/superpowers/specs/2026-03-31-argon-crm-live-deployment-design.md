# argon-crm-live Deployment Design

**Date:** 2026-03-31
**Status:** Approved

## Summary

Deploy a second instance of argon-crm to Vercel with URL `argon-crm-live.vercel.app`. This instance has autoscrap enabled (no demo mode) and uses its own fresh Turso database. No code changes required — deployment is differentiated entirely by environment variables.

## Requirements

1. Own Vercel URL containing "live" (e.g., `argon-crm-live.vercel.app`)
2. Autoscrap feature active (`NEXT_PUBLIC_DEMO_MODE` not set)
3. Fresh Turso database (no shared data with existing deployment)
4. Same Gmail credentials (post@argon.no) and Anthropic API key as existing deployment
5. Vercel cron jobs active (follow-up emails at 8 AM weekdays)

## Architecture

```
Same GitHub repo: argon-crm
                    │
        ┌───────────┴───────────┐
        │                       │
  Vercel: argon-crm        Vercel: argon-crm-live
  (demo mode ON)            (demo mode OFF)
        │                       │
  Turso: gyssa-gyssa        Turso: argon-crm-live
  (existing DB)             (fresh DB)
        │                       │
        └───────────┬───────────┘
                    │
          Shared credentials:
          - Gmail (post@argon.no)
          - Anthropic API key
```

Both deployments build from the same branch (master). Pushing code updates both.

## Infrastructure Steps

### 1. Install Turso CLI

```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

### 2. Create Turso Database

```bash
turso db create argon-crm-live --group default
```

Region: auto-selected (eu-west preferred for Norway).

### 3. Generate Auth Token

```bash
turso db tokens create argon-crm-live
```

Save the URL and token for Vercel env vars.

### 4. Push Schema

From the argon-crm directory, run drizzle-kit push against the new database:

```bash
TURSO_DATABASE_URL=<new-url> TURSO_AUTH_TOKEN=<new-token> npx drizzle-kit push
```

This creates all tables: leads, activities, scrapeJobs, searchCache, emailThreads, pendingFollowups, products, quotes, quoteItems.

### 5. Create Vercel Project

```bash
cd argon-crm
vercel link  # Link to new project "argon-crm-live"
```

Or via Vercel dashboard: create project `argon-crm-live` connected to the same GitHub repo.

### 6. Set Environment Variables

| Variable | Value | Source |
|----------|-------|--------|
| `TURSO_DATABASE_URL` | New Turso URL | Step 3 |
| `TURSO_AUTH_TOKEN` | New Turso token | Step 3 |
| `GMAIL_CLIENT_ID` | Same as existing | Copy from argon-crm |
| `GMAIL_CLIENT_SECRET` | Same as existing | Copy from argon-crm |
| `GMAIL_REFRESH_TOKEN` | Same as existing | Copy from argon-crm |
| `ANTHROPIC_API_KEY` | Same as existing | Copy from argon-crm |
| `CRON_SECRET` | New unique value | Generate new |

**Not set:** `NEXT_PUBLIC_DEMO_MODE` — absence means autoscrap is active.

### 7. Deploy

```bash
vercel --prod
```

Or trigger via GitHub push (automatic if Vercel Git integration is configured).

## Verification

After deployment, verify:

1. App loads at `argon-crm-live.vercel.app`
2. `/scrape-leads` page shows active scrape form (not disabled)
3. Database is empty (fresh start)
4. Cron endpoint responds at `/api/cron/followup` with auth header

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Shared Gmail credentials — both instances send from same email | Acceptable: user wants this. Both sign as post@argon.no |
| Both cron jobs fire at same time (8 AM) | Each targets its own DB, no conflict |
| Accidental push breaks both deployments | Standard risk with shared repo; use preview deployments for testing |

## Out of Scope

- Custom domain (can be added later via Vercel dashboard)
- Separate Gmail account
- Code changes or feature differences between deployments
