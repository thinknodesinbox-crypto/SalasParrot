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
  'find',
  'me',
  'all',
  'the',
  'a',
  'an',
  'who',
  'that',
  'where',
  'with',
  'need',
  'needs',
  'looking',
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
  const withoutDateWindows = input
    .replace(/\bin\s+the\s+next\s+\d{1,3}(?:\s*(?:-|to|through|and)\s*\d{1,3})?\s*days?\b/gi, ' ')
    .replace(/\b(?:next|within|past|last|previous)\s+\d{1,3}\s*days?\b/gi, ' ')
    .replace(/\b(?:today|tomorrow|this week|next week|this month|next month)\b/gi, ' ');

  const patterns = [
    /\b(?:in|near|around|based in|located in)\s+([A-Z][A-Za-z.'-]+(?:[\s,]+[A-Z][A-Za-z.'-]+){0,4}|NYC|SF|LA|UK|USA|US)\b/,
    /\b(?:across)\s+([A-Z][A-Za-z.'-]+(?:[\s,]+[A-Z][A-Za-z.'-]+){0,4}|NYC|SF|LA|UK|USA|US)\b/,
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
  const instructionSentences = sentences.filter((sentence) =>
    /\b(exclude|excluding|avoid|do not|don't|must not|must|make sure|proof|evidence|verified|paid|ticket|registration|next\s+\d|within\s+\d|past\s+\d|last\s+\d|today|tomorrow|next week|next month|weekly|biweekly|every\s+\d+\s+days?)\b/i.test(
      sentence
    )
  );

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
        /\b(?:EXCLUDE|Exclude|excluding|avoid|do not include|do not contact|must not)\b[:\s].*$/i,
        ' '
      )
      .replace(/\bGoal is\b.*$/i, ' ')
      .replace(/\bStart conversations?\b.*$/i, ' ')
      .replace(/\bNeed public proof\b.*$/i, ' ')
      .replace(/\bNeed proof\b.*$/i, ' ')
      .replace(/\bMake sure\b.*$/i, ' ')
      .replace(
        /\b(?:repeat|run|rerun|refresh)\s+(?:this\s+)?(?:every|each)\s+\d{1,3}\s+days?\b/gi,
        ' '
      )
      .replace(/\b(?:weekly|biweekly|every\s+week|every\s+2\s+weeks|every\s+two\s+weeks)\b/gi, ' ')
  );
}

function buildDiscoveryBrief(input: string, locationInput: string | null): string {
  let brief = stripInstructionClauses(input)
    .replace(/^\s*(find|show|get|source|search for|look for)\s+(me\s+)?/i, '')
    .replace(/\s+[.?!]+$/g, '')
    .trim();
  if (!brief) brief = removeTargetWebsites(input);
  if (
    locationInput &&
    brief &&
    !new RegExp(`\\b${locationInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(brief)
  ) {
    brief = `${brief} in ${locationInput}`;
  }
  return compact(brief).slice(0, 700) || compact(input).slice(0, 700);
}

function buildLinkedInKeywords(input: string, locationInput: string | null): string {
  let text = stripInstructionClauses(input);
  if (locationInput) {
    text = text.replace(
      new RegExp(`\\b${locationInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i'),
      ' '
    );
  }
  text = text
    .replace(/^\s*(find|show|get|source|search for|look for)\s+(me\s+)?/i, '')
    .replace(/\bpeople responsible for\b/gi, '')
    .replace(/\bresponsible for\b/gi, '')
    .replace(/\borganising\b/gi, 'organizing')
    .replace(/\borganizing\b/gi, 'organizer')
    .replace(/\bhosting\b/gi, 'host organizer')
    .replace(/\bpaid\b/gi, '')
    .replace(/[^\w\s"()/-]/g, ' ');

  const tokens = compact(text)
    .split(/\s+/)
    .filter((token) => token.length > 1 && !SEARCH_FILLER_WORDS.has(token.toLowerCase()));

  const keywordSet = new Set(tokens);
  if (EVENT_TERMS.test(input)) {
    keywordSet.add('event');
    keywordSet.add('organizer');
    keywordSet.add('manager');
  }
  return Array.from(keywordSet).join(' ').slice(0, 180).trim() || compact(input).slice(0, 180);
}

export function normalizeStartCampaignIntent(input: string): StartCampaignIntent {
  const original = compact(input);
  const targetWebsites = extractTargetWebsites(original);
  const withoutTargets = removeTargetWebsites(original);
  const locationInput = extractLocation(withoutTargets);
  const searchType = EVENT_TERMS.test(original) ? 'event' : 'intent';

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
