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

export const additionalPlaybookTemplates: Omit<Playbook, 'id' | 'createdAt' | 'linkedTaskIds'>[] = [
  // ============================================================
  // PLAYBOOK 16: ENTRYWAY DEEP CLEAN
  // ============================================================
  {
    title: 'Entryway Deep Clean - First Impressions',
    description: 'Your entryway sets the tone for your entire home. Create a welcoming, organized space that makes coming home feel good and leaving feel less chaotic.',
    category: 'Entrance & Dining',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 2,
    tags: { rooms: ['entryway'], activityType: ['deep-clean'], duration: ['60-120'] },
    steps: [
      step('Gather Entryway Supplies', 'All-purpose cleaner, glass cleaner, dusting cloths, vacuum, mop, organizing bins, trash bag.', 5, 0, ['Put on some music', 'Have everything in one caddy']),
      step('Complete Declutter Blitz', 'Remove everything that doesn\'t belong in the entryway. Sort items: keep here, relocate to another room, donate, discard. Be honest about what you actually use daily.', 20, 1, ['Use a basket to collect items for other rooms', 'If it\'s been there 2+ weeks, it needs a home']),
      step('Shoe & Coat Organization', 'Remove all shoes from area. Clean shoe storage rack/area. Return only regularly-worn shoes. Organize coats by season and frequency of use.', 15, 2, ['Donate shoes you never wear', 'Limit to what fits your storage']),
      step('Wall & Switch Wipe-Down', 'Wipe down walls around light switches and door frames. Remove any scuff marks or fingerprints. These high-touch areas get surprisingly dirty.', 10, 3, ['Magic eraser for scuff marks', 'Disinfect switches']),
      step('Door Deep Clean', 'Wipe down front door interior and exterior. Clean doorknob/handle until it shines. Don\'t forget the area around the lock. Clean door frame and threshold.', 10, 4, ['Polish hardware for a fresh look', 'Check weatherstripping condition']),
      step('Window & Glass Treatment', 'Clean any windows or glass in/near door. Wipe down window sills and tracks. Clean any glass in picture frames or decor.', 10, 5, ['Streak-free with microfiber', 'Natural light opens up the space']),
      step('Mirror Magic', 'Clean entryway mirror streak-free. Wipe down mirror frame. A clean mirror makes the space feel bigger.', 5, 6, ['Check from different angles for streaks', 'Last visual check before leaving!']),
      step('Furniture & Surface Care', 'Wipe down console table or entry bench. Clean any seating areas. Clean cushions or upholstery as needed.', 10, 7, ['Check for dust on shelves', 'Condition wood if needed']),
      step('Decorative Items Dust', 'Dust all vases, knick-knacks, picture frames. Clean and polish any decorative items. Less is more - remove excess decor.', 10, 8, ['Simplify for easier maintenance', 'Seasonal rotation keeps it fresh']),
      step('Storage Unit Clean-Out', 'Empty shoe racks completely. Wipe down with all-purpose cleaner. Clean inside of any storage bins or cabinets. Organize items as you return them.', 15, 9, ['Only return what you use', 'Label bins if helpful']),
      step('Floor & Mat Refresh', 'Shake out or vacuum entry mats/rugs outside. Sweep or vacuum floor thoroughly. Get into corners and under furniture. Mop floor with appropriate cleaner.', 15, 10, ['Entry mats trap most dirt', 'Wash mats monthly']),
      step('Air Vent & Light Fixture Care', 'Remove and clean air vent covers. Dust and clean light fixtures. Replace any burnt-out bulbs.', 10, 11, ['Good lighting = welcoming space', 'Bright bulbs help finding things']),
      step('Umbrella Stand & Accessories', 'Empty and clean umbrella stand. Organize umbrellas (discard broken ones). Clean any hooks, key holders, or mail organizers.', 5, 12, ['Only keep working umbrellas', 'Clean hooks regularly']),
      step('Final Organization & Styling', 'Return only essential, beautiful items. Ensure everyone in household has designated space for their items. Add a welcoming touch: fresh flowers, seasonal decor.', 10, 13, ['Step back and admire!', 'Take a photo for motivation']),
    ],
  },

  // ============================================================
  // PLAYBOOK 17: GARAGE DEEP CLEAN
  // ============================================================
  {
    title: 'Garage Deep Clean - Reclaim Your Space',
    description: 'Transform your garage from chaotic storage nightmare to organized, functional space. Tackles the unique challenges of garage cleaning while keeping you focused.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { rooms: ['garage'], activityType: ['deep-clean', 'organize'], duration: ['120+'] },
    steps: [
      step('Prep & Safety Check', 'Wear work gloves and appropriate clothing. Gather: heavy-duty trash bags, broom, vacuum, cleaning supplies, storage bins, labels. Open garage door for ventilation.', 10, 0, ['Safety first!', 'Hydrate and set realistic expectations']),
      step('The Great Emptying', 'Remove ALL items from garage (yes, everything). Place items on driveway or lawn in categories. Work in sections if needed for very full garages.', 45, 1, ['This seems overwhelming but is essential', 'Take photos first for motivation']),
      step('Ruthless Sorting', 'Create piles: Keep, Donate, Sell, Recycle, Trash. Be honest about what you actually use. Broken tools? Trash. Duplicate items? Choose the best one.', 40, 2, ['Items untouched 2+ years? Let them go', 'Be ruthless - this is your chance']),
      step('Ceiling & Wall Attack', 'Dust ceiling fixtures and remove cobwebs. Wipe down walls with damp cloth. Pay attention to areas with oil stains or marks. Clean light fixtures.', 20, 3, ['Replace bulbs if needed', 'Better lighting = safer space']),
      step('Window & Door Cleaning', 'Clean garage windows inside and out. Wipe down window sills and tracks. Clean garage door interior and exterior.', 15, 4, ['Include any side entry door', 'Windows bring in natural light']),
      step('Shelving & Storage Deep Clean', 'Wipe down all shelf surfaces thoroughly. Clean inside cabinets if you have them. Repair any wobbly or damaged shelving.', 25, 5, ['Sturdy shelves = safe storage', 'Consider adding more if needed']),
      step('Floor Sweep & Debris Removal', 'Sweep entire floor thoroughly. Remove all dirt, dust, and debris. Get into all corners and edges. Use vacuum for finer dust.', 20, 6, ['Don\'t skip the corners', 'Good prep for stain treatment']),
      step('Stain Treatment', 'Apply degreaser to oil stains or spills. Scrub with stiff brush. Rinse with water (use hose if available). Allow to dry before replacing items.', 30, 7, ['Let degreaser sit before scrubbing', 'Repeat for stubborn stains']),
      step('Workbench Reset', 'Clear off workbench completely. Wipe down with all-purpose cleaner. Organize workbench drawers if applicable. Set up tool organization system.', 20, 8, ['A clear bench is a usable bench', 'Pegboard for frequently used tools']),
      step('Tool Cleaning & Organization', 'Wipe down all tools with damp cloth. Apply rust prevention if needed. Organize tools by type and frequency of use. Hang frequently used tools for easy access.', 25, 9, ['Store seasonal tools together', 'Label where tools go for easy return']),
      step('Lawn Equipment Maintenance', 'Clean lawn mower, trimmer, leaf blower. Check gas levels and remove old gas if needed. Wipe down bikes and outdoor sports equipment.', 20, 10, ['Seasonal maintenance is key', 'Store related equipment together']),
      step('Storage Bin Organization', 'Place "Keep" items into clear storage bins. Label ALL bins clearly and specifically. Use bins for categories: holiday decor, camping, sports.', 35, 11, ['Clear bins = find things faster', 'Keep frequently used items at eye level']),
      step('Trash & Recycling Area', 'Clean trash and recycling bins thoroughly. Disinfect interiors and exteriors. Designate specific area for bins.', 15, 12, ['Easy access encourages use', 'Consider a bin for donations too']),
      step('Final Placement & Optimization', 'Return items to garage in organized fashion. Place frequently used items near door. Keep floor space as clear as possible. Create zones: tool zone, sports zone, seasonal zone.', 30, 13, ['Ensure car(s) can fit!', 'Label shelves and areas for maintenance']),
      step('Celebrate & Plan Maintenance', 'Take before/after photos for motivation. Set calendar reminder for quarterly garage check. Admire your transformation!', 5, 14, ['You did it!', 'Share with supportive friends']),
    ],
  },

  // ============================================================
  // PLAYBOOK 18: MONTHLY DEEP CLEAN CHECKLIST
  // ============================================================
  {
    title: 'Monthly Deep Clean Checklist',
    description: 'Tasks that need attention monthly but not weekly. Keeps your home in top shape without the commitment of full deep cleans every week.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { rooms: ['whole-home'], activityType: ['maintenance'], duration: ['120+'] },
    steps: [
      step('Kitchen Cabinet Wipe-Down', 'Wipe down all kitchen cabinet exteriors. Pay attention to handles and around stove (grease buildup). Use appropriate cleaner for your cabinet material.', 20, 0, ['Start near the stove - most buildup there', 'Don\'t forget above the fridge']),
      step('Appliance Deep Clean', 'Clean inside microwave thoroughly. Wipe down oven exterior and stovetop in detail. Clean toaster crumb tray and exterior. Descale coffee maker with vinegar solution.', 30, 1, ['Steam microwave for easy cleaning', 'Run empty dishwasher cycle with vinegar']),
      step('Refrigerator Deep Dive', 'Remove all items from fridge. Check expiration dates and discard old food. Wipe down all shelves and drawers. Clean door seals and exterior.', 30, 2, ['Vacuum coils if accessible', 'Baking soda box for freshness']),
      step('Trash Can Cleaning', 'Empty and clean kitchen trash can. Disinfect interior and exterior. Clean bathroom and bedroom trash cans too. Replace liners.', 15, 3, ['Sprinkle baking soda in bottom', 'Fresh liners feel better']),
      step('Laundry Room Deep Clean', 'Wipe down washer and dryer thoroughly. Clean inside washer drum with cleaning cycle. Clean lint trap and vent area. Wipe down cabinets and organize supplies.', 25, 4, ['Check for lint buildup - fire hazard', 'Clean door seals on front loaders']),
      step('Furniture Polish & Care', 'Clean and polish all wood furniture. Treat leather furniture with appropriate conditioner. Vacuum under furniture cushions thoroughly.', 20, 5, ['Check for lost items under cushions!', 'Condition leather seasonally']),
      step('Drawer & Cabinet Organization', 'Tackle one problem drawer or cabinet per month. Empty completely, wipe down interior. Reorganize contents, discard unused items.', 15, 6, ['One at a time = manageable', 'Rotate which one each month']),
      step('Duvet & Blanket Wash', 'Wash heavy bedding that doesn\'t get weekly washing. Duvets, comforters, decorative blankets. Follow care instructions carefully.', 10, 7, ['Check if it fits your washer', 'Laundromat for oversized items']),
      step('Baseboard Detail', 'Wipe down all baseboards in home. Use damp cloth and all-purpose cleaner. Get into corners where dust accumulates.', 25, 8, ['Work room by room', 'Use old sock on hand for easy wiping']),
    ],
  },

  // ============================================================
  // PLAYBOOK 19: SPRING DEEP CLEAN
  // ============================================================
  {
    title: 'Spring Deep Clean - Fresh Start',
    description: 'The comprehensive spring cleaning that resets your entire home after winter. Tackles areas often neglected during regular cleaning and brings fresh energy to your space.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { rooms: ['whole-home'], activityType: ['seasonal', 'deep-clean'], duration: ['120+'] },
    steps: [
      step('Plan Your Attack', 'Review all areas needing spring attention. Gather all necessary supplies. Schedule time blocks over several days if needed.', 15, 0, ['Don\'t try to do everything in one day', 'Realistic planning = success']),
      step('Window Washing Marathon', 'Wash ALL windows inside and out. Clean screens and tracks thoroughly. Remove storm windows if applicable.', 90, 1, ['This makes the biggest visual difference', 'Cloudy day = fewer streaks']),
      step('Blind & Curtain Refresh', 'Dust all blinds thoroughly. Take down and wash curtains. Consider professional cleaning for heavy drapes.', 45, 2, ['Check care labels', 'Vacuum curtains if can\'t wash']),
      step('Ceiling Fan & Light Fixture Deep Clean', 'Clean all ceiling fans thoroughly. Dust light fixtures and chandeliers. Replace burnt-out bulbs throughout house. Clean lamp shades.', 40, 3, ['Pillowcase trick for fan blades', 'Brighter home = brighter mood']),
      step('Air Filter Replacement', 'Replace HVAC air filters. Note filter sizes for future reference. Schedule professional HVAC maintenance if due.', 15, 4, ['Date the new filter', 'Consider upgrading filter quality']),
      step('Carpet & Upholstery Deep Clean', 'Vacuum all carpets thoroughly. Steam clean or hire professional cleaning. Vacuum all upholstered furniture, including under cushions.', 90, 5, ['Move furniture to get everywhere', 'Renting a steam cleaner saves money']),
      step('Closet Seasonal Switch', 'Switch winter clothes for spring/summer wardrobe. Declutter as you go - donate items not worn this season. Store winter items in clean bins.', 60, 6, ['Vacuum closet floor while empty', 'Cedar blocks prevent moths']),
      step('Outdoor Area Prep', 'Clean outdoor furniture. Sweep porches and patios. Trim bushes near house. Clear gutters and downspouts.', 60, 7, ['Power wash if you have one', 'Prep for outdoor season']),
      step('Deep Clean One Overlooked Area', 'Behind/under refrigerator. Inside oven completely. Behind washer/dryer. Choose your nemesis and conquer it!', 30, 8, ['Pick your worst area', 'Feels amazing when done']),
      step('Fresh Air & Finishing Touches', 'Open windows and let fresh air circulate. Add spring touches: fresh flowers, lighter decor. Celebrate your hard work!', 15, 9, ['You did it!', 'Before/after photos for motivation']),
    ],
  },

  // ============================================================
  // PLAYBOOK 20: FALL DEEP CLEAN
  // ============================================================
  {
    title: 'Fall Deep Clean - Cozy Prep',
    description: 'Prepare your home for the cozy season with this fall deep clean. Focus on areas that will matter most during the months you\'ll be spending more time indoors.',
    category: 'Whole Home',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { rooms: ['whole-home'], activityType: ['seasonal', 'deep-clean'], duration: ['120+'] },
    steps: [
      step('HVAC & Heating System Prep', 'Replace air filters. Clean air vents and registers. Schedule professional furnace inspection. Test heating system before you really need it.', 30, 0, ['Better to find problems now', 'Change filters every 1-3 months']),
      step('Window & Door Weatherization', 'Check all window seals. Apply weatherstripping where needed. Clean and repair storm windows. Check door sweeps and thresholds.', 45, 1, ['Energy savings add up', 'Draft = money flying out']),
      step('Gutter Cleaning', 'Clean all gutters and downspouts. Remove leaves and debris. Check for any needed repairs. Ensure proper drainage away from house.', 60, 2, ['Safety first with ladders', 'Consider gutter guards']),
      step('Closet Seasonal Switch', 'Bring out fall and winter clothing. Store summer items in clean bins. Declutter as you switch - donate unworn items.', 60, 3, ['Check winter coats and boots', 'Wash before storing summer items']),
      step('Fireplace & Chimney Prep', 'Clean fireplace thoroughly. Remove ash and debris. Schedule professional chimney inspection/cleaning. Stock firewood in organized manner.', 30, 4, ['Skip if no fireplace', 'Safety inspection is important']),
      step('Carpet & Rug Deep Clean', 'Deep clean all carpets. Clean area rugs or take to professional. Consider adding cozy rugs for winter.', 60, 5, ['More time on floors in winter', 'Clean now before heavy use']),
      step('Blanket & Bedding Seasonal Swap', 'Bring out heavier blankets and comforters. Wash all bedding before first use. Store summer-weight bedding properly.', 30, 6, ['Check for items needing replacement', 'Fresh bedding = better sleep']),
      step('Outdoor Furniture Storage', 'Clean all outdoor furniture before storing. Bring in cushions and decorative items. Cover or store furniture properly. Drain and store garden hoses.', 45, 7, ['Protect your investment', 'Empty hoses completely']),
      step('Porch & Entry Prep', 'Clean front porch thoroughly. Add fall seasonal decor. Ensure outdoor lighting works (darker earlier now!). Set up boot tray and umbrella stand.', 30, 8, ['Good lighting for safety', 'Welcoming entry matters']),
      step('Cozy Touches & Finishing', 'Add cozy elements: throw blankets, pillows. Check all indoor lighting (more time spent inside). Stock up on candles and cozy scents.', 20, 9, ['You\'re ready for the cozy season!', 'Enjoy your prepared home']),
    ],
  },

  // ============================================================
  // PLAYBOOK 21: KITCHEN DECLUTTER
  // ============================================================
  {
    title: 'Kitchen Declutter Deep Dive',
    description: 'Tackle kitchen clutter systematically, from gadgets you never use to expired pantry items. Creates a more functional, less overwhelming cooking space.',
    category: 'Kitchen',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { rooms: ['kitchen'], activityType: ['declutter', 'organize'], duration: ['120+'] },
    steps: [
      step('Tupperware Takeover', 'Empty all food storage containers. Match lids to containers - discard orphans. Stack and organize by size. Keep only what you actually use.', 20, 0, ['Lid without container = trash', 'Less is more here']),
      step('Dish Purge', 'Remove all dishes from cabinets. Discard cracked or chipped items. Donate mismatched sets you don\'t love. Keep service for number of people you actually host.', 25, 1, ['Cracked dishes = safety hazard', 'You don\'t need 20 plates']),
      step('Glass & Mug Reduction', 'Empty glass/mug cabinet. Discard chipped glasses. Keep favorite mugs only (not every promotional mug ever received). Donate excess.', 15, 2, ['How many do you actually use?', 'Keep only ones you love']),
      step('Gadget Reality Check', 'Remove all kitchen gadgets and tools. When did you last use that avocado slicer? Keep versatile tools, remove single-use items.', 25, 3, ['Be honest!', 'Do you really need 3 can openers?']),
      step('Pantry Expiration Expedition', 'Check ALL expiration dates. Discard expired goods immediately. Group similar items together. Create "use soon" section for near-expiration items.', 30, 4, ['This prevents future food waste', 'First in, first out system']),
      step('Spice Rack Refresh', 'Check spice expiration dates (they do expire!). Discard dried-out or flavorless spices. Organize alphabetically or by cuisine type.', 15, 5, ['Ground spices: 2-3 years', 'Whole spices: 3-4 years']),
      step('Under-Sink Organization', 'Remove everything from under sink. Discard mostly-empty cleaning products. Check for old sponges and scrubbers. Organize remaining items in bins.', 20, 6, ['Check for leaks while empty', 'Group similar products']),
      step('Appliance Assessment', 'Review all small appliances. Be honest about that bread maker you used once. Keep appliances you use monthly or more.', 15, 7, ['Store or donate rarely-used items', 'Counter space is valuable']),
      step('Utensil Drawer Overhaul', 'Empty utensil drawer completely. Discard broken items and duplicates. Keep one good version of each tool type. Use drawer dividers.', 15, 8, ['This drawer collects junk', 'Organize by frequency of use']),
      step('Final Organization & Cleaning', 'Wipe down all empty cabinets and drawers. Return only kept items in organized fashion. Label pantry sections if helpful. Admire your functional kitchen!', 20, 9, ['You did it!', 'Maintain with monthly quick checks']),
    ],
  },

  // ============================================================
  // PLAYBOOK 22: CLOSET DECLUTTER
  // ============================================================
  {
    title: 'Closet Declutter - Wardrobe Reset',
    description: 'Transform your closet from overwhelming chaos to curated collection. This systematic approach helps you identify what you truly wear and love, making getting dressed easier every day.',
    category: 'Bedroom',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { rooms: ['bedroom'], activityType: ['declutter', 'organize'], duration: ['120+'] },
    steps: [
      step('The Great Removal', 'Take EVERYTHING out of closet. Yes, everything - this is essential. Place on bed or clean floor area.', 15, 0, ['Seeing it all is powerful', 'Trust the process']),
      step('The Honest Try-On', 'Try on anything you\'re uncertain about. If it doesn\'t fit or make you feel good, it goes. Create piles: Keep, Donate, Sell, Repair, Trash.', 45, 1, ['If you hesitate, it\'s probably a no', 'How do you FEEL in it?']),
      step('The One-Year Rule', 'If you haven\'t worn it in a year (exceptions for formal wear), let it go. Be honest - you\'re not saving it "just in case."', 15, 2, ['Formal wear gets a pass', 'That "someday" pile? Let it go']),
      step('Damage Assessment', 'Examine kept items for damage. Stained, ripped, or pilled items: trash or repair pile. Be realistic about what you\'ll actually repair.', 15, 3, ['Schedule repair pile immediately', 'If you won\'t fix it, trash it']),
      step('Seasonal Sort', 'Separate by season if you have storage space. Out-of-season items can be stored in bins. This reduces closet overwhelm.', 10, 4, ['Only current season in closet', 'Labeled bins for storage']),
      step('Closet Deep Clean', 'Vacuum or sweep empty closet floor. Wipe down shelves and rods. Clean any closet organizers.', 10, 5, ['While it\'s empty!', 'Check for pests or mold']),
      step('Strategic Return', 'Organize by category (pants, shirts, dresses). Then by color within categories. Hang items facing same direction. Use matching hangers if possible.', 25, 6, ['Matching hangers = visual calm', 'This makes getting dressed easier']),
      step('Shoe Edit', 'Apply same rules to shoes. Worn out? Uncomfortable? Haven\'t worn in a year? Out. Organize remaining shoes by type or frequency of use.', 15, 7, ['Your feet deserve comfort', 'Only keep what you love']),
      step('Accessory Organization', 'Sort through scarves, belts, bags. Keep only loved and used items. Organize in a way that makes them visible and accessible.', 10, 8, ['Visible = you\'ll use them', 'Rotate seasonally']),
      step('Donation Box Prep', 'Box up donation items immediately. Put box in car trunk today. Schedule donation drop-off on calendar. Don\'t let it sit!', 10, 9, ['If it sits, you\'ll second-guess', 'Out the door TODAY']),
    ],
  },

  // ============================================================
  // PLAYBOOK 23: PAPER AVALANCHE CONTROL
  // ============================================================
  {
    title: 'Paper Avalanche Control',
    description: 'Tackle the paper clutter that accumulates everywhere. From mail piles to old documents, establish a paper management system that actually works.',
    category: 'Office',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { rooms: ['office'], activityType: ['declutter', 'organize'], duration: ['120+'] },
    steps: [
      step('Gather All Paper', 'Collect paper from every room. Counters, drawers, "junk drawer," car, everywhere. Create one central sorting station.', 15, 0, ['This is usually more than expected', 'Don\'t panic, just collect']),
      step('Create Sorting System', 'Set up labeled piles: File, Action Needed, Shred, Recycle, Scan. Get folders ready for filing. Position shredder and recycle bin nearby.', 10, 1, ['Labels prevent overwhelm', 'Clear categories = faster sorting']),
      step('Mail Mountain', 'Sort all mail first - it\'s usually most of the pile. Recycle junk mail immediately. Shred anything with personal info. File important documents.', 25, 2, ['Touch each piece once', 'Unsubscribe from junk mailers']),
      step('Old Bills & Statements', 'Check retention requirements for your situation. Generally: tax-related keep 7 years, other bills 1 year. Shred old financial documents.', 20, 3, ['Go paperless for future', 'Most banks have online archives']),
      step('Medical & Insurance Papers', 'Create medical file with current info. Shred old insurance cards and outdated medical records. Keep: current insurance cards, recent medical summaries.', 15, 4, ['Current cards in wallet', 'Explanations of benefits: 1 year']),
      step('Receipts & Warranties', 'Keep only receipts for: taxes, warranties still valid, returns you might make. Store warranties with product manuals (or digitally).', 15, 5, ['Most stores reprint receipts', 'Take photos of important receipts']),
      step('Kids\' Papers & Artwork', 'Keep only meaningful pieces. Take photos of artwork before recycling. Create memory box for truly special items.', 20, 6, ['Don\'t keep every worksheet', 'Photos preserve memories without bulk']),
      step('Manuals & Instructions', 'Most are available online now. Keep only for items you actually use and can\'t find online. Recycle the rest.', 10, 7, ['Google "product name manual"', 'Save digital copies']),
      step('Magazine & Catalog Purge', 'Keep only current month\'s magazines. Tear out any recipes/articles you want, recycle rest. Cancel catalog subscriptions you don\'t want.', 10, 8, ['Digital subscriptions save space', 'Catalogchoice.org to unsubscribe']),
      step('Filing & Shredding', 'File all "keep" papers in organized system. Shred all sensitive documents. Recycle all non-sensitive paper.', 20, 9, ['Alphabetical or by category', 'Regular shredding prevents buildup']),
      step('System Setup for Future', 'Create daily mail sorting spot. Set up action file for items needing attention. Schedule weekly 10-minute paper processing.', 10, 10, ['A system prevents future avalanches', 'Consistency is key']),
    ],
  },

  // ============================================================
  // PLAYBOOK 24: MORNING RESET ROUTINE
  // ============================================================
  {
    title: 'Morning Reset Routine',
    description: 'Start your day with intention and set yourself up for success. This gentle morning routine helps you transition into the day without overwhelm, creating structure that supports your neurodivergent brain.',
    category: 'Self-Care',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { activityType: ['daily-routine', 'self-care'], duration: ['15-30'] },
    steps: [
      step('Wake Up Gently', 'Use a gentle alarm or wake-up light. Give yourself 5 minutes before getting up. No phone scrolling yet - just be present.', 5, 0, ['Gentle start = better day', 'Sunlight alarm can help']),
      step('Make Your Bed', 'Pull up covers and arrange pillows. This one small win sets positive tone for the day. Your future self will thank you tonight.', 3, 1, ['First task completed!', 'Creates visual calm']),
      step('Get Dressed to Shoes', 'Change out of pajamas even if working from home. Getting "ready" signals your brain it\'s time to function. Shoes are optional.', 5, 2, ['Pajamas = rest mode to brain', 'Comfy but functional clothes']),
      step('Bathroom Swish & Swipe', 'Quick wipe of bathroom sink and counter. Wipe down mirror if needed. Quick toilet bowl swish.', 3, 3, ['Prevents bathroom overwhelm later', '30 seconds makes a difference']),
      step('Kitchen Quick Reset', 'Empty dishwasher if needed. Wipe down counter and sink. Start coffee/tea.', 5, 4, ['Clean kitchen = calmer morning', 'Prep tonight\'s dishes now']),
      step('Hydrate & Take Meds', 'Drink full glass of water. Take any morning medications. Eat a small breakfast if that works for you.', 5, 5, ['Dehydration affects focus', 'Meds with food if needed']),
      step('Check Your Tools', 'Review calendar and to-do list. Identify top 3 priorities for the day. Set intentions without pressure.', 4, 6, ['Just 3 priorities', 'Intentions, not demands']),
    ],
  },

  // ============================================================
  // PLAYBOOK 25: EVENING WIND-DOWN ROUTINE
  // ============================================================
  {
    title: 'Evening Wind-Down Routine',
    description: 'Prepare your mind and space for restful sleep. This evening routine helps you transition from the day\'s demands to rest, setting up tomorrow for success.',
    category: 'Self-Care',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 1,
    tags: { activityType: ['daily-routine', 'self-care'], duration: ['30-60'] },
    steps: [
      step('Kitchen Closing Time', 'Wash or load all dishes. Wipe down counters and sink. Start dishwasher if full. Waking up to a clean kitchen is a gift to yourself.', 10, 0, ['Tomorrow you will thank you', 'Set coffee maker if applicable']),
      step('Living Space Quick Pick-Up', 'Return items to their homes. Fluff pillows and fold throws. Quick tidy of visible clutter.', 5, 1, ['10 minutes max', 'Good enough is good enough']),
      step('Tomorrow Prep', 'Lay out clothes for tomorrow. Pack bag/lunch if needed. Check calendar for tomorrow. Reduces morning decision fatigue.', 7, 2, ['Decisions made = energy saved', 'Include weather-appropriate options']),
      step('Bathroom Evening Routine', 'Skincare routine. Brush teeth. Quick counter wipe.', 8, 3, ['Self-care matters', 'Consistent routine helps sleep']),
      step('Bedroom Prep', 'Turn down bed. Adjust temperature for sleeping. Close blinds/curtains. Set out water glass.', 3, 4, ['Cool room = better sleep', 'Phone on charger, face down']),
      step('Wind-Down Activity', 'Read a few pages. Light stretching. Journaling. No screens for 30 min before bed if possible.', 0, 5, ['Variable time - no pressure', 'Whatever helps you decompress']),
      step('Final Check', 'Doors locked. Lights off. Phone on charger (outside bedroom if possible).', 2, 6, ['Security = peace of mind', 'You\'re ready for rest']),
    ],
  },

  // ============================================================
  // PLAYBOOK 26: LAUNDRY DAY SYSTEM
  // ============================================================
  {
    title: 'Laundry Day System',
    description: 'Transform laundry from an overwhelming mountain to a manageable system. Breaks down the entire laundry process with timing that works with your actual life.',
    category: 'Cleaning',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { rooms: ['whole-home'], activityType: ['maintenance'], duration: ['120+'] },
    steps: [
      step('Gather & Sort', 'Collect all dirty laundry from hampers. Sort by color and fabric type. Whites, darks, colors, delicates. Check pockets!', 10, 0, ['Lips in pockets = disaster', 'Kids pockets especially!']),
      step('Pre-Treat Stains', 'Check all items for stains. Apply stain remover to problem areas. Let sit while you prep first load.', 5, 1, ['Treat ASAP for best results', 'Keep stain remover by hampers']),
      step('Load #1 - Whites/Lights', 'Load washer without overfilling. Add detergent (measure - more isn\'t better). Start cycle. Set timer for when it will be done.', 5, 2, ['Don\'t overfill!', 'Timer prevents forgetting']),
      step('Break Time', 'Do something else while washer runs. This isn\'t wasted time - it\'s built-in breaks.', 0, 3, ['30-45 min break', 'Guilt-free break time']),
      step('Transfer to Dryer', 'Move wet clothes to dryer. Clean lint trap (every time!). Set appropriate heat level. Start dryer.', 5, 4, ['Lint trap = fire safety', 'Shake items before loading']),
      step('Load #2 Start', 'Load next batch in washer. Start cycle. Set timer.', 5, 5, ['Keep the system moving', 'Efficiency in motion']),
      step('Break Time #2', 'Continue with your day. Set phone reminder for dryer completion.', 0, 6, ['Variable time', 'Reminders prevent forgetting']),
      step('Fold Load #1 Immediately', 'As soon as dryer stops, fold clothes. Folding immediately prevents wrinkles and overwhelming piles. Put folded items in basket by person/room.', 15, 7, ['Warm clothes fold easier', 'No more "the chair"']),
      step('Continue Cycle', 'Move load 2 to dryer. Start load 3 if needed. Repeat process until all laundry is complete.', 0, 8, ['Variable time', 'Keep the momentum']),
      step('Put Away Session', 'Put away all folded laundry. Don\'t leave baskets sitting - that\'s how the system breaks down. Everything in its proper place.', 20, 9, ['Today, not "later"', 'This completes the cycle']),
      step('Sheet Day', 'Strip beds and wash sheets. Follow same process. Make beds with fresh sheets immediately when dry.', 30, 10, ['Only if it\'s sheet day', 'Fresh sheets = best feeling']),
      step('Laundry Room Reset', 'Wipe down washer and dryer. Organize laundry supplies. Empty lint trap one more time. Sweep floor.', 10, 11, ['Clean machine = clean clothes', 'You did it!']),
    ],
  },

  // ============================================================
  // PLAYBOOK 27: MEAL PREP FOR THE WEEK
  // ============================================================
  {
    title: 'Meal Prep for the Week',
    description: 'Plan, shop, and prepare meals for the entire week in one focused session. Reduces daily decision fatigue and ensures you have healthy food ready when executive function is low.',
    category: 'Cooking',
    isTemplate: true,
    resetOnRecurrence: true,
    tier: 3,
    tags: { activityType: ['cooking'], duration: ['120+'] },
    steps: [
      step('Menu Planning', 'Review week\'s schedule. Plan 5-7 dinners based on your energy levels. Plan easy meals for busy days. Write grocery list as you plan.', 20, 0, ['Match meals to energy', 'Busy day = easy meal']),
      step('Inventory Check', 'Check fridge, freezer, pantry for what you have. Cross off list items you already own. Note items running low.', 10, 1, ['Avoid buying duplicates', 'Use what you have first']),
      step('Grocery Shopping', 'Shop with your list. Stick to list to avoid overwhelm. Consider pickup/delivery if shopping is exhausting.', 45, 2, ['List = less impulse buying', 'Delivery is self-care']),
      step('Grocery Put-Away', 'Unload groceries. Wash produce that needs washing. Store items properly.', 15, 3, ['Proper storage = longer life', 'Wash what you\'ll eat raw']),
      step('Vegetable Prep', 'Wash and chop vegetables for the week. Store in clear containers. Having them ready makes cooking easier.', 30, 4, ['Visible = you\'ll eat them', 'Prep snack veggies too']),
      step('Protein Prep', 'Portion and season proteins. Freeze individual portions if needed. Marinate items for later in week.', 20, 5, ['Marinating = flavor made easy', 'Label with contents and date']),
      step('Batch Cooking', 'Cook 2-3 full meals that reheat well. Portion into individual containers. Label with contents and date.', 45, 6, ['Soups, stews, casseroles work best', 'Freeze some for emergency meals']),
      step('Breakfast Prep', 'Prep overnight oats, egg cups, smoothie packs. Make breakfast easier for low-morning-function days.', 20, 7, ['Morning you has low willpower', 'Make good choices easy']),
      step('Snack Prep', 'Portion snacks into grab-and-go containers. Wash and prep fruit. Make healthy options easily accessible.', 15, 8, ['Visible = you\'ll eat them', 'Pre-portioned = no decisions']),
      step('Clean As You Go', 'Wash prep dishes. Wipe down counters. Put away equipment.', 20, 9, ['Don\'t save cleanup for later', 'End with a clean kitchen']),
    ],
  },
];
