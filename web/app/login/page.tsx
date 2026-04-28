import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import LoginForm from './LoginForm';

export const metadata = { title: 'Login — ReEarth 2.0' };

export default async function LoginPage(): Promise<React.ReactElement> {
  // Already logged in → send to the right place
  const session = await getSession();
  if (session.facility_id) {
    redirect(session.role === 'ho' ? '/ho' : '/contributor');
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-xl font-bold text-white">
            RE
          </span>
          <h1 className="mt-4 text-xl font-semibold text-zinc-900">ReEarth 2.0</h1>
          <p className="mt-1 text-sm text-zinc-500">Sustainability data platform</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
