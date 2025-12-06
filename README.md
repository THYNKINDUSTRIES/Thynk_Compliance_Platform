# Thynk Compliance Platform

A comprehensive real-time regulatory intelligence platform for tracking cannabis, hemp, kratom, nicotine, and psychedelic regulations across all 50 US states and federal agencies.


## Features

### 🗺️ Interactive State Map
- Visual representation of regulatory status across all US states
- Color-coded by legal status (Legal, Medical, Decriminalized, Illegal)
- Click any state to view detailed regulatory information
- Real-time data freshness indicators

### 📊 State Detail Pages
- Comprehensive regulatory summaries for each product category
- Timeline of recent regulatory changes (12+ entries per state)
- Compliance deadline calendar with priority indicators
- Requirement matrices (licensing, testing, packaging)
- Authority contact information with direct links
- State comparison tool for side-by-side analysis
- Breadcrumb navigation and deep-linking support

### 🔄 Real-Time Data Ingestion
- **Federal Register API**: Polls every 15 minutes for federal regulations
- **Regulations.gov API**: Tracks dockets and public comments
- **State Agency RSS Feeds**: Monitors 15+ state cannabis agencies
- **Webhook Support**: Instant updates when available
- Automatic NLP-based document parsing and tagging
- Live data freshness indicators on all pages

### 🛠️ Source Management Interface
- Admin panel at `/admin/sources` for managing data sources
- Add/edit/test RSS feed URLs
- Configure polling intervals per source
- Monitor feed health status in real-time
- View last polled timestamps
- Test feed parsing before deployment

### 📱 Modern UI/UX
- Responsive design for desktop, tablet, and mobile
- Dark mode support
- Real-time Supabase subscriptions
- Loading states and error handling
- Toast notifications for user feedback

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **APIs**: Federal Register, Regulations.gov, State RSS feeds
- **Deployment**: Vercel/Netlify compatible

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- API keys for Regulations.gov (optional: Federal Register, GovInfo)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd integrated-regulatory-platform
```

2. Install dependencies
```bash
npm install
```

3. Set up Supabase
- Create a new Supabase project
- Run the database migrations (see INGESTION_SETUP.md)
- Add API keys as Supabase secrets

4. Start development server
```bash
npm run dev
```

## Data Ingestion Setup

See [INGESTION_SETUP.md](./INGESTION_SETUP.md) for detailed instructions on:
- Configuring edge functions
- Setting up automated polling
- Managing RSS feeds
- Monitoring data freshness
- Troubleshooting common issues

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui base components
│   ├── Header.tsx      # Navigation header
│   ├── StateMap.tsx    # Interactive US map
│   ├── StateTimeline.tsx # Regulatory timeline
│   └── ...
├── pages/              # Route pages
│   ├── Index.tsx       # Home page
│   ├── StateDetail.tsx # State detail view
│   └── SourceManagement.tsx # Admin panel
├── hooks/              # Custom React hooks
│   ├── useRegulations.ts
│   └── useJurisdictionFreshness.ts
├── lib/                # Utilities
│   ├── supabase.ts     # Supabase client
│   └── utils.ts
└── data/               # Static data files
```

## API Documentation

### Edge Functions

All edge functions are deployed to Supabase and can be invoked via:
```
https://YOUR_PROJECT.supabase.co/functions/v1/FUNCTION_NAME
```

- `federal-register-poller`: Polls Federal Register API
- `regulations-gov-poller`: Polls Regulations.gov API
- `rss-feed-poller`: Generic RSS/Atom feed parser
- `webhook-receiver`: Receives instant updates

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, questions, or feature requests, please open an issue on GitHub.
