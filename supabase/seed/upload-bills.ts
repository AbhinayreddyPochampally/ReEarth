// =============================================================================
// supabase/seed/upload-bills.ts
//
// Uploads the SVG bill placeholders from web/public/sample-bills/ to the
// Supabase Storage `evidence` bucket so the deployed app can serve them via
// signed URLs. Run separately from the main seed (this script only touches
// Storage; the seed only touches Postgres).
//
// Usage:
//   cd supabase/seed
//   npm run upload:bills
//
// Storage budget:
//   - 11 SVG files, ~21 KB total — well within Supabase Storage free tier
//     (1 GB hard cap). Each SVG is text and gzip-compresses to <1 KB on
//     transit.
//
// On re-run: existing files are overwritten (upsert: true). Safe to run
// repeatedly during development.
// =============================================================================

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
const SUPABASE_SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in supabase/seed/.env');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const BUCKET = 'evidence';
const SOURCE_DIR = join(__dirname, '..', '..', 'web', 'public', 'sample-bills');

async function ensureBucket(): Promise<void> {
  const { data: buckets } = await db.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (exists) {
    console.log(`Bucket '${BUCKET}' exists — skipping create.`);
    return;
  }
  const { error } = await db.storage.createBucket(BUCKET, { public: true });
  if (error) {
    console.error(`Could not create bucket '${BUCKET}':`, error.message);
    console.error('Create it manually in the Supabase dashboard (Storage → New bucket, public).');
    process.exit(1);
  }
  console.log(`Created public bucket '${BUCKET}'.`);
}

async function uploadAll(): Promise<void> {
  const files = readdirSync(SOURCE_DIR).filter(f => f.endsWith('.svg'));
  console.log(`Uploading ${files.length} files from ${SOURCE_DIR}…`);

  let totalBytes = 0;
  for (const filename of files) {
    const fullPath = join(SOURCE_DIR, filename);
    const body = readFileSync(fullPath);
    totalBytes += body.byteLength;

    const storagePath = `sample-bills/${filename}`;
    const { error } = await db.storage.from(BUCKET).upload(storagePath, body, {
      contentType: 'image/svg+xml',
      cacheControl: '3600',
      upsert: true,
    });
    if (error) {
      console.error(`  ✗ ${filename}:`, error.message);
      continue;
    }
    console.log(`  ✓ ${filename} (${body.byteLength} bytes)`);
  }

  const totalKB = (totalBytes / 1024).toFixed(1);
  console.log(`\nDone — ${totalKB} KB uploaded to '${BUCKET}/sample-bills/'.`);
  console.log(`Storage cost so far: ${totalKB} KB / 1,048,576 KB (1 GB free tier).`);
}

async function main(): Promise<void> {
  console.log('=== Sample bill image upload ===\n');
  await ensureBucket();
  await uploadAll();
}

main().catch(err => {
  console.error('\nUpload failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
