// =============================================================================
// supabase/seed/apply-migrations.ts
//
// One-shot migration applier. Reads every .sql file from
// supabase/migrations/ in lexical order and runs each as a single
// transaction against the project's session pooler. Idempotent only at the
// SQL level — re-running a migration that already created an object will
// fail (which is the correct behaviour; the seed is the canonical reset
// path, not migration re-runs).
//
// Usage from supabase/seed/:
//   npm install        (one-time, picks up the pg dep)
//   npx tsx apply-migrations.ts
//
// Reads from .env: SUPABASE_DB_HOST / DB_PORT / DB_USER / DB_PASSWORD or, as
// a fallback, parses out the project ref from SUPABASE_URL and uses the
// session-pooler host pattern aws-1-ap-northeast-1.pooler.supabase.com.
// =============================================================================

import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

function fail(msg: string): never {
  console.error('ERROR:', msg);
  process.exit(1);
}

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
if (!SUPABASE_URL) fail('SUPABASE_URL must be set in supabase/seed/.env');

const projectRef = SUPABASE_URL.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
if (!projectRef) fail(`Could not parse project ref from SUPABASE_URL=${SUPABASE_URL}`);

const dbPassword = process.env['SUPABASE_DB_PASSWORD'];
if (!dbPassword) {
  fail(
    'SUPABASE_DB_PASSWORD not set. Add it to supabase/seed/.env (the project DB ' +
    'password from the Supabase dashboard → Settings → Database).',
  );
}

const config = {
  host: process.env['SUPABASE_DB_HOST'] ?? 'aws-1-ap-northeast-1.pooler.supabase.com',
  port: Number(process.env['SUPABASE_DB_PORT'] ?? 5432),
  user: process.env['SUPABASE_DB_USER'] ?? `postgres.${projectRef}`,
  password: dbPassword,
  database: process.env['SUPABASE_DB_NAME'] ?? 'postgres',
  ssl: { rejectUnauthorized: false } as const,
};

const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');

async function main(): Promise<void> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();
  if (files.length === 0) fail('No .sql files found in supabase/migrations/');

  console.log(`Connecting to ${config.host}:${config.port} as ${config.user}…`);
  const client = new Client(config);
  await client.connect();
  console.log('Connected.\n');

  let appliedCount = 0;
  for (const filename of files) {
    const fullPath = join(MIGRATIONS_DIR, filename);
    const sql = readFileSync(fullPath, 'utf8');
    console.log(`Applying ${filename} (${sql.length} bytes)…`);

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('COMMIT');
      console.log(`  ✓ ${filename}`);
      appliedCount += 1;
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${filename} — ${message}`);
      console.error('Aborting; later migrations not applied.');
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log(`\nDone — ${appliedCount} migration(s) applied.`);
}

main().catch(err => {
  console.error('Migration applier failed:', err);
  process.exit(1);
});
