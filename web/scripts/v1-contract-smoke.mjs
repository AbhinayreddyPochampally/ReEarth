import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sampleData = readFileSync(new URL('../lib/v1/sample-data.ts', import.meta.url), 'utf8');
const gateway = readFileSync(new URL('../lib/ai/gateway.ts', import.meta.url), 'utf8');
const contributorShell = readFileSync(new URL('../components/reearth/ContributorShell.tsx', import.meta.url), 'utf8');
const hoShell = readFileSync(new URL('../components/reearth/HOShell.tsx', import.meta.url), 'utf8');
const schema = readFileSync(new URL('../../supabase/migrations/003_v1_schema_extensions.sql', import.meta.url), 'utf8');

assert.equal((sampleData.match(/sapCode:/g) ?? []).length, 15, 'V1 must seed exactly 15 synthetic facilities');
assert.equal((sampleData.match(/kind: 'factory'/g) ?? []).length, 11, 'V1 must model 11 factories');
assert.equal((sampleData.match(/kind: 'warehouse'/g) ?? []).length, 4, 'V1 must model 4 warehouses');
assert.match(sampleData, /export const bills: Bill\[\] = \[\];/, 'demo bills must start unpopulated');
assert.match(sampleData, /export const logActivities: LogActivity\[\]/, 'demo operational activity must come from logs');
assert.match(hoShell, /Log Review/, 'HO navigation must expose log review');
assert.doesNotMatch(hoShell, /Bill Inbox/, 'HO navigation must not center fake bill inbox data');
assert.match(contributorShell, /Evidence/, 'contributor upload navigation should be evidence-first');
assert.doesNotMatch(contributorShell, /label: 'Bills'/, 'contributor nav should not center seeded bill data');

for (const table of ['bills', 'bill_extracted_fields', 'events', 'alerts', 'comments', 'monthly_summaries', 'ai_call_log']) {
  assert.match(schema, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`), `schema must include ${table}`);
  assert.match(schema, new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`), `${table} must enable RLS`);
}

assert.match(gateway, /containsRawSql/, 'AI gateway must expose raw-SQL guard');
assert.doesNotMatch(gateway, /runSql|executeSql|from\(['"]sql/i, 'AI gateway must not expose raw SQL execution');

console.log('V1 contract smoke checks passed');
