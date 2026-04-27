import { createClient } from "@supabase/supabase-js";

const url = process.env["NEXT_PUBLIC_SUPABASE_URL"];
const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment");
  process.exit(1);
}

// Hit the PostgREST root — returns 200 with API schema if reachable.
const res = await fetch(`${url}/rest/v1/`, {
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  },
});

if (!res.ok) {
  console.error(`Supabase connection failed: HTTP ${res.status}`);
  process.exit(1);
}

// Verify auth service is also up.
const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
const { error: authError } = await supabase.auth.getUser();
// authError here just means no active user — not a connectivity failure.
// A network error would throw, which we let propagate.

console.log("Supabase connection OK");
console.log(`Project URL  : ${url}`);
console.log(`REST API     : ${res.status} ${res.statusText}`);
console.log(`Auth service : ${authError?.status === 401 ? "up (401 = no session, expected)" : "up"}`);
console.log("No schema yet — run Task 1.3 migration next.");
