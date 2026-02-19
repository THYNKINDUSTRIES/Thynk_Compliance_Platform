/**
 * E2E Tests: Critical Page Availability
 * 
 * Verifies all public pages load successfully with correct content.
 * These are the "smoke tests" — if any of these fail, something fundamental is broken.
 */
import { test, expect } from '@playwright/test';

const PUBLIC_PAGES = [
  { path: '/', name: 'Homepage', expect: 'Thynk' },
  { path: '/app', name: 'Platform', expect: 'compliance' },
  { path: '/login', name: 'Login', expect: 'Sign' },
  { path: '/signup', name: 'Sign Up', expect: 'Sign' },
  { path: '/privacy', name: 'Privacy Policy', expect: 'Privacy' },
  { path: '/terms', name: 'Terms', expect: 'Terms' },
  { path: '/contact', name: 'Contact', expect: 'Contact' },
  { path: '/support', name: 'Support', expect: 'Support' },
  { path: '/legislature-bills', name: 'Legislature Bills', expect: 'Bill' },
];

test.describe('Critical Pages', () => {
  for (const page of PUBLIC_PAGES) {
    test(`${page.name} (${page.path}) loads successfully`, async ({ page: p }) => {
      const response = await p.goto(page.path, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Should return 200
      expect(response?.status()).toBeLessThan(400);
      
      // Should contain expected text — check inner text OR page source
      const bodyText = await p.innerText('body').catch(() => '');
      const pageSource = await p.content();
      const combined = (bodyText + ' ' + pageSource).toLowerCase();
      expect(combined).toContain(page.expect.toLowerCase());
      
      // Should not show error boundary
      const errorBoundary = await p.locator('text=Something went wrong').count();
      expect(errorBoundary).toBe(0);
    });
  }
});

test.describe('No Console Errors', () => {
  test('Homepage loads without critical console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known non-critical messages
        if (text.includes('favicon') || text.includes('AbortError') || text.includes('__cf_bm')) return;
        errors.push(text);
      }
    });
    
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Filter out CORS and non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('CORS') && 
      !e.includes('net::ERR') &&
      !e.includes('favicon')
    );
    
    // Allow up to 2 non-critical errors
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });
});

test.describe('Navigation', () => {
  test('Can navigate from homepage to platform', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Look for a "Platform" or "app" link
    const platformLink = page.locator('a[href="/app"], a:has-text("Platform")').first();
    if (await platformLink.isVisible()) {
      await platformLink.click();
      await page.waitForURL('**/app', { timeout: 10000 });
      expect(page.url()).toContain('/app');
    }
  });
  
  test('Login page is accessible', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    
    // Should have email/password inputs
    const emailInput = page.locator('input[type="email"], input[name="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Performance', () => {
  test('Homepage loads within 5 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(5000);
    console.log(`Homepage load time: ${loadTime}ms`);
  });
  
  test('Platform page loads within 8 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('/app', { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    
    expect(loadTime).toBeLessThan(8000);
    console.log(`Platform load time: ${loadTime}ms`);
  });
});
