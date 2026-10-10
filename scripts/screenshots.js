#!/usr/bin/env node
/**
 * npm run screenshots
 * --------------------
 * Full-page screenshots of every page in the app (src/pages.js plus
 * index.html), at a desktop width (1280px) and a phone width (390px),
 * plus one extra screenshot per discrete interactive state on each
 * sims/ page (a preset or mode-toggle button, found generically rather
 * than hand-listed per page — see findStateButtons below) — "where
 * practical" means only discrete, reproducible button-driven states;
 * continuous sliders and "Animate" playback aren't snapshotted, since
 * neither has one meaningful still frame to stand for the whole range.
 *
 * Written to audit/screenshots/<commit-hash>/ (git status --porcelain
 * decides a trailing -dirty), never committed — see .gitignore and
 * this script's own final console summary for exactly where that
 * lands, since it's outside the repo's tracked history.
 *
 * Serves the static site from a throwaway local HTTP server (plain
 * Node http, no new dependency) rather than file:// URLs, the same way
 * this repo's own manual Playwright verification passes always have.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');
const { chromium } = require('playwright');
const { PAGES } = require('../src/pages.js');

const ROOT = path.join(__dirname, '..');
const DESKTOP_WIDTH = 1280;
const PHONE_WIDTH = 390;
const VIEWPORT_HEIGHT = 900;
const SETTLE_MS = 300; // lets a page's own synchronous initial draw (canvas, JS-filled tables) finish before the shot

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function startServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent(req.url.split('?')[0]);
      const resolved = path.normalize(path.join(ROOT, urlPath));
      if (!resolved.startsWith(ROOT)) {
        res.writeHead(403);
        res.end();
        return;
      }
      fs.readFile(resolved, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end();
          return;
        }
        const ext = path.extname(resolved);
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function outputDir() {
  let hash;
  try {
    hash = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    hash = 'no-commit';
  }
  let dirty = false;
  try {
    dirty = execSync('git status --porcelain', { cwd: ROOT }).toString().trim().length > 0;
  } catch {
    // not a git repo, or git unavailable — treat as not dirty, hash already covers the fallback
  }
  return path.join(ROOT, 'audit', 'screenshots', dirty ? `${hash}-dirty` : hash);
}

function slugifyHref(href) {
  return href.replace(/\.html$/, '').replace(/\//g, '_');
}

function slugifyText(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'state';
}

// Finds the discrete, button-driven states worth their own screenshot:
// preset/mode-toggle buttons (this codebase's own shared convention —
// see styles.css's .preset-button/.mode-toggle-button), plus any other
// visible, enabled button carrying aria-pressed (a few pages use
// .secondary-button for a real toggle, not just "Animate"). "Animate"/
// "Play" buttons are excluded — they start continuous motion, not a
// single state — and so is anything already disabled or hidden.
async function findStateButtons(page) {
  return page.evaluate(() => {
    const candidates = Array.from(
      document.querySelectorAll('button.preset-button, button.mode-toggle-button, button[aria-pressed]')
    );
    const seen = new Set();
    const parents = [];
    const result = [];
    candidates.forEach((button) => {
      if (seen.has(button)) return;
      seen.add(button);
      const text = (button.textContent || '').trim().replace(/\s+/g, ' ');
      if (/animate|play|pause/i.test(text)) return;
      if (button.disabled) return;
      if (button.offsetParent === null) return; // not visible
      let groupIndex = parents.indexOf(button.parentElement);
      if (groupIndex === -1) {
        parents.push(button.parentElement);
        groupIndex = parents.length - 1;
      }
      const tagIndex = result.length;
      button.setAttribute('data-ss-index', String(tagIndex));
      result.push({ index: tagIndex, group: groupIndex, text });
    });
    return result;
  });
}

async function shootFullPage(page, filePath) {
  await page.waitForTimeout(SETTLE_MS);
  await page.screenshot({ path: filePath, fullPage: true });
}

const CLICK_TIMEOUT_MS = 5000; // fails fast rather than hanging if a button is never actionable

async function screenshotPage(browser, href, outDir, manifest) {
  const slug = slugifyHref(href);
  const url = `${manifest.baseUrl}/${href}`;
  const isSim = href.startsWith('sims/');

  for (const { label, width } of [
    { label: 'desktop', width: DESKTOP_WIDTH },
    { label: 'phone', width: PHONE_WIDTH },
  ]) {
    const page = await browser.newPage({ viewport: { width, height: VIEWPORT_HEIGHT } });
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    try {
      await page.goto(url, { waitUntil: 'load' });
      const file = path.join(outDir, `${slug}__${label}.png`);
      await shootFullPage(page, file);
      manifest.images.push({ href, width: label, state: null, file: path.relative(outDir, file) });
      manifest.count += 1;
      console.log(`  ${href} (${label})`);
      if (errors.length) manifest.pageErrors.push({ href, width: label, errors });

      // Interactive states: desktop width only, sims/ pages only (see
      // this script's own header comment for why).
      if (isSim && label === 'desktop') {
        // Metadata only (text/group) — the data-ss-index attribute this
        // tags is on *this* page's live DOM, which gets thrown away by
        // the reload() below, so it's re-applied fresh before every
        // click rather than reused across reloads.
        const buttons = await findStateButtons(page);
        for (const button of buttons) {
          const stateErrors = [];
          const onErr = (err) => stateErrors.push(err.message);
          page.on('pageerror', onErr);
          try {
            await page.reload({ waitUntil: 'load' });
            await page.waitForTimeout(SETTLE_MS);
            await findStateButtons(page); // re-tag the freshly-loaded DOM
            await page.locator(`[data-ss-index="${button.index}"]`).click({ timeout: CLICK_TIMEOUT_MS });
            const stateSlug = `g${button.group}-${slugifyText(button.text)}`;
            const stateFile = path.join(outDir, `${slug}__${label}__state-${stateSlug}.png`);
            await shootFullPage(page, stateFile);
            manifest.images.push({ href, width: label, state: button.text, file: path.relative(outDir, stateFile) });
            manifest.count += 1;
            console.log(`  ${href} (${label}, state: ${button.text})`);
            if (stateErrors.length) manifest.pageErrors.push({ href, width: label, state: button.text, errors: stateErrors });
          } catch (err) {
            manifest.failures.push({ href, width: label, state: button.text, error: err.message });
            console.log(`  ${href} (${label}, state: ${button.text}) FAILED: ${err.message.split('\n')[0]}`);
          } finally {
            page.off('pageerror', onErr);
          }
        }
      }
    } catch (err) {
      manifest.failures.push({ href, width: label, error: err.message });
      console.log(`  ${href} (${label}) FAILED: ${err.message.split('\n')[0]}`);
    } finally {
      await page.close();
    }
  }
}

async function main() {
  const startedAt = Date.now();
  const server = await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const outDir = outputDir();
  fs.mkdirSync(outDir, { recursive: true });

  const pages = [{ href: 'index.html' }, ...PAGES];
  const manifest = { baseUrl, count: 0, images: [], pageErrors: [], failures: [] };

  console.log(`Writing to ${outDir}`);
  const browser = await chromium.launch();
  try {
    for (const [i, { href }] of pages.entries()) {
      console.log(`[${i + 1}/${pages.length}] ${href}`);
      await screenshotPage(browser, href, outDir, manifest);
    }
  } finally {
    await browser.close();
    server.close();
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const elapsedSeconds = (Date.now() - startedAt) / 1000;
  console.log(`\n${manifest.count} screenshots written to ${outDir}`);
  console.log(`${pages.length} pages x (desktop + phone) plus interactive states on sims/ pages`);
  console.log(`Took ${elapsedSeconds.toFixed(1)}s`);
  if (manifest.pageErrors.length) {
    console.log(`\n${manifest.pageErrors.length} page(s) logged a JS error during capture (see manifest.json):`);
    manifest.pageErrors.forEach((e) => console.log(`  ${e.href} (${e.width}${e.state ? `, state: ${e.state}` : ''}): ${e.errors.join('; ')}`));
  }
  if (manifest.failures.length) {
    console.log(`\n${manifest.failures.length} screenshot(s) failed outright:`);
    manifest.failures.forEach((f) => console.log(`  ${f.href} (${f.width}${f.state ? `, state: ${f.state}` : ''}): ${f.error}`));
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
