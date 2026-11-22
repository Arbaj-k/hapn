'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const page = fs.readFileSync('trust/index.html', 'utf8');
const sitemap = fs.readFileSync('generate-sitemap.js', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const about = fs.readFileSync('about/index.html', 'utf8');
const editorial = fs.readFileSync('editorial-policy/index.html', 'utf8');
const help = fs.readFileSync('help/index.html', 'utf8');
const terms = fs.readFileSync('terms/index.html', 'utf8');

assert.match(page, /<title>Trust, Transparency &amp; Editorial Responsibility \| Hapn<\/title>/);
assert.match(page, /<link rel="canonical" href="https:\/\/hapn\.info\/trust\/">/);
assert.match(page, /"@type":"WebPage"/);
assert.match(page, /"@type":"FAQPage"/);
assert.match(page, /Who publishes Hapn\?/);
assert.match(page, /not independent verification of every claim/);
assert.match(page, /does not establish a partnership, endorsement or affiliation/);
assert.match(page, /collegeevent28@gmail\.com/);
assert.match(sitemap, /baseUrl \+ '\/trust\/'/);
for (const [name, source] of Object.entries({home,about,editorial,help,terms})) {
  assert.match(source, /href="\/trust\/">Trust &amp; Transparency/ , name + ' should link to trust hub');
}
console.log('[trust-eeat] canonical, schema, transparency claims, corrections contact, sitemap and internal links passed');
