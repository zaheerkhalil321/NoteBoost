/**
 * Web scraping utility to extract readable content from web pages
 * Uses basic fetch and HTML parsing to extract text content
 */

interface ScrapedContent {
  title: string;
  content: string;
  url: string;
}

/**
 * Strip HTML tags and extract text content
 */
const stripHtmlTags = (html: string): string => {
  // Remove script and style elements completely
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");

  // Clean up whitespace
  text = text
    .replace(/\s+/g, ' ') // Multiple spaces to single space
    .replace(/\n\s*\n/g, '\n\n') // Multiple newlines to double newline
    .trim();

  return text;
};

/**
 * Extract title from HTML
 */
const extractTitle = (html: string): string => {
  // Try to find title tag
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return stripHtmlTags(titleMatch[1]).trim();
  }

  // Try to find h1 tag
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    return stripHtmlTags(h1Match[1]).trim();
  }

  // Try og:title meta tag
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    return ogTitleMatch[1].trim();
  }

  return 'Untitled Page';
};

/**
 * Extract main content from HTML
 * Tries to find article, main, or body content
 */
const extractMainContent = (html: string): string => {
  // Try to find article tag
  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch && articleMatch[1]) {
    return stripHtmlTags(articleMatch[1]);
  }

  // Try to find main tag
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch && mainMatch[1]) {
    return stripHtmlTags(mainMatch[1]);
  }

  // Try to find content divs (common patterns)
  const contentPatterns = [
    /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*article[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of contentPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const content = stripHtmlTags(match[1]);
      if (content.length > 200) {
        return content;
      }
    }
  }

  // Fallback: extract all text from body
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return stripHtmlTags(bodyMatch[1]);
  }

  // Last resort: strip all tags from entire HTML
  return stripHtmlTags(html);
};

/**
 * Fetch and extract content from a web page
 * @param url - The URL to scrape
 * @returns Scraped content including title and main text
 */
export const scrapeWebPage = async (url: string): Promise<ScrapedContent> => {
  try {
    console.log(`Fetching content from: ${url}`);

    // Fetch the web page
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
    }

    // Get the HTML content
    const html = await response.text();

    if (!html || html.length < 100) {
      throw new Error('Received empty or invalid content from the URL');
    }

    // Extract title and content
    const title = extractTitle(html);
    const content = extractMainContent(html);

    // Validate we got meaningful content
    if (content.length < 100) {
      throw new Error('Could not extract meaningful content from the page. The page might be protected or require JavaScript.');
    }

    console.log(`Successfully extracted ${content.length} characters from ${url}`);

    // Limit content length to prevent overwhelming the AI
    const maxLength = 50000;
    const truncatedContent = content.length > maxLength
      ? content.substring(0, maxLength) + '\n\n[Content truncated due to length...]'
      : content;

    return {
      title,
      content: truncatedContent,
      url,
    };
  } catch (error) {
    console.log('Web scraping error:', error instanceof Error ? error.message : String(error));

    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw new Error('Network error: Please check your internet connection and try again.');
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error('Failed to extract content from the URL. The page might be protected or require special access.');
  }
};
