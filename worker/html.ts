import { m } from "@shared/paraglide/messages";

type Locale = "pt-br" | "en";

export function detectLocale(acceptLanguage: string | null): Locale {
	const value = (acceptLanguage ?? "").toLowerCase();
	if (value.includes("pt")) return "pt-br";
	if (value.startsWith("en") || value.includes(",en")) return "en";
	return "pt-br";
}

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function renderLandingPage(locale: Locale, origin: string) {
	const title = `Istudarne — ${m.app_tagline({}, { locale })}`;
	const description = m.landing_subtitle({}, { locale });

	const jsonLd = JSON.stringify({
		"@context": "https://schema.org",
		"@type": "WebApplication",
		name: "Istudarne",
		url: origin,
		description,
		applicationCategory: "EducationalApplication",
		operatingSystem: "Web",
    browserRequirements: "Requires JavaScript",
		offers: { "@type": "Offer", price: "0" },
	});

	return html({
		locale,
		title,
		description,
		canonical: origin,
		extraHead: `
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Istudarne" />
      <meta property="og:title" content="${escapeHtml(title)}" />
      <meta property="og:description" content="${escapeHtml(description)}" />
      <meta property="og:url" content="${origin}/" />
      <meta property="og:locale" content="${locale === "en" ? "en_US" : "pt_BR"}" />
      <meta name="twitter:card" content="summary" />
      <script type="application/ld+json">${jsonLd}</script>
    `,
		body: `
      <main class="hero">
        <section class="hero-inner">
          <span class="brand-mark">I</span>
          <p class="eyebrow">${m.landing_eyebrow({}, { locale })}</p>
          <h1>${m.landing_title({}, { locale })}</h1>
          <p class="lead">${m.landing_subtitle({}, { locale })}</p>
          <div class="actions">
            <a class="primary" href="/app">${m.landing_open_dashboard({}, { locale })}</a>
            <a href="/app/quizzes">${m.landing_explore({}, { locale })}</a>
          </div>
        </section>
      </main>
      <footer style="padding: 1.25rem; text-align: center; font-size: 0.75rem; opacity: 0.65;">
        <a href="https://www.magnific.com/free-vector/flat-design-library-logo-template_24005402.htm" rel="noopener noreferrer" style="color: inherit;">Logo image by Freepik</a>
      </footer>
    `,
	});
}

export function renderNotFoundPage(locale: Locale = "pt-br") {
	return html({
		locale,
		title: "404 — Istudarne",
		description: m.notfound_subtitle({}, { locale }),
		extraHead: `<meta name="robots" content="noindex" />`,
		body: `
      <main class="hero">
        <section class="hero-inner">
          <span class="brand-mark">404</span>
          <p class="eyebrow">${m.notfound_eyebrow({}, { locale })}</p>
          <h1>${m.notfound_title({}, { locale })}</h1>
          <p class="lead">${m.notfound_subtitle({}, { locale })}</p>
          <div class="actions">
            <a class="primary" href="/app">${m.notfound_home({}, { locale })}</a>
          </div>
        </section>
      </main>
    `,
	});
}

export function renderSharePage(input: {
	id: string;
	title: string;
	description: string;
	questionCount: number;
	authorName: string;
	/* Unlisted quizzes stay reachable through the link but out of search indexes. */
	indexable: boolean;
	origin: string;
	locale?: Locale;
}) {
	const locale = input.locale ?? "pt-br";
	const title = escapeHtml(input.title);
	const description = escapeHtml(input.description);
	const url = `${input.origin}/share/quizzes/${input.id}`;

	const jsonLd = JSON.stringify({
		"@context": "https://schema.org",
		"@type": "Quiz",
		name: input.title,
		description: input.description,
		url,
		numberOfQuestions: input.questionCount,
		author: { "@type": "Person", name: input.authorName },
		provider: { "@type": "Organization", name: "Istudarne", url: input.origin },
	});

	return html({
		locale,
		title: `${title} — Istudarne`,
		description,
		canonical: url,
		extraHead: `
      ${input.indexable ? "" : `<meta name="robots" content="noindex" />`}
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Istudarne" />
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:url" content="${url}" />
      <meta name="twitter:card" content="summary" />
      <script type="application/ld+json">${jsonLd}</script>
    `,
		body: `
      <main class="hero">
        <section class="hero-inner">
          <span class="brand-mark">I</span>
          <p class="eyebrow">${m.landing_eyebrow({}, { locale })}</p>
          <h1>${title}</h1>
          <p class="lead">${description}</p>
          <p class="meta">${m.quiz_card_questions({ count: input.questionCount }, { locale })} · ${m.quiz_card_by({ author: escapeHtml(input.authorName) }, { locale })}</p>
          <div class="actions">
            <a class="primary" href="/app/quizzes/${input.id}/play">${m.quiz_card_study({}, { locale })}</a>
            <a href="/app/quizzes">${m.dashboard_view_library({}, { locale })}</a>
          </div>
        </section>
      </main>
    `,
	});
}

/* Standalone HTML shell for the server-rendered pages (landing, share, 404).
   Styles are inlined and mirror the SPA tokens in app/styles/tokens.css so
   both worlds share the same visual language; it honors the OS color scheme. */
function html(input: {
	locale: Locale;
	title: string;
	description: string;
	body: string;
	canonical?: string;
	extraHead?: string;
}) {
	const lang = input.locale === "en" ? "en" : "pt-BR";
	return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${input.title}</title>
    <meta name="description" content="${escapeHtml(input.description)}" />
    ${input.canonical ? `<link rel="canonical" href="${input.canonical}" />` : ""}
    <meta name="theme-color" content="#202020" />
    ${input.extraHead ?? ""}
    <style>
      :root {
        --bg: #f6f6f6;
        --surface: #ffffff;
        --text: #222222;
        --text-muted: #6a6a6a;
        --border: #e2e2e2;
        --primary: #7c3aed;
        --primary-hover: #6d28d9;
        --primary-soft: #ede9fe;
        --secondary: #6a6a6a;
        color: var(--text);
        background: var(--bg);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #202020;
          --surface: #262626;
          --text: #dcddde;
          --text-muted: #999999;
          --border: #363636;
          --primary: #7c3aed;
          --primary-hover: #8b5cf6;
          --primary-soft: #2a2144;
          --secondary: #a3a3a3;
        }
      }
      * { box-sizing: border-box; }
      body { margin: 0; }
      .hero {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 32px;
        background:
          radial-gradient(circle at 50% 0%, var(--primary-soft), transparent 36rem),
          var(--bg);
      }
      .hero-inner {
        max-width: 680px;
        text-align: center;
        display: grid;
        justify-items: center;
        gap: 14px;
      }
      .brand-mark {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 56px;
        height: 56px;
        padding: 0 14px;
        border-radius: 16px;
        background: var(--primary);
        color: #fff;
        font-weight: 800;
        font-size: 1.4rem;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
      }
      .eyebrow {
        color: var(--secondary);
        font-size: 0.82rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin: 8px 0 0;
      }
      h1 { font-size: clamp(2.2rem, 6vw, 4rem); line-height: 1.04; margin: 0; }
      .lead { color: var(--text-muted); font-size: 1.12rem; margin: 0; max-width: 56ch; }
      .meta { color: var(--text-muted); font-size: 0.92rem; margin: 0; }
      .actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-top: 14px; }
      .actions a {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 12px;
        color: var(--text);
        font-weight: 700;
        padding: 13px 20px;
        text-decoration: none;
      }
      .actions .primary { background: var(--primary); border-color: var(--primary); color: #fff; }
      .actions .primary:hover { background: var(--primary-hover); }
    </style>
  </head>
  <body>${input.body}</body>
</html>`;
}
