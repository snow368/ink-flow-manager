// ── Types ──

export interface ParsedTattooInquiry {
  placement?: string;
  style?: string;
  size?: string;
  budget?: string;
  preferredDates?: string[];
  referenceMentioned?: boolean;
  colorPreference?: string;
  tattooDescription?: string;
  urgency?: 'low' | 'medium' | 'high';
  confidenceScore: number;
  missingFields: string[];
  warnings: string[];
  rawSummary: string;
}

export type ScopeClarity = 'clear' | 'somewhat_clear' | 'unclear';

export interface SuggestedQuestion {
  field: string;
  question: string;
  priority: 'high' | 'medium' | 'low';
}

export interface LeadDraft {
  name: string;
  placement?: string;
  style?: string;
  size?: string;
  budget?: string;
  note: string;
  tags: string[];
  source: 'instagram' | 'facebook' | 'tiktok' | 'referral' | 'walk_in' | 'other';
  confidence: number;
  nextBestAction: string;
  suggestedQuickReplies: string[];
}

// ── Regex patterns ──

const PLACEMENT_PATTERNS: [RegExp, string][] = [
  // Arms
  [/(?:full\s+)?(?:fore)?arm\b/i, 'arm'],
  [/bicep/i, 'bicep'],
  [/(?:inner\s+)?(?:fore)?arm/i, 'inner forearm'],
  [/wrist/i, 'wrist'],
  [/elbow/i, 'elbow'],
  [/hand\b/i, 'hand'],
  [/finger/i, 'finger'],
  // Legs
  [/thigh/i, 'thigh'],
  [/calf/i, 'calf'],
  [/shin/i, 'shin'],
  [/ankle/i, 'ankle'],
  [/foot\b/i, 'foot'],
  [/leg\b/i, 'leg'],
  [/knee/i, 'knee'],
  // Torso
  [/chest/i, 'chest'],
  [/ribs?/i, 'rib'],
  [/stomach/i, 'stomach'],
  [/abdomen/i, 'abdomen'],
  [/(?:lower\s+)?back\b/i, 'back'],
  [/shoulder/i, 'shoulder'],
  [/sternum/i, 'sternum'],
  [/(?:hip|hip\s+area)/i, 'hip'],
  [/waist/i, 'waist'],
  [/flank/i, 'flank'],
  // Neck/head
  [/neck/i, 'neck'],
  [/behind\s+(?:the\s+)?ear/i, 'behind ear'],
  [/ear/i, 'ear'],
  [/face/i, 'face'],
  [/scalp/i, 'scalp'],
  // Sleeve shorthand
  [/(?:half|full|3\/4|quarter)\s*sleeve/i, 'sleeve'],
  [/sleeve/i, 'sleeve'],
];

const STYLE_PATTERNS: [RegExp, string][] = [
  [/realism|realistic|photo.?real/i, 'realism'],
  [/(?:black\s*(?:and|&|\/)?\s*grey|b&g|bnw|black\s+and\s+white)/i, 'black and grey'],
  [/traditional|old.?school|sailor.?jerry/i, 'traditional'],
  [/neo.?traditional|neo.?trad/i, 'neo-traditional'],
  [/fine.?line|fine.?line/i, 'fine line'],
  [/minimal(?:ist)?/i, 'minimalist'],
  [/dot.?work|stipple/i, 'dotwork'],
  [/geometric/i, 'geometric'],
  [/tribal/i, 'tribal'],
  [/japanese|irezumi/i, 'japanese'],
  [/water.?color|watercolor/i, 'watercolor'],
  [/ornamental|mandala|filigree/i, 'ornamental'],
  [/sketch|etching/i, 'sketch'],
  [/new.?school|neo.?school/i, 'new school'],
  [/lettering|script|calligraphy/i, 'lettering'],
  [/biomech|bio.?mech/i, 'biomechanical'],
  [/black.?work|blackwork/i, 'blackwork'],
  [/trash.?polka/i, 'trash polka'],
  [/surreal(?:ism)?/i, 'surrealism'],
  [/cover.?up|coverup/i, 'cover up'],
  [/flash/i, 'flash'],
];

const SIZE_PATTERNS: [RegExp, string][] = [
  [/small|tiny|mini|little/i, 'small'],
  [/medium|mid.?size/i, 'medium'],
  [/large|big|huge/i, 'large'],
  [/full\s+(?:sleeve|back|chest|leg|arm)/i, 'full'],
  [/half\s+(?:sleeve|leg|arm)/i, 'half sleeve'],
  [/sleeve/i, 'sleeve-length'],
  [/palm.?size|coin.?size/i, 'palm-sized'],
  [/entire|whole|大片|大臂|整条/i, 'large'],
];

const BUDGET_PATTERNS: RegExp[] = [
  /\$?\s*(\d{2,4})(?:\s*(?:dollars|usd|aud|eur|gbp| bucks?| k|k ))?/i,
  /budget(?:\s*(?:is|of|around|about|~))?\s*\$?\s*(\d{2,4})/i,
  /(?:spend|spent|spending|pay|paying|willing\s*to\s*pay)\s*(?:around|about|~)?\s*\$?\s*(\d{2,4})/i,
  /(?:max|maximum|上限|at\s*most|up\s*to)\s*\$?\s*(\d{2,4})/i,
];

const DATE_PATTERNS: RegExp[] = [
  /(?:before|by|need\s+(?:it|this)\s+(?:by|before|done))\s+(\w+\s+\d{1,4})/i,
  /(?:next\s+(?:week|month|friday|monday|tuesday|wednesday|thursday|saturday|sunday))/i,
  /(?:this\s+(?:week|month))/i,
  /(?:in\s+\d+\s+(?:week|month|day)s?)/i,
  /(?:asap|soon|as\s+soon\s+as\s+possible|urgent)/i,
  /(?:summer|vacation|trip|holiday|event|wedding)/i,
];

const URGENCY_KEYWORDS: [RegExp, 'high' | 'medium'][] = [
  [/asap|urgent|need.*soon|running.*out|last.?minute|deadline/i, 'high'],
  [/before\s+(?:my|the|this)\s+(?:vacation|trip|holiday|wedding|event|birthday)/i, 'high'],
  [/next\s+(?:week|friday|monday)/i, 'high'],
  [/soon|this\s+(?:week|month)|in\s+\d+\s+(?:week|day)s?/i, 'medium'],
  [/summer|before\s+.*\d{4}/i, 'medium'],
];

const REFERENCE_KEYWORDS: RegExp[] = [
  /(?:reference|ref|refs|inspo|inspiration|example|sample|like this|similar|idea|mock.?up|sketch)/i,
  /(?:i\s+have\s+(?:a\s+)?pic|attached|sent\s+(?:a\s+)?pic|check\s+out|saw\s+your)/i,
  /(?:pinterest|instagram|img|photo|image|picture|drawing)/i,
];

const COLOR_KEYWORDS: [RegExp, string][] = [
  [/(?:black\s*(?:and|&|\/)?\s*(?:grey|gray)|bnw|b&w|monochrome|black.?and.?white|blk)/i, 'black and grey'],
  [/color(?:ful)?\s*(?:tattoo)?|full\s*color|colored/i, 'color'],
  [/black.?work|blackwork/i, 'blackwork'],
  [/water.?color|watercolor/i, 'watercolor-style color'],
  [/red|blue|green|yellow|purple|pink/i, 'color (specific)'],
];

const UNCERTAINTY_KEYWORDS = [
  /maybe|perhaps|possibly|might|kind[ao]f|sort[ao]f/i,
  /not\s+sure|idk|don't\s+know|haven't\s+decided|undecided|torn\s+between/i,
  /thinking\s+(?:about|of)|considering|leaning\s+toward/i,
  /somewhere|someplace|whatever|surprise\s+me|open\s+to/i,
  /suggest|recommend|what\s+do\s+you\s+think|what\s+would\s+you/i,
];

const VAGUE_PHRASES = [
  /something\s+cool/i,
  /something\s+small/i,
  /just\s+something/i,
  /idk\s+yet/i,
  /not\s+sure\s+yet/i,
  /still\s+deciding/i,
  /can't\s+decide/i,
  /anything\s+really/i,
  /no\s+preference/i,
  /not\s+picky/i,
  /surprise\s+me/i,
  /whatever\s+looks?\s+good/i,
  /open\s+to\s+(?:ideas|suggestions)/i,
  /i\s+don't\s+know/i,
];

const PLACEMENT_VAGUE_PATTERNS = [
  /arm\s+somewhere/i, /leg\s+maybe/i, /somewhere\s+on/i,
  /small\s+side/i, /someplace/i, /wherever/i,
  /not\s+sure\s+where/i, /undecided/i,
];

const STYLE_VAGUE_PATTERNS = [
  /not\s+sure/i, /something\s+cool/i,
  /open\s+to\s+ideas/i, /whatever\s+looks?\s+good/i,
  /just\s+something/i, /anything\s+really/i,
  /surprise\s+me/i,
];

// ── Helpers ──

function firstMatch(patterns: [RegExp, string][], text: string): string | undefined {
  for (const [re, value] of patterns) {
    const m = text.match(re);
    if (m) return value;
  }
  return undefined;
}

function firstMatchValue(patterns: [RegExp, string][], text: string): string | undefined {
  for (const [re, value] of patterns) {
    if (re.test(text)) return value;
  }
  return undefined;
}

function hasAny(patterns: RegExp[], text: string): boolean {
  return patterns.some(re => re.test(text));
}

function extractBudget(text: string): string | undefined {
  for (const re of BUDGET_PATTERNS) {
    const m = text.match(re);
    if (m && m[1]) {
      const num = parseInt(m[1], 10);
      if (num >= 10 && num <= 99999) {
        return num >= 1000 ? `$${Math.round(num / 100) * 100}` : `$${num}`;
      }
    }
  }
  // Bare dollar amounts
  const bare = text.match(/\$(\d{2,4})\b/);
  if (bare) {
    const num = parseInt(bare[1], 10);
    if (num >= 10 && num <= 99999) return `$${num}`;
  }
  return undefined;
}

function extractDates(text: string): string[] {
  const dates: string[] = [];
  for (const re of DATE_PATTERNS) {
    const m = text.match(re);
    if (m) {
      dates.push(m[0].toLowerCase().trim());
    }
  }
  return [...new Set(dates)];
}

function detectUrgency(text: string): 'low' | 'medium' | 'high' {
  for (const [re, level] of URGENCY_KEYWORDS) {
    if (re.test(text)) return level;
  }
  return 'low';
}

function countUncertainty(text: string): number {
  return UNCERTAINTY_KEYWORDS.reduce((count, re) => {
    const matches = text.match(re);
    return count + (matches ? matches.length : 0);
  }, 0);
}

function extractDescription(text: string): string | undefined {
  // Find the most substantive description sentence
  const sentences = text.split(/[.!?\n]+/).filter(s => {
    const t = s.trim();
    if (t.length < 8) return false;
    // Skip common non-description lines
    if (/^(?:hey|hi|hello|thanks|thank you|ok|okay|sure|yes|no)\b/i.test(t)) return false;
    // Skip questions
    if (/\?$/.test(t)) return false;
    return true;
  });
  if (sentences.length === 0) return undefined;
  // Take the longest sentence that has tattoo-related keywords
  const tattooSentences = sentences.filter(s =>
    /tattoo|design|piece|want|thinking|looking|idea|something/i.test(s)
  );
  const candidates = tattooSentences.length > 0 ? tattooSentences : sentences;
  return candidates.sort((a, b) => b.length - a.length)[0].trim();
}

// ── Main parser ──

export function parseTattooInquiry(conversation: string): ParsedTattooInquiry {
  const text = conversation.replace(/<[^>]*>/g, ' ').trim();
  if (!text) {
    return {
      missingFields: ['placement', 'style', 'size', 'budget'],
      warnings: ['No conversation text provided'],
      confidenceScore: 0,
      rawSummary: 'Empty conversation',
    };
  }

  const placement = firstMatch(PLACEMENT_PATTERNS, text);
  const style = firstMatch(STYLE_PATTERNS, text);
  const size = firstMatch(SIZE_PATTERNS, text);
  const budget = extractBudget(text);
  const preferredDates = extractDates(text);
  const referenceMentioned = hasAny(REFERENCE_KEYWORDS, text);
  const colorPreference = firstMatchValue(COLOR_KEYWORDS, text);
  const tattooDescription = extractDescription(text);
  const urgency = detectUrgency(text);
  const uncertaintyCount = countUncertainty(text);

  // Missing fields
  const missingFields: string[] = [];
  if (!placement) missingFields.push('placement');
  if (!style) missingFields.push('style');
  if (!size) missingFields.push('size');
  if (!budget) missingFields.push('budget');

  // Vague placement
  const isPlacementVague = placement && hasAny(PLACEMENT_VAGUE_PATTERNS, text);
  const isStyleVague = style && hasAny(STYLE_VAGUE_PATTERNS, text);

  // Warnings
  const warnings: string[] = [];
  if (isPlacementVague) warnings.push('Placement is vague — need exact location');
  if (isStyleVague) warnings.push('Style direction is unclear');
  if (budget) {
    const budgetNum = parseInt(budget.replace(/[^0-9]/g, ''), 10);
    if (budgetNum < 50) warnings.push('Budget below typical minimum pricing');
    if (budgetNum < 150 && (style === 'realism' || style === 'ornamental' || style === 'japanese')) {
      warnings.push('Budget may be low for this style');
    }
  }
  if (uncertaintyCount >= 2) warnings.push('Client seems unsure — may need guidance');
  if (missingFields.length >= 3 && uncertaintyCount >= 1) {
    warnings.push('Very early stage — help client narrow down');
  }

  // Raw summary
  const parts: string[] = [];
  if (placement) parts.push(placement);
  if (style) parts.push(style);
  if (size) parts.push(size);
  if (budget) parts.push(budget);
  if (colorPreference) parts.push(colorPreference);
  const rawSummary = parts.length > 0
    ? parts.join(', ')
    : 'No clear details extracted';

  // Confidence score
  let score = 30; // baseline
  if (placement && !isPlacementVague) score += 15;
  else if (placement) score += 8;
  if (style && !isStyleVague) score += 15;
  else if (style) score += 8;
  if (size) score += 10;
  if (budget) score += 15;
  if (referenceMentioned) score += 10;
  if (colorPreference) score += 5;
  if (tattooDescription && tattooDescription.length > 20) score += 5;
  if (uncertaintyCount >= 2) score -= 10;
  if (missingFields.length <= 1) score += 10;
  if (missingFields.length >= 3 && missingFields.includes('placement') && missingFields.includes('style')) {
    score -= 15;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    placement,
    style,
    size,
    budget,
    preferredDates,
    referenceMentioned,
    colorPreference,
    tattooDescription,
    urgency,
    confidenceScore: score,
    missingFields,
    warnings,
    rawSummary,
  };
}

// ── Scope clarity ──

export function detectScopeClarity(parsed: ParsedTattooInquiry): ScopeClarity {
  if (!parsed.placement && !parsed.style && !parsed.size && !parsed.budget) {
    return 'unclear';
  }

  if (
    parsed.missingFields.length >= 2 ||
    parsed.warnings.length >= 2 ||
    (parsed.confidenceScore < 40)
  ) {
    return 'unclear';
  }

  if (
    parsed.missingFields.length === 1 ||
    parsed.warnings.length === 1 ||
    parsed.confidenceScore < 70
  ) {
    return 'somewhat_clear';
  }

  return 'clear';
}

// ── Suggested questions engine ──

export function generateSuggestedQuestions(parsed: ParsedTattooInquiry): SuggestedQuestion[] {
  const questions: SuggestedQuestion[] = [];
  const added = new Set<string>();

  const placementVague = parsed.placement && parsed.warnings.some(w => /placement.*vague/i.test(w));
  const styleVague = parsed.style && parsed.warnings.some(w => /style.*unclear/i.test(w));

  if (parsed.missingFields.includes('placement')) {
    questions.push({
      field: 'placement',
      question: 'Which part of the body are you thinking of?',
      priority: 'high',
    });
    added.add('placement');
  } else if (placementVague) {
    questions.push({
      field: 'placement',
      question: `Which exact area of the ${parsed.placement} did you have in mind?`,
      priority: 'high',
    });
    added.add('placement_exact');
  }

  if (parsed.missingFields.includes('style')) {
    questions.push({
      field: 'style',
      question: 'Do you have any style in mind? (fine line, traditional, realism, etc.)',
      priority: 'high',
    });
    added.add('style');
  } else if (styleVague) {
    questions.push({
      field: 'style',
      question: 'Do you have any references or tattoos with a style you like?',
      priority: 'high',
    });
    added.add('style_refs');
  }

  if (parsed.missingFields.includes('size')) {
    questions.push({
      field: 'size',
      question: 'What approximate size are you thinking? (small, medium, large)',
      priority: 'medium',
    });
    added.add('size');
  }

  if (parsed.missingFields.includes('budget')) {
    questions.push({
      field: 'budget',
      question: 'Do you have a budget range in mind for this piece?',
      priority: 'high',
    });
    added.add('budget');
  }

  if (!parsed.referenceMentioned && !added.has('style_refs')) {
    questions.push({
      field: 'references',
      question: 'Do you have any reference images or inspo to help with the design?',
      priority: 'medium',
    });
    added.add('references');
  }

  if (!parsed.colorPreference && parsed.style) {
    questions.push({
      field: 'color',
      question: 'Black & grey or color?',
      priority: 'low',
    });
    added.add('color');
  }

  if (parsed.style && parsed.budget) {
    const budgetNum = parseInt(parsed.budget.replace(/[^0-9]/g, ''), 10);
    const expensiveStyles = ['realism', 'ornamental', 'japanese', 'full sleeve', 'large'];
    const isExpensive = parsed.style && expensiveStyles.some(s => parsed.style?.includes(s));
    if (isExpensive && budgetNum < 300) {
      questions.push({
        field: 'budget',
        question: 'For that style pricing usually depends on detail level — do you have flexibility on the design size?',
        priority: 'medium',
      });
      added.add('budget_expectations');
    }
  }

  if (parsed.preferredDates && parsed.preferredDates.length > 0) {
    questions.push({
      field: 'availability',
      question: 'I can check my books — do you have a preferred date or is it flexible?',
      priority: 'low',
    });
    added.add('availability');
  }

  return questions.slice(0, 4);
}

// ── Smart reply suggestions ──

function generateSmartReplies(parsed: ParsedTattooInquiry): string[] {
  const replies: string[] = [];

  if (!parsed.style) {
    replies.push('Do you have any tattoos or references with a style you like? Even a rough idea helps.');
  } else if (parsed.style && parsed.warnings.some(w => /style.*unclear/i.test(w))) {
    replies.push('Could you describe the vibe you want? Fine line, traditional, realism — happy to work with any direction.');
  }

  if (!parsed.placement) {
    replies.push('Which area were you thinking? Placement affects sizing and flow a lot.');
  } else if (parsed.warnings.some(w => /placement.*vague/i.test(w))) {
    replies.push(`Which exact part of the ${parsed.placement}? Helps me sketch the right composition.`);
  }

  if (replies.length < 2 && !parsed.budget) {
    replies.push('Do you have a rough budget? I can tailor the design to fit comfortably.');
  } else if (parsed.budget) {
    const budgetNum = parseInt(parsed.budget.replace(/[^0-9]/g, ''), 10);
    if (budgetNum < 50) {
      replies.push('Our studio minimum is $50 — for that range I can do a small simple design.');
    } else if (budgetNum < 150 && parsed.style === 'realism') {
      replies.push('For realism pricing depends on detail and session time — we can adjust the size to fit your budget.');
    }
  }

  if (!parsed.referenceMentioned) {
    replies.push('Feel free to send any reference pics if you have them — makes sure I nail what you want.');
  }

  // Default fallback
  if (replies.length === 0) {
    replies.push('Thanks for the details! Let me sketch up a concept and get back to you.');
  }

  return replies.slice(0, 3);
}

// ── Lead draft generator ──

export function createLeadDraftFromConversation(
  conversation: string,
  options?: {
    name?: string;
    source?: LeadDraft['source'];
  },
): LeadDraft {
  const parsed = parseTattooInquiry(conversation);
  const scopeClarity = detectScopeClarity(parsed);
  const suggestedQuestions = generateSuggestedQuestions(parsed);
  const replies = generateSmartReplies(parsed);

  // Build note from extracted info
  const noteParts: string[] = [];
  if (parsed.tattooDescription) noteParts.push(`Description: ${parsed.tattooDescription}`);
  if (parsed.colorPreference) noteParts.push(`Color: ${parsed.colorPreference}`);
  if (parsed.preferredDates && parsed.preferredDates.length > 0) {
    noteParts.push(`Timeline: ${parsed.preferredDates.join(', ')}`);
  }
  if (parsed.urgency === 'high') noteParts.push('Urgency: high');
  if (parsed.referenceMentioned) noteParts.push('Client mentioned references');
  if (parsed.warnings.length > 0) noteParts.push(`Warnings: ${parsed.warnings.join('; ')}`);
  noteParts.push(`Raw: ${parsed.rawSummary}`);
  const note = noteParts.join('\n');

  // Tags
  const tags: string[] = [];
  if (parsed.placement) tags.push(parsed.placement);
  if (parsed.style) tags.push(parsed.style);
  if (parsed.size) tags.push(parsed.size);
  if (scopeClarity === 'unclear') tags.push('needs_clarification');
  if (parsed.urgency === 'high') tags.push('urgent');

  // Next best action
  let nextBestAction: string;
  if (scopeClarity === 'unclear') {
    nextBestAction = suggestedQuestions.length > 0
      ? suggestedQuestions[0].question
      : 'Clarify scope with client';
  } else if (scopeClarity === 'somewhat_clear') {
    nextBestAction = suggestedQuestions.length > 0
      ? suggestedQuestions[0].question
      : 'Ask remaining details';
  } else {
    nextBestAction = parsed.budget
      ? 'Ready for deposit discussion'
      : 'Confirm budget and proceed';
  }

  return {
    name: options?.name || '(from conversation)',
    placement: parsed.placement,
    style: parsed.style,
    size: parsed.size,
    budget: parsed.budget,
    note,
    tags,
    source: options?.source || 'instagram',
    confidence: parsed.confidenceScore,
    nextBestAction,
    suggestedQuickReplies: replies,
  };
}
