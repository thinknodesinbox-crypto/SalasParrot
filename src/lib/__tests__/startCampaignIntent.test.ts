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
});
