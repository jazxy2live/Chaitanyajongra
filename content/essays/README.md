This folder is the source of truth for essays.

Each essay is a Markdown file with metadata at the top:

```md
---
title: "Essay Title"
slug: "essay-title"
date: "2026-04-26"
description: "One sentence summary."
tags: [youth, technology]
---

Your essay starts here.
```

After adding or editing an essay, run:

```sh
./build.sh
```

The build script generates the public HTML pages, the essays index, RSS, and sitemap.
