import { NextResponse } from 'next/server';
import { listAllActiveFacilities } from '@/lib/db/facilities';

// GET /api/facilities — returns picker rows (id, sap_code, name, type, city, state)
// for the contributor login facility picker (UI sketch p3).
//
// This endpoint is intentionally unauthenticated — the facility list is not
// sensitive (the names are visible on the dashboard for any HO user, and
// PINs gate actual access). Returning the same list to anyone simplifies
// the cold-load on the login screen.
export async function GET(): Promise<NextResponse> {
  const facilities = await listAllActiveFacilities();
  return NextResponse.json({ facilities });
}
