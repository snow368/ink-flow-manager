import { describe, it, expect } from 'vitest';
import { InkFlowDB } from '../db';

describe('DB Schema', () => {
  it('has version 34', () => {
    const db = new InkFlowDB();
    expect(db.verno).toBe(34);
  });

  it('has 36 tables defined', () => {
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
      'photos',
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
