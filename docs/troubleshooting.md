# Troubleshooting

Every entry here is a failure that actually happened while building or deploying this
site, with the fix that worked.

---

## `npm run dev` / `npm run build`: "An Application Control policy has blocked this file"

```
Cannot find native binding.
  Caused by: An Application Control policy has blocked this file.
  \\?\...\node_modules\@astrojs\compiler-binding-win32-x64-msvc\astro.win32-x64-msvc.node
```

**Cause.** Windows **Smart App Control** is on, and it refuses to load Astro 7's
unsigned native compiler binary. Nothing to do with this project — it affects any
package with a native `.node` addon.

**Fix.** Install Astro's own WASI fallback. Astro loads it automatically when the native
binding fails:

```bash
npm install --no-save --force @astrojs/compiler-binding-wasm32-wasi
```

- `--force` is required because npm refuses a `wasm32` package on an `x64` machine.
- `--no-save` keeps a machine-specific workaround out of `package.json`.

**It must be re-run after every `npm install` or `npm ci`**, because npm prunes packages
that are not in `package.json`. If a build suddenly starts failing again right after
adding a dependency, this is why.

Builds are slower under WASI but produce identical output. CI runs on Linux with the
native binding and is unaffected.

The alternative — turning Smart App Control off — is a one-way system-wide security
change and is your call, not something to do casually.

---

## CMS shows "The configuration file could not be parsed"

**Cause.** `public/admin/config.yml` is not valid YAML. The overwhelmingly common
culprit is an unquoted `: ` (colon followed by a space) inside a `hint` or `description`
string, which YAML reads as a nested mapping:

```yaml
hint: One category per post. Existing ones: Notes, Workflow    # ✗ breaks
hint: "One category per post. Existing ones: Notes, Workflow"  # ✓ fine
```

**Fix.** Quote the value. To find the problem before loading the CMS:

```bash
npx js-yaml public/admin/config.yml > /dev/null && echo VALID
```

The browser console gives the exact line and column, which is faster than reading the
file.

---

## `/admin/` returns the 404 page on the dev server

**Cause.** Astro's dev server does not serve directory indexes for files in `public/`.

**Fix.** Use the explicit filename in development:

```
http://localhost:4321/blog/admin/index.html
```

The built site serves `/admin/` correctly — verified with `npm run preview` and live.
Not a bug, just a dev-server difference worth knowing before you go looking for one.

---

## Search does nothing / shows the "index not available" note

**Cause.** The Pagefind index is generated from `dist/` by the `postbuild` step. Under
`npm run dev` there is no `dist/`, so there is nothing to search.

**Fix.** Test search against a build:

```bash
npm run build && npm run preview
```

If it also fails on the built site, check that `dist/pagefind/` exists and that the
build log shows `Indexed N pages`. `Indexed 0 pages` means the `data-pagefind-body`
attribute went missing from `src/pages/blog/[slug].astro`.

---

## Search results 404 when clicked

**Cause.** Pagefind indexes `dist/`, which *is* the deploy root, so its stored URLs
start at `/` with no base path.

**Fix.** `src/pages/search.astro` already handles this with a `processResult` hook that
re-adds the base, plus `bundlePath`. If you change `base` in `astro.config.mjs`, nothing
needs editing — both values are derived from `withBase()`. If you hand-roll a different
search UI, you must reimplement the prefix.

---

## Links or images 404 on the live site but work locally

**Cause.** A root-absolute path (`/about/`, `/images/x.png`) was written somewhere
instead of going through the base-path helpers. It resolves at the domain root, which
this site is not served from.

**Fix.** Use `withBase()` — see [architecture.md](architecture.md#base-paths). To find
every offender:

```bash
npm run build
grep -rhoE '(href|src|srcset|content)="/[^"]*"' dist --include=*.html | grep -vE '="/blog/'
```

Empty output means clean.

---

## Pagination links contain the base path twice (`/blog/blog/blog/2/`)

**Cause.** `paginate()` returns URLs that **already include the base**. Wrapping them in
`withBase()` doubles it.

**Fix.** Pass `page.url.prev` / `page.url.next` straight through, as
`Pagination.astro` does. The rule: anything Astro produced (`Astro.url.pathname`,
`ImageMetadata.src`, `paginate()` URLs) is already based — use `absFromBuiltPath()` if
you need it absolute, never `withBase()`.

---

## "pages build and deployment" fails on every push

```
ERROR: YOUR SITE COULD NOT BE BUILT:
Invalid YAML front matter in /github/workspace/src/pages/about.astro
```

**Cause.** GitHub Pages has been set to *Deploy from a branch*, so a legacy Jekyll build
runs alongside the Astro workflow. Jekyll cannot parse `.astro` files.

**Fix.** **Settings → Pages → Source: `GitHub Actions`** (needs admin). Confirm with:

```bash
gh api repos/aumniguest/blog/pages --jq '.build_type'   # expect: workflow
```

A correctly configured repository produces exactly **one** run per push. If you see a
`pages-build-deployment` run at all, the source has been switched back.

**Do not add `.nojekyll`.** Under branch mode it makes Pages publish the raw repository
root instead of the built site — strictly worse than the failure it appears to fix.

*Resolved 2026-08-27; kept here because it recurs if the setting is ever changed.*

---

## CMS: "Sign In with GitHub" hangs on "Signing in…"

**Hidden since 2026-08-28** — the login screen now offers only the routes that work. If
you see the button again, the patch described below has stopped matching.

**This button cannot work on this site, and that is by design.** Use **"Sign In Using
Access Token"** instead.

**Cause.** The GitHub button starts an *OAuth* flow, which needs a server to hold the
OAuth client secret — a secret cannot live in a static site. When `base_url` is absent
from `public/admin/config.yml`, Sveltia falls back to Netlify's hosted OAuth provider,
which this site is not registered with. The popup never returns a token, so the screen
sits on "Signing in…" forever rather than showing an error.

Sveltia offers no configuration option to hide it, so `public/admin/index.html` carries
a small script that removes it from the login screen. That script is deliberately
**fail-open**: unless it finds exactly one OAuth button and exactly one token button, it
does nothing. Verified against three cases — an ambiguous second OAuth-looking button, a
missing token button, and normal markup — it only ever hides the right one. The worst
case after a Sveltia update is the button reappearing, never the wrong one vanishing.

Delete that script if an OAuth backend is ever configured.

**Fix.** Click **"Sign In Using Access Token"** and paste a fine-grained PAT — see
[setup.md](setup.md#2-fine-grained-pat-for-the-cms). This is the intended route and the
one that produced every CMS commit in this repository so far.

**If you would rather have the GitHub button work**, it needs an OAuth backend:

1. A GitHub OAuth App (client ID + client secret).
2. The [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) Cloudflare
   Worker deployed to hold the secret.
3. `base_url: https://sveltia-cms-auth.<subdomain>.workers.dev` added to the `backend`
   block in `public/admin/config.yml`.

That is a deliberate trade: it adds a hosted service and a long-lived secret to
maintain, which this project was set up specifically to avoid. The token route needs
neither.

---

## CMS "View on Live Site" link 404s

The link points at `https://aumniguest.github.io/blog/<slug>/` — one `blog/` short of
the real URL, `https://aumniguest.github.io/blog/blog/<slug>/`.

**Cause.** Sveltia keeps only the **origin** of `site_url` when building preview links.
From the bundle:

```js
_baseURL = new URL(_siteURL).origin              // the "/blog" path is discarded
…
return `${baseURL.replace(/\/$/, '')}/${previewPath.replace(/^\//, '')}`
```

So the link is `origin + "/" + preview_path`. The base path in `site_url` never reaches
it, and adding a trailing slash to `site_url` changes nothing — `.origin` drops the path
either way.

**Fix.** `preview_path` must spell out the whole path **from the origin**, which on a
project site means repeating the base:

```yaml
preview_path: blog/blog/{{slug}}/
#             ^^^^ GitHub Pages project-site base
#                  ^^^^ this collection's route
```

`site_url` and `display_url` still carry the full URL: only `site_url`'s origin is used
for preview links, but `display_url` is used verbatim for the "visit site" link.

If the base path ever changes — a custom domain, a renamed repo — the first segment of
`preview_path` has to change with it.

---

## A new post does not appear on the site

Two causes, in order of likelihood.

**1. It is still a draft.** New posts created in the CMS default to **Draft**, on
purpose, so a half-written post cannot publish itself. Drafts build fine and are then
excluded from the output — so the deploy goes *green* and the post still does not
appear, which is the confusing part.

Check the committed file:

```bash
gh api repos/aumniguest/blog/contents/src/content/blog/<slug>.md --jq '.content' | base64 -d | head
```

If it says `draft: true`, untick **Draft** in the CMS and save again.

**2. The build failed, so nothing deployed.** A failed build leaves the previous
version live — which looks identical to "my post did not appear".

```bash
gh run list --repo aumniguest/blog --limit 5
```

A `failure` row is the answer. See the next entry for the most common cause.

---

## Build fails: `MissingImageDimension` on a remote image

```
MissingImageDimension: Missing width and height attributes for https://example.com/x.webp.
When using remote images, both dimensions are required in order to avoid CLS.
Caught error rendering /blog/<slug>/
```

**Cause.** A `featured_image` pointing at a URL rather than an upload. Astro cannot know
a remote image's dimensions without fetching it, and rendering without them would cause
layout shift — so it refuses.

**Fixed as of 2026-08-28.** `src/components/FeaturedImage.astro` passes `inferSize` for
remote sources so Astro fetches them at build time, and `image.remotePatterns` in
`astro.config.mjs` authorises optimising them. Remote URLs now work everywhere a local
upload does.

If it recurs, it means a `<Image>` is being used directly on a `featured_image` value
somewhere instead of going through `FeaturedImage.astro`. Route it through the
component rather than adding `inferSize` at the call site.

---

## `git push` rejected, or "Everything up-to-date" when you expected a push

Check what you actually have:

```bash
gh api repos/aumniguest/blog --jq '.permissions'
git status -sb
git log --oneline origin/main..HEAD
```

`"push": false` means read-only access — the local git credentials are `mohiseen-aumni`
while the repository is owned by `aumniguest`. Either be granted Write, or authenticate
as the owner:

```bash
gh auth login
gh auth switch --user aumniguest
```

Before any push into a repository that already has commits, confirm it is a
fast-forward so nothing is destroyed:

```bash
git fetch origin main
git merge-base --is-ancestor origin/main HEAD && echo "clean fast-forward"
```

If that fails, **do not use `--force`.** Rebase onto the remote history instead.

---

## Build fails on a post you just wrote

That is the schema doing its job. `content.config.ts` validates every post at build time
and the error names the file and the field. Common causes:

- `featured_image` path wrong — it is relative **to the Markdown file**, so
  `../../assets/images/uploads/…`, not `/assets/…`.
- `date` not parseable as a date.
- `tags` written as a string instead of a list.
- A required field missing entirely.

A failed build deploys nothing, so the live site keeps the previous version.

---

## Type errors after upgrading Astro

```bash
npm run check
```

If `z` is reported as deprecated, import it from `astro/zod` rather than `astro:content`
— that changed in Astro 7 and is already applied in `content.config.ts`.
