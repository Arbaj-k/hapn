'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const page = fs.readFileSync('university-events/index.html', 'utf8');
const sitemap = fs.readFileSync('generate-sitemap.js', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const events = fs.readFileSync('events/index.html', 'utf8');
const fests = fs.readFileSync('fests/index.html', 'utf8');

assert.match(page, /<title>University Events &amp; Campus Activities \| Hapn<\/title>/);
assert.match(page, /<link rel="canonical" href="https:\/\/hapn\.info\/university-events\/">/);
assert.match(page, /<h1>University Events &amp; Campus Activities<\/h1>/);
assert.match(page, /"@type":"FAQPage"/);
assert.match(page, /Does Hapn list every university worldwide\?/);
assert.match(page, /does not currently claim comprehensive coverage/);
assert.match(page, /href="\/events\/directory\/">/);
assert.match(page, /href="\/submit-event\/">/);
assert.match(sitemap, /baseUrl \+ '\/university-events\/'/);
// Homepage footer intentionally stays concise; detailed guide links live on relevant hubs.
assert.doesNotMatch(home, /href="\/university-events\/">/, 'homepage footer should not carry secondary guide links');
assert.match(events, /href="\/university-events\/">/);
assert.match(fests, /College &amp; University Fests/);

console.log('[international-university-events] page metadata, FAQ schema, factual coverage, internal links and sitemap passed');
