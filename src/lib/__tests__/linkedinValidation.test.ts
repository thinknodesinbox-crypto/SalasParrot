import { describe, it, expect } from 'vitest';
import {
  getURLType,
  isLinkedInURL,
  validateProfileURL,
  validatePostURL,
  validateCompanyURL,
  validateSearchURL,
  validateProfileURLsBatch,
  validateImportURL,
} from '../linkedinValidation';

describe('getURLType', () => {
  it('returns null for empty string', () => {
    expect(getURLType('')).toBeNull();
  });

  it('returns null for non-LinkedIn URLs', () => {
    expect(getURLType('https://google.com')).toBeNull();
    expect(getURLType('https://twitter.com/user')).toBeNull();
  });

  it('identifies profile URLs', () => {
    expect(getURLType('https://linkedin.com/in/johndoe')).toBe('profile');
    expect(getURLType('https://www.linkedin.com/in/jane-smith')).toBe('profile');
    expect(getURLType('linkedin.com/in/user123')).toBe('profile');
  });

  it('identifies Sales Navigator profile URLs', () => {
    expect(getURLType('https://linkedin.com/sales/lead/ABC123')).toBe('sales_nav_profile');
    expect(getURLType('https://linkedin.com/sales/people/XYZ789')).toBe('sales_nav_profile');
  });

  it('identifies post URLs', () => {
    expect(getURLType('https://linkedin.com/posts/johndoe-activity-123456789')).toBe('post');
    expect(getURLType('https://linkedin.com/feed/update/urn:li:activity:123456789')).toBe('post');
    expect(getURLType('https://linkedin.com/feed/update/urn:li:share:123456789')).toBe('post');
    expect(getURLType('https://linkedin.com/feed/update/urn:li:ugcPost:123456789')).toBe('post');
  });

  it('identifies company URLs', () => {
    expect(getURLType('https://linkedin.com/company/acme-corp')).toBe('company');
    expect(getURLType('https://www.linkedin.com/company/google')).toBe('company');
  });

  it('identifies search URLs', () => {
    expect(getURLType('https://linkedin.com/search/results/people/')).toBe('search');
    expect(getURLType('https://linkedin.com/search/results/all/')).toBe('search');
  });

  it('identifies Sales Navigator search URLs', () => {
    expect(getURLType('https://linkedin.com/sales/search/')).toBe('sales_nav_search');
    expect(getURLType('https://linkedin.com/sales/lists/')).toBe('sales_nav_search');
  });

  it('identifies Recruiter search URLs', () => {
    expect(getURLType('https://linkedin.com/talent/search/')).toBe('recruiter_search');
    expect(getURLType('https://linkedin.com/recruiter/')).toBe('recruiter_search');
  });
});

describe('isLinkedInURL', () => {
  it('returns false for empty string', () => {
    expect(isLinkedInURL('')).toBe(false);
  });

  it('returns true for LinkedIn URLs', () => {
    expect(isLinkedInURL('https://linkedin.com/in/user')).toBe(true);
    expect(isLinkedInURL('https://www.linkedin.com/company/test')).toBe(true);
    expect(isLinkedInURL('linkedin.com/in/test')).toBe(true);
  });

  it('returns false for non-LinkedIn URLs', () => {
    expect(isLinkedInURL('https://google.com')).toBe(false);
    expect(isLinkedInURL('https://facebook.com')).toBe(false);
  });
});

describe('validateProfileURL', () => {
  it('returns error for empty URL', () => {
    const result = validateProfileURL('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL is required');
  });

  it('returns error for non-LinkedIn URL', () => {
    const result = validateProfileURL('https://google.com');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('LinkedIn URL');
  });

  it('validates standard profile URLs', () => {
    expect(validateProfileURL('https://linkedin.com/in/johndoe').valid).toBe(true);
    expect(validateProfileURL('https://www.linkedin.com/in/jane-smith').valid).toBe(true);
  });

  it('validates Sales Navigator profile URLs', () => {
    expect(validateProfileURL('https://linkedin.com/sales/lead/ABC123').valid).toBe(true);
    expect(validateProfileURL('https://linkedin.com/sales/people/XYZ789').valid).toBe(true);
  });

  it('returns error for post URLs', () => {
    const result = validateProfileURL('https://linkedin.com/posts/user-activity-123');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('post URL');
  });

  it('returns error for company URLs', () => {
    const result = validateProfileURL('https://linkedin.com/company/acme');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('company URL');
  });

  it('returns error for search URLs', () => {
    const result = validateProfileURL('https://linkedin.com/search/results/people/');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('search URL');
  });
});

describe('validatePostURL', () => {
  it('returns error for empty URL', () => {
    const result = validatePostURL('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL is required');
  });

  it('validates post URLs', () => {
    expect(validatePostURL('https://linkedin.com/posts/user-activity-123456789').valid).toBe(true);
    expect(validatePostURL('https://linkedin.com/feed/update/urn:li:activity:123').valid).toBe(
      true
    );
  });

  it('returns error for profile URLs', () => {
    const result = validatePostURL('https://linkedin.com/in/johndoe');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('profile URL');
  });
});

describe('validateCompanyURL', () => {
  it('returns error for empty URL', () => {
    const result = validateCompanyURL('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL is required');
  });

  it('validates company URLs', () => {
    expect(validateCompanyURL('https://linkedin.com/company/google').valid).toBe(true);
    expect(validateCompanyURL('https://www.linkedin.com/company/microsoft').valid).toBe(true);
  });

  it('returns error for profile URLs', () => {
    const result = validateCompanyURL('https://linkedin.com/in/johndoe');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('profile URL');
  });
});

describe('validateSearchURL', () => {
  it('returns error for empty URL', () => {
    const result = validateSearchURL('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL is required');
  });

  it('validates search URLs', () => {
    expect(validateSearchURL('https://linkedin.com/search/results/people/').valid).toBe(true);
    expect(validateSearchURL('https://linkedin.com/sales/search/').valid).toBe(true);
    expect(validateSearchURL('https://linkedin.com/talent/search/').valid).toBe(true);
  });

  it('returns error for profile URLs', () => {
    const result = validateSearchURL('https://linkedin.com/in/johndoe');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('profile URL');
  });
});

describe('validateProfileURLsBatch', () => {
  it('handles empty array', () => {
    const result = validateProfileURLsBatch([]);
    expect(result.validUrls).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('validates batch of URLs', () => {
    const urls = [
      'https://linkedin.com/in/user1',
      'https://linkedin.com/in/user2',
      'https://google.com',
      '',
    ];
    const result = validateProfileURLsBatch(urls);
    expect(result.validUrls).toHaveLength(2);
    expect(result.errors).toHaveLength(2);
  });

  it('includes row numbers in error messages', () => {
    const urls = ['', 'https://google.com'];
    const result = validateProfileURLsBatch(urls);
    expect(result.errors[0]).toContain('Row 1');
    expect(result.errors[1]).toContain('Row 2');
  });
});

describe('validateImportURL', () => {
  it('validates paste_urls as profile URLs', () => {
    expect(validateImportURL('https://linkedin.com/in/user', 'paste_urls').valid).toBe(true);
  });

  it('validates linkedin_post_reactors as post URLs', () => {
    expect(
      validateImportURL('https://linkedin.com/posts/user-activity-123', 'linkedin_post_reactors')
        .valid
    ).toBe(true);
  });

  it('validates linkedin_companies as company URLs', () => {
    expect(validateImportURL('https://linkedin.com/company/acme', 'linkedin_companies').valid).toBe(
      true
    );
  });

  it('validates linkedin_search as search URLs', () => {
    expect(
      validateImportURL('https://linkedin.com/search/results/people/', 'linkedin_search').valid
    ).toBe(true);
  });

  it('validates sales_nav_leads as search URLs', () => {
    expect(validateImportURL('https://linkedin.com/sales/search/', 'sales_nav_leads').valid).toBe(
      true
    );
  });

  it('handles unknown import types by checking LinkedIn URL', () => {
    expect(validateImportURL('https://linkedin.com/something', 'unknown_type').valid).toBe(true);
    expect(validateImportURL('https://google.com', 'unknown_type').valid).toBe(false);
  });

  it('returns error for empty URL', () => {
    const result = validateImportURL('', 'unknown_type');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL is required');
  });
});
