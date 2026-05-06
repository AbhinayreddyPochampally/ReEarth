'use server';

import { requireSession } from '@/lib/auth/session';
import { nlMasterUpdate } from '@/lib/ai/gateway';
import { logAuditEvent } from '@/lib/db/audit';
import type { DiffProposal } from '@/lib/v1/contracts';

export interface DiffResult {
  ok: true;
  proposal: DiffProposal;
}
export interface DiffError {
  ok: false;
  error: string;
}

export async function generateDiffAction(text: string): Promise<DiffResult | DiffError> {
  const session = await requireSession();
  if (session.role !== 'ho') return { ok: false, error: 'Only HO can propose master changes.' };
  if (!text.trim()) return { ok: false, error: 'Describe the change first.' };

  const proposal = await nlMasterUpdate(text);

  await logAuditEvent({
    event_type: 'nl_master_diff_generated',
    actor_id: session.personnel_id,
    entity_type: 'ai_request',
    entity_id: 'master_data',
    metadata: { query_text: text, table: proposal.table, affected_count: proposal.affected.length },
  });

  return { ok: true, proposal };
}

export async function applyDiffAction(text: string, proposal: DiffProposal): Promise<DiffResult | DiffError> {
  const session = await requireSession();
  if (session.role !== 'ho') return { ok: false, error: 'Only HO can apply master changes.' };

  // Phase 2 stub: log the application as an audit event but don't actually
  // mutate any tables. Phase 3 wires this through to the DB transaction.
  await logAuditEvent({
    event_type: 'nl_master_diff_applied',
    actor_id: session.personnel_id,
    entity_type: 'master_data',
    entity_id: proposal.table,
    metadata: {
      original_query: text,
      table: proposal.table,
      affected_count: proposal.affected.length,
      applied_at: new Date().toISOString(),
    },
  });

  return { ok: true, proposal };
}
