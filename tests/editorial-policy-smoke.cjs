'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const page = fs.readFileSync('editorial-policy/index.html', 'utf8');
const sitemapGenerator = fs.readFileSync('generate-sitemap.js', 'utf8');
const about = fs.readFileSync('about/index.html', 'utf8');
const help = fs.readFileSync('help/index.html', 'utf8');
const llms = fs.readFileSync('llms.txt', 'utf8');

assert.match(page, /<title>Editorial &amp; Event Listing Standards \| Hapn<\/title>/);
assert.match(page, /<link rel="canonical" href="https:\/\/hapn\.info\/editorial-policy\/">/);
assert.match(page, /<h1>Editorial &amp; Event Listing Standards<\/h1>/);
assert.match(page, /not be interpreted as independent confirmation of every claim/);
assert.match(page, /mailto:collegeevent28@gmail\.com/);
assert.match(sitemapGenerator, /baseUrl \+ '\/editorial-policy\/'/);
assert.match(about, /href="\/editorial-policy\/">Editorial Standards/);
assert.match(help, /href="\/editorial-policy\/">Editorial Standards/);
assert.match(llms, /https:\/\/hapn\.info\/editorial-policy\//);

console.log('[editorial-policy] canonical, sitemap, transparency and correction links passed');
