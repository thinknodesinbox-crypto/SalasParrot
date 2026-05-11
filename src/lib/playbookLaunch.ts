export type GrowthPlaybookId =
  | 'signal-led-prospecting'
  | 'event-led-relationship-selling'
  | 'lead-reactivation'
  | 'referral-partner-engine'
  | 'founder-led-sales'
  | 'local-market-domination';

export type PlaybookSearchSource = 'discovery' | 'linkedin';

export type PlaybookCampaignSequenceNode = {
  id: string;
  type:
    | 'start'
    | 'linkedin_connect'
    | 'linkedin_message'
    | 'linkedin_inmail'
    | 'linkedin_view'
    | 'linkedin_like'
    | 'email'
    | 'delay'
    | 'condition'
    | 'enrichment'
    | 'reply_agent'
    | 'end';
  data: {
    label?: string;
    message?: string;
    subject?: string;
    delayDays?: number;
    delayHours?: number;
    condition?: string;
  };
  parentId?: string;
  branch?: 'true' | 'false';
};

export type PlaybookCampaignDraft = {
  name: string;
  description: string;
  leadListId?: string | null;
  leadListName?: string | null;
  sequenceNodes: PlaybookCampaignSequenceNode[];
};

export type PlaybookLaunchIntent = {
  type: 'playbook' | 'search';
  commandText: string;
  searchSource?: PlaybookSearchSource;
  playbookId?: GrowthPlaybookId;
  playbookSetup?: Record<string, string>;
  discoveryBrief?: string;
  discoveryTargetWebsites?: string;
  discoverySpecialInstructions?: string;
  campaignDraft?: PlaybookCampaignDraft;
  createdAt: string;
};

export type PlaybookWorkspaceContext = {
  name?: string | null;
  client_name?: string | null;
  icp?: string | null;
  value_proposition?: string | null;
  outreach_intent?: string | null;
  cta_preference?: string | null;
  business_blurb?: string | null;
};

export const HOME_LAUNCH_STORAGE_KEY = 'salesparrot-home-launch-intent';

const EVENT_TERMS =
  /\b(event|events|conference|conferences|summit|summits|webinar|workshop|meetup|roundtable|dinner|expo|ticket|tickets|paid registration|registration|attendee|organizer|organiser|sponsor|next\s+\d+\s+days?|next month|this month|date|dates)\b/i;
const REACTIVATION_TERMS =
  /\b(reactivat|re-engag|reengag|dormant|old leads?|past leads?|stale leads?|cold leads?|inactive|existing leads?|crm|csv|imported leads?|previous campaign|past campaign|wake up|revive)\b/i;
const SIGNAL_TERMS =
  /\b(signal|signals|hiring|funding|funded|raised|launch|launched|using|adopting|needs?|pain|intent|news|announced|expanding|building|production|looking for|search for|find)\b/i;

const clean = (value: string | null | undefined) => value?.trim() || '';

const compact = (parts: Array<string | null | undefined>, separator = ' ') =>
  parts
    .map((part) => clean(part))
    .filter(Boolean)
    .join(separator)
    .replace(/\s+/g, ' ')
    .trim();

const truncate = (value: string, maxLength: number) => {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 3).trimEnd()}...`;
};

export function getWorkspaceDisplayName(workspace: PlaybookWorkspaceContext | null | undefined) {
  return clean(workspace?.client_name) || clean(workspace?.name) || 'your business';
}

export function inferGrowthPlaybookIdFromText(
  text: string,
  workspace?: PlaybookWorkspaceContext | null
): GrowthPlaybookId {
  const source = compact([
    text,
    workspace?.outreach_intent || '',
    workspace?.value_proposition || '',
    workspace?.icp || '',
  ]).toLowerCase();

  if (REACTIVATION_TERMS.test(source)) return 'lead-reactivation';
  if (EVENT_TERMS.test(source)) return 'event-led-relationship-selling';
  if (SIGNAL_TERMS.test(source)) return 'signal-led-prospecting';
  return 'signal-led-prospecting';
}

export function buildPlaybookDiscoveryBrief({
  playbookId,
  answers,
  workspace,
}: {
  playbookId: GrowthPlaybookId;
  answers: Record<string, string>;
  workspace?: PlaybookWorkspaceContext | null;
}) {
  const workspaceName = getWorkspaceDisplayName(workspace);
  const icp = clean(answers.audience) || clean(answers.icp) || clean(workspace?.icp);
  const cta = clean(answers.cta) || clean(answers.goal) || clean(workspace?.cta_preference);

  if (playbookId === 'event-led-relationship-selling') {
    const rawEventType = clean(answers.eventType);
    const eventType =
      !rawEventType || rawEventType === 'Help me decide' ? 'event motion' : rawEventType;
    const topic = clean(answers.topic);
    const dateTime = clean(answers.dateTime);
    const registrationUrl = clean(answers.registrationUrl);
    const postEventNurture = clean(answers.postEventNurture);
    return compact([
      `Find ICP-fit people to invite to ${workspaceName}'s ${eventType.toLowerCase()}.`,
      registrationUrl
        ? `Event registration page: ${registrationUrl}. Use it as the event proof and CTA destination.`
        : 'If no registration URL is provided, prepare the invite audience and leave the registration CTA editable.',
      topic ? `Event hook: ${topic}.` : null,
      icp ? `Invite audience: ${icp}.` : null,
      dateTime
        ? `Timing: ${dateTime}.`
        : 'Respect any event date or time window the user provided.',
      cta && cta !== 'Help me decide'
        ? `Goal: ${cta}.`
        : 'Goal: help the user choose the best event CTA before launch.',
      postEventNurture ? `Post-event nurture path: ${postEventNurture}.` : null,
      'Return people as leads, attach proof for why each person fits the event audience, and prioritize reachable decision makers or influencers who would plausibly attend, sponsor, refer, or book after the event.',
    ]);
  }

  if (playbookId === 'lead-reactivation') {
    return compact([
      `Find or organize existing leads for a reactivation motion for ${workspaceName}.`,
      clean(answers.source) ? `Source: ${answers.source}.` : null,
      clean(answers.window) ? `Dormancy window: ${answers.window}.` : null,
      clean(answers.angle) ? `Reason to reopen the conversation: ${answers.angle}.` : null,
      cta ? `CTA: ${cta}.` : null,
    ]);
  }

  const signal = clean(answers.signal) || clean(workspace?.outreach_intent);
  return compact([
    `Find people at companies showing a timely buying signal for ${workspaceName}.`,
    icp ? `Audience: ${icp}.` : null,
    signal ? `Signal to detect: ${signal}.` : null,
    cta ? `CTA: ${cta}.` : null,
    'Return people as leads, rank by fit and signal strength, attach proof, and avoid broad company-only matches unless a relevant person can be identified.',
  ]);
}

export function buildPlaybookSpecialInstructions({
  playbookId,
  answers,
}: {
  playbookId: GrowthPlaybookId;
  answers: Record<string, string>;
}) {
  const sourceStrategy = clean(answers.sourceStrategy);
  const sender = clean(answers.sender);
  const base = [
    sourceStrategy ? `Source strategy: ${sourceStrategy}.` : null,
    sender ? `Preferred sender path: ${sender}.` : null,
    'Keep results usable on the Leads page: include proof, match reason, source label, and a clear next-action context for each lead.',
  ];

  if (playbookId === 'event-led-relationship-selling') {
    const registrationUrl = clean(answers.registrationUrl);
    base.push(
      registrationUrl
        ? `Use the user's registration page as the CTA and proof source: ${registrationUrl}.`
        : 'No registration URL is available yet, so keep the CTA editable and do not invent a registration link.',
      'This playbook is for the user’s own event, not for finding external event organizers unless the ICP explicitly includes organizers.',
      'Find invite-worthy ICP contacts first, then preserve context for attendee follow-up, no-show nurture, and post-event meeting conversion.'
    );
  } else if (playbookId === 'lead-reactivation') {
    base.push(
      'Prefer existing workspace leads and imported lists before looking for net-new contacts.',
      'Segment by likely reason to re-engage and avoid messaging people already protected by active campaign rules.'
    );
  } else if (playbookId === 'signal-led-prospecting') {
    base.push(
      'Collect enough evidence to separate weak keyword matches from real intent.',
      'Use open web first for signal proof, then LinkedIn when a person profile or sender-ready contact needs verification.'
    );
  }

  return base.filter(Boolean).join('\n');
}

export function buildPlaybookTargetWebsites(answers: Record<string, string>) {
  return compact([answers.registrationUrl, answers.targetWebsites], '\n');
}

export function buildPlaybookCampaignDraft({
  playbookId,
  answers,
  workspace,
  leadListId,
  leadListName,
}: {
  playbookId: GrowthPlaybookId;
  answers: Record<string, string>;
  workspace?: PlaybookWorkspaceContext | null;
  leadListId?: string | null;
  leadListName?: string | null;
}): PlaybookCampaignDraft {
  const workspaceName = getWorkspaceDisplayName(workspace);
  const audience =
    clean(answers.audience) || clean(answers.source) || clean(answers.icp) || clean(workspace?.icp);
  const cta =
    clean(answers.cta) ||
    clean(answers.goal) ||
    clean(workspace?.cta_preference) ||
    'Book a meeting';

  const nameByPlaybook: Record<GrowthPlaybookId, string> = {
    'signal-led-prospecting': truncate(
      compact(['Signal-led', audience || clean(answers.signal) || workspaceName], ': '),
      90
    ),
    'event-led-relationship-selling': truncate(
      compact(['Event-led', clean(answers.eventType) || clean(answers.topic) || audience], ': '),
      90
    ),
    'lead-reactivation': truncate(
      compact(['Lead reactivation', clean(answers.source) || audience || workspaceName], ': '),
      90
    ),
    'referral-partner-engine': 'Referral partner campaign',
    'founder-led-sales': 'Founder-led outbound campaign',
    'local-market-domination': 'Local market campaign',
  };

  const description = compact([
    playbookId === 'signal-led-prospecting'
      ? 'Signal-led prospecting motion with proof-backed lead context.'
      : playbookId === 'event-led-relationship-selling'
        ? 'Event-led relationship motion with invite and follow-up sequence.'
        : playbookId === 'lead-reactivation'
          ? 'Lead reactivation motion for existing or dormant leads.'
          : 'SalesParrot growth playbook campaign draft.',
    audience ? `Audience: ${audience}.` : null,
    cta ? `CTA: ${cta}.` : null,
  ]);

  return {
    name: nameByPlaybook[playbookId],
    description,
    leadListId: leadListId || null,
    leadListName: leadListName || null,
    sequenceNodes: buildPlaybookSequenceNodes({ playbookId, answers, workspace }),
  };
}

export function buildPlaybookSequenceNodes({
  playbookId,
  answers,
  workspace,
}: {
  playbookId: GrowthPlaybookId;
  answers: Record<string, string>;
  workspace?: PlaybookWorkspaceContext | null;
}): PlaybookCampaignSequenceNode[] {
  const workspaceName = getWorkspaceDisplayName(workspace);
  const cta =
    clean(answers.cta) ||
    clean(answers.goal) ||
    clean(workspace?.cta_preference) ||
    'book a quick call';
  const value = clean(workspace?.value_proposition) || clean(answers.angle) || clean(answers.topic);

  if (playbookId === 'lead-reactivation') {
    const angle = clean(answers.angle) || value || 'a relevant update';
    return [
      { id: 'start', type: 'start', data: {} },
      {
        id: 'reactivation-message-1',
        type: 'linkedin_message',
        data: {
          message: `Hi {{first_name}}, I was reviewing older conversations and thought this might be worth reopening. ${angle}\n\nWould it be useful to reconnect and see if this is relevant now?`,
        },
      },
      { id: 'reactivation-delay-1', type: 'delay', data: { delayDays: 3, delayHours: 0 } },
      {
        id: 'reactivation-email-1',
        type: 'email',
        data: {
          subject: `Worth revisiting?`,
          message: `Hi {{first_name}}, quick follow-up in case timing is better now.\n\n${angle}\n\nIf ${cta.toLowerCase()} makes sense, I can send a few times that work.`,
        },
      },
      { id: 'end', type: 'end', data: {} },
    ];
  }

  if (playbookId === 'event-led-relationship-selling') {
    const rawEventType = clean(answers.eventType);
    const eventType =
      !rawEventType || rawEventType === 'Help me decide' ? 'event motion' : rawEventType;
    const topic = clean(answers.topic) || value || 'a focused conversation';
    const registrationUrl = clean(answers.registrationUrl);
    const postEventNurture = clean(answers.postEventNurture);
    const registrationLine = registrationUrl
      ? `Here is the registration page: ${registrationUrl}`
      : 'I can send the registration details if this is relevant.';
    const nurtureLine =
      postEventNurture &&
      postEventNurture !== 'Review nurture later' &&
      postEventNurture !== 'Help me decide'
        ? postEventNurture.toLowerCase()
        : 'share the useful takeaways and see if a follow-up conversation makes sense';
    return [
      { id: 'start', type: 'start', data: {} },
      {
        id: 'event-connect',
        type: 'linkedin_connect',
        data: {
          message: `Hi {{first_name}}, noticed your work around {{company}} and thought you might be relevant for a ${eventType.toLowerCase()} we are hosting around ${topic}.`,
        },
      },
      { id: 'event-delay-1', type: 'delay', data: { delayDays: 1, delayHours: 0 } },
      {
        id: 'event-message-1',
        type: 'linkedin_message',
        data: {
          message: `Thanks for connecting, {{first_name}}. We are hosting a ${eventType.toLowerCase()} for people working on ${topic}.\n\nWould it be relevant for you or someone on your team to attend? ${registrationLine}`,
        },
      },
      { id: 'event-delay-2', type: 'delay', data: { delayDays: 3, delayHours: 0 } },
      {
        id: 'event-email-1',
        type: 'email',
        data: {
          subject: `Invitation around ${truncate(topic, 42)}`,
          message: `Hi {{first_name}}, wanted to share this in case it is useful.\n\nWe are inviting a focused group to a ${eventType.toLowerCase()} around ${topic}. ${registrationLine}\n\nAfter the event, the plan is to ${nurtureLine}.`,
        },
      },
      { id: 'end', type: 'end', data: {} },
    ];
  }

  const signal = clean(answers.signal) || clean(workspace?.outreach_intent) || 'a relevant signal';
  return [
    { id: 'start', type: 'start', data: {} },
    {
      id: 'signal-connect',
      type: 'linkedin_connect',
      data: {
        message: `Hi {{first_name}}, noticed {{company}} may be working through ${signal}. Thought it would be useful to connect.`,
      },
    },
    { id: 'signal-delay-1', type: 'delay', data: { delayDays: 1, delayHours: 0 } },
    {
      id: 'signal-message-1',
      type: 'linkedin_message',
      data: {
        message: `Thanks for connecting, {{first_name}}. I noticed the signal around ${signal} and thought ${workspaceName} could be relevant.\n\n${value ? `${value}\n\n` : ''}Would it be worth a quick conversation to see if this maps to your priorities?`,
      },
    },
    { id: 'signal-delay-2', type: 'delay', data: { delayDays: 3, delayHours: 0 } },
    {
      id: 'signal-email-1',
      type: 'email',
      data: {
        subject: `Question on ${truncate(signal, 42)}`,
        message: `Hi {{first_name}}, following up because the signal around ${signal} stood out.\n\nIf ${cta.toLowerCase()} is the right next step, happy to share a short note with context.`,
      },
    },
    { id: 'end', type: 'end', data: {} },
  ];
}
