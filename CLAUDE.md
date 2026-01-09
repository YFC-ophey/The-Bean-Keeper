# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**The Bean Keeper** is a mobile-first coffee tracking application that uses photo-based OCR and AI to extract coffee information from bag labels. Users photograph coffee bags, and Groq AI (Llama 3.1 8B) automatically extracts structured data (roaster, origin, variety, process, flavors, etc.) for their coffee journal.

**Key Features:**
- 📸 Photo-based coffee entry with OCR + AI extraction
- 🌍 Bilingual interface (English + Traditional Chinese)
- 🔍 Advanced filtering by roast level, rating, and origin
- 📊 Collection statistics and insights
- ⭐ 5-star rating system with tasting notes
- 🗺️ Auto-generated Google Maps links for roasters
- 📱 Mobile-optimized with dual photo upload methods (camera + file picker)
- ☕ Vintage coffee journal aesthetic

**Current Status:** ✅ Production-ready - Deployed to Render with Cloudinary photo storage, Notion database, and Groq AI. PostgreSQL has been removed.

**Live URL:** https://the-bean-keeper.onrender.com

## Development Commands

```bash
# Development server (with hot reload) - default port 5000
npm run dev

# Development server on custom port
PORT=3000 npm run dev

# Type checking
npm run check

# Production build
npm run build

# Start production server
npm start

# Test Notion API connection
npx tsx test-notion-setup.ts

# Create Notion database (one-time setup)
npx tsx create-database.ts <parent-page-id>

# Test Groq AI extraction
npx tsx test-groq.ts
```

## Architecture Overview

### Current Architecture (Notion-Only)

**Storage:**
- Notion API as the single source of truth (no PostgreSQL)
- Direct CRUD operations via `@notionhq/client`
- Uses Internal Integration (API key)
- **Separate databases:**
  - Local dev: `2e375dba-9d93-8038-b2e2-d7ec275e9b68`
  - Production (Render): `a12cbbbc-b1a4-421d-83f0-2fac3436c39d`
- All coffee entries stored as Notion pages in database

**Photo Storage:**
- **Production:** Cloudinary for persistent cloud storage (recommended)
- **Local Dev:** Google Cloud Storage (Replit sidecar) or local file system
- Automatic fallback: Uses Cloudinary if configured, otherwise local storage
- Direct client uploads with automatic image optimization
- URLs stored in Notion page properties

### Tech Stack

**Frontend:**
- React 18 + TypeScript + Vite
- TanStack Query (React Query) for server state
- Wouter for routing
- shadcn/ui (Radix primitives) + Tailwind CSS
- Tesseract.js for client-side OCR
- i18next (react-i18next) for internationalization (English + Chinese)

**Backend:**
- Express.js + TypeScript
- Groq AI (Llama 3.1 8B Instant) for coffee data extraction
- Notion SDK (`@notionhq/client`) for database operations
- Cloudinary for persistent photo storage (production)
- Local file system fallback (development/testing)
- **No PostgreSQL or Drizzle ORM** (fully removed)

**AI/ML Pipeline:**
1. User uploads coffee bag photo(s)
2. Tesseract.js extracts raw text (client-side)
3. Text sent to Groq AI via `/api/extract-coffee-info`
4. Structured JSON returned with roaster, origin, variety, process, roast level, etc.
5. Form auto-fills with extracted data (including AI-detected roast level)

### Storage Layer

**Implementation (`server/notion-storage.ts`):**
- `NotionStorage` class implementing CRUD operations
- Direct Notion API calls via `@notionhq/client`
- Database ID set via `X-Notion-Database-Id` header from frontend
- Uses Notion page IDs as entry identifiers
- All operations synchronous to Notion (no local caching)

**Key Methods:**
```typescript
notionStorage.getCoffeeEntry(id)        // Retrieves by Notion page ID
notionStorage.getAllCoffeeEntries()     // Queries all pages in database
notionStorage.createCoffeeEntry(entry)  // Creates new Notion page
notionStorage.updateCoffeeEntry(id, updates)  // Updates existing page
notionStorage.deleteCoffeeEntry(id)     // Archives Notion page
```

### Database Schema

**Coffee Entry Fields (TypeScript interface in `shared/schema.ts`):**
```typescript
{
  id: string                    // Notion page ID
  frontPhotoUrl: string         // Required
  backPhotoUrl: string | null
  roasterName: string           // Required
  roasterWebsite: string | null // Preferred over location
  roasterAddress: string | null
  roasterLocation: string | null // Deprecated but kept for compatibility
  placeUrl: string | null       // Google Maps Place URL (auto-generated)
  farm: string | null
  origin: string | null
  variety: string | null
  processMethod: string | null
  roastLevel: string | null     // "Light", "Medium", or "Dark"
  roastDate: string | null      // Text format (e.g. "2024-12-10")
  flavorNotes: string[] | null
  rating: number | null         // 1-5 scale
  tastingNotes: string | null
  weight: string | null         // "250g", "12oz"
  price: string | null          // "$18.99"
  purchaseAgain: boolean        // Default: false
  createdAt: Date
}
```

**Note:** `notionPageId` and `updatedAt` fields removed - `id` is now the Notion page ID directly.

## Key File Locations

### Backend Core
- `server/index.ts` - Express app entry point
- `server/routes.ts` - API endpoints (direct Notion operations + Cloudinary uploads)
- `server/notion-storage.ts` - **Notion storage layer** (replaces PostgreSQL)
- `server/notion.ts` - Notion API client and database operations
- `server/groq.ts` - Groq AI client for coffee data extraction
- `server/cloudinary-storage.ts` - **Cloudinary photo storage service** (production)
- `server/local-storage.ts` - Local file system fallback (development)
- `server/objectStorage.ts` - Google Cloud Storage integration (legacy/Replit)

### Legacy Files (Not Used)
- `server/storage.ts` - Removed (PostgreSQL abstraction)
- `server/db.ts` - Removed (Drizzle connection)
- `server/openai.ts` - Removed (replaced by Groq)
- `server/notion-oauth.ts` - Not actively used (using Internal Integration instead)
- `server/notion-oauth-routes.ts` - Not actively used
- `server/sync.ts` - Not actively used

### Frontend Core
- `client/src/App.tsx` - Router setup
- `client/src/pages/Dashboard.tsx` - Main coffee list view
- `client/src/lib/queryClient.ts` - **API client with Notion headers**
- `client/src/components/AddCoffeeForm.tsx` - Photo upload + OCR + AI extraction
- `client/src/components/CoffeeCard.tsx` - Instagram-style entry card
- `client/src/components/CoffeeDetail.tsx` - Full entry modal view
- `client/src/components/RatingModal.tsx` - Star rating + tasting notes
- `client/src/components/EditCoffeeForm.tsx` - Edit existing entries
- `client/src/components/EmptyState.tsx` - Empty state with coffee icon
- `client/src/components/CoffeeFilters.tsx` - Filter/sort controls (roast level, rating, origin)
- `client/src/components/CoffeeStats.tsx` - Collection statistics and insights
- `client/src/components/LanguageSwitcher.tsx` - Language selector (EN/ZH)
- `client/src/components/NotionButton.tsx` - Notion database connection link

### Internationalization (i18n)
- `client/src/i18n/config.ts` - i18next configuration with language detection
- `client/src/i18n/locales/en/*.json` - English translations (common, dashboard, forms, modals, guide, coffee)
- `client/src/i18n/locales/zh/*.json` - Chinese translations (繁體中文)
- Language persistence via localStorage (`beankeeper_language` key)
- Automatic detection from browser settings
- Namespace organization: common, dashboard, forms, modals, guide, coffee

### Schema & Types
- `shared/schema.ts` - TypeScript interfaces + Zod validation (no Drizzle)

## API Endpoints

### Coffee Entries (Direct Notion Storage)
```typescript
POST   /api/coffee-entries
  Headers: X-Notion-Database-Id (required)
  Body: InsertCoffeeEntry
  // Creates Notion page directly

PATCH  /api/coffee-entries/:id
  Headers: X-Notion-Database-Id (required)
  Body: UpdateCoffeeEntry
  // Updates Notion page directly

GET    /api/coffee-entries
  Headers: X-Notion-Database-Id (required)
  // Queries all pages from Notion database

GET    /api/coffee-entries/:id
  Headers: X-Notion-Database-Id (required)
  // Retrieves single page from Notion

DELETE /api/coffee-entries/:id
  Headers: X-Notion-Database-Id (required)
  // Archives Notion page
```

### AI Extraction
```typescript
POST   /api/extract-coffee-info
  Body: { text: string } // Combined OCR text from Tesseract
  Returns: ExtractedCoffeeInfo (roaster, origin, variety, etc.)
```

### Notion Setup
```typescript
POST   /api/notion/create-database
  Body: { parentPageId: string }
  // Creates coffee database in Notion workspace
  Returns: { databaseId: string }
```

### Photo Upload
```typescript
POST   /api/upload-url
  // Returns upload URL - Cloudinary if configured, otherwise local
  // Production: Returns /api/cloudinary-upload/:fileId
  // Development: Returns /api/local-upload/:fileId

PUT    /api/cloudinary-upload/:fileId
  // Upload file to Cloudinary (production)
  // Returns: { url: "https://res.cloudinary.com/..." }

PUT    /api/local-upload/:fileId
  // Upload file to local filesystem (development fallback)
  // Returns: { url: "/api/local-files/:filename" }

GET    /api/local-files/:filename
  // Serves locally stored photos (development only)

GET    /objects/:objectPath
  // Serves uploaded photos from GCS (legacy/Replit)
```

### Diagnostic Endpoints
```typescript
GET    /api/health
  // Health check for Render monitoring
  Returns: { status, timestamp, uptime, environment }

GET    /api/debug/env
  // Check environment configuration
  Returns: { nodeEnv, hasGroqKey, hasNotionKey, hasCloudinary, storageMode }

GET    /api/debug/groq
  // Test Groq API connectivity
  Returns: { success, extracted, message }
```

## Environment Variables

```env
# Groq AI (Required)
GROQ_API_KEY=gsk_xxx

# Notion Internal Integration (Required)
NOTION_API_KEY=ntn_xxx              # Get from notion.so/my-integrations

# Notion Database IDs
# Local development database
NOTION_DATABASE_ID=2e375dba-9d93-8038-b2e2-d7ec275e9b68
# Production database (on Render): a12cbbbc-b1a4-421d-83f0-2fac3436c39d

# Cloudinary (Production photo storage - Recommended)
CLOUDINARY_CLOUD_NAME=dog6jqdmz
CLOUDINARY_API_KEY=821276162312258
CLOUDINARY_API_SECRET=xxx

# Google Maps API (Optional - for embedded maps)
VITE_GOOGLE_MAPS_API_KEY=xxx

# Server Configuration
PORT=5000                           # Default port for local dev
NODE_ENV=development                # 'development' or 'production'

# Legacy/Optional (Replit only)
PRIVATE_OBJECT_DIR=gs://bucket/path  # Google Cloud Storage (Replit sidecar)
```

**Environment Setup:**
- **Local Development:** Uses `.env` file with dev database ID
- **Production (Render):** Environment variables set in Render dashboard with production database ID
- **Photo Storage:** Cloudinary for production (persistent), local filesystem for dev (ephemeral)

**Note:** PostgreSQL variables (`DATABASE_URL`) and Notion OAuth variables are no longer used.

## Critical Implementation Details

### Direct Notion Storage

All CRUD operations go directly to Notion:
1. Frontend sends `X-Notion-Database-Id` header with every API request
2. Backend middleware (`server/routes.ts`) sets database ID on `notionStorage`
3. Operations execute directly against Notion API
4. No local caching or PostgreSQL involved

**Frontend Header Setup:**
See `client/src/lib/queryClient.ts` - `getHeaders()` function automatically includes database ID from constant.

### OCR + AI Extraction Flow

1. **Client-side OCR** (`AddCoffeeForm.tsx`):
   - Tesseract.js processes front + back photos
   - Combines text from both images
   - Cleans OCR artifacts (special chars, gibberish)

2. **Server-side AI** (`server/groq.ts`):
   - Receives combined OCR text
   - Groq Llama 3.1 8B with JSON mode
   - Returns structured `ExtractedCoffeeInfo`
   - Graceful error handling (returns empty object on failure)

3. **Form Auto-fill**:
   - AI response merges with regex fallback
   - Pre-populates all form fields
   - User reviews/edits before saving

### Photo Storage

**Production (Cloudinary):**
- Client requests upload URL via `/api/upload-url`
- Returns Cloudinary upload endpoint `/api/cloudinary-upload/:fileId`
- Client uploads directly to server, which streams to Cloudinary
- Cloudinary URL returned: `https://res.cloudinary.com/dog6jqdmz/...`
- Features:
  - Persistent storage (25GB free tier)
  - Automatic image optimization
  - CDN delivery worldwide
  - Survives Render deployments/restarts

**Development (Local Filesystem):**
- Uploads saved to `.local/uploads` directory
- Served via `/api/local-files/:filename`
- Ephemeral (deleted on server restart)
- Automatic fallback if Cloudinary not configured

**Legacy (Replit GCS):**
- Uses Replit sidecar on port 1106
- Only works on Replit environment
- URLs normalized and served via `/objects/:path`

### Design Principles

- **Mobile-first**: Camera uploads as primary interaction, optimized for touch
- **Photo-centric**: Instagram-style cards with overlay gradients, magazine layout
- **Vintage coffee journal aesthetic**: Warm browns (#6F4E37, #8B6F47), cream backgrounds (#F5EFE7, #E8DCC8)
- **Quick capture**: Minimize steps from photo to saved entry (dual photo upload methods)
- **Typography**:
  - Clash Display (custom) for headers and buttons (weights 400, 500)
  - Inter font for body text (weights 400-700)
- **Coffee-themed interactions**: Bean markers, pour animations, roast level color coding
- **Responsive design**: 2-column grid mobile, up to 5-column desktop
- **Bilingual**: Full English + Traditional Chinese support

### Recent UI Updates (December 2025)

**Custom Typography - Clash Display:**
- Added Clash Display font family from Fontshare
- Font files located in `client/public/fonts/`
  - `ClashDisplay-Regular.woff2` (weight 400)
  - `ClashDisplay-Medium.woff2` (weight 500)
- @font-face declarations in `client/src/index.css`
- Utility classes: `.font-clash-regular` and `.font-clash-medium`
- Applied to Dashboard components:
  - Search bar: `font-clash-regular`
  - Add Coffee button: `font-clash-medium`

**Dashboard Header Styling:**
- Logo updated to 160px × 160px (was 96px)
- Logo shape: circular with `rounded-full` + `object-cover`
- Search bar: pill-shaped with `rounded-full`
- Add Coffee button: pill-shaped with `rounded-full px-6 py-3`
- Consistent rounded design language across header components

**File Locations:**
- Fonts: `client/public/fonts/ClashDisplay-*.woff2`
- Font declarations: `client/src/index.css` (lines 5-20, 290-298)
- Dashboard header: `client/src/pages/Dashboard.tsx` (lines 240-268)

**Roast Level Feature (December 2025):**
- Added roast level dropdown field with 3 options: Light, Medium, Dark
- Position: Between Process Method and Roast Date
- AI-powered extraction: Groq AI detects roast level from coffee bag photos
- Notion database property: "Roast Level" (Select field with color-coded options)
- Display locations:
  - `AddCoffeeForm.tsx` (line 665-678): Dropdown selector
  - `EditCoffeeForm.tsx` (line 113-126): Editable dropdown
  - `CoffeeCard.tsx` (line 55-58): Badge display
  - `CoffeeDetail.tsx` (line 234-239): Badge in details view
- Backend changes:
  - `server/groq.ts` (line 17, 62): AI extraction logic
  - `server/notion.ts` (line 92-100, 242-246, 335-337): Notion property mapping
  - `shared/schema.ts` (line 17, 40, 60): TypeScript schema

**Mobile-First UX Enhancements (December 2025):**

1. **Optimized Coffee Cards:**
   - Changed aspect ratio from 4:5 to square on mobile, 3:4 on desktop
   - Reduced all text sizes and padding on mobile
   - Smaller badges (text-[10px] on mobile, text-xs on desktop)
   - Limited origin badges to first 2 items on mobile
   - Changed grid from 1 column to 2 columns on mobile (`grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`)
   - Tighter gap spacing: `gap-3 sm:gap-4 md:gap-6`
   - Magazine-style presentation optimized for mobile viewing
   - File: `client/src/components/CoffeeCard.tsx`

2. **Dual Photo Upload Options:**
   - Two distinct upload methods: "Take Photo" (camera) and "Choose Photo" (file browser)
   - Dark brown button for camera capture (with `capture="environment"` attribute)
   - Cream/beige button for file selection from device
   - Maintains drag-and-drop as bonus third option (desktop only)
   - Coffee-inspired design with subtle patterns and shine effects
   - SVG patterns moved to inline styles to avoid Vite parsing errors
   - File: `client/src/components/AddCoffeeForm.tsx`

3. **Scroll Progress Sidebar:**
   - Coffee-themed vertical scroll indicator on right side
   - "Coffee Pour" concept - bar fills like coffee being poured
   - Coffee bean markers at 25%, 50%, 75% scroll positions
   - Click-to-jump navigation
   - Hover tooltip showing percentage through collection
   - Appears when scrolled past 100px
   - Colors: Brown fill (#6F4E37 to #8B6F47), cream track (#E8DCC8 to #D4C5B0)
   - File: `client/src/components/ScrollSidebar.tsx`

4. **User Guide Modal:**
   - Vintage coffee guide book aesthetic
   - 4-step image carousel showing: 1) Capture, 2) AI Extract, 3) Review, 4) Collection
   - Coffee bean-shaped navigation dots with step numbers
   - Previous/Next arrows with hover animations
   - Smooth 700ms slide transitions
   - Large icon displays (Camera, Sparkles, CheckCircle2, Coffee)
   - Vintage stamp badges with rotation effect
   - Warm gradient backgrounds for each step
   - Replaces video embed for better mobile performance
   - File: `client/src/components/UserGuideModal.tsx`

5. **Help Button:**
   - Fixed bottom-right floating action button
   - Coffee brown gradient (#6F4E37 to #8B6F47)
   - Pulsing ring animation
   - Hover tooltip: "Quick Guide"
   - Coffee bean accent dot with bounce animation
   - Triggers UserGuideModal on click
   - File: `client/src/components/HelpButton.tsx`

6. **Duplicate Detection System:**
   - Automatic duplicate checking before saving entries
   - Checks existing entries for matching roaster name (case-insensitive)
   - Beautiful confirmation modal with vintage coffee receipt aesthetic
   - Shows side-by-side comparison: existing entry vs new entry
   - Displays existing entry photo, origin, rating, and date added
   - Warning stripe in golden brown (#D4A574)
   - Two actions: "Cancel" or "Save Anyway"
   - Prevents accidental duplicate submissions
   - File: `client/src/components/DuplicateConfirmationModal.tsx`

7. **Enhanced Save Button:**
   - Three visual states:
     - Default: Coffee brown gradient, "Save Entry" text
     - Saving: Bouncing coffee icon + "Brewing..." + shimmer animation
     - Success: Green gradient + check mark + "Saved!" (2-second flash)
   - Button disabled during save to prevent double-click
   - Smart validation: disabled if missing required fields
   - Loading indicators during upload and save
   - Integrated duplicate detection flow
   - File: `client/src/components/AddCoffeeForm.tsx`

8. **CoffeeStats Improvements:**
   - "Show less" collapse button moved to right side with `flex justify-end`
   - File: `client/src/components/CoffeeStats.tsx`

9. **Internationalization System (December 2025):**
   - Full bilingual support: English + Traditional Chinese (繁體中文)
   - Language switcher in dashboard header with globe icon
   - Dropdown shows both native name and English name for each language
   - Automatic language detection from browser settings
   - Persistent language preference via localStorage
   - Coffee-themed design with brown gradients
   - Translation namespaces: common, dashboard, forms, modals, guide, coffee
   - All UI text, labels, buttons, and messages fully translated
   - File: `client/src/components/LanguageSwitcher.tsx`
   - Config: `client/src/i18n/config.ts`

10. **Advanced Filtering and Sorting (December 2025):**
    - Multi-criteria filter system:
      - Roast Level: Light, Medium, Dark (translated)
      - Rating: 5★, 4★, 3★+ filters
      - Origin: Dynamic list from all coffee entries
    - Sort options: Newest, Oldest, Rating (High/Low), Name A-Z, Origin A-Z
    - Active filters display as dismissible badges
    - "Clear All" button when filters active
    - Responsive design: vertical on mobile, horizontal on desktop
    - Integrated with i18n for all labels
    - File: `client/src/components/CoffeeFilters.tsx`

11. **Collection Statistics Dashboard (December 2025):**
    - Expandable stats panel with coffee-themed design
    - Metrics displayed:
      - Total collection count with "beans" label
      - Origins explored (unique countries counter)
      - Most loved origin (highest average rating)
      - Average quality score across collection
    - Vintage coffee journal aesthetic with cream backgrounds
    - Coffee bean decorative elements
    - **Collapsible toggle functionality** (January 2026):
      - Arrow-only circular toggle button (ChevronUp ↑)
      - Collapsed state shows minimal summary tab with stats
      - Coffee brown gradient button with white border
      - Smooth animations between expanded/collapsed states
      - Defaults to expanded on page load
    - Motivational messages based on collection size
    - File: `client/src/components/CoffeeStats.tsx`

12. **Notion Database Connection Button (January 2026):**
    - Clean, minimal button matching Notion's official design language
    - Position: Top-right corner next to Language Switcher
    - Text: "Connect to [Notion Logo]" with inline logo
    - Color palette using Notion's official brand colors:
      - Background: White (#FFFFFF) → hover (#F7F6F5)
      - Border: Light gray (#E3E2E0) → hover (#D3D2CF)
      - Text: Dark gray (#37352F)
      - Logo: Black (#000000)
    - Simplified SVG Notion logo (single-path, fill="currentColor")
    - Subtle hover effects: background change, border darkening, logo scale (1.05x)
    - Links directly to user's Notion database
    - Professional, minimal aesthetic - feels like official integration
    - Fully responsive (compact on mobile)
    - File: `client/src/components/NotionButton.tsx`

13. **Collapsible Section Toggles (January 2026):**
    - Unified arrow-only toggle design across all collapsible sections
    - **Design specifications:**
      - 10×10 circular button with coffee brown gradient (#6F4E37 to #8B6F47)
      - White border (2px) for contrast
      - No text labels - just ChevronUp (↑) or ChevronDown (↓) icons
      - Positioned at bottom center of expanded sections
      - Smooth hover effects: gradient reversal, scale 110%, shadow intensifies
      - Icon micro-animation (translates up/down on hover)
      - Active press feedback (scale 95%)
    - **Implemented in:**
      - `AboutSection.tsx` - Collapses to minimal tab with coffee bean icon + title
      - `EmptyState.tsx` - Collapses to compact card with welcome text
      - `CoffeeStats.tsx` - Collapses to stats summary bar
    - **Better mobile UX**: Easy show/hide without permanent dismissal
    - Feels like folding/unfolding pages in vintage coffee journal

14. **Currency Selection for Price Field (January 2026):**
    - Multi-currency support: USD ($), CAD ($), EUR (€)
    - **Implementation:**
      - Currency dropdown (24px wide) + price input side-by-side
      - Auto-formats price with correct currency symbol on blur
      - Dynamic placeholder updates based on selected currency
      - Smart currency detection in EditCoffeeForm (€ = EUR, $ = USD)
    - **Files modified:**
      - `client/src/components/AddCoffeeForm.tsx` (lines 1060-1102)
      - `client/src/components/EditCoffeeForm.tsx` (lines 174-216)
    - **Storage**: Price stored as single string in database (e.g., "$18.99" or "€15.00")
    - Select component from shadcn/ui with coffee-themed styling
    - Currency symbol automatically updates when switching currencies

**New Components Added:**
- `client/src/components/ScrollSidebar.tsx` - Coffee-themed scroll progress indicator
- `client/src/components/UserGuideModal.tsx` - 4-step onboarding carousel
- `client/src/components/HelpButton.tsx` - Floating help button
- `client/src/components/DuplicateConfirmationModal.tsx` - Duplicate entry warning modal
- `client/src/components/LanguageSwitcher.tsx` - Language switcher (EN/ZH)
- `client/src/components/CoffeeFilters.tsx` - Advanced filtering and sorting
- `client/src/components/CoffeeStats.tsx` - Collection statistics panel
- `client/src/components/NotionButton.tsx` - Notion database connection button

**Modified Components:**
- `client/src/components/CoffeeCard.tsx` - Optimized sizing and mobile layout
- `client/src/components/AddCoffeeForm.tsx` - Dual upload options + duplicate detection + i18n + currency selection
- `client/src/components/EditCoffeeForm.tsx` - Currency selection for price field
- `client/src/components/AboutSection.tsx` - Arrow-only collapsible toggle (overflow-visible for button positioning)
- `client/src/components/EmptyState.tsx` - Arrow-only collapsible toggle
- `client/src/components/CoffeeStats.tsx` - Added collapsible toggle functionality
- `client/src/pages/Dashboard.tsx` - Integrated all new features (stats, filters, language switcher, scroll sidebar, help button, user guide, Notion button)
- All form and modal components - Full i18n integration

## Setup Guide for New Environments

### Initial Notion Setup

1. **Create Notion Integration:**
   ```bash
   # Go to https://www.notion.so/my-integrations
   # Click "+ New integration"
   # Name: "The Bean Keeper"
   # Copy the Internal Integration Token (starts with "ntn_")
   ```

2. **Update .env:**
   ```env
   NOTION_API_KEY=ntn_your_token_here
   GROQ_API_KEY=gsk_your_groq_key_here
   ```

3. **Test Connection:**
   ```bash
   npx tsx test-notion-setup.ts
   ```

4. **Create Parent Page in Notion:**
   - Create a page in your Notion workspace
   - Click "..." → "Add connections" → Select "The Bean Keeper"
   - Copy page ID from URL (32-character string)

5. **Create Database:**
   ```bash
   npx tsx create-database.ts <page-id>
   # Save the returned database ID
   ```

6. **Update Frontend:**
   - Add database ID to `client/src/lib/queryClient.ts` → `NOTION_DATABASE_ID`

7. **Start Development:**
   ```bash
   PORT=3000 npm run dev
   # Access at http://localhost:3000
   ```

## Common Development Tasks

### Testing Groq Extraction
```bash
npx tsx test-groq.ts
# Uses sample coffee bag OCR text
# Validates JSON output format
```

### Adding New Coffee Fields

1. Update `shared/schema.ts` - add to `CoffeeEntry` interface and validation schemas
2. Update `server/groq.ts` - add to AI extraction prompt
3. Update `server/notion.ts` - add to `coffeeEntryToNotionProperties()` and `notionPropertiesToCoffeeEntry()`
4. Update `AddCoffeeForm.tsx` - add form field
5. Update `CoffeeCard.tsx` / `CoffeeDetail.tsx` - display field
6. Update translations in `client/src/i18n/locales/en/*.json` and `client/src/i18n/locales/zh/*.json`

### Working with Translations

**Adding New Translated Text:**
1. Identify the appropriate namespace (common, dashboard, forms, modals, guide, coffee)
2. Add the key-value pair to `client/src/i18n/locales/en/<namespace>.json`
3. Add the corresponding translation to `client/src/i18n/locales/zh/<namespace>.json`
4. Use in components: `const { t } = useTranslation(['namespace']); t('namespace:key.path')`

**Translation Namespace Guidelines:**
- `common`: Shared UI elements (buttons, labels, errors)
- `dashboard`: Dashboard page content (header, filters, stats, empty state)
- `forms`: Form fields and validation messages
- `modals`: Modal dialogs (rating, guide, duplicates)
- `guide`: User guide and onboarding content
- `coffee`: Coffee-specific terms (roast levels, origins, flavor notes)

**Example Usage:**
```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation(['dashboard', 'coffee']);

  return (
    <>
      <h1>{t('dashboard:header.title')}</h1>
      <p>{t('coffee:roastLevels.medium')}</p>
    </>
  );
}
```

### Troubleshooting Port Conflicts

If you get `EADDRINUSE` error:
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use a different port
PORT=3000 npm run dev
```

### Fixing Missing Notion Database ID

If API requests fail with "Database not initialized":
1. Check `.env` has `NOTION_DATABASE_ID`
2. Verify database ID in `client/src/lib/queryClient.ts` matches `.env`
3. Restart dev server after changing either file

## Documentation

- `NOTION_SETUP_GUIDE.md` - Complete Notion integration setup guide
- `NOTION_DATABASE_STRUCTURE.md` - Notion database schema with 20 properties (includes Roast Level)
- `design_guidelines.md` - UI/UX design principles (mobile-first, photo-centric)
- `replit.md` - Project overview and recent changes history
- `test-notion-setup.ts` - Notion API connection test script
- `create-database.ts` - Database creation helper script

## Important Context

### Field Naming Conventions
- `roasterWebsite` is preferred over `roasterLocation` (changed Nov 12, 2025)
- `purchaseAgain` (boolean) not "wouldPurchaseAgain" or "buyAgain"
- `flavorNotes` (array) not "flavors" or "tastes"
- `roastDate` stored as text, not typed Date
- `roastLevel` accepts only: "Light", "Medium", or "Dark" (case-sensitive)
- `placeUrl` is auto-generated from roaster info (do not manually set)
- `price` stored as string with currency symbol (e.g., "$18.99", "€15.00", "$25.00 CAD")

### Photo Upload Flow
**Production (with Cloudinary):**
1. Frontend requests upload URL from `/api/upload-url`
2. Server returns `/api/cloudinary-upload/:fileId`
3. Client uploads file to server endpoint
4. Server streams file to Cloudinary
5. Cloudinary returns permanent URL: `https://res.cloudinary.com/...`
6. URL stored in Notion database
7. Both front and back photos follow same flow

**Development (without Cloudinary):**
1. Frontend requests upload URL from `/api/upload-url`
2. Server returns `/api/local-upload/:fileId`
3. Client uploads file to server
4. Server saves to `.local/uploads` directory
5. Returns local URL: `/api/local-files/:filename`
6. Files persist until server restart

### Google Maps Place URL Auto-Generation
The `placeUrl` field is automatically generated when creating or updating coffee entries:
- Implementation: `server/routes.ts` - `generatePlaceUrl()` function (lines 16-66)
- **Priority 1**: Uses full address if available (`roasterAddress`)
- **Priority 2**: Uses name + location + website domain (`roasterLocation` + `roasterWebsite`)
- **Priority 3**: Uses name + website domain + inferred country from TLD (.ca = Canada, .uk = UK, etc.)
- **Fallback**: Uses quoted roaster name for exact matching
- Auto-regenerates when any location-related field changes (name, address, location, website)
- Syncs to Notion "Place" column as a URL property
- Used by `CoffeeDetail.tsx` for embedded Google Maps display

### AI Extraction Best Practices
- Always combine text from front + back photos for accuracy
- Clean OCR text before sending to AI (remove artifacts)
- Graceful fallback to regex if AI fails
- Validate and sanitize AI response fields
- Temperature 0 for deterministic output

### Notion Database Header
Frontend automatically includes in **all** API requests:
```
X-Notion-Database-Id: a12cbbbc-b1a4-421d-83f0-2fac3436c39d
```

This is set in `client/src/lib/queryClient.ts` as a constant and included by `getHeaders()` helper.

### Internationalization Best Practices
- Language preference stored in localStorage as `beankeeper_language`
- Supported languages: `en` (English), `zh` (Traditional Chinese/繁體中文)
- Fallback language is always English
- Auto-detection uses browser's language settings on first visit
- All user-facing text must be in translation files (no hardcoded strings)
- Keep translation keys organized by feature/namespace
- When adding new features, add both EN and ZH translations simultaneously
