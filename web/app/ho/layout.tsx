import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { HOShell } from '@/components/reearth/HOShell';

export default async function HOLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getSession();

  // Post-2026-05-06 rescope: HO sessions have facility_id=null, so use
  // personnel_id as the "logged in" indicator. HO comes in via /login/ho.
  if (!session.personnel_id) redirect('/login/ho');
  if (session.role !== 'ho') redirect('/contributor');

  return <HOShell name={session.name}>{children}</HOShell>;
}
