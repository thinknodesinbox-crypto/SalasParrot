import { describe, expect, it } from 'vitest';
import { normalizeStartCampaignIntent } from '../startCampaignIntent';

describe('normalizeStartCampaignIntent', () => {
  it('splits event discovery prompts into brief, location, proof, date, and clean LinkedIn keywords', () => {
    const intent = normalizeStartCampaignIntent(
      'Find people responsible for organizing paid AI, developer, data, or software engineering conferences in New York City in the next 60 days. Need public proof of paid registration or tickets.'
    );

    expect(intent.searchType).toBe('event');
    expect(intent.locationInput).toBe('New York City');
    expect(intent.discoveryBrief).toContain('people responsible for organizing paid AI');
    expect(intent.specialInstructions).toContain('Need public proof');
    expect(intent.specialInstructions).toContain('next 60 days');
    expect(intent.linkedinKeywords).toContain('AI');
    expect(intent.linkedinKeywords).toContain('organizer');
    expect(intent.linkedinKeywords).not.toContain('Need');
  });

  it('extracts target websites and recurrence from bulky pasted searches', () => {
    const intent = normalizeStartCampaignIntent(
      `Find engineering teams using LLMs in production where structured outputs need to be correct.
      Target websites: vercel.com/customers, https://stripe.com/customers, boundaryml.com
      EXCLUDE: any company currently in a Y Combinator batch.
      Goal is to get early users. Refresh this every 14 days.`
    );

    expect(intent.targetWebsites).toEqual(['vercel.com', 'stripe.com', 'boundaryml.com']);
    expect(intent.scheduleIntervalDays).toBe('14');
    expect(intent.specialInstructions).toContain('Y Combinator');
    expect(intent.specialInstructions).toContain('vercel.com');
    expect(intent.linkedinKeywords).toContain('engineering');
    expect(intent.linkedinKeywords).toContain('LLMs');
  });

  it('keeps LinkedIn people search concise and removes unsearchable constraints', () => {
    const intent = normalizeStartCampaignIntent(
      'Find VP of Finance and CFO profiles in Philadelphia. Exclude recruiters and consultants. Need people at B2B SaaS companies.'
    );

    expect(intent.locationInput).toBe('Philadelphia');
    expect(intent.linkedinKeywords).toContain('VP');
    expect(intent.linkedinKeywords).toContain('Finance');
    expect(intent.linkedinKeywords).not.toContain('Exclude');
    expect(intent.linkedinKeywords).not.toContain('Philadelphia');
    expect(intent.specialInstructions).toContain('Exclude recruiters');
  });

  it('keeps source-link recency requirements out of LinkedIn keywords', () => {
    const intent = normalizeStartCampaignIntent(
      'Find founders of B2B SaaS companies that recently announced SOC 2, ISO 27001, or enterprise security launches. Need public source links from the last 30 days.'
    );

    expect(intent.searchType).toBe('intent');
    expect(intent.specialInstructions).toContain('Need public source links');
    expect(intent.specialInstructions).toContain('last 30 days');
    expect(intent.linkedinKeywords).toContain('founders');
    expect(intent.linkedinKeywords).not.toContain('source');
    expect(intent.linkedinKeywords).not.toContain('last');
  });

  it('does not treat CTA webinar language as event-lead discovery', () => {
    const intent = normalizeStartCampaignIntent(
      'ICP: healthcare AI operations leaders at post-Series A companies. Pain: extraction accuracy, failed automations, audit trails. Geography: US and Canada. CTA: invite to a private webinar. Must exclude hospitals and agencies.'
    );

    expect(intent.searchType).toBe('intent');
    expect(intent.discoveryBrief).toContain('healthcare AI operations leaders');
    expect(intent.specialInstructions).toContain('Must exclude hospitals');
    expect(intent.specialInstructions).toContain('CTA: invite to a private webinar');
    expect(intent.linkedinKeywords).not.toContain('event');
    expect(intent.linkedinKeywords).not.toContain('organizer');
    expect(intent.linkedinKeywords).not.toContain('webinar');
  });

  it('cleans target website labels and multi-location text from parsed fields', () => {
    const websiteIntent = normalizeStartCampaignIntent(
      'Find engineering teams using LLMs in production. Target websites: https://vercel.com/customers, stripe.com/customers, https://www.retool.com/customers. EXCLUDE YC companies. Refresh every 14 days.'
    );
    const hiringIntent = normalizeStartCampaignIntent(
      'Find Series B fintech companies hiring founding account executives or sales engineers in London and Berlin. Exclude staffing agencies. Rerun every 21 days.'
    );

    expect(websiteIntent.targetWebsites).toEqual(['vercel.com', 'stripe.com', 'retool.com']);
    expect(websiteIntent.discoveryBrief).not.toContain('Target websites');
    expect(websiteIntent.discoveryBrief).not.toContain(',,');
    expect(hiringIntent.locationInput).toBe('London and Berlin');
    expect(hiringIntent.linkedinKeywords).not.toContain('London');
    expect(hiringIntent.linkedinKeywords).not.toContain('Berlin');
    expect(hiringIntent.scheduleIntervalDays).toBe('21');
  });
});
