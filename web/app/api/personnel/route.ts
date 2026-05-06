import { type NextRequest, NextResponse } from 'next/server';
import {
  getFacilityById,
  getFacilityBySapCode,
  getPersonnelForFacility,
} from '@/lib/db/facilities';

// GET /api/personnel?facility_id=...   (post-2026-05-06 rescope, primary)
// GET /api/personnel?sap=...           (legacy, still supported during transition)
//
// Returns the contributor roster for a given facility, used by the login
// name-picker step (UI sketch p5). Unauthenticated for the same reason as
// /api/facilities — the names are not sensitive; PIN gates actual access.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = request.nextUrl.searchParams;
  const facilityId = params.get('facility_id');
  const sap = params.get('sap');

  if (!facilityId && !sap) {
    return NextResponse.json(
      { error: 'Provide facility_id (preferred) or sap parameter.' },
      { status: 400 },
    );
  }

  const facility = facilityId
    ? await getFacilityById(facilityId)
    : await getFacilityBySapCode(sap!);
  if (!facility) {
    return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
  }

  const personnel = await getPersonnelForFacility(facility.id);
  // Filter to contributors only — HO users are corporate (facility_id IS NULL)
  // and don't appear in any facility's roster post-2026-05-06 rescope.
  const contributors = personnel.filter(p => p.role === 'contributor');
  return NextResponse.json({
    facility_id: facility.id,
    facility_name: facility.name,
    sap_code: facility.sap_code,
    personnel: contributors,
  });
}
