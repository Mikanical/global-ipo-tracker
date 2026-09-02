const { chromium } = require('playwright');
const path = require('path');

const URL = process.argv[2] || ('file://' + path.resolve(__dirname, 'index.html'));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 1100 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const rowCount = () => page.locator('tbody tr.row').count();
  const log = (...a) => console.log(...a);

  log('1. initial rows            :', await rowCount());
  log('   stat: entries shown     :', await page.locator('#s1').textContent());
  log('   stat: exchanges         :', await page.locator('#s2').textContent());
  log('   stat: named issuers     :', await page.locator('#s3').textContent());
  log('   stat: disclosed val     :', await page.locator('#s4').textContent());

  // --- search
  await page.fill('#q', 'monzo');
  await page.waitForTimeout(200);
  log('2. search "monzo"          :', await rowCount(), '->', await page.locator('tbody tr.row .co').first().textContent());

  await page.fill('#q', 'biotech');
  await page.waitForTimeout(200);
  log('   search "biotech"        :', await rowCount());

  await page.fill('#q', 'zzzznope');
  await page.waitForTimeout(200);
  log('   search no-match rows    :', await rowCount(), '| empty msg shown:', await page.locator('.empty').isVisible());
  await page.fill('#q', '');
  await page.waitForTimeout(200);

  // --- exchange filter
  await page.selectOption('#fx', 'TADAWUL');
  await page.waitForTimeout(200);
  log('3. filter TADAWUL          :', await rowCount());
  await page.selectOption('#fx', 'XETRA');
  await page.waitForTimeout(200);
  log('   filter XETRA            :', await rowCount());
  await page.selectOption('#fx', '');

  // --- sector filter
  await page.selectOption('#fs', 'FinTech');
  await page.waitForTimeout(200);
  log('4. filter FinTech          :', await rowCount());
  await page.selectOption('#fs', 'AI & Semiconductors');
  await page.waitForTimeout(200);
  log('   filter AI & Semis       :', await rowCount());
  await page.selectOption('#fs', '');

  // --- combined
  await page.selectOption('#fx', 'LSE');
  await page.selectOption('#fs', 'FinTech');
  await page.waitForTimeout(200);
  log('5. LSE + FinTech combined  :', await rowCount());
  await page.click('#clear');
  await page.waitForTimeout(200);
  log('   after Reset             :', await rowCount());

  // --- sorting
  async function firstAfterSort(label) {
    await page.click(`thead th[data-k="${label}"]`);
    await page.waitForTimeout(150);
    const asc = await page.locator('tbody tr.row .co').first().textContent();
    await page.click(`thead th[data-k="${label}"]`);
    await page.waitForTimeout(150);
    const desc = await page.locator('tbody tr.row .co').first().textContent();
    return { asc, desc };
  }
  const s1 = await firstAfterSort('company');
  log('6. sort company  asc/desc  :', s1.asc, '/', s1.desc);
  const s2 = await firstAfterSort('valuation');
  log('   sort valuation asc/desc :', s2.asc, '/', s2.desc);
  const s3 = await firstAfterSort('date');
  log('   sort date asc/desc      :', s3.asc, '/', s3.desc);
  await page.click('#clear'); await page.waitForTimeout(200);

  // --- expand
  await page.locator('tbody tr.row').first().click();
  await page.waitForTimeout(250);
  log('7. detail panel opens      :', await page.locator('tr.detail').count() === 1);
  log('   sources links in detail :', await page.locator('tr.detail .srcs a').count());
  await page.locator('tbody tr.row').first().click();
  await page.waitForTimeout(200);
  log('   detail closes on retap  :', await page.locator('tr.detail').count() === 0);

  // --- bookmark + persistence
  await page.locator('button[data-star]').first().click();
  await page.waitForTimeout(200);
  log('8. bookmark count          :', await page.locator('#bmn').textContent());
  await page.click('#bm'); await page.waitForTimeout(200);
  log('   saved-only view rows    :', await rowCount());
  await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(400);
  log('   persists after reload   :', await page.locator('#bmn').textContent());

  // --- copy button present
  log('9. copy buttons on page    :', await page.locator('button[data-mail]').count());

  // --- CSV export
  await page.click('#clear'); await page.waitForTimeout(200);
  const dl = await Promise.all([
    page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
    page.click('#csv')
  ]);
  if (dl[0]) {
    const p = await dl[0].path();
    const fs = require('fs');
    const csv = fs.readFileSync(p, 'utf8');
    const lines = csv.trim().split(/\r?\n/);
    log('10. CSV download           :', dl[0].suggestedFilename());
    log('    CSV lines (hdr+rows)   :', lines.length);
    log('    CSV header cols        :', (lines[0].match(/","/g) || []).length + 1);
  } else {
    log('10. CSV download           : FAILED');
    errors.push('CSV download did not fire');
  }

  // --- N/A handling present
  log('11. N/A cells rendered      :', await page.locator('.na').count());

  await page.screenshot({ path: '_shot-full.png', fullPage: false });
  await page.locator('tbody tr.row').nth(0).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: '_shot-detail.png', fullPage: false });

  log('\nJS ERRORS:', errors.length ? errors : 'none');
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
