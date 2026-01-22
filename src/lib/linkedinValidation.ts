/**
 * LinkedIn URL validation utilities for frontend validation.
 * Validates URLs before sending to the API for better UX.
 */

export type LinkedInURLType =
  | 'profile'
  | 'sales_nav_profile'
  | 'post'
  | 'company'
  | 'search'
  | 'sales_nav_search'
  | 'recruiter_search';

// URL patterns for different LinkedIn URL types
const URL_PATTERNS: Record<LinkedInURLType, RegExp[]> = {
  profile: [/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([^/?\s]+)/i],
  sales_nav_profile: [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/sales\/lead\/([^/?,\s]+)/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/sales\/people\/([^/?,\s]+)/i,
  ],
  post: [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/posts\/[^/?]+[-_]?activity-(\d+)/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/feed\/update\/urn:li:activity:(\d+)/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/feed\/update\/urn:li:share:(\d+)/i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/feed\/update\/urn:li:ugcPost:(\d+)/i,
  ],
  company: [/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/([^/?\s]+)/i],
  search: [/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/search\/results\/(?:people|all)\//i],
  sales_nav_search: [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/sales\/search\//i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/sales\/lists\//i,
  ],
  recruiter_search: [
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/talent\/search\//i,
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/recruiter\//i,
  ],
};

/**
 * Determine the type of LinkedIn URL.
 */
export function getURLType(url: string): LinkedInURLType | null {
  if (!url) return null;
  const trimmed = url.trim();

  for (const [urlType, patterns] of Object.entries(URL_PATTERNS) as [LinkedInURLType, RegExp[]][]) {
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        return urlType;
      }
    }
  }

  return null;
}

/**
 * Check if URL is a valid LinkedIn URL (any type).
 */
export function isLinkedInURL(url: string): boolean {
  if (!url) return false;
  return url.trim().toLowerCase().includes('linkedin.com');
}

/**
 * Validate a LinkedIn profile URL.
 */
export function validateProfileURL(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  if (!isLinkedInURL(trimmed)) {
    return { valid: false, error: 'URL must be a LinkedIn URL (linkedin.com)' };
  }

  const urlType = getURLType(trimmed);

  if (urlType === 'profile' || urlType === 'sales_nav_profile') {
    return { valid: true };
  }

  // Provide helpful error messages for other URL types
  if (urlType === 'post') {
    return { valid: false, error: 'This is a LinkedIn post URL, not a profile URL' };
  }
  if (urlType === 'company') {
    return { valid: false, error: 'This is a LinkedIn company URL, not a profile URL' };
  }
  if (urlType === 'search' || urlType === 'sales_nav_search' || urlType === 'recruiter_search') {
    return { valid: false, error: 'This is a LinkedIn search URL, not a profile URL' };
  }

  return {
    valid: false,
    error: 'Invalid LinkedIn profile URL. Expected format: linkedin.com/in/username',
  };
}

/**
 * Validate a LinkedIn post URL.
 */
export function validatePostURL(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  if (!isLinkedInURL(trimmed)) {
    return { valid: false, error: 'URL must be a LinkedIn URL (linkedin.com)' };
  }

  const urlType = getURLType(trimmed);

  if (urlType === 'post') {
    return { valid: true };
  }

  if (urlType === 'profile' || urlType === 'sales_nav_profile') {
    return { valid: false, error: 'This is a LinkedIn profile URL, not a post URL' };
  }
  if (urlType === 'company') {
    return { valid: false, error: 'This is a LinkedIn company URL, not a post URL' };
  }

  return {
    valid: false,
    error:
      'Invalid LinkedIn post URL. Expected format: linkedin.com/posts/... or linkedin.com/feed/update/...',
  };
}

/**
 * Validate a LinkedIn company URL.
 */
export function validateCompanyURL(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  if (!isLinkedInURL(trimmed)) {
    return { valid: false, error: 'URL must be a LinkedIn URL (linkedin.com)' };
  }

  const urlType = getURLType(trimmed);

  if (urlType === 'company') {
    return { valid: true };
  }

  if (urlType === 'profile' || urlType === 'sales_nav_profile') {
    return { valid: false, error: 'This is a LinkedIn profile URL, not a company URL' };
  }
  if (urlType === 'post') {
    return { valid: false, error: 'This is a LinkedIn post URL, not a company URL' };
  }

  return {
    valid: false,
    error: 'Invalid LinkedIn company URL. Expected format: linkedin.com/company/company-name',
  };
}

/**
 * Validate a LinkedIn search URL.
 */
export function validateSearchURL(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  const trimmed = url.trim();

  if (!isLinkedInURL(trimmed)) {
    return { valid: false, error: 'URL must be a LinkedIn URL (linkedin.com)' };
  }

  const urlType = getURLType(trimmed);

  if (urlType === 'search' || urlType === 'sales_nav_search' || urlType === 'recruiter_search') {
    return { valid: true };
  }

  if (urlType === 'profile' || urlType === 'sales_nav_profile') {
    return { valid: false, error: 'This is a LinkedIn profile URL, not a search URL' };
  }
  if (urlType === 'post') {
    return { valid: false, error: 'This is a LinkedIn post URL, not a search URL' };
  }
  if (urlType === 'company') {
    return { valid: false, error: 'This is a LinkedIn company URL, not a search URL' };
  }

  return {
    valid: false,
    error:
      'Invalid LinkedIn search URL. Expected format: linkedin.com/search/results/people/... or linkedin.com/sales/search/...',
  };
}

/**
 * Validate a batch of profile URLs.
 * Returns an object with valid URLs and error messages for invalid ones.
 */
export function validateProfileURLsBatch(urls: string[]): {
  validUrls: string[];
  errors: string[];
} {
  const validUrls: string[] = [];
  const errors: string[] = [];

  urls.forEach((url, index) => {
    if (!url || !url.trim()) {
      errors.push(`Row ${index + 1}: Empty URL`);
      return;
    }

    const result = validateProfileURL(url.trim());

    if (result.valid) {
      validUrls.push(url.trim());
    } else {
      errors.push(`Row ${index + 1}: ${result.error}`);
    }
  });

  return { validUrls, errors };
}

/**
 * Validate URL based on import type.
 * This is the main validation function to call before starting an import.
 */
export function validateImportURL(
  url: string,
  importType: string
): { valid: boolean; error?: string } {
  switch (importType) {
    case 'paste_urls':
      return validateProfileURL(url);
    case 'linkedin_post_reactors':
      return validatePostURL(url);
    case 'linkedin_companies':
      return validateCompanyURL(url);
    case 'linkedin_search':
    case 'sales_nav_leads':
    case 'sales_nav_accounts':
    case 'linkedin_recruiter':
      return validateSearchURL(url);
    default:
      // For unknown types, just check if it's a LinkedIn URL
      if (!url || !url.trim()) {
        return { valid: false, error: 'URL is required' };
      }
      if (!isLinkedInURL(url)) {
        return { valid: false, error: 'URL must be a LinkedIn URL' };
      }
      return { valid: true };
  }
}
