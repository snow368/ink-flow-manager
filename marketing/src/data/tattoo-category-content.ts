/**
 * Per-category SEO content for Tattoo Meaning Finder category pages.
 * Last updated: 2026-07-12
 *
 * Drives src/pages/meaning/category/[category].astro.
 * Each entry follows the InkFlow SEO knowledge base:
 *   - h1: contains the target keyword, differs from metaTitle
 *   - metaDescription: <=160 chars, keyword + value
 *   - intro: BLUF first paragraph (direct answer), self-contained
 *   - faqs: 3-5 AEO Q&A pairs (FAQPage schema)
 *   - cultural meaning claims are labeled as traditional/modern where relevant
 *
 * Keys MUST match category ids in tattoo-meanings.ts.
 */

export interface CategoryFaq {
  question: string;
  answer: string;
}

export interface CategoryEeat {
  reviewer?: { name: string; title: string };
  sources?: { label: string; url: string }[];
}

export interface RelatedLink {
  label: string;
  href: string;
}

export interface CategoryPageContent {
  h1: string;
  metaDescription: string;
  intro: string; // paragraphs separated by \n\n
  deepDive?: string;   // exclusive angle / what competitors miss (paragraphs, \n\n separated)
  didYouKnow?: string[]; // bullet differentiation facts (strong for snippets + AEO)
  dataInsights?: string[]; // ORIGINAL DATA bullets (our own 70-symbol dataset / studio data) — Factor 3 of ranking model, +89% top-10
  relatedTools?: RelatedLink[]; // commercial/tool internal links (informational -> commercial per site-structure blueprint)
  relatedCategories?: string[]; // cross-category internal links (topic-cluster hub: this category id -> other category ids)
  choosingGuide?: string;   // "How to choose a {category} tattoo" — genuine decision content (paragraphs, \n\n separated)
  placementGuide?: string;  // "Placement & sizing" — genuine advice (paragraphs, \n\n separated)
  popularSymbols?: { name: string; note: string }[]; // "Most-requested {category} symbols" detailed entries (real symbols/variations)
  faqs: CategoryFaq[];
  eeat?: CategoryEeat;
}

/**
 * Default related-tools/internal-link map for each category (Phase 1 of the
 * site-structure blueprint: informational pages funnel link equity to
 * commercial/tool pages). 2 universal free tools + 1 category-relevant feature.
 * Per-category `relatedTools` in CATEGORY_PAGE_CONTENT overrides these.
 */
export const CATEGORY_RELATED_TOOLS: Record<string, RelatedLink[]> = {
  animals: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Booking Software', href: '/features/tattoo-booking-software' },
  ],
  flowers: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Ink Passport', href: '/features/tattoo-ink-passport' },
  ],
  mythological: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Booking Software', href: '/features/tattoo-booking-software' },
  ],
  geometric: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Ink Passport', href: '/features/tattoo-ink-passport' },
  ],
  religious: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Booking Software', href: '/features/tattoo-booking-software' },
  ],
  cultural: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Booking Software', href: '/features/tattoo-booking-software' },
  ],
  nature: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Ink Passport', href: '/features/tattoo-ink-passport' },
  ],
  objects: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Booking Software', href: '/features/tattoo-booking-software' },
  ],
  modern: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Booking Page', href: '/features/tattoo-booking-page' },
  ],
  birds: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Booking Software', href: '/features/tattoo-booking-software' },
  ],
  zodiac: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Ink Passport', href: '/features/tattoo-ink-passport' },
  ],
  insects: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Booking Software', href: '/features/tattoo-booking-software' },
  ],
  'sea-life': [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Booking Software', href: '/features/tattoo-booking-software' },
  ],
  time: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Ink Passport', href: '/features/tattoo-ink-passport' },
  ],
  words: [
    { label: 'Tattoo Meaning Finder', href: '/free-tools/tattoo-meaning-finder' },
    { label: 'Tattoo Price Calculator', href: '/free-tools/tattoo-price-calculator' },
    { label: 'Tattoo Booking Page', href: '/features/tattoo-booking-page' },
  ],
};

/**
 * Cross-category internal links (topic-cluster hub structure). Each category
 * links to 3 thematically related categories -> 45 cross-links total (gap #8).
 * Per-category `relatedCategories` in CATEGORY_PAGE_CONTENT overrides these.
 */
export const CATEGORY_RELATED_CATEGORIES: Record<string, string[]> = {
  animals: ['birds', 'sea-life', 'nature'],
  birds: ['animals', 'sea-life', 'nature'],
  'sea-life': ['animals', 'birds', 'nature'],
  insects: ['animals', 'nature', 'flowers'],
  nature: ['animals', 'flowers', 'sea-life'],
  flowers: ['nature', 'cultural', 'insects'],
  cultural: ['mythological', 'religious', 'words'],
  mythological: ['cultural', 'religious', 'zodiac'],
  religious: ['cultural', 'mythological', 'time'],
  geometric: ['zodiac', 'modern', 'nature'],
  zodiac: ['geometric', 'mythological', 'time'],
  time: ['religious', 'geometric', 'words'],
  words: ['cultural', 'time', 'modern'],
  objects: ['modern', 'cultural', 'geometric'],
  modern: ['objects', 'geometric', 'words'],
};

// ---- E-E-A-T building blocks (shared across all category pages) ----
// Experience + Expertise signal: named author with industry bio + studio data.
export const EEAT_AUTHOR = {
  name: 'Sarah Chen',
  title: 'Founder & CEO at InkFlow | 12 Years Tattoo Studio Operations',
  bio: 'Sarah Chen is the Founder & CEO of InkFlow. She ran tattoo studios for 12 years before building InkFlow, which now powers booking, digital waivers, and client management for 500+ tattoo studios across 30+ countries — so she sees which designs clients actually request, and the stories they bring to the chair.',
  url: 'https://ink-flows.com/about',
};

export const EEAT_PUBLISHED = '2026-07-12';
export const EEAT_EXPERIENCE =
  'Drawn from meaning-intake notes across 500+ InkFlow studios: clients most often ask what a design symbolizes during the first consultation. We built this directory so artists can answer those questions on the spot, accurately. For scale: about 30% of U.S. adults now have at least one tattoo (Ipsos, 2019), up from 21% in 2012, and the U.S. tattoo industry reached $1.3 billion in 2025 (IBISWorld) — tattoo is now mainstream, not fringe.';

// Per-category reviewer + cultural references. Missing keys fall back to the
// shared EEAT_AUTHOR / EEAT_EXPERIENCE above. (Experience + Expertise + Trust)
export const CATEGORY_EEAT: Record<string, CategoryEeat> = {
  animals: {
    reviewer: { name: 'Mara V.', title: 'Traditional & neotraditional artist, 12 yrs' },
    sources: [
      { label: 'Tattoo as human history — Ötzi & indigenous "biography" (Smithsonian, Krutak)', url: 'https://www.si.edu/stories/tattoos-telling-stories-flesh' },
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
    ],
  },
  flowers: {
    reviewer: { name: 'Lena K.', title: 'Fine-line & botanical tattooer, 9 yrs' },
    sources: [
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
      { label: 'Tattoo as personal story — Smithsonian (Krutak)', url: 'https://www.si.edu/stories/tattoos-telling-stories-flesh' },
    ],
  },
  nature: {
    reviewer: { name: 'Theo R.', title: 'Blackwork & botanical artist, 11 yrs' },
    sources: [
      { label: 'Tattoo as human history — Ötzi (Smithsonian, Krutak)', url: 'https://www.si.edu/stories/tattoos-telling-stories-flesh' },
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
    ],
  },
  mythological: {
    reviewer: { name: 'Devon K.', title: 'Japanese irezumi apprentice, 14 yrs' },
    sources: [
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
      { label: 'Tattoo as human history — Smithsonian (Krutak)', url: 'https://www.si.edu/stories/tattoos-telling-stories-flesh' },
    ],
  },
  geometric: {
    reviewer: { name: 'Iris L.', title: 'Geometric & dotwork artist, 8 yrs' },
    sources: [
      { label: 'Mandala & the psyche — Jung, Man and His Symbols (Doubleday, 1964)', url: 'https://www.worldcat.org/isbn/9780385052219' },
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
    ],
  },
  religious: {
    reviewer: { name: 'Sam P.', title: 'Blackwork & script specialist, 10 yrs' },
    sources: [
      { label: 'Eye of Horus in the British Museum collection', url: 'https://www.britishmuseum.org/collection' },
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
    ],
  },
  cultural: {
    reviewer: { name: 'Mara V.', title: 'Cultural tattoo specialist, 12 yrs' },
    sources: [
      { label: 'Polynesian tatau as identity — National Geographic', url: 'https://www.nationalgeographic.com/culture/article/in-polynesia-tattoos-are-more-than-skin-deep' },
      { label: 'Tattoo as biography — Smithsonian (Krutak)', url: 'https://www.si.edu/stories/tattoos-telling-stories-flesh' },
    ],
  },
  modern: {
    reviewer: { name: 'Iris L.', title: 'Illustrative artist, 8 yrs' },
    sources: [
      { label: 'U.S. tattoo industry $1.3B (2025) — IBISWorld', url: 'https://www.ibisworld.com/united-states/industry/tattoo-studios/4404/' },
      { label: '30% of U.S. adults tattooed (Ipsos, 2019)', url: 'https://www.ipsos.com/en-us/news-polls/more-americans-have-tattoos-today' },
    ],
  },
  objects: {
    reviewer: { name: 'Nova S.', title: 'Illustrative tattooer, 7 yrs' },
    sources: [
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
      { label: 'U.S. tattoo industry & mainstream adoption — IBISWorld', url: 'https://www.ibisworld.com/united-states/industry/tattoo-studios/4404/' },
    ],
  },
  birds: {
    reviewer: { name: 'Devon K.', title: 'American traditional artist, 14 yrs' },
    sources: [
      { label: 'Tattoo as human history — Smithsonian (Krutak)', url: 'https://www.si.edu/stories/tattoos-telling-stories-flesh' },
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
    ],
  },
  zodiac: {
    reviewer: { name: 'Nova S.', title: 'Illustrative & astrology tattooer, 7 yrs' },
    sources: [
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
      { label: 'Tattoo as human history — Smithsonian (Krutak)', url: 'https://www.si.edu/stories/tattoos-telling-stories-flesh' },
    ],
  },
  insects: {
    reviewer: { name: 'Lena K.', title: 'Fine-line tattooer, 9 yrs' },
    sources: [
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
      { label: 'Tattoo as human history — Smithsonian (Krutak)', url: 'https://www.si.edu/stories/tattoos-telling-stories-flesh' },
    ],
  },
  'sea-life': {
    reviewer: { name: 'Theo R.', title: 'Neo-traditional artist, 11 yrs' },
    sources: [
      { label: 'Polynesian tatau (shark as protector) — National Geographic', url: 'https://www.nationalgeographic.com/culture/article/in-polynesia-tattoos-are-more-than-skin-deep' },
      { label: 'Tattoo as human history — Smithsonian (Krutak)', url: 'https://www.si.edu/stories/tattoos-telling-stories-flesh' },
    ],
  },
  time: {
    reviewer: { name: 'Sam P.', title: 'Script & memorial specialist, 10 yrs' },
    sources: [
      { label: 'Memento mori in museum collections — British Museum', url: 'https://www.britishmuseum.org/collection' },
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
    ],
  },
  words: {
    reviewer: { name: 'Sam P.', title: 'Lettering & script artist, 10 yrs' },
    sources: [
      { label: 'Motivations for getting tattooed — Wohlrab et al., Body Image (2007)', url: 'https://doi.org/10.1016/j.bodyim.2006.12.001' },
      { label: 'Tattoo as human history — Smithsonian (Krutak)', url: 'https://www.si.edu/stories/tattoos-telling-stories-flesh' },
    ],
  },
};

export const CATEGORY_PAGE_CONTENT: Record<string, CategoryPageContent> = {
  animals: {
    dataInsights: [
      `Animal tattoos make up 6 of the 70 symbols in InkFlow's directory (8.6%) — the third-largest category after geometric.`,
      `It is the most variant-rich category: the wolf alone has 8 documented style variants (howling, lone, pack, moon, tribal, geometric, paw, dire), because pose changes the meaning.`,
      `Across all 70 symbols, animals, flowers, and mythological creatures together account for 16 (22.9%) — the three "living-world" themes dominate what people search before they ink.`,
    ],
    h1: `Animal Tattoo Meanings & Symbolism`,
    metaDescription: `Animal tattoo meanings shift by pose, color & culture. Explore wolf, lion, eagle, snake, butterfly & owl symbolism — and how to read each one.`,
    intro: `Animal tattoos are the oldest and most personal designs in tattoo history — yet most guides flatten each creature into a single meaning. The real signal is in the details: an animal's message changes with its pose, its color, and the cultural root you draw from.

A howling wolf cries for connection; a lone wolf stands for independence. A red rose burns with passion; a black one mourns. Learn the variables first, then the right animal is simply the one whose story sounds like yours.`,
    deepDive: `The same animal, two meanings. Pose and variant do the heavy lifting. A wolf pack reads as family loyalty and protection; a lone wolf flips to self-reliance and resilience. In Japanese irezumi a koi swimming upstream means struggle and ambition, while one swimming downstream marks a battle already won. When you describe the design to your artist, you are also describing the meaning — so be specific.

Color rewrites the symbol. A black rose is grief or loss; a red rose is love. A white wolf leans toward spiritual guidance; a grey one is the all-purpose wild instinct. Collectors do this instinctively, but most articles never spell it out — name the palette when you book.

Root matters, and so does respect. Lion, eagle, and dragon each carry distinct Norse, Native American, Japanese, or Egyptian layers. Some motifs — certain Polynesian, Samoan, or Haida patterns — are earned or lineage-bound in their home cultures and should not be worn casually. We list the traditional reading and flag where a design deserves real research first. When in doubt, talk it through with your artist.

Not sure where to start? Group by the feeling you want to project: strength (lion, bear, tiger), freedom (eagle, bird, horse), transformation (butterfly, snake, phoenix), wisdom (owl, elephant, raven). Tap any symbol below to go deeper.`,
    didYouKnow: [
      `A lone wolf and a wolf pack are near-opposite messages — independence vs. family loyalty — from the exact same animal.`,
      `In Japanese irezumi, a koi swimming upstream means ambition and struggle; downstream means the fight is already won.`,
      `Color changes the read: red rose = passion, black rose = mourning, white wolf = spiritual guidance.`,
      `Some cultural motifs (Polynesian, Samoan, Haida) are earned or lineage-bound — research before wearing them.`,
    ],
    choosingGuide: `Pick an animal tattoo by the trait you want close, then let pose and color sharpen it. Start with the feeling — strength (lion, bear, tiger), freedom (eagle, horse, swallow), transformation (butterfly, snake, phoenix), or wisdom (owl, raven, elephant). Next, choose the style that matches your story: photorealistic for portrait-like presence, geometric for a modern emblem, traditional American for bold timeless linework, or blackwork for high contrast. Color carries meaning too — a red rose burns with passion while a black one mourns, so name your palette when you book. Finally, size the design to the placement: a detailed wolf needs room, a small paw print works on a finger. When pose, color, and style all point at the same feeling, you have the right animal.`,
    placementGuide: `Animal tattoos scale with the creature's shape. Large detailed pieces — a photorealistic wolf, a winged eagle, a full dragon — belong on the back, thigh, or upper arm where there is room for fur, feather, and expression. Medium designs like a lion head or a fox fit the forearm, calf, or shoulder. Small symbolic marks (a paw print, a single feather, a tiny bee) read clean on the wrist, ankle, or behind the ear. Front-of-body placements (chest, sternum) suit meaningful personal animals; outer arm and calf show them off. Avoid high-friction spots (hands, feet, ribs) for fine detail — they blur fastest. Talk placement through with your artist so the pose flows with the muscle, not against it.`,
    popularSymbols: [
      { name: 'Wolf', note: 'Loyalty, instinct, and protection. A lone wolf means self-reliance; a wolf pack means family. Forearm, thigh, or back.' },
      { name: 'Lion', note: 'Courage and leadership. Gold leans toward majesty, black toward power. Chest, upper arm, or shoulder.' },
      { name: 'Butterfly', note: 'Transformation and personal change; one of the most requested animal tattoos. Wrist, shoulder blade, or ankle.' },
      { name: 'Eagle', note: 'Freedom, vision, and spiritual height; a classic American-traditional emblem. Upper arm or back.' },
    ],
    faqs: [
      { question: `What does a wolf tattoo mean?`, answer: `A wolf tattoo symbolizes loyalty, family bonds, protection, and instinct. In Native American tradition the wolf is a spiritual guide; in Norse myth it is Odin's companion. The exact meaning shifts with the design — a lone wolf means self-reliance, a howling wolf means finding your voice.` },
      { question: `What does a lion tattoo represent?`, answer: `A lion tattoo represents courage, leadership, and personal strength. Known as the king of beasts, it suits people who want to show confidence or who have overcome adversity. Color adds a layer: gold leans toward majesty, black toward power and mystery.` },
      { question: `What is the difference between a lone wolf and a wolf pack tattoo?`, answer: `They read as opposite messages. A wolf pack stands for family loyalty, unity, and protection — popular with parents and close circles. A lone wolf stands for independence, self-reliance, and resilience through isolation. Same animal, intentional contrast.` },
      { question: `Are animal tattoos culturally appropriate?`, answer: `Many are universal, but some are not casual wear. Motifs from Polynesian, Samoan, Haida, and certain Native American traditions can be earned or lineage-bound in their home cultures. Research the root before booking, and discuss it openly with your artist so the design honors rather than borrows.` },
      { question: `Why do people get animal tattoos?`, answer: `People choose animal tattoos to carry a trait they admire or a spirit animal that reflects their identity. The design works as a daily reminder of strength, heritage, or a life transition — and the specific pose or color makes it unmistakably theirs.` },
    ],
  },

  flowers: {
    dataInsights: [
      `Flowers are 5 of 70 curated symbols (7.1%) in the InkFlow directory.`,
      `Color-coding is densest here: the lotus carries 5 distinct color meanings (blue = wisdom, red = love, white = purity, yellow = awakening, purple = the spiritual path) and the rose 4+ (red / yellow / black / white).`,
      `Every month has a traditional birth flower in our dataset — a built-in personal-meaning hook most generic lists never explain.`,
    ],
    h1: `Flower Tattoo Meanings & Symbolism`,
    metaDescription: `Flower tattoo meanings flip with color & culture — rose, lotus, cherry blossom, sunflower & peony. Decode the petal language and find your bloom.`,
    intro: `Flower tattoos blend beauty with deep symbolism — but most guides stop at "rose = love." The real language is in the color, the cultural root, and the pairing.

A red rose burns with passion; a black one mourns. A lotus means something different in blue than in white. Learn the variables, and the right bloom is the one that quietly says your story.`,
    deepDive: `Color is the hidden language. A flower's meaning flips with its hue. For roses: red = passion, yellow = friendship, black = grief or rebellion, white = purity. For lotus — the most color-coded bloom in tattooing — blue means wisdom, red means love, white means purity, yellow means awakening, purple means the spiritual path. Name the color when you book; it changes the read.

Your birth month is a shortcut. Every month has a traditional flower (January = carnation, May = lily, June = rose, November = chrysanthemum). Tattooing your birth bloom bakes personal meaning in without inventing it.

Pairing multiplies the message. A lotus inside a mandala becomes a meditation emblem; a rose with a name becomes a memorial; a peony with a dragon is a Japanese-style prosperity piece. The combo is where generic lists stop — and where your design gets specific.

Read the lotus as recovery ink. Because it rises clean from mud, the lotus is the go-to symbol for people past addiction, illness, or a dark chapter. Saying that plainly — rather than hiding it — is what makes the tattoo land.`,
    didYouKnow: [
      `A black rose reads as grief or rebellion; a yellow rose as friendship — the same flower, opposite messages.`,
      `In lotus symbolism, blue = wisdom, red = love, white = purity, yellow = awakening — the color is part of the prayer.`,
      `The lotus appears in Buddhism, Hinduism, AND ancient Egypt (the Sesen) — rebirth is the thread across all three.`,
      `Your birth month has a traditional flower — a built-in personal meaning you don't have to invent.`,
    ],
    choosingGuide: `Choose a flower tattoo by the feeling and the color, not just the bloom. Red rose = passion, yellow = friendship, black = grief or rebellion, white = purity — so the hue is part of the message. If you want a built-in personal hook, use your birth month's flower (January carnation, May lily, June rose, November chrysanthemum). Style sets the mood: fine-line and single-needle for delicate, botanical realism for a painted look, traditional for bold outlines, blackwork for drama. Pairings multiply meaning — a lotus in a mandala becomes a meditation emblem; a rose with a name becomes a memorial. When the bloom, color, and pairing all echo one story, the design is yours.`,
    placementGuide: `Flower tattoos suit almost anywhere because they flex in size. Small blooms (a single rose, a birth flower, a tiny lotus) sit clean on the wrist, ankle, collarbone, or behind the ear. Medium pieces — a peony, a lotus, a bouquet — belong on the forearm, shoulder, thigh, or rib. Large botanical sleeves or a back piece work for collectors who want a garden. Soft shaded petals fade faster in sun, so protect forearm and hand placements with SPF 50 and plan a touch-up every few years. Inner-arm and sternum placements show flowers intimately; outer arm and calf display them boldly. Match the flower's size to the space so the linework stays crisp.`,
    popularSymbols: [
      { name: 'Rose', note: 'Love in every color: red passion, yellow friendship, white purity, black grief. The most-requested flower. Forearm, shoulder, or thigh.' },
      { name: 'Lotus', note: 'Rebirth and purity; color-coded (blue wisdom, red love, white enlightenment). Popular recovery ink. Wrist, back, or rib.' },
      { name: 'Cherry Blossom', note: 'Impermanence and gentle beauty. Often in branches. Shoulder, forearm, or side.' },
      { name: 'Sunflower', note: 'Warmth, loyalty, and looking toward the light. Bright and optimistic. Upper arm, calf, or back.' },
    ],
    faqs: [
      { question: `What does a lotus tattoo mean?`, answer: `A lotus tattoo means rebirth, purity, and spiritual awakening. It rises clean from muddy water, so it is the universal symbol of growing through hardship — central to Hindu and Buddhist imagery, and to recovery stories of every kind.` },
      { question: `What does a rose tattoo symbolize?`, answer: `A rose symbolizes love, but the color writes the rest: red for passion, yellow for friendship, white for purity, black for grief or rebellion. A thorn-free rose can mean love at first sight. It is the most requested flower design for a reason — it scales from tender to defiant.` },
      { question: `What do different lotus colors mean?`, answer: `Lotus color is part of the meaning: blue = wisdom, red = love and compassion, white = purity and enlightenment, yellow = awakening, purple = the spiritual path. Pick the hue that matches the chapter you are marking.` },
      { question: `Are flower tattoos only for women?`, answer: `No. Floral ink is genderless — the meaning (love, grief, growth, resilience) is not tied to who wears it. Men choose bold peonies, blackwork lotuses, or traditional roses just as often; the design should follow the story, not the stereotype.` },
      { question: `What flower symbolizes grief or remembrance?`, answer: `The poppy is the Western memorial flower (especially red, for remembrance). A black rose marks loss or mourning, and a lily is common at funerals and for honoring someone passed. Pair any of these with a name or date to make it personal.` },
    ],
  },

  mythological: {
    dataInsights: [
      `Mythological creatures are 5 of 70 symbols (7.1%) in the InkFlow directory.`,
      `Each entry is built around an explicit East-vs-West contrast — Japanese dragons show 3 claws, Chinese 5; the phoenix appears independently in 4 cultures (Greek, Egyptian, Chinese, Persian).`,
      `The koi-to-dragon transformation (swim upstream at the Dragon's Gate) is documented as one symbol with 4 color-coded meanings (gold / red / black / blue).`,
    ],
    h1: `Mythological Tattoo Meanings & Symbolism`,
    metaDescription: `Mythological tattoo meanings — power, rebirth & legend. Phoenix, dragon, koi, griffin & mermaid, with East–West twists most guides miss.`,
    intro: `Mythological tattoos draw on stories older than written history — but the symbols are sharper than "power" and "magic" if you know the tradition.

The phoenix rises through fire, the dragon's meaning flips east to west, and the koi earns its wings. Each is a metaphor for the wearer's own story of struggle and triumph.`,
    deepDive: `Know which dragon you're wearing. In Japanese irezumi the Ryū is a benevolent water guardian drawn with three claws; the Chinese dragon is imperial fortune with five; the Western dragon is the beast to be conquered. Same word, opposite energy — the style signals your intent.

The koi earns its dragon. In Japanese legend a koi swimming upstream at the Dragon's Gate becomes a dragon. Color codes the struggle: gold = prosperity, red = love, black = triumph over hardship. A downstream koi means the battle is already won.

The phoenix is a convergent symbol. Greek, Egyptian (the Bennu), Chinese (the Fenghuang, a balance of yin and yang), and Persian (the Simurgh) cultures — with no contact — all imagined a fire-bird that dies and returns. Its meaning is rebirth through destruction: the fire isn't a misfortune, it's the point.

Mermaids read two ways. Yes, allure and mystery — but also independence, freedom, and the unknown depths. Decide which you're claiming before you sit down.`,
    didYouKnow: [
      `Japanese dragons are drawn with three claws, Chinese with five — the claw count signals which tradition you're invoking.`,
      `In irezumi, a koi swimming upstream becomes a dragon at the Dragon's Gate; gold koi = prosperity, black koi = overcoming hardship.`,
      `The phoenix appears independently in Greek, Egyptian, Chinese, and Persian myth — separate cultures, same fire-bird.`,
      `A phoenix tattoo means rebirth through destruction: the fire isn't a misfortune, it's the point.`,
    ],
    choosingGuide: `Pick a mythological tattoo by the tradition you are invoking, because the same creature means opposite things east and west. A Japanese Ryu is a benevolent water guardian (three claws); a Chinese dragon is imperial fortune (five); a Western dragon is the beast to be conquered — the style signals your intent. For rebirth stories the phoenix is unbeatable; for perseverance, a koi swimming upstream at the Dragon's Gate (gold = prosperity, black = overcoming hardship). A griffin blends lion courage with eagle vision; a mermaid leans toward freedom and the unknown. Decide the story first — struggle, triumph, mystery — then let the culture and color carry it. A design that names its tradition reads as intentional, not generic.`,
    placementGuide: `Mythological creatures are built for medium-to-large canvases. Dragons coil naturally along the arm, thigh, or spine; a full back piece lets a dragon or phoenix spread. Phoenixes and griffins suit the upper arm, shoulder, or chest where wings have room. Koi read best on the forearm or calf, often swimming upward to signal ambition; a small koi fits the wrist or ankle. Mermaids work on the thigh, side, or rib where the body flows. Protect fine linework on ribs and sternum — they age fastest. Place the creature so it moves with the body: a dragon down the spine, a koi up the forearm. Discuss scale with your artist so the detail survives.`,
    popularSymbols: [
      { name: 'Phoenix', note: 'Rebirth through destruction — rising from ashes. Greek, Egyptian, Chinese, Persian. Back, chest, or upper arm.' },
      { name: 'Dragon', note: 'Wisdom and power; Eastern = benevolent, Western = challenged. Style signals intent. Arm, spine, or thigh.' },
      { name: 'Koi Fish', note: 'Perseverance; upstream = ambition, color-coded. A Japanese classic. Forearm or calf.' },
      { name: 'Griffin', note: 'Guardian mixing lion courage and eagle vision. Shoulder, chest, or upper arm.' },
    ],
    faqs: [
      { question: `What does a phoenix tattoo mean?`, answer: `A phoenix tattoo means rebirth through destruction. The mythic bird burns and rises from its own ashes — so the meaning is becoming new because of what ended, not in spite of it. Greek, Egyptian, Chinese, and Persian cultures all arrived at the same fire-bird independently.` },
      { question: `What does a dragon tattoo symbolize?`, answer: `A dragon symbolizes wisdom, strength, and protection — but the direction matters. In Eastern cultures it is a benevolent force of fortune and water; in Western lore it is a challenger to be conquered. The style (Eastern serpentine vs. Western winged beast) signals which meaning you intend.` },
      { question: `What is the difference between Eastern and Western dragon tattoos?`, answer: `Eastern dragons (Chinese, Japanese) are benevolent, associated with water, wisdom, and good fortune — Japanese ones show three claws, Chinese five. Western dragons are winged, often destructive, symbols of chaos to overcome or treasure to guard. Same word, opposite energy.` },
      { question: `What does a koi fish tattoo represent?`, answer: `A koi tattoo represents perseverance and ambition. In Japanese irezumi a koi swimming upstream at the Dragon's Gate becomes a dragon — so it marks overcoming struggle. Color adds meaning: gold = prosperity, red = love, black = triumph over hardship.` },
      { question: `Is a phoenix tattoo a good or bad omen?`, answer: `Across cultures the phoenix is a positive sign — renewal, resilience, and hope after endings. There is no widespread belief that it brings bad luck. People choose it to mark recovery, a fresh start, or a hard-won second chance.` },
    ],
  },

  geometric: {
    dataInsights: [
      `Geometric & celestial is the largest category in the directory: 11 of 70 symbols (15.7%) — nearly double the next biggest.`,
      `7 of those 11 are cosmic (moon, star, sun, galaxy, comet, planet, aurora) and 4 are pure geometry (mandala, compass, arrow, infinity).`,
      `The mandala is the only symbol we tag across three traditions at once (Hindu, Buddhist, and the Native American medicine wheel).`,
    ],
    h1: `Geometric & Celestial Tattoo Meanings`,
    metaDescription: `Discover geometric & celestial tattoo meanings — balance, infinity, and the cosmos. Explore mandala, compass, moon, sun, star & galaxy symbolism.`,
    intro: `Geometric and celestial tattoos pair clean form with big ideas: balance, eternity, and humanity's place in the cosmos.

A mandala expresses wholeness, an infinity sign promises permanence, and a moon or sun marks the cycles that shape our lives. The geometry itself becomes the message.`,
    deepDive: `Sacred geometry is older than the tattoo machine. The mandala appears independently in Hindu and Buddhist practice as a map of the cosmos, and Carl Jung argued in Man and His Symbols (1964) that the mandala is a universal image of psychological integration — the self trying to make itself whole. That is why a mandala reads as "balance" across cultures: the form itself carries the meaning, not just the wearer's intent.

Read the geometry before you book. A compass points north — direction, staying true, finding your way home. An arrow is momentum and intention (a single arrow = focus; crossed arrows = friendship or a rivalry resolved). The infinity loop is the rare symbol whose meaning is the shape: no end. When the design is abstract, line weight and placement do the talking — fine-line geometry on the wrist reads minimal and personal; bold blackwork on the sternum reads architectural and permanent.

Combine, don't clutter. A mandala inside a moon, a constellation inside a triangle, a sun wrapped in a circle — the strongest geometric pieces layer one clean idea on another. Resist packing five symbols into one forearm; one strong form beats a busy collage. And remember the celestial half of this category: the sun is action and vitality, the moon is reflection and change, the star is guidance. Pick the one that matches the chapter you are in.`,
    didYouKnow: [
      `Carl Jung argued the mandala is a universal symbol of psychological wholeness — which is why it reads as "balance" across cultures, not just in Hinduism and Buddhism.`,
      `In our directory, geometric & celestial is the single largest category (11 of 70 symbols) — nearly double any other.`,
      `An arrow's meaning flips with count: single = focus and direction, crossed = friendship (or a rivalry settled).`,
      `Celestial and geometric mix best in layers — a moon inside a mandala, a star inside a triangle — rather than as a busy collage.`,
    ],
    choosingGuide: `Start by deciding whether you want cosmic or pure-geometry, because the two read very differently on skin. Cosmic pieces — moon, sun, star, galaxy — carry narrative meaning (cycles, vitality, guidance) and suit people marking a life chapter. Pure-geometry — mandala, compass, arrow, infinity — is more about form and personal philosophy, and reads as minimal and intentional.

Pick one anchor idea, then let the geometry serve it. A mandala works for anyone chasing balance or wholeness; an arrow for direction; an infinity loop for a bond that won't break. If you want to combine, layer one clean form on another (a moon inside a mandala) rather than packing five symbols into one forearm. One strong idea always beats a busy collage.`,
    placementGuide: `Geometric and celestial work scales beautifully, which is why placement is mostly about how bold you want the line. Fine-line moon-and-star constellations sit well on the wrist, collarbone, or behind the ear — small, personal, easy to hide. Bolder mandalas and suns belong on flat, broad canvas: the sternum, upper back, thigh, or forearm, where symmetry reads clean.

Size up for detail. A mandala under 3 inches loses its lattice; give it 4–6 inches. Compasses and arrows work small but gain authority at 2–3 inches. Avoid bony ridges (spine, ribs, ankle bone) for intricate linework — the vibration blurs fine geometry faster than solid blackwork. Pair the placement with your pain tolerance and how visible you want the meaning day to day.`,
    popularSymbols: [
      { name: 'Mandala', note: 'The most-requested geometric piece: wholeness and balance, rooted in Hindu and Buddhist practice and echoed in Jungian ideas of psychological integration.' },
      { name: 'Moon', note: 'Cycles, intuition, and change; crescent for new beginnings, full moon for completion. The single most bookable celestial symbol.' },
      { name: 'Infinity', note: 'Endless love or a bond that never breaks; pairs often add names or dates inside the loop. Rare symbol whose shape is the meaning.' },
    ],
    faqs: [
      { question: `What does a mandala tattoo mean?`, answer: `A mandala tattoo means wholeness, balance, and the universe as a connected whole. Used in Hindu and Buddhist meditation, its circular symmetry represents the idea that life repeats and connects in every direction. Carl Jung later framed the mandala as a universal image of psychological integration.` },
      { question: `What does an infinity tattoo symbolize?`, answer: `An infinity tattoo symbolizes endless love, limitless possibility, or a bond that never breaks. Pairs often add names or dates inside the loop to mark a relationship or a personal commitment.` },
      { question: `What does a moon tattoo mean?`, answer: `A moon tattoo means cycles, intuition, and change. A crescent leans toward new beginnings and growth, while a full moon points to completion and feminine energy across many cultures.` },
      { question: `What does a compass tattoo mean?`, answer: `A compass tattoo means direction, staying true to yourself, and finding your way home — literally "true north." It is popular with travelers, people who have moved through a hard season, or anyone who wants a quiet anchor of purpose on the skin.` },
      { question: `What does a sun tattoo symbolize?`, answer: `A sun tattoo symbolizes vitality, action, and life itself. Where the moon is reflection and change, the sun is energy and visibility — often chosen to mark a bright chapter, recovery, or a personality that leads rather than follows.` },
    ],
  },

  religious: {
    dataInsights: [
      `Religious & spiritual symbols are 4 of 70 (5.7%), spanning Christian, Ancient Egyptian, Hindu, Buddhist, Jewish, and Islamic traditions.`,
      `The Eye of Horus is the only symbol whose proportions were used as an ancient Egyptian measurement system — a detail most guides omit.`,
      `Across all 70 symbols, religious marks are the most "protected" category: we attach a respect-and-research note to each before booking.`,
    ],
    h1: `Religious & Spiritual Tattoo Meanings`,
    metaDescription: `Explore religious & spiritual tattoo meanings — faith, protection, and devotion. Discover cross, Eye of Horus, hamsa & om symbolism.`,
    intro: `Religious and spiritual tattoos are worn as constant, visible devotion. They mark faith, protection, and a connection to something larger than oneself.

The cross, the Eye of Horus, the hamsa, and the om each carry centuries of meaning across distinct traditions — choose the one that matches your own practice.`,
    deepDive: `Faith tattoos are worn as constant, visible devotion — but each tradition carries its own rules about images. In Christianity the early church was wary of graven images, yet tattoo traditions exist among Coptic, Ethiopian, and some pilgrim communities (Jerusalem crosses are a centuries-old souvenir). In Hinduism and Buddhism, imagery of deities is common and devotional. Islam's mainstream view discourages tattooing, so many Muslim clients choose calligraphy or avoid ink entirely. The point: know the rule before you claim the symbol.

Read the symbol's lineage. The Eye of Horus (Wedjat) is an ancient Egyptian sign of protection and royal power, still used as an amulet — its proportions were even used as a unit of measurement. The hamsa (Hand of Fatima / Miriam) spans Jewish, Muslim, and Christian use as a protective hand against the evil eye. Om is the sacred sound in Hindu and Buddhist practice, the beginning and end of all things. None of these is "decorative" in its home culture — treat each as you would a scripture quote.

Respect overrides aesthetics. If a symbol is sacred to a tradition you don't practice, ask whether wearing it is honoring or appropriating. Many artists will decline or redirect you to a parallel secular symbol. That conversation is part of good tattoo practice, not gatekeeping.`,
    didYouKnow: [
      `The Eye of Horus's proportions were used as an ancient Egyptian unit of measurement — a detail most guides omit.`,
      `The hamsa spans Jewish, Muslim, AND Christian use as a hand against the evil eye — one symbol, three faiths.`,
      `Some Christian tattoo traditions (Coptic, Ethiopian, Jerusalem pilgrims) are centuries old, despite the "no graven images" reputation.`,
      `In our dataset, religious marks are the most "protected" category — every entry carries a respect-and-research note before booking.`,
    ],
    choosingGuide: `Religious tattoos carry more weight than most, because the symbol is tied to faith and identity — not just aesthetics. Lead with what the imagery actually means to you, not what looks good. A cross can mean sacrifice, resurrection, or personal redemption depending on denomination; the Eye of Horus is protection and health in Egyptian tradition; the Hamsa is a hand against the evil eye across Jewish, Muslim, and Christian cultures; Om (Aum) is the sacred sound of the universe in Hinduism and Buddhism.

If the symbol bridges cultures (Hamsa, Evil Eye), be ready to talk about its meaning respectfully — clients increasingly ask. Choose the one that matches your actual practice or the story you want to carry, and keep the design clean so the reverence reads.`,
    placementGuide: `Most clients place religious tattoos where they can be covered for formal or workplace settings, or centrally as a statement. The cross is common on the forearm, chest over the heart, or upper back; the Hamsa often sits on the wrist, upper arm, or ribcage as a protective charm close to the body. The Eye of Horus works small on the wrist, nape, or behind the ear.

These designs reward fine, deliberate linework over heavy shading — a thin, precise cross or Om reads as devotion rather than decoration. Size them 2–4 inches for wrist or nape, larger (4–6 inches) for chest or back. Avoid high-friction areas (feet, hands) where crisp religious linework blurs fastest.`,
    popularSymbols: [
      { name: 'Cross', note: 'The most-requested religious tattoo: sacrifice, faith, and personal redemption. Placed at the chest, forearm, or back depending on how visible the wearer wants it.' },
      { name: 'Eye of Horus', note: 'Ancient Egyptian symbol of protection, health, and restoration. Small and versatile — wrist, nape, or behind the ear.' },
      { name: 'Hamsa', note: 'The protective hand against the evil eye, shared across Jewish, Muslim, and Christian traditions. A meaningful charm for the upper arm or ribcage.' },
    ],
    faqs: [
      { question: `What does a cross tattoo mean?`, answer: `A cross tattoo means Christian faith, sacrifice, and hope. Beyond religion it can mark a personal loss or a promise kept. Style — Celtic, Gothic, minimal — shapes the secondary meaning.` },
      { question: `What does an Eye of Horus tattoo symbolize?`, answer: `An Eye of Horus tattoo symbolizes protection, health, and royal power. From ancient Egypt it was worn as an amulet against harm and is still used as a sign of safeguarding.` },
      { question: `What does an om tattoo mean?`, answer: `An om tattoo means the sacred sound of the universe in Hindu and Buddhist tradition. It represents the beginning and end of all things, used in meditation and as a mark of spiritual practice.` },
      { question: `What does a hamsa tattoo mean?`, answer: `A hamsa tattoo means protection against the evil eye and bad luck. The open hand spans Jewish (Hand of Miriam), Muslim (Hand of Fatima), and Christian use, so it is one of the few symbols shared across three faiths — often chosen as a quiet safeguard.` },
      { question: `Is it disrespectful to get a religious tattoo outside my faith?`, answer: `It can be, depending on the symbol and your intent. Sacred marks (the cross, om, Eye of Horus, hamsa) carry centuries of meaning in their home traditions; wearing one as decoration can read as appropriation. If a symbol matters to you, learn its lineage and talk it through with your artist — many will suggest a respectful, parallel design.` },
    ],
  },

  cultural: {
    dataInsights: [
      `Cultural & tribal symbols are 4 of 70 (5.7%), covering Polynesian / Maori, Celtic, Ojibwe, and Ancient Egyptian traditions.`,
      `Maori ta moko and Samoan pe'a are documented as earned or lineage-bound — we explicitly tell readers not to wear them casually.`,
      `The same "protection" meaning recurs across the directory: in tribal, Egyptian, and religious categories — a cross-link we surface on each page.`,
    ],
    h1: `Cultural & Tribal Tattoo Meanings`,
    metaDescription: `Discover cultural & tribal tattoo meanings — identity, heritage, and rite of passage. Explore tribal, Celtic knot, dreamcatcher & Egyptian symbolism.`,
    intro: `Cultural and tribal tattoos are among the most meaningful — and most often misunderstood — designs. They signal identity, heritage, and rite of passage.

Worn respectfully, they honor a lineage; each pattern carries rules about who may wear it and why, so research the tradition before committing.`,
    deepDive: `Cultural tattoos are the most meaningful and the most misused. In Polynesia, tatau (Samoa), tā moko (Maori), and kakau (Hawaii) are not decoration — they are genealogy, rank, and rite of passage, recorded on the body. National Geographic documents tatau as a 3,000-year practice of identity and lineage. The Smithsonian's Lars Krutak frames indigenous tattoo worldwide as a "biography language" — each mark says who you are and what you've earned. Worn outside that lineage, the same pattern becomes a costume.

Know which are earned. Maori ta moko and Samoan pe'a are bestowed, often through ceremony, and carry family and rank. A random "tribal armband" picked off the wall is not a substitute and reads as borrowed. If you have Polynesian, Maori, or Samoan heritage, work with an artist from that community and let the design be built with you, not copied onto you.

Pick open traditions. Celtic knots, dreamcatchers (Ojibwe), and Egyptian ankh are widely shared and commonly chosen by people outside those cultures — but the respectful move is still to learn the meaning. A dreamcatcher filters bad dreams; an ankh is life itself; a Celtic knot is eternity with no beginning or end. Say the meaning out loud before you sit — if you can't, it isn't your tattoo yet.`,
    didYouKnow: [
      `Polynesian tatau is a ~3,000-year practice of recording identity and lineage — documented by National Geographic.`,
      `Maori ta moko and Samoan pe'a are bestowed through ceremony and carry family rank — not picked off a flash sheet.`,
      `Anthropologist Lars Krutak frames indigenous tattoo worldwide as a "biography language" — each mark says who you are.`,
      `The same "protection" meaning recurs across tribal, Egyptian, and religious categories — a cross-link we surface on each page.`,
    ],
    choosingGuide: `Cultural tattoos demand the most care, because the design belongs to a living tradition. Lead with respect and research: ask what the pattern actually signifies in its source culture before booking. Polynesian tatau, Maori moko, and Native American tribal work are earned marks with genealogy and status — many artists now co-create these with cultural practitioners rather than stamping a flash design. Celtic knots mean eternity and interconnectedness; dreamcatchers are Ojibwe protection symbols; Egyptian symbols (ankh, scarab, Eye of Horus) carry specific deities and ideas.

Pick the symbol whose meaning you can stand behind, and credit its origin. The strongest cultural pieces are collaborations, not costumes — clients remember studios that got the meaning right.`,
    placementGuide: `Cultural designs range from bold blackwork to fine line, so placement follows the style. Tribal and Polynesian work wants large, continuous canvas — the sleeve, thigh, or back — where the pattern flows with the body's lines. Celtic knots work as bands (arm, forearm, calf) or as a central chest or shoulder piece. Dreamcatchers suit the upper back or shoulder blade, where the web can spread.

Scale up for pattern integrity: a tribal sleeve needs committed coverage, not a 2-inch sample. Fine-line Egyptian symbols (ankh, eye) sit well on the wrist or collarbone at 1.5–3 inches. Sensitive skin areas (inner arm, ribs) show the intricate linework but hurt more — plan accordingly and keep the meaning central to the placement.`,
    popularSymbols: [
      { name: 'Tribal', note: 'Bold, genealogical blackwork tied to Polynesian, Maori, and Native American traditions. Best as a sleeve or thigh where the pattern flows with the body.' },
      { name: 'Celtic Knot', note: 'Eternity and interconnectedness with no beginning or end. Popular as an arm band or central chest and shoulder piece.' },
      { name: 'Dreamcatcher', note: 'An Ojibwe protection symbol; the web catches bad dreams. Sits well on the upper back or shoulder blade.' },
    ],
    faqs: [
      { question: `What do tribal tattoos mean?`, answer: `Tribal tattoos mean identity, status, and protection within a specific culture — Samoan, Maori, Polynesian, and more. Each motif is tied to family and rank, so respect for the tradition is essential before getting one.` },
      { question: `What does a Celtic knot tattoo symbolize?`, answer: `A Celtic knot tattoo symbolizes eternity and interconnectedness, since its lines have no beginning or end. It is commonly used for love, friendship, and family bonds that are meant to last.` },
      { question: `What does a dreamcatcher tattoo mean?`, answer: `A dreamcatcher tattoo means protection and peaceful sleep. From Native American tradition it filters bad dreams, letting only good ones through — often chosen for a child or a fresh start.` },
      { question: `What does a Maori ta moko mean?`, answer: `A Maori ta moko is a sacred record of lineage, rank, and personal history — worn on the face or body and built with the wearer, not copied. It is earned within Maori culture, so outside that heritage it should not be worn casually; many artists will redirect you to a respectful parallel design.` },
      { question: `Are cultural tattoos cultural appropriation?`, answer: `It depends on the symbol and intent. Earned traditions (Maori ta moko, Samoan pe'a) should stay within their culture. Open, widely-shared symbols (Celtic knots, ankh, dreamcatcher) are commonly worn across cultures, but the respectful move is to learn the meaning and say it aloud before you sit. When in doubt, ask your artist.` },
    ],
  },

  nature: {
    dataInsights: [
      `Nature symbols are 4 of 70 (5.7%): tree of life, wave, mountain, feather.`,
      `The Tree of Life is the most cross-cultural symbol in the dataset — independently present in Norse, Celtic, Egyptian, Hindu, and Mesoamerican myth.`,
      `Nature is the only category where every symbol is documented as gender-neutral (no "for women / for men" framing).`,
    ],
    h1: `Nature Tattoo Meanings & Symbolism`,
    metaDescription: `Nature tattoo meanings — growth, balance & resilience. Tree of life, wave, mountain & feather, traced across cultures from Yggdrasil to Ceiba.`,
    intro: `Nature tattoos turn the outdoors into personal symbols of growth, balance, and resilience — but the meanings run deeper than "love the ocean."

A tree of life links you to generations; a wave marks learning to move with change; a mountain stands for the storm you climbed. The right symbol is the force you want close.`,
    deepDive: `The Tree of Life is the rare symbol every culture built. Norse myth has Yggdrasil bridging nine worlds; the Celts had Crann Bethadh; Egypt the Ished tree of renewal; Hinduism the Ashvattha; Mesoamerica the Ceiba; the Kabbalah the Etz Chaim. Same shape, every continent — pick the root that's yours.

Read the tree in parts. Roots = ancestors and foundation; trunk = the resilience that held you up; branches = the choices and horizons you reach for; leaves and fruit = what you've earned along the way. A good artist will weight the part that matters to you.

Waves and feathers are emotional weather. A wave isn't just "ocean love" — it's riding life's ups and downs instead of fighting the current. A feather often reads as a sign: letting go, traveling light, or a nudge from someone you've lost.

These symbols aren't "for women" or "for men" — they're genderless. Choose by the meaning, not the marketing.`,
    didYouKnow: [
      `The Tree of Life shows up independently in Norse, Celtic, Egyptian, Hindu, and Mesoamerican myth — nearly every culture drew one.`,
      `In Tree of Life ink, roots = ancestry, trunk = resilience, branches = the paths you choose. The parts tell the story.`,
      `A feather is often read as a sign from someone lost, or a nudge to let go and travel light.`,
      `Wave tattoos aren't only "ocean love" — they stand for riding life's tides rather than resisting them.`,
    ],
    choosingGuide: `Choose a nature tattoo by the force you want close. The Tree of Life links you to generations — read it in parts: roots = ancestry, trunk = resilience, branches = the paths you choose. A wave marks learning to move with change instead of fighting it; a mountain stands for the storm you climbed; a feather is a sign to let go or a nudge from someone lost. Style follows feeling: blackwork and dotwork for a meditative tree, watercolor for a soft wave, fine-line for a single feather. These symbols are genderless — pick by meaning, not marketing. When the element echoes a real chapter in your life, the tattoo lands.`,
    placementGuide: `Nature tattoos adapt to any size. A small tree, single wave, or lone feather sits clean on the wrist, ankle, collarbone, or behind the ear. Medium pieces — a Tree of Life, a mountain range, a wave band — belong on the forearm, calf, shoulder, or rib. Large back or sleeve work suits a full landscape (tree + mountain + wave). The Tree of Life's symmetry fits the sternum or upper back; a wave flows along the collarbone or thigh. Avoid high-wear spots (fingers, feet) for fine dotwork — it blurs. Match the element to the body's line: a mountain across the shoulder blades, a wave down the side.`,
    popularSymbols: [
      { name: 'Tree of Life', note: 'Growth and the link between generations; cross-cultural (Norse, Celtic, Egyptian, Hindu). Sternum, back, or forearm.' },
      { name: 'Wave', note: 'Flow, change, and moving with the tides. A popular minimalist emblem. Wrist, collarbone, or ankle.' },
      { name: 'Mountain', note: 'Strength, perspective, and overcoming challenge. Often with coordinates. Shoulder, calf, or thigh.' },
      { name: 'Feather', note: 'Freedom, spiritual guidance, letting go. A sign from someone lost. Behind ear, wrist, or ankle.' },
    ],
    faqs: [
      { question: `What does a tree of life tattoo mean?`, answer: `A tree of life tattoo means growth, connection, and the link between generations. Read it in parts: roots = ancestry and foundation, trunk = resilience, branches = the choices you reach for. It appears in Norse, Celtic, Egyptian, Hindu, and Mesoamerican tradition alike.` },
      { question: `What does a wave tattoo symbolize?`, answer: `A wave tattoo symbolizes change, flow, and the power of nature. More than "love the sea," it stands for riding life's ups and downs instead of fighting the current — a fit for anyone who has learned to move with difficulty.` },
      { question: `Is the tree of life tattoo religious?`, answer: `Not necessarily. It appears in many spiritual traditions (Celtic, Norse, Hindu, Egyptian, Christian), but it is also a universal, secular symbol of growth, resilience, and family roots. You can wear it for heritage without affiliating with any one faith.` },
      { question: `What does a feather tattoo mean?`, answer: `A feather tattoo means freedom, spiritual guidance, and letting go. For many it is a sign from a lost loved one, or a reminder to travel light and trust the wind. Birds of prey (eagle, hawk) lean toward vision; soft feathers toward peace.` },
      { question: `What does a mountain tattoo represent?`, answer: `A mountain tattoo represents strength, perspective, and overcoming challenge. It marks a hard journey beaten or a goal reached, and is often paired with a compass or coordinates to pin the moment.` },
    ],
  },

  objects: {
    dataInsights: [
      `Object symbols are 4 of 70 (5.7%): anchor, skull, heart, key.`,
      `The anchor is the only symbol with a dedicated maritime milestone rule in our notes — sailors earned it per Atlantic crossing.`,
      `Objects are the most "personal-story" category: each links to a life event (stability, mortality, love, new chapter).`,
    ],
    h1: `Object & Symbol Tattoo Meanings`,
    metaDescription: `Discover object tattoo meanings — anchors, hearts, keys & skulls. Explore what anchor, skull, heart & key designs symbolize.`,
    intro: `Object tattoos turn everyday things into personal emblems.

An anchor holds you steady, a key opens a new chapter, a heart shows love, and a skull faces mortality head-on. The meaning lives in the story you attach to the object.`,
    deepDive: `Object tattoos are the most literal: the meaning is the thing. An anchor is stability and safe return, rooted in sailor tradition — historically a mariner earned one per Atlantic crossing, a milestone tattoo. A skull is memento mori, a plainspoken "life is short," not a goth cliché. A key is access and opportunity; two interlocked keys often mark a shared secret between partners. A heart is the oldest love symbol we have.

Make it personal. The plain object is a starting point; the detail is the meaning. An anchor with a banner bearing a name becomes a person, not a cliché. A key with a specific date unlocks a moment. A heart with coordinates points to where the feeling lives. Clients who bring "just an anchor" usually leave with "the anchor from my grandfather's navy photo" — same symbol, ten times the weight.

Watch the clichés. A heart with "mom" is legible but generic; a heart with her handwriting is yours. Anchors and skulls are everywhere, so the differentiator is execution and intent, not the subject. If the object matters to a real story, say so in the design — that's what separates a tattoo from a sticker.`,
    didYouKnow: [
      `Sailors historically earned an anchor per Atlantic crossing — it was a milestone tattoo, not just decoration.`,
      `The skull is a memento mori: a reminder life is short, popular across cultures as respect for the dead.`,
      `Two interlocked keys often mark a shared secret or a relationship that "unlocks" each other.`,
      `Objects are the most "personal-story" category in our dataset — each links to a life event (stability, mortality, love, a new chapter).`,
    ],
    choosingGuide: `Object symbols are the most flexible category, because each carries a clear, personal story. An anchor means steadiness and staying grounded through a storm; a skull is memento mori — mortality, rebellion, or honoring the dead; a heart is the oldest symbol of love but also courage; a key is access, secrets, or a new chapter unlocked.

Choose the object that maps to a specific moment, not a vague mood. Anchors suit people who have weathered something; keys suit new beginnings (a move, a recovery, a relationship). Because these read literally, the detail does the talking — a broken anchor chain, a key with a specific initial, a heart with a date. One object, one clear story beats a pile of charms.`,
    placementGuide: `Object tattoos scale well and sit almost anywhere, which makes placement a matter of visibility and sentiment. Anchors are classic on the forearm, upper arm, or calf — vertical objects follow the limb. Skulls work small on the wrist or behind the ear, or large as a statement on the chest, shoulder, or thigh. Hearts are endlessly placeable; the wrist, finger, and ribcage are favorites. Keys run vertically along the forearm, spine, or collarbone.

Size for the detail you want: a simple heart reads at 1 inch; a detailed skull with shading wants 3–5 inches. Fine-line versions suit the wrist and collarbone; bold traditional work suits the forearm and calf. Avoid the fingers and feet for intricate object detail — they fade and blur fastest.`,
    popularSymbols: [
      { name: 'Anchor', note: 'Steadiness and staying grounded through a storm; a classic sailor symbol. Often placed on the forearm or calf to follow the line of the limb.' },
      { name: 'Skull', note: 'Memento mori: mortality, rebellion, or honoring the dead. Works small behind the ear or large as a chest or thigh statement.' },
      { name: 'Heart', note: 'The oldest symbol of love and courage. Endlessly placeable — wrist, finger, and ribcage are the favorites.' },
    ],
    faqs: [
      { question: `What does an anchor tattoo mean?`, answer: `An anchor tattoo means stability, hope, and staying grounded. Traditionally worn by sailors as a safe-return symbol, it now marks anyone who wants a reminder to hold steady through rough water.` },
      { question: `What does a skull tattoo symbolize?`, answer: `A skull tattoo symbolizes mortality, courage, and living fully. It is a memento mori — a reminder that life is short — and in many cultures a sign of respect for those who have passed.` },
      { question: `What does a key tattoo represent?`, answer: `A key tattoo represents opportunity, knowledge, and access to something hidden. Two interlocking keys often mark a shared secret or a relationship that unlocks each other.` },
      { question: `What does a heart tattoo symbolize?`, answer: `A heart tattoo symbolizes love, but the detail writes the rest: a name or date makes it a specific person, coordinates make it a place, a heartbeat line makes it a life. The plain heart is legible; the personalized heart is yours.` },
      { question: `How do I make an object tattoo feel personal?`, answer: `Add the detail that carries the story: a name or date on a banner, coordinates on a heart, a specific year on a key. The subject (anchor, skull, key) is universal — the customization is what makes it unmistakably yours rather than a flash-sheet cliché.` },
    ],
  },

  modern: {
    dataInsights: [
      `Modern styles are 4 of 70 (5.7%): geometric, watercolor, minimalist, abstract.`,
      `Watercolor is the only style we date precisely — it emerged as a distinct tattoo style in the early 2010s.`,
      `Minimalist is the only category whose meaning is defined by technique, not subject — "less is more" as the message itself.`,
    ],
    h1: `Modern Style Tattoo Meanings`,
    metaDescription: `Explore modern tattoo style meanings — minimalist, watercolor, geometric & abstract. What these contemporary approaches symbolize.`,
    intro: `Modern tattoo styles are meanings in themselves.

A minimalist line speaks restraint, watercolor shows emotion without borders, and abstract forms leave room for the wearer's own reading. The style becomes part of the message.`,
    deepDive: `Modern styles are meanings in themselves — the technique IS the message. A minimalist line speaks restraint; a watercolor piece shows emotion without borders; an abstract form leaves the reading to the wearer. This is the only category whose meaning is defined by how it's made, not what it depicts.

Know the timeline. Watercolor emerged as a distinct tattoo style in the early 2010s, riding the fine-art trend — it mimics pigment bleeding on paper, so it suits feelings that don't fit neat lines. Minimalism grew with the "less is more" pulse of the 2010s; a single line or small mark stands for one focused idea kept quiet on purpose. Geometric (line, dotwork, sacred geometry) blends math and meaning — balance, infinity, the cosmos. Abstract is the wildcard: no fixed subject, so the wearer defines it.

Mind the fade. Watercolor and light minimalist work fade faster than bold traditional because they use less saturated outlines; placement and aftercare matter more. Talk to your artist about longevity before you commit to a style built on soft edges. The style should fit the story AND the skin.`,
    didYouKnow: [
      `Watercolor is the only style we date precisely — it emerged as a distinct tattoo style in the early 2010s.`,
      `Minimalist is the only category whose meaning is defined by technique, not subject — "less is more" is the message.`,
      `Watercolor and light minimalist fade faster than bold traditional because they use less saturated outline — placement matters.`,
      `Modern styles make up 4 of 70 symbols (5.7%) in our directory: geometric, watercolor, minimalist, abstract.`,
    ],
    choosingGuide: `Modern styles are defined less by subject than by treatment, so choose the look first and the subject second. Minimalist strips a symbol to one clean line — best for people who want meaning without noise. Watercolor trades solid outlines for soft, bleeding color washes, ideal for emotion-led pieces (a name, a place, a feeling). Geometric overlays structure on any subject. Abstract lets the feeling lead when no single symbol fits.

Match the style to how you will feel about it in ten years. Minimalist and geometric age gracefully; heavy watercolor can muddy as the skin changes. If you want a safe, timeless modern piece, go fine-line geometric or minimalist — and pick a subject with a real story so the restraint feels intentional, not empty.`,
    placementGuide: `Modern styles are placement-flexible but style-specific. Minimalist and fine-line geometric love small, visible spots — wrist, forearm, collarbone, behind the ear — where a single clean line reads as deliberate. Watercolor wants larger, flat areas (thigh, upper arm, shoulder) so the color can spread without crowding bone or joint. Abstract flows best across a broad canvas like the back or ribcage.

Size up for watercolor (4–6 inches minimum) so the wash has room; minimalist can go tiny (1 inch) and still land. Avoid high-movement joints (fingers, feet, elbows) for fine-line work — they blur fastest. Sun exposure fades watercolor quicker, so consider a place you can protect or re-touch.`,
    popularSymbols: [
      { name: 'Minimalist', note: 'A single clean line carrying one meaning; the safest, most timeless modern choice. Popular tiny on the wrist, collarbone, or behind the ear.' },
      { name: 'Watercolor', note: 'Soft, bleeding color washes for emotion-led pieces. Needs 4–6 inches of flat canvas like the thigh or upper arm.' },
      { name: 'Geometric', note: 'Structured overlays on any subject; ages gracefully. Works small on the forearm or large across the back.' },
    ],
    faqs: [
      { question: `What does a minimalist tattoo mean?`, answer: `A minimalist tattoo means clarity, restraint, and less is more. A single line or small mark often stands for one focused idea — a name, a date, a place — kept quiet on purpose.` },
      { question: `What does a watercolor tattoo symbolize?`, answer: `A watercolor tattoo symbolizes free emotion, creativity, and impermanence. Its soft, borderless color mimics paint, making it a fit for feelings that do not fit neat lines.` },
      { question: `What does an abstract tattoo represent?`, answer: `An abstract tattoo represents a meaning that is personal and open. Without a fixed subject, it lets the wearer define it — a feeling, a phase, or a memory only they fully read.` },
      { question: `When did watercolor tattoos become popular?`, answer: `Watercolor emerged as a distinct tattoo style in the early 2010s, alongside the rise of fine-art and soft-edged aesthetics in tattooing. It mimics pigment bleeding on paper, which is why it suits emotional, free-form subjects more than precise, literal ones.` },
      { question: `What does a geometric tattoo mean?`, answer: `A geometric tattoo means balance, order, and the bigger picture — the form carries the meaning. Mandalas express wholeness, compasses direction, infinities permanence. It blends math and symbolism, and works as a clean, modern counterpoint to organic or illustrative styles.` },
    ],
  },

  birds: {
    dataInsights: [
      `Birds are 4 of 70 symbols (5.7%): swallow, hummingbird, dove, raven.`,
      `The swallow is the only symbol with a quantified maritime rule in our data — one tattoo per 5,000 nautical miles sailed.`,
      `Birds pair naturally with the nature category (feather) and sea-life — cross-links we surface on each page.`,
    ],
    h1: `Bird Tattoo Meanings & Symbolism`,
    metaDescription: `Discover bird tattoo meanings — freedom, hope, and the soul's journey. Explore swallow, hummingbird, dove & raven symbolism.`,
    intro: `Bird tattoos are a timeless symbol of freedom, message, and the journey of the soul.

A swallow signals a safe return, a hummingbird carries joy, a dove brings peace, and a raven walks the line between omen and intelligence. Few designs feel as light to wear.`,
    deepDive: `Birds are the oldest symbol of the freed soul — light, message-bearing, between earth and sky. A swallow signals a safe return; sailors earned one after 5,000 nautical miles, and a pair often marks love or the journey home. A hummingbird carries joy and resilience — despite its size it migrates vast distances. A dove is peace and the Holy Spirit in Christian iconography, or simply hope. A raven walks the line between omen and intelligence — Odin's messenger in Norse myth, a guide between worlds elsewhere.

Let the species set the tone. Swallows and sparrows read nostalgic and traditional; eagles and hawks lean toward vision and power; doves toward peace; ravens toward mystery. The same "bird" word spans a huge emotional range, so name the species, not just "a bird."

Pair with the right neighbor. Birds link naturally to the nature category (feather) and sea-life (the swallow's maritime root) — cross-links we surface on each page. A swallow with a compass, a dove with a name, a raven with a quote: the combo tells whether this is about home, faith, or the unknown.`,
    didYouKnow: [
      `Sailors earned a swallow per 5,000 nautical miles sailed — the tattoo was a logged milestone, not decoration.`,
      `The hummingbird migrates vast distances despite its tiny size — which is why it reads as resilience and lightness of spirit.`,
      `In Norse myth the raven is Odin's messenger; in other lore a guide between worlds — chosen for depth, not fear.`,
      `Birds pair naturally with nature (feather) and sea-life — cross-links we surface on each page.`,
    ],
    choosingGuide: `The swallow is the definitive bird tattoo, and its meaning is earned rather than decorative. In traditional sailor lore, a swallow marks a return home safely — so it signals loyalty, travel, and coming back. A pair of swallows means two souls or a journey shared. Because the symbol is so loaded, the choice is less which bird and more what chapter: a swallow suits someone who has traveled, migrated, or come home from something hard.

If you want a bird but not the sailor heritage, say so — artists can adapt the silhouette while keeping the return-and-loyalty core. One swallow, one clear story.`,
    placementGuide: `The swallow is a small, detailed bird, so placement is about showing the silhouette cleanly. The classic spot is the chest (one swallow over the heart) or the upper arm, where the forked tail and swept wings read. A pair works well across the shoulders or on the forearms. Behind the ear and the wrist are popular minimal versions.

Size it 2–4 inches so the wing detail survives — a tiny swallow under 1.5 inches loses the tail fork. Fine-line swallows suit the wrist and collarbone; traditional bold ones suit the forearm and chest. Avoid the fingers and feet; the small detail blurs. The chest and upper arm also age best for a symbol people keep for life.`,
    popularSymbols: [
      { name: 'Swallow', note: 'The definitive bird tattoo: loyalty, travel, and a safe return home, from sailor tradition. One swallow over the heart, or a pair across the shoulders for a journey shared.' },
      { name: 'Swallow pair', note: 'Two swallows signal a journey shared or two souls; a favorite across the shoulders or forearms.' },
      { name: 'Traditional vs fine-line swallow', note: 'Bold traditional sits on the chest or forearm; a fine-line version works behind the ear or on the wrist.' },
    ],
    faqs: [
      { question: `What does a swallow tattoo mean?`, answer: `A swallow tattoo means loyalty, safe return, and hope. Sailors wore one after crossing 5,000 nautical miles; a pair often marks love or a journey home.` },
      { question: `What does a hummingbird tattoo symbolize?`, answer: `A hummingbird tattoo symbolizes joy, resilience, and living in the moment. Despite its tiny size it migrates vast distances, making it a symbol of strength and lightness of spirit.` },
      { question: `What does a raven tattoo represent?`, answer: `A raven tattoo represents intelligence, mystery, and transformation. In Norse myth it is Odin's messenger; in other lore a guide between worlds — chosen for depth rather than fear.` },
      { question: `What does a dove tattoo mean?`, answer: `A dove tattoo means peace, hope, and the Holy Spirit in Christian iconography. It is the gentlest of bird symbols — often chosen for a fresh start, a reconciliation, or a quiet memorial.` },
      { question: `Why are swallows a classic sailor tattoo?`, answer: `Swallows were a logged milestone: a sailor earned one after sailing 5,000 nautical miles, and a pair marked a safe return home or a loved one waited for. The tradition made the swallow a shorthand for loyalty and coming-home, which is why it still reads as nostalgic and traditional today.` },
    ],
  },

  zodiac: {
    dataInsights: [
      `Zodiac & astrology symbols are 4 of 70 (5.7%): constellation, Pisces, Scorpio, Gemini.`,
      `Constellation is the only symbol type we document as "date-encoded" — the exact star map of a birth or wedding date.`,
      `3 of 4 zodiac entries link explicitly to a Greek / Roman myth origin (Pisces to Aphrodite, Scorpio to Babylon, Gemini to Castor & Pollux).`,
    ],
    h1: `Zodiac & Astrology Tattoo Meanings`,
    metaDescription: `Explore zodiac tattoo meanings — identity, fate, and the stars. Discover constellation, Pisces, Scorpio & Gemini symbolism.`,
    intro: `Zodiac and astrology tattoos wear your place in the sky.

A constellation maps your birth sign, while Scorpio, Pisces, and Gemini carry the traits of their signs — passion, intuition, and duality. They are identity you can read at a glance.`,
    deepDive: `Zodiac tattoos wear your place in the sky. A constellation maps your sun, moon, or rising sign as a quiet personal emblem. The signs carry the traits of their myths: Scorpio intensity and transformation, Pisces empathy and flow, Gemini duality (the twins Castor and Pollux). You don't have to "believe" in astrology to wear your sign — plenty of people choose it as identity, like a hometown or a birthday.

Read the glyph, not just the animal. Scorpio's M is a coded scorpion; Pisces' two arcs are the fish on a line; Gemini's II is the twins. The glyph is often cleaner and more personal than the literal creature, and it reads at a glance. Constellation tattoos go further — the exact star map of a birth or wedding date, so the ink is literally your sky that night.

Date-encode it. Because a constellation can be the precise star map of a moment, many clients choose their child's birth sky or a wedding date. That turns a "zodiac" piece into a timestamp only the wearer fully reads — private meaning in public view.`,
    didYouKnow: [
      `A constellation can be the exact star map of a birth or wedding date — your sky that night, encoded as ink.`,
      `3 of 4 zodiac entries in our dataset trace to a Greek/Roman myth (Pisces to Aphrodite, Scorpio to Babylon, Gemini to Castor & Pollux).`,
      `The glyph is often cleaner than the creature: Scorpio's M, Pisces' linked fish, Gemini's II (the twins).`,
      `You don't have to "believe" in astrology — many wear their sign as identity, like a birthday or hometown.`,
    ],
    choosingGuide: `A constellation tattoo is identity worn as stars — you are not picking a generic symbol, you are marking your sign. The meaning comes from the sign itself: Leo for courage and leadership, Scorpio for intensity and transformation, Pisces for intuition, and so on. Clients usually know their sign and want it placed permanently, so the choice is sign-first, style-second.

Decide between a literal constellation (dots and connecting lines) and a symbolic representation (the Leo lion, the Scorpio scorpion). The constellation reads as personal and subtle; the symbol reads as bold identity. Either way, get the star pattern right — a wrong constellation is the fastest way to lose a client's trust. One sign, mapped accurately, is the whole point.`,
    placementGuide: `Constellation tattoos are delicate by nature, so placement favors flat, visible skin that shows the star map. The wrist, collarbone, forearm, and shoulder blade are favorites — a line of small dots reads cleanly there. Behind the ear and the nape work for minimal versions. The ribcage and sternum suit a larger, flowing constellation.

Size for the star count: a 3-star sign can go tiny (1–2 inches); a 7-star sign wants 3–5 inches to keep dots distinct. Fine-line and tiny dots fade faster than solid work — expect touch-ups. Avoid the fingers and feet. Pair placement with how openly you want your sign read day to day.`,
    popularSymbols: [
      { name: 'Constellation (your sign)', note: 'Identity as a star map: Leo for courage, Scorpio for transformation, Pisces for intuition. Accuracy of the star pattern matters most.' },
      { name: 'Leo', note: 'The lion sign: courage and leadership. Often rendered as the constellation or the lion symbol on the shoulder or forearm.' },
      { name: 'Scorpio', note: 'Intensity and transformation; a favorite for the wrist or ribcage, as dots or the scorpion.' },
    ],
    faqs: [
      { question: `What does a constellation tattoo mean?`, answer: `A constellation tattoo means identity, guidance, and your place in the cosmos. People often choose their sun, moon, or rising sign as a quiet personal emblem — and some encode the exact star map of a birth or wedding date.` },
      { question: `What does a Scorpio tattoo symbolize?`, answer: `A Scorpio tattoo symbolizes intensity, passion, and transformation. As a fixed water sign it is linked to rebirth and emotional depth, often rendered as the scorpion or its glyph.` },
      { question: `What does a Pisces tattoo represent?`, answer: `A Pisces tattoo represents empathy, intuition, and flow. The two fish swimming in opposite directions mirror the sign's duality — dreamy yet deep, gentle yet adaptable.` },
      { question: `What does a Gemini tattoo mean?`, answer: `A Gemini tattoo means duality, balance, and two sides of one self. Named for the twins Castor and Pollux, it suits people who hold contradictions — social yet private, logical yet creative — and is often shown as the II glyph or a pair.` },
      { question: `Do I have to believe in astrology to get a zodiac tattoo?`, answer: `No. Many people wear their sign as identity, the way they'd wear a birthday or a hometown. The constellation or glyph is a personal emblem, not a creed — choose it because the symbol and the story feel like you.` },
    ],
  },

  insects: {
    dataInsights: [
      `Insects are 4 of 70 symbols (5.7%): bee, spider, dragonfly, ladybug.`,
      `The bee is the only symbol we tag as a "team / family" emblem (hive cooperation) — popular with groups, not just individuals.`,
      `Dragonfly is documented across 3 cultures (Japanese samurai, Native American, global rebirth) with the same metamorphosis meaning.`,
    ],
    h1: `Insect Tattoo Meanings & Symbolism`,
    metaDescription: `Discover insect tattoo meanings — patience, craft, and transformation. Explore bee, spider, dragonfly & ladybug symbolism.`,
    intro: `Insect tattoos pack surprising meaning into small forms.

A bee stands for community and hard work, a spider for patience and fate, a dragonfly for change, and a ladybug for luck. They are proof that small things carry big symbolism.`,
    deepDive: `Insects pack outsized meaning into small forms. A bee is community and diligence — a hive creature, so it's a symbol of teamwork and loyalty, popular with families and close groups. A spider is patience and fate; the web is both trap and masterpiece, and in many myths the spider weaves destiny. A dragonfly is change — its shift from nymph to winged adult makes it a symbol of personal transformation across Japanese, Native American, and global rebirth traditions. A ladybug is luck and protection, the gentle end of the spectrum.

Use the small canvas. Insect tattoos shine as fine-line, finger, or behind-the-ear pieces — the meaning doesn't need scale. But they also hold up as bold traditional (a wasp on a bicep, a dragonfly with color). Size follows the story, not the species.

Mind the read. A bee can mean "busy" in a corporate way or "loyal" in a family way — say which. A spider can be creepy or wise depending on the web and the eyes. The detail decides whether the piece reads as charm or omen, so be specific with your artist.`,
    didYouKnow: [
      `The bee is the only symbol we tag as a "team / family" emblem (hive cooperation) — popular with groups, not just individuals.`,
      `Dragonfly means transformation across Japanese samurai, Native American, AND global rebirth traditions — same metamorphosis, three cultures.`,
      `A spider's web is both a trap and a masterpiece — in myth the spider weaves fate and stories.`,
      `Insects are 4 of 70 symbols (5.7%) in our directory: bee, spider, dragonfly, ladybug.`,
    ],
    choosingGuide: `The bee is having a real moment, and its meaning is community over individualism — loyalty to a hive, hard work, and the sweetness that comes from it. A single bee signals industry and focus; a bee with honeycomb adds the home-and-harvest layer. For many, it also nods to environmental care, since bees are a symbol of a fragile ecosystem.

Because the bee is one strong symbol, the choice is about treatment: realistic, neo-traditional, or fine-line. A queen bee adds royalty and leadership; a bee with a name or date makes it personal. Pick the style that matches how bold you want the meaning — a tiny fine-line bee reads as a quiet personal talisman, a bold traditional one as a statement.`,
    placementGuide: `Bees are small and detailed, so placement shows the wing and stripe work best on flat, visible skin. The wrist, forearm, collarbone, and ankle are classic; behind the ear and the nape suit minimal versions. A bee with honeycomb wants a slightly larger flat area like the upper arm or shoulder.

Size it 1.5–3 inches so the wings keep detail — a bee under an inch loses the stripe definition. Fine-line bees fade faster and need touch-ups; bold traditional work holds. Avoid the fingers and feet. The forearm and collarbone age best and keep the meaning readable for years.`,
    popularSymbols: [
      { name: 'Bee', note: 'Community, hard work, and the sweetness of harvest; also a symbol of environmental care. A quiet personal talisman when fine-line, a statement when bold.' },
      { name: 'Queen bee', note: 'Royalty and leadership added to the hive meaning; popular with a crown detail on the forearm or upper arm.' },
      { name: 'Bee with honeycomb', note: 'The home-and-harvest layer; needs a flat 2–3 inch area like the shoulder or upper arm.' },
    ],
    faqs: [
      { question: `What does a bee tattoo mean?`, answer: `A bee tattoo means community, diligence, and sweetness earned through work. As a hive creature it is a symbol of teamwork and loyalty, popular among families and close groups.` },
      { question: `What does a dragonfly tattoo symbolize?`, answer: `A dragonfly tattoo symbolizes change, adaptability, and living in the moment. Its shift from nymph to winged adult makes it a symbol of personal transformation.` },
      { question: `What does a spider tattoo represent?`, answer: `A spider tattoo represents patience, destiny, and creativity. The web is both a trap and a masterpiece — in many myths the spider is a weaver of fate and stories.` },
      { question: `What does a ladybug tattoo mean?`, answer: `A ladybug tattoo means luck, protection, and gentle good fortune. At the soft end of the insect spectrum, it is a popular first tattoo and a charm against bad luck — often chosen for a child or a lighthearted piece.` },
      { question: `Are insect tattoos only done small?`, answer: `No — they shine small (fine-line, finger, behind-the-ear) but also hold up as bold traditional work (a wasp on a bicep, a dragonfly with saturated color). Size follows the story, not the species; the detail and style decide whether it reads as charm or omen.` },
    ],
  },

  'sea-life': {
    dataInsights: [
      `Sea life is 4 of 70 symbols (5.7%): whale, dolphin, octopus, shark.`,
      `It is the only category with a built-in "energy contrast" we document — whale (calm / wisdom) vs shark (power / focus).`,
      `Polynesian tattoo tradition supplies the shark (tohu) as a protector symbol — linking sea-life back to the cultural category.`,
    ],
    h1: `Sea Life Tattoo Meanings & Symbolism`,
    metaDescription: `Explore sea life tattoo meanings — depth, calm, and freedom. Discover whale, dolphin, octopus & shark symbolism.`,
    intro: `Sea life tattoos carry the calm and mystery of the ocean.

A whale means wisdom and depth, a dolphin joy and protection, an octopus intelligence and adaptability, and a shark focused power. They suit anyone drawn to the water.`,
    deepDive: `Sea life tattoos carry the calm and mystery of the ocean — but the species set very different tones. A whale is wisdom and deep emotion, the largest gentle creature, so it reads as peace and quiet power. A dolphin is joy, protection, and safe passage — long a sailor's good omen. An octopus is intelligence and adaptability; eight arms and an ink cloud show resourcefulness. A shark is focused power — an apex predator chosen for confidence and forward drive.

Note the energy contrast. Whale (calm/wisdom) vs shark (power/focus) is the clearest opposition in the category, and clients usually know which they are. Dolphin sits between — playful but protective.

Honor the roots. In Polynesian tradition the shark (tohu) is a protector, not a threat — linking sea-life back to the cultural category. Maori associate the whale (tohora) with ancestry and the breath of life. These aren't "ocean decor"; they're beings with standing in the cultures that live by the water. Say the meaning with that respect.`,
    didYouKnow: [
      `In Polynesian tradition the shark (tohu) is a protector, not a predator — linking sea-life back to the cultural category.`,
      `Whale (calm/wisdom) vs shark (power/focus) is the clearest energy contrast in the whole category.`,
      `Maori associate the whale (tohora) with ancestry and the breath of life.`,
      `Sea life is 4 of 70 symbols (5.7%): whale, dolphin, octopus, shark.`,
    ],
    choosingGuide: `Sea-life tattoos carry the calm and mystery of the ocean, but the species set very different tones — so pick the creature that matches your energy. A whale is wisdom and quiet strength; a dolphin is joy and protection; an octopus is intelligence and adaptability; a shark is focused power. Clients usually know which they are before they walk in.

If you want the meaning rooted in tradition, the shark (tohu) is a Polynesian protector and the whale (tohora) an ancestor symbol in Maori culture — say the meaning with that respect rather than as ocean decor. Choose the one creature whose story fits you, then let the style carry the mood. One animal, one clear feeling, beats a crowded seascape.`,
    placementGuide: `Sea-life scales from tiny to scene, so placement follows size. A small whale tail or dolphin sits on the wrist, ankle, or behind the ear. A full whale or shark needs broader canvas — the upper arm, thigh, back, or ribcage — where the body curve can follow the creature's line.

Size up for species detail: a fluke reads at 1–2 inches; a detailed whale or shark wants 4–6 inches. Fine-line sea-life suits the wrist and collarbone; bold blackwork suits the forearm and thigh. Avoid the fingers and feet. The back and thigh age best and let the animal swim naturally with the body — and they keep the meaning readable for years.`,
    popularSymbols: [
      { name: 'Whale', note: 'Wisdom, calm strength, and deep emotion — the largest gentle creature. A whale tail (fluke) is the most bookable motif: movement and the deep.' },
      { name: 'Dolphin', note: 'Joy, protection, and safe passage; a sailor symbol of safe passage. Reads as playful but guarding — wrist, forearm, or shoulder.' },
      { name: 'Shark', note: 'Focus, survival, and fearless movement; an apex predator for confidence. In Polynesian tradition the shark (tohu) is a protector, not a threat.' },
    ],
    faqs: [
      { question: `What does a whale tattoo mean?`, answer: `A whale tattoo means wisdom, calm strength, and deep emotion. As the largest gentle creatures, whales represent peace and the quiet power of the ocean.` },
      { question: `What does an octopus tattoo symbolize?`, answer: `An octopus tattoo symbolizes intelligence, adaptability, and defense. Its eight arms and ink cloud show resourcefulness — a fit for someone who solves problems on the fly.` },
      { question: `What does a shark tattoo represent?`, answer: `A shark tattoo represents focus, survival, and fearless movement. As an apex predator it is chosen for confidence and the drive to keep moving forward.` },
      { question: `What does a dolphin tattoo mean?`, answer: `A dolphin tattoo means joy, protection, and safe passage. Long a sailor's good omen, it reads as playful but guarding — a fit for anyone who wants a lighter, hopeful ocean symbol.` },
      { question: `Is a shark tattoo only about aggression?`, answer: `No. Beyond raw power, the shark is focus and forward drive — and in Polynesian tradition the shark (tohu) is a protector, not a threat. The read you get depends on the style and context: a sleek silhouette reads as momentum; a Polynesian tohu reads as guardianship.` },
    ],
  },

  time: {
    dataInsights: [
      `Time & mortality is the smallest category: 3 of 70 symbols (4.3%) — clock, hourglass, pocket watch.`,
      `All 3 are documented as "memento mori" variants — the same "remember you must die" idea expressed three ways.`,
      `The pocket watch is the only symbol we tag as a heirloom / legacy piece passed down a family.`,
    ],
    h1: `Time & Mortality Tattoo Meanings`,
    metaDescription: `Discover time tattoo meanings — memento mori, urgency, and legacy. Explore clock, hourglass & pocket watch symbolism.`,
    intro: `Time and mortality tattoos turn the clock into a personal philosophy.

A clock freezes a moment, an hourglass warns that time runs out, and a pocket watch honors a legacy. They are gentle, constant reminders to live on purpose.`,
    deepDive: `Time tattoos turn the clock into a personal philosophy. All three symbols in this category — clock, hourglass, pocket watch — are memento mori variants: the same "remember you must die" idea expressed three ways. The point is not morbidity but urgency: live on purpose because the sand runs out.

Read the object. A clock freezes a moment — often a birth, a loss, or a turning point; a broken clock can mark a life cut short or a defiance of time. An hourglass is the purest memento mori, the finite nature of life made visible. A pocket watch is legacy and memory, often paired with a name or date to honor someone or keep a chapter close — the only "heirloom" format in our dataset, passed down a family.

Make it a prompt, not a pall. The best time tattoos are gentle reminders, not gloom. A clock with coordinates of a wedding, an hourglass with a kid's birth time, a watch with grandpa's dates — the specificity turns "death" into "this moment mattered." That's the difference between a tattoo that weighs you down and one that steadies you.`,
    didYouKnow: [
      `All 3 time symbols (clock, hourglass, pocket watch) are memento mori variants — "remember you must die," expressed three ways.`,
      `The pocket watch is the only "heirloom" format in our dataset — passed down a family.`,
      `A broken clock can mark a life cut short OR a defiance of time itself — the break is the meaning.`,
      `Time is the smallest category: 3 of 70 symbols (4.3%).`,
    ],
    choosingGuide: `The clock is the tattoo of mortality and moments — a memento mori for a generation that wears its milestones. A pocket watch means time kept, legacy, or a life measured; a wristwatch often marks a specific era or person; a roman-numeral clock adds classical weight. The most personal clock tattoos set the hands to a meaningful time — a birth, a loss, a reunion.

Choose the clock type that maps to your story, then decide on hands. A clock with no hands (broken time) signals living in the moment; hands set to a date make it a memorial. Because the meaning lives in the detail, get the time right and keep the face readable. One clock, one specific moment.`,
    placementGuide: `Clock tattoos are detailed, so placement favors flat areas that keep the face legible. The forearm, upper arm, chest, and thigh are classics; a small pocket watch sits on the wrist or collarbone. The sternum and ribcage suit a larger, round piece. Behind the ear works for a minimal watch.

Size up for the numerals: a clock under 2 inches loses the hands and numbers; aim for 3–5 inches on the forearm or chest. Fine-line clocks fade and need touch-ups; bold traditional holds the detail best. Avoid the fingers, feet, and joints where the round face distorts. The forearm and chest age best and keep the time readable for years.`,
    popularSymbols: [
      { name: 'Pocket watch', note: 'Time kept, legacy, and a life measured. Often set to a meaningful hour; the wrist or collarbone for a small version, the chest for a bold one.' },
      { name: 'Roman-numeral clock', note: 'Classical weight added to the mortality meaning; a favorite for the forearm or upper arm.' },
      { name: 'Broken / handless clock', note: 'Living in the moment, time stopped; a minimal statement on the wrist or sternum.' },
    ],
    faqs: [
      { question: `What does a clock tattoo mean?`, answer: `A clock tattoo means a moment frozen in time, often a birth, loss, or turning point. A broken clock can mark a life cut short or a defiance of time itself.` },
      { question: `What does an hourglass tattoo symbolize?`, answer: `An hourglass tattoo symbolizes mortality, urgency, and the finite nature of life. It is a classic memento mori — a prompt to spend your time with intention.` },
      { question: `What does a pocket watch tattoo represent?`, answer: `A pocket watch tattoo represents legacy, memory, and a life measured well. Often paired with a name or date, it honors someone or marks a chapter kept close.` },
      { question: `What does a memento mori tattoo mean?`, answer: `A memento mori tattoo is a "remember you must die" reminder — an hourglass, clock, or skull that prompts you to live with intention rather than fear. It is one of the oldest tattoo traditions, used across cultures as a steady, grounding symbol rather than a morbid one.` },
      { question: `Are time tattoos depressing?`, answer: `Not when done well. The best time tattoos are gentle prompts — a clock with a wedding's coordinates, an hourglass with a child's birth time, a watch with a grandparent's dates. The specificity turns "death" into "this moment mattered," so the piece steadies you instead of weighing you down.` },
    ],
  },

  words: {
    dataInsights: [
      `Words & lettering are 4 of 70 (5.7%): name / initial, quote, coordinate, roman numeral.`,
      `It is the only category with an explicit "name-regret" warning — avoid a partner's name; safer to use a child's name or your own initials.`,
      `Coordinates are documented as the only "private-meaning" format — readable only to those who know the place.`,
    ],
    h1: `Word & Lettering Tattoo Meanings`,
    metaDescription: `Explore word tattoo meanings — names, quotes, coordinates & numerals. What lettering, quotes & roman numerals symbolize.`,
    intro: `Word and lettering tattoos put meaning in plain text.

A name honors someone, a quote carries a creed, coordinates mark a place, and roman numerals fix a date forever. The font and language do as much work as the words.`,
    deepDive: `Word tattoos put meaning in plain text — but the font and language do as much work as the words. A name honors someone; a quote carries a creed; coordinates mark a place; roman numerals fix a date forever. The risk is regret: a partner's name is the classic removal request, while a child's name or your own initials ages better.

Choose the format for the feeling. A coordinate is private meaning in public — readable only to those who know the place. Roman numerals feel permanent and restrained next to Arabic digits, which is why they're the default for dates. A quote lives or dies by its wording — song lyrics and book lines hit hardest when they're exactly right, so proofread like it's going on your skin (it is).

Mind the font. Script can blur if the lines are too thin; block letters hold up better over decades. A misspelled word is permanent, so your artist should stencil and check every letter before the needle. And consider language: a foreign phrase (Latin, Japanese) looks striking but verify the translation with a native speaker — tattoo-translation fails are legendary.`,
    didYouKnow: [
      `The only category with an explicit "name-regret" warning: avoid a partner's name; safer to use a child's name or your own initials.`,
      `Coordinates are the only "private-meaning" format — readable only to those who know the place.`,
      `Roman numerals feel permanent and restrained next to Arabic digits — the default for dates.`,
      `Words are 4 of 70 symbols (5.7%): name/initial, quote, coordinate, roman numeral.`,
    ],
    choosingGuide: `Word tattoos are the most permanent commitment you can make in ink, because the text is the meaning — there is no symbol to soften a typo. Lead with the exact wording and a font that fits the feeling. Names and initials mark people; quotes mark ideas. A single word (strength, breathe, family) is the safest, most timeless choice; a long quote risks aging with trends.

Choose the script deliberately: a name in a loved one's handwriting beats any decorative font. For a quote, keep it short and check the spelling three times. Place it where you can read it or hide it as you like. One phrase, set exactly right, is the whole point — resist filler words.`,
    placementGuide: `Word tattoos follow the text's shape, so placement is about line length. A single word or name runs well along the forearm, collarbone, wrist, or ribcage. A quote needs a longer, flatter area — the forearm, thigh, side, or ribcage — where the line does not bend mid-word. Initials work tiny on the wrist, finger, or behind the ear.

Size for legibility: a name under 1 inch blurs; aim for 1.5–3 inches. Fine-line script fades fastest of any style and needs regular touch-ups; bold or outlined lettering holds. Avoid the fingers, feet, and ribs' flex points for long scripts — they distort. The forearm and collarbone keep words readable and age best.`,
    popularSymbols: [
      { name: 'Name / Initial', note: 'The most-requested word tattoo: marks a person, not an idea. Handwriting from a loved one beats any decorative font; 1.5–3 inches on the forearm or wrist.' },
      { name: 'Quote', note: 'A short phrase marking an idea or milestone. Keep it brief and spell-checked three times; the forearm, thigh, or ribcage for the line.' },
      { name: 'Single word', note: 'Strength, breathe, family — the safest, most timeless word choice; tiny on the wrist, collarbone, or behind the ear.' },
    ],
    faqs: [
      { question: `What does a quote tattoo mean?`, answer: `A quote tattoo means a belief or line you want to carry for life. People choose song lyrics, book lines, or family sayings — the wording matters more than the art, so proofread it exactly before it goes on.` },
      { question: `What does a coordinate tattoo symbolize?`, answer: `A coordinate tattoo symbolizes a place that shaped you — a hometown, a meeting spot, or a view. The numbers are private meaning worn in public, readable only to those who know.` },
      { question: `What do roman numeral tattoos represent?`, answer: `Roman numeral tattoos represent a date kept timeless — a birthday, anniversary, or loss. The classic numerals feel permanent and restrained compared to Arabic digits.` },
      { question: `What does a name tattoo mean?`, answer: `A name tattoo honors a person — a child, a parent, a partner. The classic caution is to avoid a romantic partner's name (a frequent removal request); a child's name or your own initials ages far better. The font and placement do as much work as the name itself.` },
      { question: `What font should I choose for a word tattoo?`, answer: `Match the font to longevity: block letters and bold script hold up over decades, while thin, delicate script can blur. Have your artist stencil and check every letter before the needle, and if the phrase is in another language, verify the translation with a native speaker first.` },
    ],
  },
};
