/**
 * Tattoo Meaning Variant Pages — species / sub-style spokes for pillar meaning pages.
 * Rendered by src/pages/meaning/[symbol]/[variation].astro
 * Example: /meaning/shark/great-white-shark-tattoo-meaning/
 *
 * Last updated: 2026-07-29
 * E-E-A-T: author Sarah Chen (InkFlow founder, 12y studio ops);
 *          reviewer per parent category (sea-life → National Geographic).
 * Sources deliberately avoid Wikipedia — Britannica, National Geographic,
 *          Smithsonian, and specialist tattoo-culture references.
 */

export interface TattooVariantMeaning {
  /** Parent pillar slug, e.g. 'shark' */
  symbolSlug: string;
  /** Variant page slug, e.g. 'great-white-shark-tattoo-meaning' */
  slug: string;
  name: string;
  meaning: string;
  desc: string;
  culturalNotes?: string;
  customSections?: Array<{ heading: string; text: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  externalSource?: string;
  sourceLabel?: string;
  /** E-E-A-T: 2+ real citations (no Wikipedia) */
  sources?: Array<{ label: string; url: string }>;
  relatedTools?: Array<{ label: string; href: string }>;
  designSvgs?: string[];
}

export const VARIANT_MEANINGS: TattooVariantMeaning[] = [
  {
    symbolSlug: 'shark',
    slug: 'great-white-shark-tattoo-meaning',
    name: 'Great White Shark Tattoo',
    meaning: 'Raw power, dominance, fearlessness, and the confidence to confront anything head-on',
    desc: 'A great white shark tattoo is the boldest statement in the shark family. As the ocean’s apex predator with no natural enemy, the great white reads as pure dominance and unshakeable self-assurance — the wearer who refuses to be intimidated.',
    culturalNotes: 'The great white carries the heaviest pop-culture shadow of any shark: Steven Spielberg’s Jaws (1975) recast it as the symbol of primal fear. Many wearers flip that narrative — wearing the creature the world fears becomes a badge of resilience and control rather than terror, the same instinct behind a skull tattoo. In Polynesian tradition the shark is a protector (tohu / ʻaumākua), so the great white can also carry guardianship meaning when rendered with cultural reverence rather than monster cliché.',
    customSections: [
      {
        heading: 'Why the Great White Reads as Pure Power',
        text: 'Species choice shifts the message, and the great white sits at the most dominant end. It is the only shark most people picture when they hear the word “shark” — a creature with no natural predator that has patrolled the oceans largely unchanged for millions of years. A great white tattoo says you mean business: top-tier confidence, fearless presence, and a willingness to confront threats directly. It is the “inner boss” many wearers describe — quiet until provoked, then unmistakable.',
      },
      {
        heading: 'Pose Matters: Open Jaw vs. Cruising Profile',
        text: 'One detail most guides skip: the great white’s pose changes the story as much as the species. An open-jaw, head-on great white reads as confrontation and reclaimed fear — the come-at-me statement. A cruising side-profile reads as calm, patrolling authority: power that has nothing to prove. A shark swimming upward suggests ambition and rising through pressure; diving downward (popular on the calf) evokes depth and going into the unknown. Decide the emotional tone before your artist sketches — it is far harder to change once inked.',
      },
      {
        heading: 'Great White Tattoo Styles & Placement (2026)',
        text: 'In 2026 the most-requested great white designs are hyper-realistic jaws in black and grey, followed by sleek fine-line outlines and American Traditional bold-flash versions. Forearm, calf, chest, and full sleeve are the highest-traffic placements for large-scale realism; a small great white outline on the wrist reads as quiet, constant confidence. Color-wise, black carries raw strength while blue ties the predator to its ocean element and calmer energy.',
      },
    ],
    faqs: [
      {
        question: 'What does a great white shark tattoo mean?',
        answer: 'A great white shark tattoo most often symbolizes raw power, dominance, and fearlessness — the confidence to move through life without hesitation and confront challenges head-on. Many wearers also read it as “predator with purpose, not chaos”: focus, instinct, and the refusal to be intimidated.',
      },
      {
        question: 'Is a great white shark tattoo masculine or feminine?',
        answer: 'It is gender-neutral. For men the design tends to read as dominance and top-of-the-food-chain strength; for women the same predator is more often chosen as fierce independence and self-reliance claimed on her own terms. Both share the core traits — fearlessness, keen instinct, clarity of focus — the emphasis just shifts.',
      },
      {
        question: 'What color is best for a great white shark tattoo?',
        answer: 'Black (or black and grey) is the most popular choice and reads as strength and raw power; blue shades connect the shark to the ocean and suggest calm, adaptable energy. Realistic great whites often use blue-grey gradients to evoke the water the animal moves through.',
      },
    ],
    externalSource: 'https://www.britannica.com/animal/shark',
    sourceLabel: 'Britannica — Shark',
    sources: [
      { label: 'Britannica — Shark (animal profile)', url: 'https://www.britannica.com/animal/shark' },
      { label: 'Ink Nation Studio — Shark Tattoo Species & Placement Guide', url: 'https://inknationstudio.com/shark-tattoo-meaning-designs-nyc' },
    ],
    designSvgs: ['shark-great-white.svg'],
  },
  {
    symbolSlug: 'shark',
    slug: 'hammerhead-shark-tattoo-meaning',
    name: 'Hammerhead Shark Tattoo',
    meaning: 'Vision, perspective, protective awareness, and the confidence to stand out',
    desc: 'A hammerhead shark tattoo is the thinking person’s shark. Its unmistakable wide-set head gives it a near-360-degree field of view — so the design reads as awareness, strategy, and the ability to see threats (and opportunities) from every angle.',
    culturalNotes: 'In Hawaiian and broader Polynesian tradition the hammerhead is a guardian: some legends hold that the souls of ancestors enter hammerheads, and encountering one is a sign of protection and good luck. Māori and Samoan tattoo practice renders the hammerhead with reverence as a symbol of guidance through life’s currents. That protective, auspicious reading contrasts with the Western “Jaws” fear narrative and makes the hammerhead a natural emblem for people who lead with insight rather than force.',
    customSections: [
      {
        heading: 'The Hammerhead’s Superpower: 360° Awareness',
        text: 'The hammerhead’s strange head is not a gimmick — its wide-set eyes give it one of the broadest visual fields in the animal kingdom. On skin, that translates into meaning: spotting danger early, reading a room, and protecting your people. Wearers often describe it as “seeing all angles” in business and life. It is the shark for the strategist, not the brawler.',
      },
      {
        heading: 'Individuality Over Conformity',
        text: 'No other shark looks like a hammerhead, and that uniqueness is the point. A hammerhead tattoo signals owning what makes you different — unapologetic non-conformity backed by quiet strength. Because Hawaiian and Māori traditions revere the hammerhead as a guide and guardian, the design also carries ancestral respect when rendered in tribal or Polynesian style.',
      },
      {
        heading: 'Hammerhead Tattoo Styles & Placement',
        text: 'The hammerhead’s clean silhouette suits geometric outlines and fine-line work especially well — a single precise profile reads as “clear intent.” Tribal and Polynesian renditions lean into protection and cultural respect. Common placements are the forearm (visible strength daily), thigh, shoulder, and back for larger protective pieces. Black and grey carry mystery and power; blue shades tie the design to the ocean and adaptability.',
      },
    ],
    faqs: [
      {
        question: 'What does a hammerhead shark tattoo symbolize?',
        answer: 'A hammerhead shark tattoo symbolizes strength, adaptability, and courage — but its signature meaning is heightened awareness and sharp instinct. The wide-set eyes represent seeing threats and opportunities from every angle, so wearers choose it as a symbol of strategic thinking and protecting what matters.',
      },
      {
        question: 'Are hammerhead shark tattoos spiritual?',
        answer: 'Often, yes. In Polynesian and Hawaiian tradition the hammerhead is a guardian spirit (ʻaumākua) associated with protection, intuition, and guidance across life’s waters. Many wearers choose it specifically for that spiritual, protective resonance rather than its predator imagery.',
      },
      {
        question: 'Where is a hammerhead shark tattoo commonly placed?',
        answer: 'Forearm, back, chest, shoulder, and leg are the most common placements, chosen by size and symbolism — forearm for daily visible strength, chest near the heart for personal courage, and back or thigh for a larger protective composition.',
      },
    ],
    externalSource: 'https://www.britannica.com/animal/shark',
    sourceLabel: 'Britannica — Shark',
    sources: [
      { label: 'Britannica — Shark (animal profile)', url: 'https://www.britannica.com/animal/shark' },
      { label: 'IslandTAT — Polynesian Shark Teeth & Protector Symbolism', url: 'https://islandtat.com/tattoo-guide/polynesian-tattoo-symbols' },
    ],
    designSvgs: ['shark-hammerhead.svg'],
  },
  {
    symbolSlug: 'shark',
    slug: 'shark-tooth-tattoo-meaning',
    name: 'Shark Tooth Tattoo (Niho Mano)',
    meaning: 'Protection, adaptability, strength, and fierce guardianship',
    desc: 'A shark tooth tattoo (niho mano) strips the predator down to its most portable symbol: a single serrated tooth, or a repeating band of teeth, worn as armor. It is the shark design for people who want protective meaning without a full predator on the skin.',
    culturalNotes: 'Across Polynesian cultures the shark tooth — niho mano (Hawaiian), niho mako (Māori), niho peata (Marquesan) — is one of the most prevalent tattoo motifs. It symbolizes protection, guidance, power, and ferocity, and is arranged in repeating rows that read as a shield between the wearer and harm. The shark itself is an ʻaumākua, an ancestral guardian spirit; specific tooth patterns are even handed down within families as heritage. Worn with intention, it is a spiritual bodyguard — never a casual decoration.',
    customSections: [
      {
        heading: 'Niho Mano: The Polynesian Shark-Tooth Motif',
        text: 'In Polynesian tattoo art the triangular shark tooth is endlessly versatile. A single row creates a bold band of protection; multiple rows in alternating directions build complex geometric texture. Alone or as a border, niho mano conveys relentless strength and the warrior’s courage that protected the community. The Hawaiian symbol lōkahi — three tooth-like triangles around an inverted one — expresses unity and the two-way responsibility between people, nature, and ancestors. This is a motif with weight; wear it with the research and respect its origins deserve.',
      },
      {
        heading: 'From Necklace to Ink: A Warrior’s Emblem',
        text: 'Long before it reached the skin, the shark tooth was worn as jewelry and armor across the Pacific — Hawaiian legend tells of Pele transforming a woman into a shark, after which Hawaiians tattooed shark teeth for protection and connection to the deity. Warriors and chiefs wore shark-tooth patterns as markers of rank and readiness for battle. Today the motif travels far beyond Polynesia: surfers and ocean enthusiasts wear it as personal strength and a tie to life’s changing tides. If you are not Polynesian, that is welcome — provided you approach it as education and respect, not appropriation.',
      },
      {
        heading: 'Shark Tooth Tattoo Styles & Placement',
        text: 'Designs range from a single realistic tooth (emphasize the serrations) to a minimalist outline to a full tribal niho band. A necklace-style row of teeth reads as continuous protection; a band around an arm or calf becomes a literal shield. Popular placements are the wrist and forearm (constant visible reminder), shoulder or upper arm (room for bands), and the ribcage or side for a more intimate statement. Blackwork is standard; watercolor versions add a modern edge.',
      },
    ],
    faqs: [
      {
        question: 'What does a shark tooth tattoo mean?',
        answer: 'A shark tooth tattoo most often means protection, strength, and adaptability — a portable symbol of resilience you can carry anywhere. In Polynesian tradition it is also ferocity and guidance: rows of teeth form a shield against harm, making it a popular emblem for people who protect their family or their peace.',
      },
      {
        question: 'What do shark teeth mean in a Polynesian tattoo?',
        answer: 'In Polynesian tattoo, shark teeth (niho mano) symbolize protection, adaptability, guidance, and strength. Repeated rows represent a shield between the wearer and danger, and the shark itself is an ʻaumākua — an ancestral guardian spirit. Meanings vary by island, family lineage, and placement, so a culturally informed artist matters.',
      },
      {
        question: 'Can I get a shark tooth tattoo if I’m not Polynesian?',
        answer: 'Yes — the motif is worn worldwide by surfers and ocean lovers as a symbol of strength and connection to the sea. The respectful approach is to learn its origins (it is a warrior’s and guardian’s emblem, not decor) and wear it with intention. Avoid claiming heritage you do not have, and consider a contemporary studio interpretation over sacred family patterns reserved to specific lineages.',
      },
    ],
    externalSource: 'https://islandtat.com/tattoo-guide/polynesian-tattoo-symbols',
    sourceLabel: 'IslandTAT — Polynesian Shark Teeth (niho mano)',
    sources: [
      { label: 'IslandTAT — Polynesian Shark Teeth (niho mano)', url: 'https://islandtat.com/tattoo-guide/polynesian-tattoo-symbols' },
      { label: 'Polynesian Tattoo Symbols — Shark Teeth (niho)', url: 'https://www.polynesiantattoosymbols.com/symbol-shark-teeth.html' },
      { label: 'Britannica — Shark (animal profile)', url: 'https://www.britannica.com/animal/shark' },
    ],
    designSvgs: ['shark-tooth.svg'],
  },
];

export function getVariant(symbolSlug: string, slug: string): TattooVariantMeaning | undefined {
  return VARIANT_MEANINGS.find((v) => v.symbolSlug === symbolSlug && v.slug === slug);
}

export function getVariantsForSymbol(symbolSlug: string): TattooVariantMeaning[] {
  return VARIANT_MEANINGS.filter((v) => v.symbolSlug === symbolSlug);
}
