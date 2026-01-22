import React, { useState, useEffect, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Filter, 
  FileText, 
  Users, 
  Vote, 
  History, 
  ExternalLink, 
  Calendar,
  Building2,
  Gavel,
  TrendingUp,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Types
interface Sponsor {
  name?: string;
  party?: string;
  role?: string;
  district?: string;
  person_id?: number;
  sponsor_type_id?: number;
}

interface VoteRecord {
  date?: string;
  desc?: string;
  yea?: number;
  nay?: number;
  absent?: number;
  passed?: boolean;
  chamber?: string;
}

interface HistoryItem {
  date?: string;
  action?: string;
  chamber?: string;
  importance?: number;
}

interface LegislatureBill {
  id: string;
  external_id: string;
  bill_number: string;
  title: string;
  description: string;
  state_code: string;
  session: string;
  session_year: number;
  status: string;
  status_date: string;
  last_action: string;
  last_action_date: string;
  chamber: string;
  bill_type: string;
  sponsors: Sponsor[];
  cosponsors: Sponsor[];
  subjects: string[];
  votes: VoteRecord[];
  history: HistoryItem[];
  amendments: any[];
  source: string;
  source_url: string;
  full_text_url: string;
  is_cannabis_related: boolean;
  cannabis_keywords: string[];
  created_at: string;
  updated_at: string;
  metadata: any;
}

// US States for filter
const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }
];

// Bill statuses
const BILL_STATUSES = [
  { value: 'introduced', label: 'Introduced', color: 'bg-blue-100 text-blue-800' },
  { value: 'engrossed', label: 'Engrossed', color: 'bg-purple-100 text-purple-800' },
  { value: 'enrolled', label: 'Enrolled', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'passed', label: 'Passed', color: 'bg-green-100 text-green-800' },
  { value: 'vetoed', label: 'Vetoed', color: 'bg-red-100 text-red-800' },
  { value: 'failed', label: 'Failed', color: 'bg-gray-100 text-gray-800' },
  { value: 'chaptered', label: 'Chaptered', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'refer', label: 'Referred', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'draft', label: 'Draft', color: 'bg-slate-100 text-slate-800' }
];

// Chambers
const CHAMBERS = [
  { value: 'house', label: 'House' },
  { value: 'senate', label: 'Senate' },
  { value: 'joint', label: 'Joint' }
];

// Session years (last 5 years)
const currentYear = new Date().getFullYear();
const SESSION_YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

// Helper functions
const getStatusBadge = (status: string) => {
  const statusConfig = BILL_STATUSES.find(s => s.value === status?.toLowerCase());
  return statusConfig || { value: status, label: status, color: 'bg-gray-100 text-gray-800' };
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
};

const getStateName = (code: string) => {
  return US_STATES.find(s => s.code === code)?.name || code;
};

// Bill Card Component
const BillCard: React.FC<{ bill: LegislatureBill; onClick: () => void }> = ({ bill, onClick }) => {
  const statusConfig = getStatusBadge(bill.status);
  
  return (
    <Card 
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 hover:border-l-blue-500"
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="font-mono text-sm">
                {bill.bill_number}
              </Badge>
              <Badge className={statusConfig.color}>
                {statusConfig.label}
              </Badge>
              <Badge variant="secondary" className="capitalize">
                {bill.chamber}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
              {bill.title}
            </h3>
            
            {bill.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {bill.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {getStateName(bill.state_code)}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {bill.session_year} Session
              </span>
              {bill.sponsors?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {bill.sponsors.length} Sponsor{bill.sponsors.length !== 1 ? 's' : ''}
                </span>
              )}
              {bill.votes?.length > 0 && (
                <span className="flex items-center gap-1">
                  <Vote className="w-4 h-4" />
                  {bill.votes.length} Vote{bill.votes.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            {bill.cannabis_keywords?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {bill.cannabis_keywords.slice(0, 5).map((keyword, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    {keyword}
                  </Badge>
                ))}
                {bill.cannabis_keywords.length > 5 && (
                  <Badge variant="outline" className="text-xs">
                    +{bill.cannabis_keywords.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="text-right text-sm text-gray-500 shrink-0">
            <div className="flex items-center gap-1 justify-end mb-1">
              <Clock className="w-4 h-4" />
              {formatDate(bill.last_action_date)}
            </div>
            <div className="text-xs text-gray-400">
              Last Action
            </div>
          </div>
        </div>
        
        {bill.last_action && (
          <div className="mt-3 pt-3 border-t text-sm text-gray-600 line-clamp-1">
            <span className="font-medium">Latest: </span>
            {bill.last_action}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Bill Detail Modal Component
const BillDetailModal: React.FC<{ 
  bill: LegislatureBill | null; 
  open: boolean; 
  onClose: () => void 
}> = ({ bill, open, onClose }) => {
  if (!bill) return null;
  
  const statusConfig = getStatusBadge(bill.status);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="font-mono text-lg px-3 py-1">
              {bill.bill_number}
            </Badge>
            <Badge className={statusConfig.color}>
              {statusConfig.label}
            </Badge>
          </div>
          <DialogTitle className="text-xl leading-tight">
            {bill.title}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-4 mt-2">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {getStateName(bill.state_code)}
            </span>
            <span className="flex items-center gap-1">
              <Building2 className="w-4 h-4" />
              {bill.chamber?.charAt(0).toUpperCase() + bill.chamber?.slice(1)}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {bill.session || `${bill.session_year} Session`}
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
            <TabsTrigger value="votes">Votes</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="overview" className="m-0 space-y-4">
              {bill.description && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{bill.description}</p>
                </div>
              )}
              
              {bill.last_action && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Last Action</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-700">{bill.last_action}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(bill.last_action_date)}
                    </p>
                  </div>
                </div>
              )}
              
              {bill.subjects?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Subjects</h4>
                  <div className="flex flex-wrap gap-2">
                    {bill.subjects.map((subject, idx) => (
                      <Badge key={idx} variant="secondary">
                        {typeof subject === 'string' ? subject : subject.subject_name || JSON.stringify(subject)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {bill.cannabis_keywords?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Cannabis Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {bill.cannabis_keywords.map((keyword, idx) => (
                      <Badge key={idx} className="bg-green-100 text-green-800">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                {bill.source_url && (
                  <Button variant="outline" asChild>
                    <a href={bill.source_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Source
                    </a>
                  </Button>
                )}
                {bill.full_text_url && (
                  <Button variant="outline" asChild>
                    <a href={bill.full_text_url} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" />
                      Full Text
                    </a>
                  </Button>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="sponsors" className="m-0">
              {bill.sponsors?.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Primary Sponsors</h4>
                  <div className="grid gap-3">
                    {bill.sponsors.map((sponsor, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">{sponsor.name || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">
                              {[sponsor.party, sponsor.role, sponsor.district].filter(Boolean).join(' • ')}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No sponsor information available</p>
                </div>
              )}
              
              {bill.cosponsors?.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h4 className="font-semibold text-gray-900">Co-Sponsors ({bill.cosponsors.length})</h4>
                  <div className="grid gap-2">
                    {bill.cosponsors.map((sponsor, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{sponsor.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">
                            {[sponsor.party, sponsor.district].filter(Boolean).join(' • ')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="votes" className="m-0">
              {bill.votes?.length > 0 ? (
                <div className="space-y-4">
                  {bill.votes.map((vote, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{vote.desc || 'Vote'}</p>
                            <p className="text-sm text-gray-500">
                              {formatDate(vote.date)} {vote.chamber && `• ${vote.chamber}`}
                            </p>
                          </div>
                          {vote.passed !== undefined && (
                            <Badge className={vote.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {vote.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-6">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-700">{vote.yea || 0}</span>
                            <span className="text-gray-500">Yea</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <span className="font-semibold text-red-700">{vote.nay || 0}</span>
                            <span className="text-gray-500">Nay</span>
                          </div>
                          {vote.absent !== undefined && vote.absent > 0 && (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-gray-400" />
                              <span className="font-semibold text-gray-600">{vote.absent}</span>
                              <span className="text-gray-500">Absent</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Vote className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No voting records available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="m-0">
              {bill.history?.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  <div className="space-y-4">
                    {bill.history.map((item, idx) => (
                      <div key={idx} className="relative pl-10">
                        <div className="absolute left-2 w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
                        <Card>
                          <CardContent className="p-3">
                            <p className="text-sm font-medium text-gray-900">
                              {item.action || 'Action'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(item.date)} {item.chamber && `• ${item.chamber}`}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No history available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="details" className="m-0 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Bill Type</p>
                  <p className="font-medium capitalize">{bill.bill_type || 'Bill'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Source</p>
                  <p className="font-medium capitalize">{bill.source}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Status Date</p>
                  <p className="font-medium">{formatDate(bill.status_date)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Last Updated</p>
                  <p className="font-medium">{formatDate(bill.updated_at)}</p>
                </div>
              </div>
              
              {bill.amendments?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Amendments ({bill.amendments.length})</h4>
                  <div className="space-y-2">
                    {bill.amendments.map((amendment, idx) => (
                      <Card key={idx}>
                        <CardContent className="p-3">
                          <p className="text-sm">{amendment.title || amendment.description || `Amendment ${idx + 1}`}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500 mb-2">External ID</p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded">{bill.external_id}</code>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// Main Component
const LegislatureBills: React.FC = () => {
  const { toast } = useToast();
  const [bills, setBills] = useState<LegislatureBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBill, setSelectedBill] = useState<LegislatureBill | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chamberFilter, setChamberFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('last_action_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    introduced: 0,
    passed: 0,
    failed: 0,
    statesWithBills: 0
  });

  // Fetch bills from database
  const fetchBills = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('legislature_bills')
        .select('*')
        .eq('is_cannabis_related', true)
        .order(sortBy, { ascending: sortOrder === 'asc' });
      
      if (stateFilter !== 'all') {
        query = query.eq('state_code', stateFilter);
      }
      
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      if (chamberFilter !== 'all') {
        query = query.eq('chamber', chamberFilter);
      }
      
      if (yearFilter !== 'all') {
        query = query.eq('session_year', parseInt(yearFilter));
      }
      
      const { data, error } = await query.limit(500);
      
      if (error) throw error;
      
      setBills(data || []);
      
      // Calculate stats
      const allBills = data || [];
      const uniqueStates = new Set(allBills.map(b => b.state_code));
      setStats({
        total: allBills.length,
        introduced: allBills.filter(b => b.status === 'introduced').length,
        passed: allBills.filter(b => b.status === 'passed' || b.status === 'chaptered').length,
        failed: allBills.filter(b => b.status === 'failed' || b.status === 'vetoed').length,
        statesWithBills: uniqueStates.size
      });
      
    } catch (error: any) {
      console.error('Error fetching bills:', error);
      toast({
        title: 'Error loading bills',
        description: error.message || 'Failed to fetch legislature bills',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger poller refresh
  const triggerRefresh = async () => {
    try {
      setRefreshing(true);
      
      const { data, error } = await supabase.functions.invoke('state-legislature-poller', {
        body: {
          states: stateFilter !== 'all' ? [stateFilter] : undefined,
          keywords: ['cannabis', 'marijuana', 'hemp']
        }
      });
      
      if (error) throw error;
      
      toast({
        title: 'Refresh initiated',
        description: `Polling ${data?.statesProcessed || 'multiple'} states for new bills...`
      });
      
      // Refetch after a delay
      setTimeout(fetchBills, 3000);
      
    } catch (error: any) {
      console.error('Error triggering refresh:', error);
      toast({
        title: 'Refresh failed',
        description: error.message || 'Failed to trigger bill refresh',
        variant: 'destructive'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Filter bills by search query
  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return bills;
    
    const query = searchQuery.toLowerCase();
    return bills.filter(bill => 
      bill.bill_number.toLowerCase().includes(query) ||
      bill.title.toLowerCase().includes(query) ||
      bill.description?.toLowerCase().includes(query) ||
      bill.cannabis_keywords?.some(k => k.toLowerCase().includes(query))
    );
  }, [bills, searchQuery]);

  // Export bills to CSV
  const exportToCSV = () => {
    const headers = ['Bill Number', 'Title', 'State', 'Status', 'Chamber', 'Session Year', 'Last Action', 'Last Action Date', 'Source URL'];
    const rows = filteredBills.map(bill => [
      bill.bill_number,
      `"${bill.title.replace(/"/g, '""')}"`,
      bill.state_code,
      bill.status,
      bill.chamber,
      bill.session_year,
      `"${(bill.last_action || '').replace(/"/g, '""')}"`,
      bill.last_action_date,
      bill.source_url || ''
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legislature-bills-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export complete',
      description: `Exported ${filteredBills.length} bills to CSV`
    });
  };

  useEffect(() => {
    fetchBills();
  }, [stateFilter, statusFilter, chamberFilter, yearFilter, sortBy, sortOrder]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Gavel className="w-8 h-8 text-blue-600" />
                Legislature Bills
              </h1>
              <p className="text-gray-600 mt-2">
                Track cannabis-related legislation across all 50 states
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={exportToCSV}
                disabled={filteredBills.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button 
                onClick={triggerRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh Data
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="w-6 h-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Bills</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{stats.introduced}</p>
              <p className="text-sm text-gray-500">Introduced</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats.passed}</p>
              <p className="text-sm text-gray-500">Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold">{stats.failed}</p>
              <p className="text-sm text-gray-500">Failed/Vetoed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <MapPin className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
              <p className="text-2xl font-bold">{stats.statesWithBills}</p>
              <p className="text-sm text-gray-500">States</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search bills by number, title, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </Button>
            </div>
            
            {showFilters && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">State</label>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {US_STATES.map(state => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {BILL_STATUSES.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Chamber</label>
                  <Select value={chamberFilter} onValueChange={setChamberFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Chambers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Chambers</SelectItem>
                      {CHAMBERS.map(chamber => (
                        <SelectItem key={chamber.value} value={chamber.value}>
                          {chamber.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Session Year</label>
                  <Select value={yearFilter} onValueChange={setYearFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Years" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Years</SelectItem>
                      {SESSION_YEARS.map(year => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Sort By</label>
                  <Select value={`${sortBy}-${sortOrder}`} onValueChange={(val) => {
                    const [field, order] = val.split('-');
                    setSortBy(field);
                    setSortOrder(order as 'asc' | 'desc');
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last_action_date-desc">Latest Action</SelectItem>
                      <SelectItem value="last_action_date-asc">Oldest Action</SelectItem>
                      <SelectItem value="created_at-desc">Recently Added</SelectItem>
                      <SelectItem value="bill_number-asc">Bill Number (A-Z)</SelectItem>
                      <SelectItem value="state_code-asc">State (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bills List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Card key={i}>
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex gap-2 mb-3">
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                    <Skeleton className="h-10 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredBills.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bills Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || stateFilter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your filters or search query'
                  : 'No cannabis-related bills have been tracked yet'}
              </p>
              <Button onClick={triggerRefresh} disabled={refreshing}>
                {refreshing ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Fetch Bills Now
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-gray-500 px-1">
              <span>Showing {filteredBills.length} bill{filteredBills.length !== 1 ? 's' : ''}</span>
            </div>
            
            {filteredBills.map(bill => (
              <BillCard 
                key={bill.id} 
                bill={bill} 
                onClick={() => setSelectedBill(bill)}
              />
            ))}
          </div>
        )}
      </main>
      
      <Footer />
      
      {/* Bill Detail Modal */}
      <BillDetailModal 
        bill={selectedBill}
        open={!!selectedBill}
        onClose={() => setSelectedBill(null)}
      />
    </div>
  );
};

export default LegislatureBills;
