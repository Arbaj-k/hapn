'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const page = fs.readFileSync('international-university-events/index.html', 'utf8');
const sitemap = fs.readFileSync('generate-sitemap.js', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const university = fs.readFileSync('university-events/index.html', 'utf8');
const events = fs.readFileSync('events/index.html', 'utf8');

assert.match(page, /<title>International University Events &amp; Student Activities \| Hapn<\/title>/);
assert.match(page, /<link rel="canonical" href="https:\/\/hapn\.info\/international-university-events\/">/);
assert.match(page, /"@type":"WebPage"/);
assert.match(page, /"@type":"FAQPage"/);
assert.match(page, /United States/);
assert.match(page, /United Kingdom/);
assert.match(page, /Canada/);
assert.match(page, /Australia/);
assert.match(page, /does not claim comprehensive listings/);
assert.match(page, /not claims that Hapn currently has event inventory/);
assert.match(page, /href="\/submit-event\/">/);
assert.match(sitemap, /baseUrl \+ '\/international-university-events\/'/);
// Keep the homepage footer focused on essential links; detailed GEO guides
// remain discoverable from the university and events hubs.
for (const [name, source] of Object.entries({university, events})) {
  assert.match(source, /href="\/international-university-events\/">/, name + ' must link to international guide');
}
assert.doesNotMatch(home, /href="\/international-university-events\/">/, 'homepage footer should not carry secondary GEO links');
console.log('[international-geo] canonical, WebPage/FAQ schema, regional guide, coverage caveat, sitemap and internal links passed');
