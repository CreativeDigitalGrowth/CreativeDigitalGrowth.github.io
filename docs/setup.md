# One-time setup

Everything on this page is done once. The site builds and deploys without any of it —
missing pieces degrade gracefully rather than breaking — but each one unlocks something.

Status as of 2026-08-27:

| Step | Status |
| --- | --- |
| Repository created and pushed | ✅ done |
| GitHub Actions workflow deploying | ✅ done |
| Pages source set to GitHub Actions | ✅ done |
| Fine-grained PAT for the CMS | ❌ not created |
| Giscus comments | ❌ not configured |
| Contact form endpoint | ❌ not set |
| Author identity in `src/consts.ts` | ❌ still placeholder text |

---

## 1. Pages source ✅

**Settings → Pages → Build and deployment → Source: `GitHub Actions`**

Done on 2026-08-27. `build_type` reads `workflow`, and a dispatched run now produces a
single green pipeline with no accompanying `pages-build-deployment` job.

It matters because the alternative — *Deploy from a branch* — runs a Jekyll build
alongside the Astro workflow, and Jekyll cannot parse `.astro` files:

```
ERROR: YOUR SITE COULD NOT BE BUILT:
Invalid YAML front matter in /github/workspace/src/pages/about.astro
```

That is the Jekyll limitation this stack was chosen to avoid: category and tag archives
and pagination need a real build step, not a plugin whitelist.

> If this is ever switched back, do **not** reach for a `.nojekyll` file. Under
> branch-source mode it makes Pages skip Jekyll and publish the **raw repository root**
> (`src/`, `package.json`, …) instead of the built site. Changing the source setting is
> the only correct fix.

To confirm at any time:

```bash
gh api repos/aumniguest/blog/pages --jq '.build_type'   # expect: workflow
gh run list --repo aumniguest/blog --limit 3
```

## 2. Fine-grained PAT for the CMS

The CMS signs in with a GitHub Personal Access Token. There is no OAuth backend, no
serverless function and no client secret anywhere in this repository.

Create it at <https://github.com/settings/personal-access-tokens/new>:

| Field | Value |
| --- | --- |
| Resource owner | `aumniguest` |
| Repository access | **Only select repositories → `blog`** |
| Repository permissions → **Contents** | **Read and write** |
| Repository permissions → Metadata | Read-only (added automatically) |
| Expiration | Set one. 90 days is a reasonable default |

**Pull requests access is not needed** — `publish_mode: simple` in
`public/admin/config.yml` commits straight to `main`.

Then open <https://aumniguest.github.io/blog/admin/>, choose **"Sign In Using Access
Token"** and paste it.

> **Ignore the "Sign In with GitHub" button.** It starts an OAuth flow that needs a
> server to hold a client secret, which a static site cannot have. With no `base_url`
> configured, Sveltia falls back to Netlify's OAuth provider — which this site is not
> registered with — so it hangs on "Signing in…" rather than failing visibly. Sveltia
> offers no way to hide it. See
> [troubleshooting.md](troubleshooting.md#cms-sign-in-with-github-hangs-on-signing-in).

**Treat the token like a password.** It can read and write everything in this
repository. Do not paste it anywhere else, do not commit it, and revoke it from the
same settings page the moment you suspect it has leaked. See [SECURITY.md](../SECURITY.md).

## 3. Giscus comments

Comments are GitHub Discussions rendered by [Giscus](https://giscus.app). Until it is
configured, post pages show a one-line notice instead of the widget — nothing breaks.

1. **Settings → General → Features → ✅ Discussions**
2. Open the **Discussions** tab and make sure a category exists. The default expected by
   `src/consts.ts` is **Announcements**; any category works as long as the names match.
3. Install the app at <https://github.com/apps/giscus> and grant it access to
   `aumniguest/blog` **only**.
4. Go to <https://giscus.app>, enter `aumniguest/blog`, pick the category, and choose
   *Discussion title contains page pathname* for the mapping.
5. Copy the generated `data-repo-id` and `data-category-id` into `src/consts.ts`:

```ts
export const GISCUS = {
  repo: 'aumniguest/blog',
  repoId: 'R_kg...',        // ← paste
  category: 'Announcements',
  categoryId: 'DIC_kw...',  // ← paste
  // ...
} as const;
```

Because comments are public Discussions, consider whether
[CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) says what you want it to say.

## 4. Contact form endpoint

GitHub Pages serves static files only, so a working form needs a third-party endpoint.
`CONTACT_FORM_ENDPOINT` in `src/consts.ts` is deliberately empty — no endpoint was
invented for you.

Create a form at <https://formspree.io> (or any equivalent), then:

```ts
export const CONTACT_FORM_ENDPOINT = 'https://formspree.io/f/xxxxxxxx';
```

The form markup — including a honeypot field — is already written in
`src/pages/contact.astro` and appears automatically once the value is set. Until then
`/contact/` shows the mailto link instead.

## 5. Author identity

All in [`src/consts.ts`](../src/consts.ts). Nothing else hardcodes these:

```ts
export const SITE_TITLE = 'Field Notes';          // ← yours
export const SITE_DESCRIPTION = '...';            // ← yours
export const AUTHOR_NAME = 'Your Name';           // ← yours
export const AUTHOR_BIO = '...';                  // ← yours
export const AUTHOR_EMAIL = 'you@example.com';    // ← yours
export const SOCIAL_LINKS = [ ... ];              // ← yours
```

Also worth replacing: the About page prose in `src/pages/about.astro`, the three sample
posts in `src/content/blog/`, and `public/social-card.png` (the default Open Graph
image, 1200×630).

## 6. Optional: licensing

No licence file is included, because the choice is yours to make and it is a legally
meaningful one. Without a licence, the content is "all rights reserved" by default.

Blogs commonly split the two: a permissive code licence (MIT) plus a content licence
(e.g. CC BY 4.0) for the posts. If you want that, say so and it can be added.

## 7. Optional: custom domain

A custom domain removes the `/blog/` base path entirely, which simplifies several things
(`robots.txt` becomes authoritative, URLs stop reading `/blog/blog/…`). It requires
changing `site` and `base` in `astro.config.mjs`, `site_url`/`display_url` in
`public/admin/config.yml`, and the `Sitemap:` line in `public/robots.txt`. See
[architecture.md](architecture.md#base-paths).
