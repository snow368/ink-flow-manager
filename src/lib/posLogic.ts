import { db, type PosTransactionRecord } from '../db';

export function generateReceiptNumber(artistId: string): string {
  const key = `inkflow_pos_receipt_seq_${artistId}`;
  const next = (parseInt(localStorage.getItem(key) || '0', 10) || 0) + 1;
  localStorage.setItem(key, String(next));
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `R${date}-${String(next).padStart(4, '0')}`;
}

export function formatReceipt(tx: PosTransactionRecord, clientName?: string): string {
  const date = new Date(tx.createdAt).toLocaleString();
  const lines: string[] = [];
  lines.push('INK FLOW MANAGER');
  lines.push(`Receipt: ${tx.receiptNumber}`);
  lines.push(`Date: ${date}`);
  lines.push(`Client: ${clientName || tx.walkInName || 'N/A'}`);
  if (tx.appointmentId) lines.push(`Appointment: ${tx.appointmentId}`);
  lines.push('-'.repeat(32));
  for (const item of tx.items) {
    const qty = `x${item.quantity}`;
    const price = (item.price / 100).toFixed(2);
    const total = (item.total / 100).toFixed(2);
    lines.push(`${item.name} ${qty} @${price} = ${total}`);
  }
  lines.push('-'.repeat(32));
  lines.push(`Subtotal: ${(tx.subtotal / 100).toFixed(2)}`);
  if (tx.depositApplied) lines.push(`Deposit Applied: -${(tx.depositApplied / 100).toFixed(2)}`);
  if (tx.tax) lines.push(`Tax: ${(tx.tax / 100).toFixed(2)}`);
  if (tx.tip) lines.push(`Tip: ${(tx.tip / 100).toFixed(2)}`);
  lines.push(`Total: ${(tx.total / 100).toFixed(2)}`);
  lines.push(`Method: ${tx.paymentMethod.toUpperCase()}`);
  lines.push('');
  lines.push('Thank you!');
  return lines.join('\n');
}

export function printReceipt(tx: PosTransactionRecord, clientName?: string): void {
  const text = formatReceipt(tx, clientName);
  const w = window.open('', '_blank', 'width=300,height=400');
  if (!w) return;
  w.document.write(`<pre style="font-family:monospace;font-size:12px;white-space:pre-wrap">${text}</pre>`);
  w.document.close();
  setTimeout(() => { w.print(); }, 200);
}

export async function deductInventory(tx: PosTransactionRecord): Promise<void> {
  for (const item of tx.items) {
    if (item.type === 'product' && item.inventoryId) {
      const inv = await db.inventory.get(item.inventoryId);
      if (inv) {
        const newQty = Math.max(0, inv.quantity - item.quantity);
        await db.inventory.update(inv.id, { quantity: newQty });
      }
    }
  }
}

export async function restoreInventory(tx: PosTransactionRecord): Promise<void> {
  for (const item of tx.items) {
    if (item.type === 'product' && item.inventoryId) {
      const inv = await db.inventory.get(item.inventoryId);
      if (inv) {
        await db.inventory.update(inv.id, { quantity: inv.quantity + item.quantity });
      }
    }
  }
}

const POS_SETTINGS_KEY = 'inkflow_pos_settings';

export interface PosSettings {
  taxRate: number;
  receiptHeader: string;
  defaultServices: { name: string; price: number }[];
}

export function loadPosSettings(): PosSettings {
  try {
    const raw = localStorage.getItem(POS_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { taxRate: 0, receiptHeader: '', defaultServices: [] };
}

export function savePosSettings(settings: PosSettings): void {
  localStorage.setItem(POS_SETTINGS_KEY, JSON.stringify(settings));
}
