import type { UserRecord } from '../db';

export type StaffPermission = 'checkin' | 'inventory' | 'pos' | 'clients_view' | 'clients_edit' | 'appointments_view' | 'appointments_edit' | 'leads_view' | 'leads_edit' | 'invoices_view' | 'invoices_edit' | 'analytics_view';

export const STAFF_PERMISSION_LABELS: Record<StaffPermission, { label: string; description: string }> = {
  checkin: { label: 'Check-in', description: 'Scan QR codes, mark clients arrived' },
  inventory: { label: 'Inventory', description: 'View and manage inventory items' },
  pos: { label: 'POS', description: 'Use the point-of-sale register' },
  clients_view: { label: 'View Clients', description: 'See client list and details' },
  clients_edit: { label: 'Edit Clients', description: 'Create and edit client records' },
  appointments_view: { label: 'View Appointments', description: 'See the schedule and appointments' },
  appointments_edit: { label: 'Edit Appointments', description: 'Create, reschedule, cancel appointments' },
  leads_view: { label: 'View Leads', description: 'See lead capture records' },
  leads_edit: { label: 'Edit Leads', description: 'Create and update leads' },
  invoices_view: { label: 'View Invoices', description: 'See invoice records' },
  invoices_edit: { label: 'Edit Invoices', description: 'Create, send, and record invoice payments' },
  analytics_view: { label: 'View Analytics', description: 'Access analytics dashboard' },
};

export function can(user: UserRecord | null, permission: StaffPermission): boolean {
  if (!user) return false;
  if (user.roles?.includes('owner')) return true;
  if (user.roles?.includes('artist')) return true;
  if (user.roles?.includes('staff')) return user.permissions?.includes(permission) ?? false;
  return false;
}

export function canAny(user: UserRecord | null, permissions: StaffPermission[]): boolean {
  return permissions.some(p => can(user, p));
}
