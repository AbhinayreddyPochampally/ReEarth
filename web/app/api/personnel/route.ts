import { type NextRequest, NextResponse } from 'next/server';
import { getFacilityBySapCode, getPersonnelForFacility } from '@/lib/db/facilities';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const sap = request.nextUrl.searchParams.get('sap');
  if (!sap) {
    return NextResponse.json({ error: 'Missing sap parameter' }, { status: 400 });
  }

  const facility = await getFacilityBySapCode(sap);
  if (!facility) {
    return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
  }

  const personnel = await getPersonnelForFacility(facility.id);
  return NextResponse.json({ facility_name: facility.name, personnel });
}
