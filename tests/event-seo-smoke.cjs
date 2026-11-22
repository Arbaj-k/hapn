'use strict';

const assert = require('node:assert/strict');
const { eventSlug, eventPath, eventPageHtml, eventDirectoryHtml, safeHttpsUrl, isSeoEligibleEvent } = require('../generate-sitemap');

const event = {
  id: '15249dc1-49fe-42cf-9c18-fbe02d19b511',
  title: 'Jaipur Tech & Innovation Fest 2026',
  short_description: 'A student technology festival with workshops, competitions and demonstrations.',
  description: 'Join students and mentors for a full day of technology workshops, coding competitions, project demonstrations and campus networking.',
  date: '2026-12-10',
  time: '09:30:00',
  end_date: '2026-12-10',
  end_time: '17:00:00',
  venue: 'VGU Campus',
  organizer: 'Student Council',
  category: 'Technology',
  poster_url: 'https://hapn.info/assets/images/og-image.png',
  registration_link: 'https://example.com/register',
  updated_at: '2026-11-20T12:30:00Z'
};

assert.equal(eventSlug(event), 'jaipur-tech-innovation-fest-2026-15249dc1-49fe-42cf-9c18-fbe02d19b511');
assert.equal(eventPath(event), '/event/jaipur-tech-innovation-fest-2026-15249dc1-49fe-42cf-9c18-fbe02d19b511/');
assert.equal(safeHttpsUrl('javascript:alert(1)'), null);
assert.equal(isSeoEligibleEvent(event), true);
assert.equal(isSeoEligibleEvent({ ...event, date: '' }), false);
assert.equal(isSeoEligibleEvent({ ...event, title: '' }), false);
assert.equal(isSeoEligibleEvent({ ...event, id: '' }), false);

const html = eventPageHtml(event);
assert.match(html, /<title>Jaipur Tech &amp; Innovation Fest 2026 – College Event \| Hapn<\/title>/);
assert.match(html, /<h1>Jaipur Tech &amp; Innovation Fest 2026<\/h1>/);
assert.match(html, /<link rel="canonical" href="https:\/\/hapn\.info\/event\/jaipur-tech-innovation-fest-2026-15249dc1-49fe-42cf-9c18-fbe02d19b511\/">/);
assert.match(html, /<meta name="description" content="A student technology festival/);
assert.equal(html.includes('\\n<meta name="robots"'), false);
assert.match(html, /"@type":"Event"/);
assert.match(html, /"eventStatus":"https:\/\/schema.org\/EventScheduled"/);
assert.match(html, /"dateModified":"2026-11-20T12:30:00.000Z"/);
assert.match(html, /Listing last updated/);

assert.match(html, /"addressLocality":"Jaipur"/);
assert.match(html, /Register Now/);
assert.match(html, /Poster for Jaipur Tech &amp; Innovation Fest 2026/);

const description = html.match(/<meta name="description" content="([^"]*)"/);
assert.ok(description && description[1].length <= 160, 'meta description should be <=160 characters');

const pastHtml = eventPageHtml({ id: 'past-1', title: 'Past event', date: '2020-01-01', end_date: '2020-01-01', time: '10:00:00', end_time: '11:00:00', venue: 'Hall' });
assert.match(pastHtml, /"eventStatus":"https:\/\/schema.org\/EventCompleted"/);

const directory = eventDirectoryHtml([event]);
assert.ok(directory.includes('<h1>College Events Directory</h1>'));
assert.ok(directory.includes('https://hapn.info/event/jaipur-tech-innovation-fest-2026-15249dc1-49fe-42cf-9c18-fbe02d19b511/'));
assert.ok(directory.includes('<meta name="robots" content="index, follow'));
assert.ok(directory.includes('1 published event listings'));

console.log('[event-seo] clean URLs, eligibility, freshness, Event schema, metadata, directory links and safe links passed');
