import { redirect } from 'next/navigation';
import { Leaf } from '@/components/reearth/Icons';
import { getSession } from '@/lib/auth/session';
import HOLoginForm from './HOLoginForm';

export const metadata = { title: 'HO Login - ReEarth 2.0' };

// HO desktop login per UI sketch p25 + design doc §28.3 / §45.1.
// Email + password. No facility picker — HO users are corporate.
export default async function HOLoginPage(): Promise<React.ReactElement> {
  const session = await getSession();
  if (session.personnel_id) {
    redirect(session.role === 'ho' ? '/ho' : '/contributor');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)] text-[var(--accent)] shadow-[var(--shadow-2)]">
            <Leaf size={24} />
          </span>
          <h1 className="t-h2 mt-4">ReEarth · HO</h1>
          <p className="t-caption mt-1">Sustainability data platform · ABFRL</p>
        </div>
        <div className="re-card p-6">
          <HOLoginForm />
        </div>
      </div>
    </main>
  );
}
