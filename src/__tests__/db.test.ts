import { describe, it, expect } from 'vitest';
import { InkFlowDB } from '../db';

describe('DB Schema', () => {
  it('has version 30', () => {
    const db = new InkFlowDB();
    expect(db.verno).toBe(30);
  });

  it('has 35 tables defined', () => {
    const db = new InkFlowDB();
    const tableNames = db.tables.map(t => t.name).sort();
    expect(tableNames).toEqual([
      'affiliateClicks',
      'appointments',
      'auditLog',
      'clientReferrals',
      'clients',
      'communicationLog',
      'competitors',
      'depositFlow',
      'healthChecklists',
      'inventory',
      'invoices',
      'leadConfirmations',
      'leadRevisions',
      'leads',
      'portfolio',
      'posTransactions',
      'projectApprovalTokens',
      'projectAssets',
      'projectRevisions',
      'projects',
      'referrals',
      'reviews',
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
