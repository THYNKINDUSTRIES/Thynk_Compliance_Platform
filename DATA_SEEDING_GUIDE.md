# Database Seeding Guide

## Overview
The application has local data files with regulations, but they need to be migrated to the Supabase database for the search functionality to work.

## Quick Start - Seed Data via UI

1. **Login as Admin** or any authenticated user
2. Navigate to `/source-management` page
3. Click the **"Seed Database"** button at the top
4. Wait for the migration to complete (you'll see a success toast)

## Manual Migration (Alternative Method)

If you prefer to run the migration script manually:

```bash
# Install dependencies
npm install

# Run the migration script
npx tsx src/scripts/migrateData.ts
```

## What Gets Migrated

The migration script (`src/scripts/migrateData.ts`) imports and migrates:
- `MOCK_REGULATIONS` from `src/data/regulations.ts`
- `EXTENDED_REGULATIONS` from `src/data/extendedRegulations.ts`
- `ADDITIONAL_REGULATIONS` from `src/data/moreRegulations.ts`

## Data Structure

Each regulation includes:
- Title and summary
- Jurisdiction (Federal, California, Florida, etc.)
- Authority (FDA, DEA, CDPH, etc.)
- Products (hemp, thca, delta8, kratom, etc.)
- Stages (Manufacturing, Retail, Testing, etc.)
- Status (proposed, adopted, effective, etc.)
- Impact level (high, medium, low)
- Dates (published, effective)
- Citation and URL

## Search Functionality

After seeding, you can search for:
- **"THCa"** - Returns regulations about THCa products
- **"hemp"** - Returns hemp-related regulations
- **"FDA"** - Returns FDA regulations
- **Any keyword** in title, summary, or citation

## Troubleshooting

### No results when searching
- Ensure database has been seeded (check via UI button)
- Check Supabase dashboard to verify data exists in `instrument` table
- Verify RLS policies allow reading from `instrument` table

### Migration fails
- Check Supabase connection in `src/lib/supabase.ts`
- Verify database tables exist (run migrations from DATABASE_SETUP.md)
- Check console for specific error messages

### Duplicate data
- The migration script checks for existing jurisdictions and authorities
- If you run it multiple times, you may get duplicate regulations
- Clear the `instrument` table before re-running if needed

## Database Tables

The migration populates these tables:
- `jurisdiction` - States and federal government
- `authority` - Regulatory agencies (FDA, DEA, etc.)
- `instrument` - Individual regulations/rules/guidance documents
