'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');

const llms = fs.readFileSync('llms.txt', 'utf8');
const robots = fs.readFileSync('robots.txt', 'utf8');
const homepage = fs.readFileSync('index.html', 'utf8');
const about = fs.readFileSync('about/index.html', 'utf8');

assert.match(llms, /Hapn is a campus discovery and community platform/);
assert.match(llms, /https:\/\/hapn\.info\/events\/directory\//);
assert.match(llms, /https:\/\/hapn\.info\/university-events\//);
assert.match(llms, /Does Hapn list every college or university worldwide\?/);
assert.match(llms, /does not guarantee complete or permanent anonymity/);
assert.match(llms, /Private, account-only community feeds/);
assert.match(llms, /https:\/\/hapn\.info\/editorial-policy\//);
assert.match(robots, /User-agent: OAI-SearchBot/);
assert.match(robots, /User-agent: PerplexityBot/);
assert.match(robots, /User-agent: ClaudeBot/);
assert.match(homepage, /"@type":"Organization"/);
assert.match(homepage, /"@id":"https:\/\/hapn\.info\/#organization"/);
assert.match(homepage, /"publisher":\{"@id":"https:\/\/hapn\.info\/#organization"\}/);
assert.match(about, /"@type":"AboutPage"/);
assert.match(about, /"about":\{"@id":"https:\/\/hapn\.info\/#organization"\}/);

console.log('[llmo-brand-knowledge] llms.txt, crawler guidance, entity graph and AboutPage schema passed');
