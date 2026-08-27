---
title: "Building a static blog that stays fast"
description: "A long placeholder post with nested headings, an in-body image, a table and code samples — enough structure to exercise the table of contents."
date: "2026-08-20T07:15:00.000Z"
author: "Your Name"
featured_image: "../../assets/images/uploads/placeholder-architecture.jpg"
category: "Engineering"
tags:
  - astro
  - performance
  - tools
  - process
draft: false
---

This is the long shape. It has enough headings to build a table of contents, an image in the
body to prove the optimisation pipeline reaches past the cover image, and a mix of lists,
tables and code so you can see how each one sits on the page. Replace all of it.

## Why static, and why it stays that way

A static site has no server to keep patched and no runtime to fall over at three in the
morning. The whole site is a folder of HTML files. That constraint is doing most of the work:
if there is no server, there is nothing to slow down under load.

### The trade you are making

You give up anything that needs to be computed per request — personalised pages, live counts,
server-side search. In exchange you get a site that is cheap to host, hard to break, and fast
by default.

### The trade you are not making

You do not give up comments, search, or a content editor. Each of those has a static-friendly
answer, and this site uses one of each.

## Where the time actually goes

Most slow blogs are not slow because of their framework. They are slow because of images and
third-party scripts, in that order.

| Cause | Typical cost | Fixed by |
| --- | --- | --- |
| Unoptimised hero images | 1–3 MB per page | Build-time resizing and modern formats |
| Embedded social widgets | 200–600 KB of JS | Plain links instead of widgets |
| Web fonts | 100–300 KB, blocking | System font stack |
| Analytics and tag managers | 50–150 KB | Leaving them out |

![A placeholder illustration sitting inside the body of the post](../../assets/images/uploads/placeholder-notebook.jpg)

The image above is referenced with a path relative to this Markdown file, which is what lets
the build step resize it, convert it and emit a `srcset` — the same treatment the cover image
gets.

### Images

Cover images are declared in frontmatter and validated at build time, so a typo in a filename
fails the build instead of shipping a broken image to readers.

```yaml
featured_image: "../../assets/images/uploads/placeholder-architecture.jpg"
```

### Scripts

There are three pieces of client-side JavaScript on this entire site: the theme toggle, the
copy-link button, and the search page. The comment widget loads only on post pages, and only
once you scroll to it.

## Structure that readers can navigate

Long posts need signposting. The table of contents above is generated from the headings in
this file — no plugin, no manual list to keep in sync.

### Heading levels

Use `##` for sections and `###` for subsections. Anything deeper is left out of the contents
on purpose; a four-level outline is usually a sign the post should have been two posts.

### Anchors

Every heading gets an id automatically, so any section can be linked to directly. That is what
makes a long reference post useful months after it was written.

## Publishing without ceremony

The editing flow is deliberately boring:

1. Write in the CMS or in your editor.
2. Save, which commits to the repository.
3. The commit triggers a build.
4. The build deploys.

There is no staging environment, because for a solo blog a staging environment is mostly a
place for work to go and stall. `npm run preview` covers the same ground in ten seconds.

### When something breaks

The build is the safety net. Schema validation, missing images and broken frontmatter all fail
loudly before anything reaches the live site. A failed build leaves the previous version up.

## What to measure

Two numbers are enough: page weight and time to first paint on a mid-range phone over a slow
connection. If those stay reasonable, everything else follows.

Everything past that is diminishing returns — and diminishing returns are a fine place to stop
so you can go back to writing.
