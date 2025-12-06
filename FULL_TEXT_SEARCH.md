# PostgreSQL Full-Text Search Implementation

## Overview
The Thynk Compliance Platform now uses PostgreSQL's powerful full-text search capabilities to provide fast, intelligent search across all regulations with stemming, ranking, and highlighting.

## Features Implemented

### 1. Full-Text Search Vector
- **tsvector column** added to `instrument` table
- Combines title (weight A), summary (weight B), and citation (weight C)
- Automatically updated via trigger on INSERT/UPDATE
- GIN index for optimal performance

### 2. Search Capabilities
- **Stemming**: Search "test" finds "testing", "tested", "tests"
- **Ranking**: Results sorted by relevance score
- **Highlighting**: Matched terms highlighted in results
- **Web search syntax**: Supports phrases, AND/OR operators

### 3. Search Suggestions
- Tracks popular search queries in `search_queries` table
- Shows trending searches in dropdown
- Auto-complete based on query prefix
- Displays search frequency

### 4. Performance
- GIN index enables millisecond search times
- Handles complex queries efficiently
- Scales to millions of documents

## Database Schema

### instrument table
```sql
ALTER TABLE instrument ADD COLUMN search_vector tsvector;
CREATE INDEX instrument_search_vector_idx ON instrument USING GIN (search_vector);
```

### search_queries table
```sql
CREATE TABLE search_queries (
  id UUID PRIMARY KEY,
  query TEXT UNIQUE NOT NULL,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Functions

### search_instruments(search_query, jurisdiction_filter, limit_count)
Main search function that:
- Uses `websearch_to_tsquery` for natural query parsing
- Returns ranked results with relevance scores
- Generates highlighted snippets via `ts_headline`
- Filters by jurisdiction if specified

### increment_search_count(search_query)
Tracks search queries for suggestions:
- Increments count for existing queries
- Creates new entry for first-time queries
- Updates last_searched_at timestamp

## Usage Examples

### Basic Search
```typescript
const { regulations } = useRegulations({ search: 'hemp testing' });
```

### Advanced Search
```typescript
// Phrase search
useRegulations({ search: '"FDA warning letter"' });

// Boolean operators
useRegulations({ search: 'hemp AND testing' });
useRegulations({ search: 'delta-8 OR delta-9' });

// Exclude terms
useRegulations({ search: 'cbd -thc' });
```

### With Filters
```typescript
useRegulations({ 
  search: 'labeling requirements',
  jurisdiction: 'California',
  impactLevels: ['high']
});
```

## Components

### SearchBar
- Real-time search with 500ms debounce
- Shows popular search suggestions
- Quick tag buttons for common searches
- Clear button to reset search

### SearchHighlight
- Parses ts_headline HTML output
- Highlights matched terms with yellow background
- Falls back to plain text if no highlights

### RegulationCard
- Displays search relevance score
- Shows highlighted snippets
- Indicates match percentage

## Performance Tips

1. **Keep search_vector updated**: Trigger automatically maintains it
2. **Use GIN index**: Already created for optimal performance
3. **Limit results**: Default limit of 100 results
4. **Filter early**: Apply jurisdiction filters in SQL, not client-side

## Search Query Tracking

Popular searches are automatically tracked:
- Every search increments the count
- Used to show trending searches
- Helps identify common user needs
- Can inform content strategy

## Future Enhancements

Potential improvements:
- Fuzzy matching for typos
- Synonym support (hemp = cannabis)
- Multi-language support
- Search analytics dashboard
- Personalized suggestions based on user history
