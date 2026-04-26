import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT_DIR = path.join(ROOT, "content", "essays");
const ESSAYS_DIR = path.join(ROOT, "essays");
const SITE_URL = "https://chaitanyajongra.com";
const ASSET_VERSION = "20260426-18";

const navItems = [
  ["Writings", "essays.html", "essays"],
  ["Projects", "ideas.html", "projects"],
  ["Films", "films.html", "films"],
  ["Reading", "reading.html", "reading"],
  ["Contact", "contact.html", "contact"],
];

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value = "") {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

function parseValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return trimmed.replace(/^["']|["']$/g, "");
}

function parseFrontmatter(markdown, fileName) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    throw new Error(`${fileName} is missing frontmatter`);
  }

  const data = {};
  for (const line of match[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1);
    data[key] = parseValue(value);
  }

  const body = markdown.slice(match[0].length).trim();
  const slug = data.slug || path.basename(fileName, ".md");
  return { ...data, slug, body };
}

function formatDate(date, displayDate) {
  if (displayDate) return displayDate;
  const parsed = new Date(`${date}T00:00:00Z`);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function inlineMarkdown(text) {
  let html = escapeHtml(text);
  html = html.replace(/\[([^\]]+)]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = escapeAttr(href);
    const external = /^https?:\/\//.test(href) ? ' target="_blank" rel="noopener noreferrer"' : "";
    return `<a href="${safeHref}"${external}>${label}</a>`;
  });
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
  return html;
}

function listToHtml(lines, ordered) {
  const tag = ordered ? "ol" : "ul";
  const items = lines
    .map((line) => line.replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ""))
    .map((line) => `<li>${inlineMarkdown(line.trim())}</li>`)
    .join("\n");
  return `<${tag}>\n${items}\n</${tag}>`;
}

function markdownToHtml(markdown) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      blocks.push(`<h${level}>${inlineMarkdown(line.replace(/^#{1,3}\s+/, "").trim())}</h${level}>`);
      i += 1;
      continue;
    }

    if (/^(---|\*\*\*)$/.test(line.trim())) {
      blocks.push("<hr>");
      i += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push(`<blockquote>${inlineMarkdown(quote.join(" ").trim())}</blockquote>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const list = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        list.push(lines[i]);
        i += 1;
      }
      blocks.push(listToHtml(list, true));
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const list = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        list.push(lines[i]);
        i += 1;
      }
      blocks.push(listToHtml(list, false));
      continue;
    }

    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^(---|\*\*\*)$/.test(lines[i].trim()) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push(`<p>${inlineMarkdown(paragraph.join(" "))}</p>`);
  }

  return blocks.join("\n\n");
}

function siteHeader(rootPrefix, current) {
  const links = navItems
    .map(([label, href, key]) => {
      const active = key === current ? ' class="active" aria-current="page"' : "";
      return `<a href="${rootPrefix}${href}"${active}>${label}</a>`;
    })
    .join("\n    ");

  return `<a class="site-name" href="${rootPrefix}index.html">Chaitanya Jongra</a>
  <nav class="site-nav" aria-label="Primary">
    ${links}
  </nav>`;
}

function layout({ title, description, canonical, current, rootPrefix = "", bodyClass = "", content }) {
  const classAttr = bodyClass ? ` class="${bodyClass}"` : "";
  return `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}">
  <meta name="author" content="Chaitanya Jongra">
  <meta property="og:type" content="${current === "essays" && canonical.includes("/essays/") ? "article" : "website"}">
  <meta property="og:url" content="${escapeAttr(canonical)}">
  <meta property="og:title" content="${escapeAttr(title)}">
  <meta property="og:description" content="${escapeAttr(description)}">
  <meta property="og:image" content="${SITE_URL}/images/chaitanya.jpg">
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:title" content="${escapeAttr(title)}">
  <meta property="twitter:description" content="${escapeAttr(description)}">
  <meta property="twitter:image" content="${SITE_URL}/images/chaitanya.jpg">
  <meta name="twitter:creator" content="@chaitanyajongra">
  <link rel="canonical" href="${escapeAttr(canonical)}">
  <link rel="stylesheet" href="${rootPrefix}css/style.css?v=${ASSET_VERSION}">
  <link rel="alternate" type="application/rss+xml" title="Chaitanya Jongra - Writings" href="${rootPrefix}rss.xml">
</head>

<body${classAttr}>
  ${siteHeader(rootPrefix, current)}

${content}
</body>

</html>
`;
}

function essayPage(essay) {
  const html = markdownToHtml(essay.body);
  const title = essay.title;
  const canonical = `${SITE_URL}/essays/${essay.slug}.html`;
  const content = `  <main class="essay-shell">
    <article class="essay-article">
      <a class="back-link" href="../essays.html">&larr;</a>
      <h1>${escapeHtml(essay.title)}</h1>
      <p class="essay-date">${escapeHtml(formatDate(essay.date, essay.displayDate))}</p>
      <div class="essay-body">
${html.split("\n").map((line) => `        ${line}`).join("\n")}
      </div>
    </article>
  </main>`;

  return layout({
    title,
    description: essay.description,
    canonical,
    current: "essays",
    rootPrefix: "../",
    bodyClass: "essay-page",
    content,
  });
}

function essaysIndex(essays) {
  const rows = essays
    .map((essay) => `<a class="essay-row" href="essays/${essay.slug}.html">${escapeHtml(essay.title)}</a>`)
    .join("\n");

  const content = `  <main class="page-shell">
    <h1 class="page-title">Writings</h1>

    <div class="essay-index">
${rows.split("\n").map((line) => `      ${line}`).join("\n")}
    </div>
  </main>`;

  return layout({
    title: "Writings",
    description: "Writings by Chaitanya Jongra.",
    canonical: `${SITE_URL}/essays.html`,
    current: "essays",
    content,
  });
}

function rss(essays) {
  const items = essays
    .map((essay) => {
      const url = `${SITE_URL}/essays/${essay.slug}.html`;
      return `    <item>
      <title>${escapeHtml(essay.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(`${essay.date}T00:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeHtml(essay.description)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Chaitanya Jongra - Writings</title>
    <link>${SITE_URL}/essays.html</link>
    <description>Writings by Chaitanya Jongra.</description>
${items}
  </channel>
</rss>
`;
}

function sitemap(essays) {
  const today = new Date().toISOString().slice(0, 10);
  const pages = [
    ["", "monthly", "1.0"],
    ["essays.html", "weekly", "0.9"],
    ["ideas.html", "monthly", "0.7"],
    ["films.html", "monthly", "0.6"],
    ["reading.html", "monthly", "0.6"],
    ["contact.html", "monthly", "0.6"],
    ...essays.map((essay) => [`essays/${essay.slug}.html`, "monthly", "0.8", essay.date]),
  ];

  const urls = pages
    .map(([loc, changefreq, priority, lastmod = today]) => `  <url>
    <loc>${SITE_URL}/${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

async function readEssays() {
  const files = (await readdir(CONTENT_DIR))
    .filter((file) => file.endsWith(".md") && file.toLowerCase() !== "readme.md")
    .sort();
  const essays = [];

  for (const file of files) {
    const markdown = await readFile(path.join(CONTENT_DIR, file), "utf8");
    const essay = parseFrontmatter(markdown, file);
    if (!essay.title || !essay.date || !essay.description) {
      throw new Error(`${file} needs title, date, and description in frontmatter`);
    }
    essays.push(essay);
  }

  return essays.sort((a, b) => b.date.localeCompare(a.date));
}

async function removeDraftEssayFiles(essays) {
  for (const essay of essays) {
    if (essay.status !== "draft") continue;
    try {
      await unlink(path.join(ESSAYS_DIR, `${essay.slug}.html`));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
}

async function main() {
  const allEssays = await readEssays();
  const essays = allEssays.filter((essay) => essay.status !== "draft");
  await mkdir(ESSAYS_DIR, { recursive: true });
  await removeDraftEssayFiles(allEssays);

  for (const essay of essays) {
    await writeFile(path.join(ESSAYS_DIR, `${essay.slug}.html`), essayPage(essay));
  }

  await writeFile(path.join(ROOT, "essays.html"), essaysIndex(essays));
  await writeFile(path.join(ROOT, "rss.xml"), rss(essays));
  await writeFile(path.join(ROOT, "sitemap.xml"), sitemap(essays));

  console.log(`Built ${essays.length} writings.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
