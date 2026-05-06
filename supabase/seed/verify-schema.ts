import 'dotenv/config';
import { Client } from 'pg';

const projectRef = (process.env['SUPABASE_URL'] ?? '').match(/^https:\/\/([a-z0-9]+)\./)?.[1] ?? '';

const config = {
  host: process.env['SUPABASE_DB_HOST']!,
  port: Number(process.env['SUPABASE_DB_PORT']!),
  user: `postgres.${projectRef}`,
  password: process.env['SUPABASE_DB_PASSWORD']!,
  database: 'postgres',
  ssl: { rejectUnauthorized: false } as const,
};

async function main() {
  const c = new Client(config);
  await c.connect();
  const tables = await c.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
  );
  console.log(`Tables (${tables.rows.length}):`);
  for (const r of tables.rows) console.log(`  ${r.table_name}`);

  const personnel = await c.query<{ column_name: string; is_nullable: string; data_type: string }>(
    `SELECT column_name, is_nullable, data_type FROM information_schema.columns
     WHERE table_schema='public' AND table_name='personnel' ORDER BY ordinal_position`,
  );
  console.log(`\npersonnel columns:`);
  for (const r of personnel.rows) console.log(`  ${r.column_name}  ${r.data_type}  ${r.is_nullable === 'YES' ? '(nullable)' : ''}`);

  await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
