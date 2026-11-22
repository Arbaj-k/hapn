'use strict';

const assert = require('node:assert/strict');
const { eventSlug, eventPath, eventPageHtml, safeHttpsUrl } = require('../generate-sitemap');

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
  registration_link: 'https://example.com/register'
};

assert.equal(eventSlug(event), 'jaipur-tech-innovation-fest-2026-15249dc1-49fe-42cf-9c18-fbe02d19b511');
assert.equal(eventPath(event), '/event/jaipur-tech-innovation-fest-2026-15249dc1-49fe-42cf-9c18-fbe02d19b511/');
assert.equal(safeHttpsUrl('javascript:alert(1)'), null);

const html = eventPageHtml(event);
assert.match(html, /<title>Jaipur Tech &amp; Innovation Fest 2026 – College Event \| Hapn<\/title>/);
assert.match(html, /<h1>Jaipur Tech &amp; Innovation Fest 2026<\/h1>/);
assert.match(html, /<link rel="canonical" href="https:\/\/hapn\.info\/event\/jaipur-tech-innovation-fest-2026-15249dc1-49fe-42cf-9c18-fbe02d19b511\/">/);
assert.match(html, /<meta name="description" content="A student technology festival/);
assert.doesNotMatch(html, /\\\\n<meta name="robots"/);
assert.match(html, /"@type":"Event"/);
assert.match(html, /"addressLocality":"Jaipur"/);
assert.match(html, /Register Now/);
assert.match(html, /Poster for Jaipur Tech &amp; Innovation Fest 2026/);

const description = html.match(/<meta name="description" content="([^"]*)"/);
assert.ok(description && description[1].length <= 160, 'meta description should be <=160 characters');

console.log('[event-seo] clean URLs, prerendered H1, metadata, schema and safe links passed');
