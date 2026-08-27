---
title: "A writing workflow that survives contact with reality"
description: "Placeholder text for a medium-length post: a few headings, a list, a quote, and a code block to check the typography."
date: "2026-08-12T08:30:00.000Z"
author: "Your Name"
featured_image: "../../assets/images/uploads/placeholder-workflow.jpg"
category: "Workflow"
tags:
  - writing
  - process
  - tools
draft: false
---

This is the middle shape: long enough to need headings, short enough to read in one sitting.
Everything below is placeholder text sized to show what the typography actually looks like
when a paragraph runs past a single line and has to wrap.

## Start from the smallest publishable thing

The temptation with a new blog is to save the good ideas for later and publish nothing in the
meantime. The opposite works better. Publish the smallest version of the idea, then let the
follow-ups do the rest.

- Draft in the CMS or in your editor, whichever is closer to hand.
- Keep the description field honest — it is what shows in search results and on social cards.
- Pick one category and two or three tags. More than that stops being navigation.

## Keep the friction in one place

> If publishing takes more than a couple of minutes, it stops happening on the days it matters
> most.

Every post here is a Markdown file in the repository. Saving in the CMS is a commit, a commit
is a build, and a build is a deploy. There is no separate database to keep in sync and nothing
to back up beyond the git history you already have.

## Check it before it ships

Drafts are visible while the dev server runs and disappear from production builds, so you can
leave half-finished posts in the repository without them leaking:

```bash
npm run dev      # drafts visible
npm run build    # drafts excluded
npm run preview  # exactly what gets deployed
```

That last command is the one worth remembering. It serves the built output, which means the
search index and the base path behave the same way they will once the site is live.

## Then stop editing

The last twenty per cent of polish costs more than the first eighty and is noticed by almost
nobody. Publish, and put the leftover energy into the next post instead.
