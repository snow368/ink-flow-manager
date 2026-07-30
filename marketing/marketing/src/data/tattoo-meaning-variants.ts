/**
 * Tattoo Meaning Variant Pages — species / sub-style spokes for pillar meaning pages.
 * Rendered by src/pages/tattoo-meaning/[category]/[symbol]/[variation].astro
 * Example: /tattoo-meaning/ocean/shark-tattoo-meaning/great-white-shark-tattoo-meaning/
 *
 * Last updated: 2026-07-30 (merged thick spoke content: 9-11 FAQs + 6-8 deep sections each)
 * Slugs use the FULL search phrase (great-white-shark-..., hammerhead-shark-...) because
 * real queries are "great white shark tattoo meaning", never "great white tattoo".
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
    meaning: 'Raw power, dominance, fearlessness, apex authority, reclaimed fear',
    desc: 'The great white is the most recognizable shark on earth — and the most misunderstood. A great white tattoo reads as pure power: the apex predator with no natural enemy, moving through the water with total authority. For many wearers it is about reclaimed fear — wearing the very creature the world is afraid of, flipping terror into a personal badge of edge and resilience.',
    culturalNotes: 'The great white straddles two opposite readings. In the West it became the monster of Jaws (1975) — primal fear made flesh. But across Polynesian tattoo the shark (tohu, or mano) is a protector, and the great white simply amplifies that guardian power to its maximum. Wearing one can mean you have faced your own fear and came out dominant. Modern surf culture often reads the great white as respect for the ocean’s raw, untamed force.',
    customSections: [
      { heading: 'The Science Most Tattoo Guides Get Wrong', text: "Tattoo blogs love to say sharks must swim forever to breathe — so a shark tattoo means ‘keep moving.’ That is false for the great white. Like many sharks, it can buccal-pump to rest, and researchers have filmed great whites hovering nearly motionless. The ‘relentless motion’ reading is a powerful personal metaphor, but claim it as your story, not as shark biology. The real great-white facts worth inking: it is the largest predatory fish alive (females can exceed 20 feet), its bite is a sensory feat of ampullae of Lorenzini that detect electric fields, and it has patrolled oceans since before the dinosaurs." },
      { heading: 'The Vulnerable Paradox: Powerful Yet Threatened', text: "Here is the tension that makes a great white tattoo interesting. It is the ocean’s apex predator — yet the IUCN lists it as vulnerable, and some regional populations are still a fraction of their mid-20th-century size after culling, the fin trade, and bycatch. For many wearers this is the point: the most feared animal on earth is also one of the most fragile. A great white can honor that paradox — dominance that still needs protection — rather than the snarling-monster cliché." },
      { heading: 'Reclaiming Jaws: From Movie Monster to Personal Badge', text: "No animal carries heavier pop-culture baggage than the great white. Spielberg’s Jaws (1975) recast it as primal terror — and that is exactly why many people choose it. Wearing the creature the world is afraid of flips the narrative into a badge of edge, resilience, and control. It is the same instinct behind a skull tattoo: turning a symbol of fear into a personal statement of fearlessness. Tell your artist if you want a reverent, realistic great white rather than the movie-poster snarl." },
      { heading: 'Polynesian Roots: The Protector, Not the Prey', text: "Western culture sees the great white as the hunter; Polynesian tattoo sees the shark (tohu, or mano) as a protector. Across Hawaii, Samoa, and Māori tradition the shark is an ʻaumākua — a family guardian spirit — and a great white simply amplifies that guardianship to maximum strength. So a great white can mean protection of your family and safe passage, not just aggression. The niho (shark-tooth) pattern is worn as literal armor against harm." },
      { heading: 'Pose and Style: What Changes the Meaning', text: "Open-jaw, head-on great white = confrontation and reclaimed fear. Cruising side-profile = calm, patrolling authority. Swimming upward = ambition and rising through pressure; diving downward = depth and the unknown. Blackwork or solid silhouette = raw, minimal power; realistic color = reverence and awe. Decide the emotional tone before your artist sketches — it is far harder to change once inked." },
      { heading: 'Great White Tattoo Styles & Placement (2026)', text: 'In 2026 the most-requested great white designs are hyper-realistic jaws in black and grey, followed by sleek fine-line outlines and American Traditional bold-flash versions. Forearm, calf, chest, and full sleeve are the highest-traffic placements for large-scale realism; a small great white outline on the wrist reads as quiet, constant confidence. Color-wise, black carries raw strength while blue ties the predator to its ocean element and calmer energy.' },
      { heading: 'Great White vs. the Rest of the Shark World', text: "Pick the species whose story matches your intent. Great white = pure power and dominance. Hammerhead = vision and protective awareness (wide-set eyes, near-360 view). Whale shark = peace and quiet strength. Mako = speed and agility. Tiger shark = survival instinct and raw adaptability. A shark-tooth (niho mano) pattern gives you pure protective symbolism without committing to a full predator. If dominance and authority are your story, the great white is the unambiguous choice." },
    ],
    faqs: [
      { question: 'What does a great white shark tattoo mean?', answer: 'A great white reads as pure, untamed power — the apex predator with no natural enemy. Most wearers choose it for dominance, fearlessness, and reclaimed fear: wearing the creature the world fears flips terror into a personal badge of edge and resilience.' },
      { question: 'Is a great white tattoo a conservation statement?', answer: 'Increasingly, yes. The great white is listed as vulnerable by the IUCN, with some populations still recovering from decades of culling and the fin trade. Many modern wearers choose the great white as a quiet act of respect for a keystone ocean species rather than a monster to be slain.' },
      { question: 'Does the great white have to keep moving to breathe?', answer: 'This is the myth that will not die. Unlike some sharks, the great white does not need to swim constantly to breathe — it can use buccal pumping to rest. So a "keep moving" great white tattoo is symbolic, not biological fact. The relentless-forward-drive reading is yours to claim, not the fish’s requirement.' },
      { question: 'What does a great white tattoo mean for a man?', answer: 'For men it most often reads as raw dominance and apex authority — top of the food chain, nothing to prove, moving through life without hesitation. Pair it with waves for element, or a compass for direction and resolve.' },
      { question: 'What does a great white tattoo mean for a woman?', answer: 'For women the great white is usually reclaimed power on her own terms — owning the predator the world fears, rather than a gendered dominance statement. The posture and fine-line vs bold style carry the intent more than the wearer’s gender.' },
      { question: 'Great white vs hammerhead — which should I pick?', answer: 'A great white reads as pure power and dominance; a hammerhead reads as vision, perspective, and protective awareness. If your story is about force and authority, choose the great white. If it is about clarity and guarding others, the hammerhead fits better.' },
      { question: 'What does a Jaws-style great white mean?', answer: 'The Jaws (1975) great white is pop-culture fear incarnate — so choosing it is often about reclaiming that fear: the edge, the resilience, the control. It is the same instinct behind a skull tattoo, turning a symbol of terror into a statement of fearlessness.' },
      { question: 'What does a great white silhouette tattoo mean?', answer: 'A solid-black or fine-line silhouette strips the great white to its unmistakable outline: minimalist focus, quiet dominance, a little ominous. Blackwork reads as raw power and foreboding rather than the decorative tones of a color piece.' },
      { question: 'What color is best for a great white shark tattoo?', answer: 'Black (or black and grey) is the most popular choice and reads as strength and raw power; blue shades connect the shark to the ocean and suggest calm, adaptable energy. Realistic great whites often use blue-grey gradients to evoke the water the animal moves through.' },
      { question: 'Can I pair a great white with other symbols?', answer: 'Yes — a wave ties it to its element and doubles the "push through life’s currents" metaphor; a compass adds direction; an anchor adds maritime roots. In Japanese irezumi the shark is a protective water-deity messenger, so pairing with dragons or koi builds a master-of-the-water composition.' },
    ],
    externalSource: 'https://www.nationalgeographic.com/animals/fish/facts/great-white-shark',
    sourceLabel: 'National Geographic — Great White Shark',
    sources: [
      { label: 'National Geographic — Great White Shark (facts)', url: 'https://www.nationalgeographic.com/animals/fish/facts/great-white-shark' },
      { label: 'Britannica — Shark (animal profile)', url: 'https://www.britannica.com/animal/shark' },
      { label: 'Ink Nation Studio — Shark Tattoo Species & Placement Guide', url: 'https://inknationstudio.com/shark-tattoo-meaning-designs-nyc' },
    ],
    designSvgs: ['shark-great-white.svg'],
  },
  {
    symbolSlug: 'shark',
    slug: 'hammerhead-shark-tattoo-meaning',
    name: 'Hammerhead Shark Tattoo',
    meaning: 'Vision, perspective, protective awareness, individuality, balance',
    desc: 'The hammerhead is the shark with the most distinctive silhouette — and the richest secondary meaning. Its wide-set eyes give it nearly all-around vision, so a hammerhead tattoo reads as perspective and awareness: seeing what others miss, watching your back, protecting those around you. It is also the shark of the individualist — unmistakable, a little strange, impossible to confuse with anything else.',
    culturalNotes: 'Where the great white is blunt force, the hammerhead is cunning awareness. Its "hammer" (the cephalofoil) is one of the ocean’s great evolutionary experiments — and wearing it signals that you value perception over raw power. In conservation circles the hammerhead has become a flagship for shark protection, because several species (scalloped, great, smooth) are among the most threatened of all sharks from the fin trade. In Hawaiian and broader Polynesian tradition the hammerhead is a guardian: some legends hold that the souls of ancestors enter hammerheads, and encountering one is a sign of protection and good luck.',
    customSections: [
      { heading: 'The Cephalofoil: Why the "Hammer" Exists', text: "The hammerhead’s head is not a mistake or a gimmick — it is one of the ocean’s great evolutionary tools. Spreading the eyes and the electrosensory ampullae of Lorenzini across a wide bar lets the shark sweep for the electric fields of buried stingrays and turn with sudden precision to pin them. Biologists call the head the cephalofoil. So when you wear a hammerhead, you are wearing a symbol of perception and precision — seeing and sensing what others cannot." },
      { heading: 'The 360-Degree Myth (and What Is Actually True)', text: "Tattoo and social-media posts love to claim the hammerhead sees 360 degrees. The real anatomy is more interesting but less tidy: the wide-set eyes give strong binocular forward vision and an extremely broad field, yet there are blind spots directly behind and below the head. The honest reading — wide awareness with a few blind spots — is actually a better life metaphor than the myth. Claim the perception, not the cartoon." },
      { heading: 'The Individualist Shark', text: "No shark is easier to recognize than the hammerhead. That unmistakable silhouette is why so many wearers choose it as a symbol of individuality — being original, refusing to blend in, owning a shape the world remembers. If your story is about standing apart rather than dominating, the hammerhead speaks where the great white shouts." },
      { heading: 'A Flagship for Conservation', text: "Several hammerhead species — scalloped, great, and smooth hammerheads — are among the most threatened of all sharks, driven down hard by the fin trade. The hammerhead has become a conservation flagship: an extraordinary, vulnerable animal worth protecting. For many wearers the tattoo is reverence for that paradox, not fear of a predator." },
      { heading: 'Protective Awareness Over Raw Power', text: "Where the great white is blunt force, the hammerhead is guarding awareness. Its meaning leans toward watching over others, sensing danger early, and seeing the full picture. That makes it a natural pairing with other guardian ocean symbols — a whale, a sea turtle, or the niho shark-tooth pattern worn as armor." },
      { heading: 'Pose, School, and Style', text: "A lone hammerhead = individuality and self-reliance. A school of hammerheads = community and collective protection, since some species migrate and rest in large groups — rare social behavior for sharks. Blackwork silhouette stresses the iconic outline; realistic color stresses awe and the strangeness of the real animal. Choose the tone that matches whether your story is about standing alone or standing together." },
      { heading: 'Hammerhead Tattoo Styles & Placement', text: 'The hammerhead’s clean silhouette suits geometric outlines and fine-line work especially well — a single precise profile reads as "clear intent." Tribal and Polynesian renditions lean into protection and cultural respect. Common placements are the forearm (visible strength daily), thigh, shoulder, and back for larger protective pieces. Black and grey carry mystery and power; blue shades tie the design to the ocean and adaptability.' },
    ],
    faqs: [
      { question: 'What does a hammerhead shark tattoo mean?', answer: 'A hammerhead reads as vision and perspective — its wide-set eyes give it nearly all-around sight, so the tattoo means seeing what others miss and protecting those around you. It is also the shark of the individualist: unmistakable, standing apart.' },
      { question: 'Does a hammerhead really see 360 degrees?', answer: 'Not quite, and the myth needs correcting. The eye placement gives excellent binocular forward vision and a very wide field, but the hammerhead has blind spots directly behind and below the head. The "360-degree" claim is tattoo-blog exaggeration. What is true: the cephalofoil is a sensory and maneuvering masterpiece, not a gimmick.' },
      { question: 'Why is the hammerhead’s head shaped like that?', answer: 'The "hammer" (cephalofoil) spreads the eyes and the electrosensory ampullae of Lorenzini across a wider span, boosting the shark’s ability to detect prey’s electric fields and to pin stingrays to the seafloor. It also acts like a wing for sudden turns. So the weird head is a tool for perception and precision — which is exactly why the tattoo means awareness.' },
      { question: 'Is a hammerhead tattoo about individuality?', answer: 'Often, yes. The hammerhead is impossible to confuse with any other shark — a true original. Wearers drawn to it tend to value being distinct rather than fitting in, and the design itself signals "I am not like the rest."' },
      { question: 'Are hammerhead shark tattoos spiritual?', answer: 'Often, yes. In Polynesian and Hawaiian tradition the hammerhead is a guardian spirit (ʻaumākua) associated with protection, intuition, and guidance across life’s waters. Many wearers choose it specifically for that spiritual, protective resonance rather than its predator imagery.' },
      { question: 'What does a hammerhead tattoo mean for conservation?', answer: 'Several hammerhead species are among the most threatened sharks, heavily targeted by the fin trade. For many wearers the hammerhead is a flagship for ocean protection — a way to honor a vulnerable, extraordinary animal rather than fear it.' },
      { question: 'Hammerhead vs great white — which should I pick?', answer: 'Great white = raw power and dominance. Hammerhead = vision, perspective, and protective awareness. If your story is about force, pick the great white; if it is about clarity, perception, and guarding others, the hammerhead fits.' },
      { question: 'What does a hammerhead silhouette tattoo mean?', answer: 'A blackwork or fine-line hammerhead silhouette strips the design to its unmistakable outline — individuality and quiet awareness rather than aggression. The shape alone carries the meaning; you do not need a full realistic predator.' },
      { question: 'Where is a hammerhead shark tattoo commonly placed?', answer: 'Forearm, back, chest, shoulder, and leg are the most common placements, chosen by size and symbolism — forearm for daily visible strength, chest near the heart for personal courage, and back or thigh for a larger protective composition.' },
      { question: 'What does a hammerhead school tattoo mean?', answer: 'Some hammerhead species migrate and rest in large schools — a striking, social behavior rare among sharks. A school of hammerheads can mean community, collective protection, and strength in numbers, balancing the individualist single-shark reading.' },
      { question: 'Can I pair a hammerhead with other symbols?', answer: 'Yes — a wave ties it to its element; a compass adds direction and "seeing the way"; an anchor adds maritime roots. Because the hammerhead means protective awareness, pairing it with a guardian symbol (like a whale or turtle) reinforces the "watching over others" reading.' },
    ],
    externalSource: 'https://www.britannica.com/animal/hammerhead-shark',
    sourceLabel: 'Britannica — Hammerhead Shark',
    sources: [
      { label: 'Britannica — Hammerhead Shark (animal profile)', url: 'https://www.britannica.com/animal/hammerhead-shark' },
      { label: 'IslandTAT — Polynesian Shark Teeth & Protector Symbolism', url: 'https://islandtat.com/tattoo-guide/polynesian-tattoo-symbols' },
    ],
    designSvgs: ['shark-hammerhead.svg'],
  },
  {
    symbolSlug: 'shark',
    slug: 'shark-tooth-tattoo-meaning',
    name: 'Shark Tooth Tattoo (Niho Mano)',
    meaning: 'Protection, courage, guidance, warrior spirit, ancestral connection',
    desc: 'The shark tooth — the niho mano in Polynesian tattoo — is one of the oldest protective symbols in the Pacific. A shark-tooth tattoo reads as armor: courage, guidance, and shielding yourself and your family from harm. Unlike a full predator, the tooth is portable protection — a small, repeatable motif you can weave through any design.',
    culturalNotes: 'In Polynesian tattoo the niho is the tooth of the shark — a primary guardian. It is a common misconception that "niho" simply means "tooth"; in tattoo context it specifically references the shark tooth and the protective mana of the mano (shark). Worn as a repeating pattern (the niho or "dog-tooth" zigzag), it is armor against harm and a marker of warrior status. In Hawaiian culture the shark is an ʻaumākua, a family guardian spirit, so the tooth connects the wearer to ancestral protection. The lokahi (unity) principle — balance of land, sea, and sky — is often expressed through niho borders that frame a larger piece.',
    customSections: [
      { heading: 'Niho Mano: The Grammar of the Tooth', text: "A frequent error is translating niho as simply ‘tooth.’ In Polynesian tattoo the niho specifically references the shark tooth (mano) and the protective mana carried in it. The repeating niho — sometimes called the ‘dog-tooth’ zigzag — is one of the most widespread guardian motifs across Samoa, Tonga, and Māori work. So the word is not an anatomy lesson; it is a protective title. Knowing this changes how you wear it: as guardian armor, not decoration." },
      { heading: 'The ʻAumākua Connection: Ancestral Protection', text: "In Hawaiian tradition the shark is an ʻaumākua — a family guardian spirit passed down through generations. The niho connects the wearer to that lineage of protection and to safe passage over water. This is why the tooth is often worn close to the body and close to the heart: it is less about the individual predator and more about the ancestors watching over you. Frame it with intention, not as a random pattern." },
      { heading: 'Lokahi: The Tooth as a Frame for Balance', text: "Lokahi is the Hawaiian principle of unity — land, sea, and sky in balance. Niho borders are frequently used to frame a larger composition that expresses lokahi, reminding the wearer to keep every part of life in harmony. In this role the shark tooth becomes a boundary of wholeness: it protects the edges so the center can hold. A tooth band around a piece is rarely just ornamental in traditional logic." },
      { heading: 'From Necklace to Ink: A Warrior’s Emblem', text: 'Long before it reached the skin, the shark tooth was worn as jewelry and armor across the Pacific — Hawaiian legend tells of Pele transforming a woman into a shark, after which Hawaiians tattooed shark teeth for protection and connection to the deity. Warriors and chiefs wore shark-tooth patterns as markers of rank and readiness for battle. Today the motif travels far beyond Polynesia: surfers and ocean enthusiasts wear it as personal strength and a tie to life’s changing tides.' },
      { heading: 'Marquesan Multi-Grammar: One Animal, Many Teeth', text: "Marquesan tattoo uses several distinct shark-tooth shapes — often called pike or spearhead motifs — each with a slightly different grammatical role in the overall composition. The same animal yields multiple protective variants depending on placement, orientation, and what it is combined with. This is a useful reminder that ‘shark tooth’ is not one symbol but a family of them; the specific shape you choose carries a specific protective intent." },
      { heading: 'Wearing It Respectfully', text: "The niho is not a generic ‘tribal’ doodle. The respectful approach for non-Polynesian wearers: learn the meaning, credit the source culture, avoid carelessly mixing sacred motifs, and where possible consult or work with a Polynesian artist. Appreciation with attribution beats appropriation without context. A well-researched niho honors the tradition; a copied ‘tribal band’ from a flash sheet often does not." },
      { heading: 'Shark Tooth Tattoo Styles & Placement', text: 'Designs range from a single realistic tooth (emphasize the serrations) to a minimalist outline to a full tribal niho band. A necklace-style row of teeth reads as continuous protection; a band around an arm or calf becomes a literal shield. Popular placements are the wrist and forearm (constant visible reminder), shoulder or upper arm (room for bands), and the ribcage or side for a more intimate statement. Blackwork is standard; watercolor versions add a modern edge.' },
      { heading: 'Tooth vs. Predator: Choosing Your Symbol', text: "A full shark embodies the animal’s specific story — great white dominance, hammerhead vision. The shark tooth is portable, repeatable protection you can weave into any design: a band, a border, a single focal point. If you want guardian armor you can carry anywhere, the niho is the move. If you want to become the predator’s story, wear the full shark. Many wearers do both — a niho band framing a great white, uniting protection and power." },
    ],
    faqs: [
      { question: 'What does a shark tooth tattoo mean?', answer: 'A shark tooth (niho mano in Polynesian tattoo) is primarily a protective symbol — armor against harm, courage, and guidance. Worn as a repeating zigzag pattern it marks warrior status and shields the wearer and family. It is portable protection, unlike a full predator.' },
      { question: 'What does "niho" mean in Polynesian tattoo?', answer: 'A common simplification is that niho just means "tooth." In tattoo context, niho specifically references the shark tooth and the protective mana of the mano (shark). The repeating niho or "dog-tooth" zigzag is one of the most widespread protective motifs across Polynesian, Samoan, and Māori work — so the word carries guardian meaning, not just anatomy.' },
      { question: 'Is the shark tooth an ʻaumākua symbol?', answer: 'In Hawaiian culture the shark is an ʻaumākua — a family guardian spirit. Wearing the niho connects the wearer to that ancestral protection and safe passage over water. It is less about the individual animal and more about the lineage of guardians watching over you.' },
      { question: 'What is lokahi and how does it relate to shark tooth tattoos?', answer: 'Lokahi is the Hawaiian principle of unity and balance — specifically land (ʻāina), sea (kai), and sky (lekua) in harmony. Niho borders are often used to frame a larger piece expressing lokahi, reminding the wearer to keep all parts of life in balance. The tooth becomes a frame for wholeness, not just a standalone charm.' },
      { question: 'What is the Marquesan shark tooth meaning?', answer: 'In Marquesan tattoo the shark tooth (often called the "pike" or spearhead motif) is a symbol of protection and ferocity in battle — a warrior’s mark. Marquesan work uses multiple distinct tooth shapes with slightly different grammatical roles, so the same animal yields several protective variants depending on placement and combination.' },
      { question: 'Is it respectful to get a shark tooth tattoo if I am not Polynesian?', answer: 'Many non-Polynesian wearers honor the niho as a protection symbol while crediting its roots. The respectful approach: learn the meaning, credit the source culture, avoid mixing sacred motifs carelessly, and consider working with or consulting a Polynesian artist. Appreciation with attribution beats appropriation without context.' },
      { question: 'Does the shark tooth mean courage?', answer: 'Yes. The tooth is the weapon and the trophy of the ocean’s apex predator, so wearing it signals courage and a warrior spirit — facing danger rather than fleeing. As a repeating pattern it becomes armor: quiet, constant, worn close to the skin.' },
      { question: 'How do I wear a shark tooth pattern?', answer: 'The niho works as a band (arm, leg, wrist), a border framing a larger piece, or a single bold tooth as a focal point. It pairs naturally with waves (element), turtles (guidance), and the full shark (source of the tooth). Because it is small and repeatable, it is one of the most versatile protective motifs in the Pacific vocabulary.' },
      { question: 'Shark tooth vs full shark tattoo — which should I pick?', answer: 'A full shark (great white, hammerhead) is a statement of the predator’s specific traits — power, vision, dominance. The shark tooth is portable, repeatable protection you can weave anywhere. Pick the tooth if you want guardian armor; pick the full shark if you want to embody the animal’s story.' },
    ],
    externalSource: 'https://www.polynesiantattoosymbols.com/shark-teeth-tattoo/',
    sourceLabel: 'Polynesian Tattoo Symbols — Shark Teeth',
    sources: [
      { label: 'Polynesian Tattoo Symbols — Shark Teeth (niho)', url: 'https://www.polynesiantattoosymbols.com/shark-teeth-tattoo/' },
      { label: 'IslandTAT — Polynesian Shark Teeth (niho mano)', url: 'https://islandtat.com/tattoo-guide/polynesian-tattoo-symbols' },
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
