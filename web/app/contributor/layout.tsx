import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';

export default async function ContributorLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await getSession();

  if (!session.facility_id) redirect('/login');
  if (session.role !== 'contributor') redirect('/ho');

  return <>{children}</>;
}
