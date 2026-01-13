# ANTIGRAVITY PROMPT: Fix Playbook Categories UI and Organization

## Problem Statement

The new playbook category filtering system has several usability issues:

1. **Subcategory bar is nearly invisible** - The secondary filter buttons have transparent/very low contrast text that's unreadable without highlighting
2. **Missing playbooks** - The "Emergency Clean - Low Energy Maintenance Mode" playbook is not visible/findable
3. **Too many playbooks to sort through** - Hard to find specific playbooks among many templates
4. **No clear visual hierarchy** - Templates vs user-created playbooks not clearly distinguished
5. **No separation for active/in-progress playbooks** - Can't see which playbooks you're currently using/have started
6. **No way to return to 'base' view** - Once you click a category tab, there's no clear way to get back to see your active playbooks

## Required Fixes

### FIX 1: Make Secondary Category Bar Readable

**File:** `src/components/PlaybooksTab.tsx` (or wherever the category filter is rendered)

**Problem:** The secondary category buttons (By Room, By Activity, By Time) have insufficient contrast

**Solution:** Update the secondary filter styling to be clearly visible

```tsx
// Find the secondary filter/subcategory rendering
// Update the styling to have better contrast

// Current (likely):
<Button 
  variant="ghost" 
  className="text-muted-foreground"  // ← This is too light
>

// Change to:
<Button 
  variant={selected ? "default" : "outline"}
  className={cn(
    "border-border bg-card hover:bg-accent hover:text-accent-foreground",
    selected && "bg-primary text-primary-foreground"
  )}
>
```

**Specific changes needed:**
- Add solid background color to subcategory buttons
- Increase text contrast (make text darker/more opaque)
- Add border to make buttons clearly defined
- Selected state should be very obvious (different background color)
- Ensure readable on both light and dark themes

---

### FIX 2: Add "Emergency Clean" Playbook to Templates

**File:** `src/data/playbookTemplates.ts` (or wherever templates are defined)

**Problem:** The "Emergency Clean - Low Energy Maintenance Mode" playbook created earlier is not in the system

**Solution:** Add the emergency clean playbook to the templates array

```typescript
// Add this to playbookTemplates array:
{
  title: "Emergency Clean - Low Energy Maintenance Mode",
  description: "For days when you have minimal energy but need your space safe, clean, and sanitary. The bare minimum to maintain basic hygiene and prevent depression from getting worse. 90 minutes total.",
  category: "Whole Home",
  isTemplate: true,
  steps: [
    {
      id: "emergency-1",
      title: "The 5-Minute Kitchen Save",
      description: "Kitchen affects everything. Keep it functional: Put dishes in dishwasher or stack in sink, wipe counters with disinfecting wipes, take out trash if full/smelly, quick sweep visible crumbs. That's it.",
      estimatedMinutes: 5,
      completed: false
    },
    {
      id: "emergency-2",
      title: "Bathroom Rapid Sanitize (Both Bathrooms)",
      description: "Hygiene basics for health. Quick toilet scrub, wipe seat and handle, wipe sink and counter, quick mirror wipe if needed, kick clothes to hamper, fresh hand towel if gross. Do both bathrooms.",
      estimatedMinutes: 10,
      completed: false
    },
    {
      id: "emergency-3",
      title: "The Bedroom Minimum",
      description: "Make the bed (just pull up covers), dirty clothes to hamper, water glass on nightstand, open blinds. That's the anchor.",
      estimatedMinutes: 5,
      completed: false
    },
    {
      id: "emergency-4",
      title: "Living Room Surface Reset",
      description: "Just surfaces, just visible: Collect dishes to kitchen, grab trash, stack clutter neatly (don't organize), fluff pillows, quick wipe of coffee table if sticky.",
      estimatedMinutes: 5,
      completed: false
    },
    {
      id: "emergency-5",
      title: "Critical Disinfection Points",
      description: "Things you touch constantly: All door handles, light switches (bedroom/bathroom/kitchen), TV remotes, phone, faucet handles, fridge handle, microwave handle. One wipe per room. Reducing germs matters.",
      estimatedMinutes: 10,
      completed: false
    },
    {
      id: "emergency-6",
      title: "Floor Spot Clean - High Traffic Only",
      description: "Not whole floors. Just paths you walk: Kitchen walkway and in front of sink, bathroom if you see hair/dust, living room walkway only, bedroom path. Not edges. Not under furniture.",
      estimatedMinutes: 15,
      completed: false
    },
    {
      id: "emergency-7",
      title: "The Essential Trash Run",
      description: "Trash accumulates fast during depression. Empty all visible trash cans, grab obvious trash from surfaces, take to outside bin, put new bags in cans. Air quality improves immediately.",
      estimatedMinutes: 10,
      completed: false
    },
    {
      id: "emergency-8",
      title: "Air Quality Quick Fix",
      description: "Fresh air = mood lift: Open windows for 10 minutes if weather allows, turn on bathroom fans, turn on air purifier if you have one. Optional air freshener only if space is already clean.",
      estimatedMinutes: 12,
      completed: false,
      tips: ["Set a 10-minute timer for windows", "Don't spray air freshener over dirty spaces"]
    },
    {
      id: "emergency-9",
      title: "Laundry Minimum Viable Action",
      description: "Pick ONE: Start one load, OR move wet clothes to dryer, OR fold one load, OR gather all dirty laundry into basket. Just one. That's enough.",
      estimatedMinutes: 8,
      completed: false
    },
    {
      id: "emergency-10",
      title: "The Reset Scan",
      description: "Walk through each room (30 seconds each). Notice: Anything smell bad? Any safety issues? Miss any obvious trash? How do you feel now vs 90 minutes ago? Observation only, no new tasks.",
      estimatedMinutes: 5,
      completed: false
    },
    {
      id: "emergency-11",
      title: "Self-Care Checkpoint - NON-NEGOTIABLE",
      description: "You just did something hard. Get water and drink it. Sit down. Optional: Set reminder for next time (every 2-3 days). Optional: Text someone 'I cleaned today.' You maintained your space with low energy. That's strength.",
      estimatedMinutes: 5,
      completed: false,
      tips: ["This step is required", "Doing this routine with low energy IS self-care", "If you could only do 3 steps, that's still 3 more than zero"]
    }
  ]
}
```

**Also add the "Complete House Reset" playbook if desired** - I can provide that separately if needed.

---

### FIX 3: Add Search/Filter Functionality

**File:** `src/components/PlaybooksTab.tsx`

**Problem:** Too many playbooks to visually scan through

**Solution:** Add a search bar above the category filters

```tsx
// Add this above the category filter section:
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

// In component state:
const [searchQuery, setSearchQuery] = useState('');

// In the component JSX, before the category filters:
<div className="mb-4">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      type="text"
      placeholder="Search playbooks..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="pl-10"
    />
  </div>
</div>

// Update the filtering logic to include search:
const filteredPlaybooks = allPlaybooks.filter(playbook => {
  // Existing category filter
  const matchesCategory = selectedCategory === 'All' || playbook.category === selectedCategory;
  
  // New search filter
  const matchesSearch = searchQuery === '' || 
    playbook.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    playbook.description.toLowerCase().includes(searchQuery.toLowerCase());
  
  return matchesCategory && matchesSearch;
});
```

---

### FIX 4: Improve Visual Organization

**File:** `src/components/PlaybooksTab.tsx`

**Problem:** Templates blend in with user playbooks, hard to distinguish

**Solution:** Add visual sections and better template badges

```tsx
// Group playbooks by type for display
const userPlaybooks = filteredPlaybooks.filter(p => !p.isTemplate);
const templatePlaybooks = filteredPlaybooks.filter(p => p.isTemplate);

// In the render section:
<div className="space-y-6">
  {/* User Playbooks Section */}
  {userPlaybooks.length > 0 && (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        Your Playbooks
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userPlaybooks.map(playbook => (
          // Render user playbook card
        ))}
      </div>
    </div>
  )}

  {/* Template Playbooks Section */}
  {templatePlaybooks.length > 0 && (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        Templates
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templatePlaybooks.map(playbook => (
          // Render template playbook card
        ))}
      </div>
    </div>
  )}
</div>
```

---

### FIX 6: Add "Active" / "In Progress" Playbooks Section

**File:** `src/components/PlaybooksTab.tsx`

**Problem:** No way to see which playbooks you're currently working on. When you start a playbook, complete some steps, and close it - there's no easy way to find it again among all the templates.

**Solution:** Create a dedicated "Active" section that shows playbooks with progress

```tsx
// Update the category filtering to include special "Active" category
const CATEGORIES = [
  'Active', // ← Add this as FIRST category (default view)
  'All',
  'By Room',
  'By Activity', 
  'By Time',
  'Templates',
  // ... rest of categories
];

// Filter logic for Active playbooks:
const getActivePlaybooks = () => {
  return allPlaybooks.filter(playbook => {
    // A playbook is "active" if:
    // 1. It has ANY completed steps, OR
    // 2. It has progress > 0%, OR
    // 3. User has started it but not finished
    const hasProgress = playbook.steps.some(step => step.completed);
    const progressPercent = playbook.steps.length > 0 
      ? (playbook.steps.filter(s => s.completed).length / playbook.steps.length) * 100
      : 0;
    
    return hasProgress && progressPercent < 100 && !playbook.isTemplate;
  });
};

// Update filtering logic to handle "Active" category:
const filteredPlaybooks = useMemo(() => {
  let filtered = allPlaybooks;
  
  if (selectedCategory === 'Active') {
    filtered = getActivePlaybooks();
  } else if (selectedCategory === 'All') {
    filtered = allPlaybooks;
  } else if (selectedCategory === 'Templates') {
    filtered = allPlaybooks.filter(p => p.isTemplate);
  } else {
    // Existing category filtering
    filtered = allPlaybooks.filter(p => p.category === selectedCategory);
  }
  
  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  return filtered;
}, [allPlaybooks, selectedCategory, searchQuery]);
```

**Visual Indicator for Active Playbooks:**

```tsx
// In the playbook card rendering, add an "In Progress" badge for active playbooks
{playbook.steps.some(s => s.completed) && 
 playbook.steps.some(s => !s.completed) && 
 !playbook.isTemplate && (
  <Badge className="bg-green-500 text-white">
    In Progress
  </Badge>
)}

// Also show progress bar more prominently for active playbooks
{progressPercent > 0 && progressPercent < 100 && (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">Progress</span>
      <span className="font-semibold text-primary">{Math.round(progressPercent)}%</span>
    </div>
    <Progress value={progressPercent} className="h-2" />
  </div>
)}
```

---

### FIX 7: Default to "Active" View & Make Navigation Clear

**File:** `src/components/PlaybooksTab.tsx`

**Problem:** Once you click a category, there's no obvious way to get back to see your active playbooks. The "base" view should show what you're working on.

**Solution:** Default to "Active" category and make it sticky/prominent

```tsx
// Update initial state to default to "Active" instead of "All"
const [selectedCategory, setSelectedCategory] = useState('Active');

// Make the "Active" tab visually distinct as the "home" view
<Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
  <TabsList className="bg-muted/30 p-1 flex-wrap">
    {/* Active tab - special styling as "home" */}
    <TabsTrigger 
      value="Active"
      className="data-[state=active]:bg-green-500 data-[state=active]:text-white font-semibold"
    >
      <Play className="h-3 w-3 mr-1" />
      Active
      {getActivePlaybooks().length > 0 && (
        <span className="ml-1 text-xs">({getActivePlaybooks().length})</span>
      )}
    </TabsTrigger>
    
    {/* Rest of categories */}
    {CATEGORIES.filter(c => c !== 'Active').map(category => (
      <TabsTrigger 
        key={category}
        value={category}
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        {category}
      </TabsTrigger>
    ))}
  </TabsList>
</Tabs>

// Add helpful empty state for Active category when no playbooks in progress
{selectedCategory === 'Active' && filteredPlaybooks.length === 0 && (
  <div className="text-center py-12 px-4">
    <div className="bg-muted/30 rounded-lg p-8 max-w-md mx-auto">
      <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="text-lg font-semibold mb-2">No Active Playbooks</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Start a playbook from the templates or create your own to see it here.
      </p>
      <Button 
        onClick={() => setSelectedCategory('Templates')}
        variant="outline"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Browse Templates
      </Button>
    </div>
  </div>
)}
```

---

### FIX 8: Add "Continue" Button Prominence for Active Playbooks

**File:** `src/components/PlaybooksTab.tsx`

**Problem:** Active playbooks should be easier to resume

**Solution:** Make "Continue" button more prominent and show last completed step

```tsx
// For active playbooks (progress > 0 but < 100%), enhance the card
{progressPercent > 0 && progressPercent < 100 && !playbook.isTemplate && (
  <div className="space-y-2">
    {/* Progress indicator */}
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">
        {completedSteps} of {totalSteps} steps completed
      </span>
      <span className="font-semibold text-primary">{Math.round(progressPercent)}%</span>
    </div>
    <Progress value={progressPercent} className="h-2" />
    
    {/* Last activity */}
    <p className="text-xs text-muted-foreground">
      Last step: {playbook.steps.find(s => s.completed)?.title.slice(0, 40) || 'Started'}...
    </p>
    
    {/* Prominent continue button */}
    <Button
      onClick={() => handleViewPlaybook(playbook)}
      className="w-full bg-green-500 hover:bg-green-600 text-white"
      size="sm"
    >
      <Play className="h-4 w-4 mr-2" />
      Continue Where You Left Off
    </Button>
  </div>
)}
```

---

### FIX 9: Add Visual Separation Between Sections

**File:** `src/components/PlaybooksTab.tsx`

**Problem:** When viewing "All" or other categories, active playbooks blend in with everything else

**Solution:** Show active playbooks at the top of any category view

```tsx
// Update the rendering logic to prioritize active playbooks
const renderPlaybooks = () => {
  // Separate active from non-active
  const activePlaybooks = filteredPlaybooks.filter(p => {
    const hasProgress = p.steps.some(s => s.completed);
    const progressPercent = p.steps.length > 0 
      ? (p.steps.filter(s => s.completed).length / p.steps.length) * 100
      : 0;
    return hasProgress && progressPercent < 100 && !p.isTemplate;
  });
  
  const otherPlaybooks = filteredPlaybooks.filter(p => !activePlaybooks.includes(p));
  
  return (
    <div className="space-y-8">
      {/* Active Playbooks Section - Always show if any exist */}
      {activePlaybooks.length > 0 && selectedCategory !== 'Active' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Play className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-semibold">In Progress</h3>
            <Badge variant="outline" className="ml-auto">
              {activePlaybooks.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePlaybooks.map(playbook => (
              <PlaybookCard key={playbook.id} playbook={playbook} isActive={true} />
            ))}
          </div>
          <Separator className="mt-8" />
        </div>
      )}
      
      {/* Other Playbooks */}
      {otherPlaybooks.length > 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherPlaybooks.map(playbook => (
              <PlaybookCard key={playbook.id} playbook={playbook} isActive={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

**File:** `src/components/PlaybooksTab.tsx`

**Current categories seem good, but make them more accessible:**

```tsx
// Update the category tabs to show count of playbooks
<TabsList className="bg-muted/30 p-1">
  {CATEGORIES.map(category => {
    const count = allPlaybooks.filter(p => 
      category === 'All' || p.category === category
    ).length;
    
    return (
      <TabsTrigger 
        key={category} 
        value={category}
        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
      >
        {category}
        {count > 0 && (
          <span className="ml-1 text-xs opacity-70">({count})</span>
        )}
      </TabsTrigger>
    );
  })}
</TabsList>
```

---

## CSS/Styling Fixes

**File:** `src/components/PlaybooksTab.tsx` or relevant CSS file

### Fix transparent secondary filter bar:

```css
/* Ensure secondary category buttons are visible */
.secondary-filter-button {
  background-color: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  color: hsl(var(--foreground));
  opacity: 1 !important; /* Override any transparency */
}

.secondary-filter-button:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

.secondary-filter-button[data-state="active"] {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  border-color: hsl(var(--primary));
}
```

---

## Testing Checklist

After implementing fixes, verify:

- [ ] **Secondary category bar is clearly visible** - Can read all button text without highlighting
- [ ] **Selected category is obvious** - Active button stands out clearly
- [ ] **Emergency Clean playbook appears** - In "Whole Home" category or in search results
- [ ] **Search works** - Can type "emergency" and find the Emergency Clean playbook
- [ ] **Search works** - Can type "low energy" and find the Emergency Clean playbook
- [ ] **Categories show counts** - Each category tab shows how many playbooks are in it
- [ ] **Templates are visually distinct** - Clear separation from user playbooks
- [ ] **"Active" is default view** - Opening playbooks section shows active playbooks first
- [ ] **Active playbooks are clearly marked** - "In Progress" badge visible on active playbooks
- [ ] **Can return to Active view** - Clicking "Active" tab shows in-progress playbooks
- [ ] **Active section shows in other categories** - When viewing "All" or other categories, active playbooks appear at top
- [ ] **Continue button is prominent** - Easy to resume active playbooks
- [ ] **Empty state works** - When no active playbooks, shows helpful message
- [ ] **Both light and dark mode work** - Text is readable in both themes
- [ ] **Mobile responsive** - Category bar doesn't overflow on mobile

---

## Priority Order

1. **HIGHEST:** Fix secondary category bar visibility (FIX 1) - Immediate usability issue
2. **HIGHEST:** Add "Active" section and default view (FIX 6, 7) - Critical for workflow
3. **HIGH:** Add Emergency Clean playbook (FIX 2) - Missing essential content
4. **MEDIUM:** Add search functionality (FIX 3) - Quality of life improvement
5. **MEDIUM:** Visual organization (FIX 4) - Better UX but not blocking
6. **MEDIUM:** Visual separation for active playbooks (FIX 8, 9) - Enhances active workflow
7. **LOW:** Category counts (FIX 5 old) - Nice to have enhancement

---

## Visual Layout Mockup

### How "Active" View Should Look:

```
┌─────────────────────────────────────────────────────────────┐
│  Playbooks                              [+ Create Playbook] │
├─────────────────────────────────────────────────────────────┤
│  [Search playbooks...]                                       │
├─────────────────────────────────────────────────────────────┤
│  [🔄 Active] [All] [By Room ▾] [By Activity ▾] [By Time ▾] │
│  [✨ Templates]                                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔄 In Progress (2)                                          │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Emergency    │  │ Bathroom     │                        │
│  │ Clean        │  │ Deep Clean   │                        │
│  │              │  │              │                        │
│  │ 🟢 In Progress│ │ 🟢 In Progress│                       │
│  │ 5/11 steps   │  │ 7/13 steps   │                        │
│  │ ████████░░ 45%│ │ ██████████░ 54%│                      │
│  │              │  │              │                        │
│  │ [▶ Continue] │  │ [▶ Continue] │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                               │
│  No other playbooks                                          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### How "All" or Other Categories Should Look:

```
┌─────────────────────────────────────────────────────────────┐
│  Playbooks                              [+ Create Playbook] │
├─────────────────────────────────────────────────────────────┤
│  [Search playbooks...]                                       │
├─────────────────────────────────────────────────────────────┤
│  [Active] [📂 All] [By Room ▾] [By Activity ▾] [By Time ▾] │
│  [Templates]                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  🔄 In Progress (2)                         [View All Active]│
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Emergency    │  │ Bathroom     │                        │
│  │ Clean        │  │ Deep Clean   │                        │
│  │ 🟢 In Progress│ │ 🟢 In Progress│                       │
│  │ ████████░░ 45%│ │ ██████████░ 54%│                      │
│  │ [▶ Continue] │  │ [▶ Continue] │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                               │
│  ─────────────────────────────────────                      │
│                                                               │
│  ✨ Templates (12)                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Kitchen      │  │ Bedroom      │  │ Living Room  │      │
│  │ Deep Clean   │  │ Deep Clean   │  │ Deep Clean   │      │
│  │              │  │              │  │              │      │
│  │ ✨ Template  │  │ ✨ Template  │  │ ✨ Template  │      │
│  │ 0/12 steps   │  │ 0/14 steps   │  │ 0/10 steps   │      │
│  │              │  │              │  │              │      │
│  │ [▶ Start]    │  │ [▶ Start]    │  │ [▶ Start]    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Empty "Active" State:

```
┌─────────────────────────────────────────────────────────────┐
│  Playbooks                              [+ Create Playbook] │
├─────────────────────────────────────────────────────────────┤
│  [Search playbooks...]                                       │
├─────────────────────────────────────────────────────────────┤
│  [🔄 Active] [All] [By Room ▾] [By Activity ▾] [By Time ▾] │
│  [Templates]                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│                    ┌─────────────────┐                       │
│                    │                 │                       │
│                    │       ▶         │                       │
│                    │                 │                       │
│                    │  No Active      │                       │
│                    │  Playbooks      │                       │
│                    │                 │                       │
│                    │  Start a        │                       │
│                    │  playbook from  │                       │
│                    │  templates or   │                       │
│                    │  create your    │                       │
│                    │  own to see it  │                       │
│                    │  here.          │                       │
│                    │                 │                       │
│                    │ [✨ Browse      │                       │
│                    │  Templates]     │                       │
│                    │                 │                       │
│                    └─────────────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Additional Recommendations

### Quick Win: Add "Recently Used" category
```tsx
// Add to CATEGORIES array at the beginning:
const CATEGORIES = [
  'All',
  'Recently Used', // ← Add this
  // ... rest of categories
];

// Filter logic for Recently Used:
if (selectedCategory === 'Recently Used') {
  // Show playbooks sorted by last accessed/modified date
  // Limit to 6-8 most recent
}
```

### Quick Win: Add "Favorites" system
```tsx
// Allow users to favorite playbooks
// Add star icon to cards
// Add "Favorites" to categories
// Store favorites in localStorage or database
```

---

## Expected Outcome After Fix

1. **Default view shows active playbooks** - Opening Playbooks section defaults to "Active" tab showing playbooks in progress
2. User can clearly see and read all category filter options
3. **Active playbooks are visually distinct** - "In Progress" badge, prominent "Continue" button, progress bar
4. **Easy navigation back to active work** - Click "Active" tab anytime to see what you're working on
5. **Active playbooks appear at top of other views** - When browsing "All" or other categories, in-progress playbooks show first
6. User can quickly find "Emergency Clean" by:
   - Selecting "Whole Home" category, OR
   - Typing "emergency" in search, OR
   - Typing "low energy" in search
7. Category system is intuitive and visually clear
8. Templates are distinct from user playbooks
9. Empty "Active" state provides clear next steps
10. Overall better organization and findability with focus on active work

### User Flow After Fix:

**Scenario 1: Returning to app**
1. User opens Playbooks section → Sees "Active" tab selected by default
2. User sees all playbooks they've started but not finished
3. User clicks "Continue Where You Left Off" → Opens playbook at current progress
4. User can easily resume work without searching

**Scenario 2: Starting new playbook**
1. User clicks "Templates" tab → Sees all available templates
2. User finds "Emergency Clean" → Clicks "Start"
3. User completes 3 steps → Closes playbook
4. Next time user opens Playbooks → "Emergency Clean" appears in "Active" section automatically

**Scenario 3: Browsing while working**
1. User is working on "Bathroom Deep Clean" (50% complete)
2. User clicks "Whole Home" category to browse other options
3. "Bathroom Deep Clean" still appears at TOP with "In Progress" badge
4. User can continue current work OR start something new
5. Click "Active" tab anytime to see only in-progress playbooks

---

## Notes

- The Emergency Clean playbook is designed for low-energy maintenance
- It's 90 minutes total with 11 steps
- Consider adding tag: "Quick", "Low Energy", or "Maintenance" for better filtering
- The Complete House Reset playbook (12 hours) can also be added if desired
- Both playbooks were specifically designed for depression/anxiety recovery periods

---

**Created:** January 2025
**Issue:** Playbook category UI visibility and organization
**Priority:** High - Affects core usability
**Estimated Fix Time:** 30-60 minutes