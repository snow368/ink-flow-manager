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
  {
    symbolSlug: 'wave',
    slug: 'great-wave-kanagawa-tattoo-meaning',
    name: 'Great Wave off Kanagawa Tattoo',
    meaning: 'Nature\'s awe-inspiring power, resilience, humility before the sea, respect for tradition',
    desc: 'The Great Wave off Kanagawa tattoo is based on Katsushika Hokusai\'s ca. 1830–32 woodblock print — the single most recognizable wave image in the world. A towering crest with claw-like foam dwarfs tiny fishing boats while a small Mount Fuji sits inside the wave\'s hollow. As a tattoo it means respect for the ocean\'s power, resilience through struggle, and humility before something far larger than yourself.',
    culturalNotes: 'Hokusai\'s print is one of Thirty-Six Views of Mount Fuji and helped redefine how the world sees the wave: not just water, but a force that reduces human endeavor to a small, brave boat. In irezumi the Great Wave frames koi, dragons, or Fuji as a protective water-deity composition.',
    customSections: [
      { heading: 'Hokusai and the Print: Thirty-Six Views of Mount Fuji', text: "The Great Wave off Kanagawa (Kanagawa oki nami ura) was published around 1830–32 as the opening print of Hokusai's series Thirty-Six Views of Mount Fuji. He was in his seventies and at the height of his powers, using an imported Prussian blue (bero-ai) palette that gave the wave its deep, electric indigo. The composition is a deliberate trick: Japan's grandest mountain is shrunk to a small triangle inside the curl of the wave, so the sea, not the mountain, dominates. That inversion is the whole point — nature's scale dwarfs human scale." },
      { heading: 'Reading the Composition: Boats, Fuji, and Claw-Foam', text: "Look closely and the meaning is in the details. Three boats ride the trough; the oarsmen are specks beneath a wall of water, yet they persist — survival and grit. The foam breaks into claw- and finger-like tendrils, a signature Hokusai motif that makes the wave feel alive and almost predatory. And Mount Fuji, normally the hero of any Japanese landscape, is relegated to a quiet accent. A Great Wave tattoo lets you carry that exact story: ambition (Fuji) held humbly inside overwhelming force (the wave)." },
      { heading: 'What the Great Wave Means as a Tattoo', text: "As body art the Great Wave stands for the awe-inspiring power of nature against human endeavor, resilience, and reverence for the ocean. It's a favorite for people who've weathered something huge and came out humble rather than bitter — who respect the force that moved through their life. It can also be a pure love-letter to Japanese art history, worn by collectors and Japanophiles alike." },
      { heading: 'Great Wave Pairings: Koi, Dragons, and Fuji', text: "In irezumi the Great Wave rarely sits alone. Koi swimming against the current add perseverance; a dragon adds wisdom balanced against chaos; Mount Fuji (often worked into the background) adds cultural grounding and endurance. Each addition refines the message — choose one or two so the composition stays readable rather than crowded." },
      { heading: 'Great Wave Tattoo Style and Placement', text: "The classic look is bold traditional Japanese: strong indigo and white foam, heavy contrast, often as a sleeve, back piece, or forearm scene. A minimalist or microrealism take can shrink the crest to a single fine-line curl for a subtler nod. Because the composition is dynamic, it wraps beautifully around limbs and ribs — let your artist use the body's curve the way Hokusai used the print's edge." },
    ],
    faqs: [
      { question: 'What does a Great Wave off Kanagawa tattoo mean?', answer: 'It means respect for the ocean\'s overwhelming power, resilience through struggle, and humility before nature. The tiny boats persisting under the towering crest symbolize survival and grit; the small Mount Fuji inside the wave is ambition held humbly within force.' },
      { question: 'Who painted the Great Wave off Kanagawa?', answer: 'Katsushika Hokusai (1760–1849), the Japanese ukiyo-e artist. He published it around 1830–32 as the opening print of his series Thirty-Six Views of Mount Fuji, using imported Prussian blue for its signature deep indigo.' },
      { question: 'Why is the Great Wave so famous?', answer: 'It\'s a masterclass in composition and perspective — Hokusai shrinks Mount Fuji to a small triangle inside the wave\'s hollow so the sea dominates. Its claw-like foam and dramatic energy made it an icon of world art, later influencing Debussy\'s La Mer and global tattoo culture.' },
      { question: 'What does the Great Wave symbolize in Japanese tattoo (irezumi)?', answer: 'In irezumi the wave is a living force: strength through adversity, survival and grit, and protection through reverence for water spirits. It often frames koi, dragons, or Mount Fuji as a protective water-deity composition.' },
      { question: 'What should I pair with a Great Wave tattoo?', answer: 'The classic irezumi pairings are koi (perseverance), dragon (wisdom vs chaos), and Mount Fuji (endurance and cultural grounding). Pick one or two so the scene stays readable.' },
      { question: 'Is the Great Wave the same as seigaiha?', answer: 'No. The Great Wave is one dramatic crashing crest; seigaiha is a repeating pattern of concentric wave arcs meaning peace and good fortune. They are different symbols with different meanings.' },
      { question: 'Where is the best placement for a Great Wave tattoo?', answer: 'Its dynamic curve wraps well around the forearm, sleeve, ribs, or back. A full back or sleeve shows the whole scene; a fine-line microrealism version can sit on the wrist or ankle for a subtler reference.' },
      { question: 'What does a minimalist Great Wave tattoo mean?', answer: 'A single fine-line crest keeps the meaning — respect for the ocean, resilience, humility — but reads as quiet personal strength rather than a bold statement. It\'s popular for first tattoos or matching pieces.' },
      { question: 'Does the Great Wave tattoo have a spiritual meaning?', answer: 'For many wearers it\'s spiritual without being religious: a reminder of our small, brave place within something vast, and of returning to calm after the crest breaks. It places you inside nature\'s cycle rather than above it.' },
    ],
    externalSource: 'https://www.metmuseum.org/art/collection/search/45434',
    sourceLabel: 'Met Museum — The Great Wave',
    sources: [
      { label: 'The Metropolitan Museum of Art — Under the Wave off Kanagawa (The Great Wave), Katsushika Hokusai, ca. 1830–32', url: 'https://www.metmuseum.org/art/collection/search/45434' },
      { label: 'Britannica — Katsushika Hokusai (Japanese ukiyo-e artist, 1760–1849)', url: 'https://www.britannica.com/biography/Hokusai' },
    ],
    designSvgs: ['wave-1.svg', 'wave-2.svg'],
  },
  {
    symbolSlug: 'wave',
    slug: 'japanese-wave-seigaiha-tattoo-meaning',
    name: 'Seigaiha (Japanese Wave Pattern) Tattoo',
    meaning: 'Peace, good fortune, prosperity, continuity, protection against negativity',
    desc: 'A seigaiha tattoo is not a single crashing wave — it\'s the Japanese "blue ocean wave" pattern of overlapping concentric arcs, like calm ripples spreading across the sea. It symbolizes peace, good fortune, prosperity, and the endless continuity of life. In irezumi it is also read as a protective barrier against negativity and a wish for longevity.',
    culturalNotes: 'Seigaiha (青海波) appears in Japanese art for centuries — on kimonos, fukusa (ceremonial cloths), and even old maps to denote oceans. The repeating arcs evoke the calm, rhythmic spread of waves, making the pattern a quiet emblem of harmony rather than a dramatic force.',
    customSections: [
      { heading: 'What Seigaiha Actually Is', text: "Seigaiha (青海波, 'blue ocean wave') is a pattern, not a picture. It\'s built from overlapping concentric arcs arranged in offset rows so each 'wave' nests inside the next, creating the look of ripples spreading endlessly across the surface. Visually it reads as calm, orderly, and serene — the opposite energy of a single towering breaker. That difference is the whole reason it deserves its own page: people searching 'seigaiha tattoo' want the pattern, not Hokusai\'s Great Wave." },
      { heading: 'The Symbolism: Peace, Fortune, Continuity', text: "Each layer of meaning builds on the image. Peace and calm — the soft, rhythmic nature of the pattern. Good fortune and prosperity — the unbroken, overlapping flow suggests an endless, abundant future. Continuity and connectivity — the repeating arcs illustrate life\'s interconnected, always-moving cycle. In irezumi specifically, seigaiha is read as a protective barrier against negativity and a symbol of longevity. It\'s a quietly powerful emblem of harmony with nature." },
      { heading: 'Seigaiha vs. the Great Wave: Don\'t Confuse Them', text: "The most common mix-up: the Great Wave is ONE dramatic crashing crest (nature as overwhelming force, resilience through struggle); seigaiha is MANY gentle repeating arcs (peace, fortune, continuity). They are different symbols with different meanings and different looks. If you want one iconic, dynamic crest, choose the Great Wave; if you want a serene, repeating pattern of waves, choose seigaiha." },
      { heading: 'Where Seigaiha Appears in Japanese Culture', text: "Seigaiha has dressed Japan for centuries. It appears on kimonos and fukusa (ceremonial cloths), as a decorative motif on armour and lacquerware, and historically even on maps to denote oceans and water. In gagaku (classical court music) one piece is named Seigaiha, and its dance is considered among the most graceful. Wearing the pattern connects you to that long, elegant visual tradition." },
      { heading: 'Seigaiha Tattoo Style and Placement', text: "The pattern shines as a background, a sleeve band, or a shoulder/back field of repeating waves — often in fine blue linework or filled indigo. It pairs naturally with other Japanese motifs (koi, cranes, cherry blossom) as a 'sea' texture behind a central figure. Because it repeats, it scales beautifully: a small seigaiha arc on the wrist reads as quiet luck, while a full seigaiha sleeve reads as a complete philosophy of flow and continuity." },
    ],
    faqs: [
      { question: 'What does a seigaiha tattoo mean?', answer: 'Seigaiha (青海波) means peace, good fortune, prosperity, and the endless continuity of life. In Japanese tattoo (irezumi) it is also read as a protective barrier against negativity and a wish for longevity.' },
      { question: 'What is seigaiha?', answer: 'Seigaiha is a Japanese pattern of overlapping concentric arcs — "blue ocean wave" — that looks like calm ripples spreading across the sea. It is a repeating pattern, not a single wave picture.' },
      { question: 'Is seigaiha the same as the Great Wave off Kanagawa?', answer: 'No. The Great Wave is one dramatic crashing crest symbolizing nature\'s power and resilience; seigaiha is a repeating pattern of gentle arcs symbolizing peace and good fortune. Different symbols, different meanings.' },
      { question: 'Why is seigaiha considered protective?', answer: 'In irezumi the overlapping waves form a barrier-like field, so seigaiha is read as a protective screen against negativity and a bringer of longevity — a quiet ward rather than a fierce guardian.' },
      { question: 'Where does the seigaiha pattern come from?', answer: 'It appears in Japanese art for centuries — on kimonos, fukusa, armour, lacquerware, and even old maps denoting oceans. A piece of gagaku (classical court music) is also named Seigaiha.' },
      { question: 'What does seigaiha pair well with?', answer: 'As a "sea" texture it pairs naturally with koi, cranes, cherry blossom, or a central dragon, usually as a background field behind the main figure. It also works alone as a wrist arc or sleeve band.' },
      { question: 'What is the best placement for a seigaiha tattoo?', answer: 'It scales well: a small arc on the wrist or ankle reads as quiet luck, while a full seigaiha sleeve, shoulder, or back reads as a complete philosophy of flow and continuity.' },
      { question: 'Does seigaiha have a spiritual meaning?', answer: 'Yes — its endless, repeating motion symbolizes life\'s continuity and our connection to nature\'s cycle, making it a serene, spiritual emblem of harmony rather than a dramatic force.' },
      { question: 'What colors work for a seigaiha tattoo?', answer: 'Traditionally indigo or blue linework (true to "blue ocean wave"), but it also works in black-and-grey or with a single accent. Keep the arcs clean so the repeating rhythm stays readable.' },
    ],
    externalSource: 'https://www.metmuseum.org/art/collection/search/45434',
    sourceLabel: 'Met Museum — Japanese wave art (The Great Wave)',
    sources: [
      { label: 'The Metropolitan Museum of Art — Under the Wave off Kanagawa (The Great Wave), Katsushika Hokusai, ca. 1830–32 (Japanese wave-art context)', url: 'https://www.metmuseum.org/art/collection/search/45434' },
      { label: 'Britannica — Katsushika Hokusai (Japanese ukiyo-e artist, 1760–1849)', url: 'https://www.britannica.com/biography/Hokusai' },
    ],
    designSvgs: ['wave-1.svg', 'wave-2.svg'],
  },
];

export function getVariant(symbolSlug: string, slug: string): TattooVariantMeaning | undefined {
  return VARIANT_MEANINGS.find((v) => v.symbolSlug === symbolSlug && v.slug === slug);
}

export function getVariantsForSymbol(symbolSlug: string): TattooVariantMeaning[] {
  return VARIANT_MEANINGS.filter((v) => v.symbolSlug === symbolSlug);
}
