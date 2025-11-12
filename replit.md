# Coffee Journal App

## Overview

A mobile-first coffee tracking application that allows users to photograph coffee bags, extract information via OCR, and maintain a personal journal of their coffee experiences. The app combines photo-centric design with structured data organization, featuring automatic data extraction from coffee bag photos, roaster location mapping, and rating/tasting note capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

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
- `AddCoffeeForm`: Photo upload interface with OCR scanning using Tesseract.js for automatic field extraction
- `CoffeeCard`: Instagram-style card displaying coffee photo with overlay information
- `CoffeeDetail`: Modal view showing comprehensive coffee entry details
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
- In-memory fallback storage implementation for development/testing

**Database Schema:**
The `coffee_entries` table includes:
- Core fields: id (UUID), photoUrl, roasterName, createdAt
- Roaster info: roasterLocation, roasterAddress, roasterWebsite
- Coffee details: farm, origin, variety, processMethod, roastDate
- User input: flavorNotes (array), rating (integer), tastingNotes (text)

**Storage Abstraction:**
- `IStorage` interface defines standard data operations
- `MemStorage` provides in-memory implementation
- Database storage implementation would use Drizzle ORM with PostgreSQL

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
- **Tesseract.js**: Client-side OCR for extracting text from coffee bag photos
  - Runs in browser to parse roaster names, origins, varieties, processing methods
  - No external API dependency for OCR functionality

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