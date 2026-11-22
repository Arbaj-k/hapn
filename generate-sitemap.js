/* Generate a sitemap containing public pages and published event detail URLs. */
const fs = require('node:fs');
const path = require('node:path');
const baseUrl = 'https://hapn.info';
const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/\/$/, '');
const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim();

const staticUrls = [
  { loc: baseUrl + '/' },
  { loc: baseUrl + '/events/' },
  { loc: baseUrl + '/university-events/' },
  { loc: baseUrl + '/campus-partners/' },
  { loc: baseUrl + '/trust/' },
  { loc: baseUrl + '/jaipur-college-events/' },
  { loc: baseUrl + '/events/directory/' },
  { loc: baseUrl + '/about/' },
  { loc: baseUrl + '/editorial-policy/' },
  { loc: baseUrl + '/fests/' },
  { loc: baseUrl + '/hapn-connect/' },
  { loc: baseUrl + '/chat/' },
  { loc: baseUrl + '/help/' },
  { loc: baseUrl + '/terms/' },
  { loc: baseUrl + '/submit-event/' }
];


async function getPublishedEvents() {
  const apiUrl = supabaseUrl;
  const apiKey = anonKey;

  if (!apiUrl || !apiKey) {
    throw new Error('Supabase public configuration is missing.');
  }

  const url = apiUrl + '/rest/v1/events?select=id,title,description,short_description,date,time,end_date,end_time,venue,organizer,category,registration_link,poster_url,updated_at&is_published=eq.true&order=date.asc,time.asc';
  const response = await fetch(url, {
    headers: { apikey: apiKey, Authorization: 'Bearer ' + apiKey }
  });

  if (!response.ok) throw new Error('Supabase returned HTTP ' + response.status);
  return response.json();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch (_) {
    return null;
  }
}

function eventSlug(event) {
  const titleSlug = String(event.title || 'college-event')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '') || 'college-event';
  const id = String(event.id || '').toLowerCase();
  return titleSlug + '-' + id;
}

function eventPath(event) {
  return '/event/' + eventSlug(event) + '/';
}
function eventPageHtml(event) {
  const title = escapeHtml(event.title || 'College Event');
  const descriptionText = String(event.short_description || event.description || 'College event details and registration.').replace(/\s+/g, ' ').trim();
  const description = escapeHtml(event.description || event.short_description || 'College event details and registration.');
  const metaDescription = escapeHtml(descriptionText.length > 157 ? descriptionText.slice(0, 157).trimEnd() + '…' : descriptionText);
  const canonical = baseUrl + eventPath(event);
  const posterUrl = safeHttpsUrl(event.poster_url);
  const image = posterUrl ? escapeHtml(posterUrl) : baseUrl + '/assets/images/og-image.png';
  const date = escapeHtml(event.date || '');
  const endDate = escapeHtml(event.end_date || event.date || '');
  const time = escapeHtml(event.time || '');
  const endTime = escapeHtml(event.end_time || '');
  const venue = escapeHtml(event.venue || '');
  const organizer = escapeHtml(event.organizer || '');
  const category = escapeHtml(event.category || '');
  const registrationUrl = safeHttpsUrl(event.registration_link);
  const registration = registrationUrl ? escapeHtml(registrationUrl) : '';
  const dateText = date + (event.end_date ? ' – ' + endDate : '');
  const timeText = time + (event.end_time ? ' – ' + endTime : '');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title || 'College Event',
    description: event.description || event.short_description || 'College event details and registration.',
    startDate: event.date && event.time ? event.date + 'T' + event.time : event.date,
    endDate: event.end_date && event.end_time ? event.end_date + 'T' + event.end_time : (event.end_date || event.date),
    eventStatus: 'https://schema.org/EventScheduled',
    url: canonical,
    image: [event.poster_url || baseUrl + '/assets/images/og-image.png'],
    location: event.venue ? { '@type': 'Place', name: event.venue } : undefined
  };

  // VGU Campus has a verified public address; add it only when the event venue is VGU Campus.
  if (String(event.venue || '').trim().toLowerCase() === 'vgu campus') {
    schema.location.address = {
      '@type': 'PostalAddress',
      streetAddress: 'Sector-36, NRI Road, Jagatpura',
      addressLocality: 'Jaipur',
      postalCode: '303012',
      addressRegion: 'Rajasthan',
      addressCountry: 'IN'
    };
  }
  if (event.organizer) schema.organizer = { '@type': 'Organization', name: event.organizer };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-EYVRV7CS7B"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-EYVRV7CS7B');
  </script>
<title>${title} – College Event | Hapn</title>
<meta name="description" content="${metaDescription}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Hapn">
<meta property="og:title" content="${title} – College Event | Hapn">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} – College Event | Hapn">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${image}">
<link rel="icon" href="${baseUrl}/assets/images/logo.svg" type="image/svg+xml">
<link rel="stylesheet" href="${baseUrl}/css/style.css">
<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>
</head>
<body>
<header class="site-header"><div class="container header-inner">
<a class="brand" href="${baseUrl}/"><img src="${baseUrl}/assets/images/logo.svg" alt="" width="34" height="34"><span>Hapn</span></a>
<nav class="nav" aria-label="Main"><a href="${baseUrl}/">Home</a><a href="${baseUrl}/events/" aria-current="page">Events</a><a href="${baseUrl}/about/">About</a></nav>
</div></header>
<main id="main"><section class="section"><div class="container">
<a class="back-link" href="${baseUrl}/events/">Back to all events</a>
<article class="detail">
<div class="detail-poster detail-poster-wrap"><img class="poster-img" src="${image}" alt="Poster for ${title}" width="800" height="500"><button class="poster-share-button share-button" type="button" data-share-url="${canonical}" data-share-title="${title} – Hapn" data-share-image="${image}" data-share-text="Check out ${title} on Hapn!" aria-label="Share ${title}" title="Share event"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg></button></div>
<div class="detail-info">
${category ? '<span class="pill">' + category + '</span>' : ''}
<h1>${title}</h1>
<dl class="info-list">
${dateText ? '<div><dt>📅 Date</dt><dd>' + dateText + '</dd></div>' : ''}
${timeText ? '<div><dt>⏰ Time</dt><dd>' + timeText + '</dd></div>' : ''}
${venue ? '<div><dt>📍 Venue</dt><dd>' + venue + '</dd></div>' : ''}
${organizer ? '<div><dt>👥 Organizer</dt><dd>' + organizer + '</dd></div>' : ''}
</dl>
<h2 class="detail-text-title">About this event</h2>
<p class="detail-text">${description}</p>
${'<div class="detail-cta">' + (registration ? '<a class="btn btn-primary btn-lg" href="' + registration + '" target="_blank" rel="noopener noreferrer">Register Now</a>' : '') + '<button class="btn btn-outline share-button" type="button" data-share-url="' + canonical + '" data-share-title="' + title + ' – Hapn" data-share-image="' + image + '" data-share-text="Check out ' + title + ' on Hapn!" aria-label="Share this event"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4"/></svg> Share event</button></div>'}
</div>
</article>
</div></section></main>
<footer class="site-footer"><div class="container"><p class="footer-bottom">© 2026 Hapn</p></div></footer>
<script>
document.addEventListener('click', async function (event) {
  const button = event.target.closest('.share-button');
  if (!button) return;
  event.preventDefault();
  const url = new URL(button.getAttribute('data-share-url') || location.href, location.href).href;
  const title = button.getAttribute('data-share-title') || document.title;
  const imageValue = button.getAttribute('data-share-image') || '';
  const imageUrl = imageValue ? new URL(imageValue, location.href).href : '';
  const description = button.getAttribute('data-share-text') || 'Check this out on Hapn:';
  if (navigator.share) {
    try {
      if (imageUrl && navigator.canShare && typeof File !== 'undefined') {
        const response = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' });
        if (!response.ok) throw new Error('Poster download failed: ' + response.status);
        const blob = await response.blob();
        if (!blob.type || !blob.type.startsWith('image/')) throw new Error('Poster is not an image');
        const extension = (blob.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg').replace(/[^a-z0-9]/gi, '');
        const file = new File([blob], 'hapn-event-poster.' + extension, { type: blob.type });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title, text: description + '\n' + url });
          return;
        }
      }
      await navigator.share({ title, text: description, url });
      return;
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      console.warn('Event poster sharing failed; falling back to link:', error);
      try { await navigator.share({ title, text: description, url }); return; }
      catch (fallbackError) { if (fallbackError && fallbackError.name === 'AbortError') return; }
    }
  }
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(url);
    else {
      const input=document.createElement('textarea'); input.value=url; input.setAttribute('readonly','');
      input.style.position='fixed'; input.style.opacity='0'; document.body.appendChild(input); input.select();
      const copied=document.execCommand('copy'); input.remove(); if(!copied) throw new Error('Copy failed');
    }
    window.alert('Event link copied. Its page preview includes the poster.');
  } catch (error) { window.prompt('Copy this event link:', url); }
});
</script>
</body>
</html>`;
}

function eventDirectoryHtml(events) {
  const published = [...events].sort((a, b) => {
    const dateOrder = String(a.date || '9999-99-99').localeCompare(String(b.date || '9999-99-99'));
    return dateOrder || String(a.title || '').localeCompare(String(b.title || ''));
  });
  const categories = [...new Set(published.map((event) => String(event.category || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));
  const groups = categories.map((category) => ({
    name: category,
    events: published.filter((event) => String(event.category || '').trim() === category)
  }));
  const uncategorized = published.filter((event) => !String(event.category || '').trim());
  if (uncategorized.length) groups.push({ name: 'Other events', events: uncategorized });

  const eventRows = (items) => items.map((event) => {
    const title = escapeHtml(event.title || 'College Event');
    const url = baseUrl + eventPath(event);
    const date = escapeHtml(event.date || 'Date to be announced');
    const venue = escapeHtml(event.venue || 'Venue to be announced');
    const summary = escapeHtml(String(event.short_description || event.description || '').replace(/\s+/g, ' ').trim().slice(0, 180));
    return '<li class="directory-event"><a href="' + escapeHtml(url) + '">' + title + '</a><p>' + date + ' · ' + venue + '</p>' + (summary ? '<p>' + summary + '</p>' : '') + '</li>';
  }).join('');

  const sections = groups.map((group, index) =>
    '<section class="directory-category" aria-labelledby="directory-category-' + index + '"><h2 id="directory-category-' + index + '">' + escapeHtml(group.name) + '</h2><ul>' + eventRows(group.events) + '</ul></section>'
  ).join('');
  const description = 'Browse ' + published.length + ' published college event listings on Hapn, grouped by category with direct links to event details.';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>College Events Directory – Published Campus Events | Hapn</title>
<meta name="description" content="${escapeHtml(description.slice(0, 157))}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${baseUrl}/events/directory/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Hapn">
<meta property="og:title" content="College Events Directory | Hapn">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${baseUrl}/events/directory/">
<meta property="og:image" content="${baseUrl}/assets/images/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="College Events Directory | Hapn">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${baseUrl}/assets/images/og-image.png">
<link rel="icon" href="${baseUrl}/assets/images/logo.svg" type="image/svg+xml">
<link rel="stylesheet" href="${baseUrl}/css/style.css">
<style>
.directory-intro{max-width:760px;margin:0 auto 28px}
.directory-category{margin:30px 0}
.directory-category ul{list-style:none;padding:0;display:grid;gap:12px}
.directory-event{padding:16px;border:1px solid var(--border,#e5e7eb);border-radius:14px;background:var(--surface,#fff)}
.directory-event>a{font-weight:700;text-decoration:none}
.directory-event p{margin:6px 0 0;color:var(--muted,#64748b);line-height:1.5}
.directory-back{display:inline-flex;margin:0 0 18px}
</style>
</head>
<body>
<header class="site-header"><div class="container header-inner">
<a class="brand" href="${baseUrl}/"><img src="${baseUrl}/assets/images/logo.svg" alt="" width="34" height="34"><span>Hapn</span></a>
<nav class="nav" aria-label="Main"><a href="${baseUrl}/">Home</a><a href="${baseUrl}/events/" aria-current="page">Events</a><a href="${baseUrl}/about/">About</a></nav>
</div></header>
<main id="main">
<section class="page-head"><div class="container"><p class="eyebrow">Explore campus life</p><h1>College Events Directory</h1><p>Browse published college events on Hapn. Choose a category and open an event for its date, venue, organiser and registration information.</p></div></section>
<section class="section"><div class="container">
<a class="directory-back" href="${baseUrl}/events/">← Back to event search</a>
<div class="directory-intro"><p><strong>${published.length} published event listings</strong>. Event details are supplied by organisers and may change; confirm important arrangements directly with the organiser.</p></div>
${published.length ? sections : '<p>No public event listings are currently available. Please check the <a href="' + baseUrl + '/events/">events page</a> again soon.</p>'}
</div></section>
</main>
<footer class="site-footer"><div class="container"><p class="footer-bottom">© 2026 Hapn · <a href="${baseUrl}/editorial-policy/">Editorial Standards</a></p></div></footer>
</body>
</html>`;
}

function generateEventDirectory(events) {
  const directory = path.join('events', 'directory');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'index.html'), eventDirectoryHtml(events));
}

async function generateEventPages(events) {
  for (const event of events) {
    const directory = path.join('event', eventSlug(event));
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(path.join(directory, 'index.html'), eventPageHtml(event));
  }
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

async function main() {
  let events = [];
  try {
    events = await getPublishedEvents();
  } catch (error) {
    console.error('[sitemap] Could not fetch published events:', error.message);
    process.exit(1);
  }

  await generateEventPages(events);
  generateEventDirectory(events);

  const eventUrls = events.map((event) => ({
    loc: baseUrl + eventPath(event),
    lastmod: event.updated_at ? new Date(event.updated_at).toISOString() : undefined
  }));

  const urls = staticUrls.concat(eventUrls);

  if (events.length === 0) {
    throw new Error('No published events were returned; refusing to publish a sitemap without event URLs.');
  }

  const body = urls.map((item) => [
    '  <url>',
    '    <loc>' + escapeXml(item.loc) + '</loc>',
    item.lastmod ? '    <lastmod>' + escapeXml(item.lastmod) + '</lastmod>' : '',
    '  </url>'
  ].filter(Boolean).join('\n')).join('\n');

  fs.writeFileSync(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`
  );

  console.log('[sitemap] Generated ' + urls.length + ' URLs (' + events.length + ' published events).');
  console.log('[sitemap] Event URLs: ' + eventUrls.length);
}

if (require.main === module) main();

module.exports = { safeHttpsUrl, eventPageHtml, eventDirectoryHtml, eventSlug, eventPath };
