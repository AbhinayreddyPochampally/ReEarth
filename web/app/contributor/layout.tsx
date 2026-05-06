import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { ContributorShell } from '@/components/reearth/ContributorShell';

export default async function ContributorLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getSession();

  // personnel_id is the canonical "logged in" check (works for both contributor
  // and HO sessions). For contributor sessions specifically, facility_id is
  // also guaranteed non-null by the auth flow + DB CHECK constraint.
  if (!session.personnel_id) redirect('/login');
  if (session.role !== 'contributor') redirect('/ho');

  return (
    <ContributorShell facility={session.facility_name ?? ''} name={session.name}>
      {children}
    </ContributorShell>
  );
}
