import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  facility_id: string;
  personnel_id: string;
  role: 'contributor' | 'ho';
  name: string;
  facility_name: string;
  sap_code: string;
}

// Minimum 32-char secret for iron-session encryption.
// Set SESSION_SECRET in web/.env.local (and Azure App Service config for prod).
const SESSION_SECRET =
  process.env['SESSION_SECRET'] ?? 'reearth-demo-dev-secret-32-chars!!';

const SESSION_OPTIONS: SessionOptions = {
  password: SESSION_SECRET,
  cookieName: 'reearth_session',
  cookieOptions: {
    secure: process.env['NODE_ENV'] === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  // iron-session v8's CookieStore type has a slightly stricter optional-param
  // signature than Next.js 16's ReadonlyRequestCookies. Behavior is identical
  // at runtime — the cast is safe.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getIronSession<SessionData>(cookieStore as any, SESSION_OPTIONS);
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session.facility_id) {
    throw new Error('Not authenticated');
  }
  return session as SessionData;
}
