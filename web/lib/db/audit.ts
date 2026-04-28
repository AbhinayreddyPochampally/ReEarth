import { db } from './supabase';

interface AuditParams {
  event_type: string;
  actor_id: string | null;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
}

// Appends one row to the append-only audit_log table.
// audit_log blocks UPDATE/DELETE but INSERT is always permitted.
export async function logAuditEvent(params: AuditParams): Promise<void> {
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
