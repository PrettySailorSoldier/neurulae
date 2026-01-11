import { Playbook } from '@/types';
import { cleaningPlaybookTemplates } from './cleaningPlaybookTemplates';

export const playbookTemplates: Omit<Playbook, 'id' | 'createdAt' | 'linkedTaskIds'>[] = [
  // Include all cleaning playbook templates
  ...cleaningPlaybookTemplates,
  {
    title: 'Clean the Entire House',
    description: 'A comprehensive cleaning routine broken into manageable steps',
    category: 'Cleaning',
    isTemplate: true,
    resetOnRecurrence: true,
    steps: [
      {
        id: crypto.randomUUID(),
        title: 'Gather all cleaning supplies',
        description: 'Collect all needed supplies in a caddy or bucket: all-purpose cleaner, glass cleaner, microfiber cloths, vacuum, mop, trash bags.',
        estimatedMinutes: 10,
        completed: false,
        order: 0,
        tips: [
          'Put on some energizing music to make this more fun',
          'Having everything in one place prevents mid-task searching',
          'Check supplies before starting - avoid mid-clean shopping trips'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Quick declutter pass',
        description: 'Walk through each room and put items back in their places. Don\'t organize yet, just clear surfaces.',
        estimatedMinutes: 20,
        completed: false,
        order: 1,
        tips: [
          'Use a laundry basket to collect items that belong elsewhere',
          'Set a timer - don\'t get lost in organizing drawers',
          'If you find trash, grab a bag and collect as you go'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Dust all surfaces top to bottom',
        description: 'Start with ceiling fans, shelves, and work your way down. Don\'t forget light fixtures, picture frames, and baseboards.',
        estimatedMinutes: 30,
        completed: false,
        order: 2,
        tips: [
          'Work from left to right in each room for consistency',
          'Use microfiber cloths - they trap dust better',
          'Take breaks if needed - this is marathon, not a sprint'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Clean bathrooms',
        description: 'Spray surfaces with cleaner and let sit. Then scrub toilet, sink, tub/shower, and mirrors. Don\'t forget the floor!',
        estimatedMinutes: 40,
        completed: false,
        order: 3,
        tips: [
          'Let cleaner sit while you do another quick task',
          'Start with the toilet so you can wash hands after',
          'Use an old toothbrush for grout and tight corners'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Kitchen deep clean',
        description: 'Wipe down counters, appliances (inside microwave!), sink, and cabinet fronts. Sweep and mop floor.',
        estimatedMinutes: 45,
        completed: false,
        order: 4,
        tips: [
          'Empty sink completely before starting',
          'Warm water helps loosen stuck-on food',
          'Clean as you go to make cooking easier later'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Vacuum and mop all floors',
        description: 'Vacuum all carpets and rugs thoroughly. Then sweep and mop hard floors, working backwards toward the exit.',
        estimatedMinutes: 35,
        completed: false,
        order: 5,
        tips: [
          'Move furniture if possible for a deeper clean',
          'Check vacuum bag/canister before starting',
          'Let floors dry before walking on them'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Final touches and reward',
        description: 'Empty all trash cans, fluff pillows, straighten rugs. Take a moment to admire your clean space!',
        estimatedMinutes: 15,
        completed: false,
        order: 6,
        tips: [
          'Light a candle or use essential oils for fresh scent',
          'Take before/after photos for motivation next time',
          'CELEBRATE! You did an amazing job!'
        ]
      }
    ]
  },
  {
    title: 'Meal Prep for the Week',
    description: 'Plan, shop, and prepare meals for the upcoming week',
    category: 'Cooking',
    isTemplate: true,
    resetOnRecurrence: true,
    steps: [
      {
        id: crypto.randomUUID(),
        title: 'Plan your meals',
        description: 'Choose 3-4 recipes for the week. Write down what you\'ll eat for breakfast, lunch, and dinner. Keep it simple!',
        estimatedMinutes: 20,
        completed: false,
        order: 0,
        tips: [
          'Pick recipes with overlapping ingredients to save money',
          'Check your schedule - plan quick meals for busy days',
          'Include at least one comfort food you love'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Create shopping list',
        description: 'Check your pantry and fridge. Write down everything you need. Organize list by store sections.',
        estimatedMinutes: 15,
        completed: false,
        order: 1,
        tips: [
          'Take inventory first to avoid buying duplicates',
          'Use your phone to take a photo of your list as backup',
          'Add healthy snacks you actually enjoy'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Grocery shopping',
        description: 'Go shopping with your list. Stick to it but be flexible if something you need is unavailable.',
        estimatedMinutes: 45,
        completed: false,
        order: 2,
        tips: [
          'Eat before shopping to avoid impulse buys',
          'Shop off-peak hours if crowds overwhelm you',
          'Use self-checkout if it reduces anxiety'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Prep vegetables and proteins',
        description: 'Wash and chop all vegetables. Cook proteins that can be reheated (grilled chicken, ground beef, etc).',
        estimatedMinutes: 60,
        completed: false,
        order: 3,
        tips: [
          'Put on a podcast or show while prepping',
          'Use sheet pans to cook multiple things at once',
          'Label containers with contents and date'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Assemble meals in containers',
        description: 'Divide prepared food into portion-sized containers. Store in fridge or freezer as appropriate.',
        estimatedMinutes: 30,
        completed: false,
        order: 4,
        tips: [
          'Use clear containers so you can see what\'s inside',
          'Put earliest meals in front of fridge',
          'Keep sauces separate until ready to eat'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Clean up and celebrate',
        description: 'Wash dishes, wipe counters, and take a moment to appreciate your prepared meals. You just made your week easier!',
        estimatedMinutes: 20,
        completed: false,
        order: 5,
        tips: [
          'Clean as you go during prep to minimize end cleanup',
          'Take a photo of your prepared meals for motivation',
          'Treat yourself to something nice - you earned it!'
        ]
      }
    ]
  },
  {
    title: 'Start Learning to Code',
    description: 'Begin your coding journey with foundational concepts',
    category: 'Learning',
    isTemplate: true,
    resetOnRecurrence: false,
    steps: [
      {
        id: crypto.randomUUID(),
        title: 'Choose your first language',
        description: 'Research beginner-friendly languages (Python, JavaScript). Pick one based on your interests (web dev, data, games).',
        estimatedMinutes: 30,
        completed: false,
        order: 0,
        tips: [
          'Python is great for beginners and versatile',
          'JavaScript is essential for web development',
          'Don\'t overthink it - you can learn multiple languages later'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Set up your development environment',
        description: 'Install necessary software: code editor (VS Code), the language runtime, and a browser for testing.',
        estimatedMinutes: 45,
        completed: false,
        order: 1,
        tips: [
          'Follow official installation guides step by step',
          'Join online communities for help with setup issues',
          'Bookmark helpful documentation pages'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Complete "Hello World" tutorial',
        description: 'Write and run your first program. Follow an official getting-started tutorial for your chosen language.',
        estimatedMinutes: 20,
        completed: false,
        order: 2,
        tips: [
          'Type the code yourself - don\'t just copy/paste',
          'Experiment by changing values to see what happens',
          'Celebrate this milestone - you\'re officially coding!'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Learn basic syntax and variables',
        description: 'Study how to declare variables, use data types (numbers, strings, booleans), and write comments.',
        estimatedMinutes: 60,
        completed: false,
        order: 3,
        tips: [
          'Practice with simple examples for each concept',
          'Use print/console.log often to see what\'s happening',
          'Take breaks every 20-30 minutes'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Build a simple calculator',
        description: 'Create a program that takes two numbers and performs basic math operations. This combines everything you\'ve learned!',
        estimatedMinutes: 90,
        completed: false,
        order: 4,
        tips: [
          'Start with just addition, then add other operations',
          'Don\'t worry about making it perfect',
          'Google errors - that\'s what all programmers do!'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Join coding community',
        description: 'Find online communities (Reddit, Discord, forums) for beginners. Introduce yourself and ask questions!',
        estimatedMinutes: 30,
        completed: false,
        order: 5,
        tips: [
          'Everyone starts as a beginner - don\'t be shy',
          'Share your wins, no matter how small',
          'Help others when you can - teaching reinforces learning'
        ]
      }
    ]
  },
  {
    title: 'Morning Self-Care Routine',
    description: 'Start your day with intention and self-compassion',
    category: 'Self-Care',
    isTemplate: true,
    resetOnRecurrence: true,
    steps: [
      {
        id: crypto.randomUUID(),
        title: 'Gentle wake-up',
        description: 'Give yourself 5-10 minutes to fully wake up. Stretch in bed, take deep breaths, and acknowledge how you\'re feeling.',
        estimatedMinutes: 10,
        completed: false,
        order: 0,
        tips: [
          'Use a sunrise alarm or gentle sounds instead of harsh alarms',
          'Keep your phone away from bed to avoid scrolling',
          'Notice your thoughts without judgment'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Hydrate and take medication',
        description: 'Drink a full glass of water. Take any morning medications or vitamins.',
        estimatedMinutes: 5,
        completed: false,
        order: 1,
        tips: [
          'Prepare water glass the night before',
          'Use a pill organizer to avoid missing doses',
          'Add lemon or fruit if plain water is hard'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Basic hygiene',
        description: 'Brush teeth, wash face, use the bathroom. Keep it simple - this isn\'t about perfection.',
        estimatedMinutes: 15,
        completed: false,
        order: 2,
        tips: [
          'Use sensory-friendly products (no strong scents)',
          'Keep routine minimal on low-energy days',
          'Celebrate completing these basics'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Nourish your body',
        description: 'Eat something, even if small. Protein helps with focus. Don\'t skip this!',
        estimatedMinutes: 15,
        completed: false,
        order: 3,
        tips: [
          'Prep easy options the night before',
          'Safe foods are okay - nutrition over variety',
          'Eat before coffee if possible'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Movement or stillness',
        description: 'Choose what your body needs: gentle stretching, a short walk, or quiet sitting. Listen to your body.',
        estimatedMinutes: 10,
        completed: false,
        order: 4,
        tips: [
          'No judgment about what you choose',
          'Even 2 minutes of movement counts',
          'Stillness and rest are valid choices'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Set intentions for the day',
        description: 'Review your schedule. Choose 1-3 priorities. Remember: done is better than perfect.',
        estimatedMinutes: 10,
        completed: false,
        order: 5,
        tips: [
          'Be realistic about your energy levels',
          'Include something you enjoy in your plan',
          'It\'s okay to adjust plans as the day goes'
        ]
      }
    ]
  },
  {
    title: 'Evening Wind-Down Routine',
    description: 'Prepare your mind and body for restful sleep',
    category: 'Self-Care',
    isTemplate: true,
    resetOnRecurrence: true,
    steps: [
      {
        id: crypto.randomUUID(),
        title: 'Set digital boundaries',
        description: 'One hour before bed, start reducing screen time. Put phone in another room if possible.',
        estimatedMinutes: 5,
        completed: false,
        order: 0,
        tips: [
          'Use blue light filters if you must use screens',
          'Set automatic "do not disturb" mode',
          'Charge phone outside bedroom'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Prepare for tomorrow',
        description: 'Lay out clothes, pack bag, check calendar. Remove decisions from tired morning brain.',
        estimatedMinutes: 15,
        completed: false,
        order: 1,
        tips: [
          'Keep it simple - comfort over perfection',
          'Prepare breakfast items if possible',
          'Double-check medication is ready'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Wind-down activity',
        description: 'Choose a calming activity: reading, gentle music, coloring, journaling, or crafts. No screen time!',
        estimatedMinutes: 30,
        completed: false,
        order: 2,
        tips: [
          'Keep supplies by bedside for easy access',
          'Physical books are better than e-readers',
          'Let your mind wander - don\'t force productivity'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Hygiene and comfort',
        description: 'Brush teeth, skincare routine, comfortable sleepwear. Create a sensory-comfortable sleep environment.',
        estimatedMinutes: 20,
        completed: false,
        order: 3,
        tips: [
          'Use unscented or preferred-scent products only',
          'Adjust room temperature to your preference',
          'Consider weighted blanket if you find it calming'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Brain dump',
        description: 'Write down any worries or to-dos for tomorrow. Get them out of your head and onto paper.',
        estimatedMinutes: 10,
        completed: false,
        order: 4,
        tips: [
          'Keep notebook by bed for this purpose',
          'No need to organize or solve - just list',
          'Acknowledge worries then let them go for now'
        ]
      },
      {
        id: crypto.randomUUID(),
        title: 'Settle into sleep',
        description: 'Get into bed, get comfortable, close eyes. Use breathing exercises or sleep meditation if helpful.',
        estimatedMinutes: 20,
        completed: false,
        order: 5,
        tips: [
          'Use white noise or silence - whichever helps',
          'If not asleep in 20 min, get up and try again',
          'Be patient with yourself - sleep is practice'
        ]
      }
    ]
  }
];