# Database migrations

This directory holds the SQL migrations for the ReEarth demo's Supabase Postgres database. Each migration is a `.sql` file applied in lexical order.

## Naming convention

```
NNN_short_descriptive_name.sql
```

- `NNN` is a three-digit zero-padded sequence number (`001`, `002`, ...)
- `short_descriptive_name` is snake_case and describes the *intent*, not the mechanism
- Examples: `001_core_schema.sql`, `002_seed_helpers.sql`, `003_wave2_review_queues.sql`

The three-digit prefix preserves ordering up to migration 999 — well past anything the demo will need.

## Forward-only — no down migrations

We do not write `down.sql` files. If a migration is wrong, fix it forward with a new migration (e.g. `00X_fix_Y.sql`).

Reasons:
- The demo has no real data; reapplying from scratch is faster than a clean rollback
- Supabase free tier ships point-in-time restore (7 days) for any "I broke prod" scenario
- Well-tested down migrations are significant effort and provide little value at demo scale

## Tooling — Supabase CLI in cloud-only mode

The official Supabase CLI is the canonical way to author and apply migrations.

### Install (one-time, on the architect's machine)

```bash
npm install -g supabase
supabase --version
```

We deliberately skip Docker. The CLI's local development DB feature requires Docker; we don't need a local DB because we apply migrations directly against the cloud project. This matters because Docker on Windows is heavy and the architect doesn't have it installed.

### Link the CLI to the cloud project (one-time)

```bash
supabase login
supabase link --project-ref cbhaksjsudixpcbyjdys
```

`cbhaksjsudixpcbyjdys` is the project ref from `https://cbhaksjsudixpcbyjdys.supabase.co`.

### Apply migrations (every time a new file lands)

```bash
supabase db push
```

This pushes every unapplied migration in this directory to the linked cloud project, in order. The CLI tracks applied versions in the `supabase_migrations.schema_migrations` table.

### Generate TypeScript types after schema changes

```bash
supabase gen types typescript --linked > web/lib/db/types.ts
```

Run this after every successful `db push`. The generated `types.ts` is checked in; it's the contract that `web/lib/db/` callers depend on.

## Workflow rules

1. **Never auto-apply migrations on push.** Per CLAUDE.md, deployments don't apply migrations. The architect runs `supabase db push` manually after reviewing the SQL.
2. **Migrations are committed to git.** Source of truth is this directory, not the running database.
3. **Don't edit a migration after it has been applied.** Add a new one to fix it.
4. **Coordinate.** Single-developer demo, but if that ever changes: pull before authoring a new migration to avoid number collisions.
