'use server';

import { requireSession } from '@/lib/auth/session';
import { nlQuery, type NLQueryError, type NLQueryResult } from '@/lib/ai/gateway';
import { logAuditEvent } from '@/lib/db/audit';

export async function runNlQueryAction(text: string): Promise<NLQueryResult | NLQueryError> {
  const session = await requireSession();
  if (session.role !== 'ho') return { ok: false, error: 'Only HO can run NL queries.' };

  const result = await nlQuery(text);
  await logAuditEvent({
    event_type: 'nl_query_run',
    actor_id: session.personnel_id,
    entity_type: 'ai_request',
    entity_id: 'data_explorer',
    metadata: {
      query_text: text,
      ok: result.ok,
      ...(result.ok ? { filter: result.filter, partial: result.partial } : { error: result.error }),
    },
  });
  return result;
}
