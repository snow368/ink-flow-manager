import { db } from '../db';
import type { AuditLogRecord } from '../db';

let initialized = false;

export function initAuditLogging(): void {
  if (initialized) return;
  initialized = true;
  const actorId = localStorage.getItem('inkflow_current_user') || 'unknown';

  const tablesToWatch = ['clients', 'appointments', 'leads', 'invoices', 'posTransactions', 'inventory'] as const;

  for (const tableName of tablesToWatch) {
    const table = (db as any)[tableName];
    if (!table || !table.hook) continue;

    table.hook('creating').subscribe(function (primKey: any, obj: any) {
      writeAuditLog({
        actorId,
        actorName: '',
        action: 'create',
        tableName,
        recordId: String(obj.id || primKey),
        artistId: obj.artistId || '',
        diff: undefined,
      });
    });

    table.hook('deleting').subscribe(function (primKey: any, obj: any) {
      writeAuditLog({
        actorId,
        actorName: '',
        action: 'delete',
        tableName,
        recordId: String(obj?.id || primKey),
        artistId: obj?.artistId || '',
        diff: undefined,
      });
    });
  }
}

async function writeAuditLog(data: {
  actorId: string;
  actorName?: string;
  action: AuditLogRecord['action'];
  tableName: string;
  recordId: string;
  artistId: string;
  diff?: Record<string, { from: any; to: any }>;
}) {
  try {
    const user = await db.users.get(data.actorId);
    const id = 'audit_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    await db.auditLog.add({
      id,
      actorId: data.actorId,
      actorName: user?.name || data.actorName || data.actorId.slice(0, 8),
      action: data.action,
      tableName: data.tableName,
      recordId: data.recordId,
      artistId: data.artistId,
      diff: data.diff,
      createdAt: Date.now(),
    });
  } catch {
    // silently fail — audit logging should never break app flow
  }
}

export async function getAuditLogs(params: {
  actorId?: string;
  tableName?: string;
  action?: string;
  artistId?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLogRecord[]> {
  const { limit = 50, offset = 0 } = params;
  let collection = db.auditLog.orderBy('createdAt').reverse();

  const results = await collection.toArray();
  return results
    .filter(r => {
      if (params.actorId && r.actorId !== params.actorId) return false;
      if (params.tableName && r.tableName !== params.tableName) return false;
      if (params.action && r.action !== params.action) return false;
      if (params.artistId && r.artistId !== params.artistId) return false;
      return true;
    })
    .slice(offset, offset + limit);
}
