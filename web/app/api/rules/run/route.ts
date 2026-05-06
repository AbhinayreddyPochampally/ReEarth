import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { runAllRules } from '@/lib/rules';
import { logAuditEvent } from '@/lib/db/audit';

// POST /api/rules/run — runs the three Phase-2 rule engines (compliance
// breach, threshold, data-gap) and returns candidate alerts. HO-only.
//
// Phase 3 wires this to a scheduled cron via Vercel Crons / Azure Functions.
export async function POST(): Promise<NextResponse> {
  const session = await getSession();
  if (!session.personnel_id || session.role !== 'ho') {
    return NextResponse.json({ ok: false, error: 'HO only.' }, { status: 403 });
  }

  const result = runAllRules();
  await logAuditEvent({
    event_type: 'rules_run',
    actor_id: session.personnel_id,
    entity_type: 'rule_engine',
    entity_id: 'all',
    metadata: {
      total_candidates: result.candidates.length,
      already_open: result.alreadyOpen,
      new_count: result.newAlerts.length,
    },
  });

  return NextResponse.json({ ok: true, ...result });
}
