'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const guide = fs.readFileSync('docs/aeo-llmo-measurement.md','utf8');
const csv = fs.readFileSync('docs/aeo-llmo-observations.csv','utf8');
for (const phrase of ['does not claim','Mentioned','Cited','Correct','Citation share','private posts','fabricated citations','Jaipur prompts']) assert.ok(guide.includes(phrase), 'missing measurement guardrail: '+phrase);
for (const col of ['date','platform','prompt_id','mentioned','cited','cited_url','correct','relevant','evidence_note']) assert.ok(csv.split('\n')[0].split(',').includes(col), 'missing CSV column: '+col);
assert.ok((guide.match(/^\d+\./gm)||[]).length >= 20, 'expected at least 20 repeatable prompts');
console.log('[ai-visibility-measurement] prompt set, observation fields and anti-fabrication guardrails passed');
