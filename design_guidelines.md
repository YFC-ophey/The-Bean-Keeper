# Coffee Tracking App Design Guidelines

## Design Approach
**Hybrid Approach**: Material Design foundation with Instagram-inspired photo presentation. This balances the utility needs (data organization, forms, filtering) with the visual/lifestyle nature of specialty coffee culture.

**Key Principles**:
- Mobile-first (camera uploads are primary interaction)
- Photo-centric with clean data display
- Quick capture workflow
- Scannable timeline/grid views

## Typography
**Font Stack**: Inter (via Google Fonts CDN)
- Headings: 600-700 weight
- Body: 400-500 weight  
- Labels/Meta: 500 weight, uppercase with tracking
- Sizes: text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

## Layout System
**Spacing**: Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 to p-6
- Section spacing: mb-8 to mb-12
- Card gaps: gap-4 to gap-6

**Containers**: max-w-4xl for main content, max-w-lg for forms/modals

## Core Components

### A. Photo Upload Interface
- Large dropzone area with camera icon
- Mobile: "Take Photo" and "Choose File" buttons stacked vertically
- Desktop: Centered dropzone with drag-and-drop indication
- Preview thumbnail immediately after selection
- Aspect ratio: Square or 4:3 for consistency

### B. Auto-Fill Form
**Layout**: Single column, left-aligned labels above inputs
- Input fields: Rounded corners (rounded-lg), generous height (h-12)
- Grouped sections: "Roaster Info", "Coffee Details", "Processing"
- OCR-extracted fields: Subtle badge/indicator showing "Auto-filled"
- Edit icons on each field for manual correction
- Map embed: Fixed aspect ratio container (16:9), rounded corners

### C. Rating Modal
**Modal Design**: Centered overlay, max-w-md
- Large star icons (touch-friendly, min 44px tap targets)
- Star states: Empty outline, filled, half-filled
- Quick notes textarea: 3 rows, character counter visible
- Primary action button: "Save Rating"
- Secondary: "Skip for now" text link

### D. Coffee Log Dashboard
**Default View**: Card grid on desktop (2-3 columns), single column on mobile

**Card Structure**:
- Coffee bag photo: Top, full-width, aspect-ratio-square
- Overlay gradient on photo bottom for text readability
- Roaster name: Bold, over photo gradient
- Origin + variety: Secondary text
- Star rating: Small, inline
- Date badge: Top-right corner
- Hover state (desktop): Subtle lift shadow

**Alternative Timeline View Toggle**:
- Chronological list
- Each entry: Photo thumbnail (left), details (right)
- Divider lines between entries
- Compact on mobile

### E. Filter & Search Bar
**Sticky Header Design**:
- Search input: Full-width on mobile, 1/2 width on desktop
- Filter chips: Scrollable horizontal row
- Active filters: Highlighted chips with X to remove
- "Clear all" link when filters active

### F. Detail View
**Layout**: Two-column on desktop, stacked on mobile
- Left: Large photo, map embed below
- Right: All coffee metadata, rating display, tasting notes
- Back/Close button: Top-left
- Edit button: Top-right
- Roaster link: Underlined, opens in new tab

## Navigation
**Top Bar**:
- App logo/name: Left
- "Add Coffee" button: Right, primary action style
- Menu icon (mobile): Hamburger, reveals filter/view options

**Bottom Bar (Mobile)**:
- Home/Dashboard icon
- Add (center, elevated FAB style)
- Profile/Settings icon

## Animations
**Minimal, purposeful only**:
- Modal entrance: Fade + scale from 0.95 to 1
- Card hover: translateY(-2px) with shadow increase
- Star rating: Scale pulse on tap
- Photo upload: Fade-in thumbnail preview

## Images
**Hero Section**: None (app opens directly to dashboard/log)

**Required Images**:
1. **Empty state illustration**: Coffee cup icon with "Start tracking your coffee journey" message (when no entries exist)
2. **Coffee bag photos**: User-uploaded, primary visual element throughout
3. **Map embeds**: Google Maps iframe for each roaster location
4. **Placeholder thumbnails**: Generic coffee bag outline for failed photo loads

**Image Treatment**:
- All user photos: Consistent aspect ratio cropping
- Rounded corners throughout (rounded-lg)
- Subtle border on light backgrounds for definition

## Form Design
- Input backgrounds: Subtle fill to distinguish from page background
- Focus states: Border accent, no ring
- Error states: Red border, error text below field
- Success states (OCR complete): Green checkmark icon
- Disabled fields: Reduced opacity, no interaction

## Mobile Optimization
- Camera access: Native HTML5 input[capture="environment"]
- Touch targets: Minimum 44x44px
- Swipe gestures: Swipe card to delete (with confirmation)
- Pull-to-refresh: Dashboard reload
- Bottom sheet modals: Preferred over centered on mobile