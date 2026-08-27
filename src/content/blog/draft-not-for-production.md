---
title: "Draft: this post proves draft exclusion works"
description: "A deliberately unfinished post. It appears while the dev server runs and is dropped from every production build."
date: "2026-08-25T10:00:00.000Z"
author: "Your Name"
featured_image: "../../assets/images/uploads/placeholder-draft.jpg"
category: "Notes"
tags:
  - meta
draft: true
---

Keep this file, or delete it once you trust the behaviour — it is the cheapest way to confirm
draft handling is still working after a dependency upgrade.

Run `npm run dev` and this post appears in the blog listing, the Notes category, the `#meta`
tag archive and the RSS feed. Run `npm run build` and it appears in none of them: no page is
generated for it at all, so there is no unlisted URL for it to leak through.

Toggle the **Draft** switch in the CMS to publish a post. That is the only difference between
this file and a live one.
