'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const robots = fs.readFileSync('robots.txt','utf8');
const sitemap = fs.readFileSync('generate-sitemap.js','utf8');
const llms = fs.readFileSync('llms.txt','utf8');

function sectionFor(agent) {
  const lines = robots.split(/\r?\n/);
  const sections = [];
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (/^User-agent:/i.test(line)) {
      current = { agent: line.split(':').slice(1).join(':').trim(), rules: [] };
      sections.push(current);
    } else if (current) current.rules.push(line);
  }
  return sections.filter(s => s.agent.toLowerCase() === agent.toLowerCase());
}
function allowsAll(section) {
  return section.rules.some(rule => /^Allow:\s*\/$/i.test(rule)) &&
    !section.rules.some(rule => /^Disallow:\s*\/$/i.test(rule));
}
assert.ok(allowsAll(sectionFor('*')[0] || {rules:[]}), 'general crawlers must be allowed');
for (const agent of ['OAI-SearchBot','ChatGPT-User','PerplexityBot','ClaudeBot']) {
  const sections = sectionFor(agent);
  assert.ok(sections.length > 0, agent+' must have an explicit robots section');
  assert.ok(sections.some(allowsAll), agent+' must be allowed to fetch public pages');
}
assert.match(robots, /Sitemap:\s*https:\/\/hapn\.info\/sitemap\.xml/i);
assert.match(sitemap, /baseUrl \+ '\/answers\/'/);
for (const slug of ['events','fests','connect','anonymous-chat']) {
  assert.match(sitemap, new RegExp("baseUrl \\+ '/knowledge/"+slug+"/'"));
  assert.match(llms, new RegExp('https://hapn.info/knowledge/'+slug+'/'));
}
assert.match(llms, /https:\/\/hapn\.info\/answers\//);
console.log('[ai-crawler-readiness] robots access, sitemap declaration and AI knowledge references passed');
