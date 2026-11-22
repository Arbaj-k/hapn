'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const page = fs.readFileSync('campus-partners/index.html', 'utf8');
const sitemap = fs.readFileSync('generate-sitemap.js', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const submit = fs.readFileSync('submit-event/index.html', 'utf8');

assert.match(page, /<title>Campus Partners &amp; Student Organisers \| Hapn<\/title>/);
assert.match(page, /<link rel="canonical" href="https:\/\/hapn\.info\/campus-partners\/">/);
assert.match(page, /"@type":"FAQPage"/);
assert.match(page, /Does submitting an event guarantee publication\?/);
assert.match(page, /does not automatically establish an official partnership/);
assert.match(page, /collegeevent28@gmail\.com/);
assert.match(page, /href="\/submit-event\/">/);
assert.match(sitemap, /baseUrl \+ '\/campus-partners\/'/);
assert.match(home, /href="\/campus-partners\/">/);
assert.match(submit, /href="\/campus-partners\/">/);
console.log('[campus-partners] canonical, FAQs, honest claims, contact, internal links and sitemap passed');
