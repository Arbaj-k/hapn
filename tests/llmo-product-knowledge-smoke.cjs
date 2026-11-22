'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const sitemap = fs.readFileSync('generate-sitemap.js','utf8');
const llms = fs.readFileSync('llms.txt','utf8');
const pages = ['events','fests','connect','anonymous-chat'];
for (const slug of pages) {
 const html = fs.readFileSync('knowledge/'+slug+'/index.html','utf8');
 assert.match(html, /<h1>/);
 assert.match(html, /application\/ld\+json/);
 assert.match(html, new RegExp('https://hapn.info/knowledge/'+slug+'/'));
 assert.match(sitemap, new RegExp("baseUrl \\+ '/knowledge/"+slug+"/'"));
 assert.match(llms, new RegExp('https://hapn.info/knowledge/'+slug+'/'));
}
assert.match(fs.readFileSync('knowledge/connect/index.html','utf8'), /not intended as a public searchable directory/);
assert.match(fs.readFileSync('knowledge/anonymous-chat/index.html','utf8'), /do not guarantee complete anonymity/);
console.log('[product-knowledge] four public guides, metadata, structured data, sitemap, llms and privacy guardrails passed');
