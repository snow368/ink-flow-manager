export interface CaptionOption {
  vibe: string;
  label: string;
  caption: string;
  tags: string;
}

interface CaptionCtx {
  clientName: string;
  type: string;
  bodyPart: string;
  time: string;
  artistName: string;
}

type TemplateFn = (ctx: CaptionCtx) => string;

// ─── Hashtag generation ────────────────────────────────────────────────

const TYPE_TAGS: Record<string, string[]> = {
  cover_up: ['#coverup', '#coveruptattoo'],
  traditional: ['#traditionaltattoo'],
  black_and_grey: ['#blackandgrey', '#bng'],
  realism: ['#realismtattoo'],
  portrait: ['#portraittattoo'],
  lettering: ['#letteringtattoo'],
  geometric: ['#geometrictattoo'],
  japanese: ['#japanesetattoo', '#irezumi'],
  tribal: ['#tribaltattoo'],
  watercolor: ['#watercolortattoo'],
  neo_traditional: ['#neotraditional'],
  fine_line: ['#finelinetattoo', '#fineline'],
  color: ['#colortattoo'],
  dotwork: ['#dotwork'],
  biomechanical: ['#biomechanical'],
  trash_polka: ['#trashpolka'],
};

const BODY_TAGS: Record<string, string[]> = {
  arm: ['#armtattoo'],
  sleeve: ['#sleevetattoo', '#armsleeve'],
  forearm: ['#forearmtattoo'],
  leg: ['#legtattoo'],
  thigh: ['#thightattoo'],
  calf: ['#calftattoo'],
  chest: ['#chesttattoo'],
  back: ['#backtattoo'],
  hand: ['#handtattoo'],
  finger: ['#fingertattoo'],
  neck: ['#necktattoo'],
  foot: ['#foottattoo'],
  rib: ['#ribtattoo'],
  shoulder: ['#shouldertattoo'],
  wrist: ['#wristtattoo'],
  ankle: ['#ankletattoo'],
  face: ['#facetattoo'],
  head: ['#headtattoo'],
  hip: ['#hiptattoo'],
};

const GENERAL_TAGS = [
  '#tattoo', '#ink', '#tattooart', '#tattooartist', '#inked',
  '#tattoolife', '#freshink', '#newink', '#tattoodesign',
  '#instatattoo', '#tattoosofinstagram', '#工作室', '#纹身', '#刺青',
];

function generateTags(ctx: CaptionCtx): string[] {
  const tags: string[] = ['#tattoo', '#ink'];

  // Type-based tags
  const typeKey = ctx.type.toLowerCase().replace(/[\s-]+/g, '_');
  const typeTags = TYPE_TAGS[typeKey];
  if (typeTags) tags.push(...typeTags);

  // Body part tags
  const bodyKey = ctx.bodyPart.toLowerCase().replace(/[\s-]+/g, '_');
  const bodyTags = BODY_TAGS[bodyKey];
  if (bodyTags) tags.push(...bodyTags);

  // Pick 1-2 random general tags
  const shuffled = [...GENERAL_TAGS].sort(() => Math.random() - 0.5);
  const extras = shuffled.filter(t => !tags.includes(t));
  tags.push(extras[0]);
  if (extras.length > 1 && Math.random() > 0.4) tags.push(extras[1]);

  // Deduplicate
  return [...new Set(tags)];
}

// ─── Caption templates (body only, no hashtags) ────────────────────────

interface VibeGroup {
  vibe: string;
  label: string;
  templates: TemplateFn[];
  weight: number;
}

const VIBES: VibeGroup[] = [
  {
    vibe: 'hype', label: '🔥 Hype',
    weight: 2,
    templates: [
      (c) => `Fresh ink alert! 🔥 Just finished this ${c.type} on ${c.bodyPart} for ${c.clientName}. ${c.time} of work and it came out insane!`,
      (c) => `New tattoo drop! 🚀 ${c.type} on ${c.bodyPart} for ${c.clientName}. ${c.time} session. So stoked with this one!`,
      (c) => `Another one in the books! ✅ ${c.clientName} crushed this ${c.time} ${c.type} session on ${c.bodyPart}.`,
      (c) => `Swipe to see the fresh result! 👉 ${c.type} on ${c.bodyPart} for ${c.clientName}. ${c.time}. Pure fire! 🔥`,
    ],
  },
  {
    vibe: 'professional', label: '📌 Professional',
    weight: 2,
    templates: [
      (c) => `New ${c.type} on ${c.bodyPart} for ${c.clientName}. Session completed in ${c.time}.`,
      (c) => `Completed: ${c.type} on ${c.bodyPart} — ${c.clientName}. Duration: ${c.time}.`,
      (c) => `${c.type} procedure on ${c.bodyPart} for ${c.clientName}. Total session time: ${c.time}.`,
      (c) => `Client: ${c.clientName} | Service: ${c.type} | Area: ${c.bodyPart} | Time: ${c.time}`,
    ],
  },
  {
    vibe: 'artistic', label: '🎨 Artistic',
    weight: 2,
    templates: [
      (c) => `Bringing ${c.clientName}'s vision to life — ${c.type} on ${c.bodyPart}. ${c.time} session. Detail shots in stories! ➡️`,
      (c) => `${c.type} on ${c.bodyPart} for ${c.clientName}. Every line tells a story. ${c.time} well spent. ✨`,
      (c) => `The human canvas strikes again. ${c.type} on ${c.bodyPart} for ${c.clientName}. ${c.time} of precision work.`,
      (c) => `Swipe for close-up detail ➡️ ${c.type} on ${c.bodyPart} by ${c.artistName}. Client: ${c.clientName}. ${c.time}.`,
    ],
  },
  {
    vibe: 'minimal', label: '✨ Short & Clean',
    weight: 1,
    templates: [
      (c) => `${c.type} ✅ ${c.bodyPart} · ${c.time} · ${c.clientName}`,
      (c) => `Done. ${c.type} on ${c.bodyPart}. ${c.time}.`,
      (c) => `${c.clientName} · ${c.type} · ${c.bodyPart} · ${c.time}.`,
      (c) => `Fresh ${c.type} on ${c.bodyPart}. ${c.time} with ${c.clientName}.`,
    ],
  },
  {
    vibe: 'story', label: '📖 Storytelling',
    weight: 1,
    templates: [
      (c) => `${c.clientName} came in for a ${c.type} on ${c.bodyPart}. ${c.time} later, here's the result. Love how this turned out!`,
      (c) => `${c.time} in the chair. One ${c.type} on ${c.bodyPart}. ${c.clientName} couldn't be happier. Days like this remind me why I love this craft. 🙌`,
      (c) => `From idea to ink. ${c.clientName} wanted a ${c.type} on ${c.bodyPart} — ${c.time} later, done and dusted.`,
    ],
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(groups: VibeGroup[]): VibeGroup[] {
  const pool = groups.flatMap(g => Array(g.weight).fill(g));
  const picked = new Set<VibeGroup>();
  const result: VibeGroup[] = [];

  for (let i = 0; i < 3 && i < groups.length; i++) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const choice = shuffled.find(g => !picked.has(g));
    if (choice) {
      picked.add(choice);
      result.push(choice);
    }
  }

  for (const g of groups) {
    if (result.length >= 3) break;
    if (!picked.has(g)) result.push(g);
  }

  return result;
}

export function generateCaptionOptions(ctx: CaptionCtx): CaptionOption[] {
  const picked = weightedPick(VIBES);
  const tags = generateTags(ctx);
  const tagString = tags.join(' ');

  return picked.map(group => ({
    vibe: group.vibe,
    label: group.label,
    caption: pickRandom(group.templates)(ctx),
    tags: tagString,
  }));
}
