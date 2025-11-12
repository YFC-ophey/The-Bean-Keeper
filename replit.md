# Coffee Bean Tracker App

## Overview

A mobile-first coffee tracking application that allows users to photograph coffee bags, extract information via OCR, and maintain a personal journal of their coffee experiences. The app combines photo-centric design with structured data organization, featuring automatic data extraction from coffee bag photos, roaster location mapping, and rating/tasting note capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**November 12, 2025:**
- Added support for uploading 2 photos (front and back of coffee bag) for comprehensive information extraction
- Combined OCR text from both photos sent to ChatGPT for improved extraction accuracy
- Added AI-powered OCR optimization using OpenAI GPT-5 (via Replit AI Integrations)
- Migrated from in-memory to PostgreSQL database storage for data persistence
- Enhanced extraction accuracy for roaster names, origins, varieties, and flavor notes
- Implemented graceful database fallback for development environments
- Renamed application from "Coffee Journal" to "Coffee Bean Tracker"
- Added manual "Rescan Text" button for re-triggering OCR when needed
- Display both photos side-by-side in detail view when back photo is available

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for component-based UI
- Vite as build tool and development server
- Wouter for client-side routing
- TanStack Query (React Query) for server state management
- Tailwind CSS with shadcn/ui components for styling

**Design Philosophy:**
- Mobile-first approach with camera/photo upload as primary interaction
- Hybrid design combining Material Design foundation with Instagram-inspired photo presentation
- Photo-centric interface with clean data display optimized for scannable timeline/grid views
- Typography using Inter font family with specific weight and size conventions

**Key Frontend Components:**
- `AddCoffeeForm`: Photo upload interface supporting front and back photos with combined OCR scanning using Tesseract.js for automatic field extraction
- `CoffeeCard`: Instagram-style card displaying front photo with overlay information
- `CoffeeDetail`: Modal view showing comprehensive coffee entry details with side-by-side photo display when both photos available
- `RatingModal`: Star rating interface with tasting notes
- `FilterBar`: Search and filter interface for browsing entries
- `StarRating`: Reusable star rating component with interactive and readonly modes

**State Management:**
- React Query for API data fetching, caching, and synchronization
- Local component state for UI interactions
- Query invalidation patterns for optimistic updates

### Backend Architecture

**Technology Stack:**
- Express.js server with TypeScript
- Drizzle ORM for database operations
- PostgreSQL database (via Neon serverless)
- Google Cloud Storage for photo storage (via Replit Object Storage)

**API Structure:**
- RESTful endpoints for CRUD operations on coffee entries
- Separate object storage service for photo upload/retrieval
- Session-based request logging with response truncation
- Raw body preservation for webhook/signature verification compatibility

**Data Storage:**
- Coffee entries stored in PostgreSQL with schema defined in `shared/schema.ts`
- Photo files stored in Google Cloud Storage buckets
- Automatic fallback to in-memory storage when DATABASE_URL is not available
- DbStorage uses Drizzle ORM with Neon serverless PostgreSQL driver

**Database Schema:**
The `coffee_entries` table includes:
- Core fields: id (UUID), frontPhotoUrl (required), backPhotoUrl (optional), roasterName, createdAt
- Roaster info: roasterLocation, roasterAddress, roasterWebsite
- Coffee details: farm, origin, variety, processMethod, roastDate
- User input: flavorNotes (array), rating (integer), tastingNotes (text)

**Storage Abstraction:**
- `IStorage` interface defines standard data operations
- `DbStorage` implements persistent storage using Drizzle ORM with PostgreSQL
- `MemStorage` provides in-memory fallback when database is unavailable
- Automatic storage selection based on DATABASE_URL availability

### External Dependencies

**Third-Party Services:**
- **Google Cloud Storage**: Photo/object storage via Replit sidecar authentication
  - Custom credential flow using external_account type
  - Endpoint: `http://127.0.0.1:1106` (Replit sidecar)
  - Project ID managed through environment configuration

- **Neon Serverless PostgreSQL**: Database hosting
  - Connection string via `DATABASE_URL` environment variable
  - Serverless driver compatible with edge environments

**OCR Processing:**
- **Tesseract.js**: Client-side OCR for extracting raw text from coffee bag photos
  - Runs in browser to extract text from both front and back photos
  - Combines text from both images before sending to AI
  - Raw combined text is sent to AI for intelligent parsing
- **OpenAI GPT-5**: AI-powered text extraction via Replit AI Integrations
  - Intelligently extracts structured coffee information from combined OCR text
  - Better at parsing stylized fonts and context than regex patterns
  - Provides roaster name, location, farm, origin, variety, process, roast date, flavor notes
  - Graceful fallback to regex extraction if AI service fails
  - Analyzing both bag sides significantly improves extraction accuracy

**UI Component Library:**
- **shadcn/ui**: Comprehensive component library built on Radix UI primitives
  - Configured with "new-york" style variant
  - Customized Tailwind theme with neutral base color
  - Components aliased via `@/components` path

**Mapping (Future Integration):**
- Google Maps Embed API for roaster location visualization
  - Placeholder implementation in `CoffeeDetail` component
  - Requires `GOOGLE_MAPS_API_KEY` environment variable

**Build & Development Tools:**
- **Vite**: Development server and build system with HMR
- **Drizzle Kit**: Database schema migrations and management
- **esbuild**: Production server bundling
- **Replit-specific plugins**: Runtime error overlay, cartographer, dev banner (development only)

**Form & Validation:**
- **React Hook Form**: Form state management
- **Zod**: Schema validation and type inference
- Drizzle Zod integration for database schema validation

**Date Handling:**
- **date-fns**: Date formatting and manipulation throughout UI

**Additional Libraries:**
- **react-dropzone**: File upload with drag-and-drop support
- **lucide-react**: Icon system
- **class-variance-authority (cva)**: Component variant management
- **clsx/tailwind-merge**: Utility class composition