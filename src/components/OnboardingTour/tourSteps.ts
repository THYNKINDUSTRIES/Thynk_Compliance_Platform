import {
  Sparkles, Search, Layers, BarChart3, MessageSquare, Map,
  SlidersHorizontal, LayoutDashboard, GitBranch, ClipboardCheck,
  Zap, PartyPopper
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
}

export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ThynkFlow!',
    description:
      "Let's take a quick tour of the compliance platform. You can skip or come back to this tour anytime from your Profile settings.",
    target: null,
    position: 'center',
    icon: Sparkles,
    color: 'from-blue-500 to-indigo-600',
    features: [
      'Track regulations across 50 states and federal agencies',
      'Monitor cannabis, hemp, kratom, kava, nicotine & psychedelics',
      'AI-powered analysis and real-time alerts',
      'Compliance workflows and checklists',
    ],
  },
  {
    id: 'search',
    title: 'Search Regulations',
    description:
      'Find any regulation by keyword, citation, agency name, or topic. Results update instantly as you type.',
    target: '[data-tour="search"]',
    position: 'bottom',
    icon: Search,
    color: 'from-emerald-500 to-teal-600',
    interactive: 'Try typing a keyword like "cannabis" or "FDA"!',
  },
  {
    id: 'products',
    title: 'Filter by Substance',
    description:
      'Quickly filter the entire platform by substance type. Click any category to see only relevant regulations.',
    target: '[data-tour="product-categories"]',
    position: 'bottom',
    icon: Layers,
    color: 'from-purple-500 to-pink-600',
    interactive: 'Click a category to filter regulations!',
  },
  {
    id: 'stats',
    title: 'Compliance at a Glance',
    description:
      'Get real-time metrics — total regulations tracked, recent updates, jurisdiction coverage, and active comment periods.',
    target: '[data-tour="stats"]',
    position: 'bottom',
    icon: BarChart3,
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'comments',
    title: 'Open Comment Periods',
    description:
      'Track active federal comment periods with deadlines. Submit comments directly and never miss an opportunity to weigh in.',
    target: '[data-tour="comment-periods"]',
    position: 'bottom',
    icon: MessageSquare,
    color: 'from-rose-500 to-red-600',
  },
  {
    id: 'map',
    title: 'Interactive State Map',
    description:
      'Explore regulations state by state. Click any state to view its regulatory landscape, active legislation, and agency contacts.',
    target: '[data-tour="state-map"]',
    position: 'top',
    icon: Map,
    color: 'from-cyan-500 to-blue-600',
    interactive: 'Click any state to explore its regulations!',
  },
  {
    id: 'filters',
    title: 'Filter & Browse',
    description:
      'Narrow results by jurisdiction, date, agency, and more. The live regulation feed updates as you apply filters.',
    target: '[data-tour="filters-feed"]',
    position: 'top',
    icon: SlidersHorizontal,
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'dashboard',
    title: 'Your Personal Dashboard',
    description:
      'Your command center for compliance. Track saved regulations, manage alerts, and monitor your compliance activity — all in one place.',
    target: null,
    position: 'center',
    icon: LayoutDashboard,
    color: 'from-blue-600 to-indigo-700',
    features: [
      'View saved regulations and favorites',
      'Monitor active alerts and notifications',
      'Track comment submissions and deadlines',
      'Quick access from the navigation menu',
    ],
  },
  {
    id: 'workflows',
    title: 'Compliance Workflows',
    description:
      'Build custom workflows to automate regulatory tracking, assign tasks to your team, and ensure nothing falls through the cracks.',
    target: null,
    position: 'center',
    icon: GitBranch,
    color: 'from-green-500 to-emerald-600',
    features: [
      'Create multi-step compliance workflows',
      'Assign tasks to team members',
      'Set deadlines and automated reminders',
      'Track progress in real-time',
    ],
  },
  {
    id: 'checklists',
    title: 'Compliance Checklists',
    description:
      'Use pre-built templates or create custom checklists to manage compliance requirements systematically.',
    target: null,
    position: 'center',
    icon: ClipboardCheck,
    color: 'from-orange-500 to-amber-600',
    features: [
      'Industry-specific compliance templates',
      'Custom checklist creation',
      'Progress tracking and team sharing',
      'Export reports for audits',
    ],
  },
  {
    id: 'api-analytics',
    title: 'Analytics & API',
    description:
      'Unlock powerful analytics dashboards and API access to integrate compliance data into your existing systems.',
    target: null,
    position: 'center',
    icon: Zap,
    color: 'from-pink-500 to-rose-600',
    features: [
      'Regulatory trend analysis and forecasting',
      'Custom compliance reports and CSV/PDF exports',
      'REST API for system integrations',
      'Real-time data feeds',
    ],
  },
  {
    id: 'complete',
    title: "You're All Set!",
    description:
      "You now know the essentials of ThynkFlow. Dive in and start exploring — you can replay this tour anytime from Profile → Preferences.",
    target: null,
    position: 'center',
    icon: PartyPopper,
    color: 'from-yellow-400 to-orange-500',
    features: [
      'Browse the regulation feed on the main page',
      'Set up your first alert from the Dashboard',
      'Create a compliance workflow for your team',
      'Visit Profile → Preferences to replay this tour',
    ],
  },
];
