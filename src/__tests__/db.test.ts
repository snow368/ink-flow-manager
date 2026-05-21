import { describe, it, expect } from 'vitest';
import { InkFlowDB } from '../db';

describe('DB Schema', () => {
  it('has version 20', () => {
    const db = new InkFlowDB();
    expect(db.verno).toBe(20);
  });

  it('has 25 tables defined', () => {
    const db = new InkFlowDB();
    const tableNames = db.tables.map(t => t.name).sort();
    expect(tableNames).toEqual([
      'affiliateClicks',
      'appointments',
      'auditLog',
      'clients',
      'communicationLog',
      'competitors',
      'healthChecklists',
      'inventory',
      'invoices',
      'leadRevisions',
      'leads',
      'portfolio',
      'posTransactions',
      'projects',
      'referrals',
      'sessions',
      'shifts',
      'socialDrafts',
      'studioLocations',
      'supplyBrands',
      'supplyReviews',
      'tasks',
      'users',
      'waitingList',
      'waivers',
    ]);
  });
});
