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
  Zap,
  Leaf,
  Sprout
} from 'lucide-react';

interface PollingLog {
  id: string;
  source_id?: string;
  source?: string;
  status: string;
  records_fetched: number;
  records_created: number;
  started_at?: string;
  timestamp?: string;
  created_at?: string;
  error_message?: string;
  metadata: any;
}

interface NormalizedPollingLog {
  id: string;
  source_id?: string;
  source?: string;
  status: string;
  records_fetched: number;
  records_created: number;
  created_at: string;
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

export const KavaPoller: React.FC = () => {
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<NormalizedPollingLog[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    lastUpdated: null as string | null,
    documentTypes: [] as string[]
  });
  const { toast } = useToast();

  const normalizeLog = (log: PollingLog): NormalizedPollingLog => ({
    ...log,
    created_at: log.started_at || log.timestamp || log.created_at || new Date().toISOString()
  });

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('ingestion_log')
        .select('*')
        .eq('source', 'kava-poller')
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const normalizedLogs = (data || []).map(normalizeLog);
      setLogs(normalizedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchRecentDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('instrument')
        .select('*')
        .eq('product', 'kava')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('instrument')
        .select('document_type, created_at')
        .eq('product', 'kava');

      if (error) throw error;

      const documents = data || [];
      const documentTypes = [...new Set(documents.map(d => d.document_type).filter(Boolean))];
      const lastUpdated = documents.length > 0
        ? documents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0].created_at
        : null;

      setStats({
        totalDocuments: documents.length,
        lastUpdated,
        documentTypes
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchRecentDocuments();
    fetchStats();
  }, []);

  const runPoller = async () => {
    setIsPolling(true);
    setProgress(0);

    try {
      const response = await supabase.functions.invoke('kava-poller', {
        body: {
          sessionId: crypto.randomUUID()
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;

      if (data.success) {
        toast({
          title: "Kava Poller Completed",
          description: `Processed ${data.processedItems} regulatory items`,
        });

        // Refresh data
        await Promise.all([
          fetchLogs(),
          fetchRecentDocuments(),
          fetchStats()
        ]);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error: any) {
      console.error('Poller error:', error);
      toast({
        title: "Poller Failed",
        description: error.message || 'An error occurred while running the poller',
        variant: "destructive",
      });
    } finally {
      setIsPolling(false);
      setProgress(100);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-green-600" />
          Kava Regulatory Poller
        </CardTitle>
        <CardDescription>
          Monitor federal kava regulations from RSS feeds
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">Total Documents</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.lastUpdated ? formatDate(stats.lastUpdated) : 'Never'}</div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{stats.documentTypes.length}</div>
              <p className="text-xs text-muted-foreground">Document Types</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            onClick={runPoller}
            disabled={isPolling}
            className="flex items-center gap-2"
          >
            {isPolling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isPolling ? 'Running...' : 'Run Kava Poller'}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              fetchLogs();
              fetchRecentDocuments();
              fetchStats();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {isPolling && (
          <div className="mb-6">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">Processing kratom regulations...</p>
          </div>
        )}

        <Tabs defaultValue="documents" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="documents">Recent Documents</TabsTrigger>
            <TabsTrigger value="logs">Execution Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="documents" className="space-y-4">
            <ScrollArea className="h-96">
              {recentDocuments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No kava documents found. Run the poller to fetch regulations.
                </div>
              ) : (
                recentDocuments.map((doc) => {
                  const docType = DOCUMENT_TYPE_CONFIG[doc.document_type] || DOCUMENT_TYPE_CONFIG.announcement;
                  const DocIcon = docType.icon;

                  return (
                    <Card key={doc.id} className="mb-3">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <DocIcon className="w-4 h-4" />
                              <Badge variant="secondary" className={docType.color}>
                                {docType.label}
                              </Badge>
                              <Badge variant="outline">{doc.jurisdiction}</Badge>
                            </div>
                            <h4 className="font-medium mb-1">{doc.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                              {doc.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{formatDate(doc.created_at)}</span>
                              {doc.source_url && (
                                <a
                                  href={doc.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 hover:text-blue-600"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Source
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <ScrollArea className="h-96">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No execution logs found.
                </div>
              ) : (
                logs.map((log) => (
                  <Card key={log.id} className="mb-3">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="font-medium capitalize">{log.status}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(log.created_at)}
                        </span>
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Fetched:</span> {log.records_fetched}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Created:</span> {log.records_created}
                        </div>
                      </div>

                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                          {log.error_message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};