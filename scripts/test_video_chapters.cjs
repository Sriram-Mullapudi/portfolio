// Optional browser checks using the real media files. Requires Playwright and Edge.
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
(async () => {
 const browser = await chromium.launch({headless:true, channel:'msedge'});
 try {
  const page = await browser.newPage({viewport:{width:390,height:844}, reducedMotion:'reduce'});
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  for (const [film, time] of [['folio',18.6], ['speedway',15.94]]) {
   await page.locator(`[data-watch-video="${film}"]`).click();
   await page.waitForFunction(() => document.querySelector('#product-cinema video').readyState >= 1);
   assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), 'hidden');
   const chapters = page.locator('.cinema-chapters button');
   assert.equal(await chapters.count(), 3);
   await chapters.nth(2).click();
   await page.waitForFunction(t => document.querySelector('#product-cinema video').currentTime >= t, time);
   await page.waitForFunction(() => document.querySelectorAll('.cinema-chapters button')[2].getAttribute('aria-current') === 'step');
   await page.locator('#product-cinema video').evaluate(video => { video.currentTime = video.duration - .15; return video.play(); });
   await page.locator('.cinema-replay').waitFor({state:'visible'});
   await page.locator('.cinema-replay').click();
   await page.waitForFunction(() => document.querySelector('#product-cinema video').currentTime < 2);
   assert(await chapters.first().evaluate(button => button === document.activeElement));
   await page.keyboard.press('Escape');
   assert.equal(await chapters.count(), 0);
   assert.notEqual(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), 'hidden');
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', {value:{saveData:true}, configurable:true}));
  await page.reload();
  const preview = page.locator('.product-video').first();
  await preview.scrollIntoViewIfNeeded(); await page.waitForTimeout(500);
  assert(await preview.evaluate(video => video.paused), 'Data saver must suppress automatic preview playback');
  await page.locator('[data-watch-video="folio"]').click();
  await page.waitForFunction(() => document.querySelector('#product-cinema video').currentTime > .1);
  assert.deepEqual(errors, []);
  console.log('PASS: both films chapter seeking, replay, focus, close cleanup, and data saver with explicit playback.');
 } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
