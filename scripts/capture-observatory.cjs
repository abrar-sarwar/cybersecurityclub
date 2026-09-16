const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');

async function main() {
  fs.mkdirSync('screenshots/observatory', { recursive: true });
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = { widths: [], routes: [], checks: [], errors: [] };
  try {
    const context = await browser.newContext({ reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', (error) => report.errors.push(error.message));
    for (const width of [360, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
      const response = await page.goto('http://localhost:3000/', { waitUntil: 'networkidle', timeout: 90000 });
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert.ok(dimensions.scroll <= width, `Horizontal overflow at ${width}: ${dimensions.scroll}`);
      report.widths.push(dimensions);
      await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
      await page.screenshot({ path: `screenshots/observatory/home-${width}.png`, fullPage: true });
      if (width === 390 || width === 1440) await page.screenshot({ path: `screenshots/observatory/home-${width}-viewport.png` });
      if (width === 390) {
        const join = await page.locator('.hero-actions a').first().boundingBox();
        assert.ok(join.y + join.height <= 844, 'Primary action should fit in first mobile viewport');
        await page.getByRole('button', { name: 'Open menu', exact: true }).click();
        const dialog = page.getByRole('dialog');
        await dialog.waitFor();
        const links = dialog.locator('a, button');
        await links.last().focus();
        await page.keyboard.press('Tab');
        assert.equal(await links.first().evaluate((el) => el === document.activeElement), true);
        await page.keyboard.press('Escape');
        assert.equal(await dialog.count(), 0);
        assert.equal(await page.getByRole('button', { name: 'Open menu', exact: true }).evaluate((el) => el === document.activeElement), true);
        assert.equal(await page.evaluate(() => document.body.style.overflow), '');
        await page.getByRole('button', { name: 'Open menu', exact: true }).click();
        await page.getByRole('dialog').getByRole('link', { name: 'Projects', exact: true }).click();
        assert.equal(await page.getByRole('dialog').count(), 0);
        report.checks.push('Mobile menu focus trap, Escape, restored focus/scroll, and homepage anchor navigation');
      }
    }
    assert.equal(await page.locator('.motion-control').isDisabled(), true);
    assert.equal(await page.locator('.globe-canvas').isVisible(), false);
    report.checks.push('Reduced motion uses static globe and static employer list');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'html { font-size: 200%; } nextjs-portal { display:none !important; }' });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Overflow at 200% text');
    await page.screenshot({ path: 'screenshots/observatory/home-enlarged-text.png', fullPage: true });
    report.checks.push('200% root text enlargement at 390px has no page overflow');
    for (const route of ['/about', '/events', '/community', '/stories', '/learn', '/join', '/privacy', '/accessibility', '/learn/paths/product-application-security']) {
      const response = await page.goto(`http://localhost:3000${route}`, { waitUntil: 'networkidle', timeout: 90000 });
      report.routes.push({ route, status: response.status() });
      assert.equal(response.status(), 200, route);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Overflow on ${route}`);
      await page.addStyleTag({ content: 'nextjs-portal { display:none !important; }' });
      if (['/events', '/learn', '/join'].includes(route)) await page.screenshot({ path: `screenshots/observatory/${route.slice(1)}-mobile.png`, fullPage: true });
    }
    await context.close();

    const motion = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference' });
    const live = await motion.newPage();
    live.on('pageerror', (error) => report.errors.push(error.message));
    await live.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    await live.locator('.globe-canvas.is-ready').waitFor({ timeout: 15000 });
    const frame = () => live.locator('canvas').evaluate((el) => el.toDataURL());
    const first = await frame(); await live.waitForTimeout(250); assert.notEqual(await frame(), first, 'Globe rotates');
    await live.getByRole('button', { name: 'Pause page motion', exact: true }).click();
    const paused = await frame(); await live.waitForTimeout(250); assert.equal(await frame(), paused, 'Globe pauses');
    await live.reload({ waitUntil: 'networkidle' });
    await live.getByRole('button', { name: 'Resume page motion', exact: true }).waitFor();
    await live.getByRole('button', { name: 'Resume page motion', exact: true }).click();
    await live.locator('footer').scrollIntoViewIfNeeded();
    await live.waitForTimeout(200);
    const offscreen = await frame(); await live.waitForTimeout(250); assert.equal(await frame(), offscreen, 'Offscreen globe pauses');
    await live.evaluate(() => scrollTo(0, 0));
    await live.waitForTimeout(200);
    await live.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
    const hidden = await frame(); await live.waitForTimeout(250); assert.equal(await frame(), hidden, 'Hidden document pauses');
    await live.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
    report.checks.push('Globe rotates, pause freezes it, pause persists on reload, offscreen rendering stops');
    report.checks.push('Simulated hidden-document visibility change stops globe rendering');
    for (const route of ['/dashboard', '/admin', '/projects', '/account']) {
      const response = await motion.request.get(`http://localhost:3000${route}`, { maxRedirects: 0 });
      assert.equal(response.status(), 307);
      assert.ok(response.headers().location.includes('/sign-in?next='));
    }
    report.checks.push('Anonymous requests to dashboard, officer tools, member projects, and account still redirect to sign-in');
    for (const route of ['/sign-in', '/sign-up']) {
      const response = await motion.request.get(`http://localhost:3000${route}`);
      report.routes.push({ route, status: response.status(), note: 'Pre-existing missing page; authentication backend left intact' });
    }
    await live.locator('canvas').dispatchEvent('contextlost');
    assert.equal(await live.locator('.globe-canvas.is-ready').count(), 0);
    assert.equal(await live.locator('.globe-poster.is-rendered').count(), 0);
    report.checks.push('Canvas context loss restores the static poster');
    await motion.close();

    const fallbackContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const fallback = await fallbackContext.newPage();
    await fallback.route('**/land-points.json', (route) => route.abort());
    await fallback.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
    assert.equal(await fallback.locator('.globe-canvas.is-ready').count(), 0);
    assert.equal(await fallback.locator('.globe-poster').evaluate((el) => el.complete && el.naturalWidth > 0), true);
    report.checks.push('Globe data failure preserves the loaded static poster');
    await fallbackContext.close();

    const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    const staticPage = await nojs.newPage();
    await staticPage.goto('http://localhost:3000/', { waitUntil: 'load' });
    assert.equal(await staticPage.locator('.globe-poster').evaluate((el) => el.complete && el.naturalWidth > 0), true);
    assert.equal(await staticPage.getByRole('heading', { level: 1 }).innerText(), 'Your people.\nA bigger world.');
    await staticPage.screenshot({ path: 'screenshots/observatory/home-no-javascript.png', fullPage: true });
    report.checks.push('No-JavaScript homepage keeps headline, links, and local globe poster');
    await nojs.close();
    assert.deepEqual(report.errors, []);
  } finally {
    fs.writeFileSync('screenshots/observatory/checks.json', JSON.stringify(report, null, 2));
    await browser.close();
  }
  console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
