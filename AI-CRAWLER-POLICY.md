# Hapn AI crawler and search access policy

This repository configures public-page retrieval separately from model-training preferences.

## Public search/retrieval crawlers

The current `robots.txt` explicitly permits:
- `OAI-SearchBot` and `ChatGPT-User` for OpenAI search/user-requested page retrieval.
- `PerplexityBot` for Perplexity search retrieval.
- `ClaudeBot` as currently configured for public-page retrieval.

The wildcard rule permits ordinary public web crawlers. Keep account-only feeds, private messages, admin routes, moderation tools, and personal data out of public sitemaps and indexable pages regardless of crawler policy.

## Important limitations

- A robots.txt Allow rule is a request, not an access-control boundary. It does not override authentication, server permissions, CDN bot protection, rate limits, or crawler product policies.
- Allowing a crawler does not guarantee crawling, indexing, citation, or appearance in AI answers.
- Search/retrieval crawlers are distinct from model-training crawlers. Do not add training-oriented agents such as `GPTBot` or `Google-Extended` as a side effect of enabling search retrieval. Make any training-use policy decision separately and deliberately.
- Verify live `https://hapn.info/robots.txt`, `/sitemap.xml`, and representative public pages after deployment. Repository configuration alone does not prove production behavior.

## Regression checks

Run `node tests/ai-crawler-access-smoke.cjs` to check the repository's crawler directives, sitemap declaration and AI knowledge references.
