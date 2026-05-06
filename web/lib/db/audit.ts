import { db } from './supabase';

interface AuditParams {
  event_type: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Appends one row to the append-only audit_log table.
// audit_log blocks UPDATE/DELETE but INSERT is always permitted.
export async function logAuditEvent(params: AuditParams): Promise<void> {
  // V1 demo sessions use stable synthetic IDs. Keep the user action instant and
  // let the real Supabase path handle persisted UUID-backed environments.
  if (
    !UUID_PATTERN.test(params.entity_id) ||
    (params.actor_id !== null && !UUID_PATTERN.test(params.actor_id))
  ) {
    return;
  }

  const { error } = await db.from('audit_log').insert({
    event_type: params.event_type,
    actor_id: params.actor_id,
    entity_type: params.entity_type,
    entity_id: params.entity_id,
    metadata: params.metadata ?? null,
  });

  // Audit failures are non-fatal — log to console but don't throw.
  // A failed audit should not block the user action that triggered it.
  if (error) {
    console.error('[audit] insert failed:', error.message);
  }
}
