import { getIronSession, type SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

// Post-2026-05-06 rescope: HO users are corporate (facility_id is NULL).
// `personnel_id` is the canonical "logged in" indicator now — it's always
// set on any successful login, contributor or HO. `facility_id` and the
// facility-related fields are null for HO sessions.
export interface SessionData {
  personnel_id: string;
  facility_id: string | null;
  role: 'contributor' | 'ho';
  name: string;
  facility_name: string | null;
  sap_code: string | null;
  is_super_user?: boolean;
}

// Minimum 32-char secret for iron-session encryption.
// Set SESSION_SECRET in web/.env.local (and Azure App Service config for prod).
//
// In production we hard-fail at runtime if the secret is missing. The dev
// fallback is only used when NODE_ENV !== 'production' so the demo can boot
// without any env file. Per security review (4.6): never accept the
// fallback in production — anyone with source access could otherwise forge
// sessions.
//
// Resolution is *lazy* (inside getSession), not at module-load. Next.js's
// production build phase imports this module to collect page data, and we
// don't want the import itself to throw — the build doesn't actually need
// to mint a session, only runtime requests do.
function resolveSessionSecret(): string {
  const fromEnv = process.env['SESSION_SECRET'];
  if (fromEnv && fromEnv.length >= 32) return fromEnv;
  // Treat the production-build phase as non-runtime — Next sets NEXT_PHASE
  // during build collection. Don't throw there; the secret will be checked
  // again on the first real request.
  const isBuildPhase =
    process.env['NEXT_PHASE'] === 'phase-production-build' ||
    process.env['NEXT_PHASE'] === 'phase-export';
  if (process.env['NODE_ENV'] === 'production' && !isBuildPhase) {
    throw new Error(
      'SESSION_SECRET env var is required in production and must be ≥32 chars. ' +
        'Generate one with: openssl rand -base64 48',
    );
  }
  return 'reearth-demo-dev-secret-32-chars!!';
}

function buildSessionOptions(): SessionOptions {
  return {
    password: resolveSessionSecret(),
    cookieName: 'reearth_session',
    cookieOptions: {
      secure: process.env['NODE_ENV'] === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  // iron-session v8's CookieStore type has a slightly stricter optional-param
  // signature than Next.js 16's ReadonlyRequestCookies. Behavior is identical
  // at runtime — the cast is safe.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getIronSession<SessionData>(cookieStore as any, buildSessionOptions());
}

export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session.personnel_id) {
    throw new Error('Not authenticated');
  }
  return session as SessionData;
}

// Convenience predicate — true iff there is a logged-in user.
// Use this instead of `if (session.facility_id)` because that check breaks
// for HO sessions, which have facility_id=NULL post-rescope.
export function isAuthenticated(session: Partial<SessionData>): boolean {
  return Boolean(session.personnel_id);
}
