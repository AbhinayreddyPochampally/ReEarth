import { redirect } from 'next/navigation';

// Root → always redirect to login; login page handles already-authenticated users.
export default function RootPage(): never {
  redirect('/login');
}
