# Batch NLP Analysis Fix

## Issue Identified
The Batch NLP Analysis feature was not working because the `nlp_analyzed` and `nlp_analyzed_at` fields were not being fetched from the database, causing the component to be unable to determine which documents needed analysis.

## Root Causes

### 1. Missing Database Columns
The `instrument` table was missing the `nlp_analyzed` and `nlp_analyzed_at` columns that are referenced in the edge function and documentation.

### 2. Missing Fields in Query
The `useRegulations` hook was not fetching the NLP analysis status fields from the database, so the Regulation interface didn't include this information.

### 3. Missing Fields in TypeScript Interface
The `Regulation` interface in `useRegulations.ts` didn't include the `nlp_analyzed` and `nlp_analyzed_at` properties.

## Fixes Applied

### 1. Added Database Columns
```sql
ALTER TABLE instrument ADD COLUMN nlp_analyzed BOOLEAN DEFAULT false;
ALTER TABLE instrument ADD COLUMN nlp_analyzed_at TIMESTAMPTZ;
```

### 2. Updated Regulation Interface
Added the NLP analysis fields to the TypeScript interface:
```typescript
export interface Regulation {
  // ... existing fields
  nlp_analyzed?: boolean;
  nlp_analyzed_at?: string;
}
```

### 3. Updated Database Query
Modified the `useRegulations` hook to fetch NLP analysis status:
```typescript
.select(`
  id,
  title,
  summary,
  // ... other fields
  nlp_analyzed,
  nlp_analyzed_at,
  // ... remaining fields
`)
```

### 4. Updated Data Transformation
Added NLP fields to the data transformation mapping:
```typescript
nlp_analyzed: item.nlp_analyzed || false,
nlp_analyzed_at: item.nlp_analyzed_at,
```

### 5. Fixed Success Count Calculation
Improved the success count calculation in `BatchNLPAnalysis.tsx` to properly count completed analyses after the batch processing loop finishes.

## How to Verify the Fix

### 1. Check Database Columns
Run this query in Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'instrument' 
  AND column_name IN ('nlp_analyzed', 'nlp_analyzed_at')
ORDER BY column_name;
```

Expected output:
- `nlp_analyzed` - boolean - YES - false
- `nlp_analyzed_at` - timestamp with time zone - YES - NULL

### 2. Check Analysis Status
Query to see which documents need analysis:
```sql
SELECT 
  COUNT(*) as total_instruments,
  COUNT(*) FILTER (WHERE nlp_analyzed = true) as analyzed,
  COUNT(*) FILTER (WHERE nlp_analyzed = false OR nlp_analyzed IS NULL) as pending
FROM instrument;
```

### 3. Test Batch Analysis
1. Navigate to the Dashboard page
2. Look for the "Batch NLP Analysis" card
3. It should show the number of documents pending analysis
4. Click "Analyze X Documents" button
5. Watch the progress bar and status indicators
6. Each document should show:
   - Pending (empty circle) → Analyzing (spinning loader) → Success (green check) or Error (red X)
7. After completion, a toast notification should show the success count

### 4. Verify Analysis Results
After running batch analysis, check that documents are marked as analyzed:
```sql
SELECT 
  id,
  title,
  nlp_analyzed,
  nlp_analyzed_at,
  (SELECT COUNT(*) FROM extracted_entity WHERE instrument_id = instrument.id) as entity_count
FROM instrument
WHERE nlp_analyzed = true
ORDER BY nlp_analyzed_at DESC
LIMIT 10;
```

### 5. View Extracted Entities
Click on any analyzed regulation to see the extracted entities displayed in the modal with confidence scores.

## Expected Behavior

### Before Analysis
- Documents show `nlp_analyzed = false` or `NULL`
- No extracted entities exist for the document
- Batch NLP Analysis card shows "X documents pending analysis"
- "Analyze with AI" button appears in regulation modals

### During Analysis
- Progress bar shows completion percentage
- Each document shows real-time status (pending → analyzing → success/error)
- Current document being processed is highlighted
- Badge shows "Processing X of Y"

### After Analysis
- Documents show `nlp_analyzed = true`
- `nlp_analyzed_at` timestamp is set
- Extracted entities are stored in `extracted_entity` table
- Regulation modals show "AI-Extracted Information" section
- Purple sparkle icon (✨) appears on analyzed regulations
- Batch NLP Analysis card updates to show remaining pending documents

## Troubleshooting

### No Documents Showing for Analysis
**Issue**: Batch NLP Analysis shows "0 documents pending analysis"

**Solutions**:
1. Check if documents exist in the database:
   ```sql
   SELECT COUNT(*) FROM instrument;
   ```
2. Verify the `nlp_analyzed` column exists and has correct values
3. Check browser console for any errors loading regulations
4. Ensure you're logged in (batch analysis requires authentication)

### Analysis Fails with Errors
**Issue**: Documents show red X (error status)

**Solutions**:
1. Check Supabase Edge Function logs for the `nlp-analyzer` function
2. Verify `OPENAI_API_KEY` is set in Supabase environment variables
3. Check OpenAI API quota/rate limits
4. Ensure documents have sufficient text content (title + summary)
5. Review error messages in the browser console

### Entities Not Appearing
**Issue**: Analysis completes but no entities are shown

**Solutions**:
1. Check if entities were actually extracted:
   ```sql
   SELECT * FROM extracted_entity 
   WHERE instrument_id = 'YOUR_INSTRUMENT_ID';
   ```
2. Verify confidence threshold (default is 0.5)
3. Check if the document text contains extractable information
4. Review OpenAI API response in edge function logs

### Progress Bar Not Updating
**Issue**: Progress bar stuck or not moving

**Solutions**:
1. Check browser console for JavaScript errors
2. Verify network connectivity to Supabase
3. Check if edge function is responding (may be cold start delay)
4. Refresh the page and try again

## Performance Considerations

### Batch Size
- The component processes documents sequentially with a 1-second delay between requests
- For large batches (100+ documents), consider processing in smaller chunks
- OpenAI API rate limits: 10,000 requests/day on free tier

### API Costs
- Each document analysis costs approximately 1-2 cents (GPT-4o model)
- Monitor OpenAI usage in your OpenAI dashboard
- Consider using GPT-4o-mini for lower costs if accuracy is acceptable

### Database Performance
- Batch inserts of extracted entities are optimized
- Indexes on `instrument_id` and `entity_type` improve query performance
- Consider adding pagination if displaying thousands of entities

## Related Files
- `src/components/BatchNLPAnalysis.tsx` - Batch analysis UI component
- `src/hooks/useRegulations.ts` - Regulation data fetching hook
- `src/components/NLPAnalysisPanel.tsx` - Individual document analysis
- `src/components/ExtractedEntities.tsx` - Entity display component
- Edge function: `nlp-analyzer` - OpenAI integration for entity extraction

## Additional Resources
- [INGESTION_SETUP.md](./INGESTION_SETUP.md) - Full NLP analysis documentation
- [NLP_IMPROVEMENTS.md](./NLP_IMPROVEMENTS.md) - Advanced NLP features
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
