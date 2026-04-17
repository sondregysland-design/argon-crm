const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

const CONTACT_PATHS = ["/", "/kontakt", "/contact", "/om-oss", "/about", "/about-us"];

const IGNORED_EMAILS = [
  "example.com", "example.no", "sentry.io", "wixpress.com",
  "schema.org", "w3.org", "googleapis.com", "facebook.com",
  "twitter.com", "instagram.com",
];

function isValidEmail(email: string): boolean {
  const lower = email.toLowerCase();
  if (IGNORED_EMAILS.some((domain) => lower.endsWith(domain))) return false;
  if (lower.includes("noreply") || lower.includes("no-reply")) return false;
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".svg")) return false;
  return true;
}

function rankEmail(email: string): number {
  const lower = email.toLowerCase();
  if (lower.startsWith("post@") || lower.startsWith("mail@")) return 10;
  if (lower.startsWith("kontakt@") || lower.startsWith("contact@")) return 9;
  if (lower.startsWith("info@")) return 8;
  if (lower.startsWith("salg@") || lower.startsWith("sales@")) return 7;
  if (lower.startsWith("firmapost@")) return 6;
  return 1;
}

function extractMetaDescription(html: string): string | null {
  const match = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  return match?.[1]?.trim() || null;
}

function extractOgDescription(html: string): string | null {
  const match = html.match(/<meta\s+[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    ?? html.match(/<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["']/i);
  return match?.[1]?.trim() || null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMainContent(html: string): string | null {
  // Try to find main/article content
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
    ?? html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);

  const source = mainMatch ? mainMatch[1] : html;
  const text = stripHtml(source);

  // Take a meaningful chunk (first ~500 chars of actual content)
  if (text.length < 30) return null;
  return text.slice(0, 500);
}

export interface WebsiteScrapeResult {
  email: string | null;
  description: string | null;
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ArgonCRM/1.0)",
        "Accept": "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function scrapeWebsite(websiteUrl: string): Promise<WebsiteScrapeResult> {
  let baseUrl: string;
  try {
    const url = new URL(websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`);
    baseUrl = url.origin;
  } catch {
    return { email: null, description: null };
  }

  const allEmails: string[] = [];
  let description: string | null = null;

  for (const path of CONTACT_PATHS) {
    const html = await fetchPage(`${baseUrl}${path}`);
    if (!html) {
      await new Promise((r) => setTimeout(r, 200));
      continue;
    }

    // Collect emails from every page
    const found = html.match(EMAIL_REGEX) ?? [];
    allEmails.push(...found.filter(isValidEmail));

    // Extract description from front page or about page
    if (!description && (path === "/" || path.includes("om") || path.includes("about"))) {
      description = extractMetaDescription(html)
        ?? extractOgDescription(html)
        ?? extractMainContent(html);
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  // Deduplicate and pick the best email
  let bestEmail: string | null = null;
  if (allEmails.length > 0) {
    const unique = [...new Set(allEmails.map((e) => e.toLowerCase()))];
    unique.sort((a, b) => rankEmail(b) - rankEmail(a));
    bestEmail = unique[0];
  }

  return { email: bestEmail, description };
}

// Backwards-compatible wrapper
export async function scrapeEmailFromWebsite(websiteUrl: string): Promise<string | null> {
  const result = await scrapeWebsite(websiteUrl);
  return result.email;
}
