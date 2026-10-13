# GCSE Astronomy

A free, static website of interactive simulations and reference notes for the GCSE Astronomy
specification — orbits and retrograde motion, eclipses, tides, telescopes, the equation of time,
sundials, Kepler's laws, and more. Simulations live in `sims/`, reference pages in `notes/`.

There's no build step and no server: every page is a plain HTML file with its own JavaScript,
and the whole site runs straight from a browser, opened as local files or served from any static
host.

## Running the tests

The test suite is plain [`node:test`](https://nodejs.org/api/test.html) — no test runner to
install beyond Node.js itself (18 or later) and this repo's one dev dependency, Playwright, used
by a handful of tests that need a real browser.

```sh
npm install
npm test
```

That runs every file in `test/`: unit tests for the astronomy engines in `src/`, and structural
checks on the HTML pages themselves (page templates, curriculum coverage, security headers, and
so on).

`npm install` installs the Playwright *package* but not the browser it drives. The handful of
tests that need a real rendered page (layout and accessibility checks that can't be read off the
raw HTML) notice this and skip themselves with a message rather than failing the whole suite. Run

```sh
npx playwright install chromium
```

once to download that browser and have those tests actually run instead of skip.

## Privacy

This site collects and sends nothing. There's no analytics, no tracking pixel, no sign-up, and no
server for your data to go to — every page runs entirely in your own browser.

The only thing the site stores is a tally of which practice questions you've got right and wrong
so far, kept in your browser's own `localStorage` and never sent anywhere. Clearing your browser's
site data for this site deletes it. That would change if the site ever grew an account system, a
backend, or analytics of its own — none of which exist today.

One thing is outside the site's own control: like any website, this one is hosted somewhere, and
a host's own server logs typically see each visitor's IP address regardless of what the site
itself does. This repository, and the site built from it, is hosted on GitHub — see
[GitHub's own privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
for what it logs and for how long.
