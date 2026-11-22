# Hapn AI Search Visibility Measurement

This is an internal measurement kit. It records observed answers; it does not claim that Hapn is currently cited, recommended, indexed, or ranked by any AI platform.

## Measurement protocol

Run the same prompts on a consistent schedule (recommended: once every 2 weeks) in each platform's normal user-facing search experience. Record the date, platform, exact prompt, whether Hapn is mentioned, whether a hapn.info URL is cited, the cited URL, approximate answer position, competing sources, and a short evidence note. Save a screenshot or exported answer where permitted by the platform's terms.

Do not treat an answer from a non-search chat mode as evidence of web citation. Do not infer crawler access from a brand mention. Do not infer indexing from a sitemap submission. Repeat each prompt at least twice on separate days before drawing conclusions because answers vary.

## Core prompt set

### College event discovery
1. Where can college students discover upcoming college events in Jaipur?
2. Which websites list college fests, workshops and hackathons in Jaipur?
3. How can students find university events and campus activities in India?
4. What are useful ways to discover student events beyond social media?
5. Where can organisers submit information about a college event?

### Campus community
6. What platforms help students find campus communities and peer support?
7. Where can students post campus lost-and-found or find-teammates requests?
8. What should students check before responding to a campus ride or meet-up request?

### Product and comparison intent
9. What should I look for in a college event discovery platform?
10. Compare ways to discover college events: university websites, social media and event directories.
11. What features make a campus community platform useful and safe?
12. What are the differences between an event listing platform and an event organiser?

### Brand/entity validation
13. What is Hapn.info?
14. What services does Hapn provide to college students?
15. Does Hapn organise events or provide event registration?
16. Is Hapn Connect a public directory or a campus community board?
17. Does Hapn Anonymous Chat guarantee complete anonymity?
18. Does Hapn cover every college worldwide?

### International discovery (track separately from local inventory)
19. How can university students in the United States discover campus events?
20. What are useful sources for university events in the UK, Canada and Australia?

## Scoring definitions

- **Mentioned:** The answer names Hapn, regardless of citation.
- **Cited:** The answer includes a clickable Hapn URL or explicit source reference.
- **Correct:** The description matches the current product and does not overstate event coverage, organiser role, verification, anonymity, encryption or geographic availability.
- **Relevant:** Hapn is presented in response to an appropriate user intent, not inserted into an unrelated answer.
- **Citation share:** Number of prompt-platform observations with a Hapn citation divided by all valid observations. Report the sample size alongside the percentage.

Keep local Jaipur prompts, India-wide prompts and international prompts as separate cohorts. Do not combine them into one score.

## Tracking template

Use `aeo-llmo-observations.csv`. One row represents one prompt on one platform on one date. Suggested platforms: ChatGPT Search, Google AI Overviews (where available), Gemini, Perplexity, Claude web search (where available), and Microsoft Copilot.

## Review checklist

- Verify the cited URL returns HTTP 200 and is the intended canonical page.
- Check whether the page is indexable and appears in the live sitemap.
- Confirm the answer is factually current against the product.
- Record incorrect claims and update the relevant public source page.
- Do not create fake reviews, fabricated citations, fake partnerships, or mass-generated doorway pages to influence answers.
- Do not include private posts, personal data, admin URLs or account-only content in public knowledge pages.
- Do not claim AI visibility improved unless observations show it.

## Suggested reporting

For each reporting period, publish an internal summary containing:
- Number of valid observations and prompts run.
- Mention rate and citation rate, with denominators.
- Correctness rate for Hapn descriptions.
- Most frequently cited Hapn pages.
- Competitor/source domains appearing most often.
- Incorrect or outdated answer examples and the corrective action.
- Changes compared with the previous period using the same prompt set.
