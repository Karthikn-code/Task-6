/** @type {import('@playwright/test').PlaywrightTestConfig} */
module.exports = {
  timeout: 10000,
  testDir: './tests',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 }
  }
};
