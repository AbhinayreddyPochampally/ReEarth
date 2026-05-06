import { type NextRequest, NextResponse } from 'next/server';
import { nlAuditSearch } from '@/lib/ai/gateway';
import { getSession } from '@/lib/auth/session';
import { logAuditEvent } from '@/lib/db/audit';

// POST /api/audit-search — body: { text }
// HO-only (gated by session.role). The AI gateway's mock returns a deterministic
// shape so the click-through demo works without Azure credentials.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSession();
  if (!session.personnel_id || session.role !== 'ho') {
    return NextResponse.json({ ok: false, error: 'HO only.' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text?.trim() ?? '';
  if (!text) return NextResponse.json({ ok: false, error: 'Type a question first.' }, { status: 400 });

  const result = await nlAuditSearch(text);

  await logAuditEvent({
    event_type: 'nl_audit_search',
    actor_id: session.personnel_id,
    entity_type: 'ai_request',
    entity_id: 'global_audit_search',
    metadata: { query_text: text, ok: result.ok },
  });

  return NextResponse.json(result);
}
