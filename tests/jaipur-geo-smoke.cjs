'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const page = fs.readFileSync('jaipur-college-events/index.html', 'utf8');
const sitemap = fs.readFileSync('generate-sitemap.js', 'utf8');
const home = fs.readFileSync('index.html', 'utf8');
const events = fs.readFileSync('events/index.html', 'utf8');

assert.match(page, /<title>College Events in Jaipur/);
assert.match(page, /<link rel="canonical" href="https:\/\/hapn\.info\/jaipur-college-events\/">/);
assert.match(page, /"@type":"CollectionPage"/);
assert.match(page, /"@type":"FAQPage"/);
assert.match(page, /"@type":"City","name":"Jaipur"/);
assert.match(page, /does not claim to list every Jaipur college event/);
assert.match(page, /not independent verification of every event claim/);
assert.match(page, /href="\/submit-event\/">/);
assert.match(sitemap, /baseUrl \+ '\/jaipur-college-events\/'/);
// Detailed local SEO guide is linked from the Events hub, not the compact primary navigation.
assert.doesNotMatch(home, /href="\/jaipur-college-events\/">/, 'primary navigation should not include secondary location links');
assert.match(events, /href="\/jaipur-college-events\/">/);
console.log('[jaipur-geo] canonical, local entity schema, FAQ, honest coverage, sitemap and internal links passed');
