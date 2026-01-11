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

export const cleaningPlaybookTemplates: Omit<Playbook, 'id' | 'createdAt' | 'linkedTaskIds'>[] = [
  // ============================================================
  // BATHROOM (Quick → Deep)
  // ============================================================
  {
    title: 'Bathroom Deep Clean Reset',
    description: 'A complete bathroom transformation system that tackles every surface, eliminates germs, and creates a spa-like sanctuary. Perfect for when you need a full bathroom refresh.',
    category: 'Bathroom',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { rooms: ['bathroom'], activityType: ['deep-clean'], duration: ['120+'] },
    steps: [
      step('Assemble Your Cleaning Toolkit', 'Gather all supplies: bathroom cleaner, disinfectant, glass cleaner, toilet bowl cleaner, scrub brushes, microfiber cloths, gloves, trash bags.', 10, 0, ['Having everything ready prevents distraction', 'Put on gloves for protection']),
      step('Clear All Surfaces', 'Remove everything from countertops, shelves, shower, and tub. This gives you complete access and makes the space less overwhelming.', 15, 1, ['Sort items as you go: keep, toss, relocate', 'Check products for expiration dates']),
      step('Dispose & Declutter', 'Check all products for expiration dates. Discard empty bottles, old makeup, expired medications. Remove items you no longer use.', 10, 2, ['A clearer bathroom is easier to maintain', 'Dispose of medications properly']),
      step('Dust From Top to Bottom', 'Dust ceiling, light fixtures, and remove any cobwebs. Wipe down exhaust fan/vent cover.', 10, 3, ['This prevents dust from falling on freshly cleaned surfaces', 'Use vacuum attachment for vents']),
      step('Tackle the Shower & Tub', 'Spray shower walls, tub, and fixtures with cleaner. Let sit for 5-10 minutes. Return and scrub thoroughly, paying attention to grout lines.', 30, 4, ['Remove and clean showerhead in vinegar solution', 'Wash or replace shower curtain/liner if needed']),
      step('Glass & Mirror Magic', 'Clean all glass doors with glass cleaner or vinegar solution. Wipe down mirrors until streak-free and sparkling.', 10, 5, ['Don\'t forget mirror edges and frame', 'Use newspaper for streak-free glass']),
      step('Sink & Faucet Deep Clean', 'Spray sink and faucet with cleaner. Use toothbrush for crevices around the faucet. Scrub sink bowl thoroughly. Polish faucet until it shines.', 15, 6, ['Clean drain and ensure it\'s running freely', 'Use baking soda for tough stains']),
      step('Counter & Cabinet Care', 'Wipe down all countertops thoroughly. Clean under items as you replace them. Wipe down cabinet exteriors and handles.', 10, 7, ['Organize items as you replace them', 'Declutter unused products']),
      step('Toilet Total Sanitization', 'Apply toilet bowl cleaner and let sit. Wipe down exterior: tank, handle, base, and surrounding floor area. Scrub inside of bowl. Clean seat and lid - both sides.', 15, 8, ['Disinfect the handle and flush lever', 'Clean around the base carefully']),
      step('Wall Wipe-Down', 'Wipe walls, especially around shower area. Remove any soap scum, mildew, or water spots.', 10, 9, ['Pay attention to corners and edges', 'Use mildew remover if needed']),
      step('Floor Finish', 'Sweep or vacuum to remove hair and debris. Pay special attention to corners and behind toilet. Mop floor with appropriate cleaner.', 15, 10, ['Get into all the nooks and crannies', 'Clean around the toilet base']),
      step('Air Vents & Fixtures', 'Remove and clean air vent covers. Dust and vacuum inside vents if possible. Wipe down light fixtures and replace burnt-out bulbs.', 10, 11, ['Improve air quality with clean vents', 'Consider new bulbs for brighter light']),
      step('Organize & Restock', 'Replace items neatly in their designated spots. Organize under-sink cabinet. Replace towels with fresh, clean ones. Restock toilet paper and toiletries.', 20, 12, ['Add a nice-smelling hand soap or air freshener', 'Arrange countertop with only essentials']),
    ],
  },

  // ============================================================
  // BEDROOM (Quick → Deep)
  // ============================================================
  {
    title: 'Bedroom Deep Clean Reset',
    description: 'Create your perfect sleep sanctuary with this complete bedroom refresh. This playbook helps you deep clean every corner while maintaining focus and energy.',
    category: 'Bedroom',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 2,
    tags: { rooms: ['bedroom'], activityType: ['deep-clean'], duration: ['120+'] },
    steps: [
      step('Gather Cleaning Supplies', 'Collect: dusting cloths, furniture polish, vacuum, mop, glass cleaner, all-purpose cleaner, trash bags, fresh linens.', 10, 0, ['Having everything ready keeps you in the zone', 'Prepare fresh sheets ahead of time']),
      step('Declutter Surfaces', 'Clear nightstands, dresser tops, desk areas. Sort items: keep, relocate, donate, discard. Put away clothes, books, and miscellaneous items.', 20, 1, ['A clear space is less overwhelming to clean', 'Use a basket to collect items for other rooms']),
      step('Strip the Bed Completely', 'Remove all sheets, pillowcases, mattress cover, and bedspread. Check mattress for any stains and spot-treat if needed. Start laundry with these items.', 10, 2, ['Let the mattress air out while you clean', 'Flip or rotate mattress if needed']),
      step('Dust High to Low', 'Start with ceiling fans and light fixtures. Remove any cobwebs from corners. Dust picture frames and wall art. Work your way down.', 15, 3, ['Work from left to right for consistency', 'Use microfiber cloths - they trap dust better']),
      step('Window & Blind Treatment', 'Clean windows inside and out with glass cleaner. Wipe down window sills and tracks. Dust blinds or wash curtains.', 20, 4, ['Let natural light flood your refreshed space', 'Vacuum curtains if washing isn\'t possible']),
      step('Furniture Deep Clean', 'Wood furniture: Dust and polish with appropriate cleaner. Upholstered pieces: Vacuum thoroughly, including under cushions. Mirrors: Clean with glass cleaner.', 25, 5, ['Wipe down all surfaces on nightstands, dressers, desk', 'Check under cushions for lost items']),
      step('Closet & Drawer Organization', 'Organize closet by sorting through hanging clothes. Fold and organize drawers. Remove items to donate or store seasonally. Wipe down closet shelves and rods.', 30, 6, ['Vacuum closet floor', 'Use this as opportunity to purge unworn items']),
      step('Under-Bed Expedition', 'Move bed away from wall if possible. Vacuum or sweep under the bed thoroughly. Remove any items stored underneath. Clean behind headboard.', 15, 7, ['Great opportunity to reorganize under-bed storage', 'Check for dust bunnies in corners']),
      step('Baseboard & Door Detail', 'Wipe down all baseboards. Clean doors, doorknobs, and light switches. These often-overlooked spots make a big difference.', 15, 8, ['Use damp cloth for baseboards', 'Disinfect frequently touched surfaces']),
      step('Air Vent Care', 'Remove and clean air vent covers. Dust and vacuum inside vents if accessible. This improves air quality in your sleep space.', 10, 9, ['Better air quality = better sleep', 'Replace vent covers securely']),
      step('Floor Care', 'Vacuum carpet thoroughly, including edges and corners. Or sweep and mop hard floors. Move furniture back into place as you go.', 20, 10, ['Get under furniture you moved earlier', 'Pay attention to baseboards']),
      step('Make the Bed Fresh', 'Put on clean sheets with hospital corners. Fluff and arrange pillows. Add mattress cover and bedspread. Arrange decorative pillows and throws.', 15, 11, ['Fresh sheets feel amazing', 'Make it look hotel-worthy']),
      step('Final Touches', 'Replace items on nightstands and dresser (only essentials). Organize books and decorative items. Shake out or vacuum small rugs.', 15, 12, ['Open windows for fresh air if weather permits', 'Add calming scent like lavender']),
      step('Reward & Enjoy', 'Take a moment to appreciate your clean, calm space. Light a candle or add fresh flowers. Your bedroom is now a proper sanctuary.', 5, 13, ['CELEBRATE! You did an amazing job!', 'Take a photo to remember this feeling']),
    ],
  },

  // ============================================================
  // KITCHEN (Weekly Maintenance → Deep Clean)
  // ============================================================
  {
    title: 'Kitchen Weekly Maintenance',
    description: 'Keep your kitchen functional and fresh with this weekly maintenance routine. Less intense than a deep clean but thorough enough to maintain your space.',
    category: 'Kitchen',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 2,
    tags: { rooms: ['kitchen'], activityType: ['maintenance', 'quick-clean'], duration: ['60-120'] },
    steps: [
      step('Supply Check', 'Gather cleaners, sponges, cloths, trash bags.', 5, 0, ['Replace worn sponges', 'Stock up on favorites']),
      step('Appliance Quick Clean', 'Wipe down refrigerator exterior. Clean microwave inside and out. Wipe down other small appliances.', 20, 1, ['Handles get touched most', 'Steam microwave for easy cleaning']),
      step('Counter Reset', 'Clear and wipe all countertops. Disinfect cutting boards. Clean behind countertop appliances.', 15, 2, ['Move appliances weekly', 'Sanitize food prep areas']),
      step('Sink Shine', 'Clean and disinfect sink. Polish faucet. Wipe down area around sink.', 10, 3, ['Baking soda freshens drain', 'Shiny faucet = clean feeling']),
      step('Pantry & Shelves', 'Declutter and organize pantry. Check for expired items. Wipe down shelves as needed.', 20, 4, ['First in, first out', 'Group similar items']),
      step('Fridge & Freezer Check', 'Remove expired items. Wipe down shelves if needed. Organize contents for easy access.', 15, 5, ['Check dates weekly', 'Clean spills immediately']),
      step('Cabinet & Fixture Wipe', 'Wipe down visible cabinet fronts. Clean light fixtures.', 10, 6, ['Focus on high-touch areas', 'Don\'t forget handles']),
      step('Wall & Window Wash', 'Spot clean any splatter on walls. Clean kitchen window.', 10, 7, ['Grease builds up near stove', 'Natural light helps']),
      step('Floor Finish', 'Sweep thoroughly, including corners. Vacuum or mop floor. Clean under appliances if accessible.', 20, 8, ['Kitchen floors need weekly attention', 'Move trash can to clean behind']),
    ],
  },
  {
    title: 'Kitchen Deep Clean Reset',
    description: 'Transform your kitchen from chaos to calm with this comprehensive deep clean. This playbook breaks down the overwhelming task of deep cleaning your kitchen into manageable, timed steps.',
    category: 'Kitchen',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { rooms: ['kitchen'], activityType: ['deep-clean'], duration: ['120+'] },
    steps: [
      step('Assemble Your Cleaning Arsenal', 'Gather all cleaning supplies in one location: all-purpose cleaner, degreaser, glass cleaner, microfiber cloths, scrub brushes, trash bags, and your favorite cleaning playlist.', 10, 0, ['Put on some energizing music to make this more fun', 'Having everything in one place prevents mid-task searching']),
      step('Clear & Declutter', 'Remove everything from countertops, tables, and visible surfaces. Sort items: keep, relocate, discard.', 15, 1, ['A clear space is less overwhelming and faster to clean', 'Use a laundry basket to collect items that belong elsewhere']),
      step('Tackle the Dishes', 'Wash, dry, and put away all dishes. Empty the dishwasher if needed, then load any dirty dishes. Start the dishwasher so it runs while you clean other areas.', 20, 2, ['Run dishwasher while cleaning other areas', 'Soak tough dishes while you work on other tasks']),
      step('Deep Clean Major Appliances', 'Refrigerator: Remove all items, wipe shelves and drawers, clean exterior. Oven: Apply oven cleaner, let sit. Microwave: Heat bowl of water with lemon for 3 minutes, wipe interior. Stove/Range: Remove grates and drip pans, soak in sink.', 45, 3, ['Let cleaners sit while you work on other tasks', 'Vacuum refrigerator coils if accessible']),
      step('Clean Small Appliances', 'Wipe down toaster, coffee maker, blender, mixer, and any other countertop appliances. Empty crumb trays, clean coffee pot with vinegar solution.', 15, 4, ['Polish stainless steel surfaces', 'Run a cleaning cycle through coffee maker']),
      step('Cabinet & Drawer Deep Dive', 'Empty one cabinet/drawer section at a time. Wipe down interiors with all-purpose cleaner. Check for expired items or things you no longer use. Replace items in an organized manner.', 30, 5, ['Wipe down cabinet fronts, handles, and knobs', 'Take this opportunity to reorganize']),
      step('Sink & Faucet Shine', 'Scrub sink with baking soda paste or specialized cleaner. Use toothbrush for tight spots around the faucet. Polish faucet until it shines.', 15, 6, ['Clean and disinfect the area around the sink', 'Use an old toothbrush for crevices']),
      step('Countertop Perfection', 'Spray all countertops with appropriate cleaner. Wipe down thoroughly, paying attention to corners and edges. Clean behind small appliances.', 15, 7, ['Polish any special surfaces (granite, marble, etc.)', 'Move appliances to clean underneath']),
      step('Walls, Windows & Light Fixtures', 'Spot clean any stains or grease splatters on walls. Clean windows inside and out with glass cleaner. Wipe down window sills and tracks. Dust light fixtures.', 20, 8, ['Wash or wipe down curtains/blinds', 'Replace any burnt-out bulbs']),
      step('Floor Finale', 'Sweep thoroughly, including corners and under appliances. Move small appliances to clean underneath if possible. Mop floor with appropriate cleaner for your floor type.', 20, 9, ['Work from the back of the room toward the exit', 'Let floor dry completely before replacing items']),
      step('Trash & Recycling Reset', 'Empty trash can, clean and disinfect interior and exterior. Replace trash bag. Organize recycling bins. Take out all trash and recycling.', 10, 10, ['Clean the trash can with disinfectant', 'Line with a fresh bag']),
      step('Final Touch & Restock', 'Return all items to their clean spaces. Arrange countertops intentionally with only essentials. Replace dish towels with fresh ones. Dispose of old sponges.', 15, 11, ['Stand back and admire your sparkling kitchen!', 'Light a candle or add fresh flowers']),
    ],
  },

  // ============================================================
  // LIVING ROOM
  // ============================================================
  {
    title: 'Living Room Deep Clean Reset',
    description: 'Transform your living space into a welcoming, organized haven. This playbook tackles every surface and corner while keeping you focused.',
    category: 'Living Room',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 2,
    tags: { rooms: ['living-room'], activityType: ['deep-clean'], duration: ['120+'] },
    steps: [
      step('Supply Prep', 'Gather furniture polish, dusting cloths, vacuum with attachments, glass cleaner, all-purpose cleaner, electronics cleaner. Prepare trash bags. Set up your cleaning soundtrack.', 10, 0, ['Music makes cleaning more enjoyable', 'Having supplies ready prevents interruptions']),
      step('Declutter Blitz', 'Remove items that don\'t belong in the living room. Sort magazines, newspapers, mail. Organize remote controls and cords. Create keep/toss/relocate piles.', 20, 1, ['Be ruthless - less stuff means easier cleaning', 'Find homes for wayward items']),
      step('Ceiling & Wall Attention', 'Dust ceiling fans and light fixtures. Remove cobwebs from corners. Spot clean walls, especially around light switches. Dust or clean wall hangings and picture frames.', 15, 2, ['Work from top to bottom', 'Use extendable duster for high areas']),
      step('Window Treatment', 'Clean windows inside and out with glass cleaner. Wipe down window sills and tracks thoroughly. Dust blinds or wash/vacuum curtains.', 20, 3, ['Streak-free windows make a huge difference', 'Open windows for fresh air while cleaning']),
      step('Furniture Deep Clean', 'Sofas and chairs: Vacuum thoroughly, including under cushions. Remove cushion covers and wash if possible. Wood furniture: Dust and polish. Wipe down coffee tables and side tables.', 30, 4, ['Check for lost items under cushions!', 'Clean under furniture if accessible']),
      step('Electronics Care', 'Dust all electronics with microfiber cloth. Clean TV screen with appropriate cleaner. Organize and dust cords and cables. Wipe down remotes, game controllers, and accessories.', 15, 5, ['Use electronics-safe cleaners only', 'Don\'t spray directly on screens']),
      step('Shelving & Storage', 'Remove items from shelves one section at a time. Dust shelves thoroughly. Reorganize books and decorative items as you replace them. Wipe down cabinet doors and knobs.', 20, 6, ['Dust and clean items before returning them', 'This is a good time to declutter']),
      step('Mirror & Glass', 'Clean all mirrors with glass cleaner. Wipe down any glass tables or decor. Polish until streak-free.', 10, 7, ['Use newspaper for streak-free shine', 'Don\'t forget glass picture frames']),
      step('Fireplace Focus', 'Clean fireplace and surrounding area. Remove ashes if wood-burning. Wipe down mantel. Clean fireplace tools and screen.', 15, 8, ['Skip if you don\'t have a fireplace', 'Great opportunity to rearrange mantel decor']),
      step('Baseboard & Door Detail', 'Wipe down all baseboards. Clean doors, handles, and light switches. These finishing touches make everything feel fresh.', 15, 9, ['Often overlooked but makes a big difference', 'Disinfect frequently touched surfaces']),
      step('Air Vent Cleaning', 'Remove and clean air vent covers. Dust and vacuum inside vents if possible.', 10, 10, ['Improves air quality', 'Replace filters if needed']),
      step('Textile Refresh', 'Wash throw pillows and blankets per care instructions. Shake out or vacuum small rugs outside. Steam clean or vacuum larger rugs and carpet.', 15, 11, ['Fresh textiles smell amazing', 'Flip couch cushions for even wear']),
      step('Floor Finale', 'Vacuum carpet thoroughly (if applicable). Or sweep and mop hard floors. Pay attention to edges and under furniture.', 20, 12, ['Work toward the exit', 'Move furniture back if you shifted it']),
      step('Reorganize & Style', 'Return only essential, loved items to surfaces. Arrange furniture back to optimal layout. Fluff pillows and fold throws decoratively. Ensure everything has its place.', 15, 13, ['Less is more', 'Style like it\'s a magazine photo']),
    ],
  },

  // ============================================================
  // OFFICE (Declutter → Deep Clean)
  // ============================================================
  {
    title: 'Declutter Master - Office Edition',
    description: 'A focused decluttering session specifically for office spaces. Reduces paper chaos, organizes supplies, and creates a more productive work environment.',
    category: 'Office',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { rooms: ['office'], activityType: ['declutter', 'organize'], duration: ['60-120'] },
    steps: [
      step('Paper Sorting Station Setup', 'Create piles: File, Action, Shred, Recycle. Get file folders, shredder, recycle bin ready.', 5, 0, ['Clear categories = faster sorting', 'Label each pile']),
      step('Desktop Paper Purge', 'Go through all papers on desk surface. Sort into designated piles. Be ruthless - when in doubt, it probably goes.', 20, 1, ['Touch each paper once', 'Action items need deadlines']),
      step('Drawer Paper Expedition', 'Empty each drawer of papers. Sort methodically. Shred sensitive documents immediately.', 25, 2, ['One drawer at a time', 'Check folders too']),
      step('Filing Action', 'File all "keep" papers in organized system. Create new folders if needed. Label everything clearly.', 20, 3, ['Alphabetical or by project', 'Date-stamp if helpful']),
      step('Supply Organization', 'Gather all pens, pencils, office supplies. Test pens - discard dried out ones. Organize by type in drawer dividers.', 15, 4, ['Only keep what works', 'Group similar items']),
      step('Cord & Cable Control', 'Identify and label all cords. Remove unused adapters and old cables. Use cable organizers or ties.', 10, 5, ['Label both ends', 'Velcro ties are reusable']),
      step('Final Sweep & Wipe', 'Wipe down all surfaces. Return only essential items. Admire your clear workspace.', 15, 6, ['Clear desk policy works', 'You did it!']),
    ],
  },
  {
    title: 'Office Deep Clean Reset',
    description: 'Create a productive, organized workspace that supports focus and creativity. This deep clean tackles every surface and helps you declutter both physically and mentally.',
    category: 'Office',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 2,
    tags: { rooms: ['office'], activityType: ['deep-clean'], duration: ['120+'] },
    steps: [
      step('Assemble Cleaning Tools', 'Gather: electronics-safe cleaner, dusting cloths, all-purpose cleaner, glass cleaner, organizing supplies, trash/recycle bags. Prepare for paper shredding if needed.', 10, 0, ['Electronics need special care', 'Have shredder ready for sensitive documents']),
      step('Desktop Declutter', 'Remove everything from desk surface. Sort papers into: file, action needed, shred, recycle. Identify items that don\'t belong in office.', 20, 1, ['Clear space = clear mind', 'Be ruthless with paper clutter']),
      step('Paper Purge & Organization', 'Sort through all papers and documents. File important documents properly. Shred sensitive materials. Recycle unnecessary papers and junk mail.', 25, 2, ['Organize what remains in designated spots', 'Go paperless where possible']),
      step('Drawer Deep Dive', 'Empty desk drawers one at a time. Wipe down drawer interiors. Discard dried-out pens, broken items, duplicates. Organize contents with dividers or small containers.', 25, 3, ['Keep only what you actually use', 'Test every pen before keeping']),
      step('Tech Clean', 'Wipe down computer monitor with appropriate cleaner. Clean keyboard (use compressed air for between keys). Wipe down mouse, keyboard, laptop. Clean phone or tablet.', 20, 4, ['Organize and manage cords/cables', 'Unplug before cleaning']),
      step('Dust & Polish', 'Dust ceiling, light fixtures, remove cobwebs. Spot clean walls and picture frames. Dust and polish wood furniture. Wipe down all desk surfaces.', 15, 5, ['Don\'t forget the tops of monitors and frames', 'Work top to bottom']),
      step('Window & Wall Care', 'Clean windows inside and out. Wipe window sills and tracks. Clean any glass on picture frames or desk accessories.', 15, 6, ['Natural light boosts productivity', 'Clean glass makes space feel larger']),
      step('Shelving & Storage', 'Empty bookshelves and cabinets section by section. Dust shelves thoroughly. Reorganize books, binders, and supplies. Wipe down cabinet doors and handles.', 20, 7, ['Donate books you\'ve finished', 'Create a system that works for you']),
      step('Chair Care', 'Vacuum office chair thoroughly. Wipe down arms, back, and base. Check and tighten any loose screws. Ensure chair wheels roll smoothly.', 10, 8, ['Clean wheels of hair and debris', 'Adjust height and settings']),
      step('Door & Detail Work', 'Wipe down doors and doorknobs. Clean light switches. Wipe down any baseboards. These small details complete the transformation.', 10, 9, ['Disinfect high-touch surfaces', 'Details matter']),
      step('Floor Finish', 'Vacuum carpet or sweep hard floors. Mop if applicable. Get under and around desk and furniture. Clean any desk mats or rugs.', 15, 10, ['Move chair out to clean underneath', 'Vacuum chair mat']),
      step('Reorganize & Optimize', 'Return only essential items to desktop. Arrange workspace for optimal productivity. Ensure frequently used items are within reach. Add a plant or inspiring decor.', 15, 11, ['Restock supplies: paper, pens, pencils, sticky notes', 'Your workspace should inspire you']),
    ],
  },

  // ============================================================
  // ENTRANCE & DINING
  // ============================================================
  {
    title: 'Entrance, Front Porch & Dining Room',
    description: 'First impressions matter! This playbook helps you create a welcoming entry and organized dining space. Perfect for your weekly rotation.',
    category: 'Entrance & Dining',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 2,
    tags: { rooms: ['entryway'], activityType: ['deep-clean'], duration: ['60-120'] },
    steps: [
      step('Gather Zone Supplies', 'All-purpose cleaner, glass cleaner, dusting cloths, vacuum, mop, trash bag.', 5, 0, ['One caddy for easy transport', 'Check supplies before starting']),
      step('Entrance Declutter', 'Remove items that don\'t belong. Organize shoes and coats. Sort mail and papers.', 15, 1, ['Find homes for everything', 'No pile is too small to address']),
      step('Dust High to Low', 'Light fixtures, picture frames, decorative items. Work from ceiling down to prevent re-dusting.', 10, 2, ['Use extendable duster for high spots', 'Don\'t forget corners']),
      step('Front Door & Hardware', 'Wipe down front door inside and out. Clean doorknob and handle until shiny. Wipe around door frame.', 10, 3, ['First impression for visitors', 'Check weather stripping']),
      step('Windows & Glass', 'Clean all windows and glass surfaces. Wipe window sills and tracks.', 15, 4, ['Streak-free for max light', 'Clean inside and out']),
      step('Dining Area Focus', 'Wipe down dining table and chairs. Clean chair legs and under-seat area. Polish table until it shines.', 15, 5, ['Check for crumbs in crevices', 'Condition wood if needed']),
      step('Light Fixtures', 'Dust and clean all light fixtures. Replace burnt-out bulbs.', 10, 6, ['Good lighting matters', 'Consider energy-efficient bulbs']),
      step('Cobweb Patrol', 'Check corners and ceiling for cobwebs. Remove with duster or vacuum attachment.', 5, 7, ['Often missed but important', 'Check behind furniture too']),
      step('Floor Care', 'Vacuum or sweep thoroughly. Mop entrance and dining area. Shake out or vacuum entry mats.', 15, 8, ['Entry mats catch a lot of dirt', 'Mop toward the exit']),
    ],
  },

  // ============================================================
  // VEHICLE
  // ============================================================
  {
    title: 'The Car Reset - A Calmer Commute',
    description: 'Transform your car from chaotic to calm with this step-by-step vehicle cleaning guide. A clean car creates a more peaceful commute.',
    category: 'Vehicle',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 4,
    tags: { rooms: ['vehicle'], activityType: ['deep-clean'], duration: ['60-120'] },
    steps: [
      step('Gather Car Cleaning Supplies', 'Interior cleaner, glass cleaner, microfiber cloths, trash bag, vacuum with attachments, armor-all or dashboard spray.', 5, 0, ['Portable vacuum works great', 'Trash bag for immediate use']),
      step('Complete Trash Removal', 'Remove all trash from every crevice. Check door pockets, cup holders, under seats. Use trash bag for collection.', 10, 1, ['Check every pocket and corner', 'Don\'t forget trunk']),
      step('Remove All Loose Items', 'Take out everything that doesn\'t belong permanently in the car. Sort: keep in car, bring inside, trash.', 10, 2, ['Only essentials stay', 'Registration and insurance stay']),
      step('Vacuum Interior Thoroughly', 'Vacuum seats, floor mats, floor, trunk. Use attachments for tight spaces. Don\'t forget between seats and under pedals.', 20, 3, ['Remove floor mats to vacuum underneath', 'Crevice tool is essential']),
      step('Dashboard & Console Detail', 'Wipe down dashboard with appropriate cleaner. Clean center console and cup holders. Detail air vents with brush or cloth. Clean steering wheel and shift knob.', 15, 4, ['Q-tips for vents and buttons', 'Disinfect high-touch surfaces']),
      step('Window & Mirror Shine', 'Clean all interior windows and mirrors. Wipe down exterior windows if possible. Ensure streak-free finish.', 10, 5, ['Inside of windshield gets foggy', 'Check for streaks in sunlight']),
      step('Restock & Organize', 'Return only essential items to car. Organize glove box. Ensure emergency supplies are present. Place air freshener if desired.', 5, 6, ['Emergency kit: flashlight, first aid', 'Subtle scent is best']),
    ],
  },

  // ============================================================
  // WHOLE HOME - Speed Cleaning (5min → 15min → 30min → 1hr)
  // ============================================================
  {
    title: '5-Minute Power Reset',
    description: 'When you only have 5 minutes but want to make a visible difference. Perfect for quick resets between tasks or before guests arrive unexpectedly.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { rooms: ['whole-home'], activityType: ['quick-clean'], duration: ['0-15'] },
    steps: [
      step('Kitchen Counter Blitz', 'Wipe down all visible counters. Put dishes in sink or dishwasher.', 2, 0, ['Speed over perfection', 'Focus on what\'s visible']),
      step('Visible Pickup', 'Grab items that are out of place. Return them to proper locations quickly.', 2, 1, ['One quick lap around', 'Basket for wayward items']),
      step('Quick Bathroom Check', 'Wipe down sink and counter. Quick toilet seat wipe.', 1, 2, ['Guest-ready in seconds', 'Close the shower curtain']),
    ],
  },
  {
    title: '15-Minute Express Clean',
    description: 'A focused 15-minute cleaning session that tackles the most visible areas. Creates the illusion of a much longer cleaning session with strategic effort.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { rooms: ['whole-home'], activityType: ['quick-clean'], duration: ['15-30'] },
    steps: [
      step('Dish Dash', 'Load/unload dishwasher or hand-wash quickly. Wipe down sink area.', 4, 0, ['Nothing says "clean" like an empty sink', 'Hide dirty dishes if needed']),
      step('Surface Sprint', 'Wipe all visible surfaces (counters, tables). Focus on kitchen and living areas.', 3, 1, ['Speed wipe only', 'High-impact areas first']),
      step('Bathroom Basics', 'Scrub and sanitize toilet quickly. Wipe sink and counter. Quick mirror wipe.', 3, 2, ['Close shower curtain to hide mess', 'Fresh hand towel']),
      step('Floor Focus', 'Spot-clean high-traffic areas. Quick sweep or vacuum visible areas.', 3, 3, ['Main walkways only', 'Vacuum the most-seen spots']),
      step('Visible Tidy', 'Make bed. Straighten pillows and throws. Put away obvious clutter.', 2, 4, ['Fluffed pillows look inviting', 'Toss clutter in a basket']),
    ],
  },
  {
    title: '30-Minute Home Refresh',
    description: 'A solid half-hour cleaning session that covers the basics in all main areas. Leaves your home noticeably fresher without the commitment of a deep clean.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { rooms: ['whole-home'], activityType: ['quick-clean'], duration: ['30-60'] },
    steps: [
      step('Kitchen Command', 'Wipe counters and appliances. Do dishes or load dishwasher. Spot-clean floor around sink and stove.', 10, 0, ['Kitchen first - high impact', 'Cleans smells improve mood']),
      step('Bathroom Blitz', 'Clean toilet, sink, and mirror quickly. Wipe down counter and fixtures. Spot-mop floor if needed.', 7, 1, ['Disinfect high-touch spots', 'Fresh towels make a difference']),
      step('Bedroom Quick', 'Make bed neatly. Straighten surfaces. Put away clothes.', 5, 2, ['Made bed transforms the room', 'Clothes put away = calm']),
      step('Living Area', 'Dust visible surfaces. Fluff pillows and fold throws. Quick vacuum or sweep main walkways.', 6, 3, ['Focus on what guests see', 'Tidy beats spotless']),
      step('Final Touches', 'Empty visible trash. Put away any remaining clutter.', 2, 4, ['One last sweep through', 'You did it!']),
    ],
  },
  {
    title: 'The 1-Hour Power Clean',
    description: 'A comprehensive one-hour cleaning session that touches every major area. Perfect for weekly maintenance or pre-guest preparation.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { rooms: ['whole-home'], activityType: ['deep-clean', 'maintenance'], duration: ['60-120'] },
    steps: [
      step('Kitchen Deep-ish', 'Clean all appliances exteriors. Wipe counters and backsplash. Do all dishes. Sweep and mop floor.', 20, 0, ['More thorough than speed clean', 'Wipe inside microwave']),
      step('Bathroom Thorough', 'Scrub toilet, sink, and tub/shower. Clean mirrors. Wipe all surfaces. Sweep and mop floor.', 15, 1, ['Really scrub this time', 'Clean behind toilet']),
      step('Bedroom Care', 'Make bed with care. Dust all surfaces. Organize nightstands. Vacuum or sweep floor.', 12, 2, ['Fresh sheets if possible', 'Open windows briefly']),
      step('Living Spaces', 'Dust furniture and electronics. Vacuum upholstery. Clean floors thoroughly.', 10, 3, ['Include oft-forgotten spots', 'Move cushions']),
      step('Final Pass', 'Empty all trash bins. Do final straightening. Ensure everything is in place.', 3, 4, ['The last 5% matters', 'Enjoy your clean home!']),
    ],
  },
  {
    title: 'Weekly Home Blessing - The FlyLady Method',
    description: 'The famous FlyLady weekly home blessing routine adapted for Neurulae. A comprehensive 1-hour speed clean that touches every room for weekly maintenance.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { rooms: ['whole-home'], activityType: ['maintenance'], duration: ['60-120'] },
    steps: [
      step('Change All Bed Sheets', 'Strip beds and start laundry. Make beds with fresh sheets.', 10, 0, ['Fresh sheets = better sleep', 'Start laundry first thing']),
      step('Empty All Trash & Replace Bags', 'Go room to room emptying trash cans. Replace liners. Take trash out to bin.', 5, 1, ['Don\'t forget bathroom trash', 'Stock up on extra bags']),
      step('Dust All Surfaces', 'Dust every room from top to bottom. Use microfiber cloth for efficiency. Don\'t forget picture frames and knick-knacks.', 15, 2, ['Work room by room', 'Dampen cloth slightly']),
      step('Vacuum Entire House', 'Vacuum all carpeted areas. Use attachments for corners and edges. Move light furniture if possible.', 15, 3, ['Systematic room by room', 'Don\'t forget upholstery']),
      step('Mop All Hard Floors', 'Sweep first if needed. Mop kitchen, bathrooms, entryways. Let dry as you continue.', 10, 4, ['Work toward the exit', 'Fresh mop solution']),
      step('Clean Mirrors & Glass', 'All bathroom mirrors. Glass doors. Any other glass surfaces.', 5, 5, ['Streak-free with microfiber', 'Check in natural light']),
      step('Final Touch - Doors & Knobs', 'Wipe down all door knobs. Clean light switches. Wipe visible doors.', 5, 6, ['High-touch = high germ', 'Disinfect these weekly']),
    ],
  },
  {
    title: 'Multi-Room Zone Clean',
    description: 'A comprehensive zone covering bathroom, bedroom, office, and laundry. This weekly rotation keeps your most-used private areas fresh, organized, and functional.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { rooms: ['whole-home', 'bathroom', 'bedroom', 'office'], activityType: ['maintenance'], duration: ['120+'] },
    steps: [
      step('Prep All Zones', 'Gather supplies for all areas: bathroom cleaner, glass cleaner, dusting supplies, vacuum, mop, fresh towels and linens.', 10, 0, ['One trip for supplies', 'Check you have everything']),
      step('Bathroom Quick Clean', 'Clean mirrors and windows. Wipe down counters and sink. Scrub toilet bowl and wipe exterior. Quick shower/tub wipe-down.', 25, 1, ['Focus on high-impact areas', 'Daily wipes make this faster']),
      step('Bathroom Textiles', 'Gather used towels and bath mats. Replace with fresh towels. Check for ripped or stained items to discard.', 10, 2, ['Fresh towels feel luxurious', 'Wash bath mats regularly']),
      step('Bathroom Floors', 'Sweep or vacuum. Mop thoroughly, getting into corners.', 10, 3, ['Hair and dust collect quickly', 'Under the toilet base matters']),
      step('Bedroom Surface Clear', 'Make bed with fresh sheets if it\'s sheet day. Clear nightstands and dresser. Put away any clothes or items.', 20, 4, ['Fresh sheets improve sleep', 'Clear surfaces = calm mind']),
      step('Bedroom Dust & Wipe', 'Dust all furniture surfaces. Wipe down light fixtures.', 15, 5, ['Don\'t forget under the bed', 'Dust attracts more dust']),
      step('Bedroom Floor Care', 'Vacuum or sweep and mop. Get under bed if accessible.', 15, 6, ['Move small furniture', 'Edge along baseboards']),
      step('Office Desk Straighten', 'Clear desk surface. File or organize papers. Wipe down desk and computer area.', 15, 7, ['Clear desk = focused mind', 'Organize cables']),
      step('Laundry Room Organize', 'Wipe down washer and dryer exteriors. Organize laundry supplies. Sweep and spot-mop floor. Check lint trap and clean if needed.', 15, 8, ['Clean lint trap = fire safety', 'Wipe door seals on front loaders']),
      step('All Zone Touch-ups', 'Empty trash in all areas. Do final spot checks. Ensure everything is in its place.', 15, 9, ['Fresh trash bags in all bins', 'Quick final sweep']),
    ],
  },
];
