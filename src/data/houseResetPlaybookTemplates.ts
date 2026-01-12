import { Playbook } from '@/types';

// Helper to generate step with UUID
const step = (title: string, description: string, minutes: number, order: number, tips: string[] = []) => ({
  id: crypto.randomUUID(),
  title,
  description,
  estimatedMinutes: minutes,
  completed: false,
  order,
  tips,
});

export const houseResetPlaybookTemplates: Omit<Playbook, 'id' | 'createdAt' | 'linkedTaskIds'>[] = [
  // ============================================================
  // THE COMPLETE HOUSE RESET - RECLAIM YOUR SPACE
  // A compassionate, room-by-room deep clean designed for
  // coming out of a difficult period
  // ============================================================
  {
    title: 'The Complete House Reset - Reclaim Your Space',
    description: 'A compassionate, room-by-room deep clean designed specifically for coming out of a difficult period. This playbook breaks down the overwhelming task of getting your entire house back in order into manageable chunks. You don\'t have to do it all at once - tackle one room per day, or even one step at a time. Progress, not perfection.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { rooms: ['whole-home'], activityType: ['deep-clean', 'recovery'], duration: ['120+'] },
    steps: [
      step(
        'Gather Your Reset Arsenal',
        'Before you start any room, gather all your supplies in one place. This prevents the exhausting mid-task hunt for supplies that can derail your momentum.',
        15,
        0,
        [
          'Gather: trash bags, laundry baskets, all-purpose cleaner, disinfecting wipes, glass cleaner, microfiber cloths, vacuum, broom and mop',
          'Wear comfortable clothes you can move in',
          'Keep a water bottle nearby - stay hydrated!',
          'Phone with timer/music helps keep momentum'
        ]
      ),
      step(
        'Master Bedroom - Your Sanctuary First',
        'Start with your bedroom because you deserve a peaceful place to rest. A clean bedroom helps with sleep, which helps with everything else. You\'re not just cleaning a room; you\'re reclaiming your sanctuary.',
        90,
        1,
        [
          'Strip the bed completely - sheets, pillowcases, mattress cover. Start laundry immediately.',
          'Clothes decision: Dirty → hamper. Clean → put away or donate. No "maybe" pile.',
          'Clear surfaces - nightstands, dresser top. Everything gets a home or goes.',
          'Dust all surfaces top to bottom, vacuum/sweep floor, then make bed with fresh sheets',
          'Tonight you sleep in a fresh, clean bed - that\'s your reward'
        ]
      ),
      step(
        'Office - Command Center Restoration',
        'Your office affects your productivity and mental clarity. A clear space supports a clearer mind. Take this one surface at a time.',
        75,
        2,
        [
          'Desk surface intervention - Everything off. Wipe it down. Only essentials go back.',
          'Paper purge - Trash, recycle, or file. If you haven\'t looked at it in months, you probably don\'t need it.',
          'Organize supplies - Pens that work, supplies you use. Everything else goes.',
          'Tech clean - Wipe down keyboard, mouse, monitor, desk phone',
          'Floor clear and clean, then cable management (just get them off the floor)'
        ]
      ),
      step(
        'Bathroom 1 (Main) - Daily Reset Space',
        'A clean bathroom makes daily hygiene routines less overwhelming. This is self-care infrastructure.',
        60,
        3,
        [
          'Clear all surfaces - counters, tub edge, toilet tank. Everything comes off.',
          'Throw away expired products. Check dates. Be ruthless.',
          'Scrub toilet completely - bowl, seat, base, behind',
          'Clean sink, counter, shower/tub (spray, let sit 5 min, scrub, rinse)',
          'Mirror and glass shine, floor sweep and mop, fresh towels only'
        ]
      ),
      step(
        'Bathroom 2 - Second Sanctuary',
        'Same process, fresh space. You\'re getting good at this.',
        60,
        4,
        [
          'Clear surfaces and dispose expired items',
          'Toilet deep clean, sink and counter scrub',
          'Shower/tub deep clean',
          'Mirror and glass shine',
          'Floor sweep and mop, fresh towels'
        ]
      ),
      step(
        'Living Room - Family Space Revival',
        'This is where you live. Where you rest, where you gather. Reclaim this space for joy, not just existing.',
        90,
        5,
        [
          'Declutter sweep - Walk through with trash bag. Anything that\'s trash → bag.',
          'Surface by surface - Coffee table, side tables, entertainment center. Clear, wipe, return only what belongs.',
          'Couch/furniture care - Remove cushions, vacuum underneath and in crevices',
          'Dust everything - shelves, TV, picture frames, decorations',
          'Floor comprehensive clean, then fluff pillows, fold throws, arrange remotes'
        ]
      ),
      step(
        'Kitchen - Heart of the Home Reset',
        'The kitchen affects everything - your nutrition, your energy, your mood. A clean kitchen makes feeding yourself easier. This matters.',
        120,
        6,
        [
          'Dish intervention - ALL dishes washed, dried, put away. This is non-negotiable.',
          'Counter clear and clean - Remove everything. Wipe completely. Only daily-use items return.',
          'Appliance care - Microwave inside and out, stovetop, coffee maker exterior',
          'Sink deep clean, polish faucet, clean around faucet base',
          'Fridge quick sort - Remove obvious expired items, wipe spills',
          'Trash/recycling emptied, floor sweep and mop, clean dish towels only'
        ]
      ),
      step(
        'Dining Room 1 (Main) - Gathering Space',
        'Whether you eat here or not, this space sets a tone. Clear and clean.',
        45,
        7,
        [
          'Table complete clear - Everything off the table. Every. Thing.',
          'Table deep clean - Wipe thoroughly. Polish if wood.',
          'Chairs attention - Wipe down all chairs, legs included.',
          'Clear other surfaces - Buffet, sideboard, shelves',
          'Dust and detail - Light fixture, artwork, decor',
          'Floor sweep/vacuum and mop'
        ]
      ),
      step(
        'Dining Room 2 - Second Space',
        'Same energy, different room. You\'ve got a system now.',
        45,
        8,
        [
          'Complete table clear and clean',
          'All chairs wiped down',
          'Other surfaces cleared and cleaned',
          'Dust and detail work',
          'Floor sweep/vacuum and mop'
        ]
      ),
      step(
        'Sunroom - Light and Life Space',
        'This space is meant for light, for life, for peace. Let\'s make it that again.',
        60,
        9,
        [
          'Declutter completely - If it doesn\'t belong in a sunroom, it goes elsewhere',
          'Windows are priority - Inside and out if possible. This space is about light.',
          'Furniture care - Wipe down all surfaces, vacuum upholstered pieces',
          'Plant care if applicable - Water, remove dead leaves, wipe dust off leaves',
          'Floor thorough clean, then arrange furniture for comfort, not storage'
        ]
      ),
      step(
        'Bedroom (Second) - Guest or Personal Space',
        'Whether this is a guest room or another personal space, it deserves the same care.',
        75,
        10,
        [
          'Strip bed and start laundry',
          'Declutter surfaces and floor',
          'Dust all surfaces top to bottom',
          'Closet quick sort (if applicable)',
          'Vacuum or sweep floor',
          'Make bed with fresh linens'
        ]
      ),
      step(
        'The Final Walk-Through - Acknowledge Your Victory',
        'Walk through your entire home. See what you\'ve accomplished. This isn\'t about what\'s left - it\'s about honoring what you\'ve done.',
        20,
        11,
        [
          'Walk each room slowly. Notice the difference - really see it.',
          'Take one "after" photo of each space - for tough days ahead, you\'ll have proof you can do hard things',
          'Do one small thing you notice. But just one. You\'re done.',
          'REST. Seriously. You did something huge.',
          'REMINDER: One room per day is a victory. You\'re recovering, not competing. Good enough is perfect.'
        ]
      ),
    ],
  },

  // ============================================================
  // EMERGENCY CLEAN - LOW ENERGY MAINTENANCE MODE
  // For days when you have minimal energy but need your space
  // to be safe, clean, and sanitary
  // ============================================================
  {
    title: 'Emergency Clean - Low Energy Maintenance Mode',
    description: 'For the days when you have minimal energy but need your space to be safe, clean, and sanitary. This is your "bare minimum viable environment" routine - the essentials that keep depression from getting worse by maintaining basic hygiene in your space. Low energy? This has your back.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { rooms: ['whole-home'], activityType: ['quick-clean', 'maintenance', 'recovery'], duration: ['60-120'] },
    steps: [
      step(
        'The 5-Minute Kitchen Save',
        'The kitchen affects everything. Keep it barely functional, and you can feed yourself. That matters.',
        5,
        0,
        [
          'Put ALL dirty dishes in dishwasher or stack neatly in sink (don\'t wash, just contain)',
          'Wipe down counters with disinfecting wipes (just visible surfaces)',
          'Take out kitchen trash if full or smells',
          'Quick sweep of floor (just visible crumbs/debris)',
          'That\'s it. Kitchen is functional enough.'
        ]
      ),
      step(
        'Bathroom Rapid Sanitize (Both Bathrooms)',
        'Hygiene basics. This keeps you healthy even when you can\'t do more.',
        10,
        1,
        [
          'Toilet: Quick scrub of bowl, wipe seat and handle with disinfecting wipe',
          'Sink: Wipe down sink and counter with disinfecting wipe',
          'Mirror: Quick wipe if you can see toothpaste splatter (optional)',
          'Floor: Kick towels/clothes into hamper, quick sweep if needed',
          'Fresh hand towel if the current one is gross',
          'Do this for BOTH bathrooms - 5 minutes each'
        ]
      ),
      step(
        'The Bedroom Minimum',
        'You need a place to rest. Make the bed. That\'s the anchor.',
        5,
        2,
        [
          'Make the bed (pull up covers, arrange pillows - it doesn\'t have to be perfect)',
          'Dirty clothes → hamper (just pick them up off the floor)',
          'Put water glass on nightstand (you need to hydrate)',
          'Open blinds/curtains (light helps)'
        ]
      ),
      step(
        'Living Room Surface Reset',
        'Just the surfaces. Just what\'s visible. That\'s all we\'re doing.',
        5,
        3,
        [
          'Collect any dishes/cups → take to kitchen',
          'Grab obvious trash → throw away',
          'Stack any clutter neatly (don\'t organize, just stack)',
          'Fluff couch pillows (visual order helps mood)',
          'Quick surface wipe of coffee table if sticky'
        ]
      ),
      step(
        'Critical Disinfection Points',
        'The things you touch constantly. These spread germs and affect your health. Quick wipe = big impact.',
        10,
        4,
        [
          'All door handles in the house',
          'Light switches (especially bedroom, bathroom, kitchen)',
          'TV remote controls, phone (electronics-safe wipe)',
          'Faucet handles (bathroom and kitchen)',
          'Refrigerator handle, microwave handle',
          'Use disinfecting wipes. One wipe per room is fine.'
        ]
      ),
      step(
        'Floor Spot Clean - High Traffic Only',
        'Not the whole floor. Just the paths you walk. Just the visible dirt.',
        15,
        5,
        [
          'Kitchen: Quick sweep of walkway and in front of sink',
          'Bathroom(s): Quick sweep if you see hair/dust',
          'Living room: Vacuum or sweep the main walkway only',
          'Bedroom: Quick pickup of visible items, optional quick vacuum of path',
          'NOT the edges. NOT under furniture. Just where you walk.'
        ]
      ),
      step(
        'The Essential Trash Run',
        'Trash accumulates fast during depression. Get it out of your space.',
        10,
        6,
        [
          'Empty all visible trash cans (bathroom, bedroom, kitchen, office)',
          'Grab any obvious trash from surfaces (food wrappers, packaging)',
          'Take all trash bags to outside bin',
          'Put new bags in trash cans',
          'This one task improves air quality immediately'
        ]
      ),
      step(
        'Air Quality Quick Fix',
        'Fresh air and better smell = mood lift. This is free therapy.',
        2,
        7,
        [
          'Open windows for 10 minutes if weather allows (set a timer)',
          'Turn on bathroom fans while you\'re doing other tasks',
          'If you have air purifier, turn it on',
          'Quick spray of air freshener ONLY if space is already clean'
        ]
      ),
      step(
        'Laundry Minimum Viable Action',
        'You need clean clothes. This is the smallest possible action toward that goal.',
        8,
        8,
        [
          'Choose ONE: Start ONE load of laundry (just start it - you\'ll move it later)',
          'OR: Move wet clothes to dryer and start it',
          'OR: Fold and put away ONE load that\'s been sitting',
          'OR: Gather all dirty laundry into hamper/basket (at least it\'s contained)',
          'Do NOT attempt more than one of these. Pick one. Do it. Done.'
        ]
      ),
      step(
        'The Reset Scan - Quick Visual Sweep',
        'Walk through your space once. Quick observations. One minute per room.',
        5,
        9,
        [
          'Walk through each main room (30 seconds each)',
          'Notice: Does anything smell bad? Address it if yes.',
          'Notice: Is there any major safety issue? Address it if yes.',
          'Notice: Did you miss any obvious trash? Grab it.',
          'That\'s it. Observation only. Don\'t start new tasks.'
        ]
      ),
      step(
        'Self-Care Checkpoint',
        'You just did something hard. Acknowledge it. This step is non-negotiable.',
        5,
        10,
        [
          'Get a glass of water. Drink it.',
          'Take a moment to sit down.',
          'Set a reminder for when to do this routine again (every 2-3 days is reasonable)',
          'Remember: You maintained your space even with low energy. That\'s strength.',
          'You\'re doing better than you think you are. ❤️'
        ]
      ),
    ],
  },
];
