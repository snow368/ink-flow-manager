import { test, expect } from '@playwright/test';

async function seedUser(page: any, extraStores?: string[]) {
  await page.goto('/register');
  await page.evaluate((stores: string[]) => {
    return new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('InkFlowDB');
      req.onsuccess = () => {
        const openReq = indexedDB.open('InkFlowDB', 19);
        openReq.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = (e.target as IDBOpenDBRequest).result;
          db.createObjectStore('users', { keyPath: 'id' });
          if (stores.includes('clients')) db.createObjectStore('clients', { keyPath: 'id' });
          if (stores.includes('appointments')) db.createObjectStore('appointments', { keyPath: 'id' });
        };
        openReq.onsuccess = () => {
          const db = openReq.result;
          const tx = db.transaction(['users', ...stores], 'readwrite');
          tx.objectStore('users').put({
            id: 'test_user_001', email: 'test@inkflow.local', name: 'Test Artist',
            roles: ['artist'], deviceId: 'test-device-001', verified: false, createdAt: Date.now(),
          });
          if (stores.includes('clients') && stores.includes('appointments')) {
            const now = Date.now();
            const today = new Date().toISOString().slice(0, 10);
            tx.objectStore('clients').put({ id: 'client_001', name: 'Test Client', artistId: 'test_user_001', phone: '+1234567890', createdAt: now });
            tx.objectStore('appointments').put({ id: 'appt_001', clientId: 'client_001', artistId: 'test_user_001', date: today, time: '10:00', duration: 120, type: 'new_tattoo', status: 'ready', waiverCompleted: true, depositAmount: 5000, createdAt: now });
          }
          tx.oncomplete = () => { db.close(); resolve(); };
        };
      };
    });
  }, extraStores || []);
  await page.evaluate(() => localStorage.setItem('inkflow_current_user', 'test_user_001'));
}

test.describe('Page renders', () => {
  test('Register page has all elements', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByText('I\'m a Tattoo Artist')).toBeVisible();
    await expect(page.getByText('I Own a Studio')).toBeVisible();
    await expect(page.getByText('I\'m Staff / Front Desk')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await seedUser(page);
  });

  test('Today → Clients → Me via TabBar', async ({ page }) => {
    await page.goto('/today');
    await page.waitForURL('**/today', { timeout: 10000 });
    await expect(page.locator('text=Today').first()).toBeVisible({ timeout: 5000 });

    await page.locator('button:has-text("Clients")').first().click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/clients');

    await page.locator('button:has-text("Me")').first().click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/me');
  });

  test('Clients page has new client button', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('button:has-text("Add Client"), button:has-text("+")').first()).toBeVisible({ timeout: 5000 });
  });

  test('Me page has language selector', async ({ page }) => {
    await page.goto('/me');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Language|Idioma|Langue|Sprache/)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Appointments', () => {
  test.beforeEach(async ({ page }) => {
    await seedUser(page, ['clients', 'appointments']);
  });

  test('Today page shows seeded appointment', async ({ page }) => {
    await page.goto('/today');
    await page.waitForURL('**/today', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Test Client').first()).toBeVisible({ timeout: 5000 });
  });

  test('Appointment form page loads', async ({ page }) => {
    await page.goto('/appointment/new');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=New Appointment').first()).toBeVisible({ timeout: 5000 });
  });
});
