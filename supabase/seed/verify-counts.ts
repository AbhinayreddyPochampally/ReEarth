import 'dotenv/config';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

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
  for (const t of ['facilities','parameters','personnel','parameter_assignments','regulatory_limits','submissions','hazardous_events','compliance_breaches','audit_log']) {
    const r = await c.query<{ count: string }>(`SELECT count(*)::text FROM ${t}`);
    console.log(`  ${t.padEnd(24)} ${r.rows[0]!.count}`);
  }
  console.log('\n— sample HO row:');
  const ho = await c.query(
    `SELECT name, email, is_super_user, facility_id FROM personnel WHERE role='ho'`,
  );
  for (const row of ho.rows) console.log('   ', row);
  console.log('\n— first 3 facilities:');
  const f = await c.query(`SELECT sap_code, name, type, city FROM facilities ORDER BY sap_code LIMIT 3`);
  for (const row of f.rows) console.log('   ', row);

  // Read pins.csv to surface the FAC00001 PIN for a contributor login test
  try {
    const csv = readFileSync(join(__dirname, 'output', 'pins.csv'), 'utf8');
    const fac001 = csv.split('\n').find(l => l.includes('FAC00001'));
    console.log('\n— FAC00001 contributor login row:');
    console.log('   ', fac001);
  } catch {}

  await c.end();
}
main().catch(e => { console.error(e); process.exit(1); });
