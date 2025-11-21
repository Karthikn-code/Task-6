const { test, expect } = require('@playwright/test');
const cp = require('child_process');
const http = require('http');
const path = require('path');

let serverProc;

async function waitForServer(url, timeout = 5000){
  const start = Date.now();
  while(Date.now() - start < timeout){
    try{
      await new Promise((resolve, reject) => {
        const req = http.get(url, res => {
          res.resume();
          resolve();
        });
        req.on('error', reject);
      });
      return;
    }catch(e){
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Server did not start in time');
}

test.describe('Contact form validation', () => {
  test.beforeAll(async () => {
    // Start the server so tests are self-contained
    serverProc = cp.spawn('node', ['server.js'], { cwd: path.resolve(__dirname, '..'), shell: true });
    serverProc.stdout && serverProc.stdout.on('data', d => {});
    serverProc.stderr && serverProc.stderr.on('data', d => {});
    await waitForServer('http://localhost:3000/index.html', 8000);
  });

  test.afterAll(() => {
    if(serverProc){
      serverProc.kill();
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/index.html');
  });

  test('shows errors for empty fields', async ({ page }) => {
    await page.click('#submitBtn');
    await expect(page.locator('#nameError')).toHaveText('Please enter your name.');
    await expect(page.locator('#emailError')).toHaveText('Please enter your email.');
    await expect(page.locator('#messageError')).toHaveText('Please enter a message.');
  });

  test('shows error for invalid email', async ({ page }) => {
    await page.fill('#name', 'Alice');
    await page.fill('#email', 'invalid-email');
    await page.fill('#message', 'Hello');
    await page.click('#submitBtn');
    await expect(page.locator('#emailError')).toHaveText('Please enter a valid email address.');
  });

  test('submits successfully when backend returns success (mocked)', async ({ page }) => {
    // Intercept the API call and return success to isolate front-end behavior
    await page.route('**/api/contact', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true })
    }));

    await page.fill('#name', 'Alice');
    await page.fill('#email', 'alice@example.com');
    await page.fill('#message', 'Hello there');
    await page.click('#submitBtn');
    await expect(page.locator('#success')).toBeVisible();
  });
});
