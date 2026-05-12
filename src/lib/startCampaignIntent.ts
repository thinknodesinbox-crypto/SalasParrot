export type StartCampaignIntent = {
  original: string;
  discoveryBrief: string;
  linkedinKeywords: string;
  locationInput: string | null;
  targetWebsites: string[];
  specialInstructions: string;
  scheduleIntervalDays: string;
  searchType: 'intent' | 'event';
};

const EVENT_TERMS =
  /\b(events?|conference|conferences|summit|summits|webinar|webinars|workshop|workshops|meetup|meetups|expo|expos|trade\s+shows?|organizers?|organisers?|hosting|tickets?|registration)\b/i;

const TARGET_WEBSITE_PATTERN =
  /\b(?:https?:\/\/)?(?:www\.)?([a-z0-9-]+(?:\.[a-z0-9-]+)+)(?:\/[^\s,;)]*)?/gi;

const SEARCH_FILLER_WORDS = new Set([
  'help',
  'please',
  'can',
  'could',
  'would',
  'want',
  'wants',
  'wanna',
  'like',
  'just',
  'find',
  'me',
  'all',
  'the',
  'a',
  'an',
  'who',
  'that',
  'where',
  'people',
  'person',
  'profiles',
  'profile',
  'leads',
  'lead',
  'prospects',
  'prospect',
  'professionals',
  'professional',
  'with',
  'need',
  'needs',
  'looking',
  'are',
  'is',
  'for',
  'using',
  'use',
  'and',
  'or',
  'to',
  'of',
  'at',
  'by',
  'based',
  'located',
  'current',
  'currently',
  'public',
  'proof',
  'source',
  'sources',
  'links',
  'link',
  'recently',
  'from',
  'last',
  'next',
  'day',
  'days',
  'week',
  'weeks',
  'month',
  'months',
  'linkedin',
  'linkeidn',
  'linked',
  'search',
  'registration',
  'ticket',
  'tickets',
  'in',
  'though',
]);

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function trimSentence(value: string): string {
  return compact(value).replace(/^[,;:\s]+|[,;:\s.]+$/g, '');
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function normalizeHost(value: string): string {
  const cleaned = value.trim().replace(/[),.;]+$/g, '');
  try {
    const withProtocol = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
    const url = new URL(withProtocol);
    return url.hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return cleaned
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .toLowerCase();
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripDateWindows(input: string): string {
  return input
    .replace(/\bin\s+the\s+next\s+\d{1,3}(?:\s*(?:-|to|through|and)\s*\d{1,3})?\s*days?\b/gi, ' ')
    .replace(/\b(?:next|within|past|last|previous)\s+\d{1,3}\s*(?:days?|weeks?|months?)\b/gi, ' ')
    .replace(/\b(?:from\s+)?the\s+last\s+\d{1,3}\s*(?:days?|weeks?|months?)\b/gi, ' ')
    .replace(/\b(?:today|tomorrow|this week|next week|this month|next month)\b/gi, ' ');
}

function stripSearchPreamble(input: string): string {
  return compact(
    input
      .replace(
        /^\s*(?:can|could|would)\s+you\s+(?:please\s+)?(?:help\s+me\s+)?(?:find|show|get|source|search\s+for|look\s+for)\s+(?:me\s+)?/i,
        ''
      )
      .replace(
        /^\s*(?:help\s+me\s+)?(?:find|show|get|source|search\s+for|look\s+for)\s+(?:me\s+)?/i,
        ''
      )
      .replace(
        /^\s*(?:i\s+)?(?:want|wanna|would\s+like)\s+to\s+(?:find|source|search\s+for|get)\s+(?:me\s+)?/i,
        ''
      )
      .replace(
        /\b(?:for|using|with)\s+(?:linked\s*in|linkedin|linkeidn)\s+(?:people\s+)?search\b/gi,
        ' '
      )
  );
}

function normalizeAudiencePhrases(input: string): string {
  return compact(
    input
      .replace(
        /\b(?:people|professionals|leaders|operators|marketers)?\s*(?:that\s+are\s+)?(?:great|good|strong|excellent)\s+at\s+marketing\s+B2B\s+companies\s+at\s+scale\b/gi,
        'B2B marketing leaders scaling companies'
      )
      .replace(
        /\bmarketing\s+B2B\s+companies\s+at\s+scale\b/gi,
        'B2B marketing leaders scaling companies'
      )
      .replace(/\bB2B\s+companies\s+at\s+scale\b/gi, 'B2B companies at scale')
      .replace(
        /\b(?:great|good|strong|excellent)\s+at\s+scaling\s+marketing\b/gi,
        'marketing leaders with scaling experience'
      )
      .replace(
        /\bmarketing\s+(?:people|professionals|leaders|managers|teams)?\s*(?:into|in|at|for)\s+b2b\b/gi,
        'B2B marketing'
      )
      .replace(
        /\b(?:people|professionals|leaders|managers|teams)\s+(?:in|into)\s+marketing\b/gi,
        'marketing'
      )
      .replace(/\bmarketing\s+people\b/gi, 'marketing')
      .replace(/\b(?:into|in)\s+b2b\b/gi, 'B2B')
  );
}

function extractTargetWebsites(input: string): string[] {
  const targets: string[] = [];
  for (const match of input.matchAll(TARGET_WEBSITE_PATTERN)) {
    const host = normalizeHost(match[0]);
    if (!host || host.includes('@')) continue;
    if (host.includes('.')) targets.push(host);
  }
  return unique(targets);
}

function removeTargetWebsites(input: string): string {
  return compact(input.replace(TARGET_WEBSITE_PATTERN, ' '));
}

function extractLocation(input: string): string | null {
  const withoutDateWindows = stripDateWindows(input);

  const patterns = [
    /\b(?:in|near|around|based in|located in|across)\s+(?:the\s+)?((?:NYC|SF|LA|UK|USA|US|United States|United Kingdom|[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})(?:\s*(?:,|and|or)\s*(?:NYC|SF|LA|UK|USA|US|United States|United Kingdom|[A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})){0,4})\b/,
  ];

  for (const pattern of patterns) {
    const value = withoutDateWindows
      .match(pattern)?.[1]
      ?.replace(/\b(?:Exclude|Need|Make|Goal|Start|Avoid|Do|Don't|Must)\b.*$/i, '')
      .trim()
      .replace(/[.!?]+$/g, '')
      .trim();
    if (value && !/^(production|market|teams|companies|people|events)$/i.test(value)) {
      return value.replace(/\s*,\s*/g, ', ');
    }
  }
  return null;
}

function extractSchedule(input: string): string {
  const normalized = input.toLowerCase();
  if (/\b(?:weekly|every\s+week|each\s+week)\b/.test(normalized)) return '7';
  if (/\b(?:biweekly|every\s+2\s+weeks|every\s+two\s+weeks)\b/.test(normalized)) return '14';
  const days = normalized.match(
    /\b(?:repeat|run|rerun|refresh)\s+(?:this\s+)?(?:every|each)\s+(\d{1,3})\s+days?\b/
  );
  if (!days) return '0';
  return String(Math.min(Math.max(Number(days[1]), 1), 90));
}

function extractSpecialInstructions(input: string, targetWebsites: string[]): string {
  const sentences = input
    .split(/\n+|(?<=[.!?])\s+/)
    .map(trimSentence)
    .filter(Boolean);
  const instructionSentences = sentences
    .filter((sentence) =>
      /\b(cta|call to action|exclude|excluding|avoid|do not|don't|not\s+(?:outbound|sales|recruiting|recruiters?|agencies|consultants?|students?|freelancers?)|must not|must|make sure|proof|evidence|verified|source links?|sources?|paid|ticket|registration|decision makers?|next\s+\d|within\s+\d|past\s+\d|last\s+\d|the\s+last\s+\d|today|tomorrow|next week|next month|weekly|biweekly|every\s+\d+\s+days?)\b/i.test(
        sentence
      )
    )
    .map((sentence) => {
      if (/\bnot\s+outbound\b/i.test(sentence)) {
        return 'Exclude outbound-focused marketers.';
      }
      return sentence;
    });

  if (targetWebsites.length > 0) {
    instructionSentences.push(
      `Prioritize these target websites when relevant: ${targetWebsites.join(', ')}`
    );
  }

  return unique(instructionSentences).join('\n');
}

function stripInstructionClauses(input: string): string {
  const withoutTargets = removeTargetWebsites(input);
  return compact(
    withoutTargets
      .replace(
        /\b(?:for|using|with)\s+(?:linked\s*in|linkedin|linkeidn)\s+(?:people\s+)?search\b/gi,
        ' '
      )
      .replace(/\bTarget\s+(?:web)?sites?\b\s*[:,-]?\s*(?:[,;\s]+)?/gi, ' ')
      .replace(/\bCTA\b\s*:\s*[^.!?]*(?:[.!?]|$)/gi, ' ')
      .replace(/\bcall to action\b\s*:\s*[^.!?]*(?:[.!?]|$)/gi, ' ')
      .replace(/\bMust\s+exclude\b.*$/i, ' ')
      .replace(
        /\b(?:EXCLUDE|Exclude|excluding|avoid|do not include|do not contact|must not)\b[:\s].*$/i,
        ' '
      )
      .replace(/\bGoal is\b.*$/i, ' ')
      .replace(/\bStart conversations?\b.*$/i, ' ')
      .replace(
        /\b(?:but\s+)?not\s+(?:outbound|sales|recruiting|recruiters?|agencies|consultants?|students?|freelancers?)\b/gi,
        ' '
      )
      .replace(/\bNeed public proof\b.*$/i, ' ')
      .replace(/\bNeed public source links?\b.*$/i, ' ')
      .replace(/\bNeed proof\b.*$/i, ' ')
      .replace(/\bNeed source links?\b.*$/i, ' ')
      .replace(/\bNeed decision makers?\b.*$/i, ' ')
      .replace(/\bMake sure\b.*$/i, ' ')
      .replace(
        /\b(?:repeat|run|rerun|refresh)\s+(?:this\s+)?(?:every|each)\s+\d{1,3}\s+days?\b/gi,
        ' '
      )
      .replace(/\b(?:weekly|biweekly|every\s+week|every\s+2\s+weeks|every\s+two\s+weeks)\b/gi, ' ')
  );
}

function buildDiscoveryBrief(input: string, locationInput: string | null): string {
  let brief = normalizeAudiencePhrases(stripInstructionClauses(input))
    .replace(/^\s*(find|show|get|source|search for|look for)\s+(me\s+)?/i, '')
    .replace(/\b(?:though|please)\b/gi, ' ')
    .replace(/\s+[.?!]+$/g, '')
    .trim();
  brief = stripSearchPreamble(brief);
  if (!brief) brief = removeTargetWebsites(input);
  if (
    locationInput &&
    brief &&
    !new RegExp(`\\b${locationInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(brief)
  ) {
    brief = `${brief} in ${locationInput}`;
  }
  return (
    compact(brief)
      .replace(/[\s,;:]+$/g, '')
      .slice(0, 700) || compact(input).slice(0, 700)
  );
}

function buildLinkedInKeywords(input: string, locationInput: string | null): string {
  let text = normalizeAudiencePhrases(
    stripSearchPreamble(stripDateWindows(stripInstructionClauses(input)))
  );
  if (locationInput) {
    text = text.replace(new RegExp(`\\b${escapeRegex(locationInput)}\\b`, 'i'), ' ');
    for (const part of locationInput.split(/\s*(?:,|and|or)\s*/)) {
      if (part.trim()) {
        text = text.replace(new RegExp(`\\b${escapeRegex(part.trim())}\\b`, 'gi'), ' ');
      }
    }
  }
  text = text
    .replace(/^\s*(find|show|get|source|search for|look for)\s+(me\s+)?/i, '')
    .replace(/^\s*help\s+me\s+/i, '')
    .replace(/\bpeople responsible for\b/gi, '')
    .replace(/\bresponsible for\b/gi, '')
    .replace(/\borganising\b/gi, 'organizing')
    .replace(/\borganizing\b/gi, 'organizer')
    .replace(/\bhosting\b/gi, 'host organizer')
    .replace(/\bpaid\b/gi, '')
    .replace(/\bB2B marketing leaders scaling companies\b/gi, 'B2B marketing leaders scaling')
    .replace(/[^\w\s"()/-]/g, ' ');

  const tokens = compact(text)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !SEARCH_FILLER_WORDS.has(token.toLowerCase()));

  const keywordSet = new Set(tokens);
  if (isEventSearch(input)) {
    keywordSet.add('event');
    keywordSet.add('organizer');
    keywordSet.add('manager');
  }
  return Array.from(keywordSet).join(' ').slice(0, 180).trim() || compact(input).slice(0, 180);
}

function isEventSearch(input: string): boolean {
  if (!EVENT_TERMS.test(input)) return false;
  const ctaOnlyEventLanguage =
    /\b(?:cta|call to action)\s*:\s*[^.!?]*(?:webinar|event)\b/i.test(input) ||
    /\binvite\s+(?:them\s+|prospects\s+|leads\s+)?to\s+(?:a\s+)?(?:private\s+)?(?:webinar|event)\b/i.test(
      input
    );
  const explicitEventSourcing =
    /\b(?:find|show|get|source|search for|look for)\b.{0,160}\b(?:events?|conference|conferences|summit|summits|webinar|webinars|workshop|workshops|meetup|meetups|expo|expos|trade\s+shows?|organizers?|organisers?|hosting|tickets?|registration)\b/i.test(
      input
    ) || /\b(?:organizers?|organisers?)\s+(?:hosting|organizing|organising|running)\b/i.test(input);

  return explicitEventSourcing || !ctaOnlyEventLanguage;
}

export function normalizeStartCampaignIntent(input: string): StartCampaignIntent {
  const original = compact(input);
  const targetWebsites = extractTargetWebsites(original);
  const withoutTargets = removeTargetWebsites(original);
  const locationInput = extractLocation(withoutTargets);
  const searchType = isEventSearch(original) ? 'event' : 'intent';

  return {
    original,
    discoveryBrief: buildDiscoveryBrief(withoutTargets, locationInput),
    linkedinKeywords: buildLinkedInKeywords(withoutTargets, locationInput),
    locationInput,
    targetWebsites,
    specialInstructions: extractSpecialInstructions(original, targetWebsites),
    scheduleIntervalDays: extractSchedule(original),
    searchType,
  };
}
