/**
 * The "next page" link shown at the bottom of every sims/ and notes/
 * page (see nextPage.js and notes/TEMPLATE.md section 5), checked two
 * ways: the pure sequencing logic against small fixtures and against
 * the real RECOMMENDED_PATH, then the shared markup every registered
 * page must carry.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PAGES, RECOMMENDED_PATH } = require('../src/pages');
const { resolveNextStep } = require('../nextPage');

const ROOT = path.join(__dirname, '..');

function read(href) {
  return fs.readFileSync(path.join(ROOT, href), 'utf8');
}

// --- resolveNextStep, pure logic -------------------------------------------

test('resolveNextStep: steps through a small fixture path in order', () => {
  const recommendedPath = [
    { phase: 'A', steps: [{ href: 'sims/one.html' }, { href: 'sims/two.html' }] },
    { phase: 'B', steps: [{ href: 'notes/three.html' }] },
  ];
  const pages = [
    { href: 'sims/one.html', title: 'One' },
    { href: 'sims/two.html', title: 'Two' },
    { href: 'notes/three.html', title: 'Three' },
  ];
  assert.deepEqual(resolveNextStep('sims/one.html', recommendedPath, pages), { done: false, next: pages[1] });
  assert.deepEqual(resolveNextStep('sims/two.html', recommendedPath, pages), { done: false, next: pages[2] });
});

test('resolveNextStep: the last step on the path reports done, not a next page', () => {
  const recommendedPath = [{ phase: 'A', steps: [{ href: 'sims/one.html' }, { href: 'sims/two.html' }] }];
  const pages = [{ href: 'sims/one.html', title: 'One' }, { href: 'sims/two.html', title: 'Two' }];
  assert.deepEqual(resolveNextStep('sims/two.html', recommendedPath, pages), { done: true });
});

test('resolveNextStep: a page not on the path at all returns null', () => {
  const recommendedPath = [{ phase: 'A', steps: [{ href: 'sims/one.html' }] }];
  const pages = [{ href: 'sims/one.html', title: 'One' }];
  assert.equal(resolveNextStep('sims/unknown.html', recommendedPath, pages), null);
});

test('resolveNextStep against the real data: every page but the last resolves to the true next step', () => {
  const flat = RECOMMENDED_PATH.flatMap((phase) => phase.steps);
  assert.ok(flat.length > 1);
  flat.forEach((step, i) => {
    const result = resolveNextStep(step.href, RECOMMENDED_PATH, PAGES);
    if (i === flat.length - 1) {
      assert.deepEqual(result, { done: true }, `${step.href} should be the last page on the path`);
    } else {
      assert.ok(result && result.done === false, `${step.href} should have a next page`);
      assert.equal(result.next.href, flat[i + 1].href, `${step.href}'s next should be ${flat[i + 1].href}`);
    }
  });
});

// --- Every registered page carries the shared markup -----------------------

PAGES.forEach((page) => {
  test(`${page.href}: has an empty #next-page paragraph as the last thing in <main>`, () => {
    const html = read(page.href);
    const main = /<main>([\s\S]*)<\/main>/.exec(html)[1];
    assert.ok(
      /<p class="next-page-link" id="next-page"><\/p>\s*$/.test(main),
      `${page.href}: #next-page should be the last element in <main>`
    );
  });

  test(`${page.href}: loads src/pages.js, and nextPage.js is the very last script`, () => {
    const html = read(page.href);
    const scripts = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]);
    assert.ok(scripts.includes('../src/pages.js'), 'loads src/pages.js');
    assert.equal(scripts.at(-1), '../nextPage.js', 'nextPage.js is the last script tag');
  });
});
