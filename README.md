# Thynk Compliance Platform (TCP)

A comprehensive real-time regulatory intelligence platform for tracking cannabis, hemp, kratom, nicotine/vapes, psychedelics, and other alternative wellness regulations across all 50 US states, DC, and federal agencies.

**Live Site:** [https://www.thynkflow.io](https://www.thynkflow.io)

## Overview

TCP (Thynk Compliance Platform) is a B2B SaaS platform designed for legal, compliance, and operations teams in the alternative wellness industry. It provides:

- Real-time regulatory monitoring across 50+ jurisdictions
- Automated data ingestion from Federal Register, Regulations.gov, and state agencies
- NLP-powered document analysis and tagging
- Custom alerts and notification systems
- Compliance checklists and workflow management
- Public comment tracking and bulk submission tools

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Edge Functions + Auth)
- **Hosting**: Vercel
- **CI/CD**: GitHub Actions

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

## Deployment

Deployed on Vercel with automatic deployments from GitHub:
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key |

## Database

Run migrations from `supabase/migrations/` folder. Key tables:
- `instrument` - Regulatory documents
- `jurisdiction` - States and federal jurisdictions
- `user_profiles` - User data
- `user_alerts` - User notification preferences
- `user_favorites` - Saved regulations

## Known Issues & Fixes

### HTTP 400 Errors on user_alerts Table
Run the migration in `supabase/migrations/create_user_alerts_table.sql`. The Dashboard gracefully handles cases where this table doesn't exist.

### Button Functionality
- "Book a Demo" → navigates to `/contact?tab=sales`
- "Explore the Map" → navigates to `/app` (public regulatory map)

## Support

- **Email**: support@thynk.guru
- **Phone**: 1 (800) 99-THYNK

## License

Proprietary - All rights reserved by Thynk Industries.

---

Built by [Thynk Industries](https://thynk.guru)
