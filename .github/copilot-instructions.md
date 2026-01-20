# Thynk Compliance Platform - AI Coding Assistant Instructions

## Project Overview
This is a comprehensive real-time regulatory intelligence platform tracking cannabis, hemp, kratom, nicotine, and psychedelic regulations across all 50 US states and federal agencies. The platform ingests data from government APIs, processes it with NLP, and provides a modern web interface for compliance monitoring.

## Architecture & Tech Stack

### Frontend
- **React 18** with TypeScript and Vite
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **State Management**: React Context (AppContext for filters/UI state, AuthContext for authentication)
- **Data Fetching**: TanStack React Query with custom hooks
- **Routing**: React Router with protected routes (user/admin roles)
- **Styling**: Tailwind CSS with CSS variables and dark mode support

### Backend
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **Edge Functions**: Supabase Edge Functions for data ingestion (federal-register-poller, regulations-gov-poller, rss-feed-poller, nlp-analyzer)
- **Authentication**: Supabase Auth with custom user profiles and beta access system
- **APIs**: Federal Register API, Regulations.gov API, state agency RSS feeds

### Key Data Flow
1. **Ingestion**: Edge functions poll APIs every 15 minutes
2. **Processing**: NLP analyzer extracts structured data (products, jurisdictions, requirements)
3. **Storage**: Data stored in Supabase with proper relationships (jurisdiction → authority → instrument)
4. **Frontend**: React Query hooks fetch and cache data, with complex filtering system

## Critical Developer Workflows

### Development Setup
```bash
npm install
npm run dev  # Starts Vite dev server on localhost:5173
```

### Environment Variables
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Public anon key (default)
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: Service role key (preview/admin mode only)
- `VITE_BETA_MODE`: Enables beta access restrictions

### Database Operations
- **Migrations**: Located in `supabase/migrations/` - run in Supabase SQL Editor
- **RLS Policies**: Always enable RLS and create policies using `auth.uid()` for user-specific data
- **Edge Functions**: Deploy via Supabase CLI or dashboard

### Build & Deployment
```bash
npm run build          # Production build
npm run build:dev      # Development build
npm run preview        # Preview production build
```
- **Deployment**: Vercel with custom beta deployment script (`scripts/deploy-beta.sh`)
- **Beta Features**: Email domain restrictions, noindex meta tags, robots.txt blocking

## Project-Specific Patterns & Conventions

### Data Fetching & Caching
- **Always use React Query hooks** instead of direct Supabase calls
- **Custom hooks** in `src/hooks/` (useRegulations, useNotifications, useWorkflows)
- **Caching**: Custom cache manager with TTL and prefix-based invalidation
- **Cache keys**: Generated with `generateCacheKey()` function

### Authentication & Authorization
- **AuthContext**: Manages user sessions, profiles, and roles
- **Protected Routes**: Use `<ProtectedRoute>` wrapper, `adminOnly` prop for admin routes
- **Beta Access**: Check `hasBetaAccess` from AuthContext
- **User Profiles**: Extended with onboarding status, saved searches, etc.

### Filtering System
- **AppContext**: Manages global filters (search, jurisdictions, products, dates, etc.)
- **Filter Updates**: Use `updateFilter(key, value)` method with logging
- **Filter Clearing**: `clearFilters()` resets all filters
- **Filter Types**: Complex interface with arrays for multi-select filters

### Component Patterns
- **shadcn/ui Components**: Use pre-configured components from `@/components/ui/`
- **Path Aliases**: `@/` for `src/`, `@/components`, `@/lib`, `@/hooks`
- **Layout Components**: AppLayout wraps main content with Header, Footer, etc.
- **Data Components**: RegulationCard, StateMap, FilterPanel follow consistent patterns

### Export Functionality
- **Multiple Formats**: CSV, Excel, PDF, PNG chart exports
- **Libraries**: html2canvas for screenshots, jsPDF for PDFs, ExcelJS for spreadsheets
- **Element IDs**: Export functions target DOM elements by ID
- **File Naming**: Consistent `${filename}.${extension}` pattern

### Database Schema Patterns
- **Core Tables**: jurisdiction, authority, instrument (regulations), source, tag
- **User Tables**: user_profiles, user_favorites, user_alerts
- **Relationships**: jurisdiction → authority → instrument with proper foreign keys
- **Metadata**: JSONB fields for flexible NLP-extracted data
- **Timestamps**: created_at, updated_at on all tables

### Edge Function Patterns
- **Polling Functions**: federal-register-poller, regulations-gov-poller, rss-feed-poller
- **NLP Processing**: nlp-analyzer extracts products, stages, requirements with confidence scores
- **Error Handling**: Comprehensive logging and error reporting
- **Scheduling**: Cron-based execution every 15 minutes

## Common Gotchas & Best Practices

### Supabase Integration
- **RLS Always On**: Never disable RLS in production
- **Service Role**: Only use in preview/admin contexts, never expose to clients
- **Auth Checks**: Use `auth.uid()` in policies, not `auth.jwt()`
- **Environment Keys**: Anon key for client, service role for server operations

### React Query Usage
- **Hook Dependencies**: Pass filters as dependencies to trigger refetches
- **Loading States**: Always handle loading, error, and data states
- **Cache Invalidation**: Use `invalidateCacheByPrefix()` for related data updates
- **Optimistic Updates**: Consider for better UX on mutations

### TypeScript Patterns
- **Interface Extensions**: Extend base interfaces for component props
- **Utility Types**: Use Partial<T>, Pick<T> for flexible APIs
- **Enum-like Types**: Use string unions for status fields (e.g., 'user' | 'admin')

### Performance Considerations
- **Image Optimization**: Use html2canvas scale: 2 for high-quality exports
- **Bundle Splitting**: Vendor, UI, and Supabase chunks configured in vite.config.ts
- **Lazy Loading**: Consider for heavy components (charts, maps)
- **Cache Strategy**: 5-minute TTL for regulation data, immediate invalidation on updates

### Testing & Validation
- **Build Checks**: Run `npm run build` before commits
- **Type Checking**: ESLint with TypeScript rules enabled
- **Environment Testing**: Test with both anon and service role keys

## Key Files to Reference

### Core Architecture
- `src/App.tsx`: Main routing and provider setup
- `src/contexts/AuthContext.tsx`: Authentication state management
- `src/contexts/AppContext.tsx`: Global filters and UI state
- `src/lib/supabase.ts`: Supabase client configuration

### Data Layer
- `src/hooks/useRegulations.ts`: Main data fetching with caching
- `src/lib/cache.ts`: Custom caching implementation
- `INGESTION_SETUP.md`: Data ingestion architecture

### Components
- `src/components/AppLayout.tsx`: Main layout with all features
- `src/components/RegulationCard.tsx`: Regulation display component
- `src/components/FilterPanel.tsx`: Complex filtering UI

### Utilities
- `src/lib/exportUtils.ts`: Multi-format export functionality
- `src/lib/utils.ts`: Common utility functions
- `package.json`: Dependencies and scripts

### Configuration
- `vite.config.ts`: Build configuration with aliases and chunking
- `tailwind.config.ts`: Theme configuration with shadcn/ui colors
- `components.json`: shadcn/ui component configuration

This platform requires understanding both frontend React patterns and backend Supabase/Edge Functions architecture. Focus on the data flow from API ingestion through NLP processing to user-facing regulatory intelligence.