# Field Notes

A static blog for a single author: Astro + TypeScript, Markdown content collections,
Sveltia CMS at `/admin`, Pagefind search, Giscus comments, deployed to GitHub Pages by
GitHub Actions.

- **Live URL:** https://aumniguest.github.io/blog/
- **Repository:** `aumniguest/blog` (GitHub Pages **project** site, so everything is
  served under the `/blog/` base path)

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Dev server at http://localhost:4321/blog/ — **drafts are visible** |
| `npm run build` | Production build into `dist/`, then Pagefind indexes it (`postbuild`) |
| `npm run preview` | Serve `dist/` — the only way to test search and `/admin/` as deployed |
| `npm run check` | TypeScript + Astro diagnostics |

### Windows: Smart App Control

If `npm run dev` or `npm run build` fails with *"An Application Control policy has
blocked this file"*, Windows Smart App Control is refusing Astro's unsigned native
compiler binary. Install the WASI fallback once per `npm install`:

```bash
npm install --no-save --force @astrojs/compiler-binding-wasm32-wasi
```

`--force` is required because npm refuses a `wasm32` package on an `x64` machine, and
`--no-save` keeps it out of `package.json` — it is a machine-specific workaround, not a
project dependency. Re-run it after any `npm install` or `npm ci`. CI on Linux uses the
native binding and is unaffected.

## Where to edit things

Everything site-wide lives in [`src/consts.ts`](src/consts.ts): title, description,
author name/bio/email, posts-per-page, social links, the Giscus IDs and the contact
form endpoint. Nothing else hardcodes them.

## Writing posts

Posts are Markdown files in `src/content/blog/`. The filename is the URL slug, so
`my-post.md` publishes at `/blog/my-post/`. Frontmatter is validated at build time by
the Zod schema in [`src/content.config.ts`](src/content.config.ts) — a typo fails the
build instead of shipping broken output.

```yaml
---
title: "Post title"
description: "One or two sentences, used for cards, meta description and social."
date: "2026-08-20T07:15:00.000Z"
author: "Your Name"
featured_image: "../../assets/images/uploads/something.jpg"
category: "Engineering"
tags: [astro, performance]
draft: false
---
```

`draft: true` posts render in `npm run dev` and are dropped entirely from production
builds — no page, no feed entry, no archive listing, no search hit.

## The CMS

Open `/admin/` on the deployed site (or `/admin/index.html` on the dev server — Astro's
dev server does not serve directory indexes for `public/` files; the built site does).

Three sign-in options appear:

1. **Work with Local Repository** — pick this while developing. It uses the browser's
   File System Access API to read and write this working copy directly, so saves land
   as plain file changes you can review with `git diff` before committing. Enabled by
   `local_backend: true` in `public/admin/config.yml`; needs a Chromium-based browser.
2. **Sign In Using Access Token** — the production route. Paste a fine-grained GitHub
   PAT scoped to this repository (see the setup notes). No OAuth backend, no serverless
   function, no client secret anywhere.
3. *Sign In with GitHub* — needs an OAuth backend that this project deliberately does
   not have. Ignore it.

Saving a post commits to `main`, which triggers the deploy workflow.

### Images

Uploads go to `src/assets/images/uploads/` and are written into frontmatter as a path
relative to the Markdown file (`../../assets/images/uploads/…`). That is what lets
Astro's `image()` schema helper resolve them and emit resized WebP with a `srcset`.

The collection's `media_folder` and `public_folder` in `public/admin/config.yml` are
both set to `../../assets/images/uploads` to produce exactly that. If you change where
posts live, both values have to move with them.

## Deployment

`.github/workflows/deploy.yml` builds on every push to `main` and publishes to GitHub
Pages. It uses `withastro/action`, which runs `npm ci && npm run build` — and because
Pagefind is an npm `postbuild` script, the search index is built into `dist/pagefind/`
and ships with the deployment.

Pages must be set to **Source: GitHub Actions** in the repository settings.

## Base-path safety

The site is served from `/blog/`, not the domain root, so no internal link may be
written as a root-absolute `/foo/` string. Every one goes through
[`src/lib/url.ts`](src/lib/url.ts):

- `withBase('/about/')` for site paths you author;
- `absFromBuiltPath(...)` for paths Astro already resolved (`Astro.url.pathname`,
  `ImageMetadata.src`, `paginate()` URLs) — these already carry the base;
- `absUrl(...)` when you need the full `https://host/blog/…` form.

To re-check after changes, build and confirm this prints nothing:

```bash
grep -rhoE '(href|src|srcset|content)="/[^"]*"' dist --include=*.html | grep -vE '="/blog/'
```
