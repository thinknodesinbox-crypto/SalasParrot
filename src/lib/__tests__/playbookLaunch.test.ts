import { describe, expect, it } from 'vitest';
import {
  buildPlaybookCampaignDraft,
  buildPlaybookDiscoveryBrief,
  buildPlaybookSpecialInstructions,
  inferGrowthPlaybookIdFromText,
} from '../playbookLaunch';

describe('playbookLaunch', () => {
  it('detects event-led relationship selling from date-sensitive event prompts', () => {
    expect(
      inferGrowthPlaybookIdFromText(
        'Invite engineering leaders to our AI conference next month using our registration page'
      )
    ).toBe('event-led-relationship-selling');
  });

  it('detects lead reactivation from existing dormant lead prompts', () => {
    expect(inferGrowthPlaybookIdFromText('Reactivate old CRM leads from last quarter')).toBe(
      'lead-reactivation'
    );
  });

  it('defaults dynamic buying-trigger prompts to signal-led prospecting', () => {
    expect(
      inferGrowthPlaybookIdFromText(
        'Find engineering teams using LLMs in production with validation pain'
      )
    ).toBe('signal-led-prospecting');
  });

  it('builds a proof-backed event discovery brief and instructions', () => {
    const answers = {
      eventType: 'Conference',
      topic: 'AI infrastructure operations',
      audience: 'Developer relations leaders in New York City',
      registrationUrl: 'https://boundary.example/events/ai-ops',
      goal: 'Book meetings',
      postEventNurture: 'Share event recap and book follow-ups',
      sender: 'LinkedIn first',
    };

    const brief = buildPlaybookDiscoveryBrief({
      playbookId: 'event-led-relationship-selling',
      answers,
      workspace: { name: 'Boundary' },
    });
    const instructions = buildPlaybookSpecialInstructions({
      playbookId: 'event-led-relationship-selling',
      answers,
    });

    expect(brief).toContain('Event registration page');
    expect(brief).toContain('Developer relations leaders');
    expect(instructions).toContain("user's own event");
    expect(instructions).toContain('Preferred sender path: LinkedIn first');
  });

  it('keeps event-led motions usable when the registration URL is not ready yet', () => {
    const answers = {
      eventType: 'Private dinner',
      topic: 'How CFOs should evaluate AI finance workflows',
      audience: 'CFOs at growth-stage B2B companies in New York City',
      registrationUrl: '',
      goal: 'Book meetings',
      postEventNurture: 'Book meetings with attendees',
    };

    const brief = buildPlaybookDiscoveryBrief({
      playbookId: 'event-led-relationship-selling',
      answers,
      workspace: { name: 'SalesParrot' },
    });
    const instructions = buildPlaybookSpecialInstructions({
      playbookId: 'event-led-relationship-selling',
      answers,
    });
    const campaign = buildPlaybookCampaignDraft({
      playbookId: 'event-led-relationship-selling',
      answers,
      workspace: { name: 'SalesParrot' },
    });

    expect(brief).toContain('leave the registration CTA editable');
    expect(instructions).toContain('do not invent a registration link');
    expect(campaign.sequenceNodes.some((node) => node.data.message?.includes(answers.topic))).toBe(
      true
    );
  });

  it('creates campaign drafts with usable sequence nodes', () => {
    const draft = buildPlaybookCampaignDraft({
      playbookId: 'signal-led-prospecting',
      answers: {
        audience: 'AI platform teams',
        signal: 'LLM validation failures',
        cta: 'Book a meeting',
      },
      workspace: {
        name: 'Boundary',
        value_proposition: 'Contract testing for structured LLM outputs',
      },
      leadListId: 'list-1',
      leadListName: 'LLM Validation Signals',
    });

    expect(draft.name).toContain('Signal-led');
    expect(draft.leadListId).toBe('list-1');
    expect(draft.sequenceNodes.map((node) => node.type)).toEqual([
      'start',
      'linkedin_connect',
      'delay',
      'linkedin_message',
      'delay',
      'email',
      'end',
    ]);
    expect(draft.sequenceNodes.some((node) => node.data.message?.includes('LLM validation'))).toBe(
      true
    );
  });
});
