import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import {
  useCalendarAccounts,
  useDashboardActivity,
  useDashboardCampaigns,
  useDashboardStats,
  useEmailAccounts,
  useCancelImport,
  useImportLeadsFromCSV,
  useImportJobStatus,
  useLinkedInAccounts,
  useLeadLists,
  useStartImport,
  useWorkspace,
} from '../../lib/hooks/queries';
import { api } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';
import {
  LEAD_FIELD_SYNONYMS,
  getLeadMappingPreviewLabel,
  LEAD_MAPPING_OPTIONS,
  type LeadCoreField,
  type LeadMappingSuggestion,
  type LeadMappingTarget,
} from '../../lib/leadImportMapping';
import { queryKeys } from '../../lib/queryClient';
import { useCurrentWorkspace } from '../../lib/workspace';
import type {
  DiscoveryRun,
  DiscoverySearchCreateRequest,
  DiscoverySearchPreview,
  ImportJob,
  Lead,
  LeadList,
  LeadListResponse,
  LinkedInAccount,
  PartnerAccessInfo,
  SavedDiscoverySearch,
  Workspace,
} from '../../lib/types';

export const Route = createFileRoute('/dashboard/')({
  component: DashboardHome,
});

type CommandMode = 'search' | 'playbook';
type SearchSource = 'discovery' | 'linkedin';
type PlaybookId =
  | 'event-led-relationship-selling'
  | 'lead-reactivation'
  | 'referral-partner-engine'
  | 'founder-led-sales'
  | 'local-market-domination';

type SuggestedSearch = {
  id: string;
  label: string;
  title: string;
  description: string;
  text: string;
  target: 'linkedin' | 'discovery' | 'playbook';
  ctaLabel: string;
  playbookId?: PlaybookId;
};

type GrowthPlaybook = {
  id: PlaybookId;
  name: string;
  status: 'featured' | 'next' | 'later';
  description: string;
  outcome: string;
  meaning: string;
  setup: string[];
  stages: string[];
  visual: 'event' | 'reactivation' | 'referral' | 'founder' | 'local';
  accent: string;
  surface: string;
};

type PlaybookSetupField = {
  id: string;
  label: string;
  prompt: string;
  helper: string;
  type: 'text' | 'textarea' | 'select' | 'datetime-local';
  optional?: boolean;
  placeholder?: string;
  options?: string[];
};

type PlaybookSetupConfig = {
  intro: string;
  bestFor: string;
  summary: string;
  builds: string[];
  fields: PlaybookSetupField[];
};

type PlaybookFieldSuggestion = {
  label: string;
  value: string;
};

type HomeSearchPhase = 'idle' | 'searching' | 'results';

type HomeSearchSummary = {
  sourceMode: 'linkedin' | 'upload';
  prompt: string;
  keywords: string;
  locationInput: string | null;
  resolvedLocation: string | null;
  locationWarning: string | null;
  accountName: string | null;
  finalListName: string;
  tempListName: string;
};

type LinkedInSearchParameterOption = {
  id: string;
  title: string;
};

type LinkedInSearchParametersLookupResponse = {
  items: LinkedInSearchParameterOption[];
};

const HOME_DRAFT_STORAGE_KEY = 'salesparrot-home-command-draft';
const HOME_LAUNCH_STORAGE_KEY = 'salesparrot-home-launch-intent';
const HOME_SEARCH_PAGE_SIZE = 10;

const growthPlaybooks: GrowthPlaybook[] = [
  {
    id: 'event-led-relationship-selling',
    name: 'Event-Led Relationship Selling',
    status: 'featured',
    description:
      'Turn an event into the relationship wedge. Parrot helps define the audience, build the invite motion, track attendance, and convert warm interest into pipeline.',
    outcome: 'Launch a trust-building event campaign end to end.',
    meaning: 'Use an event as the warm reason to start and deepen sales conversations.',
    setup: ['Event type', 'Topic', 'Audience', 'Format', 'Date and time', 'Campaign goal'],
    stages: [
      'Prospects identified',
      'Invited',
      'Interested',
      'Registered',
      'Attended',
      'Follow-up sent',
      'Booked meeting',
    ],
    visual: 'event',
    accent: '#FF6B35',
    surface: 'from-[#FFF1E8] via-white to-[#FFF7ED]',
  },
  {
    id: 'lead-reactivation',
    name: 'Lead Reactivation',
    status: 'next',
    description:
      'Import dormant leads, segment them intelligently, and relaunch conversations with reactivation messaging that feels timely.',
    outcome: 'Wake up old pipeline and surface new meetings.',
    meaning: 'Bring old leads back to life with a cleaner re-engagement sequence.',
    setup: ['Lead source', 'Reactivation angle', 'Segment rules', 'Offer or CTA'],
    stages: ['Imported', 'Segmented', 'Contacted', 'Replied', 'Qualified', 'Booked'],
    visual: 'reactivation',
    accent: '#2563EB',
    surface: 'from-[#EEF4FF] via-white to-[#F8FAFF]',
  },
  {
    id: 'referral-partner-engine',
    name: 'Referral Partner Engine',
    status: 'later',
    description:
      'Identify the right partner types, create the referral outreach motion, and track each relationship until it produces opportunity.',
    outcome: 'Build a repeatable referral and partnership channel.',
    meaning: 'Turn partners, brokers, and collaborators into a consistent source of pipeline.',
    setup: ['Partner type', 'Ideal profile', 'Offer', 'Region'],
    stages: ['Partners sourced', 'Reached out', 'Interested', 'Activated', 'Referrals created'],
    visual: 'referral',
    accent: '#14B8A6',
    surface: 'from-[#EAFBF8] via-white to-[#F4FFFD]',
  },
  {
    id: 'founder-led-sales',
    name: 'Founder-Led Sales',
    status: 'later',
    description:
      'Use founder voice, founder context, and high-trust outreach to turn ideal accounts into meaningful conversations faster.',
    outcome: 'Run a founder-shaped outbound motion without the blank page.',
    meaning: 'Lead outbound with founder credibility, context, and sharper personal positioning.',
    setup: ['ICP', 'Offer', 'Founder angle', 'Proof points'],
    stages: ['Targets set', 'Outreach live', 'Replies', 'Meetings', 'Pipeline'],
    visual: 'founder',
    accent: '#7C3AED',
    surface: 'from-[#F4EEFF] via-white to-[#FBF8FF]',
  },
  {
    id: 'local-market-domination',
    name: 'Local Market Domination',
    status: 'later',
    description:
      'Own a geography by mapping the market, reaching the right local buyers, and keeping territory follow-up organized.',
    outcome: 'Cover a local market with one coordinated growth motion.',
    meaning: 'Focus on one market, cover it tightly, and win through local relevance.',
    setup: ['Location', 'Industry', 'Offer', 'Coverage goal'],
    stages: ['Market mapped', 'Targets sourced', 'Reached out', 'Interested', 'Converted'],
    visual: 'local',
    accent: '#F59E0B',
    surface: 'from-[#FFF7E6] via-white to-[#FFFBF2]',
  },
];

const playbookSetupConfig: Record<PlaybookId, PlaybookSetupConfig> = {
  'event-led-relationship-selling': {
    intro:
      'Parrot will turn your event into a relationship-led campaign with sourcing, invite messaging, follow-up, and tracked outcomes.',
    bestFor:
      'Best when you need a warm, trust-first reason to open conversations instead of pitching cold.',
    summary:
      'You are defining the event, the audience, and the campaign goal. Parrot will handle the audience build, invite flow, reminders, and post-event follow-up path.',
    builds: [
      'Audience list and invite criteria',
      'Invite, reminder, and post-event sequence',
      'Attendance tracking and next-step actions',
    ],
    fields: [
      {
        id: 'eventType',
        label: 'Event type',
        prompt: 'What are you inviting people to?',
        helper: 'This tells Parrot how warm, direct, and personal the invite should feel.',
        type: 'select',
        options: [
          'Private dinner',
          'Roundtable',
          'Workshop',
          'Webinar',
          'Demo session',
          'Masterclass',
        ],
      },
      {
        id: 'topic',
        label: 'Event hook',
        prompt: 'What is the hook people would care about?',
        helper: 'Use the clearest reason someone in your audience would say yes.',
        type: 'textarea',
        placeholder: 'Pipeline efficiency for RevOps leaders at fast-growing B2B companies',
      },
      {
        id: 'audience',
        label: 'Audience',
        prompt: 'Who should Parrot invite?',
        helper: 'Use the buyer, partner, or role profile that would make the room valuable.',
        type: 'textarea',
        placeholder:
          'Heads of RevOps and revenue operations leaders at Series A-C SaaS companies in Lagos',
      },
      {
        id: 'format',
        label: 'Format',
        prompt: 'How will people attend?',
        helper: 'Parrot uses this to shape messaging, reminders, and attendance follow-up.',
        type: 'select',
        options: ['In-person', 'Virtual', 'Hybrid'],
      },
      {
        id: 'dateTime',
        label: 'Date and time',
        prompt: 'Do you already have a date and time?',
        helper:
          'Add it if you know it. If not, Parrot can still build the motion and leave scheduling flexible.',
        type: 'datetime-local',
        optional: true,
      },
      {
        id: 'goal',
        label: 'Campaign goal',
        prompt: 'What should happen after people engage?',
        helper:
          'This decides the follow-up path Parrot recommends after replies, RSVPs, or attendance.',
        type: 'select',
        options: [
          'Drive RSVPs',
          'Book meetings',
          'Generate demos',
          'Build partnerships',
          'Win referrals',
          'Move prospects to nurture',
        ],
      },
    ],
  },
  'lead-reactivation': {
    intro:
      'Parrot will wake up dormant leads, segment them intelligently, and run a cleaner re-engagement sequence against the right groups.',
    bestFor:
      'Best when there is already pipeline history and you need a credible reason to restart the conversation.',
    summary:
      'You are defining which old leads matter, why they should re-engage now, and what action you want them to take next.',
    builds: [
      'Lead segmentation and reactivation logic',
      'Re-engagement messaging by lead state',
      'Reply handling and meeting conversion path',
    ],
    fields: [
      {
        id: 'source',
        label: 'Lead source',
        prompt: 'Which dormant leads should Parrot revive?',
        helper:
          'Name the list, segment, campaign, or CRM source so Parrot understands the history.',
        type: 'text',
        placeholder: 'Old outbound campaigns, CRM exports, past webinar leads',
      },
      {
        id: 'window',
        label: 'Dormancy window',
        prompt: 'How long have these leads been inactive?',
        helper: 'This affects the tone and urgency of the reactivation sequence.',
        type: 'select',
        options: ['30-60 days', '60-90 days', '3-6 months', '6-12 months', '12+ months'],
      },
      {
        id: 'angle',
        label: 'Reactivation angle',
        prompt: 'What is the reason to restart the conversation now?',
        helper:
          'Use a real change, useful insight, or stronger offer so it does not feel like a random check-in.',
        type: 'textarea',
        placeholder: 'New product launch, pricing shift, market change, relevant case study',
      },
      {
        id: 'cta',
        label: 'Primary CTA',
        prompt: 'What should interested leads do next?',
        helper: 'Parrot will optimize the sequence around this action.',
        type: 'select',
        options: [
          'Book a meeting',
          'Reply for more details',
          'Start a trial',
          'Request a demo',
          'Rejoin nurture',
        ],
      },
    ],
  },
  'referral-partner-engine': {
    intro:
      'Parrot will help you identify the right partners, open the relationship, nurture it, and track referral opportunity creation end to end.',
    bestFor:
      'Best when growth depends on trusted introducers, channel partners, or local ecosystem relationships.',
    summary:
      'You are defining who the right partners are, what makes them valuable, and what kind of referral motion Parrot should build.',
    builds: [
      'Partner shortlist and sourcing criteria',
      'Referral outreach and nurture sequence',
      'Opportunity tracking for activated partners',
    ],
    fields: [
      {
        id: 'partnerType',
        label: 'Partner type',
        prompt: 'What kind of partners are you looking for?',
        helper: 'Think in clear partner categories, not broad job titles.',
        type: 'select',
        options: [
          'Agencies',
          'Consultants',
          'Brokers',
          'Accountants',
          'Local business owners',
          'Strategic operators',
        ],
      },
      {
        id: 'idealProfile',
        label: 'Ideal partner profile',
        prompt: 'What makes a partner worth pursuing?',
        helper:
          'Describe who they influence, who trusts them, and why they can create useful introductions.',
        type: 'textarea',
        placeholder:
          'Works with growth-stage B2B founders, trusted by CFOs, active in Lagos tech ecosystem',
      },
      {
        id: 'offer',
        label: 'Referral offer',
        prompt: 'What value will you present to partners?',
        helper: 'This becomes the backbone of the outreach and follow-up flow.',
        type: 'textarea',
        placeholder:
          'Revenue share, mutual referrals, access to our audience, better client outcomes',
      },
      {
        id: 'region',
        label: 'Region',
        prompt: 'Should this partner motion focus on a region?',
        helper:
          'Add a geography if it matters. Leave it open if the partner profile matters more than location.',
        type: 'text',
        optional: true,
        placeholder: 'Dubai, Lagos, United Kingdom, East Coast US',
      },
    ],
  },
  'founder-led-sales': {
    intro:
      'Parrot will shape an outbound motion around founder credibility, sharper positioning, and personal context instead of generic AI sales copy.',
    bestFor:
      'Best when founder context or credibility should be the wedge that makes outreach believable.',
    summary:
      'You are defining the target market, the founder angle, and the proof points Parrot should lean on in outreach.',
    builds: [
      'Founder-led target account definition',
      'Personalized founder-style messaging',
      'Reply handling and meeting conversion flow',
    ],
    fields: [
      {
        id: 'icp',
        label: 'Ideal customer profile',
        prompt: 'Who should the founder personally reach?',
        helper:
          'Use the narrow buyer profile where founder credibility will make the biggest difference.',
        type: 'textarea',
        placeholder: 'Heads of finance at growth-stage B2B companies with complex reporting needs',
      },
      {
        id: 'offer',
        label: 'Offer',
        prompt: 'What are you selling or trying to open?',
        helper: 'Parrot needs the real commercial motion, not just the product category.',
        type: 'text',
        placeholder: 'AI finance workflow platform for CFO teams',
      },
      {
        id: 'founderAngle',
        label: 'Founder angle',
        prompt: 'What should make this sound founder-led?',
        helper:
          'Use a personal insight, earned opinion, or origin story that would be hard for a generic sender to copy.',
        type: 'textarea',
        placeholder:
          'Built this after struggling with fragmented reporting across fast-growing teams',
      },
      {
        id: 'proof',
        label: 'Proof points',
        prompt: 'What proof should Parrot lean on?',
        helper:
          'Add the strongest trust signals available. This can be customer wins, metrics, background, or a specific result.',
        type: 'textarea',
        placeholder: 'Customer wins, metrics, founder background, social proof',
      },
    ],
  },
  'local-market-domination': {
    intro:
      'Parrot will help you map a local market, source the right businesses or contacts in it, and run a coordinated location-first growth motion.',
    bestFor:
      'Best when you want to win one geography tightly instead of spreading outreach across too many markets.',
    summary:
      'You are defining the geography, the industry, and the coverage goal so Parrot can build a market-specific campaign path.',
    builds: [
      'Market map and local target list',
      'Localized messaging and follow-up flow',
      'Territory coverage tracking by market',
    ],
    fields: [
      {
        id: 'location',
        label: 'Target location',
        prompt: 'Which market should Parrot focus on first?',
        helper: 'Use a city, metro, region, or territory small enough to cover with intent.',
        type: 'text',
        placeholder: 'Dubai, Nairobi, Houston, Greater London',
      },
      {
        id: 'industry',
        label: 'Industry',
        prompt: 'Which local niche should Parrot map?',
        helper:
          'Choose the business type or buyer category where local relevance gives you an edge.',
        type: 'text',
        placeholder: 'Dental clinics, logistics companies, private schools, B2B SaaS',
      },
      {
        id: 'offer',
        label: 'Offer',
        prompt: 'What are you taking into the market?',
        helper: 'Parrot uses this to shape the message and prioritization.',
        type: 'text',
        placeholder: 'Outbound growth support, financial ops software, local partnerships',
      },
      {
        id: 'coverageGoal',
        label: 'Coverage goal',
        prompt: 'What would strong market coverage look like?',
        helper: 'This sets the sourcing and follow-up ambition for the motion.',
        type: 'select',
        options: [
          'First 25 targets',
          'First 50 targets',
          'Full market map',
          'Meetings with top buyers',
          'Partnership coverage',
        ],
      },
    ],
  },
};

const getPlaybookStatusLabel = (status: GrowthPlaybook['status']) => {
  if (status === 'featured') return 'Ready now';
  if (status === 'next') return 'Next up';
  return 'Later';
};

const getWorkspaceDisplayName = (workspace: Workspace | null) =>
  workspace?.client_name?.trim() || workspace?.name?.trim() || 'your business';

const trimSentence = (value: string | null | undefined, maxLength = 120) => {
  const trimmed = value?.trim();
  if (!trimmed) return '';
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 3).trim()}...` : trimmed;
};

const inferGoalFromWorkspace = (workspace: Workspace | null) => {
  const source =
    `${workspace?.cta_preference || ''} ${workspace?.outreach_intent || ''}`.toLowerCase();
  if (source.includes('referral')) return 'Win referrals';
  if (source.includes('partner')) return 'Build partnerships';
  if (source.includes('demo')) return 'Generate demos';
  if (source.includes('consult')) return 'Book meetings';
  if (source.includes('book')) return 'Book meetings';
  return '';
};

const inferEventFormatFromType = (eventType: string) => {
  switch (eventType) {
    case 'Private dinner':
    case 'Roundtable':
    case 'Workshop':
    case 'Masterclass':
      return 'In-person';
    case 'Webinar':
      return 'Virtual';
    case 'Demo session':
      return 'Virtual';
    default:
      return '';
  }
};

const getVisiblePlaybookFields = (
  playbookId: PlaybookId,
  config: PlaybookSetupConfig,
  answers: Record<string, string>
) => {
  if (playbookId !== 'event-led-relationship-selling') return config.fields;

  const eventType = answers.eventType?.trim();

  return config.fields.filter((field) => {
    if (field.id === 'format') return false;
    if (field.id === 'topic' && eventType === 'Private dinner') return false;
    return true;
  });
};

const buildInitialPlaybookDraft = (
  playbookId: PlaybookId,
  workspace: Workspace | null
): Record<string, string> => {
  const icp = workspace?.icp?.trim() || '';
  const valueProp = workspace?.value_proposition?.trim() || '';
  const outreachIntent = workspace?.outreach_intent?.trim() || '';
  const businessBlurb = trimSentence(workspace?.business_blurb, 140);
  const inferredGoal = inferGoalFromWorkspace(workspace);

  switch (playbookId) {
    case 'event-led-relationship-selling':
      return {
        audience: icp,
        topic: valueProp || outreachIntent,
        goal: inferredGoal,
      };
    case 'lead-reactivation':
      return {
        source: 'Existing leads already in this workspace',
        angle: valueProp || outreachIntent,
        cta:
          inferredGoal === 'Generate demos'
            ? 'Request a demo'
            : inferredGoal === 'Book meetings'
              ? 'Book a meeting'
              : '',
      };
    case 'referral-partner-engine':
      return {
        idealProfile: icp,
        offer: valueProp,
        region: '',
      };
    case 'founder-led-sales':
      return {
        icp,
        offer: valueProp,
        proof: businessBlurb,
      };
    case 'local-market-domination':
      return {
        offer: valueProp,
      };
    default:
      return {};
  }
};

const getPlaybookFieldSuggestions = (
  playbookId: PlaybookId,
  field: PlaybookSetupField | null,
  answers: Record<string, string>,
  workspace: Workspace | null
): PlaybookFieldSuggestion[] => {
  if (!field || !workspace) return [];

  const companyName = getWorkspaceDisplayName(workspace);
  const icp = workspace.icp?.trim() || '';
  const valueProp = workspace.value_proposition?.trim() || '';
  const outreachIntent = workspace.outreach_intent?.trim() || '';
  const businessBlurb = trimSentence(workspace.business_blurb, 110);
  const eventType = answers.eventType?.trim() || 'event';

  const push = (
    items: PlaybookFieldSuggestion[],
    label: string,
    value: string | null | undefined
  ) => {
    const cleaned = value?.trim();
    if (!cleaned) return;
    if (items.some((item) => item.value.toLowerCase() === cleaned.toLowerCase())) return;
    items.push({ label, value: cleaned });
  };

  const suggestions: PlaybookFieldSuggestion[] = [];

  if (playbookId === 'event-led-relationship-selling') {
    if (field.id === 'topic') {
      push(suggestions, 'From your value proposition', valueProp);
      push(suggestions, 'From current outreach intent', outreachIntent);
      push(suggestions, 'Business angle', valueProp && icp ? `${valueProp} for ${icp}` : '');
    }

    if (field.id === 'audience') {
      push(suggestions, 'Saved ICP', icp);
      push(
        suggestions,
        'Warmer invite list',
        icp
          ? `${icp} who would say yes to a ${eventType.toLowerCase()} invite from ${companyName}`
          : ''
      );
      push(
        suggestions,
        'Problem-aware audience',
        valueProp && icp ? `${icp} actively dealing with ${valueProp.toLowerCase()}` : ''
      );
    }
  }

  if (playbookId === 'lead-reactivation') {
    if (field.id === 'source') {
      push(suggestions, 'Workspace leads', 'Existing leads already in this workspace');
      push(
        suggestions,
        'Past campaign leads',
        'Leads from previous campaigns with no recent reply'
      );
    }
    if (field.id === 'angle') {
      push(suggestions, 'Value proposition', valueProp);
      push(suggestions, 'Current outreach angle', outreachIntent);
      push(suggestions, 'Business context', businessBlurb);
    }
  }

  if (playbookId === 'referral-partner-engine') {
    if (field.id === 'idealProfile') {
      push(suggestions, 'Partner fit from ICP', icp ? `Partners already trusted by ${icp}` : '');
      push(
        suggestions,
        'Partner fit from offer',
        valueProp ? `Partners who can introduce buyers needing ${valueProp}` : ''
      );
    }
    if (field.id === 'offer') {
      push(suggestions, 'From your value proposition', valueProp);
      push(suggestions, 'From current outreach intent', outreachIntent);
    }
  }

  if (playbookId === 'founder-led-sales') {
    if (field.id === 'icp') push(suggestions, 'Saved ICP', icp);
    if (field.id === 'offer') push(suggestions, 'From your value proposition', valueProp);
    if (field.id === 'founderAngle') {
      push(
        suggestions,
        'From business context',
        businessBlurb ? `I noticed ${businessBlurb.toLowerCase()}` : ''
      );
      push(
        suggestions,
        'From outreach intent',
        outreachIntent ? `I am reaching out because ${outreachIntent.toLowerCase()}` : ''
      );
    }
    if (field.id === 'proof') {
      push(suggestions, 'Business blurb', businessBlurb);
      push(suggestions, 'Current outreach angle', outreachIntent);
    }
  }

  if (playbookId === 'local-market-domination') {
    if (field.id === 'location') {
      push(suggestions, 'Start with one city', 'Dubai');
      push(suggestions, 'Start with one metro', 'Greater London');
    }
    if (field.id === 'offer') push(suggestions, 'From your value proposition', valueProp);
    if (field.id === 'industry') {
      push(suggestions, 'Derived from ICP', icp);
      push(suggestions, 'Derived from business context', businessBlurb);
    }
  }

  return suggestions.slice(0, 3);
};

const buildLeadListNameFromPrompt = (prompt: string) => {
  const normalized = prompt
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.?!]+$/, '');
  if (!normalized) return 'Prospect search';
  return normalized.length > 72 ? `${normalized.slice(0, 69).trim()}...` : normalized;
};

const buildPreviewLeadListName = (finalListName: string) => `Preview - ${finalListName}`;

const sanitizeLocationInput = (value: string | null | undefined) => {
  if (!value) return '';
  return value
    .replace(/^\s*the\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
};

function normalizeLeadHeader(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function tokenizeLeadHeader(value: string): string[] {
  return normalizeLeadHeader(value)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreLeadHeaderAgainstSynonym(header: string, synonym: string): number {
  const normalizedHeader = normalizeLeadHeader(header);
  const normalizedSynonym = normalizeLeadHeader(synonym);
  if (!normalizedHeader || !normalizedSynonym) return 0;
  if (normalizedHeader === normalizedSynonym) return 1;
  if (
    normalizedHeader.includes(normalizedSynonym) ||
    normalizedSynonym.includes(normalizedHeader)
  ) {
    return 0.92;
  }
  const headerTokens = new Set(tokenizeLeadHeader(header));
  const synonymTokens = tokenizeLeadHeader(synonym);
  const overlap = synonymTokens.filter((token) => headerTokens.has(token)).length;
  if (overlap === 0) return 0;
  const tokenScore = overlap / synonymTokens.length;
  const coverageBoost = overlap / Math.max(headerTokens.size, 1);
  return Math.min(0.88, tokenScore * 0.7 + coverageBoost * 0.18);
}

function looksLikeEmailValue(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function looksLikeLinkedInUrlValue(value: string) {
  return /linkedin\.com\/(in|pub|sales\/lead|recruiter)/i.test(value.trim());
}

function looksLikeFullNameValue(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized || looksLikeEmailValue(normalized) || /^https?:\/\//i.test(normalized)) {
    return false;
  }
  const parts = normalized
    .split(' ')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2 || parts.length > 4) return false;
  return parts.every((part) => /^[A-Za-zÀ-ÿ'`.-]{2,}$/.test(part));
}

function looksLikeSingleNamePartValue(value: string) {
  const normalized = value.trim();
  return /^[A-Za-zÀ-ÿ'`.-]{2,}$/.test(normalized);
}

function looksLikeJobTitleValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length > 90) return false;
  return [
    'ceo',
    'cto',
    'cfo',
    'coo',
    'founder',
    'owner',
    'president',
    'vp',
    'vice president',
    'head',
    'director',
    'manager',
    'lead',
    'engineer',
    'developer',
    'consultant',
    'marketing',
    'sales',
    'revenue',
    'operations',
    'finance',
  ].some((keyword) => normalized.includes(keyword));
}

function looksLikeHeadlineValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized.length < 18) return false;
  return normalized.includes(' at ') || normalized.includes(' | ') || looksLikeJobTitleValue(value);
}

function looksLikeLocationValue(value: string) {
  const normalized = value.trim();
  if (!normalized || looksLikeEmailValue(normalized) || /^https?:\/\//i.test(normalized)) {
    return false;
  }
  const parts = normalized
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2 && parts.every((part) => /^[A-Za-zÀ-ÿ.' -]{2,}$/.test(part))) {
    return true;
  }
  const words = normalized.split(/\s+/).filter(Boolean);
  return words.length <= 4 && words.every((word) => /^[A-Za-zÀ-ÿ.'-]{2,}$/.test(word));
}

function looksLikeCompanyValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized || looksLikeEmailValue(normalized) || /^https?:\/\//i.test(normalized)) {
    return false;
  }
  return (
    ['inc', 'llc', 'ltd', 'limited', 'corp', 'company', 'gmbh', 'plc', 'group'].some((keyword) =>
      normalized.includes(keyword)
    ) ||
    (!looksLikeJobTitleValue(value) && normalized.split(/\s+/).length <= 6)
  );
}

function ratioOf(values: string[], predicate: (value: string) => boolean) {
  if (!values.length) return 0;
  return values.filter(predicate).length / values.length;
}

function getLeadColumnSuggestion(
  header: string,
  sampleValues: string[] = []
): LeadMappingSuggestion {
  const normalizedHeader = normalizeLeadHeader(header);
  let bestField: LeadCoreField | null = null;
  let bestScore = 0;
  let bestReason = 'Will be added to the lead context field.';
  let splitNameScore = 0;
  let splitNameReason = '';

  (Object.entries(LEAD_FIELD_SYNONYMS) as Array<[LeadCoreField, string[]]>).forEach(
    ([field, synonyms]) => {
      synonyms.forEach((synonym) => {
        const score = scoreLeadHeaderAgainstSynonym(header, synonym);
        if (score > bestScore) {
          bestScore = score;
          bestField = field;
          bestReason =
            score >= 0.92
              ? `Strong match for ${field.replace('_', ' ')}`
              : `Likely ${field.replace('_', ' ')} based on similar wording`;
        }
      });
    }
  );

  const populatedSampleValues = sampleValues
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (populatedSampleValues.length > 0) {
    const emailRatio = ratioOf(populatedSampleValues, looksLikeEmailValue);
    const linkedInRatio = ratioOf(populatedSampleValues, looksLikeLinkedInUrlValue);
    const fullNameRatio = ratioOf(populatedSampleValues, looksLikeFullNameValue);
    const singleNameRatio = ratioOf(populatedSampleValues, looksLikeSingleNamePartValue);
    const titleRatio = ratioOf(populatedSampleValues, looksLikeJobTitleValue);
    const headlineRatio = ratioOf(populatedSampleValues, looksLikeHeadlineValue);
    const locationRatio = ratioOf(populatedSampleValues, looksLikeLocationValue);
    const companyRatio = ratioOf(populatedSampleValues, looksLikeCompanyValue);

    if (emailRatio >= 0.6 && bestScore < 0.97) {
      bestField = 'email';
      bestScore = 0.97;
      bestReason = 'Sample values look like email addresses.';
    }
    if (linkedInRatio >= 0.6 && bestScore < 0.97) {
      bestField = 'linkedin_url';
      bestScore = 0.97;
      bestReason = 'Sample values look like LinkedIn profile URLs.';
    }
    if (fullNameRatio >= 0.6) {
      splitNameScore = normalizedHeader.includes('name') ? 0.98 : 0.9;
      splitNameReason = 'Sample values look like full names that can be split automatically.';
    }
    if (titleRatio >= 0.5 && bestScore < 0.86) {
      bestField = 'title';
      bestScore = 0.86;
      bestReason = 'Sample values look like job titles.';
    }
    if (headlineRatio >= 0.5 && bestScore < 0.82) {
      bestField = 'headline';
      bestScore = 0.82;
      bestReason = 'Sample values look like LinkedIn headlines.';
    }
    if (locationRatio >= 0.5 && bestScore < 0.78) {
      bestField = 'location';
      bestScore = 0.78;
      bestReason = 'Sample values look like locations.';
    }
    if (companyRatio >= 0.5 && bestScore < 0.76) {
      bestField = 'company';
      bestScore = 0.76;
      bestReason = 'Sample values look like company names.';
    }
    if (singleNameRatio >= 0.7 && normalizedHeader.includes('first') && bestScore < 0.9) {
      bestField = 'first_name';
      bestScore = 0.9;
      bestReason = 'Sample values look like first names.';
    }
    if (singleNameRatio >= 0.7 && normalizedHeader.includes('last') && bestScore < 0.9) {
      bestField = 'last_name';
      bestScore = 0.9;
      bestReason = 'Sample values look like last names.';
    }
  }

  if (normalizedHeader.includes('mail') && bestScore < 0.9) {
    bestField = 'email';
    bestScore = 0.9;
    bestReason = 'Detected email-style wording.';
  }
  if (
    normalizedHeader.includes('linkedin') &&
    normalizedHeader.includes('profile') &&
    bestScore < 0.9
  ) {
    bestField = 'linkedin_url';
    bestScore = 0.9;
    bestReason = 'Detected LinkedIn profile-style wording.';
  }

  if (splitNameScore >= bestScore && splitNameScore >= 0.75) {
    return {
      target: '__split_full_name__',
      confidence: splitNameScore >= 0.92 ? 'high' : splitNameScore >= 0.75 ? 'medium' : 'low',
      score: splitNameScore,
      reason: splitNameReason,
    };
  }

  if (!bestField || bestScore < 0.45) {
    return {
      target: '__keep__',
      confidence: 'low',
      score: bestScore,
      reason: 'No strong core-field match found, so this column will be kept as-is.',
    };
  }

  return {
    target: bestField,
    confidence: bestScore >= 0.9 ? 'high' : bestScore >= 0.7 ? 'medium' : 'low',
    score: bestScore,
    reason: bestReason,
  };
}

function autoMapLeadColumns(headers: string[], rows: string[][]) {
  const suggestions = Object.fromEntries(
    headers.map((header, index) => {
      const sampleValues = rows.map((row) => row[index] || '');
      return [header, getLeadColumnSuggestion(header, sampleValues)];
    })
  ) as Record<string, LeadMappingSuggestion>;

  const assigned = new Set<LeadMappingTarget>();
  const headersByStrength = [...headers].sort(
    (left, right) => suggestions[right].score - suggestions[left].score
  );

  headersByStrength.forEach((header) => {
    const suggestion = suggestions[header];
    const target = suggestion.target;
    if (target === '__keep__' || target === '__ignore__') return;
    if (
      target === '__split_full_name__' &&
      (assigned.has('first_name') || assigned.has('last_name'))
    ) {
      suggestions[header] = {
        target: '__keep__',
        confidence: 'low',
        score: suggestion.score,
        reason: 'Separate first and last name columns matched more strongly.',
      };
      return;
    }
    if (assigned.has(target)) {
      suggestions[header] = {
        target: '__keep__',
        confidence: 'low',
        score: suggestion.score,
        reason: `Another column matched ${String(target).replace(/_/g, ' ')} more strongly.`,
      };
      return;
    }
    assigned.add(target);
  });

  return suggestions;
}

function splitFullName(value: string) {
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return { firstName: '', lastName: '' };
  if (normalized.includes(',')) {
    const [lastName, firstName] = normalized.split(',').map((part) => part.trim());
    return { firstName: firstName || '', lastName: lastName || '' };
  }
  const parts = normalized.split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts.slice(-1).join(' '),
  };
}

function detectLeadDelimiter(text: string): ',' | ';' | '\t' {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || '';
  const candidates: Array<',' | ';' | '\t'> = [',', ';', '\t'];
  return candidates.reduce((best, candidate) => {
    const bestCount = firstLine.split(best).length;
    const candidateCount = firstLine.split(candidate).length;
    return candidateCount > bestCount ? candidate : best;
  }, ',');
}

function parseLeadDelimitedLine(line: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

function escapeLeadCsvCell(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

const parseAudiencePrompt = (prompt: string) => {
  const trimmed = prompt.replace(/\s+/g, ' ').trim();
  if (!trimmed) {
    return { keywords: '', locationInput: null };
  }

  const patterns = [
    /^(?<keywords>.+?)\s+(?:in|based in|located in|around)\s+(?<location>[A-Za-z][A-Za-z\s,'-]{1,80})$/i,
    /^(?<keywords>.+?)\s+(?:for|across)\s+(?<location>[A-Za-z][A-Za-z\s,'-]{1,80})$/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    const keywords = match?.groups?.keywords?.trim();
    const locationInput = sanitizeLocationInput(match?.groups?.location?.trim());
    if (keywords && locationInput) {
      return { keywords, locationInput };
    }
  }

  return { keywords: trimmed, locationInput: null };
};

const getLinkedInApiType = (account: LinkedInAccount | null) => {
  if (!account) return 'classic';
  if (account.subscription_type === 'sales_nav') return 'sales_navigator';
  if (account.subscription_type === 'recruiter') return 'recruiter';
  return 'classic';
};

const getLinkedInAccountPriority = (account: LinkedInAccount) => {
  if (account.subscription_type === 'sales_nav') return 4;
  if (account.subscription_type === 'recruiter') return 3;
  if (account.subscription_type === 'premium') return 2;
  return 1;
};

const getLinkedInAccountLabel = (account: LinkedInAccount) => {
  const baseName = account.name?.trim() || 'LinkedIn account';
  const plan =
    account.subscription_type === 'sales_nav'
      ? 'Sales Navigator'
      : account.subscription_type === 'recruiter'
        ? 'Recruiter'
        : account.subscription_type === 'premium'
          ? 'Premium'
          : 'Classic';
  return `${baseName} · ${plan}`;
};

const findBestLocationMatch = (
  locationInput: string,
  items: LinkedInSearchParameterOption[]
): LinkedInSearchParameterOption | null => {
  const normalizedInput = locationInput.trim().toLowerCase();
  if (!normalizedInput) return null;

  const exactMatch = items.find((item) => item.title.trim().toLowerCase() === normalizedInput);
  if (exactMatch) return exactMatch;
  if (items.length === 1) return items[0];

  const startsWithMatch = items.find((item) =>
    item.title.trim().toLowerCase().startsWith(normalizedInput)
  );
  if (startsWithMatch) return startsWithMatch;

  const includesMatch = items.find((item) =>
    item.title.trim().toLowerCase().includes(normalizedInput)
  );
  return includesMatch ?? null;
};

const getHomeSearchStatusCopy = ({
  phase,
  job,
  leadsLoading,
  summary,
}: {
  phase: HomeSearchPhase;
  job: ImportJob | undefined;
  leadsLoading: boolean;
  summary: HomeSearchSummary | null;
}) => {
  if (leadsLoading) return 'Preparing leads preview';
  if (phase !== 'searching') return 'Ready';
  if (summary?.sourceMode === 'upload') {
    return leadsLoading ? 'Preparing leads preview' : 'Uploading list';
  }
  if (
    leadsLoading ||
    job?.status === 'completed' ||
    (job?.processed_count || 0) > 0 ||
    (job?.progress || 0) > 10
  ) {
    return 'Fetching leads';
  }
  if (job?.status === 'running') return 'Searching';
  return 'Starting search';
};

function DashboardHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { currentWorkspaceId } = useCurrentWorkspace();
  const { data: workspace = null } = useWorkspace(currentWorkspaceId || '');
  const { data: linkedInAccounts = [] } = useLinkedInAccounts();
  const { data: emailAccounts = [] } = useEmailAccounts();
  const { data: calendarAccounts = [] } = useCalendarAccounts();
  const startImportMutation = useStartImport();
  const cancelImportMutation = useCancelImport();
  const importCsvMutation = useImportLeadsFromCSV();
  const uploadListInputRef = useRef<HTMLInputElement | null>(null);
  const commandComposerRef = useRef<HTMLDivElement | null>(null);
  const commandInputRef = useRef<HTMLTextAreaElement | null>(null);

  const [commandMode, setCommandMode] = useState<CommandMode>('search');
  const [searchSource, setSearchSource] = useState<SearchSource>('linkedin');
  const [searchSourceMenuOpen, setSearchSourceMenuOpen] = useState(false);
  const [selectedLinkedInAccountId, setSelectedLinkedInAccountId] = useState('');
  const [selectedPlaybook, setSelectedPlaybook] = useState<PlaybookId>(
    'event-led-relationship-selling'
  );
  const [playbookSetupOpen, setPlaybookSetupOpen] = useState(false);
  const [playbookSetupStep, setPlaybookSetupStep] = useState(0);
  const [playbookDrafts, setPlaybookDrafts] = useState<
    Partial<Record<PlaybookId, Record<string, string>>>
  >({});
  const [commandText, setCommandText] = useState('');
  const [activeSuggestedSearchId, setActiveSuggestedSearchId] = useState<string | null>(null);
  const [searchKeywordsDraft, setSearchKeywordsDraft] = useState('');
  const [searchLocationDraft, setSearchLocationDraft] = useState('');
  const [searchLeadCountDraft, setSearchLeadCountDraft] = useState<number>(50);
  const [locationOptions, setLocationOptions] = useState<LinkedInSearchParameterOption[]>([]);
  const [selectedLocationOption, setSelectedLocationOption] =
    useState<LinkedInSearchParameterOption | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationLookupError, setLocationLookupError] = useState<string | null>(null);
  const [showSearchBreakdown, setShowSearchBreakdown] = useState(false);
  const [dismissedPartnerBanner, setDismissedPartnerBanner] = useState(false);
  const [homeSearchPhase, setHomeSearchPhase] = useState<HomeSearchPhase>('idle');
  const [homeSearchJobId, setHomeSearchJobId] = useState('');
  const [homeSearchListId, setHomeSearchListId] = useState<string | null>(null);
  const [homeSearchPage, setHomeSearchPage] = useState(1);
  const [homeSearchTotal, setHomeSearchTotal] = useState(0);
  const [homeSearchSummary, setHomeSearchSummary] = useState<HomeSearchSummary | null>(null);
  const [homeSearchLeads, setHomeSearchLeads] = useState<Lead[]>([]);
  const [homeSearchLeadsLoading, setHomeSearchLeadsLoading] = useState(false);
  const [homeSearchSaved, setHomeSearchSaved] = useState(false);
  const [homeSearchError, setHomeSearchError] = useState<string | null>(null);
  const [homeCsvMappingOpen, setHomeCsvMappingOpen] = useState(false);
  const [homeCsvImporting, setHomeCsvImporting] = useState(false);
  const [homeCsvFile, setHomeCsvFile] = useState<File | null>(null);
  const [homeCsvPreviewHeaders, setHomeCsvPreviewHeaders] = useState<string[]>([]);
  const [homeCsvPreviewRows, setHomeCsvPreviewRows] = useState<string[][]>([]);
  const [homeCsvColumnMapping, setHomeCsvColumnMapping] = useState<
    Record<string, LeadMappingTarget>
  >({});
  const [homeCsvMappingSuggestions, setHomeCsvMappingSuggestions] = useState<
    Record<string, LeadMappingSuggestion>
  >({});
  const [homeCsvMappingConfirmed, setHomeCsvMappingConfirmed] = useState(false);
  const [homeCsvImportError, setHomeCsvImportError] = useState<string | null>(null);
  const [discoverySetupOpen, setDiscoverySetupOpen] = useState(false);
  const [discoveryBriefDraft, setDiscoveryBriefDraft] = useState('');
  const [discoveryTargetWebsitesDraft, setDiscoveryTargetWebsitesDraft] = useState('');
  const [discoverySpecialInstructionsDraft, setDiscoverySpecialInstructionsDraft] = useState('');
  const [discoveryListMode, setDiscoveryListMode] = useState<'new' | 'existing'>('new');
  const [discoveryDestinationListId, setDiscoveryDestinationListId] = useState('');
  const [discoveryNewListName, setDiscoveryNewListName] = useState('');
  const [discoveryScheduleIntervalDays, setDiscoveryScheduleIntervalDays] = useState('0');
  const [discoveryPreview, setDiscoveryPreview] = useState<DiscoverySearchPreview | null>(null);
  const [discoveryPreviewing, setDiscoveryPreviewing] = useState(false);
  const [discoverySubmitting, setDiscoverySubmitting] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [discoveryStarted, setDiscoveryStarted] = useState<{
    searchId: string;
    runId: string;
    searchName: string;
    listId: string | null;
    listName: string | null;
  } | null>(null);

  const { data: statsData } = useDashboardStats('30d');
  const { data: activityData = [] } = useDashboardActivity(4);
  const { data: campaignsData = [], isLoading: campaignsLoading } = useDashboardCampaigns();
  const { data: leadListsResponse } = useLeadLists(
    currentWorkspaceId ? { workspace_id: currentWorkspaceId } : undefined
  );
  const { data: homeSearchJobStatus } = useImportJobStatus(
    homeSearchJobId,
    Boolean(homeSearchJobId) && homeSearchPhase === 'searching',
    2000
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const billing = params.get('billing');
    const partnerCode = params.get('partner');
    if (billing === 'success') {
      toast.success('Welcome. Your subscription is now active.', { duration: 5000 });
      window.history.replaceState({}, '', '/dashboard');
    }
    if (partnerCode === 'activated') {
      toast.success('Partner access activated.', { duration: 5000 });
      window.history.replaceState({}, '', '/dashboard');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rawDraft = window.sessionStorage.getItem(HOME_DRAFT_STORAGE_KEY);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft) as {
        commandMode?: CommandMode;
        searchSource?: SearchSource;
        selectedPlaybook?: PlaybookId;
        commandText?: string;
      };
      if (draft.commandMode) setCommandMode(draft.commandMode);
      if (draft.searchSource) setSearchSource(draft.searchSource);
      if (draft.selectedPlaybook) setSelectedPlaybook(draft.selectedPlaybook);
      if (typeof draft.commandText === 'string') setCommandText(draft.commandText);
    } catch {
      window.sessionStorage.removeItem(HOME_DRAFT_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(
      HOME_DRAFT_STORAGE_KEY,
      JSON.stringify({
        commandMode,
        searchSource,
        selectedPlaybook,
        commandText,
      })
    );
  }, [commandMode, commandText, searchSource, selectedPlaybook]);

  useEffect(() => {
    const parsed = parseAudiencePrompt(commandText);
    setSearchKeywordsDraft(parsed.keywords);
    setSearchLocationDraft(parsed.locationInput ?? '');
  }, [commandText]);

  useEffect(() => {
    if (searchSource !== 'linkedin' && showSearchBreakdown) {
      setShowSearchBreakdown(false);
    }
  }, [searchSource, showSearchBreakdown]);

  const connectedLinkedInAccounts = useMemo(
    () =>
      linkedInAccounts
        .filter((account) => account.status === 'connected')
        .sort((a, b) => getLinkedInAccountPriority(b) - getLinkedInAccountPriority(a)),
    [linkedInAccounts]
  );
  const leadLists = useMemo(() => leadListsResponse?.lists ?? [], [leadListsResponse]);

  const selectedLinkedInAccount =
    connectedLinkedInAccounts.find((account) => account.id === selectedLinkedInAccountId) ??
    connectedLinkedInAccounts[0] ??
    null;

  const hasLinkedInConnected = connectedLinkedInAccounts.length > 0;
  const hasEmailConnected = emailAccounts.some((account) => account.status === 'connected');
  const hasCalendarConnected = calendarAccounts.some((account) => account.status === 'connected');

  useEffect(() => {
    if (!connectedLinkedInAccounts.length) {
      setSelectedLinkedInAccountId('');
      return;
    }

    if (!connectedLinkedInAccounts.some((account) => account.id === selectedLinkedInAccountId)) {
      setSelectedLinkedInAccountId(connectedLinkedInAccounts[0].id);
    }
  }, [connectedLinkedInAccounts, selectedLinkedInAccountId]);

  useEffect(() => {
    if (!showSearchBreakdown || searchSource !== 'linkedin') {
      setLocationOptions([]);
      setSelectedLocationOption(null);
      setLocationLoading(false);
      setLocationLookupError(null);
      return;
    }

    const trimmedLocation = searchLocationDraft.trim();
    if (!selectedLinkedInAccount || trimmedLocation.length < 2) {
      setLocationOptions([]);
      setLocationLoading(false);
      setLocationLookupError(null);
      if (!trimmedLocation) {
        setSelectedLocationOption(null);
      }
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      setLocationLoading(true);
      setLocationLookupError(null);

      try {
        const params = new URLSearchParams({
          linkedin_account_id: selectedLinkedInAccount.id,
          keywords: trimmedLocation,
        });
        const response = await api.get<LinkedInSearchParametersLookupResponse>(
          `/leads/linkedin/search-parameters?${params.toString()}`
        );

        if (cancelled) return;

        const items = response.data.items || [];
        setLocationOptions(items);
        setSelectedLocationOption(findBestLocationMatch(trimmedLocation, items));
      } catch (error) {
        if (cancelled) return;
        setLocationOptions([]);
        setSelectedLocationOption(null);
        setLocationLookupError(
          error instanceof Error ? error.message : 'Failed to look up locations'
        );
      } finally {
        if (!cancelled) {
          setLocationLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchLocationDraft, selectedLinkedInAccount, searchSource, showSearchBreakdown]);

  const connectedChannelCount =
    Number(hasLinkedInConnected) + Number(hasEmailConnected) + Number(hasCalendarConnected);
  const discoverySourceCoverage = useMemo(
    () =>
      [
        'Web search',
        selectedLinkedInAccount
          ? `LinkedIn via ${getLinkedInAccountLabel(selectedLinkedInAccount)}`
          : null,
      ].filter(Boolean) as string[],
    [selectedLinkedInAccount]
  );

  const activePlaybook = useMemo(
    () =>
      growthPlaybooks.find((playbook) => playbook.id === selectedPlaybook) ?? growthPlaybooks[0],
    [selectedPlaybook]
  );
  const activePlaybookConfig = playbookSetupConfig[activePlaybook.id];
  const activePlaybookAnswers = useMemo(
    () => playbookDrafts[activePlaybook.id] ?? {},
    [activePlaybook.id, playbookDrafts]
  );
  const activePlaybookFields = useMemo(
    () => getVisiblePlaybookFields(activePlaybook.id, activePlaybookConfig, activePlaybookAnswers),
    [activePlaybook.id, activePlaybookAnswers, activePlaybookConfig]
  );
  const playbookSetupTotalSteps = activePlaybookFields.length + 1;
  const activePlaybookField = activePlaybookFields[playbookSetupStep] ?? null;
  const activePlaybookProgress = Math.round(
    ((playbookSetupStep + 1) / playbookSetupTotalSteps) * 100
  );
  const activePlaybookSuggestions = useMemo(
    () =>
      getPlaybookFieldSuggestions(
        activePlaybook.id,
        activePlaybookField,
        activePlaybookAnswers,
        workspace
      ),
    [activePlaybook.id, activePlaybookAnswers, activePlaybookField, workspace]
  );

  const suggestedSearches = useMemo(() => buildSuggestedSearches(workspace), [workspace]);

  const commandPlaceholder =
    commandMode === 'search'
      ? searchSource === 'linkedin'
        ? 'Heads of finance at growth-stage companies with heavy Databricks usage'
        : 'B2B SaaS companies hiring revops leaders in London'
      : 'Host a private dinner for RevOps leaders in Lagos on pipeline efficiency and drive booked consultations after the event';

  const heroDescription =
    commandMode === 'search'
      ? searchSource === 'linkedin'
        ? 'Start with an audience brief and let SalesParrot open the right search flow.'
        : 'Describe the market signal you want tracked and Parrot will set up discovery here.'
      : 'Pick the motion that matches the outcome you want. SalesParrot will collect the right inputs, then build the audience, messaging, follow-up, and tracking around it.';

  const performanceStats = [
    {
      label: 'Connections Sent',
      value: statsData?.connections_sent ?? 0,
      accent: '#2563EB',
    },
    {
      label: 'Replies',
      value: (statsData?.message_replies ?? 0) + (statsData?.email_replies ?? 0),
      accent: '#16A34A',
    },
    {
      label: 'Emails Sent',
      value: statsData?.emails_sent ?? 0,
      accent: '#F97316',
    },
    {
      label: 'Active Motions',
      value: campaignsData.length,
      accent: '#7C3AED',
    },
  ];

  const channelReadiness = [
    {
      label: 'LinkedIn',
      ready: hasLinkedInConnected,
      description: hasLinkedInConnected
        ? `${linkedInAccounts.length} sender${linkedInAccounts.length === 1 ? '' : 's'} available`
        : 'Connect a LinkedIn account to unlock LinkedIn Search and sender rotation.',
      search: { tab: 'linkedin' as const },
    },
    {
      label: 'Email',
      ready: hasEmailConnected,
      description: hasEmailConnected
        ? `${emailAccounts.length} inbox${emailAccounts.length === 1 ? '' : 'es'} attached`
        : 'Attach an email account for follow-up delivery and multi-channel sequences.',
      search: { tab: 'email' as const },
    },
    {
      label: 'Calendar',
      ready: hasCalendarConnected,
      description: hasCalendarConnected
        ? `${calendarAccounts.length} calendar${calendarAccounts.length === 1 ? '' : 's'} synced`
        : 'Connect a calendar so Parrot can support event scheduling and booked-meeting flows.',
      search: { tab: 'calendar' as const },
    },
  ];

  const handleUseSuggestedSearch = (suggestion: SuggestedSearch) => {
    setActiveSuggestedSearchId(suggestion.id);
    setHomeSearchError(null);
    setLocationLookupError(null);

    if (suggestion.target === 'playbook') {
      setCommandMode('playbook');
      if (suggestion.playbookId) {
        setSelectedPlaybook(suggestion.playbookId);
      }
      window.requestAnimationFrame(() => {
        commandComposerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });
      return;
    }

    setCommandMode('search');
    setSearchSource(suggestion.target);
    setCommandText(suggestion.text);
    setSearchLeadCountDraft(50);

    if (suggestion.target === 'linkedin') {
      const parsed = parseAudiencePrompt(suggestion.text);
      setSearchKeywordsDraft(parsed.keywords || suggestion.text);
      setSearchLocationDraft(parsed.locationInput ?? '');
      setShowSearchBreakdown(true);
    } else {
      setShowSearchBreakdown(false);
    }

    window.requestAnimationFrame(() => {
      commandComposerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      const input = commandInputRef.current;
      if (suggestion.target === 'discovery') {
        input?.focus();
        openDiscoverySetup(suggestion.text);
        return;
      }
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  };

  const resetSearchComposer = () => {
    setActiveSuggestedSearchId(null);
    setCommandText('');
    setSearchKeywordsDraft('');
    setSearchLocationDraft('');
    setSearchLeadCountDraft(50);
    setSelectedLocationOption(null);
    setLocationOptions([]);
    setLocationLookupError(null);
    setShowSearchBreakdown(false);
    setHomeSearchError(null);
    window.requestAnimationFrame(() => {
      commandComposerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      commandInputRef.current?.focus();
    });
  };

  const resetDiscoverySetup = useCallback(() => {
    setDiscoverySetupOpen(false);
    setDiscoveryBriefDraft('');
    setDiscoveryTargetWebsitesDraft('');
    setDiscoverySpecialInstructionsDraft('');
    setDiscoveryListMode('new');
    setDiscoveryDestinationListId('');
    setDiscoveryNewListName('');
    setDiscoveryScheduleIntervalDays('0');
    setDiscoveryPreview(null);
    setDiscoveryPreviewing(false);
    setDiscoverySubmitting(false);
    setDiscoveryError(null);
    setDiscoveryStarted(null);
  }, []);

  const openDiscoverySetup = useCallback(
    (promptOverride?: string) => {
      const trimmedPrompt = (promptOverride ?? commandText).trim();
      if (!trimmedPrompt) {
        toast.error('Describe the market, signal, or audience first.');
        return;
      }

      setDiscoveryBriefDraft(trimmedPrompt);
      setDiscoveryTargetWebsitesDraft('');
      setDiscoverySpecialInstructionsDraft('');
      setDiscoveryListMode('new');
      setDiscoveryDestinationListId('');
      setDiscoveryNewListName(buildInlineDiscoverySearchName(trimmedPrompt));
      setDiscoveryScheduleIntervalDays('0');
      setDiscoveryPreview(null);
      setDiscoveryPreviewing(false);
      setDiscoverySubmitting(false);
      setDiscoveryError(null);
      setDiscoveryStarted(null);
      setDiscoverySetupOpen(true);
    },
    [commandText]
  );

  const previewInlineDiscovery = useCallback(
    async (description: string, destinationListId?: string | null) => {
      if (!currentWorkspaceId || !description.trim()) {
        setDiscoveryPreview(null);
        return;
      }

      setDiscoveryPreviewing(true);
      try {
        const payload = buildInlineDiscoveryPayload({
          description,
          targetWebsites: discoveryTargetWebsitesDraft,
          specialInstructions: discoverySpecialInstructionsDraft,
          linkedinAccountId: selectedLinkedInAccount?.id ?? '',
          destinationListId: destinationListId ?? null,
          scheduleIntervalDays: discoveryScheduleIntervalDays,
          workspaceId: currentWorkspaceId,
        });
        const response = await api.post<DiscoverySearchPreview>(
          '/discovery/searches/preview',
          payload
        );
        setDiscoveryPreview(response.data);
        setDiscoveryError(null);
      } catch (error) {
        setDiscoveryPreview(null);
        setDiscoveryError(
          error instanceof Error
            ? error.message
            : 'Unable to prepare this discovery search right now.'
        );
      } finally {
        setDiscoveryPreviewing(false);
      }
    },
    [
      currentWorkspaceId,
      discoveryScheduleIntervalDays,
      discoverySpecialInstructionsDraft,
      discoveryTargetWebsitesDraft,
      selectedLinkedInAccount,
    ]
  );

  const handleStartInlineDiscovery = useCallback(async () => {
    if (!currentWorkspaceId) {
      toast.error('Choose a workspace before starting Discovery.');
      return;
    }

    const description = discoveryBriefDraft.trim();
    if (!description) {
      setDiscoveryError('Add a short audience or signal brief first.');
      return;
    }

    setDiscoverySubmitting(true);
    setDiscoveryError(null);

    try {
      let destinationListId =
        discoveryListMode === 'existing' ? discoveryDestinationListId || null : null;
      let destinationListName: string | null =
        discoveryListMode === 'existing'
          ? (leadLists.find((list) => list.id === discoveryDestinationListId)?.name ?? null)
          : null;

      if (discoveryListMode === 'new') {
        const listName =
          discoveryNewListName.trim() || buildInlineDiscoverySearchName(discoveryBriefDraft);
        const listResponse = await api.post<LeadList>('/leads/lists', {
          name: listName,
          workspace_id: currentWorkspaceId,
          source: 'discovery',
        });
        destinationListId = listResponse.data.id;
        destinationListName = listResponse.data.name;
        await queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
      }

      const payload = buildInlineDiscoveryPayload({
        description,
        targetWebsites: discoveryTargetWebsitesDraft,
        specialInstructions: discoverySpecialInstructionsDraft,
        linkedinAccountId: selectedLinkedInAccount?.id ?? '',
        destinationListId,
        scheduleIntervalDays: discoveryScheduleIntervalDays,
        workspaceId: currentWorkspaceId,
      });
      const created = await api.post<SavedDiscoverySearch>('/discovery/searches', payload);
      const run = await api.post<DiscoveryRun>(
        `/discovery/searches/${created.data.id}/run?workspace_id=${currentWorkspaceId}`
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.discovery.searches(currentWorkspaceId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.discovery.search(currentWorkspaceId, created.data.id),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.discovery.runs(currentWorkspaceId, created.data.id),
        }),
      ]);

      setDiscoveryStarted({
        searchId: created.data.id,
        runId: run.data.id,
        searchName: created.data.name,
        listId: destinationListId,
        listName: destinationListName,
      });
      toast.success('Search started. Leads will be available on the Leads page.');
    } catch (error) {
      setDiscoveryError(
        error instanceof Error ? error.message : 'Unable to start discovery right now.'
      );
    } finally {
      setDiscoverySubmitting(false);
    }
  }, [
    currentWorkspaceId,
    discoveryBriefDraft,
    discoveryDestinationListId,
    discoveryListMode,
    discoveryNewListName,
    discoveryScheduleIntervalDays,
    discoverySpecialInstructionsDraft,
    discoveryTargetWebsitesDraft,
    leadLists,
    queryClient,
    selectedLinkedInAccount,
  ]);

  useEffect(() => {
    if (!discoverySetupOpen) return;

    const timeoutId = window.setTimeout(() => {
      void previewInlineDiscovery(
        discoveryBriefDraft,
        discoveryListMode === 'existing' ? discoveryDestinationListId || null : null
      );
    }, 320);

    return () => window.clearTimeout(timeoutId);
  }, [
    discoveryBriefDraft,
    discoveryDestinationListId,
    discoveryListMode,
    discoverySetupOpen,
    discoverySpecialInstructionsDraft,
    discoveryTargetWebsitesDraft,
    previewInlineDiscovery,
  ]);

  const openPlaybookSetup = (playbookId?: PlaybookId) => {
    const targetPlaybookId = playbookId ?? selectedPlaybook;
    if (targetPlaybookId !== selectedPlaybook) {
      setSelectedPlaybook(targetPlaybookId);
    }
    setPlaybookDrafts((current) => {
      if (current[targetPlaybookId]) return current;
      return {
        ...current,
        [targetPlaybookId]: buildInitialPlaybookDraft(targetPlaybookId, workspace),
      };
    });
    setPlaybookSetupStep(0);
    setPlaybookSetupOpen(true);
  };

  const handlePlaybookAnswerChange = (fieldId: string, value: string) => {
    setPlaybookDrafts((current) => ({
      ...current,
      [activePlaybook.id]: (() => {
        const next = {
          ...(current[activePlaybook.id] ?? {}),
          [fieldId]: value,
        };

        if (activePlaybook.id === 'event-led-relationship-selling' && fieldId === 'eventType') {
          next.format = inferEventFormatFromType(value);
          if (value === 'Private dinner') {
            next.topic = '';
          }
        }

        return next;
      })(),
    }));
  };

  const handlePlaybookContinue = () => {
    if (!activePlaybookField) {
      setPlaybookSetupStep(activePlaybookFields.length);
      return;
    }

    const value = (activePlaybookAnswers[activePlaybookField.id] ?? '').trim();
    if (!value) {
      toast.error(`Add ${activePlaybookField.label.toLowerCase()} first.`);
      return;
    }

    setPlaybookSetupStep((step) => Math.min(step + 1, playbookSetupTotalSteps - 1));
  };

  const handlePlaybookBack = () => {
    setPlaybookSetupStep((step) => Math.max(step - 1, 0));
  };

  const completePlaybookSetup = () => {
    const setupValues = activePlaybookConfig.fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.id] = activePlaybookAnswers[field.id] ?? '';
      return acc;
    }, {});

    if (activePlaybook.id === 'event-led-relationship-selling') {
      setupValues.format =
        activePlaybookAnswers.format ||
        inferEventFormatFromType(activePlaybookAnswers.eventType ?? '');
      if ((activePlaybookAnswers.eventType ?? '').trim() === 'Private dinner') {
        setupValues.topic = '';
      }
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        HOME_LAUNCH_STORAGE_KEY,
        JSON.stringify({
          type: 'playbook',
          commandText: activePlaybook.name,
          searchSource,
          playbookId: activePlaybook.id,
          playbookSetup: setupValues,
          createdAt: new Date().toISOString(),
        })
      );
    }

    setPlaybookSetupOpen(false);
    navigate({ to: '/dashboard/campaigns' } as never);
  };

  const handleLaunchCommand = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(
        HOME_LAUNCH_STORAGE_KEY,
        JSON.stringify({
          type: commandMode,
          commandText: commandText.trim(),
          searchSource,
          playbookId: selectedPlaybook,
          createdAt: new Date().toISOString(),
        })
      );
    }

    if (commandMode === 'search') {
      if (!commandText.trim()) {
        toast.error('Describe who you want to reach or choose a suggested search first.');
        return;
      }

      if (searchSource === 'linkedin') {
        if (!hasLinkedInConnected) {
          navigate({
            to: '/dashboard/accounts',
            search: { tab: 'linkedin' } as never,
          } as never);
          return;
        }

        if (!showSearchBreakdown) {
          prepareInlineSearchBreakdown();
          return;
        }

        void runInlineLinkedInSearch();
        return;
      }

      openDiscoverySetup();
      return;
    }

    openPlaybookSetup(selectedPlaybook);
  };

  const visibleSuggestedSearches = suggestedSearches.slice(0, 3);
  const upcomingPlaybooks = growthPlaybooks.filter((playbook) => playbook.id !== activePlaybook.id);
  const hasPerformanceData = performanceStats.some((stat) => stat.value > 0);
  const hasActivityData = activityData.length > 0;
  const heroTitle =
    commandMode === 'search'
      ? 'Who do you want to reach?'
      : 'Which growth playbook do you want to run?';
  const heroSubhead =
    commandMode === 'search'
      ? 'Describe your audience and SalesParrot will open the right search flow.'
      : 'Choose the motion that best fits the growth outcome you want next.';

  const missingChannels = channelReadiness.filter((channel) => !channel.ready);
  const priorityLaunchChannel =
    missingChannels.find((channel) => channel.label === 'Calendar') ?? missingChannels[0] ?? null;
  const selectedSearchSourceLabel =
    searchSource === 'linkedin' ? 'LinkedIn People Search' : 'Discovery';
  const canLaunchSearch = commandText.trim().length > 0;
  const hasSearchComposerState =
    commandText.trim().length > 0 ||
    activeSuggestedSearchId !== null ||
    showSearchBreakdown ||
    searchKeywordsDraft.trim().length > 0 ||
    searchLocationDraft.trim().length > 0;
  const homeSearchModalOpen = homeSearchPhase !== 'idle';
  const homeSearchStatusCopy = getHomeSearchStatusCopy({
    phase: homeSearchPhase,
    job: homeSearchJobStatus,
    leadsLoading: homeSearchLeadsLoading,
    summary: homeSearchSummary,
  });

  const resetHomeSearchState = () => {
    setHomeSearchPhase('idle');
    setHomeSearchJobId('');
    setHomeSearchListId(null);
    setHomeSearchPage(1);
    setHomeSearchTotal(0);
    setHomeSearchSummary(null);
    setHomeSearchLeads([]);
    setHomeSearchLeadsLoading(false);
    setHomeSearchSaved(false);
    setHomeSearchError(null);
  };

  const resetHomeCsvMappingState = () => {
    setHomeCsvMappingOpen(false);
    setHomeCsvImporting(false);
    setHomeCsvFile(null);
    setHomeCsvPreviewHeaders([]);
    setHomeCsvPreviewRows([]);
    setHomeCsvColumnMapping({});
    setHomeCsvMappingSuggestions({});
    setHomeCsvMappingConfirmed(false);
    setHomeCsvImportError(null);
  };

  const prepareInlineSearchBreakdown = () => {
    const trimmedPrompt = commandText.trim();
    if (!trimmedPrompt) {
      toast.error('Describe who you want to reach first.');
      return false;
    }

    const parsed = parseAudiencePrompt(trimmedPrompt);
    setSearchKeywordsDraft(parsed.keywords || trimmedPrompt);
    setSearchLocationDraft(parsed.locationInput ?? '');
    setShowSearchBreakdown(true);
    return true;
  };

  const fetchHomeSearchLeads = useCallback(
    async (listId: string, page = 1) => {
      setHomeSearchLeadsLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('list_id', listId);
        if (currentWorkspaceId) params.append('workspace_id', currentWorkspaceId);
        params.append('limit', HOME_SEARCH_PAGE_SIZE.toString());
        params.append('offset', ((page - 1) * HOME_SEARCH_PAGE_SIZE).toString());
        params.append('sort_by', 'email_actionability');
        const response = await api.get<LeadListResponse>(`/leads?${params.toString()}`);
        setHomeSearchLeads(response.data.leads);
        setHomeSearchTotal(response.data.total || 0);
      } catch (error) {
        setHomeSearchError(
          error instanceof Error ? error.message : 'Unable to load the search preview right now.'
        );
      } finally {
        setHomeSearchLeadsLoading(false);
      }
    },
    [currentWorkspaceId]
  );

  const parseHomeCsvPreview = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = String(event.target?.result || '');
      const delimiter = detectLeadDelimiter(text);
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        setHomeCsvImportError('This CSV appears to be empty.');
        setHomeCsvPreviewHeaders([]);
        setHomeCsvPreviewRows([]);
        setHomeCsvColumnMapping({});
        setHomeCsvMappingSuggestions({});
        setHomeCsvMappingConfirmed(false);
        return;
      }

      const headers = parseLeadDelimitedLine(lines[0], delimiter);
      const rows = lines.slice(1, 6).map((line) => parseLeadDelimitedLine(line, delimiter));
      const suggestions = autoMapLeadColumns(headers, rows);

      setHomeCsvImportError(null);
      setHomeCsvPreviewHeaders(headers);
      setHomeCsvPreviewRows(rows);
      setHomeCsvMappingSuggestions(suggestions);
      setHomeCsvColumnMapping(
        Object.fromEntries(headers.map((header) => [header, suggestions[header].target]))
      );
      setHomeCsvMappingConfirmed(true);
    };
    reader.onerror = () => {
      setHomeCsvImportError('Unable to read that CSV file right now.');
    };
    reader.readAsText(file);
  }, []);

  const buildMappedHomeCsvFile = useCallback(
    async (file: File, mapping: Record<string, LeadMappingTarget>) => {
      const text = await file.text();
      const delimiter = detectLeadDelimiter(text);
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (lines.length === 0) return file;

      const sourceHeaders = parseLeadDelimitedLine(lines[0], delimiter);
      const keptIndices = sourceHeaders
        .map((header, index) => ({ header, index, target: mapping[header] || '__keep__' }))
        .filter((item) => item.target !== '__ignore__');
      const mappedHeaders = keptIndices.flatMap((item) => {
        if (item.target === '__split_full_name__') return ['first_name', 'last_name'];
        return [item.target === '__keep__' ? item.header : item.target];
      });
      const remappedRows = lines.slice(1).map((line) => {
        const cells = parseLeadDelimitedLine(line, delimiter);
        return keptIndices
          .flatMap((item) => {
            const value = cells[item.index] || '';
            if (item.target === '__split_full_name__') {
              const split = splitFullName(value);
              return [escapeLeadCsvCell(split.firstName), escapeLeadCsvCell(split.lastName)];
            }
            return [escapeLeadCsvCell(value)];
          })
          .join(',');
      });
      const remapped = [mappedHeaders.map(escapeLeadCsvCell).join(','), ...remappedRows].join('\n');
      return new File([remapped], file.name, { type: 'text/csv' });
    },
    []
  );

  const persistHomeSearchList = useCallback(async () => {
    if (!homeSearchListId || !homeSearchSummary) {
      throw new Error('No search results are ready to save yet.');
    }
    if (homeSearchSaved) return homeSearchListId;

    await api.patch(`/leads/lists/${homeSearchListId}`, {
      name: homeSearchSummary.finalListName,
    });

    setHomeSearchSaved(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.detail(homeSearchListId) }),
    ]);
    toast.success(`Saved as "${homeSearchSummary.finalListName}"`);
    return homeSearchListId;
  }, [homeSearchListId, homeSearchSaved, homeSearchSummary, queryClient]);

  const closeHomeSearchModal = useCallback(async () => {
    const jobId = homeSearchJobId;
    const listId = homeSearchListId;
    const shouldDeletePreview = Boolean(listId && !homeSearchSaved);
    const shouldKeepRunning = homeSearchPhase === 'searching';

    resetHomeSearchState();

    if (shouldKeepRunning) {
      await queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all });
      toast.success('Search will keep running in the background. You can find it in Leads.');
      return;
    }

    if (jobId) {
      try {
        await cancelImportMutation.mutateAsync(jobId);
      } catch {
        // Ignore cancellation errors during cleanup.
      }
    }

    if (shouldDeletePreview && listId) {
      try {
        await api.delete(`/leads/lists/${listId}`);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.leadLists.all }),
          queryClient.invalidateQueries({ queryKey: queryKeys.leads.all }),
        ]);
      } catch {
        // Ignore cleanup failures; the user can still manage the list from Leads if needed.
      }
    }
  }, [
    cancelImportMutation,
    homeSearchJobId,
    homeSearchListId,
    homeSearchPhase,
    homeSearchSaved,
    queryClient,
  ]);

  const handleViewHomeSearchInLeads = async () => {
    try {
      const listId = await persistHomeSearchList();
      resetHomeSearchState();
      navigate({
        to: '/dashboard/leads',
        search: { listId } as never,
      } as never);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to open the leads list.');
    }
  };

  const handleStartCampaignFromHomeSearch = async () => {
    try {
      const listId = await persistHomeSearchList();
      resetHomeSearchState();
      navigate({
        to: '/dashboard/campaigns',
        search: { createWithList: listId } as never,
      } as never);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to start a campaign yet.');
    }
  };

  const handleUploadListSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    setHomeCsvFile(file);
    setHomeCsvMappingOpen(true);
    setHomeCsvImportError(null);
    parseHomeCsvPreview(file);
  };

  const handleConfirmHomeCsvImport = async () => {
    if (!homeCsvFile) return;

    setHomeCsvImporting(true);
    setHomeCsvImportError(null);

    const normalizedName = homeCsvFile.name.replace(/\.[^.]+$/, '').trim() || 'Uploaded leads';
    const finalListName =
      normalizedName.length > 72 ? `${normalizedName.slice(0, 69).trim()}...` : normalizedName;
    const tempListName = buildPreviewLeadListName(finalListName);

    try {
      const mappedFile = await buildMappedHomeCsvFile(homeCsvFile, homeCsvColumnMapping);
      setHomeCsvMappingOpen(false);

      setHomeSearchPhase('searching');
      setHomeSearchJobId('');
      setHomeSearchListId(null);
      setHomeSearchPage(1);
      setHomeSearchTotal(0);
      setHomeSearchSummary({
        sourceMode: 'upload',
        prompt: homeCsvFile.name,
        keywords: finalListName,
        locationInput: null,
        resolvedLocation: null,
        locationWarning: null,
        accountName: null,
        finalListName,
        tempListName,
      });
      setHomeSearchLeads([]);
      setHomeSearchLeadsLoading(true);
      setHomeSearchSaved(false);
      setHomeSearchError(null);

      const result = await importCsvMutation.mutateAsync({
        file: mappedFile,
        list_name: finalListName,
        workspace_id: currentWorkspaceId || undefined,
      });

      if (!result.list_id) {
        throw new Error('The upload completed, but the lead file could not be opened.');
      }

      setHomeSearchListId(result.list_id);
      setHomeSearchPhase('results');
      resetHomeCsvMappingState();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to upload and map that list.';
      setHomeCsvImportError(message);
      setHomeCsvMappingOpen(true);
      setHomeCsvImporting(false);
    }
  };

  const runInlineLinkedInSearch = async () => {
    const trimmedPrompt = commandText.trim();
    if (!trimmedPrompt) {
      toast.error('Describe who you want to reach first.');
      return;
    }

    if (!selectedLinkedInAccount) {
      navigate({
        to: '/dashboard/accounts',
        search: { tab: 'linkedin' } as never,
      } as never);
      return;
    }

    const finalListName = buildLeadListNameFromPrompt(trimmedPrompt);
    const tempListName = buildPreviewLeadListName(finalListName);
    const keywordQuery = searchKeywordsDraft.trim() || trimmedPrompt;
    const locationInput = sanitizeLocationInput(searchLocationDraft);
    const apiType = getLinkedInApiType(selectedLinkedInAccount);

    let resolvedLocation: LinkedInSearchParameterOption | null = null;

    if (locationInput) {
      const selectedLocationMatchesDraft =
        selectedLocationOption &&
        selectedLocationOption.title.trim().toLowerCase() === locationInput.toLowerCase();

      if (selectedLocationMatchesDraft) {
        resolvedLocation = selectedLocationOption;
      }

      try {
        if (!resolvedLocation) {
          const params = new URLSearchParams({
            linkedin_account_id: selectedLinkedInAccount.id,
            keywords: locationInput,
          });
          const response = await api.get<LinkedInSearchParametersLookupResponse>(
            `/leads/linkedin/search-parameters?${params.toString()}`
          );
          const items = response.data.items || [];
          resolvedLocation = findBestLocationMatch(locationInput, items);
        }

        if (!resolvedLocation) {
          const message = `Select a valid LinkedIn location for "${locationInput}" before searching.`;
          setShowSearchBreakdown(true);
          setLocationLookupError(message);
          toast.error(message);
          return;
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : `Couldn't resolve "${locationInput}" as a LinkedIn location.`;
        setShowSearchBreakdown(true);
        setLocationLookupError(message);
        toast.error(message);
        return;
      }
    }

    const searchParams: Record<string, unknown> = {
      api: apiType,
      category: 'people',
      keywords: keywordQuery,
      network_distance: [2, 3],
    };

    if (resolvedLocation) {
      if (apiType === 'sales_navigator') {
        searchParams.location = { include: [resolvedLocation.id] };
      } else if (apiType === 'recruiter') {
        searchParams.location = [
          { id: resolvedLocation.id, priority: 'MUST_HAVE', scope: 'CURRENT' },
        ];
      } else {
        searchParams.location = [resolvedLocation.id];
      }
    }

    setHomeSearchPhase('searching');
    setHomeSearchJobId('');
    setHomeSearchListId(null);
    setHomeSearchPage(1);
    setHomeSearchTotal(0);
    setHomeSearchSummary({
      sourceMode: 'linkedin',
      prompt: trimmedPrompt,
      keywords: keywordQuery,
      locationInput: locationInput || null,
      resolvedLocation: resolvedLocation?.title ?? null,
      locationWarning: null,
      accountName: getLinkedInAccountLabel(selectedLinkedInAccount),
      finalListName,
      tempListName,
    });
    setHomeSearchLeads([]);
    setHomeSearchLeadsLoading(false);
    setHomeSearchSaved(false);
    setHomeSearchError(null);

    try {
      const result = await startImportMutation.mutateAsync({
        list_name: finalListName,
        import_type: 'linkedin_people_search',
        linkedin_account_id: selectedLinkedInAccount.id,
        workspace_id: currentWorkspaceId || undefined,
        search_params: searchParams,
        max_leads: searchLeadCountDraft,
      });
      setHomeSearchJobId(result.job_id);
      setHomeSearchListId(result.list_id);
    } catch (error) {
      setHomeSearchError(error instanceof Error ? error.message : 'Unable to start the search.');
      setHomeSearchPhase('results');
    }
  };

  useEffect(() => {
    if (!searchSourceMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[data-search-source-menu]')) return;
      setSearchSourceMenuOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [searchSourceMenuOpen]);

  useEffect(() => {
    if (homeSearchPhase !== 'searching' || !homeSearchJobStatus) return;

    if (homeSearchJobStatus.status === 'failed') {
      setHomeSearchError(homeSearchJobStatus.error_message || 'The search did not complete.');
      setHomeSearchPhase('results');
      return;
    }

    if (homeSearchJobStatus.status === 'cancelled') {
      setHomeSearchError('This search was cancelled before results were ready.');
      setHomeSearchPhase('results');
      return;
    }

    if (homeSearchJobStatus.status === 'completed' && homeSearchListId) {
      void (async () => {
        setHomeSearchPhase('results');
      })();
    }
  }, [fetchHomeSearchLeads, homeSearchJobStatus, homeSearchListId, homeSearchPhase]);

  useEffect(() => {
    if (homeSearchPhase !== 'results' || !homeSearchListId) return;
    void fetchHomeSearchLeads(homeSearchListId, homeSearchPage);
  }, [fetchHomeSearchLeads, homeSearchListId, homeSearchPage, homeSearchPhase]);

  useEffect(() => {
    if (!homeSearchModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void closeHomeSearchModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeHomeSearchModal, homeSearchModalOpen]);

  return (
    <>
      <div className="space-y-6">
        {user?.partner_access && !dismissedPartnerBanner && (
          <PartnerAccessBanner
            partnerAccess={user.partner_access}
            onDismiss={() => setDismissedPartnerBanner(true)}
          />
        )}

        <section className="rounded-[36px] border border-[#E2E8F0] bg-[radial-gradient(circle_at_top,_rgba(255,107,53,0.12),_transparent_30%),linear-gradient(180deg,_#FFFFFF_0%,_#FBFDFF_100%)] px-6 py-8 shadow-[0_24px_60px_rgba(15,23,42,0.05)] md:px-10 md:py-10">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-[#0F172A] md:text-6xl">
                {heroTitle}
              </h1>
              <p className="mx-auto max-w-2xl text-sm leading-7 text-[#64748B] md:text-base">
                {heroSubhead}
              </p>
            </div>

            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-[#E2E8F0] bg-white p-1 shadow-sm">
              <ModeButton
                active={commandMode === 'search'}
                icon={<AudienceIcon />}
                label="Find Prospects"
                onClick={() => setCommandMode('search')}
              />
              <ModeButton
                active={commandMode === 'playbook'}
                icon={<PlaybookIcon />}
                label="Use Growth Playbooks"
                onClick={() => setCommandMode('playbook')}
              />
            </div>

            {commandMode === 'search' ? (
              <div
                ref={commandComposerRef}
                className="w-full overflow-hidden rounded-[30px] border border-[#E2E8F0] bg-white shadow-[0_18px_40px_rgba(15,23,42,0.04)]"
              >
                <div className="p-5 md:p-6">
                  <p className="mb-3 text-sm font-medium text-[#64748B]">{heroDescription}</p>
                  <div className="relative rounded-[24px] border border-[#E2E8F0] bg-[#FBFCFE] px-5 py-4 transition-colors focus-within:border-[#FF6B35] focus-within:bg-white">
                    <textarea
                      ref={commandInputRef}
                      value={commandText}
                      onChange={(event) => {
                        setActiveSuggestedSearchId(null);
                        setCommandText(event.target.value);
                        if (showSearchBreakdown) {
                          setShowSearchBreakdown(false);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          handleLaunchCommand();
                        }
                      }}
                      placeholder={commandPlaceholder}
                      className="min-h-[120px] w-full resize-none bg-transparent text-base leading-8 text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
                    />
                    {showSearchBreakdown && searchSource === 'linkedin' ? (
                      <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-[#475569]">
                            Review the parsed search before you fetch leads.
                          </p>
                          <span className="text-xs font-medium text-[#94A3B8]">
                            Press Enter again to search
                          </span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-2">
                          <InlineSearchField
                            label="Keywords"
                            value={searchKeywordsDraft}
                            placeholder="LinkedIn search keywords"
                            onChange={setSearchKeywordsDraft}
                            onEnter={handleLaunchCommand}
                          />
                          <div className="relative">
                            <InlineSearchField
                              label="Location"
                              value={searchLocationDraft}
                              placeholder="Optional location"
                              onEnter={handleLaunchCommand}
                              onChange={(value) => {
                                setSearchLocationDraft(value);
                                if (
                                  selectedLocationOption &&
                                  value.trim().toLowerCase() !==
                                    selectedLocationOption.title.trim().toLowerCase()
                                ) {
                                  setSelectedLocationOption(null);
                                }
                              }}
                            />
                            {locationLoading ? (
                              <p className="mt-2 text-xs text-[#64748B]">
                                Finding matching locations...
                              </p>
                            ) : null}
                            {!locationLoading &&
                            selectedLocationOption &&
                            searchLocationDraft.trim() ? (
                              <p className="mt-2 text-xs font-medium text-[#15803D]">
                                Using location: {selectedLocationOption.title}
                              </p>
                            ) : null}
                            {locationLookupError ? (
                              <p className="mt-2 text-xs text-[#DC2626]">{locationLookupError}</p>
                            ) : null}
                            {!locationLoading &&
                            searchLocationDraft.trim().length >= 2 &&
                            locationOptions.length > 0 &&
                            (!selectedLocationOption ||
                              selectedLocationOption.title.trim().toLowerCase() !==
                                searchLocationDraft.trim().toLowerCase()) ? (
                              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 max-h-56 overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                                {locationOptions.map((option) => (
                                  <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => {
                                      setSearchLocationDraft(option.title);
                                      setSelectedLocationOption(option);
                                    }}
                                    className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-[#F8FAFC]"
                                  >
                                    <span className="text-sm font-medium text-[#0F172A]">
                                      {option.title}
                                    </span>
                                    <span className="text-xs text-[#94A3B8]">Use</span>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <InlineLeadCountPicker
                          value={searchLeadCountDraft}
                          onChange={setSearchLeadCountDraft}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="border-t border-[#E2E8F0] bg-[#FCFDFE] px-5 py-4 md:px-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative" data-search-source-menu>
                          <button
                            type="button"
                            onClick={() => setSearchSourceMenuOpen((open) => !open)}
                            className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-[#475569] transition-colors hover:bg-white hover:text-[#0F172A]"
                          >
                            <SearchSourceIcon source={searchSource} />
                            {selectedSearchSourceLabel}
                            <ChevronDownSmallIcon
                              className={searchSourceMenuOpen ? 'rotate-180' : ''}
                            />
                          </button>

                          {searchSourceMenuOpen ? (
                            <div className="absolute bottom-[calc(100%+10px)] left-0 z-20 w-[240px] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_22px_45px_rgba(15,23,42,0.12)]">
                              <SearchSourceMenuItem
                                active={searchSource === 'linkedin'}
                                label="LinkedIn People Search"
                                description={
                                  hasLinkedInConnected ? 'Connected' : 'Connect LinkedIn to use'
                                }
                                icon={<LinkedInComposerIcon />}
                                onClick={() => {
                                  setSearchSource('linkedin');
                                  setSearchSourceMenuOpen(false);
                                }}
                              />
                              <SearchSourceMenuItem
                                active={searchSource === 'discovery'}
                                label="Discovery"
                                description="Parrot-led sourcing"
                                icon={<DiscoveryComposerIcon />}
                                onClick={() => {
                                  setSearchSource('discovery');
                                  setSearchSourceMenuOpen(false);
                                }}
                              />
                            </div>
                          ) : null}
                        </div>

                        {searchSource === 'linkedin' && connectedLinkedInAccounts.length > 1 ? (
                          <label className="inline-flex max-w-[240px] items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-sm text-[#475569]">
                            <LinkedInComposerIcon />
                            <span className="sr-only">Choose LinkedIn account</span>
                            <select
                              value={selectedLinkedInAccountId}
                              onChange={(event) => setSelectedLinkedInAccountId(event.target.value)}
                              className="max-w-[180px] truncate bg-transparent font-medium text-[#475569] outline-none"
                            >
                              {connectedLinkedInAccounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {getLinkedInAccountLabel(account)}
                                </option>
                              ))}
                            </select>
                          </label>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => uploadListInputRef.current?.click()}
                          className="inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-medium text-[#475569] transition-colors hover:bg-white hover:text-[#0F172A]"
                        >
                          <UploadListIcon />
                          Upload List
                        </button>
                        <input
                          ref={uploadListInputRef}
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={handleUploadListSelection}
                        />
                        <button
                          type="button"
                          onClick={handleLaunchCommand}
                          disabled={!canLaunchSearch}
                          className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-all ${
                            canLaunchSearch
                              ? 'bg-[#0F172A] text-white shadow-[0_10px_24px_rgba(15,23,42,0.18)] hover:bg-[#1E293B]'
                              : 'cursor-not-allowed bg-[#E2E8F0] text-[#94A3B8]'
                          }`}
                          aria-label={
                            searchSource === 'linkedin' && !showSearchBreakdown
                              ? 'Parse search into keywords and location'
                              : 'Launch search'
                          }
                        >
                          <ArrowUpRightIcon />
                        </button>
                      </div>
                    </div>

                    {searchSource === 'linkedin' && !hasLinkedInConnected ? (
                      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-[#FED7AA] bg-[#FFF7ED] p-4 text-left text-sm text-[#9A3412] md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-[#C2410C]">
                            LinkedIn Search needs setup
                          </p>
                          <p className="mt-1">
                            Connect a LinkedIn account in Channels before using it as a source.
                          </p>
                        </div>
                        <Link
                          to="/dashboard/accounts"
                          search={{ tab: 'linkedin' } as never}
                          className="inline-flex items-center justify-center rounded-xl bg-[#FF6B35] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#EA5A24]"
                        >
                          Connect LinkedIn
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full rounded-[30px] border border-[#E2E8F0] bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.04)] md:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                      Playbook setup
                    </p>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">
                      Choose the motion that fits the outcome you want next. Setup happens here in
                      one guided sheet, then Parrot carries it into the campaign workflow.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <StatusPill label="1. Pick the motion" tone="neutral" />
                    <StatusPill label="2. Answer a few prompts" tone="neutral" />
                    <StatusPill label="3. Parrot builds it" tone="accent" />
                  </div>
                </div>

                <motion.div
                  key={activePlaybook.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28 }}
                  className={`relative mt-5 w-full overflow-hidden rounded-2xl border border-[#E2E8F0] bg-gradient-to-br ${activePlaybook.surface} p-5 text-left shadow-[0_18px_42px_rgba(15,23,42,0.055)] md:p-6`}
                >
                  <div className="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="bg-white/86 rounded-full border border-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                          {getPlaybookStatusLabel(activePlaybook.status)}
                        </span>
                        <span
                          className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                          style={{ backgroundColor: activePlaybook.accent }}
                        >
                          {activePlaybookFields.length} prompts
                        </span>
                      </div>

                      <h3 className="mt-4 max-w-[30rem] text-[1.85rem] font-semibold leading-[1.05] text-[#0F172A] md:text-[2.15rem]">
                        {activePlaybook.name}
                      </h3>
                      <p className="mt-3 max-w-[38rem] text-sm leading-6 text-[#475569]">
                        {activePlaybookConfig.bestFor}
                      </p>
                      <p className="mt-3 max-w-[38rem] text-base leading-7 text-[#0F172A]">
                        {activePlaybook.meaning}
                      </p>

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        {activePlaybookConfig.builds.slice(0, 3).map((item) => (
                          <span
                            key={item}
                            className="bg-white/82 rounded-full border border-white/80 px-3 py-1.5 text-xs font-medium text-[#475569]"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                          type="button"
                          onClick={() => openPlaybookSetup(activePlaybook.id)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0F172A] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B]"
                        >
                          Start this playbook
                          <ArrowUpRightIcon />
                        </button>
                        <span className="text-sm text-[#64748B]">
                          {activePlaybookFields.length} guided answers
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/80 bg-white/70 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-sm">
                      <PlaybookVisual playbook={activePlaybook} />
                    </div>
                  </div>
                </motion.div>

                <div className="mt-5 flex flex-col gap-3 border-t border-[#E2E8F0] pt-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                      More playbooks
                    </p>
                  </div>
                  <div className="text-sm text-[#64748B]">
                    {connectedChannelCount} channel{connectedChannelCount === 1 ? '' : 's'} ready
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {upcomingPlaybooks.map((playbook, index) => {
                    const playbookConfig = playbookSetupConfig[playbook.id];
                    const playbookFieldCount = getVisiblePlaybookFields(
                      playbook.id,
                      playbookConfig,
                      playbookDrafts[playbook.id] ??
                        buildInitialPlaybookDraft(playbook.id, workspace)
                    ).length;
                    return (
                      <motion.button
                        key={playbook.id}
                        type="button"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22, delay: index * 0.04 }}
                        onClick={() => setSelectedPlaybook(playbook.id)}
                        className={`h-full overflow-hidden rounded-2xl border bg-white text-left transition-all hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-[0_14px_28px_rgba(15,23,42,0.07)] ${
                          selectedPlaybook === playbook.id ? 'border-[#0F172A]' : 'border-[#E2E8F0]'
                        }`}
                      >
                        <div className="flex h-full gap-3 p-3">
                          <div
                            className={`flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${playbook.surface} p-1.5`}
                          >
                            <PlaybookVisual playbook={playbook} compact />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                                {getPlaybookStatusLabel(playbook.status)}
                              </span>
                              <span
                                className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
                                style={{ backgroundColor: playbook.accent }}
                              >
                                {playbookFieldCount} prompts
                              </span>
                            </div>
                            <h4 className="mt-2 text-base font-semibold leading-tight text-[#0F172A]">
                              {playbook.name}
                            </h4>
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#64748B]">
                              {playbook.outcome}
                            </p>
                            <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                              <span className="text-xs font-medium text-[#64748B]">
                                Preview this motion
                              </span>
                              <span className="text-sm font-medium text-[#FF6B35]">
                                Use it next
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {commandMode === 'search' ? (
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                    Start with a signal
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-[#0F172A]">Pick a search path</h2>
                </div>
                {hasSearchComposerState ? (
                  <button
                    type="button"
                    onClick={resetSearchComposer}
                    className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#0F172A]"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {visibleSuggestedSearches.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    type="button"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.985 }}
                    aria-pressed={activeSuggestedSearchId === suggestion.id}
                    onClick={() => handleUseSuggestedSearch(suggestion)}
                    className={`group cursor-pointer rounded-[24px] border p-5 text-left transition-all ${
                      activeSuggestedSearchId === suggestion.id
                        ? 'border-[#FF6B35]/45 bg-white shadow-[0_16px_38px_rgba(255,107,53,0.10)]'
                        : 'border-[#E2E8F0] bg-[#FCFDFE] hover:border-[#FF6B35]/35 hover:bg-white'
                    }`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                      {suggestion.label}
                    </p>
                    <h3 className="mt-3 text-base font-semibold text-[#0F172A]">
                      {suggestion.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#64748B]">
                      {suggestion.description}
                    </p>
                    <div
                      className={`mt-4 inline-flex items-center gap-2 text-sm font-medium ${
                        activeSuggestedSearchId === suggestion.id
                          ? 'text-[#0F172A]'
                          : 'text-[#FF6B35]'
                      }`}
                    >
                      {activeSuggestedSearchId === suggestion.id
                        ? 'Loaded above'
                        : suggestion.ctaLabel}
                      <ArrowRightIcon />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                  Before you launch
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[#0F172A]">One thing to finish</h2>
              </div>

              <div className="space-y-3">
                {priorityLaunchChannel ? (
                  <Link
                    key={priorityLaunchChannel.label}
                    to="/dashboard/accounts"
                    search={priorityLaunchChannel.search as never}
                    className="flex w-full items-center gap-4 rounded-[22px] border border-[#E2E8F0] bg-[#FCFDFE] p-4 transition-colors hover:border-[#CBD5E1] hover:bg-white"
                  >
                    <div className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        Connect your {priorityLaunchChannel.label.toLowerCase()}
                      </p>
                      <p className="mt-1 text-sm text-[#64748B]">
                        {priorityLaunchChannel.description}
                      </p>
                    </div>
                    <ArrowRightIcon />
                  </Link>
                ) : (
                  <div className="rounded-[22px] border border-[#E2E8F0] bg-[#FCFDFE] p-4">
                    <p className="text-sm font-semibold text-[#0F172A]">Ready to launch</p>
                    <p className="mt-1 text-sm text-[#64748B]">
                      Your workspace is ready for sourcing and campaign setup. Use the composer
                      above to start the motion.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}

        {commandMode === 'search' &&
          (campaignsData.length > 0 || hasPerformanceData || hasActivityData) && (
            <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              {campaignsData.length > 0 ? (
                <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                        Live Workspace
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-[#0F172A]">
                        What is already moving
                      </h2>
                    </div>
                    <Link
                      to="/dashboard/campaigns"
                      className="text-sm font-medium text-[#FF6B35] transition-colors hover:text-[#C2410C]"
                    >
                      Open workspace
                    </Link>
                  </div>

                  {campaignsLoading ? (
                    <div className="space-y-3">
                      {Array.from({ length: 2 }).map((_, index) => (
                        <div
                          key={index}
                          className="animate-pulse rounded-[22px] border border-[#E2E8F0] bg-[#FCFDFE] p-4"
                        >
                          <div className="h-4 w-32 rounded bg-[#E2E8F0]" />
                          <div className="mt-3 h-2 w-full rounded bg-[#E2E8F0]" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {campaignsData.slice(0, 2).map((campaign) => (
                        <div
                          key={campaign.id}
                          className="rounded-[22px] border border-[#E2E8F0] bg-[#FCFDFE] p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${
                                    campaign.status === 'active' ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'
                                  }`}
                                />
                                <h3 className="text-sm font-semibold text-[#0F172A]">
                                  {campaign.name}
                                </h3>
                              </div>
                              <p className="mt-2 text-sm text-[#64748B]">
                                {campaign.leads} leads, {campaign.sent} sent, {campaign.replies}{' '}
                                replies
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                campaign.status === 'active'
                                  ? 'bg-[#F0FDF4] text-[#15803D]'
                                  : 'bg-[#FFFBEB] text-[#B45309]'
                              }`}
                            >
                              {campaign.status}
                            </span>
                          </div>

                          <div className="mt-4 flex items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E2E8F0]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${campaign.progress}%` }}
                                transition={{ duration: 0.5 }}
                                className="h-full rounded-full bg-[#FF6B35]"
                              />
                            </div>
                            <span className="text-sm font-semibold text-[#0F172A]">
                              {campaign.progress}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div />
              )}

              {hasPerformanceData || hasActivityData ? (
                <div className="rounded-[28px] border border-[#E2E8F0] bg-white p-6 shadow-[0_18px_40px_rgba(15,23,42,0.04)]">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#94A3B8]">
                        Signals
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-[#0F172A]">Live feedback</h2>
                    </div>
                    {hasActivityData ? (
                      <Link
                        to="/dashboard/inbox"
                        className="text-sm font-medium text-[#FF6B35] transition-colors hover:text-[#C2410C]"
                      >
                        Open inbox
                      </Link>
                    ) : null}
                  </div>

                  {hasPerformanceData ? (
                    <div className="mb-5 grid gap-3 md:grid-cols-2">
                      {performanceStats.map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-[22px] border border-[#E2E8F0] bg-[#FCFDFE] p-4"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: stat.accent }}
                            />
                            <p className="text-sm font-medium text-[#64748B]">{stat.label}</p>
                          </div>
                          <p className="mt-3 text-2xl font-semibold text-[#0F172A]">{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {hasActivityData ? (
                    <div className="space-y-3">
                      {activityData.slice(0, 3).map((activity, index) => (
                        <motion.div
                          key={`${activity.name}-${index}`}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25, delay: index * 0.05 }}
                          className="flex items-start gap-3 rounded-[20px] border border-[#E2E8F0] bg-[#FCFDFE] p-4"
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                            <ActivityStatusIcon type={activity.type} status={activity.status} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-[#0F172A]">
                                {activity.name}
                              </p>
                              <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-[#64748B]">
                                {activity.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-[#64748B]">
                              {activity.company || 'Unknown company'}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          )}
      </div>

      <PlaybookSetupModal
        open={playbookSetupOpen}
        playbook={activePlaybook}
        config={activePlaybookConfig}
        visibleFields={activePlaybookFields}
        answers={activePlaybookAnswers}
        fieldSuggestions={activePlaybookSuggestions}
        currentStep={playbookSetupStep}
        totalSteps={playbookSetupTotalSteps}
        progress={activePlaybookProgress}
        onClose={() => setPlaybookSetupOpen(false)}
        onBack={handlePlaybookBack}
        onContinue={handlePlaybookContinue}
        onComplete={completePlaybookSetup}
        onChangeAnswer={handlePlaybookAnswerChange}
      />

      <InlineDiscoverySetupModal
        open={discoverySetupOpen}
        brief={discoveryBriefDraft}
        onChangeBrief={setDiscoveryBriefDraft}
        targetWebsites={discoveryTargetWebsitesDraft}
        onChangeTargetWebsites={setDiscoveryTargetWebsitesDraft}
        specialInstructions={discoverySpecialInstructionsDraft}
        onChangeSpecialInstructions={setDiscoverySpecialInstructionsDraft}
        sourceCoverage={discoverySourceCoverage}
        linkedInConnected={hasLinkedInConnected}
        listMode={discoveryListMode}
        onChangeListMode={setDiscoveryListMode}
        destinationListId={discoveryDestinationListId}
        onChangeDestinationListId={setDiscoveryDestinationListId}
        newListName={discoveryNewListName}
        onChangeNewListName={setDiscoveryNewListName}
        leadLists={leadLists}
        scheduleIntervalDays={discoveryScheduleIntervalDays}
        onChangeScheduleIntervalDays={setDiscoveryScheduleIntervalDays}
        preview={discoveryPreview}
        previewing={discoveryPreviewing}
        submitting={discoverySubmitting}
        error={discoveryError}
        started={discoveryStarted}
        onClose={resetDiscoverySetup}
        onStart={handleStartInlineDiscovery}
        onOpenLeads={() => {
          if (!discoveryStarted) return;
          resetDiscoverySetup();
          void navigate({
            to: '/dashboard/leads',
            search: {
              listId: discoveryStarted.listId || undefined,
              discoveryOnly: true,
            } as never,
          } as never);
        }}
      />

      <HomeCsvMappingModal
        open={homeCsvMappingOpen}
        file={homeCsvFile}
        previewHeaders={homeCsvPreviewHeaders}
        previewRows={homeCsvPreviewRows}
        columnMapping={homeCsvColumnMapping}
        mappingSuggestions={homeCsvMappingSuggestions}
        mappingConfirmed={homeCsvMappingConfirmed}
        importError={homeCsvImportError}
        importing={homeCsvImporting}
        onClose={resetHomeCsvMappingState}
        onChangeMapping={(header, value) => {
          setHomeCsvColumnMapping((current) => ({
            ...current,
            [header]: value,
          }));
          setHomeCsvMappingConfirmed(true);
        }}
        onImport={() => {
          void handleConfirmHomeCsvImport();
        }}
      />

      <HomeSearchResultsModal
        open={homeSearchModalOpen}
        phase={homeSearchPhase}
        statusCopy={homeSearchStatusCopy}
        summary={homeSearchSummary}
        job={homeSearchJobStatus}
        leads={homeSearchLeads}
        leadsLoading={homeSearchLeadsLoading}
        totalLeads={homeSearchTotal}
        currentPage={homeSearchPage}
        error={homeSearchError}
        saved={homeSearchSaved}
        onPageChange={setHomeSearchPage}
        onClose={closeHomeSearchModal}
        onSave={persistHomeSearchList}
        onViewLeads={handleViewHomeSearchInLeads}
        onStartCampaign={handleStartCampaignFromHomeSearch}
      />
    </>
  );
}

function inferInlineDiscoverySearchType(description: string): 'intent' | 'event' {
  return /\b(funding|funded|raised|launch|launched|hire|hiring|appointed|promoted|acquired|acquisition|expansion|expanding|partnership|merged|opening|opened|conference|webinar|summit|event)\b/i.test(
    description
  )
    ? 'event'
    : 'intent';
}

function buildInlineDiscoverySearchName(description: string) {
  const cleaned = description.replace(/\s+/g, ' ').trim().replace(/[.]+$/, '');
  if (!cleaned) return 'Discovery Search';
  return cleaned.length > 72 ? `${cleaned.slice(0, 69).trimEnd()}...` : cleaned;
}

function buildInlineDiscoveryLinkedInSearchParams(description: string): Record<string, unknown> {
  const keywordText = description.trim().replace(/\s+/g, ' ').slice(0, 180);
  if (!keywordText) return {};

  return {
    api: 'classic',
    category: 'people',
    network_distance: [2, 3],
    keywords: keywordText,
  };
}

function parseInlineDiscoveryTargetWebsites(rawValue: string): string[] {
  return Array.from(
    new Set(
      rawValue
        .split(/\n|,/)
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

function buildInlineDiscoveryPayload({
  description,
  targetWebsites,
  specialInstructions,
  linkedinAccountId,
  destinationListId,
  scheduleIntervalDays,
  workspaceId,
}: {
  description: string;
  targetWebsites: string;
  specialInstructions: string;
  linkedinAccountId: string;
  destinationListId?: string | null;
  scheduleIntervalDays: string;
  workspaceId: string;
}): DiscoverySearchCreateRequest {
  const searchType = inferInlineDiscoverySearchType(description);
  const intervalDays = Number(scheduleIntervalDays || 0);
  const linkedInEnabled = Boolean(linkedinAccountId);
  const normalizedTargetWebsites = parseInlineDiscoveryTargetWebsites(targetWebsites);

  return {
    workspace_id: workspaceId,
    name: buildInlineDiscoverySearchName(description),
    search_type: searchType,
    configuration_mode: 'manual',
    criteria_json: {
      description,
      target_websites: normalizedTargetWebsites,
      special_instructions: specialInstructions.trim() || null,
    },
    source_config_json: {
      web: {
        enabled: true,
        max_results: 25,
        target_websites: normalizedTargetWebsites,
        use_crawl4ai: normalizedTargetWebsites.length > 0,
      },
      linkedin: {
        enabled: linkedInEnabled,
        linkedin_account_id: linkedInEnabled ? linkedinAccountId : null,
        max_results: 25,
        search_params: linkedInEnabled ? buildInlineDiscoveryLinkedInSearchParams(description) : {},
      },
    },
    destination_list_id: destinationListId || null,
    schedule_enabled: intervalDays > 0,
    schedule_type:
      intervalDays === 7
        ? 'weekly'
        : intervalDays === 14
          ? 'biweekly'
          : intervalDays > 0
            ? 'custom'
            : null,
    schedule_config_json:
      intervalDays > 0
        ? {
            time: '09:00',
            day_of_week: 0,
            interval_days: intervalDays,
          }
        : {},
    status: 'active',
  };
}

function InlineDiscoverySetupModal({
  open,
  brief,
  onChangeBrief,
  targetWebsites,
  onChangeTargetWebsites,
  specialInstructions,
  onChangeSpecialInstructions,
  sourceCoverage,
  linkedInConnected,
  listMode,
  onChangeListMode,
  destinationListId,
  onChangeDestinationListId,
  newListName,
  onChangeNewListName,
  leadLists,
  scheduleIntervalDays,
  onChangeScheduleIntervalDays,
  preview,
  previewing,
  submitting,
  error,
  started,
  onClose,
  onStart,
  onOpenLeads,
}: {
  open: boolean;
  brief: string;
  onChangeBrief: (value: string) => void;
  targetWebsites: string;
  onChangeTargetWebsites: (value: string) => void;
  specialInstructions: string;
  onChangeSpecialInstructions: (value: string) => void;
  sourceCoverage: string[];
  linkedInConnected: boolean;
  listMode: 'new' | 'existing';
  onChangeListMode: (value: 'new' | 'existing') => void;
  destinationListId: string;
  onChangeDestinationListId: (value: string) => void;
  newListName: string;
  onChangeNewListName: (value: string) => void;
  leadLists: LeadList[];
  scheduleIntervalDays: string;
  onChangeScheduleIntervalDays: (value: string) => void;
  preview: DiscoverySearchPreview | null;
  previewing: boolean;
  submitting: boolean;
  error: string | null;
  started: {
    searchId: string;
    runId: string;
    searchName: string;
    listId: string | null;
    listName: string | null;
  } | null;
  onClose: () => void;
  onStart: () => void;
  onOpenLeads: () => void;
}) {
  if (!open || typeof document === 'undefined') return null;

  const scheduleOptions = [
    { value: '0', label: 'Run once' },
    { value: '7', label: 'Weekly' },
    { value: '14', label: 'Every 2 weeks' },
  ];

  const parsedTargetDomains = Array.from(
    new Set(
      targetWebsites
        .split(/[\n,]/)
        .map((value) => cleanDiscoveryDomain(value))
        .filter(Boolean)
    )
  );

  return createPortal(
    <div className="fixed inset-0 z-[88] flex items-center justify-center bg-[#0F172A]/40 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-[1] flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[32px] border border-[#E2E8F0] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.2)]"
      >
        <div className="border-b border-[#E2E8F0] px-5 py-4 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                  Discovery
                </span>
                <span className="rounded-full bg-[#EFF6FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#2563EB]">
                  Inline setup
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[#0F172A]">
                {started ? 'Search started' : 'Set up this discovery search'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#64748B]">
                {started
                  ? 'Parrot has started the search. Leads will be available on the Leads page when results are saved.'
                  : 'Keep this lightweight: confirm the brief, choose where results should land, and start the run.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              aria-label="Close discovery setup"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 md:px-7 md:py-6">
          {started ? (
            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[26px] border border-[#E2E8F0] bg-gradient-to-br from-[#F8FBFF] to-white p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  Live now
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-[#0F172A]">{started.searchName}</h3>
                <p className="mt-3 text-sm leading-6 text-[#475569]">
                  Parrot is now scanning the sources below and will push matched results into your
                  destination list as the run completes, so they can be worked from Leads.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {sourceCoverage.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1.5 text-xs font-medium text-[#1D4ED8]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-[#E2E8F0] bg-[#FCFDFE] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                    Results destination
                  </p>
                  <p className="mt-3 text-base font-semibold text-[#0F172A]">
                    {started.listName || 'Discovery results will stay attached to this run'}
                  </p>
                </div>
                <div className="rounded-[24px] border border-[#E2E8F0] bg-[#FCFDFE] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                    What happens next
                  </p>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-[#475569]">
                    <p>1. Parrot collects candidates from the selected sources.</p>
                    <p>2. Results are saved into Leads and tagged as Discovery.</p>
                    <p>
                      3. You can open the Leads page to review, enrich, and use them in campaigns.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="space-y-4">
                <div className="rounded-[26px] border border-[#E2E8F0] bg-[#FCFDFE] p-5">
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                      Brief
                    </span>
                    <textarea
                      value={brief}
                      onChange={(event) => onChangeBrief(event.target.value)}
                      rows={4}
                      placeholder="Companies expanding into Saudi Arabia and hiring enterprise account executives"
                      className="mt-3 min-h-[148px] w-full resize-none rounded-[22px] border border-[#E2E8F0] bg-white px-4 py-4 text-base leading-7 text-[#0F172A] outline-none transition-colors focus:border-[#FF6B35]"
                    />
                  </label>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <ModalFieldCard
                    icon="🌐"
                    label="Target websites"
                    badge={
                      parsedTargetDomains.length > 0
                        ? `${parsedTargetDomains.length} domain${parsedTargetDomains.length === 1 ? '' : 's'}`
                        : 'Optional'
                    }
                    accent={parsedTargetDomains.length > 0}
                  >
                    <textarea
                      value={targetWebsites}
                      onChange={(event) => onChangeTargetWebsites(event.target.value)}
                      rows={4}
                      placeholder={'stripe.com\nnotion.so\nrippling.com'}
                      className="mt-3 min-h-[120px] w-full resize-none rounded-[22px] border border-[#E2E8F0] bg-white px-4 py-4 font-mono text-[13px] leading-6 text-[#0F172A] outline-none transition placeholder:font-sans placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15"
                    />
                    {parsedTargetDomains.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {parsedTargetDomains.map((domain) => (
                          <span
                            key={domain}
                            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#0F172A] ring-1 ring-[#E2E8F0]"
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-[#14B8A6]"
                              aria-hidden="true"
                            />
                            {domain}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs leading-5 text-[#64748B]">
                        One URL or domain per line. Discovery will prioritize companies and people
                        tied to these sites.
                      </p>
                    )}
                  </ModalFieldCard>

                  <ModalFieldCard
                    icon="✨"
                    label="Special instructions"
                    badge={specialInstructions.trim() ? 'Active' : 'Optional'}
                    accent={specialInstructions.trim().length > 0}
                  >
                    <textarea
                      value={specialInstructions}
                      onChange={(event) => onChangeSpecialInstructions(event.target.value)}
                      rows={4}
                      placeholder="Prioritize direct decision-makers, avoid agencies, and favor companies with active hiring or expansion signals."
                      className="mt-3 min-h-[120px] w-full resize-none rounded-[22px] border border-[#E2E8F0] bg-white px-4 py-4 text-sm leading-6 text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15"
                    />
                    <div className="mt-3">
                      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                        Quick add
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {DISCOVERY_INSTRUCTION_SUGGESTIONS.map((text) => (
                          <button
                            key={text}
                            type="button"
                            onClick={() => {
                              const current = specialInstructions.trim();
                              onChangeSpecialInstructions(current ? `${current}\n${text}` : text);
                            }}
                            className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#475569] ring-1 ring-[#E2E8F0] transition hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                          >
                            + {text}
                          </button>
                        ))}
                      </div>
                    </div>
                  </ModalFieldCard>
                </div>

                <div className="rounded-[26px] border border-[#E2E8F0] bg-[#FCFDFE] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                    Save results into
                  </p>
                  <div className="mt-4 inline-flex rounded-2xl border border-[#E2E8F0] bg-white p-1">
                    <button
                      type="button"
                      onClick={() => onChangeListMode('new')}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                        listMode === 'new'
                          ? 'bg-[#0F172A] text-white'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      }`}
                    >
                      New list
                    </button>
                    <button
                      type="button"
                      onClick={() => onChangeListMode('existing')}
                      disabled={!leadLists.length}
                      className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                        listMode === 'existing'
                          ? 'bg-[#0F172A] text-white'
                          : 'text-[#64748B] hover:text-[#0F172A]'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      Existing list
                    </button>
                  </div>

                  {listMode === 'new' ? (
                    <input
                      value={newListName}
                      onChange={(event) => onChangeNewListName(event.target.value)}
                      className="mt-4 h-12 w-full rounded-[18px] border border-[#E2E8F0] bg-white px-4 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#FF6B35]"
                      placeholder="Discovery list name"
                    />
                  ) : (
                    <select
                      value={destinationListId}
                      onChange={(event) => onChangeDestinationListId(event.target.value)}
                      className="mt-4 h-12 w-full rounded-[18px] border border-[#E2E8F0] bg-white px-4 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#FF6B35]"
                    >
                      <option value="">Select a list</option>
                      {leadLists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[26px] border border-[#E2E8F0] bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                    Coverage
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {sourceCoverage.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 text-xs font-medium text-[#047857]"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
                          aria-hidden="true"
                        />
                        {item}
                      </span>
                    ))}
                    {parsedTargetDomains.length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1.5 text-xs font-medium text-[#047857]">
                        <span
                          className="h-1.5 w-1.5 rounded-full bg-[#10B981]"
                          aria-hidden="true"
                        />
                        Targeting {parsedTargetDomains.length} site
                        {parsedTargetDomains.length === 1 ? '' : 's'}
                      </span>
                    ) : null}
                  </div>
                  {!linkedInConnected ? (
                    <p className="mt-3 text-sm leading-6 text-[#64748B]">
                      Discovery can still run on web search right now. Connect LinkedIn later to
                      widen coverage.
                    </p>
                  ) : null}
                </div>

                <div className="rounded-[26px] border border-[#E2E8F0] bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                    Cadence
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {scheduleOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onChangeScheduleIntervalDays(option.value)}
                        className={`rounded-full border px-3.5 py-2 text-sm font-medium transition-colors ${
                          scheduleIntervalDays === option.value
                            ? 'border-[#0F172A] bg-[#0F172A] text-white'
                            : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-white'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[26px] border border-[#E2E8F0] bg-gradient-to-br from-[#FFF7ED] to-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                    Parrot readback
                  </p>
                  {previewing ? (
                    <p className="mt-3 text-sm text-[#64748B]">Preparing the discovery setup...</p>
                  ) : preview ? (
                    <>
                      <p className="mt-3 text-base font-semibold text-[#0F172A]">{preview.name}</p>
                      <p className="mt-3 text-sm leading-6 text-[#475569]">{preview.summary}</p>
                      {preview.warnings.length > 0 ? (
                        <div className="mt-4 space-y-2">
                          {preview.warnings.slice(0, 2).map((warning) => (
                            <p key={warning} className="text-sm text-[#C2410C]">
                              {warning}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[#64748B]">
                      Keep the brief concise. Parrot will turn it into a structured discovery run
                      automatically.
                    </p>
                  )}
                </div>

                {error ? (
                  <div className="rounded-[22px] border border-[#FED7AA] bg-[#FFF7ED] px-4 py-3 text-sm text-[#9A3412]">
                    {error}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#E2E8F0] px-5 py-4 md:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-[#64748B]">
              {started
                ? 'You can close this now. Discovery will continue running in the background.'
                : 'This flow stays on the dashboard so you can start sourcing without losing context.'}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC]"
              >
                {started ? 'Close' : 'Cancel'}
              </button>
              {started ? (
                <button
                  type="button"
                  onClick={onOpenLeads}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B]"
                >
                  Open Leads
                  <ArrowUpRightIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStart}
                  disabled={
                    submitting || !brief.trim() || (listMode === 'existing' && !destinationListId)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? 'Starting discovery...' : 'Start discovery'}
                  <ArrowUpRightIcon />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

const DISCOVERY_INSTRUCTION_SUGGESTIONS = [
  'Exclude agencies and consultancies',
  'Senior decision-makers only',
  'Recently funded companies',
  'Avoid existing customers',
];

function cleanDiscoveryDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .toLowerCase();
}

function ModalFieldCard({
  icon,
  label,
  badge,
  accent,
  children,
}: {
  icon: string;
  label: string;
  badge?: string;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-[26px] border p-5 transition ${
        accent
          ? 'border-[#FDBA74] bg-gradient-to-br from-[#FFF7ED] to-white'
          : 'border-[#E2E8F0] bg-[#FCFDFE]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="text-base leading-5" aria-hidden="true">
            {icon}
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
            {label}
          </span>
        </div>
        {badge ? (
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              accent ? 'bg-[#FF6B35] text-white' : 'bg-white text-[#94A3B8] ring-1 ring-[#E2E8F0]'
            }`}
          >
            {badge}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function PlaybookSetupModal({
  open,
  playbook,
  config,
  visibleFields,
  answers,
  fieldSuggestions,
  currentStep,
  totalSteps,
  progress,
  onClose,
  onBack,
  onContinue,
  onComplete,
  onChangeAnswer,
}: {
  open: boolean;
  playbook: GrowthPlaybook;
  config: PlaybookSetupConfig;
  visibleFields: PlaybookSetupField[];
  answers: Record<string, string>;
  fieldSuggestions: PlaybookFieldSuggestion[];
  currentStep: number;
  totalSteps: number;
  progress: number;
  onClose: () => void;
  onBack: () => void;
  onContinue: () => void;
  onComplete: () => void;
  onChangeAnswer: (fieldId: string, value: string) => void;
}) {
  if (!open || typeof document === 'undefined') return null;

  const isReviewStep = currentStep >= visibleFields.length;
  const currentField = visibleFields[currentStep] ?? null;
  const canContinue = isReviewStep
    ? true
    : Boolean(
        currentField &&
        (currentField.optional || (answers[currentField.id] ?? '').trim().length > 0)
      );
  const isSkippingOptional =
    Boolean(currentField?.optional) &&
    !isReviewStep &&
    !(answers[currentField?.id ?? ''] ?? '').trim();

  return createPortal(
    <div className="fixed inset-0 z-[86] flex items-start justify-center overflow-y-auto bg-[#0F172A]/45 p-4 backdrop-blur-sm md:items-center">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-[1] my-auto flex h-[calc(100vh-2rem)] max-h-[860px] w-full max-w-6xl flex-col overflow-hidden rounded-[34px] border border-[#E2E8F0] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.2)]"
      >
        <div className="shrink-0 border-b border-[#E2E8F0] px-5 py-4 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748B]">
                  {playbook.name}
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: playbook.accent }}
                >
                  Step {Math.min(currentStep + 1, totalSteps)} of {totalSteps}
                </span>
              </div>
              <h2 className="mt-3 text-2xl font-semibold text-[#0F172A]">
                {isReviewStep
                  ? 'Review before Parrot builds the motion'
                  : `Setting up ${playbook.name}`}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">
                {isReviewStep
                  ? config.summary
                  : 'Parrot is only asking for the inputs it needs to make this motion usable immediately.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              aria-label="Close playbook setup"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.28 }}
              className="h-full rounded-full"
              style={{ backgroundColor: playbook.accent }}
            />
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto lg:grid-cols-[0.88fr_1.12fr] lg:overflow-hidden">
          <div
            className={`min-h-0 overflow-y-auto border-b border-[#E2E8F0] bg-gradient-to-br ${playbook.surface} p-5 lg:border-b-0 lg:border-r lg:p-7`}
          >
            <div className="bg-white/78 rounded-[28px] border border-white/80 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                    Selected motion
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight text-[#0F172A]">
                    {playbook.name}
                  </h3>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: playbook.accent }}
                >
                  {visibleFields.length} prompts
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-[#475569]">{config.bestFor}</p>

              <div className="bg-white/82 mt-5 overflow-hidden rounded-[24px] border border-white/80 p-4">
                <PlaybookVisual playbook={playbook} />
              </div>

              <div className="bg-white/82 mt-5 rounded-[24px] border border-white/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  Parrot will build
                </p>
                <div className="mt-3 space-y-3">
                  {config.builds.map((item, index) => (
                    <div key={item} className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                        style={{ backgroundColor: playbook.accent }}
                      >
                        {index + 1}
                      </div>
                      <p className="text-sm leading-6 text-[#334155]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/82 mt-5 rounded-[24px] border border-white/80 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                  Prompt flow
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {visibleFields.map((field, index) => {
                    const isCompleted = Boolean((answers[field.id] ?? '').trim());
                    const isCurrent = !isReviewStep ? currentStep === index : false;
                    return (
                      <span
                        key={field.id}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                          isCurrent
                            ? 'border-[#0F172A] bg-[#0F172A] text-white'
                            : isCompleted
                              ? 'border-[#D1FAE5] bg-[#F0FDF4] text-[#166534]'
                              : 'border-[#E2E8F0] bg-white text-[#64748B]'
                        }`}
                      >
                        {index + 1}. {field.label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-h-0 flex-col bg-white">
            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-7 md:py-7">
              {isReviewStep ? (
                <div className="mx-auto max-w-3xl space-y-5">
                  <div className="rounded-[26px] border border-[#E2E8F0] bg-[#FCFDFE] p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                      Motion ready
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold text-[#0F172A]">
                      Review the setup before Parrot builds it
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#64748B]">
                      Parrot will use these answers to source the audience, build the messaging,
                      create the campaign structure, and track what happens next around this motion.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {visibleFields.map((field) => (
                      <div
                        key={field.id}
                        className="rounded-[22px] border border-[#E2E8F0] bg-white p-4"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                          {field.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-6 text-[#0F172A]">
                          {answers[field.id]?.trim() || 'Parrot can infer this later'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
                    <div className="rounded-[24px] border border-[#E2E8F0] bg-[#FCFDFE] p-5">
                      <p className="text-sm font-semibold text-[#0F172A]">
                        What Parrot builds next
                      </p>
                      <div className="mt-4 space-y-3">
                        {config.builds.map((item) => (
                          <div key={item} className="flex items-start gap-3">
                            <span
                              className="mt-2 h-2 w-2 flex-shrink-0 rounded-full"
                              style={{ backgroundColor: playbook.accent }}
                            />
                            <p className="text-sm leading-6 text-[#475569]">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[24px] border border-[#E2E8F0] bg-[#FCFDFE] p-5">
                      <p className="text-sm font-semibold text-[#0F172A]">Tracked stages</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {playbook.stages.slice(0, 5).map((stage) => (
                          <span
                            key={stage}
                            className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#475569]"
                          >
                            {stage}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto max-w-3xl">
                  <div className="rounded-[28px] border border-[#E2E8F0] bg-[#FCFDFE] p-5 md:p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                      Question {currentStep + 1}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight text-[#0F172A]">
                      {currentField?.prompt}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-[#64748B]">{currentField?.helper}</p>

                    <div className="mt-6">
                      {currentField?.type === 'textarea' ? (
                        <label className="block">
                          <span className="block text-sm font-semibold text-[#0F172A]">
                            {currentField.label}
                          </span>
                          <textarea
                            value={answers[currentField.id] ?? ''}
                            onChange={(event) =>
                              onChangeAnswer(currentField.id, event.target.value)
                            }
                            placeholder={currentField.placeholder}
                            className="mt-3 min-h-[220px] w-full resize-none rounded-[24px] border border-[#E2E8F0] bg-white px-4 py-4 text-base leading-7 text-[#0F172A] outline-none transition-colors focus:border-[#FF6B35]"
                          />
                        </label>
                      ) : currentField?.type === 'select' ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {currentField.options?.map((option) => {
                            const selected = (answers[currentField.id] ?? '') === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => onChangeAnswer(currentField.id, option)}
                                className={`rounded-[22px] border px-4 py-4 text-left transition-all ${
                                  selected
                                    ? 'border-[#0F172A] bg-[#0F172A] text-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]'
                                    : 'border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#CBD5E1]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <p className="text-sm font-semibold">{option}</p>
                                  <span
                                    className={`mt-0.5 h-4 w-4 rounded-full border ${
                                      selected ? 'border-white bg-white/25' : 'border-[#CBD5E1]'
                                    }`}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <label className="block">
                          <span className="block text-sm font-semibold text-[#0F172A]">
                            {currentField?.label}
                          </span>
                          <input
                            type={
                              currentField?.type === 'datetime-local' ? 'datetime-local' : 'text'
                            }
                            value={currentField ? (answers[currentField.id] ?? '') : ''}
                            onChange={(event) =>
                              currentField
                                ? onChangeAnswer(currentField.id, event.target.value)
                                : undefined
                            }
                            placeholder={currentField?.placeholder}
                            className="mt-3 h-14 w-full rounded-[20px] border border-[#E2E8F0] bg-white px-4 text-base text-[#0F172A] outline-none transition-colors focus:border-[#FF6B35]"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {fieldSuggestions.length > 0 ? (
                    <div className="mt-4 rounded-[22px] border border-[#E2E8F0] bg-white p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                        Suggested from your workspace
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {fieldSuggestions.map((suggestion) => (
                          <button
                            key={`${suggestion.label}-${suggestion.value}`}
                            type="button"
                            onClick={() =>
                              currentField && onChangeAnswer(currentField.id, suggestion.value)
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#FCFDFE] px-3 py-2 text-sm font-medium text-[#475569] transition-colors hover:border-[#CBD5E1] hover:bg-white hover:text-[#0F172A]"
                          >
                            <span className="text-[11px] uppercase tracking-[0.12em] text-[#94A3B8]">
                              {suggestion.label}
                            </span>
                            <span className="max-w-[26rem] truncate">{suggestion.value}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="border-t border-[#E2E8F0] px-5 py-4 md:px-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-[#64748B]">
                  {isReviewStep
                    ? 'Parrot will carry this setup straight into the campaign workflow next.'
                    : currentField?.optional
                      ? 'This can be skipped if you do not know it yet.'
                      : 'Only the inputs needed to build the motion well show up here.'}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={currentStep === 0 ? onClose : onBack}
                    className="inline-flex items-center justify-center rounded-2xl border border-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC]"
                  >
                    {currentStep === 0 ? 'Close' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={isReviewStep ? onComplete : onContinue}
                    disabled={!canContinue}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isReviewStep ? 'Create this motion' : isSkippingOptional ? 'Skip' : 'Continue'}
                    <ArrowUpRightIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function HomeCsvMappingModal({
  open,
  file,
  previewHeaders,
  previewRows,
  columnMapping,
  mappingSuggestions,
  mappingConfirmed,
  importError,
  importing,
  onClose,
  onChangeMapping,
  onImport,
}: {
  open: boolean;
  file: File | null;
  previewHeaders: string[];
  previewRows: string[][];
  columnMapping: Record<string, LeadMappingTarget>;
  mappingSuggestions: Record<string, LeadMappingSuggestion>;
  mappingConfirmed: boolean;
  importError: string | null;
  importing: boolean;
  onClose: () => void;
  onChangeMapping: (header: string, value: LeadMappingTarget) => void;
  onImport: () => void;
}) {
  if (!open || typeof document === 'undefined') return null;

  const mappedColumns = previewHeaders.filter((header) => {
    const target = columnMapping[header];
    return target && target !== '__keep__' && target !== '__ignore__';
  }).length;
  const hasIdentityField =
    previewHeaders.some((header) => {
      const target = columnMapping[header];
      return target === 'linkedin_url' || target === 'email' || target === '__split_full_name__';
    }) ||
    (previewHeaders.some((header) => columnMapping[header] === 'first_name') &&
      previewHeaders.some((header) => columnMapping[header] === 'last_name'));

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-center justify-center bg-[#0F172A]/35 p-4 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-[1] flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-[#E2E8F0] bg-white shadow-[0_30px_90px_rgba(15,23,42,0.18)]"
      >
        <div className="border-b border-[#E2E8F0] px-5 py-4 md:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#166534]">
                  Upload list
                </span>
                <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#64748B]">
                  Review smart mapping
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-[#0F172A]">Match your CSV columns</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">
                SalesParrot detected the most likely lead fields. Confirm or adjust them before the
                list is imported into the quick preview.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A]"
              aria-label="Close CSV mapping"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {file ? (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#DCFCE7] bg-[#F0FDF4] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DCFCE7]">
                <UploadListIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-[#0F172A]">{file.name}</p>
                <p className="text-sm text-[#64748B]">{Math.round(file.size / 1024)} KB</p>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-[#E2E8F0] bg-[#FCFDFE] p-4">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Smart summary</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Parrot already mapped the file. Only adjust the fields that clearly look wrong.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#475569]">
                  {previewHeaders.length} columns found
                </span>
                <span className="rounded-full border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-medium text-[#475569]">
                  {mappedColumns} mapped to lead fields
                </span>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    hasIdentityField
                      ? 'border border-[#DCFCE7] bg-[#F0FDF4] text-[#166534]'
                      : 'border border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]'
                  }`}
                >
                  {hasIdentityField ? 'Ready to import' : 'Needs a name, email, or LinkedIn URL'}
                </span>
              </div>
            </div>
          </div>

          {previewHeaders.length > 0 ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                {previewHeaders.map((header) => (
                  <div key={header} className="rounded-2xl border border-[#E2E8F0] bg-white p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
                      CSV column
                    </div>
                    <div className="mt-1 text-sm font-medium text-[#0F172A]">{header}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          mappingSuggestions[header]?.confidence === 'high'
                            ? 'bg-[#DCFCE7] text-[#166534]'
                            : mappingSuggestions[header]?.confidence === 'medium'
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#E2E8F0] text-[#475569]'
                        }`}
                      >
                        {mappingSuggestions[header]?.confidence || 'low'} confidence
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#64748B]">
                      {mappingSuggestions[header]?.reason || 'Added to the lead context field.'}
                    </p>
                    <select
                      value={columnMapping[header] || '__keep__'}
                      onChange={(event) =>
                        onChangeMapping(header, event.target.value as LeadMappingTarget)
                      }
                      className="mt-3 w-full rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#FF6B35]"
                    >
                      {LEAD_MAPPING_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
                <div className="border-b border-[#E2E8F0] px-4 py-3">
                  <p className="text-sm font-semibold text-[#0F172A]">CSV preview</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead>
                      <tr className="bg-[#F8FAFC] text-[11px] uppercase tracking-[0.14em] text-[#94A3B8]">
                        {previewHeaders.map((header) => (
                          <th key={header} className="px-3 py-3 font-medium">
                            {getLeadMappingPreviewLabel(header, columnMapping[header])}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-t border-[#E2E8F0] text-[#475569]">
                          {previewHeaders.map((_, columnIndex) => (
                            <td key={`${rowIndex}-${columnIndex}`} className="px-3 py-3">
                              {row[columnIndex] || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : null}

          {importError ? (
            <div className="mt-5 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
              {importError}
            </div>
          ) : null}
        </div>

        <div className="border-t border-[#E2E8F0] bg-white px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-[#64748B]">
              The list is auto-mapped already. Change anything you want, or import it straight into
              the same leads preview used by quick search.
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-2xl border border-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onImport}
                disabled={!file || !mappingConfirmed || importing}
                className="inline-flex items-center justify-center rounded-2xl bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {importing ? 'Importing...' : 'Import and preview leads'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function HomeSearchResultsModal({
  open,
  phase,
  statusCopy,
  summary,
  job,
  leads,
  leadsLoading,
  totalLeads,
  currentPage,
  error,
  saved,
  onPageChange,
  onClose,
  onSave,
  onViewLeads,
  onStartCampaign,
}: {
  open: boolean;
  phase: HomeSearchPhase;
  statusCopy: string;
  summary: HomeSearchSummary | null;
  job: ImportJob | undefined;
  leads: Lead[];
  leadsLoading: boolean;
  totalLeads: number;
  currentPage: number;
  error: string | null;
  saved: boolean;
  onPageChange: (page: number) => void;
  onClose: () => Promise<void> | void;
  onSave: () => Promise<string>;
  onViewLeads: () => Promise<void> | void;
  onStartCampaign: () => Promise<void> | void;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isOpeningLeads, setIsOpeningLeads] = useState(false);
  const [isStartingCampaign, setIsStartingCampaign] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsSaving(false);
      setIsClosing(false);
      setIsOpeningLeads(false);
      setIsStartingCampaign(false);
    }
  }, [open]);

  if (!open || typeof document === 'undefined') return null;

  const isBusy = phase === 'searching' || (leadsLoading && leads.length === 0);
  const previewCount = totalLeads || job?.created_count || leads.length;
  const progressValue = Math.max(4, Math.round(job?.progress ?? 0));
  const totalPages = Math.max(
    1,
    Math.ceil(Math.max(totalLeads, leads.length) / HOME_SEARCH_PAGE_SIZE)
  );
  const showingFrom = totalLeads === 0 ? 0 : (currentPage - 1) * HOME_SEARCH_PAGE_SIZE + 1;
  const showingTo =
    totalLeads === 0 ? 0 : Math.min(currentPage * HOME_SEARCH_PAGE_SIZE, totalLeads);

  const handleSave = async () => {
    if (saved || isSaving) return;
    setIsSaving(true);
    try {
      await onSave();
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : 'Unable to save this lead file.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = async () => {
    if (isClosing) return;
    setIsClosing(true);
    try {
      await onClose();
    } finally {
      setIsClosing(false);
    }
  };

  const handleViewLeads = async () => {
    if (isOpeningLeads) return;
    setIsOpeningLeads(true);
    try {
      await onViewLeads();
    } finally {
      setIsOpeningLeads(false);
    }
  };

  const handleStartCampaign = async () => {
    if (isStartingCampaign) return;
    setIsStartingCampaign(true);
    try {
      await onStartCampaign();
    } finally {
      setIsStartingCampaign(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0F172A]/35 p-4 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={() => {
          void handleClose();
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative z-[1] flex max-h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-[#E2E8F0] bg-white text-[#0F172A] shadow-[0_30px_90px_rgba(15,23,42,0.18)]"
      >
        <div className="border-b border-[#E2E8F0] px-5 py-4 md:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                  Leads preview
                </span>
                <span className="rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#2563EB]">
                  {statusCopy}
                </span>
                {saved ? (
                  <span className="rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-3 py-1 text-xs font-medium text-[#15803D]">
                    Saved to Leads
                  </span>
                ) : (
                  <span className="rounded-full border border-[#FED7AA] bg-[#FFF7ED] px-3 py-1 text-xs font-medium text-[#C2410C]">
                    Preview only
                  </span>
                )}
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-[#0F172A]">
                {summary?.sourceMode === 'upload'
                  ? summary.finalListName
                  : summary?.prompt || 'Lead preview'}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748B]">
                {summary?.sourceMode === 'upload'
                  ? 'Your uploaded list is shown here first so you can save it, open it in Leads, or start a campaign immediately.'
                  : summary?.accountName
                    ? `Searching through ${summary.accountName}${summary.resolvedLocation ? ` in ${summary.resolvedLocation}` : ''}.`
                    : 'SalesParrot is preparing the first leads preview.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void handleClose();
              }}
              disabled={isClosing}
              className="inline-flex h-10 w-10 items-center justify-center self-start rounded-full border border-[#E2E8F0] bg-white text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#0F172A] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Close search preview"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {error ? (
            <div className="rounded-[24px] border border-[#FECACA] bg-[#FEF2F2] p-5">
              <p className="text-sm font-semibold text-[#B91C1C]">Search could not finish</p>
              <p className="mt-2 text-sm leading-6 text-[#991B1B]">{error}</p>
            </div>
          ) : isBusy ? (
            <div className="space-y-4">
              <div className="rounded-[22px] border border-[#E2E8F0] bg-[#F8FAFC] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <SearchLensAnimation />
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">{statusCopy}</p>
                      <p className="mt-1 text-sm text-[#64748B]">
                        {statusCopy === 'Searching'
                          ? 'Building the LinkedIn query and scanning for matching profiles.'
                          : 'Profiles are being collected and prepared for preview.'}
                      </p>
                    </div>
                  </div>
                  <div className="min-w-[160px]">
                    <div className="flex items-center justify-between text-xs font-medium text-[#64748B]">
                      <span>{job?.processed_count ?? 0} processed</span>
                      <span>{progressValue}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressValue}%` }}
                        transition={{ duration: 0.35 }}
                        className="h-full rounded-full bg-[#0F172A]"
                      />
                    </div>
                  </div>
                </div>
                {summary?.locationWarning ? (
                  <div className="mt-4 rounded-full bg-[#FFF7ED] px-3 py-1.5 text-xs font-medium text-[#C2410C]">
                    {summary.locationWarning}
                  </div>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {summary?.sourceMode === 'upload' ? 'Uploaded leads' : 'People search results'}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-medium text-[#64748B]">
                    <span>{job?.processed_count ?? 0} processed</span>
                    <span>{job?.created_count ?? 0} found</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-[#0F172A]">
                    <thead>
                      <tr className="bg-[#F8FAFC] text-left text-[11px] uppercase tracking-[0.16em] text-[#94A3B8]">
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Title</th>
                        <th className="px-4 py-3 font-medium">Company</th>
                        <th className="px-4 py-3 font-medium">Location</th>
                        <th className="px-4 py-3 font-medium">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <tr key={index}>
                          <td className="border-t border-[#E2E8F0] px-4 py-3">
                            <div className="h-4 w-36 animate-pulse rounded bg-[#E2E8F0]" />
                          </td>
                          <td className="border-t border-[#E2E8F0] px-4 py-3">
                            <div className="h-4 w-44 animate-pulse rounded bg-[#E2E8F0]" />
                          </td>
                          <td className="border-t border-[#E2E8F0] px-4 py-3">
                            <div className="h-4 w-28 animate-pulse rounded bg-[#E2E8F0]" />
                          </td>
                          <td className="border-t border-[#E2E8F0] px-4 py-3">
                            <div className="h-4 w-24 animate-pulse rounded bg-[#E2E8F0]" />
                          </td>
                          <td className="border-t border-[#E2E8F0] px-4 py-3">
                            <div className="h-4 w-20 animate-pulse rounded bg-[#E2E8F0]" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">
                    {previewCount > 0
                      ? `${previewCount} leads ready to use`
                      : 'No leads came back from this search'}
                  </p>
                  <p className="mt-1 text-sm text-[#64748B]">
                    {summary?.sourceMode === 'upload'
                      ? 'Review the imported leads here before you save them or launch a campaign.'
                      : 'Review the pulled leads here without leaving the start flow.'}
                  </p>
                </div>
                {summary?.locationWarning ? (
                  <span className="rounded-full bg-[#FFF7ED] px-3 py-1.5 text-xs font-medium text-[#C2410C]">
                    {summary.locationWarning}
                  </span>
                ) : null}
              </div>

              <div className="overflow-hidden rounded-[24px] border border-[#E2E8F0] bg-white">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-3">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {summary?.sourceMode === 'upload'
                        ? 'Uploaded leads preview'
                        : 'Pulled leads preview'}
                    </p>
                    {summary?.accountName ? (
                      <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#64748B]">
                        {summary.accountName}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs font-medium text-[#64748B]">
                    {saved ? summary?.finalListName : `Will save as ${summary?.finalListName}`}
                  </span>
                </div>

                {leads.length > 0 ? (
                  <div className="relative">
                    {leadsLoading ? (
                      <div className="absolute inset-0 z-[1] flex items-center justify-center bg-white/70 backdrop-blur-[1px]">
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#475569] shadow-sm">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#CBD5E1] border-t-[#0F172A]" />
                          Loading next leads page
                        </div>
                      </div>
                    ) : null}

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm text-[#0F172A]">
                        <thead>
                          <tr className="bg-[#F8FAFC] text-left text-[11px] uppercase tracking-[0.16em] text-[#94A3B8]">
                            <th className="px-4 py-3 font-medium">#</th>
                            <th className="px-4 py-3 font-medium">Lead</th>
                            <th className="px-4 py-3 font-medium">Company</th>
                            <th className="px-4 py-3 font-medium">Location</th>
                            <th className="px-4 py-3 font-medium">Email</th>
                            <th className="px-4 py-3 font-medium">Profile</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leads.map((lead, index) => (
                            <HomeSearchLeadRow
                              key={lead.id}
                              lead={lead}
                              rowNumber={(currentPage - 1) * HOME_SEARCH_PAGE_SIZE + index + 1}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-[#64748B]">
                    No leads were returned for this search. Adjust the audience brief and try again.
                  </div>
                )}

                {totalPages > 1 ? (
                  <HomeSearchPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    showingFrom={showingFrom}
                    showingTo={showingTo}
                    totalLeads={totalLeads}
                    onPageChange={onPageChange}
                  />
                ) : null}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#E2E8F0] bg-white px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-[#64748B]">
              {saved
                ? 'This lead file is saved and ready on the Leads page.'
                : 'You can discard this preview, save the leads, open them in Leads, or start a campaign now.'}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => {
                  void handleClose();
                }}
                disabled={isClosing}
                className="inline-flex items-center justify-center rounded-2xl border border-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#475569] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saved ? 'Close' : 'Discard preview'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleSave();
                }}
                disabled={isBusy || saved || isSaving || Boolean(error)}
                className="inline-flex items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saved ? 'Saved' : isSaving ? 'Saving...' : 'Save leads'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleViewLeads();
                }}
                disabled={isBusy || isOpeningLeads || Boolean(error)}
                className="inline-flex items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-semibold text-[#0F172A] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isOpeningLeads ? 'Opening...' : 'Open in Leads'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleStartCampaign();
                }}
                disabled={isBusy || isStartingCampaign || Boolean(error) || leads.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0F172A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E293B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStartingCampaign ? 'Starting...' : 'Start campaign'}
                <ArrowUpRightIcon />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

function HomeSearchLeadRow({ lead, rowNumber }: { lead: Lead; rowNumber: number }) {
  const displayName =
    [lead.first_name, lead.last_name].filter(Boolean).join(' ').trim() || 'Unnamed lead';
  const initials =
    [lead.first_name, lead.last_name]
      .filter(Boolean)
      .map((value) => value?.[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <tr className="hover:bg-[#FCFDFE]">
      <td className="border-t border-[#E2E8F0] px-4 py-3 align-top text-sm text-[#64748B]">
        {rowNumber}
      </td>
      <td className="border-t border-[#E2E8F0] px-4 py-3 align-top">
        <div className="flex items-center gap-3">
          {lead.avatar_url ? (
            <img src={lead.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#14B8A6] text-xs font-semibold text-white">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-[#0F172A]">{displayName}</p>
            <p
              className="mt-1 max-w-[220px] truncate text-xs text-[#64748B]"
              title={lead.headline || lead.title || undefined}
            >
              {lead.headline || lead.title || 'No headline'}
            </p>
          </div>
        </div>
      </td>
      <td className="border-t border-[#E2E8F0] px-4 py-3 align-top text-[#475569]">
        {lead.company || '-'}
      </td>
      <td className="border-t border-[#E2E8F0] px-4 py-3 align-top text-[#475569]">
        {lead.location || '-'}
      </td>
      <td className="border-t border-[#E2E8F0] px-4 py-3 align-top">
        {lead.email ? (
          <div>
            <p className="font-medium text-[#15803D]">{lead.email}</p>
            <p className="mt-1 text-xs text-[#64748B]">Email found</p>
          </div>
        ) : (
          <span className="inline-flex rounded-full bg-[#F8FAFC] px-2.5 py-1 text-xs font-medium text-[#64748B]">
            No email yet
          </span>
        )}
      </td>
      <td className="border-t border-[#E2E8F0] px-4 py-3 align-top">
        {lead.linkedin_url ? (
          <a
            href={lead.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#0A66C2] transition-colors hover:border-[#BFDBFE] hover:bg-[#DBEAFE]"
          >
            <LinkedInComposerIcon />
            View on LinkedIn
          </a>
        ) : (
          <span className="text-xs text-[#94A3B8]">No profile link</span>
        )}
      </td>
    </tr>
  );
}

function HomeSearchPagination({
  currentPage,
  totalPages,
  showingFrom,
  showingTo,
  totalLeads,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  showingFrom: number;
  showingTo: number;
  totalLeads: number;
  onPageChange: (page: number) => void;
}) {
  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
    if (totalPages <= 5) return index + 1;
    if (currentPage <= 3) return index + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + index;
    return currentPage - 2 + index;
  });

  return (
    <div className="flex flex-col gap-3 border-t border-[#E2E8F0] px-4 py-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-[#64748B]">
        Showing {showingFrom} to {showingTo} of {totalLeads} leads
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          First
        </button>
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {visiblePages.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => onPageChange(pageNumber)}
              className={`rounded-xl px-3 py-1.5 text-sm transition-colors ${
                currentPage === pageNumber
                  ? 'bg-[#0F172A] text-white'
                  : 'border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              {pageNumber}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-sm text-[#64748B] transition-colors hover:bg-[#F8FAFC] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Last
        </button>
      </div>
    </div>
  );
}

function InlineSearchField({
  label,
  value,
  placeholder,
  onChange,
  onEnter,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
}) {
  return (
    <label className="rounded-2xl border border-[#E2E8F0] bg-white/90 px-3 py-2 text-left shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onEnter?.();
          }
        }}
        placeholder={placeholder}
        className="mt-1 w-full bg-transparent text-sm font-medium text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
      />
    </label>
  );
}

function InlineLeadCountPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (nextValue: number) => void;
}) {
  const presets = [25, 50, 100];
  const isCustomValue = !presets.includes(value);

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white/90 px-4 py-3 shadow-[0_4px_14px_rgba(15,23,42,0.04)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
            Leads to fetch
          </p>
          <p className="mt-1 text-sm text-[#475569]">
            Quick search always uses 2nd and 3rd degree connections.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onChange(preset)}
              className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                value === preset
                  ? 'border-[#FF6B35] bg-[#FFF7ED] text-[#C2410C]'
                  : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              {preset}
            </button>
          ))}
          <input
            type="number"
            min={1}
            value={isCustomValue ? value : ''}
            onChange={(event) => {
              const nextValue = Number.parseInt(event.target.value, 10);
              if (Number.isFinite(nextValue) && nextValue > 0) {
                onChange(nextValue);
                return;
              }
              if (!event.target.value) {
                onChange(50);
              }
            }}
            placeholder="Custom"
            className="w-24 rounded-xl border border-[#E2E8F0] px-3 py-1.5 text-sm font-medium text-[#0F172A] outline-none transition-colors focus:border-[#FF6B35]"
          />
        </div>
      </div>
    </div>
  );
}

function SearchLensAnimation() {
  return (
    <div className="relative h-12 w-12 flex-shrink-0">
      <motion.div
        animate={{ scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full bg-[#FF6B35]/10"
      />
      <motion.div
        animate={{ x: [0, 3, -2, 0], y: [0, -2, 2, 0], rotate: [0, 6, -4, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
          <circle cx="13" cy="13" r="7.5" stroke="#0F172A" strokeWidth="2.4" />
          <path d="M18.5 18.5L24 24" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
          <motion.circle
            cx="13"
            cy="13"
            r="2.4"
            fill="#FF6B35"
            animate={{ opacity: [0.35, 1, 0.35], scale: [0.9, 1.15, 0.9] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </motion.div>
    </div>
  );
}

const GENERIC_LOCATION_TERMS = new Set([
  'finance',
  'sales',
  'marketing',
  'operations',
  'growth',
  'revenue',
  'partnerships',
  'leadership',
  'saas',
  'software',
  'b2b',
  'startup',
  'startups',
  'companies',
  'businesses',
  'teams',
  'people',
  'buyers',
  'customers',
  'prospects',
  'audience',
  'market',
  'events',
  'webinars',
  'workshops',
  'dinners',
]);

function toTitleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (word.length <= 3 && word === word.toUpperCase()) return word;
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(' ');
}

function cleanSuggestionFragment(value: string) {
  return value.replace(/\s+/g, ' ').replace(/[.]+$/, '').trim();
}

function extractRoleFromWorkspace(workspace: Workspace | null) {
  const icp = workspace?.icp?.trim();
  if (!icp) return '';

  const normalized = icp
    .replace(/^decision-makers?\s+(?:who\s+are\s+)?/i, '')
    .replace(/^buyers?\s+(?:who\s+are\s+)?/i, '')
    .replace(/^prospects?\s+(?:who\s+are\s+)?/i, '')
    .trim();

  const directMatch = normalized.match(
    /^(.*?)(?:\s+\b(?:at|from|within|inside|working at|working in|based in|located in|in|for|who|with)\b|$)/i
  )?.[1];
  const firstPhrase = cleanSuggestionFragment(
    (directMatch || normalized).split(',').slice(0, 2).join(', ')
  );

  if (!firstPhrase) return '';
  return firstPhrase.length > 64 ? firstPhrase.slice(0, 64).trim() : firstPhrase;
}

function extractMarketFromWorkspace(workspace: Workspace | null) {
  const candidates = [workspace?.icp, workspace?.business_blurb, workspace?.outreach_intent]
    .map((value) => value?.trim() || '')
    .filter(Boolean);

  const patterns = [
    /\b(?:at|from|within|selling to|for)\s+([^,.]+?(?:companies|firms|businesses|brands|startups|teams|agencies|consultancies|consultants|brokers|lenders|operators))/i,
    /\b((?:b2b|b2c|saas|fintech|healthcare|real estate|legal|manufacturing|logistics|hospitality|ecommerce|e-commerce)[^,.]*?(?:companies|firms|businesses|brands|startups|teams))/i,
  ];

  for (const text of candidates) {
    for (const pattern of patterns) {
      const match = text.match(pattern)?.[1];
      if (match) {
        return cleanSuggestionFragment(match);
      }
    }
  }

  return '';
}

function extractLocationFromWorkspace(workspace: Workspace | null) {
  const candidates = [workspace?.icp, workspace?.business_blurb, workspace?.outreach_intent]
    .map((value) => value?.trim() || '')
    .filter(Boolean);
  const patterns = [
    /\b(?:based in|located in|around|across|in)\s+([A-Za-z][A-Za-z\s'-]{1,40})(?:$|,|\.| and )/i,
    /\b(?:for)\s+([A-Za-z][A-Za-z\s'-]{1,40})(?:$|,|\.| and )/i,
  ];

  for (const text of candidates) {
    for (const pattern of patterns) {
      const raw = sanitizeLocationInput(text.match(pattern)?.[1] || '');
      const candidate = cleanSuggestionFragment(raw);
      if (!candidate) continue;
      if (candidate.split(/\s+/).length > 4) continue;
      if (GENERIC_LOCATION_TERMS.has(candidate.toLowerCase())) continue;
      return toTitleCase(candidate);
    }
  }

  return '';
}

function buildSimpleSearchPhrase(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => cleanSuggestionFragment(part || ''))
    .filter(Boolean)
    .join(' ');
}

function inferSuggestedPlaybook(workspace: Workspace | null): PlaybookId {
  const source = [
    workspace?.outreach_intent,
    workspace?.cta_preference,
    workspace?.value_proposition,
    workspace?.business_blurb,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/\b(dinner|roundtable|webinar|workshop|masterclass|event|summit|open house)\b/.test(source)) {
    return 'event-led-relationship-selling';
  }
  if (/\b(referral|partner|broker|accountant|consultant|agency|collaboration)\b/.test(source)) {
    return 'referral-partner-engine';
  }
  if (/\b(re-engage|reactivat|old lead|inactive lead|past lead|wake up)\b/.test(source)) {
    return 'lead-reactivation';
  }
  if (/\b(local|territory|city|market|region|area)\b/.test(source)) {
    return 'local-market-domination';
  }
  return 'founder-led-sales';
}

function getSuggestedPlaybookCardCopy(playbookId: PlaybookId) {
  switch (playbookId) {
    case 'event-led-relationship-selling':
      return {
        title: 'Start an event-led motion',
        description:
          'Open the event playbook and let Parrot build the invite, follow-up, and tracking path.',
      };
    case 'referral-partner-engine':
      return {
        title: 'Start a partner motion',
        description:
          'Open the referral partner playbook and set up a repeatable partner-sourcing workflow.',
      };
    case 'lead-reactivation':
      return {
        title: 'Reactivate existing leads',
        description:
          'Open the reactivation playbook and turn older leads into a fresh follow-up motion.',
      };
    case 'local-market-domination':
      return {
        title: 'Run a local market motion',
        description:
          'Open the local market playbook and focus the next campaign on one geography that matters.',
      };
    default:
      return {
        title: 'Start a founder-led motion',
        description:
          'Open the founder-led playbook and shape a more personal outbound path from day one.',
      };
  }
}

function buildSuggestedSearches(workspace: Workspace | null): SuggestedSearch[] {
  const companyName = getWorkspaceDisplayName(workspace);
  const role = extractRoleFromWorkspace(workspace) || 'VP of sales';
  const market = extractMarketFromWorkspace(workspace);
  const location = extractLocationFromWorkspace(workspace);
  const valueProposition = cleanSuggestionFragment(workspace?.value_proposition?.trim() || '');
  const outreachIntent = cleanSuggestionFragment(workspace?.outreach_intent?.trim() || '');
  const linkedInPrompt = buildSimpleSearchPhrase([
    role,
    market ? `at ${market}` : '',
    location ? `in ${location}` : '',
  ]);
  const discoveryPrompt = buildSimpleSearchPhrase([
    market || 'Companies',
    outreachIntent
      ? outreachIntent
      : role
        ? `hiring ${role.toLowerCase()}`
        : valueProposition
          ? `needing ${valueProposition.toLowerCase()}`
          : 'showing a relevant buying signal',
    location ? `in ${location}` : '',
  ]);
  const playbookId = inferSuggestedPlaybook(workspace);
  const playbookCard = getSuggestedPlaybookCardCopy(playbookId);

  return [
    {
      id: 'linkedin-quick-search',
      label: 'LinkedIn',
      title: linkedInPrompt || `People search for ${companyName}`,
      description: `Fast title-based search${location ? ` in ${location}` : ''} using the connected LinkedIn account.`,
      text: linkedInPrompt || role,
      target: 'linkedin',
      ctaLabel: 'Run this search',
    },
    {
      id: 'discovery-signal',
      label: 'Discovery',
      title: 'Track a live market signal',
      description:
        discoveryPrompt ||
        `Look for companies and people becoming relevant to ${companyName} right now.`,
      text: discoveryPrompt || `${companyName} signal search`,
      target: 'discovery',
      ctaLabel: 'Open discovery',
    },
    {
      id: `playbook-${playbookId}`,
      label: 'Next action',
      title: playbookCard.title,
      description: playbookCard.description,
      text: '',
      target: 'playbook',
      ctaLabel: 'Open playbook',
      playbookId,
    },
  ];
}

function ModeButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
        active
          ? 'bg-[#0F172A] text-white shadow-sm'
          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SearchSourceMenuItem({
  active,
  label,
  description,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
        active
          ? 'bg-[#F8FAFC] text-[#0F172A]'
          : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
      }`}
    >
      <div className={active ? 'text-[#FF6B35]' : 'text-[#64748B]'}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-1 text-xs text-[#64748B]">{description}</p>
      </div>
    </button>
  );
}

function SearchSourceIcon({ source }: { source: SearchSource }) {
  return source === 'linkedin' ? <LinkedInComposerIcon /> : <DiscoveryComposerIcon />;
}

const playbookVisualAssets: Record<GrowthPlaybook['visual'], string> = {
  event: '/playbooks/event-led-relationship-selling.png',
  reactivation: '/playbooks/lead-reactivation.png',
  referral: '/playbooks/referral-partner-engine.png',
  founder: '/playbooks/founder-led-sales.png',
  local: '/playbooks/local-market-domination.png',
};

function PlaybookVisual({
  playbook,
  compact = false,
}: {
  playbook: GrowthPlaybook;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-white ${
        compact
          ? 'h-full w-full rounded-lg'
          : 'aspect-[6/5] rounded-[22px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]'
      }`}
    >
      <img
        src={playbookVisualAssets[playbook.visual]}
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'neutral' | 'accent' }) {
  return (
    <span
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
        tone === 'accent'
          ? 'border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]'
          : 'border-[#E2E8F0] bg-white text-[#64748B]'
      }`}
    >
      {label}
    </span>
  );
}

function ActivityStatusIcon({ type, status }: { type: string; status: string }) {
  const colorClass =
    status === 'accepted'
      ? 'text-[#16A34A]'
      : status === 'replied'
        ? 'text-[#F97316]'
        : 'text-[#2563EB]';

  if (type === 'connection') {
    return <ConnectionIcon className={colorClass} />;
  }

  if (type === 'reply') {
    return <ReplyIcon className={colorClass} />;
  }

  return <EmailIcon className={colorClass} />;
}

function PartnerAccessBanner({
  partnerAccess,
  onDismiss,
}: {
  partnerAccess: PartnerAccessInfo;
  onDismiss: () => void;
}) {
  const isExpiringSoon =
    partnerAccess.days_until_expiry !== null && partnerAccess.days_until_expiry <= 7;
  const isLifetime = partnerAccess.days_until_expiry === null;
  const isLimited = partnerAccess.access_type === 'limited';

  const bannerStyles = partnerAccess.is_expired
    ? 'bg-red-50 border-red-200'
    : isExpiringSoon
      ? 'bg-amber-50 border-amber-200'
      : 'bg-teal-50 border-teal-200';

  const iconColor = partnerAccess.is_expired
    ? 'text-red-500'
    : isExpiringSoon
      ? 'text-amber-500'
      : 'text-teal-500';

  if (partnerAccess.is_expired) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-xl border p-4 ${bannerStyles}`}
      >
        <button
          onClick={onDismiss}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 ${iconColor}`}>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-800">Partner Access Expired</h3>
            <p className="mt-1 text-sm text-red-700">
              Your partner access via code{' '}
              <span className="font-mono font-semibold">{partnerAccess.code}</span> has expired.
            </p>
            <div className="mt-3">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Upgrade to Continue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-xl border p-4 ${bannerStyles}`}
    >
      <button
        onClick={onDismiss}
        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 ${iconColor}`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`text-sm font-semibold ${isExpiringSoon ? 'text-amber-800' : 'text-teal-800'}`}
            >
              Partner Access Active
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                partnerAccess.access_type === 'full'
                  ? 'bg-teal-100 text-teal-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {partnerAccess.access_type === 'full' ? 'Full Access' : 'Limited Access'}
            </span>
          </div>
          <p className={`mt-1 text-sm ${isExpiringSoon ? 'text-amber-700' : 'text-teal-700'}`}>
            Using code <span className="font-mono font-semibold">{partnerAccess.code}</span>,{' '}
            {isLifetime ? (
              <span className="font-medium">lifetime access</span>
            ) : isExpiringSoon ? (
              <span className="font-medium">
                {partnerAccess.days_until_expiry === 0
                  ? 'expires today'
                  : partnerAccess.days_until_expiry === 1
                    ? 'expires tomorrow'
                    : `${partnerAccess.days_until_expiry} days remaining`}
              </span>
            ) : (
              <span>{partnerAccess.days_until_expiry} days remaining</span>
            )}
          </p>

          {isLimited && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {partnerAccess.max_senders && (
                <span className="rounded bg-white/60 px-2 py-1 text-amber-700">
                  Max {partnerAccess.max_senders} sender{partnerAccess.max_senders > 1 ? 's' : ''}
                </span>
              )}
              {partnerAccess.max_sequences && (
                <span className="rounded bg-white/60 px-2 py-1 text-amber-700">
                  Max {partnerAccess.max_sequences} sequence
                  {partnerAccess.max_sequences > 1 ? 's' : ''}
                </span>
              )}
              {partnerAccess.max_emails_per_day && (
                <span className="rounded bg-white/60 px-2 py-1 text-amber-700">
                  {partnerAccess.max_emails_per_day} emails/day
                </span>
              )}
              {partnerAccess.api_access === false && (
                <span className="rounded bg-white/60 px-2 py-1 text-amber-700">No API access</span>
              )}
            </div>
          )}

          {isExpiringSoon && (
            <div className="mt-3">
              <Link
                to="/pricing"
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
              >
                Upgrade Before It Expires
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function AudienceIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function PlaybookIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 4.5h10.5A1.5 1.5 0 0118.75 6v12a1.5 1.5 0 01-1.5 1.5H6.75A1.5 1.5 0 015.25 18V6a1.5 1.5 0 011.5-1.5z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 8.25h7.5M8.25 12h7.5M8.25 15.75h4.5"
      />
    </svg>
  );
}

function LinkedInComposerIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 9v7.5M7.5 6.75h.008v.008H7.5V6.75zM11.25 16.5V12a2.25 2.25 0 114.5 0v4.5M4.5 4.5h15v15h-15V4.5z"
      />
    </svg>
  );
}

function DiscoveryComposerIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.568 3.75c.7-1.186 2.164-1.186 2.864 0l1.1 1.864a1.65 1.65 0 001.113.785l2.113.48c1.343.305 1.796 1.954.878 2.885l-1.442 1.462a1.65 1.65 0 00-.457 1.374l.207 2.116c.13 1.337-1.054 2.347-2.287 1.845l-1.95-.793a1.65 1.65 0 00-1.242 0l-1.95.793c-1.233.502-2.418-.508-2.287-1.845l.207-2.116a1.65 1.65 0 00-.457-1.374L4.25 9.98c-.918-.931-.465-2.58.878-2.885l2.113-.48a1.65 1.65 0 001.113-.785l1.214-2.08z"
      />
    </svg>
  );
}

function UploadListIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 7.5h9m-9 4.5h9m-9 4.5h4.5M6 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function ArrowUpRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M9.5 7H17v7.5" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m0 0l-5-5m5 5l-5 5" />
    </svg>
  );
}

function ChevronDownSmallIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 text-[#94A3B8] transition-transform ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function ConnectionIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z"
      />
    </svg>
  );
}

function ReplyIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
      />
    </svg>
  );
}

function EmailIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}
