/**
 * Tattoo Meanings Data — 15 categories × 70 symbols
 * Last updated: 2026-07-12
 * Sources: Cultural studies, historical references, industry knowledge
 *
 * Category taxonomy (for "X tattoo meaning" keyword classification):
 *   animals · flowers · mythological · geometric · religious · cultural ·
 *   nature · objects · modern · birds · zodiac · insects · sea-life ·
 *   time · words
 * Rule: a keyword goes into an EXISTING category when one fits; only create a
 * NEW category (small class / 小类) when no existing category covers the topic.
 */

export interface TattooMeaning {
  slug: string;
  name: string;
  meaning: string;
  desc: string;
  category: string;
  origin?: string;
  culturalNotes?: string;
  customSections?: Array<{ heading: string; text: string }>;
  variants?: string[];
  /** EEAT: external source URL */
  externalSource?: string;
  /** EEAT: source label */
  sourceLabel?: string;
  /** Internal links to related commercial pages / free tools (site-structure blueprint) */
  relatedTools?: { label: string; href: string }[];
}

export interface TattooCategory {
  id: string;
  name: string;
  desc: string;
  symbols: TattooMeaning[];
}

export const TATTOO_CATEGORIES: TattooCategory[] = [
  // ===== 1. ANIMALS (6) =====
  {
    id: 'animals',
    name: 'Animals',
    desc: 'Animal symbolism in tattoo art — loyalty, strength, instinct, and freedom.',
    symbols: [
      {
        slug: 'wolf', name: 'Wolf', category: 'animals',
        meaning: 'Loyalty, family, instinct, protection, freedom',
        desc: 'The wolf tattoo represents pack loyalty, leadership, and protection. A howling wolf symbolizes communication with the spirit world and instinctual guidance. Wolf tattoos are among the most popular animal designs in Western and tribal tattoo traditions.',
        origin: 'Native American, Norse, Celtic',
        culturalNotes: 'In Native American traditions, the wolf is a teacher and pathfinder. In Norse mythology, Fenrir is a monstrous wolf. Celtic lore sees the wolf as a guide through the wilderness.',
        variants: ['howling wolf', 'wolf pack', 'lone wolf', 'wolf and moon', 'tribal wolf', 'geometric wolf', 'wolf paw', 'dire wolf'],
        externalSource: 'https://en.wikipedia.org/wiki/Wolf_in_heraldry',
        sourceLabel: 'Wikipedia — Wolf in heraldry',
        customSections: [
          { heading: 'Wolf Pack Meaning', text: 'A wolf pack tattoo represents loyalty to family or community. Each member has a role, and the pack thrives through cooperation. Popular with sports teams, military units, and close-knit friend groups.' },
          { heading: 'Lone Wolf Meaning', text: 'The lone wolf symbolizes independence, self-reliance, and survival instinct. It represents someone who walks their own path but retains the strength of the pack within. Often chosen by introverts and solo entrepreneurs.' },
        ],
      },
      {
        slug: 'lion', name: 'Lion', category: 'animals',
        meaning: 'Courage, royalty, strength, leadership, pride',
        desc: 'The lion tattoo symbolizes courage, royalty, and majestic strength. As king of the jungle, the lion represents leadership and authority. A lion with a crown adds royal symbolism, while a lioness represents protective motherhood.',
        origin: 'African, European heraldry, Biblical',
        culturalNotes: 'In African cultures, the lion is a symbol of royalty and strength. In Christian tradition, the Lion of Judah represents Jesus. Heraldic lions appear on coats of arms across Europe.',
        variants: ['lion head', 'lion and crown', 'lioness', 'lion and lamb', 'tribal lion'],
        externalSource: 'https://en.wikipedia.org/wiki/Lion_(heraldry)',
        sourceLabel: 'Wikipedia — Lion in heraldry',
      },
      {
        slug: 'snake', name: 'Snake', category: 'animals',
        meaning: 'Transformation, rebirth, healing, temptation, wisdom',
        desc: 'The snake tattoo carries dual symbolism — danger and healing, death and rebirth. The Ouroboros (snake eating its own tail) represents eternity and the cycle of life. Snakes are associated with medical healing (Rod of Asclepius) and temptation in Biblical tradition.',
        origin: 'Greek, Egyptian, Norse, Biblical',
        culturalNotes: 'In Greek mythology, snakes are sacred to Asclepius (healing). The Egyptian Wadjet is a cobra goddess of protection. In Norse myth, Jörmungandr is the world serpent. In Hinduism, the kundalini is a coiled serpent energy.',
        variants: ['ouroboros', 'coiled snake', 'snake and dagger', 'snake and skull', 'tribal serpent'],
        externalSource: 'https://en.wikipedia.org/wiki/Snake_worship',
        sourceLabel: 'Wikipedia — Snake worship',
      },
      {
        slug: 'eagle', name: 'Eagle', category: 'animals',
        meaning: 'Freedom, vision, power, courage, spiritual protection',
        desc: 'The eagle tattoo embodies freedom, far-sighted vision, and supreme power. Eagles soar above earthly concerns — a symbol of spiritual aspiration. The bald eagle represents American patriotism, while the golden eagle symbolizes nobility in many cultures.',
        origin: 'Native American, Roman, American, Nordic',
        culturalNotes: 'In Native American cultures, the eagle is a sacred messenger to the Creator. Eagle feathers are earned honors. The Roman aquila was a legion\'s standard. In Norse myth, a giant eagle sits atop Yggdrasil.',
        variants: ['flying eagle', 'eagle head', 'american eagle', 'eagle and flag', 'eagle and snake'],
        externalSource: 'https://en.wikipedia.org/wiki/Eagle_(heraldry)',
        sourceLabel: 'Wikipedia — Eagle in heraldry',
      },
      {
        slug: 'butterfly', name: 'Butterfly', category: 'animals',
        meaning: 'Transformation, freedom, rebirth, beauty, new beginnings',
        desc: 'Butterfly tattoos mark major life changes and personal growth. The metamorphosis from caterpillar to butterfly represents profound transformation. In many cultures, butterflies also symbolize the soul and spiritual evolution.',
        origin: 'Global, Japanese, Greek',
        culturalNotes: 'In Japanese culture, the butterfly represents joy and longevity. Ancient Greeks saw the butterfly as the soul (Psyche). In many Native American traditions, butterflies bring dreams and messages from spirit.',
        variants: ['monarch butterfly', 'butterfly and flower', 'flying butterflies', 'butterfly wing', 'tribal butterfly'],
        externalSource: 'https://en.wikipedia.org/wiki/Butterfly_(symbolism)',
        sourceLabel: 'Wikipedia — Butterfly symbolism',
      },
      {
        slug: 'owl', name: 'Owl', category: 'animals',
        meaning: 'Wisdom, knowledge, mystery, intuition, nocturnal vision',
        desc: 'The owl tattoo represents wisdom, keen observation, and the ability to see what others miss. Owls are associated with Athena, the Greek goddess of wisdom. Their nocturnal nature also connects them to mystery, magic, and the unseen world.',
        origin: 'Greek, Native American, Celtic, Japanese',
        culturalNotes: 'In Greek mythology, the owl is Athena\'s sacred bird (wisdom). Some Native American tribes see the owl as a protector, while others associate it with death omens. In Japan, owls are lucky charms (fukurou = no hardship).',
        variants: ['owl eye', 'owl and moon', 'realistic owl', 'tribal owl', 'minimalist owl'],
        externalSource: 'https://en.wikipedia.org/wiki/Owl_(symbolism)',
        sourceLabel: 'Wikipedia — Owl symbolism',
      },
    ],
  },

  // ===== 2. FLOWERS (5) =====
  {
    id: 'flowers',
    name: 'Flowers',
    desc: 'Floral tattoo symbolism — beauty, growth, love, and the cycle of life.',
    symbols: [
      {
        slug: 'rose', name: 'Rose', category: 'flowers',
        meaning: 'Love, passion, beauty, balance, secrecy',
        desc: 'The rose is the most popular tattoo design worldwide. Red roses symbolize passionate love. Black roses represent loss, rebellion, or grief. Yellow roses mean friendship. A rose with thorns shows beauty with hardship. A budding rose signifies new love or new beginnings.',
        origin: 'Greek, Roman, Christian, Victorian',
        culturalNotes: 'In Greek myth, the rose was created by Aphrodite. In Roman times, roses were hung above meeting tables (sub rosa = secret). In Christian iconography, the rose is associated with the Virgin Mary. Victorian flower language assigned specific meanings to rose colors.',
        variants: ['red rose', 'black rose', 'rose and dagger', 'rose and skull', 'rose vine', 'tribal rose', 'compass rose'],
        externalSource: 'https://en.wikipedia.org/wiki/Rose_(symbolism)',
        sourceLabel: 'Wikipedia — Rose symbolism',
      },
      {
        slug: 'lotus', name: 'Lotus', category: 'flowers',
        meaning: 'Enlightenment, rebirth, purity, spiritual awakening',
        desc: 'The lotus flower grows from muddy water yet blooms pristine — a powerful metaphor for rising above suffering to achieve enlightenment. Lotus tattoos are deeply spiritual, rooted in Buddhist and Hindu traditions. A closed bud represents potential, a full bloom represents enlightenment.',
        origin: 'Buddhist, Hindu, Egyptian',
        culturalNotes: 'In Buddhism, the lotus represents the journey from ignorance (mud) to enlightenment (bloom). Each color has meaning: white = spiritual purity, pink = Buddha\'s earthly symbol, blue = wisdom. In Egypt, the blue lotus represented creation and rebirth.',
        variants: ['lotus bloom', 'lotus and koi', 'mandala lotus', 'tribal lotus', 'geometric lotus'],
        externalSource: 'https://en.wikipedia.org/wiki/Lotus_(symbolism)',
        sourceLabel: 'Wikipedia — Lotus symbolism',
      },
      {
        slug: 'cherry-blossom', name: 'Cherry Blossom', category: 'flowers',
        meaning: 'Mortality, beauty, renewal, fleeting nature of life',
        desc: 'Cherry blossom (sakura) tattoos celebrate the transient beauty of life. In Japanese culture, the brief blooming period of cherry blossoms reminds us that life is beautiful but short. These delicate pink flowers represent renewal, hope, and the spring season.',
        origin: 'Japanese',
        culturalNotes: 'In Japan, sakura viewing (hanami) is a centuries-old tradition. The falling petals represent the warrior\'s ideal — a glorious end. Samurai sometimes adopted cherry blossom as their symbol.',
        variants: ['falling petals', 'cherry blossom branch', 'sakura and crane', 'cherry blossom sleeve', 'minimalist sakura'],
        externalSource: 'https://en.wikipedia.org/wiki/Cherry_blossom_(symbolism)',
        sourceLabel: 'Wikipedia — Cherry blossom symbolism',
      },
      {
        slug: 'sunflower', name: 'Sunflower', category: 'flowers',
        meaning: 'Devotion, loyalty, warmth, happiness, adoration',
        desc: 'Sunflower tattoos symbolize unwavering faith and loyalty — the flower always turns toward the sun. They represent warmth, positivity, and the pursuit of light. Sunflowers are also associated with harvest, abundance, and summer.',
        origin: 'Greek (myth), Native American',
        culturalNotes: 'In Greek myth, the nymph Clytie was turned into a sunflower after pining for Apollo (the sun god). For some Native American tribes, sunflowers represent harvest and provision. In modern culture, sunflowers symbolize mental health awareness and support.',
        variants: ['single sunflower', 'sunflower field', 'sunflower and bee', 'minimalist sunflower', 'watercolor sunflower'],
        externalSource: 'https://en.wikipedia.org/wiki/Sunflower',
        sourceLabel: 'Wikipedia — Sunflower',
      },
      {
        slug: 'peony', name: 'Peony', category: 'flowers',
        meaning: 'Wealth, honor, prosperity, romance, bravery',
        desc: 'Peony tattoos are rich in symbolism — prosperity, honor, and romantic love. In traditional Japanese tattooing, the peony is a classic motif paired with dragons, lions, or koi. Its layered petals represent abundance and a full, rich life.',
        origin: 'Chinese, Japanese',
        culturalNotes: 'In China, the peony is the king of flowers — symbolizing wealth and honor. In Japanese irezumi, peonies represent prosperity and are often paired with guardian lion-dogs (komainu). The layered petals symbolize layers of meaning in life.',
        variants: ['peony bloom', 'peony and dragon', 'peony and koi', 'traditional japanese peony', 'watercolor peony'],
        externalSource: 'https://en.wikipedia.org/wiki/Peony',
        sourceLabel: 'Wikipedia — Peony',
      },
    ],
  },

  // ===== 3. MYTHOLOGICAL (5) =====
  {
    id: 'mythological',
    name: 'Mythological',
    desc: 'Mythical creatures and legendary beings — power, mystery, and timeless stories.',
    symbols: [
      {
        slug: 'phoenix', name: 'Phoenix', category: 'mythological',
        meaning: 'Resurrection, renewal, triumph over adversity, immortality',
        desc: 'The phoenix is a mythical firebird that cyclically rises from its own ashes. Phoenix tattoos represent overcoming devastating loss, personal transformation, and the indomitable human spirit. Each time it rises, it emerges stronger than before.',
        origin: 'Greek, Egyptian, Chinese',
        culturalNotes: 'In Greek mythology, the phoenix lives for 500 years before self-immolating and rising anew. The Egyptian Bennu bird was a similar sun-symbol. In Chinese tradition, the Fenghuang is a celestial bird representing virtue and grace.',
        variants: ['rising phoenix', 'phoenix fire', 'phoenix and sun', 'phoenix and dragon', 'geometric phoenix'],
        externalSource: 'https://en.wikipedia.org/wiki/Phoenix_(mythology)',
        sourceLabel: 'Wikipedia — Phoenix',
      },
      {
        slug: 'dragon', name: 'Dragon', category: 'mythological',
        meaning: 'Power, wisdom, protection, strength, good fortune',
        desc: 'Dragon tattoos differ vastly between Eastern and Western traditions. In Japanese irezumi, dragons are benevolent water beings that bring wisdom, protection, and good fortune. European dragons are fire-breathing hoarders representing chaos to be conquered.',
        origin: 'Chinese, Japanese, European',
        culturalNotes: 'In Chinese culture, dragons are symbols of imperial power, strength, and good luck. In Japanese tattooing, dragons represent wisdom and protection. European dragons are typically malevolent, representing greed and destruction — the knight\'s foe.',
        variants: ['japanese dragon', 'chinese dragon', 'dragon and tiger', 'geometric dragon', 'dragon sleeve'],
        externalSource: 'https://en.wikipedia.org/wiki/Dragon_(symbolism)',
        sourceLabel: 'Wikipedia — Dragon symbolism',
      },
      {
        slug: 'koi-fish', name: 'Koi Fish', category: 'mythological',
        meaning: 'Perseverance, determination, ambition, good fortune',
        desc: 'The koi fish tattoo represents overcoming adversity through determination. According to legend, a koi that swims upstream and climbs a waterfall becomes a dragon. Koi colors carry specific meanings: gold = wealth, black = success, red = love, blue = peace.',
        origin: 'Japanese, Chinese',
        culturalNotes: 'In Japanese culture, koi symbolize perseverance — they swim against the current. In feng shui, koi attract good fortune. Koi tattoos are classic irezumi motifs, often paired with water, lotus flowers, or peonies.',
        variants: ['koi and water', 'koi and lotus', 'koi and dragon', 'koi sleeve', 'koi and wave'],
        externalSource: 'https://en.wikipedia.org/wiki/Koi',
        sourceLabel: 'Wikipedia — Koi',
      },
      {
        slug: 'griffin', name: 'Griffin', category: 'mythological',
        meaning: 'Guardianship, courage, nobility, vigilance, divine power',
        desc: 'The griffin — part eagle, part lion — combines the king of birds and king of beasts. Griffin tattoos represent guardianship, nobility, and divine power. In heraldry, griffins protect treasures and symbolize military courage.',
        origin: 'Greek, Persian, Medieval heraldry',
        culturalNotes: 'In Greek tradition, griffins guarded the gold of Scythia. In Persian art, the griffin (homa) was a mythical bird of happiness. Medieval heralds used griffins to symbolize vigilance and courage.',
        variants: ['griffin head', 'flying griffin', 'griffin and shield', 'heraldic griffin', 'griffin warrior'],
        externalSource: 'https://en.wikipedia.org/wiki/Griffin',
        sourceLabel: 'Wikipedia — Griffin',
      },
      {
        slug: 'mermaid', name: 'Mermaid', category: 'mythological',
        meaning: 'Mystery, seduction, duality, freedom, the unknown',
        desc: 'Mermaid tattoos blend human and oceanic elements — representing duality, mystery, and the allure of the unknown. They symbolize feminine power, independence, and the depth of emotion. Mermaids can also represent a connection to the sea.',
        origin: 'Greek, Norse, European folklore',
        culturalNotes: 'Greek mythology gave us the Sirens — half-bird, later half-fish — who lured sailors. Norse folklore had the havfrue (sea woman). European tales often portrayed mermaids as omens of storms or good fortune. In modern culture, mermaids represent feminine empowerment.',
        variants: ['realistic mermaid', 'traditional mermaid', 'mermaid and ship', 'mermaid silhouette', 'siren'],
        externalSource: 'https://en.wikipedia.org/wiki/Mermaid',
        sourceLabel: 'Wikipedia — Mermaid',
      },
    ],
  },

  // ===== 4. GEOMETRIC & CELESTIAL (11) =====
  {
    id: 'geometric',
    name: 'Geometric & Celestial',
    desc: 'Sacred geometry and cosmic symbols — order, balance, and connection to the universe.',
    symbols: [
      {
        slug: 'mandala', name: 'Mandala', category: 'geometric',
        meaning: 'Wholeness, unity, harmony, spiritual journey, cosmic order',
        desc: 'Mandala tattoos represent the universe and the self in perfect balance. Based on Hindu and Buddhist spiritual symbols, mandalas are circular designs that draw the eye inward toward the center — the point of focus and meditation.',
        origin: 'Hindu, Buddhist, Native American',
        culturalNotes: 'In Hinduism and Buddhism, mandalas are meditation aids representing the cosmos. Tibetan sand mandalas are created and then destroyed to teach impermanence. Native American medicine wheels share similar concentric symbolism.',
        variants: ['lotus mandala', 'flower mandala', 'geometric mandala', 'compass mandala', 'mandala and elephant'],
        externalSource: 'https://en.wikipedia.org/wiki/Mandala',
        sourceLabel: 'Wikipedia — Mandala',
      },
      {
        slug: 'compass', name: 'Compass', category: 'geometric',
        meaning: 'Guidance, direction, travel, purpose, exploration',
        desc: 'Compass tattoos represent finding your way — both literally and metaphorically. They symbolize guidance, purpose, and the journey of life. A compass points true north, reminding the wearer to stay true to their path.',
        origin: 'Maritime, European exploration',
        culturalNotes: 'Compasses were essential tools for maritime navigation. The compass rose was a symbol of exploration and discovery. In modern tattooing, compass tattoos are popular with travelers, military personnel, and anyone at a life crossroads.',
        variants: ['compass rose', 'vintage compass', 'compass and map', 'compass and anchor', 'geometric compass'],
        externalSource: 'https://en.wikipedia.org/wiki/Compass_(drawing_tool)',
        sourceLabel: 'Wikipedia — Compass',
      },
      {
        slug: 'moon', name: 'Moon', category: 'geometric',
        meaning: 'Femininity, intuition, change, mystery, the subconscious',
        desc: 'Moon tattoos represent the cycles of life, feminine energy, and the mysterious power of the night. The crescent moon is associated with growth and new beginnings. A full moon represents completion and spiritual fullness.',
        origin: 'Global (all cultures)',
        culturalNotes: 'In many cultures, the moon is associated with feminine deities (Artemis, Selene, Chandra). Lunar phases represent the cycle of birth, growth, death, and rebirth. The crescent moon is a symbol of Islam and also represents Diana the huntress.',
        variants: ['crescent moon', 'moon and star', 'sun and moon', 'moon phase', 'tribal moon'],
        externalSource: 'https://en.wikipedia.org/wiki/Moon_(symbolism)',
        sourceLabel: 'Wikipedia — Moon symbolism',
      },
      {
        slug: 'arrow', name: 'Arrow', category: 'geometric',
        meaning: 'Direction, focus, moving forward, survival, protection',
        desc: 'Arrow tattoos symbolize moving forward — an arrow can only be shot by pulling it backward. They represent focus, determination, and hitting your target. A broken arrow signifies peace or the end of a conflict.',
        origin: 'Native American, Greek, Global',
        culturalNotes: 'For Native Americans, the arrow was both a tool for survival and a symbol of protection. In Greek myth, arrows of Eros/Cupid represented love. A bundle of arrows symbolizes strength in unity.',
        variants: ['single arrow', 'crossed arrows', 'arrow and bow', 'broken arrow', 'arrow and compass'],
        externalSource: 'https://en.wikipedia.org/wiki/Arrow_(symbol)',
        sourceLabel: 'Wikipedia — Arrow symbol',
      },
      {
        slug: 'star', name: 'Star', category: 'geometric',
        meaning: 'Aspiration, guidance, excellence, hope, destiny',
        desc: 'Star tattoos represent reaching for the highest aspirations. A five-pointed star has varied meanings — from military rank to magical protection. The North Star (Nautical star) represents guidance and staying on course through life\'s journey.',
        origin: 'Global, Maritime, American',
        culturalNotes: 'Sailors traditionally tattooed the North Star as a symbol of guidance and a safe return home. The five-pointed star represents the five wounds of Christ in Christianity. In paganism, the pentagram represents the elements and spirit.',
        variants: ['nautical star', 'shooting star', 'star cluster', 'star and moon', 'geometric star'],
        externalSource: 'https://en.wikipedia.org/wiki/Star_(symbolism)',
        sourceLabel: 'Wikipedia — Star symbolism',
      },
      {
        slug: 'infinity', name: 'Infinity', category: 'geometric',
        meaning: 'Eternity, limitlessness, unity, endless cycle',
        desc: 'The infinity symbol (∞) represents something without end — eternal love, limitless possibility, and the endless cycle of life. Infinity tattoos often pair with other symbols (arrows, hearts, names) to show a bond that has no end. A double infinity represents two lives intertwined forever.',
        origin: 'Mathematics (17th c.), Modern tattoo',
        culturalNotes: 'The infinity symbol was introduced by mathematician John Wallis in 1655. In tattooing, it became popular as a minimalist symbol of forever — often used for memorial tattoos, couple tattoos, and family bonds. Paired with an arrow, it shows forward motion without end.',
        variants: ['infinity and arrow', 'double infinity', 'infinity loop', 'infinity with names', 'infinity and heart'],
        externalSource: 'https://en.wikipedia.org/wiki/Infinity_symbol',
        sourceLabel: 'Wikipedia — Infinity symbol',
      },
      {
        slug: 'sun', name: 'Sun', category: 'geometric',
        meaning: 'Life, energy, vitality, truth, rebirth',
        desc: 'Sun tattoos represent the source of all life — energy, vitality, and the triumph of light over darkness. The rising sun symbolizes new beginnings and hope. A sun with a face (sunface) draws from Indigenous and Japanese imagery. The sun and moon together represent balance of masculine and feminine, day and night.',
        origin: 'Egyptian, Japanese, Inca, Global',
        culturalNotes: 'In Egyptian mythology, Ra is the sun god who sails across the sky each day. In Japanese tradition, the sun goddess Amaterasu is the ancestress of the imperial line. The Inca Inti was the sun deity. In many cultures, the sun represents the divine masculine and enlightenment.',
        variants: ['rising sun', 'sun and moon', 'sun rays', 'sunface', 'minimalist sun'],
        externalSource: 'https://en.wikipedia.org/wiki/Sun_(symbolism)',
        sourceLabel: 'Wikipedia — Sun symbolism',
      },
      {
        slug: 'galaxy', name: 'Galaxy', category: 'geometric',
        meaning: 'Wonder, infinite possibility, the cosmos, perspective',
        desc: 'Galaxy tattoos capture the vastness of the universe — a reminder of how small our problems are against the cosmic scale. They represent wonder, infinite possibility, and the mystery of creation. Spiral galaxies echo the Fibonacci patterns found throughout nature.',
        origin: 'Modern / Scientific',
        culturalNotes: 'As astronomy advanced, cosmic imagery entered tattoo art. Galaxy and space tattoos surged in popularity with the rise of astrophotography and a cultural fascination with the universe. They often symbolize a love of science or a sense of awe.',
        variants: ['spiral galaxy', 'galaxy sleeve', 'galaxy and planets', 'minimalist galaxy', 'watercolor galaxy'],
        externalSource: 'https://en.wikipedia.org/wiki/Galaxy',
        sourceLabel: 'Wikipedia — Galaxy',
      },
      {
        slug: 'comet', name: 'Comet', category: 'geometric',
        meaning: 'Change, rare opportunity, destiny, a wish',
        desc: 'Comet tattoos symbolize rare and transformative moments — a once-in-a-lifetime opportunity or a wish made on a falling star. They represent change, destiny, and the beauty of fleeting events. A comet trailing across the skin suggests movement toward a fateful encounter.',
        origin: 'Global, Astronomical',
        culturalNotes: 'Throughout history, comets were seen as omens — sometimes of doom, sometimes of great change. In modern culture, a comet (or shooting star) is where you make a wish. Halley\'s Comet tattoos mark the years it appears (every 75 years).',
        variants: ['comet trail', 'shooting star comet', 'comet and moon', 'minimalist comet', 'comet and planet'],
        externalSource: 'https://en.wikipedia.org/wiki/Comet',
        sourceLabel: 'Wikipedia — Comet',
      },
      {
        slug: 'planet', name: 'Planet', category: 'geometric',
        meaning: 'Exploration, the unknown, individuality, the cosmos',
        desc: 'Planet tattoos represent exploration, curiosity, and our place in the universe. Saturn with its rings is the most popular — symbolizing time, boundaries, and structure. A planet can represent a personal world, a child, or the unknown awaiting discovery.',
        origin: 'Modern / Scientific',
        culturalNotes: 'Saturn\'s rings have made it a tattoo favorite, often paired with stars or a crescent moon. Planets appeal to those drawn to science, astronomy, and the idea that we are stardust. They symbolize both grounding (a world) and aspiration (the beyond).',
        variants: ['saturn rings', 'earth', 'minimalist planet', 'planet and moon', 'solar system'],
        externalSource: 'https://en.wikipedia.org/wiki/Planet',
        sourceLabel: 'Wikipedia — Planet',
      },
      {
        slug: 'aurora', name: 'Aurora', category: 'geometric',
        meaning: 'Hope, magic, transformation, wonder',
        desc: 'Aurora (northern lights) tattoos capture one of nature\'s most magical displays — shifting curtains of green and violet light. They represent hope after darkness, transformation, and the quiet wonder of the natural world. An aurora often marks a journey to see something rare and beautiful.',
        origin: 'Nordic, Indigenous (Sami, Inuit)',
        culturalNotes: 'For the Sami and other Arctic peoples, the aurora is woven into folklore — sometimes ancestors dancing, sometimes omens. In modern tattoo culture, aurora designs symbolize hope, resilience, and the magic of the earth. They pair beautifully with mountains or night skies.',
        variants: ['aurora and mountains', 'aurora borealis', 'aurora sleeve', 'minimalist aurora', 'aurora and stars'],
        externalSource: 'https://en.wikipedia.org/wiki/Aurora_(astronomy)',
        sourceLabel: 'Wikipedia — Aurora',
      },
    ],
  },

  // ===== 5. RELIGIOUS / SPIRITUAL (4) =====
  {
    id: 'religious',
    name: 'Religious & Spiritual',
    desc: 'Faith, spirituality, and divine connection through sacred symbols.',
    symbols: [
      {
        slug: 'cross', name: 'Cross', category: 'religious',
        meaning: 'Faith, sacrifice, salvation, hope, divine love',
        desc: 'The cross is the most recognized Christian symbol, representing Jesus Christ\'s sacrifice and the promise of eternal life. Cross tattoos express deep religious faith, hope, and spiritual devotion.',
        origin: 'Christian',
        culturalNotes: 'The cross became the primary Christian symbol after Emperor Constantine. Various styles exist: Latin cross, Celtic cross (with ring), Orthodox cross (three bars), and Jerusalem cross. Each carries specific denominational meaning.',
        variants: ['latin cross', 'celtic cross', 'cross and rosary', 'wooden cross', 'cross and dove'],
        externalSource: 'https://en.wikipedia.org/wiki/Christian_cross',
        sourceLabel: 'Wikipedia — Christian cross',
      },
      {
        slug: 'eye-of-horus', name: 'Eye of Horus', category: 'religious',
        meaning: 'Protection, royal power, good health, wisdom, intuition',
        desc: 'The Eye of Horus (Wedjat) is an ancient Egyptian symbol of protection, royal power, and good health. According to myth, Horus lost his left eye in battle with Set, and it was restored by Thoth — making it a symbol of healing and wholeness.',
        origin: 'Ancient Egyptian',
        culturalNotes: 'The mathematical proportions of the Eye of Horus were used in Egyptian measurement systems. Each part of the eye represents a different sense. Fishermen painted the symbol on boats for protection. It is one of the most popular Egyptian tattoo designs.',
        variants: ['eye of horus', 'eye of ra', 'egyptian eye', 'horus and ankh', 'geometric eye'],
        externalSource: 'https://en.wikipedia.org/wiki/Eye_of_Horus',
        sourceLabel: 'Wikipedia — Eye of Horus',
      },
      {
        slug: 'hamsa', name: 'Hamsa', category: 'religious',
        meaning: 'Protection, blessings, power, divine feminine, luck',
        desc: 'The hamsa (hand of Fatima / hand of Miriam) is a palm-shaped amulet protecting against the evil eye. Hamsa tattoos represent divine protection, blessings, and feminine power. Eyes, fish, or flowers often decorate the palm.',
        origin: 'Middle Eastern, Jewish, North African',
        culturalNotes: 'In Jewish tradition, the hamsa is associated with Miriam (Moses\'s sister). In Islamic tradition, it is the hand of Fatima, the prophet\'s daughter. Both cultures use it as a protective talisman. The five fingers represent the five senses or the five pillars of Islam.',
        variants: ['hamsa with eye', 'hamsa and lotus', 'hamsa with flower', 'flying hamsa', 'minimalist hamsa'],
        externalSource: 'https://en.wikipedia.org/wiki/Hamsa',
        sourceLabel: 'Wikipedia — Hamsa',
      },
      {
        slug: 'om', name: 'Om / Aum', category: 'religious',
        meaning: 'Universal sound, spiritual essence, creation, divine consciousness',
        desc: 'The Om symbol represents the primordial sound of the universe — the vibration from which all creation emerged. Om tattoos connect the wearer to higher consciousness, inner peace, and the unity of body, mind, and spirit.',
        origin: 'Hindu, Buddhist, Jain',
        culturalNotes: 'In Hinduism, Om is the most sacred mantra, the sound of the absolute. It consists of three sounds: A-U-M, representing creation, preservation, and destruction. In Buddhism, Om represents the body, speech, and mind of the Buddha.',
        variants: ['om symbol', 'om and lotus', 'om and mandala', 'om with om mani padme hum', 'om and omkara'],
        externalSource: 'https://en.wikipedia.org/wiki/Om',
        sourceLabel: 'Wikipedia — Om',
      },
    ],
  },

  // ===== 6. CULTURAL / TRIBAL (4) =====
  {
    id: 'cultural',
    name: 'Cultural & Tribal',
    desc: 'Indigenous and ethnic tattoo traditions — identity, heritage, and ancestral power.',
    symbols: [
      {
        slug: 'tribal', name: 'Tribal', category: 'cultural',
        meaning: 'Identity, heritage, strength, belonging, ancestral connection',
        desc: 'Tribal tattoo designs draw from Polynesian, Maori, Native American, and African traditions. Each pattern carries specific meanings — spirals for new life, waves for ocean journeys, spearheads for warriors. Tribal tattoos mark identity, status, and life achievements.',
        origin: 'Polynesian, Maori, Native American, African',
        culturalNotes: 'Maori ta moko is a sacred tradition — facial tattoos tell the wearer\'s genealogy and status. Samoan pe\'a (body tattoo) is a rite of passage. These designs are culturally significant and should be approached with respect and research into their meanings.',
        variants: ['maori tribal', 'polynesian tribal', 'samoan tribal', 'tribal armband', 'tribal sleeve'],
        externalSource: 'https://en.wikipedia.org/wiki/Tribal_tattooing',
        sourceLabel: 'Wikipedia — Tribal tattooing',
      },
      {
        slug: 'celtic-knot', name: 'Celtic Knot', category: 'cultural',
        meaning: 'Eternity, interconnectedness, continuity, spiritual unity',
        desc: 'Celtic knot tattoos feature continuous, interlaced paths with no beginning or end — symbolizing eternity and the interconnected cycle of life, death, and rebirth. Each design carries specific meanings in Celtic tradition.',
        origin: 'Celtic (Irish, Scottish, Welsh)',
        culturalNotes: 'Celtic knotwork dates back to the 5th century, heavily influenced by Coptic Christian art. The Trinity knot (triquetra) represents the Holy Trinity or the three-fold nature of the goddess. The Celtic cross combines the cross with a ring symbolizing eternity.',
        variants: ['trinity knot', 'celtic cross', 'celtic spiral', 'celtic tree of life', 'celtic warrior'],
        externalSource: 'https://en.wikipedia.org/wiki/Celtic_knot',
        sourceLabel: 'Wikipedia — Celtic knot',
      },
      {
        slug: 'dreamcatcher', name: 'Dreamcatcher', category: 'cultural',
        meaning: 'Protection, filtering negativity, good dreams, spiritual guidance',
        desc: 'Dreamcatcher tattoos are based on the Ojibwe tradition of weaving a web to catch bad dreams and let good ones through. They represent protection, filtering negativity, and spiritual connection. Feathers and beads add personal meaning.',
        origin: 'Ojibwe (Chippewa), Native American',
        culturalNotes: 'Traditional dreamcatchers were made with willow hoops and sinew, adorned with sacred feathers and beads. The web catches bad dreams, which dissolve at dawn, while good dreams pass through to the sleeper. Commercially widespread, some tribes ask for cultural respect in their use.',
        variants: ['dreamcatcher and feathers', 'dreamcatcher and moon', 'dreamcatcher with flowers', 'minimalist dreamcatcher', 'native style dreamcatcher'],
        externalSource: 'https://en.wikipedia.org/wiki/Dreamcatcher',
        sourceLabel: 'Wikipedia — Dreamcatcher',
      },
      {
        slug: 'egyptian', name: 'Egyptian Symbols', category: 'cultural',
        meaning: 'Eternal life, divine power, protection, wisdom, judgment',
        desc: 'Ancient Egyptian tattoo symbols include the ankh (eternal life), the scarab beetle (rebirth), the eye of Horus (protection), and the pyramid (ascension). Egyptian-inspired tattoos draw from a 3,000-year-old civilization of powerful mythology and iconic art.',
        origin: 'Ancient Egyptian',
        culturalNotes: 'The ankh was the key of life, carried by gods and pharaohs. The scarab beetle rolls the sun across the sky like a dung beetle — symbol of Khepri, the morning sun. Egyptian tattooing dates back to 2000 BCE, found on priestesses and dancers.',
        variants: ['ankh', 'scarab beetle', 'egyptian eye', 'nefertiti', 'egyptian hieroglyphs'],
        externalSource: 'https://en.wikipedia.org/wiki/Ancient_Egyptian_religion',
        sourceLabel: 'Wikipedia — Ancient Egyptian religion',
      },
    ],
  },

  // ===== 7. NATURE (4) =====
  {
    id: 'nature',
    name: 'Nature',
    desc: 'Natural elements — grounding, growth, and the beauty of the natural world.',
    symbols: [
      {
        slug: 'tree-of-life', name: 'Tree of Life', category: 'nature',
        meaning: 'Growth, family roots, connection, strength, immortality',
        desc: 'The tree of life tattoo represents the connection between heaven, earth, and the underworld. Its roots dig deep while its branches reach for the sky — symbolizing personal growth, family heritage, and the cycle of life.',
        origin: 'Norse, Celtic, Biblical, Buddhist',
        culturalNotes: 'In Norse myth, Yggdrasil is the world tree connecting the nine realms. In Celtic tradition, trees were sacred gateways. The Biblical tree of life stood in the Garden of Eden. In Buddhism, the Bodhi tree is where Buddha achieved enlightenment.',
        variants: ['celtic tree of life', 'tree and roots', 'tree and birds', 'tree with leaves', 'geometric tree'],
        externalSource: 'https://en.wikipedia.org/wiki/Tree_of_life',
        sourceLabel: 'Wikipedia — Tree of life',
      },
      {
        slug: 'wave', name: 'Wave', category: 'nature',
        meaning: 'Power, change, flow of life, resilience, freedom',
        desc: 'The wave tattoo embodies the raw power and constant motion of the ocean. The Great Wave off Kanagawa by Hokusai is the most referenced wave image in tattooing. Waves represent life\'s ups and downs, resilience, and the flow of change.',
        origin: 'Japanese, Maritime, Global',
        culturalNotes: 'In Japanese art, the wave (seigaiha) pattern represents peace and good fortune. The Great Wave is a ukiyo-e woodblock print symbolizing the power of nature against human endeavor. Modern wave tattoos range from minimalist lines to Japanese-style crashing waves paired with koi or dragons.',
        variants: ['the great wave', 'japanese wave sleeve', 'wave and koi', 'line art wave', 'tribal wave'],
        externalSource: 'https://en.wikipedia.org/wiki/The_Great_Wave_off_Kanagawa',
        sourceLabel: 'Wikipedia — The Great Wave off Kanagawa',
      },
      {
        slug: 'mountain', name: 'Mountain', category: 'nature',
        meaning: 'Stability, ambition, endurance, solitude, perspective',
        desc: 'Mountain tattoos represent standing tall against adversity, reaching for higher goals, and finding peace in solitude. Mountains symbolize the journey of life — the climb is hard but the view from the top is worth it.',
        origin: 'Japanese, Native American, Global',
        culturalNotes: 'In Japanese tradition, Mount Fuji is a sacred symbol of immortality. For many Native American tribes, mountains are spiritual power centers. In modern tattooing, mountain silhouettes with pine trees are popular minimalist designs representing a love for the outdoors.',
        variants: ['mountain and forest', 'mountain and sun', 'moon and mountain', 'mountain range', 'geometric mountain'],
        externalSource: 'https://en.wikipedia.org/wiki/Mountain_(symbolism)',
        sourceLabel: 'Wikipedia — Mountain symbolism',
      },
      {
        slug: 'feather', name: 'Feather', category: 'nature',
        meaning: 'Freedom, flight, truth, lightness, spiritual connection',
        desc: 'Feather tattoos symbolize freedom, flight, and spiritual elevation. In many Native American cultures, feathers are sacred gifts representing honor and connection to the divine. A feather can also represent truth (weighing the heart against Maat\'s feather in Egyptian tradition).',
        origin: 'Native American, Egyptian, Global',
        culturalNotes: 'In Egyptian mythology, the goddess Maat weighed hearts against her ostrich feather of truth. Native American eagle feathers are earned honors, given for acts of bravery. In Celtic tradition, feathers connect the human and spirit worlds.',
        variants: ['single feather', 'feather and birds', 'peacock feather', 'feather and arrow', 'watercolor feather'],
        externalSource: 'https://en.wikipedia.org/wiki/Feather_(symbolism)',
        sourceLabel: 'Wikipedia — Feather symbolism',
      },
    ],
  },

  // ===== 8. OBJECTS (4) =====
  {
    id: 'objects',
    name: 'Objects & Symbols',
    desc: 'Meaningful objects — anchors of memory, love, and personal values.',
    symbols: [
      {
        slug: 'anchor', name: 'Anchor', category: 'objects',
        meaning: 'Stability, hope, steadfastness, maritime tradition, grounding',
        desc: 'Anchor tattoos have been a sailor tradition for centuries — representing stability, hope, and staying grounded through life\'s storms. An anchor keeps a ship secure in rough waters, just as faith or love keeps a person steady.',
        origin: 'Maritime, Christian',
        culturalNotes: 'In Christianity, the anchor represents hope (Hebrews 6:19). Sailors earned anchor tattoos for crossing the Atlantic or reaching certain milestones. In naval tradition, the anchor is a symbol of the Navy itself. Modern anchors represent anyone who values stability and grounding.',
        variants: ['traditional anchor', 'anchor and rope', 'anchor and ship', 'anchor and heart', 'anchor and compass'],
        externalSource: 'https://en.wikipedia.org/wiki/Anchor_(symbolism)',
        sourceLabel: 'Wikipedia — Anchor symbolism',
      },
      {
        slug: 'skull', name: 'Skull', category: 'objects',
        meaning: 'Mortality, remembrance, transformation, fearlessness, rebellion',
        desc: 'Skull tattoos are among the most powerful and versatile designs. They represent the acceptance of mortality — memento mori (remember you must die). Skulls can signify rebellion (biker culture), remembrance of the dead (Day of the Dead), or triumph over fear.',
        origin: 'Global, Mexican, European, Pirate',
        culturalNotes: 'In Mexican culture, sugar skulls (calaveras) honor deceased loved ones during Dia de Muertos. In European vanitas art, skulls remind viewers of life\'s brevity. In biker and pirate traditions, skulls represent lawlessness and fearlessness.',
        variants: ['sugar skull', 'skull and roses', 'skull and crossbones', 'skull and snake', 'realistic skull'],
        externalSource: 'https://en.wikipedia.org/wiki/Skull_(symbolism)',
        sourceLabel: 'Wikipedia — Skull symbolism',
      },
      {
        slug: 'heart', name: 'Heart', category: 'objects',
        meaning: 'Love, life, emotion, courage, compassion, romance',
        desc: 'The heart is the universal symbol of love and emotion. Heart tattoos can represent romantic love, familial bonds, friendship, or self-love. A sacred heart adds religious devotion. A broken heart represents loss. Multiple hearts can symbolize family.',
        origin: 'Global, Sacred Heart (Christian)',
        culturalNotes: 'The Sacred Heart of Jesus is a Catholic symbol of divine love and compassion. The heart shape became standardized in Renaissance anatomical drawings. In ancient Egypt, the heart was the seat of the soul — weighed against Maat\'s feather in the afterlife.',
        variants: ['anatomical heart', 'sacred heart', 'heart and arrow', 'heartbeat line', 'broken heart'],
        externalSource: 'https://en.wikipedia.org/wiki/Heart_(symbol)',
        sourceLabel: 'Wikipedia — Heart symbol',
      },
      {
        slug: 'key', name: 'Key', category: 'objects',
        meaning: 'Unlocking potential, mystery, freedom, knowledge, new beginnings',
        desc: 'Key tattoos symbolize unlocking new possibilities, secrets waiting to be discovered, and access to hidden knowledge. A key can represent a new chapter — the key to a new home, a new relationship, or personal growth.',
        origin: 'Global, European, Christian',
        culturalNotes: 'In Christian iconography, St. Peter holds the keys to heaven. In Victorian times, a key given to a lover symbolized unlocking the heart. Skeleton keys from the Victorian era are popular vintage-style designs.',
        variants: ['skeleton key', 'key and heart', 'key and lock', 'vintage key', 'keyhole'],
        externalSource: 'https://en.wikipedia.org/wiki/Key_(lock)',
        sourceLabel: 'Wikipedia — Key',
      },
    ],
  },

  // ===== 9. MODERN STYLES (4) =====
  {
    id: 'modern',
    name: 'Modern Styles',
    desc: 'Contemporary tattoo aesthetics — abstract expression, minimalism, and artistic innovation.',
    symbols: [
      {
        slug: 'geometric', name: 'Geometric', category: 'modern',
        meaning: 'Precision, order, balance, mathematical beauty, harmony',
        desc: 'Geometric tattoo styles use precise shapes — triangles, circles, lines, and patterns — to create aesthetically striking designs. They represent order in chaos, mathematical beauty, and the search for balance. Sacred geometry elements like the flower of life add spiritual depth.',
        origin: 'Global contemporary',
        culturalNotes: 'Sacred geometry (flower of life, Platonic solids) draws from ancient Greek and Renaissance understanding of mathematical patterns in nature. The Fibonacci spiral appears in shells, galaxies, and plants — a symbol of natural perfection.',
        variants: ['geometric wolf', 'geometric mandala', 'sacred geometry', 'flower of life', 'polygon animal'],
        externalSource: 'https://en.wikipedia.org/wiki/Sacred_geometry',
        sourceLabel: 'Wikipedia — Sacred geometry',
      },
      {
        slug: 'watercolor', name: 'Watercolor', category: 'modern',
        meaning: 'Creativity, emotion, flow, artistic expression, freedom',
        desc: 'Watercolor tattoos mimic brush strokes and pigment blooms, creating soft, flowing designs without bold outlines. They represent artistic freedom, emotional depth, and the beauty of imperfection. Popular subjects include flowers, animals, and abstract shapes.',
        origin: 'Global contemporary (emerged 2010s)',
        culturalNotes: 'Watercolor tattooing emerged as a distinct style in the early 2010s, pioneered by artists like Amanda Wachob. The style challenges traditional bold-line conventions and is considered a modern evolution of tattoo artistry.',
        variants: ['watercolor flower', 'watercolor animal', 'watercolor abstract', 'watercolor mandala', 'watercolor butterfly'],
        externalSource: 'https://en.wikipedia.org/wiki/Tattoo_style',
        sourceLabel: 'Wikipedia — Tattoo styles',
      },
      {
        slug: 'minimalist', name: 'Minimalist', category: 'modern',
        meaning: 'Simplicity, elegance, clarity, intentionality, modern aesthetic',
        desc: 'Minimalist tattoo designs use fine lines, simple shapes, and negative space to create elegant, understated statements. The philosophy is less is more — each line carries meaning without excessive detail.',
        origin: 'Global contemporary',
        culturalNotes: 'Minimalist tattooing gained popularity with the rise of fine-line techniques and Pinterest aesthetics. The style emphasizes placement and proportion. Tiny minimalist tattoos are popular for first-timers and discreet placements like wrist, finger, or behind the ear.',
        variants: ['line art', 'fine line animal', 'tiny symbol', 'single line drawing', 'minimalist nature'],
        externalSource: 'https://en.wikipedia.org/wiki/Minimalism',
        sourceLabel: 'Wikipedia — Minimalism',
      },
      {
        slug: 'abstract', name: 'Abstract', category: 'modern',
        meaning: 'Creativity, individuality, emotion, breaking conventions, depth',
        desc: 'Abstract tattoos move beyond literal representation into expressive shapes, splashes, and forms. They represent individuality and creative freedom — each design is unique to the wearer. Abstract work often responds to body contours and movement.',
        origin: 'Global contemporary (emerged late 2000s)',
        culturalNotes: 'Abstract tattooing draws inspiration from modern art movements — cubism, expressionism, and abstract expressionism. Artists like Yann Black and Dr. Woo pioneered abstract approaches to body art.',
        variants: ['abstract splash', 'abstract geometric', 'abstract face', 'fluid art tattoo', 'abstract line work'],
        externalSource: 'https://en.wikipedia.org/wiki/Abstract_art',
        sourceLabel: 'Wikipedia — Abstract art',
      },
    ],
  },

  // ===== 10. BIRDS (4) — NEW CATEGORY =====
  {
    id: 'birds',
    name: 'Birds',
    desc: 'Bird symbolism — freedom, message, and the journey of the soul.',
    symbols: [
      {
        slug: 'swallow', name: 'Swallow', category: 'birds',
        meaning: 'Loyalty, return, hope, a sailor’s journey home',
        desc: 'Swallow tattoos are a classic maritime tradition — sailors earned a swallow for every 5,000 nautical miles sailed, and believed a swallow would carry their soul home if they died at sea. Swallows represent loyalty, return, and the hope of coming back. A pair of swallows often symbolizes two people who always find their way back to each other.',
        origin: 'Maritime, Sailor Jerry tradition',
        culturalNotes: 'In traditional American tattooing (Sailor Jerry), the swallow is one of the oldest motifs. Unlike swifts, swallows always return to the same nest — making them a symbol of fidelity and homecoming. A swallow with a dagger or banner adds personal meaning.',
        variants: ['traditional swallow', 'swallow pair', 'swallow and banner', 'swallow and compass', 'minimalist swallow'],
        externalSource: 'https://en.wikipedia.org/wiki/Swallow',
        sourceLabel: 'Wikipedia — Swallow',
        customSections: [
          { heading: 'Swallow vs Swift Tattoo', text: 'The swallow (not the swift) is the traditional sailor tattoo because swallows migrate and return — a promise of coming home. A swift, by contrast, stays aloft. Choose a swallow when the meaning is loyalty and return.' },
          { heading: 'Swallow Placement', text: 'Classic placements are the chest (one swallow over the heart), behind the ear, or on the forearm. A pair works well on the chest or upper arms, facing inward toward the heart.' },
        ],
      },
      {
        slug: 'hummingbird', name: 'Hummingbird', category: 'birds',
        meaning: 'Joy, resilience, energy, living in the moment',
        desc: 'Hummingbird tattoos celebrate the small but mighty — a creature with extraordinary energy and a zest for life. They represent joy, resilience, and the ability to find sweetness even in hard times. In many traditions, a hummingbird is a visiting spirit or a messenger of love.',
        origin: 'Native American, Aztec',
        culturalNotes: 'In Aztec myth, the warrior Huitzilopochtli took the form of a hummingbird (huitzilin). Many Native American tribes see hummingbirds as messengers of joy and love, or as visiting ancestors. Their tireless movement symbolizes relentless pursuit of what matters.',
        variants: ['hummingbird and flower', 'realistic hummingbird', 'hummingbird and vine', 'minimalist hummingbird', 'watercolor hummingbird'],
        externalSource: 'https://en.wikipedia.org/wiki/Hummingbird',
        sourceLabel: 'Wikipedia — Hummingbird',
      },
      {
        slug: 'dove', name: 'Dove', category: 'birds',
        meaning: 'Peace, love, purity, hope, the Holy Spirit',
        desc: 'Dove tattoos are universal symbols of peace and love. A dove with an olive branch represents hope and reconciliation. In Christian art, a white dove embodies the Holy Spirit and purity. Doves also symbolize the soul released from the body and enduring love between partners.',
        origin: 'Biblical, Global',
        culturalNotes: 'In the Noah’s Ark story, the dove returns with an olive branch — the first sign of land and peace after the flood. In Greek myth, doves are sacred to Aphrodite (love). Releasing doves at weddings and funerals marks both new beginnings and peaceful goodbyes.',
        variants: ['dove and olive branch', 'flying dove', 'dove and heart', 'minimalist dove', 'dove and sun'],
        externalSource: 'https://en.wikipedia.org/wiki/Dove',
        sourceLabel: 'Wikipedia — Dove',
      },
      {
        slug: 'raven', name: 'Raven', category: 'birds',
        meaning: 'Intelligence, mystery, transformation, messenger',
        desc: 'Raven tattoos carry deep, dual symbolism — wisdom and omen, creation and death. The raven is a clever trickster and a messenger between worlds. In some cultures it is a bringer of light; in others, a companion of the battlefield. A raven represents intelligence, mystery, and transformation.',
        origin: 'Norse, Native American, Celtic',
        culturalNotes: 'In Norse myth, Odin’s two ravens (Huginn and Muninn) fly the world and report back — thought and memory. In Pacific Northwest Indigenous art, Raven is a creator-trickster who brought light to humans. In Celtic lore, the raven is associated with battle and prophecy.',
        variants: ['raven skull', 'flying raven', 'raven and moon', 'raven and skull', 'realistic raven'],
        externalSource: 'https://en.wikipedia.org/wiki/Raven',
        sourceLabel: 'Wikipedia — Raven',
      },
    ],
  },

  // ===== 11. ZODIAC & ASTROLOGY (4) — NEW CATEGORY =====
  {
    id: 'zodiac',
    name: 'Zodiac & Astrology',
    desc: 'Astrological and constellation symbolism — fate, identity, and the cosmos.',
    symbols: [
      {
        slug: 'constellation', name: 'Constellation', category: 'zodiac',
        meaning: 'Guidance, destiny, connection to the stars',
        desc: 'Constellation tattoos map the night sky onto skin — a personal piece of the cosmos. They represent guidance, destiny, and our connection to something larger. A custom constellation can encode a birth date, a lost loved one’s sign, or a meaningful place and time.',
        origin: 'Global, Astronomical',
        culturalNotes: 'Star maps have been used for navigation and storytelling for millennia. Modern constellation tattoos often recreate the sky on a specific date (a birth, a wedding) — turning time and place into permanent art. Orion and the Big Dipper are popular choices.',
        variants: ['orion', 'big dipper', 'custom constellation', 'zodiac constellation', 'minimalist stars'],
        externalSource: 'https://en.wikipedia.org/wiki/Constellation',
        sourceLabel: 'Wikipedia — Constellation',
        customSections: [
          { heading: 'Custom Constellation Tattoos', text: 'A growing trend is to tattoo the exact constellation visible on a meaningful date — a birthday, a child’s birth, an anniversary. Apps can generate the star map, making each piece personally coded rather than decorative.' },
          { heading: 'Constellation vs Zodiac Sign', text: 'A constellation is the actual star pattern; a zodiac sign is the astrological interpretation of a birth window. Many people tattoo their sun, moon, or rising sign’s constellation for a subtle astrological statement.' },
        ],
      },
      {
        slug: 'pisces', name: 'Pisces', category: 'zodiac',
        meaning: 'Intuition, empathy, duality, flow',
        desc: 'Pisces tattoos represent the final zodiac sign — intuitive, empathetic, and deeply feeling. The two fish swimming in opposite directions symbolize duality: the material and the spiritual, the conscious and the subconscious. Pisces imagery suits those who live by emotion and intuition.',
        origin: 'Astrological (Western), Greco-Roman',
        culturalNotes: 'In Greek myth, Pisces connects to Aphrodite and Eros, who transformed into fish to escape the monster Typhon. The tied fish represent their unbroken bond. As a water sign, Pisces is linked to emotion, dreams, and the subconscious.',
        variants: ['two fish', 'pisces glyph', 'pisces constellation', 'koi as pisces', 'minimalist pisces'],
        externalSource: 'https://en.wikipedia.org/wiki/Pisces_(astrology)',
        sourceLabel: 'Wikipedia — Pisces (astrology)',
      },
      {
        slug: 'scorpio', name: 'Scorpio', category: 'zodiac',
        meaning: 'Passion, transformation, intensity, protection',
        desc: 'Scorpio tattoos embody intensity — passion, transformation, and magnetic mystery. As a fixed water sign, Scorpio is associated with death and rebirth, secrecy, and fierce loyalty. The scorpion’s sting represents protection and the power to defend what matters.',
        origin: 'Astrological (Western), Mesopotamian',
        culturalNotes: 'The scorpion is one of the oldest zodiac symbols, tracing to Babylonian astronomy. In modern astrology, Scorpio rules transformation and the phoenix-like cycle of endings and beginnings. Scorpio glyphs and scorpions are popular minimalist placements.',
        variants: ['scorpion', 'scorpio glyph', 'scorpio constellation', 'scorpio and moon', 'minimalist scorpio'],
        externalSource: 'https://en.wikipedia.org/wiki/Scorpio_(astrology)',
        sourceLabel: 'Wikipedia — Scorpio (astrology)',
      },
      {
        slug: 'gemini', name: 'Gemini', category: 'zodiac',
        meaning: 'Duality, balance, communication, curiosity',
        desc: 'Gemini tattoos celebrate the twins — duality, balance, and the meeting of opposites. They represent communication, curiosity, and the many facets of a single person. Gemini imagery suits siblings, best friends, or anyone who embraces their contradictions.',
        origin: 'Astrological (Western), Greco-Roman',
        culturalNotes: 'Gemini traces to the myth of Castor and Pollux, twin brothers (one mortal, one divine) who exemplify brotherly love and loyalty. As an air sign, Gemini rules communication and intellect. The twin motif is popular for sibling or best-friend matching tattoos.',
        variants: ['twins', 'gemini glyph', 'gemini constellation', 'gemini and moon', 'minimalist gemini'],
        externalSource: 'https://en.wikipedia.org/wiki/Gemini_(astrology)',
        sourceLabel: 'Wikipedia — Gemini (astrology)',
      },
    ],
  },

  // ===== 12. INSECTS (4) — NEW CATEGORY =====
  {
    id: 'insects',
    name: 'Insects',
    desc: 'Insect symbolism — patience, transformation, and tiny but mighty strength.',
    symbols: [
      {
        slug: 'bee', name: 'Bee', category: 'insects',
        meaning: 'Community, hard work, sweetness, loyalty',
        desc: 'Bee tattoos celebrate the power of community — tireless work, cooperation, and the sweetness that comes from it. Bees represent loyalty to the hive, productivity, and the importance of every small role. A bee can honor a hardworking spirit or a close-knit family.',
        origin: 'Global, Egyptian, Neolithic',
        culturalNotes: 'Bees were sacred in ancient Egypt (associated with the sun god Ra and royalty) and appear in Neolithic art. In Freemasonry, the bee symbolizes industry and harmony. Modern bee tattoos also support pollination and environmental awareness.',
        variants: ['honey bee', 'bee and honeycomb', 'geometric bee', 'minimalist bee', 'bee and flower'],
        externalSource: 'https://en.wikipedia.org/wiki/Bee',
        sourceLabel: 'Wikipedia — Bee',
        customSections: [
          { heading: 'Bee as a Team Symbol', text: 'Because a hive only thrives through cooperation, bee tattoos are popular with teams, families, and coworkers who value collective effort over individual glory. Honeycomb patterns add a geometric, structured accent.' },
          { heading: 'Bee Placement', text: 'Small bees fit the wrist, ankle, or behind the ear. A bee with honeycomb works well on the forearm or shoulder. Pair with a flower for a nature-themed piece.' },
        ],
      },
      {
        slug: 'spider', name: 'Spider', category: 'insects',
        meaning: 'Creation, patience, destiny, feminine power',
        desc: 'Spider tattoos weave themes of creation and patience — the spinner of fate and the maker of intricate plans. The spider represents feminine power (the weaver goddess), careful strategy, and the interconnectedness of all things. A spider’s web suggests destiny and the paths we spin.',
        origin: 'Global, Native American, Greek',
        culturalNotes: 'In Greek myth, Arachne was transformed into a spider for her weaving pride — a story of craft and consequence. In many Native American traditions, Spider Woman is a creator who taught weaving. The web is a symbol of connection and patient design.',
        variants: ['spider and web', 'realistic spider', 'geometric spider', 'spider skull', 'minimalist spider'],
        externalSource: 'https://en.wikipedia.org/wiki/Spider',
        sourceLabel: 'Wikipedia — Spider',
      },
      {
        slug: 'dragonfly', name: 'Dragonfly', category: 'insects',
        meaning: 'Change, adaptability, lightness, rebirth',
        desc: 'Dragonfly tattoos symbolize change and the lightness of being. Their iridescent wings represent adaptability and the beauty of living in the moment. In many cultures, dragonflies are messengers from the spirit world or symbols of renewal after hardship.',
        origin: 'Japanese, Native American, Global',
        culturalNotes: 'In Japan, the dragonfly (tombo) is a symbol of courage, strength, and happiness — historically revered, even appearing on samurai helmets. In some Native American traditions, dragonflies represent swiftness and purity. Their life from water nymph to winged adult is a rebirth metaphor.',
        variants: ['realistic dragonfly', 'dragonfly and lotus', 'blue dragonfly', 'minimalist dragonfly', 'dragonfly and water'],
        externalSource: 'https://en.wikipedia.org/wiki/Dragonfly',
        sourceLabel: 'Wikipedia — Dragonfly',
      },
      {
        slug: 'ladybug', name: 'Ladybug', category: 'insects',
        meaning: 'Luck, protection, love, childhood joy',
        desc: 'Ladybug tattoos are small charms of good fortune — a symbol of protection, luck, and simple joy. They represent love (a "love bug"), childhood innocence, and the belief that good things are coming. A ladybug is a lighthearted, hopeful design.',
        origin: 'European folklore, Global',
        culturalNotes: 'European folklore holds that a ladybug landing on you brings luck, and counting its spots predicts future blessings. In Christian tradition, the ladybug (Our Lady’s beetle) was linked to the Virgin Mary and protection of crops. They remain a universal symbol of gentle good fortune.',
        variants: ['red ladybug', 'ladybug and flower', 'minimalist ladybug', 'ladybug and clover', 'cute ladybug'],
        externalSource: 'https://en.wikipedia.org/wiki/Coccinellidae',
        sourceLabel: 'Wikipedia — Ladybug',
      },
    ],
  },

  // ===== 13. SEA LIFE (4) — NEW CATEGORY =====
  {
    id: 'sea-life',
    name: 'Sea Life',
    desc: 'Ocean creatures — depth, emotion, and the freedom of the sea.',
    symbols: [
      {
        slug: 'whale', name: 'Whale', category: 'sea-life',
        meaning: 'Wisdom, calm, family, emotional depth',
        desc: 'Whale tattoos embody the quiet giant — wisdom, emotional depth, and the strength of family bonds. Whales communicate across vast oceans, symbolizing connection that transcends distance. A humpback’s song represents expression and the call of the deep.',
        origin: 'Global, Maori, Inuit',
        culturalNotes: 'In Maori culture, the whale (tohora) is a guardian and ancestor. In Inuit tradition, the whale is a provider and a respected being. Humpback whales are known for their complex songs — making them a symbol of communication and emotion.',
        variants: ['humpback whale', 'whale and wave', 'whale tail (fluke)', 'minimalist whale', 'whale and moon'],
        externalSource: 'https://en.wikipedia.org/wiki/Whale',
        sourceLabel: 'Wikipedia — Whale',
        customSections: [
          { heading: 'Whale Tail (Fluke) Meaning', text: 'A whale tail rising from water is one of the most requested whale tattoos. It represents a soul departing peacefully (a farewell), the vast unknown below, or simply a love of the ocean. Often chosen as a memorial or travel tattoo.' },
          { heading: 'Whale vs Shark Energy', text: 'Whales read as calm, wise, and protective; sharks read as power, focus, and survival. Choose a whale when the story is family, emotion, and depth; choose a shark for drive and fearlessness.' },
        ],
      },
      {
        slug: 'dolphin', name: 'Dolphin', category: 'sea-life',
        meaning: 'Playfulness, friendship, protection, harmony',
        desc: 'Dolphin tattoos capture joy and intelligence — playful, social, and protective. Dolphins are seen as guardians of the sea, guiding sailors and swimmers to safety. They represent friendship, harmony, and the lighter side of the ocean’s power.',
        origin: 'Greek, Global, Polynesian',
        culturalNotes: 'In Greek myth, dolphins were sacred to Poseidon and rescued sailors — sometimes as messengers of the gods. In Polynesian tattoo, the dolphin (and porpoise) symbolizes protection, kinship, and the breath of life. Their altruism makes them a symbol of友情 and aid.',
        variants: ['jumping dolphin', 'dolphin and wave', 'dolphin pair', 'minimalist dolphin', 'dolphin and sun'],
        externalSource: 'https://en.wikipedia.org/wiki/Dolphin',
        sourceLabel: 'Wikipedia — Dolphin',
      },
      {
        slug: 'octopus', name: 'Octopus', category: 'sea-life',
        meaning: 'Intelligence, adaptability, mystery, multiplicity',
        desc: 'Octopus tattoos are rich with meaning — intelligence, adaptability, and the ability to slip through any challenge. Eight arms suggest many paths and skills; the octopus’s ink and camouflage represent mystery and strategic retreat. It is a symbol of clever survival.',
        origin: 'Global, Hawaiian, Inuit',
        culturalNotes: 'In Hawaiian culture, the octopus (he’e) is an ancient, shape-shifting ancestor. In some myths, the octopus is a trickster or a creature of the deep unknown. Its regenerative arms make it a symbol of resilience and reinvention.',
        variants: ['realistic octopus', 'octopus and skull', 'geometric octopus', 'octopus sleeve', 'minimalist octopus'],
        externalSource: 'https://en.wikipedia.org/wiki/Octopus',
        sourceLabel: 'Wikipedia — Octopus',
      },
      {
        slug: 'shark', name: 'Shark', category: 'sea-life',
        meaning: 'Power, survival, fearlessness, focus',
        desc: 'Shark tattoos channel raw focus — power, survival, and unshakeable drive. As apex predators, sharks represent fearlessness and the confidence to move through life without hesitation. A shark can mark a survivor, an athlete, or someone who refuses to quit.',
        origin: 'Polynesian, Global',
        culturalNotes: 'In Polynesian tattooing, the shark (tohu) is a powerful protector — a symbol of strength, guidance, and safe passage over water. In modern surf culture, shark teeth patterns ward off danger. The shark’s relentless forward motion is a metaphor for perseverance.',
        variants: ['hammerhead shark', 'shark tooth pattern', 'realistic shark', 'shark silhouette', 'shark and wave'],
        externalSource: 'https://en.wikipedia.org/wiki/Shark',
        sourceLabel: 'Wikipedia — Shark',
      },
    ],
  },

  // ===== 14. TIME & MORTALITY (3) — NEW CATEGORY =====
  {
    id: 'time',
    name: 'Time & Mortality',
    desc: 'Time and mortality symbols — memory, urgency, and the impermanence of life.',
    symbols: [
      {
        slug: 'clock', name: 'Clock', category: 'time',
        meaning: 'Time, mortality, living in the moment, urgency',
        desc: 'Clock tattoos are reminders that time is finite — live now. A working clock face suggests punctuality and the passage of life; a broken or melting clock (in the style of Dalí) represents timelessness and defiance of mortality. Clocks often mark a specific hour that mattered.',
        origin: 'Victorian, Global',
        culturalNotes: 'Victorian "memento mori" jewelry used clocks and watches to remind the wearer of life’s brevity. In tattoo art, a clock paired with a rose or skull balances time with beauty or death. A clock set to a meaningful time (a birth, a loss) personalizes the piece.',
        variants: ['pocket watch', 'broken clock', 'melting clock', 'clock and rose', 'clock and skull'],
        externalSource: 'https://en.wikipedia.org/wiki/Clock',
        sourceLabel: 'Wikipedia — Clock',
        customSections: [
          { heading: 'Clock Set to a Meaningful Time', text: 'The most personal clock tattoos show a specific time — a child’s birth hour, the moment of a loss, or a wedding time. The hour turns a generic symbol into a private landmark.' },
          { heading: 'Clock and Skull (Memento Mori)', text: 'Pairing a clock with a skull is the classic "remember you must die" motif. It is not morbid but grounding — a prompt to spend time on what matters. Add a rose for beauty-amid-impermanence.' },
        ],
      },
      {
        slug: 'hourglass', name: 'Hourglass', category: 'time',
        meaning: 'Mortality, urgency, balance of time, transition',
        desc: 'Hourglass tattoos visualize time running out — a symbol of mortality, urgency, and the balance between what was and what will be. The falling sand represents transition and the inevitability of change. An hourglass paired with wings (tempus fugit) means "time flies."',
        origin: 'Global, Medieval',
        culturalNotes: 'The hourglass is a classic "memento mori" image, used for centuries to remind viewers that life is measured. In alchemy and art, it balances the past (upper chamber) and future (lower). Wings added to the hourglass stress that time escapes us.',
        variants: ['hourglass and skull', 'hourglass with wings', 'sand hourglass', 'minimalist hourglass', 'hourglass and rose'],
        externalSource: 'https://en.wikipedia.org/wiki/Hourglass',
        sourceLabel: 'Wikipedia — Hourglass',
      },
      {
        slug: 'pocket-watch', name: 'Pocket Watch', category: 'time',
        meaning: 'Memory, legacy, lost time, remembrance',
        desc: 'Pocket watch tattoos carry a vintage, sentimental weight — memory, legacy, and the time we cannot get back. Often inherited and worn close to the heart, a pocket watch represents a connection to those who came before. It is a popular memorial and family tattoo.',
        origin: 'Victorian, Global',
        culturalNotes: 'Pocket watches were personal heirlooms, passed down through generations. As tattoos, they frequently honor a grandparent or parent — sometimes with a name, date, or engraved message. The chain adds a decorative, antique flourish.',
        variants: ['open pocket watch', 'pocket watch and rose', 'engraved pocket watch', 'minimalist watch', 'pocket watch and banner'],
        externalSource: 'https://en.wikipedia.org/wiki/Pocket_watch',
        sourceLabel: 'Wikipedia — Pocket watch',
      },
    ],
  },

  // ===== 15. WORDS & LETTERING (4) — NEW CATEGORY =====
  {
    id: 'words',
    name: 'Words & Lettering',
    desc: 'Words, names, and numbers — personal statements made permanent.',
    symbols: [
      {
        slug: 'name-initial', name: 'Name / Initial', category: 'words',
        meaning: 'Identity, love, remembrance of a person',
        desc: 'Name and initial tattoos turn a person into permanent art — a partner, child, parent, or self. They represent love, identity, and remembrance. A name keeps someone close; an initial distills identity to its essence. This is one of the oldest and most personal tattoo forms.',
        origin: 'Global, All eras',
        culturalNotes: 'Name tattoos carry risk (relationships change) and reward (lasting tribute). Many choose children’s names or deceased loved ones to avoid the "name-regret" pitfall. Initials and monograms offer a subtler, timeless alternative to full names.',
        variants: ['child name', 'partner name', 'parent name', 'single initial', 'monogram'],
        externalSource: 'https://en.wikipedia.org/wiki/Tattoo',
        sourceLabel: 'Wikipedia — Tattoo',
        customSections: [
          { heading: 'Avoiding Name-Regret', text: 'Artists often advise against a romantic partner’s name (breakups happen). Safer choices: a child’s name, a parent’s name, or your own initials. If you want a partner’s name, consider their initials or a shared symbol instead.' },
          { heading: 'Script Styles', text: 'Lettering style changes the meaning: elegant cursive feels romantic, blackletter feels bold/traditional, typewriter feels literary, and fine-line sans feels modern. Match the font to the feeling you want.' },
        ],
      },
      {
        slug: 'quote', name: 'Quote / Word', category: 'words',
        meaning: 'Personal belief, inspiration, a life motto',
        desc: 'Quote and single-word tattoos make a private philosophy public. A word like "breathe," "strength," or "free" is a daily anchor; a short quote captures a turning point or value. The right words become a lifelong mantra worn on the skin.',
        origin: 'Global, Contemporary',
        culturalNotes: 'Single-word tattoos surged with minimalist and fine-line trends. A short quote (Latin mottos like "carpe diem," song lyrics, or a line from a book) lets the wearer carry meaning discreetly. Translation accuracy matters — double-check any foreign-language text.',
        variants: ['single word', 'latin motto', 'song lyric', 'book quote', 'script banner'],
        externalSource: 'https://en.wikipedia.org/wiki/Tattoo',
        sourceLabel: 'Wikipedia — Tattoo',
      },
      {
        slug: 'coordinate', name: 'Coordinate', category: 'words',
        meaning: 'A meaningful place, journey, belonging',
        desc: 'Coordinate tattoos encode a location — latitude and longitude of a birthplace, a home, a meeting spot, or a place that changed you. They are subtle, deeply personal, and readable only to those who know. A coordinate turns geography into identity.',
        origin: 'Global, Contemporary',
        culturalNotes: 'Coordinate tattoos exploded with travel culture and minimalist design. People mark where they were born, where they met a partner, or a "home" they left behind. The format (degrees/minutes/seconds) keeps the meaning private yet precise.',
        variants: ['birthplace coordinates', 'home coordinates', 'meeting spot', 'minimalist lat-long', 'coordinate and compass'],
        externalSource: 'https://en.wikipedia.org/wiki/Geographic_coordinate_system',
        sourceLabel: 'Wikipedia — Geographic coordinate system',
      },
      {
        slug: 'roman-numeral', name: 'Roman Numeral', category: 'words',
        meaning: 'A significant date, order, permanence',
        desc: 'Roman numeral tattoos mark dates and numbers with timeless elegance — a birthday, anniversary, or the date of a life event. They read as refined and permanent, avoiding the dated look of Arabic digits. A numeral can also signify rank, order, or a chapter number.',
        origin: 'Global, Classical',
        culturalNotes: 'Roman numerals lend a classical, engraved quality (like monuments and clocks). They are a discreet way to tattoo a date — legible but not obvious. Common uses: wedding dates, children’s birth years, or a "III" marking a third chapter.',
        variants: ['wedding date', 'birth year', 'anniversary', 'chapter number', 'minimalist numeral'],
        externalSource: 'https://en.wikipedia.org/wiki/Roman_numerals',
        sourceLabel: 'Wikipedia — Roman numerals',
      },
    ],
  },
];

/** Flatten all symbols across categories for quick lookups */
export const ALL_MEANINGS: TattooMeaning[] = TATTOO_CATEGORIES.flatMap((c) => c.symbols);

/** Lookup a symbol by slug */
export function getMeaningBySlug(slug: string): TattooMeaning | undefined {
  return ALL_MEANINGS.find((m) => m.slug === slug);
}

/** Get category for a symbol slug */
export function getCategoryForSlug(slug: string): TattooCategory | undefined {
  return TATTOO_CATEGORIES.find((c) => c.symbols.some((s) => s.slug === slug));
}
