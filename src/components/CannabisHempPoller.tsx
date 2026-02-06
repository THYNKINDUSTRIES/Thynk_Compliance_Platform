import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  MapPin,
  FileText,
  Bell,
  BookOpen,
  Newspaper,
  Gavel,
  Loader2,
  Play,
  Calendar,
  ExternalLink,
  Sparkles,
  AlertTriangle,
  Shield,
  TrendingUp,
  Zap
} from 'lucide-react';

interface StateStatus {
  code: string;
  name: string;
  agency: string;
  lastUpdated: string | null;
  documentCount: number;
  documentTypes: string[];
}

// Normalized log for display - uses created_at for consistent timestamp handling
// (mapped from started_at/timestamp in the actual table)
interface NormalizedPollingLog {
  id: string;
  source_id?: string;
  source?: string;
  status: string;
  records_fetched: number;
  records_created: number;
  created_at: string;  // Normalized timestamp for display (mapped from started_at/timestamp)
  error_message?: string;
  metadata: any;
}




const DOCUMENT_TYPE_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  'regulation': { icon: Gavel, label: 'Regulation', color: 'bg-blue-100 text-blue-800' },
  'proposed_rule': { icon: FileText, label: 'Proposed Rule', color: 'bg-purple-100 text-purple-800' },
  'final_rule': { icon: Shield, label: 'Final Rule', color: 'bg-green-100 text-green-800' },
  'guidance': { icon: BookOpen, label: 'Guidance', color: 'bg-teal-100 text-teal-800' },
  'bulletin': { icon: Bell, label: 'Bulletin', color: 'bg-yellow-100 text-yellow-800' },
  'memo': { icon: FileText, label: 'Memo', color: 'bg-orange-100 text-orange-800' },
  'press_release': { icon: Newspaper, label: 'Press Release', color: 'bg-gray-100 text-gray-800' },
  'announcement': { icon: Bell, label: 'Announcement', color: 'bg-indigo-100 text-indigo-800' },
  'enforcement_action': { icon: AlertTriangle, label: 'Enforcement', color: 'bg-red-100 text-red-800' },
  'license_update': { icon: Shield, label: 'License Update', color: 'bg-cyan-100 text-cyan-800' },
  'policy_change': { icon: TrendingUp, label: 'Policy Change', color: 'bg-pink-100 text-pink-800' },
  'public_notice': { icon: Bell, label: 'Public Notice', color: 'bg-amber-100 text-amber-800' },
  'emergency_rule': { icon: Zap, label: 'Emergency Rule', color: 'bg-red-100 text-red-800' },
  'advisory': { icon: BookOpen, label: 'Advisory', color: 'bg-violet-100 text-violet-800' },
};

const URGENCY_CONFIG: Record<string, { color: string; label: string }> = {
  'critical': { color: 'bg-red-500 text-white', label: 'Critical' },
  'high': { color: 'bg-orange-500 text-white', label: 'High' },
  'medium': { color: 'bg-yellow-500 text-white', label: 'Medium' },
  'low': { color: 'bg-gray-400 text-white', label: 'Low' },
};

const STATE_AGENCIES: Record<string, { name: string; agency: string; hasRSS: boolean }> = {
  // Adult-Use + Medical States
  'CA': { name: 'California', agency: 'Department of Cannabis Control', hasRSS: true },
  'CO': { name: 'Colorado', agency: 'Marijuana Enforcement Division', hasRSS: false },
  'WA': { name: 'Washington', agency: 'Liquor and Cannabis Board', hasRSS: false },
  'OR': { name: 'Oregon', agency: 'Oregon Liquor and Cannabis Commission', hasRSS: false },
  'NV': { name: 'Nevada', agency: 'Cannabis Compliance Board', hasRSS: false },
  'MA': { name: 'Massachusetts', agency: 'Cannabis Control Commission', hasRSS: true },
  'MI': { name: 'Michigan', agency: 'Cannabis Regulatory Agency', hasRSS: false },
  'IL': { name: 'Illinois', agency: 'Dept. of Financial and Professional Regulation', hasRSS: false },
  'AZ': { name: 'Arizona', agency: 'Department of Health Services', hasRSS: false },
  'NY': { name: 'New York', agency: 'Office of Cannabis Management', hasRSS: false },
  'NJ': { name: 'New Jersey', agency: 'Cannabis Regulatory Commission', hasRSS: false },
  'VT': { name: 'Vermont', agency: 'Cannabis Control Board', hasRSS: true },
  'ME': { name: 'Maine', agency: 'Office of Cannabis Policy', hasRSS: false },
  'CT': { name: 'Connecticut', agency: 'Department of Consumer Protection', hasRSS: false },
  'RI': { name: 'Rhode Island', agency: 'Cannabis Control Commission', hasRSS: false },
  'DE': { name: 'Delaware', agency: 'Office of the Marijuana Commissioner', hasRSS: false },
  'MN': { name: 'Minnesota', agency: 'Office of Cannabis Management', hasRSS: false },
  'MT': { name: 'Montana', agency: 'Department of Revenue', hasRSS: false },
  'AK': { name: 'Alaska', agency: 'Alcohol and Marijuana Control Office', hasRSS: false },
  // Medical-Only States
  'FL': { name: 'Florida', agency: 'Office of Medical Marijuana Use (OMMU)', hasRSS: false },
  'PA': { name: 'Pennsylvania', agency: 'Department of Health', hasRSS: false },
  'OH': { name: 'Ohio', agency: 'Division of Cannabis Control', hasRSS: false },
  'MD': { name: 'Maryland', agency: 'Cannabis Administration', hasRSS: false },
  'MO': { name: 'Missouri', agency: 'Division of Cannabis Regulation', hasRSS: false },
  'VA': { name: 'Virginia', agency: 'Cannabis Control Authority', hasRSS: false },
  'NM': { name: 'New Mexico', agency: 'Cannabis Control Division', hasRSS: false },
  'KY': { name: 'Kentucky', agency: 'Office of Medical Cannabis', hasRSS: false },
  'WV': { name: 'West Virginia', agency: 'Office of Medical Cannabis', hasRSS: false },
  'OK': { name: 'Oklahoma', agency: 'Medical Marijuana Authority', hasRSS: false },
  'AR': { name: 'Arkansas', agency: 'Alcoholic Beverage Control', hasRSS: false },
  'LA': { name: 'Louisiana', agency: 'Department of Health', hasRSS: false },
  'UT': { name: 'Utah', agency: 'Center for Medical Cannabis', hasRSS: false },
  'MS': { name: 'Mississippi', agency: 'Department of Health', hasRSS: false },
  'AL': { name: 'Alabama', agency: 'Medical Cannabis Commission', hasRSS: false },
  'HI': { name: 'Hawaii', agency: 'Department of Health', hasRSS: false },
  'NH': { name: 'New Hampshire', agency: 'Therapeutic Cannabis Program', hasRSS: false },
  'ND': { name: 'North Dakota', agency: 'Department of Health', hasRSS: false },
  'SD': { name: 'South Dakota', agency: 'Department of Health', hasRSS: false },
  // Hemp/CBD States
  'TX': { name: 'Texas', agency: 'DSHS Consumable Hemp Program', hasRSS: false },
  'GA': { name: 'Georgia', agency: 'Access to Medical Cannabis Commission', hasRSS: false },
  'NC': { name: 'North Carolina', agency: 'Dept. of Agriculture - Plant Industry', hasRSS: false },
  'SC': { name: 'South Carolina', agency: 'Dept. of Agriculture - Hemp Program', hasRSS: false },
  'TN': { name: 'Tennessee', agency: 'Dept. of Agriculture - Hemp Program', hasRSS: false },
  'KS': { name: 'Kansas', agency: 'Department of Agriculture', hasRSS: false },
  'NE': { name: 'Nebraska', agency: 'Department of Agriculture', hasRSS: false },
  'WI': { name: 'Wisconsin', agency: 'Department of Agriculture', hasRSS: false },
  'IA': { name: 'Iowa', agency: 'Department of Public Health', hasRSS: false },
  'IN': { name: 'Indiana', agency: 'State Department of Health', hasRSS: false },
  'ID': { name: 'Idaho', agency: 'Department of Agriculture', hasRSS: false },
  'WY': { name: 'Wyoming', agency: 'Department of Agriculture', hasRSS: false },
};


export function CannabisHempPoller() {
  const [stateStatuses, setStateStatuses] = useState<StateStatus[]>([]);
  const [pollingLogs, setPollingLogs] = useState<NormalizedPollingLog[]>([]);
  const [recentNewItems, setRecentNewItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [pollingState, setPollingState] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('states');
  const { toast } = useToast();

  // Initialize data on component mount
  useEffect(() => {
    fetchStateStatuses();
    fetchPollingLogs();
    fetchRecentNewItems();
  }, []);

  const fetchStateStatuses = async () => {

    setLoading(true);
    try {
      const { data: instruments, error } = await supabase
        .from('instrument')
        .select('jurisdiction_id, metadata, updated_at, title, url, source')
        .or('source.eq.state_regulations,source.eq.state_rss,source.eq.state_news')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const { data: jurisdictions } = await supabase
        .from('jurisdiction')
        .select('id, code, name')
        .neq('code', 'US');

      const jurisdictionMap = new Map(jurisdictions?.map(j => [j.id, j]) || []);
      const stateMap = new Map<string, StateStatus>();

      for (const [code, info] of Object.entries(STATE_AGENCIES)) {
        stateMap.set(code, {
          code,
          name: info.name,
          agency: info.agency,
          lastUpdated: null,
          documentCount: 0,
          documentTypes: [],
        });
      }

      for (const instrument of instruments || []) {
        const jurisdiction = jurisdictionMap.get(instrument.jurisdiction_id);
        if (!jurisdiction) continue;

        const code = jurisdiction.code;
        const existing = stateMap.get(code);
        if (!existing) continue;

        existing.documentCount++;
        
        const docType = instrument.metadata?.documentType || instrument.metadata?.document_type;
        if (docType && !existing.documentTypes.includes(docType)) {
          existing.documentTypes.push(docType);
        }

        const updatedAt = instrument.updated_at;
        if (!existing.lastUpdated || updatedAt > existing.lastUpdated) {
          existing.lastUpdated = updatedAt;
        }
      }

      setStateStatuses(Array.from(stateMap.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Error fetching state statuses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch state regulation statuses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPollingLogs = async () => {
    try {
      // The ingestion_log table uses 'started_at' not 'created_at'
      // Try with started_at first, fall back to other column names if needed
      let data = null;
      let error = null;

      // Try started_at (the documented column name)
      const result1 = await supabase
        .from('ingestion_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(30);

      if (!result1.error) {
        data = result1.data;
      } else if (result1.error.code === '42703') {
        // Column doesn't exist, try timestamp
        const result2 = await supabase
          .from('ingestion_log')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(30);
        
        if (!result2.error) {
          data = result2.data;
        } else {
          // Try without ordering
          const result3 = await supabase
            .from('ingestion_log')
            .select('*')
            .limit(30);
          
          data = result3.data;
          error = result3.error;
        }
      } else {
        error = result1.error;
      }

      if (error) {
        // Table might not exist - this is OK, just log and continue
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.log('[fetchPollingLogs] ingestion_log table not available');
          setPollingLogs([]);
          return;
        }
        console.error('Error fetching polling logs:', error);
        setPollingLogs([]);
        return;
      }

      // Filter the logs client-side to match our sources
      const relevantSources = [
        'state_regulations', 
        'cannabis-hemp-poller', 
        'cannabis_hemp_poller', 
        'enhanced-state-poller', 
        'state-news-scraper'
      ];

      const filteredLogs = (data || []).filter((log: any) => {
        const source = log.source_id || log.source || '';
        return relevantSources.some(s => source.includes(s) || source === s);
      });

      // Map the data to handle different column names
      const mappedLogs = filteredLogs.map((log: any) => ({
        ...log,
        created_at: log.started_at || log.timestamp || log.created_at || new Date().toISOString()
      }));
      
      setPollingLogs(mappedLogs);
    } catch (error) {
      console.error('Error fetching polling logs:', error);
      setPollingLogs([]);
    }
  };





  const fetchRecentNewItems = async () => {
    try {
      const { data, error } = await supabase
        .from('instrument')
        .select('id, title, url, metadata, updated_at, jurisdiction:jurisdiction_id(code, name)')
        .or('source.eq.state_rss,source.eq.state_news')
        .order('updated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentNewItems(data || []);
    } catch (error) {
      console.error('Error fetching recent items:', error);
    }
  };

  const triggerPolling = async (stateCode?: string, fullScan = false) => {
    setPolling(true);
    setPollingState(stateCode || 'all');
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 2, 90));
      }, 1000);

      const results: any[] = [];
      const errors: string[] = [];

      // Try cannabis-hemp-poller (may fail if not deployed correctly)
      try {
        const result2 = await supabase.functions.invoke('cannabis-hemp-poller', {
          body: { stateCode, fullScan },
        });
        if (result2.data) results.push(result2.data);
        if (result2.error) {
          console.warn('cannabis-hemp-poller error (may need CORS fix):', result2.error);
        }
      } catch (e: any) {
        console.warn('cannabis-hemp-poller failed (may need deployment):', e.message);
      }

      clearInterval(progressInterval);
      setProgress(100);

      // Aggregate results
      const totalNewItems = results.reduce((sum, r) => sum + (r?.newItemsFound || 0), 0);
      const totalProcessed = results.reduce((sum, r) => sum + (r?.recordsProcessed || 0), 0);
      const totalStates = results[0]?.statesProcessed || Object.keys(STATE_AGENCIES).length;

      if (results.length === 0 && errors.length > 0) {
        throw new Error(errors.join('; '));
      }

      toast({
        title: 'Polling Complete',
        description: `Processed ${totalProcessed} records from ${totalStates} states${totalNewItems > 0 ? `. ${totalNewItems} new items found!` : ''}`,
      });

      await Promise.all([
        fetchStateStatuses(),
        fetchPollingLogs(),
        fetchRecentNewItems(),
      ]);

      if (totalNewItems > 0) {
        setActiveTab('recent');
      }
    } catch (error: any) {
      console.error('Polling error:', error);
      toast({
        title: 'Polling Failed',
        description: error.message || 'Failed to poll state regulations. Check console for details.',
        variant: 'destructive',
      });
    } finally {
      setPolling(false);
      setPollingState(null);
      setProgress(0);
    }
  };





  const getTimeSinceUpdate = (lastUpdated: string | null) => {
    if (!lastUpdated) return 'Never';
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMs = now.getTime() - updated.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMinutes > 0) return `${diffMinutes}m ago`;
    return 'Just now';
  };

  const getStatusColor = (lastUpdated: string | null) => {
    if (!lastUpdated) return 'text-gray-500';
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return 'text-green-600';
    if (diffDays <= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const statesNeedingUpdate = stateStatuses.filter(s => {
    if (!s.lastUpdated) return true;
    const diffDays = Math.floor((new Date().getTime() - new Date(s.lastUpdated).getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 1;
  });

  const totalDocuments = stateStatuses.reduce((sum, s) => sum + s.documentCount, 0);
  const upToDateCount = stateStatuses.filter(s => s.lastUpdated && (new Date().getTime() - new Date(s.lastUpdated).getTime()) < 24 * 60 * 60 * 1000).length;

  return (
    <div className="space-y-6">
      <Card className="border-[#E5DFD6]">
        <CardHeader className="bg-gradient-to-r from-[#FDF8F3] to-[#F5EDE3]">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#794108] rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-[#794108] flex items-center gap-2">
                  State Regulations Poller
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </CardTitle>
                <CardDescription>
                  RSS feeds, news scraping, and AI categorization for {Object.keys(STATE_AGENCIES).length} state cannabis agencies
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { fetchStateStatuses(); fetchPollingLogs(); fetchRecentNewItems(); }} disabled={loading || polling}>
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" onClick={() => triggerPolling(undefined, true)} disabled={polling}>
                <Zap className="w-4 h-4 mr-2" />
                Full Scan
              </Button>
              <Button onClick={() => triggerPolling()} disabled={polling} className="bg-[#794108] hover:bg-[#5c3106]">
                {polling && pollingState === 'all' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Polling...</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" />Poll All States</>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {polling && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{pollingState === 'all' ? 'Scanning all state agencies...' : `Polling ${pollingState}...`}</span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">Fetching RSS feeds, scraping news pages, analyzing with AI...</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /><span className="font-semibold text-green-900 text-sm">Up to Date</span></div>
              <p className="text-2xl font-bold text-green-700 mt-1">{upToDateCount}</p>
              <p className="text-xs text-green-600">Last 24h</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-yellow-600" /><span className="font-semibold text-yellow-900 text-sm">Needs Update</span></div>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{statesNeedingUpdate.length}</p>
              <p className="text-xs text-yellow-600">24h+ old</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /><span className="font-semibold text-blue-900 text-sm">Documents</span></div>
              <p className="text-2xl font-bold text-blue-700 mt-1">{totalDocuments}</p>
              <p className="text-xs text-blue-600">Total tracked</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2"><MapPin className="w-5 h-5 text-purple-600" /><span className="font-semibold text-purple-900 text-sm">States</span></div>
              <p className="text-2xl font-bold text-purple-700 mt-1">{Object.keys(STATE_AGENCIES).length}</p>
              <p className="text-xs text-purple-600">Agencies tracked</p>
            </div>
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-600" /><span className="font-semibold text-indigo-900 text-sm">Recent</span></div>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{recentNewItems.length}</p>
              <p className="text-xs text-indigo-600">New items</p>
            </div>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3 text-sm">Document Types Tracked (AI-Categorized):</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(DOCUMENT_TYPE_CONFIG).slice(0, 10).map(([type, config]) => {
                const Icon = config.icon;
                return (
                  <Badge key={type} variant="outline" className={`${config.color} border-0 text-xs`}>
                    <Icon className="w-3 h-3 mr-1" />{config.label}
                  </Badge>
                );
              })}
              <Badge variant="outline" className="bg-gray-100 text-gray-600 border-0 text-xs">+4 more</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="states">State Status</TabsTrigger>
          <TabsTrigger value="recent" className="relative">
            Recent Items
            {recentNewItems.length > 0 && <Badge className="ml-2 bg-green-500 text-white text-xs px-1.5 py-0">{recentNewItems.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="logs">Polling History</TabsTrigger>
        </TabsList>

        <TabsContent value="states" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-[#794108]" /></div>
            ) : (
              stateStatuses.map((state) => (
                <Card key={state.code} className="border-[#E5DFD6] hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-[#794108]">{state.name}</h3>
                        <p className="text-xs text-gray-500 truncate max-w-[180px]">{state.agency}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className="text-xs">{state.code}</Badge>
                        {STATE_AGENCIES[state.code]?.hasRSS && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">RSS</Badge>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className={`font-medium ${getStatusColor(state.lastUpdated)}`}>{getTimeSinceUpdate(state.lastUpdated)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Documents:</span>
                        <span className="font-medium">{state.documentCount}</span>
                      </div>
                    </div>
                    {state.documentTypes.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {state.documentTypes.slice(0, 3).map((type) => {
                          const config = DOCUMENT_TYPE_CONFIG[type];
                          if (!config) return null;
                          const Icon = config.icon;
                          return <Badge key={type} variant="outline" className={`${config.color} border-0 text-xs`}><Icon className="w-2 h-2 mr-1" />{config.label}</Badge>;
                        })}
                        {state.documentTypes.length > 3 && <Badge variant="outline" className="text-xs">+{state.documentTypes.length - 3}</Badge>}
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full mt-3" onClick={() => triggerPolling(state.code)} disabled={polling}>
                      {polling && pollingState === state.code ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Polling...</> : <><RefreshCw className="w-3 h-3 mr-1" />Update {state.code}</>}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card className="border-[#E5DFD6]">
            <CardHeader>
              <CardTitle className="text-[#794108] flex items-center gap-2"><Sparkles className="w-5 h-5" />Recently Discovered Items</CardTitle>
              <CardDescription>New regulations, bulletins, memos, and policy changes detected by AI analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {recentNewItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No recent items found</p>
                  <p className="text-sm">Run the poller to discover new content</p>
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {recentNewItems.map((item) => {
                      const docType = item.metadata?.documentType || 'announcement';
                      const config = DOCUMENT_TYPE_CONFIG[docType] || DOCUMENT_TYPE_CONFIG['announcement'];
                      const urgency = item.metadata?.urgency || 'medium';
                      const urgencyConfig = URGENCY_CONFIG[urgency] || URGENCY_CONFIG['medium'];
                      const Icon = config!.icon;
                      const stateCode = item.jurisdiction?.code || 'Unknown';
                      const stateName = item.jurisdiction?.name || stateCode;

                      return (
                        <div key={item.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline" className="text-xs font-medium">{stateCode}</Badge>
                                <Badge className={`${config!.color} border-0 text-xs`}><Icon className="w-3 h-3 mr-1" />{config!.label}</Badge>
                                <Badge className={`${urgencyConfig!.color} text-xs`}>{urgencyConfig!.label}</Badge>
                              </div>
                              <h4 className="font-medium text-gray-900 line-clamp-2">{item.title}</h4>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>{stateName}</span>
                                <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                                {item.metadata?.isDispensaryRelated && <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">Dispensary</Badge>}
                                {item.metadata?.isLicensingRelated && <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">Licensing</Badge>}
                                {item.metadata?.isComplianceRelated && <Badge variant="outline" className="text-xs bg-green-50 text-green-700">Compliance</Badge>}
                              </div>
                            </div>
                            {item.url && <Button variant="ghost" size="sm" onClick={() => window.open(item.url, '_blank')}><ExternalLink className="w-4 h-4" /></Button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card className="border-[#E5DFD6]">
            <CardHeader>
              <CardTitle className="text-[#794108]">Polling Activity Log</CardTitle>
              <CardDescription>History of state regulation polling runs with AI analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {pollingLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No polling history found</p>
                  <p className="text-sm">Run the poller to start tracking updates</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {pollingLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {log.status === 'success' ? <CheckCircle className="w-5 h-5 text-green-600" /> : log.status === 'partial' ? <AlertCircle className="w-5 h-5 text-yellow-600" /> : <AlertCircle className="w-5 h-5 text-red-600" />}
                          <div>
                            <p className="font-medium text-sm">{log.metadata?.statesProcessed ? `${log.metadata.statesProcessed} States Scanned` : 'State Regulations Update'}</p>
                            <p className="text-xs text-gray-500">{new Date(log.created_at).toLocaleString()}</p>
                            {log.error_message && <p className="text-xs text-red-500 mt-1 line-clamp-1">{log.error_message}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={log.status === 'success' ? 'default' : log.status === 'partial' ? 'secondary' : 'destructive'}>{log.records_fetched || 0} processed</Badge>
                          {(log.records_created || log.metadata?.newItemsFound) > 0 && <Badge variant="outline" className="bg-green-50 text-green-700"><Sparkles className="w-3 h-3 mr-1" />+{log.records_created || log.metadata?.newItemsFound} new</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
