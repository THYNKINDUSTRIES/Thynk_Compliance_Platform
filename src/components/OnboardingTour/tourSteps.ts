import {
  Sparkles, Search, Layers, BarChart3, MessageSquare, Map,
  SlidersHorizontal, LayoutDashboard, GitBranch, ClipboardCheck,
  Zap, PartyPopper, Bell, Shield
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  /** CSS selector for the target element (null = centered card) */
  target: string | null;
  /** Tooltip position relative to target */
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon: LucideIcon;
  /** Bullet-point features shown on centered cards */
  features?: string[];
  /** Interactive hint shown when targeting an element */
  interactive?: string;
  /** Tailwind gradient classes for the step's color theme */
  color: string;
  /** Category label for grouping */
  category?: 'discover' | 'track' | 'act' | 'manage';
  /** Keyboard shortcut hint for the feature */
  shortcut?: string;
  /** Estimated time to complete this section (displayed as a chip) */
  estimatedTime?: string;
  /** Fun stat or metric to build excitement */
  metric?: { label: string; value: string };
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ThynkFlow',
    description:
      "Your AI-powered compliance command center. Let's take a 2-minute tour to get you up and running.",
    target: null,
    position: 'center',
    icon: Sparkles,
    color: 'from-blue-500 to-indigo-600',
    estimatedTime: '~2 min',
    features: [
      'Real-time tracking across 50 states & federal agencies',
      'Cannabis, hemp, kratom, kava, nicotine & psychedelics coverage',
      'AI-powered NLP analysis with confidence scoring',
      'Compliance workflows, alerts & team collaboration',
    ],
    metric: { label: 'Regulations tracked', value: '1,700+' },
  },
  {
    id: 'search',
    title: 'Instant Search',
    description:
      'Find any regulation in milliseconds — by keyword, citation, agency, or topic. Results stream in as you type with AI-ranked relevance.',
    target: '[data-tour="search"]',
    position: 'bottom',
    icon: Search,
    color: 'from-emerald-500 to-teal-600',
    category: 'discover',
    interactive: 'Try typing "cannabis", "FDA", or a state name!',
    shortcut: '⌘K',
  },
  {
    id: 'products',
    title: 'Substance Filters',
    description:
      'One-click category filters instantly narrow the entire platform. Mix and match substances to build your monitoring profile.',
    target: '[data-tour="product-categories"]',
    position: 'bottom',
    icon: Layers,
    color: 'from-purple-500 to-pink-600',
    category: 'discover',
    interactive: 'Click any category to see its regulations!',
    metric: { label: 'Substance categories', value: '6' },
  },
  {
    id: 'stats',
    title: 'Live Compliance Metrics',
    description:
      'Real-time pulse of the regulatory landscape — total instruments tracked, recent updates, jurisdiction coverage, and active comment windows.',
    target: '[data-tour="stats"]',
    position: 'bottom',
    icon: BarChart3,
    color: 'from-amber-500 to-orange-600',
    category: 'track',
  },
  {
    id: 'comments',
    title: 'Open Comment Periods',
    description:
      'Never miss a deadline. Track active federal comment periods with countdown timers and submit comments directly from the platform.',
    target: '[data-tour="comment-periods"]',
    position: 'bottom',
    icon: MessageSquare,
    color: 'from-rose-500 to-red-600',
    category: 'act',
    metric: { label: 'Active comment periods', value: 'Live' },
  },
  {
    id: 'map',
    title: 'Interactive State Map',
    description:
      'Visual regulatory intelligence — click any state to explore its laws, pending bills, agency contacts, and compliance status at a glance.',
    target: '[data-tour="state-map"]',
    position: 'top',
    icon: Map,
    color: 'from-cyan-500 to-blue-600',
    category: 'discover',
    interactive: 'Click any state to explore its regulatory landscape!',
    metric: { label: 'States covered', value: '50' },
  },
  {
    id: 'filters',
    title: 'Advanced Filters & Feed',
    description:
      'Drill down by jurisdiction, date range, agency, document type and more. The live regulation feed updates dynamically as you refine.',
    target: '[data-tour="filters-feed"]',
    position: 'top',
    icon: SlidersHorizontal,
    color: 'from-violet-500 to-purple-600',
    category: 'discover',
  },
  {
    id: 'alerts',
    title: 'Smart Alerts & Notifications',
    description:
      'Set up personalized alerts by topic, jurisdiction, or agency. Get notified via email digest or in-app when regulations that matter to you change.',
    target: null,
    position: 'center',
    icon: Bell,
    color: 'from-sky-500 to-blue-600',
    category: 'track',
    features: [
      'Keyword & jurisdiction-based alert rules',
      'Daily or weekly email digests',
      'In-app notification center with read tracking',
      'Comment deadline reminders with countdown',
    ],
  },
  {
    id: 'dashboard',
    title: 'Personal Dashboard',
    description:
      'Your compliance command center — saved regulations, active alerts, recent activity, and quick actions all in one unified view.',
    target: null,
    position: 'center',
    icon: LayoutDashboard,
    color: 'from-blue-600 to-indigo-700',
    category: 'manage',
    features: [
      'Saved regulations & favorites at a glance',
      'Active alert monitor with status indicators',
      'Comment submissions & deadline tracker',
      'Quick navigation to any platform section',
    ],
  },
  {
    id: 'workflows',
    title: 'Compliance Workflows',
    description:
      'Automate your regulatory process — build multi-step workflows, assign tasks, set deadlines, and track progress across your team.',
    target: null,
    position: 'center',
    icon: GitBranch,
    color: 'from-green-500 to-emerald-600',
    category: 'act',
    features: [
      'Drag-and-drop workflow builder',
      'Role-based task assignment',
      'Automated deadline reminders',
      'Progress tracking with team visibility',
    ],
  },
  {
    id: 'checklists',
    title: 'Compliance Checklists',
    description:
      'Pre-built industry templates or custom checklists to systematically manage compliance — share with your team and export for audits.',
    target: null,
    position: 'center',
    icon: ClipboardCheck,
    color: 'from-orange-500 to-amber-600',
    category: 'act',
    features: [
      'Industry-specific compliance templates',
      'Custom checklist builder with drag-and-drop',
      'Team sharing with role permissions',
      'Export to PDF/CSV for audits & reporting',
    ],
  },
  {
    id: 'security',
    title: 'Enterprise Security',
    description:
      'Your data is protected with row-level security, encrypted connections, and SOC 2 compliant infrastructure powered by Supabase.',
    target: null,
    position: 'center',
    icon: Shield,
    color: 'from-slate-600 to-gray-800',
    category: 'manage',
    features: [
      'Row-level security on all compliance data',
      'Encrypted connections & secure authentication',
      'Role-based access control (RBAC)',
      'Audit logging for compliance requirements',
    ],
  },
  {
    id: 'api-analytics',
    title: 'Analytics & API Access',
    description:
      'Unlock trend analysis, forecasting, and a full REST API to integrate compliance intelligence into your existing tools and dashboards.',
    target: null,
    position: 'center',
    icon: Zap,
    color: 'from-pink-500 to-rose-600',
    category: 'manage',
    features: [
      'Regulatory trend analysis & forecasting',
      'Custom compliance reports (CSV, Excel, PDF)',
      'REST API for system integrations',
      'Real-time webhook data feeds',
    ],
  },
  {
    id: 'complete',
    title: "You're Ready to Go!",
    description:
      "You've seen the essentials — now make ThynkFlow your own. Replay this tour anytime from Profile → Preferences.",
    target: null,
    position: 'center',
    icon: PartyPopper,
    color: 'from-yellow-400 to-orange-500',
    features: [
      'Explore the live regulation feed on the main page',
      'Set up your first alert from the Dashboard',
      'Try a compliance workflow for your team',
      'Visit Profile → Preferences to replay this tour',
    ],
  },
];

/** Category metadata for grouping and labels */
export const tourCategories = {
  discover: { label: 'Discover', emoji: '🔍', color: 'text-emerald-600' },
  track: { label: 'Track', emoji: '📡', color: 'text-amber-600' },
  act: { label: 'Take Action', emoji: '⚡', color: 'text-rose-600' },
  manage: { label: 'Manage', emoji: '🛠️', color: 'text-blue-600' },
} as const;
