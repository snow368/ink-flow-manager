/**
 * Tattoo Meanings Data — 10 categories × 42 symbols
 * Last updated: 2026-07-07
 * Sources: Cultural studies, historical references, industry knowledge
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

  // ===== 4. GEOMETRIC / SYMBOLS (5) =====
  {
    id: 'geometric',
    name: 'Geometric & Symbols',
    desc: 'Sacred geometry and universal symbols — order, balance, and cosmic connection.',
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
