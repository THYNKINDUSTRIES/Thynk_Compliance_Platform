import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Terminal,
  Database,
  Clock,
  FileText,
  Leaf,
  Zap,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

interface TestResult {
  timestamp: string;
  functionName: string;
  status: 'success' | 'error' | 'pending';
  duration?: number;
  response?: any;
  error?: string;
}

interface IngestionLogEntry {
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

export function PollerTestPanel() {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [ingestionLogs, setIngestionLogs] = useState<IngestionLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Fetch ingestion logs on mount
  useEffect(() => {
    fetchIngestionLogs();
  }, []);

  const fetchIngestionLogs = async () => {
    setLoadingLogs(true);
    try {
      // Try with started_at first
      let result = await supabase
        .from('ingestion_log')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (result.error && result.error.code === '42703') {
        // Column doesn't exist, try timestamp
        result = await supabase
          .from('ingestion_log')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(20);
      }

      if (result.error) {
        if (result.error.code === '42P01') {
          console.log('ingestion_log table does not exist');
          setIngestionLogs([]);
          return;
        }
        throw result.error;
      }

      // Filter for cannabis-hemp-poller related logs
      const relevantLogs = (result.data || []).filter((log: any) => {
        const source = log.source_id || log.source || '';
        return source.includes('cannabis') || 
               source.includes('hemp') || 
               source.includes('state') ||
               source.includes('CA');
      });

      setIngestionLogs(relevantLogs);
    } catch (error) {
      console.error('Error fetching ingestion logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev].slice(0, 20));
  };

  const testEdgeFunction = async (functionName: string, stateCode: string = 'CA') => {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    addTestResult({
      timestamp,
      functionName,
      status: 'pending',
    });

    try {
      console.log(`[TEST] Invoking ${functionName} for state: ${stateCode}`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { stateCode, fullScan: false, test: true },
      });

      const duration = Date.now() - startTime;

      if (error) {
        console.error(`[TEST] ${functionName} error:`, error);
        addTestResult({
          timestamp,
          functionName,
          status: 'error',
          duration,
          error: error.message || JSON.stringify(error),
        });
        return { success: false, error };
      }

      console.log(`[TEST] ${functionName} response:`, data);
      addTestResult({
        timestamp,
        functionName,
        status: 'success',
        duration,
        response: data,
      });

      return { success: true, data };
    } catch (err: any) {
      const duration = Date.now() - startTime;
      console.error(`[TEST] ${functionName} exception:`, err);
      addTestResult({
        timestamp,
        functionName,
        status: 'error',
        duration,
        error: err.message || 'Unknown error',
      });
      return { success: false, error: err };
    }
  };

  const runCaliforniaTest = async () => {
    setTesting(true);
    setTestResults([]);

    toast({
      title: 'Starting California Poll Test',
      description: 'Testing cannabis-hemp-poller for CA...',
    });

    try {
      // Test 1: cannabis-hemp-poller
      console.log('=== Testing cannabis-hemp-poller for CA ===');
      const cannabisResult = await testEdgeFunction('cannabis-hemp-poller', 'CA');

      // Refresh ingestion logs to see new entries
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchIngestionLogs();

      // Summary
      const successCount = [cannabisResult].filter(r => r.success).length;
      
      toast({
        title: successCount > 0 ? 'Test Complete' : 'Test Failed',
        description: `${successCount}/2 edge functions responded successfully. Check results below.`,
        variant: successCount > 0 ? 'default' : 'destructive',
      });

    } catch (error: any) {
      console.error('Test error:', error);
      toast({
        title: 'Test Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setTesting(false);
    }
  };

  const copyTestCommand = () => {
    const command = `curl -L -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller' \\
  -H 'Authorization: Bearer YOUR_ANON_KEY' \\
  -H 'apikey: YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  --data '{"stateCode": "CA"}'`;
    
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied!',
      description: 'cURL command copied to clipboard',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      {/* Test Control Panel */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-green-800 flex items-center gap-2">
                  Cannabis-Hemp-Poller Test Panel
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    California (CA)
                  </Badge>
                </CardTitle>
                <CardDescription>
                  Test the cannabis-hemp-poller edge function for California regulations
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={runCaliforniaTest}
              disabled={testing}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Run CA Poll Test
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Terminal className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-sm">Edge Functions</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• cannabis-hemp-poller</li>
                <li>• state-regulations-poller</li>
              </ul>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-sm">Target Tables</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• instrument (regulations)</li>
                <li>• ingestion_log (history)</li>
              </ul>
            </div>
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-sm">CA Sources</span>
              </div>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• cannabis.ca.gov RSS</li>
                <li>• DCC Announcements</li>
              </ul>
            </div>
          </div>

          {/* Manual Test Command */}
          <div className="mt-4 p-4 bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-mono">Manual cURL Test Command</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyTestCommand}
                className="text-gray-400 hover:text-white"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="text-green-400 text-xs overflow-x-auto">
{`curl -L -X POST 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/cannabis-hemp-poller' \\
  -H 'Authorization: Bearer YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  --data '{"stateCode": "CA"}'`}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      <Card className="border-[#E5DFD6]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#794108] flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Test Results
              </CardTitle>
              <CardDescription>
                Real-time results from edge function invocations
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestResults([])}
              disabled={testResults.length === 0}
            >
              Clear Results
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No test results yet</p>
              <p className="text-sm">Click "Run CA Poll Test" to start testing</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div
                    key={`${result.timestamp}-${index}`}
                    className={`p-4 rounded-lg border ${
                      result.status === 'success'
                        ? 'bg-green-50 border-green-200'
                        : result.status === 'error'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-semibold text-sm">{result.functionName}</span>
                        <Badge variant="outline" className="text-xs">
                          {result.status}
                        </Badge>
                        {result.duration && (
                          <Badge variant="outline" className="text-xs bg-gray-100">
                            {result.duration}ms
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(result.timestamp)}
                      </span>
                    </div>
                    {result.response && (
                      <div className="mt-2 p-2 bg-white rounded border text-xs font-mono overflow-x-auto">
                        <pre>{JSON.stringify(result.response, null, 2)}</pre>
                      </div>
                    )}
                    {result.error && (
                      <div className="mt-2 p-2 bg-red-100 rounded border border-red-200 text-xs text-red-700">
                        {result.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Ingestion Log Verification */}
      <Card className="border-[#E5DFD6]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-[#794108] flex items-center gap-2">
                <Database className="w-5 h-5" />
                Ingestion Log Verification
              </CardTitle>
              <CardDescription>
                Recent entries in the ingestion_log table from cannabis/hemp pollers
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchIngestionLogs}
              disabled={loadingLogs}
            >
              {loadingLogs ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              <span className="ml-2">Refresh</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {ingestionLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No ingestion logs found</p>
              <p className="text-sm">Run the poller to create log entries</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {ingestionLogs.map((log) => {
                  const timestamp = log.started_at || log.timestamp || log.created_at;
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {log.status === 'success' ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                          <span className="font-semibold text-sm">
                            {log.source_id || log.source || 'Unknown Source'}
                          </span>
                          <Badge
                            variant={log.status === 'success' ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {log.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-gray-500">
                          {timestamp ? formatTimestamp(timestamp) : 'No timestamp'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span>Fetched: {log.records_fetched || 0}</span>
                        <span>Created: {log.records_created || 0}</span>
                        {log.metadata?.statesProcessed && (
                          <span>States: {log.metadata.statesProcessed}</span>
                        )}
                        {log.metadata?.stateCode && (
                          <Badge variant="outline" className="text-xs">
                            {log.metadata.stateCode}
                          </Badge>
                        )}
                      </div>
                      {log.error_message && (
                        <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                          {log.error_message}
                        </div>
                      )}
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                            View metadata
                          </summary>
                          <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Documentation Links */}
      <Card className="border-[#E5DFD6]">
        <CardHeader>
          <CardTitle className="text-[#794108] flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Related Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="https://supabase.com/dashboard/project/kruwbjaszdwzttblxqwr/functions"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-[#794108]" />
              <div>
                <p className="font-semibold text-sm">Supabase Edge Functions</p>
                <p className="text-xs text-gray-500">View and manage edge functions</p>
              </div>
            </a>
            <a
              href="https://supabase.com/dashboard/project/kruwbjaszdwzttblxqwr/editor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-5 h-5 text-[#794108]" />
              <div>
                <p className="font-semibold text-sm">Supabase SQL Editor</p>
                <p className="text-xs text-gray-500">Query ingestion_log table directly</p>
              </div>
            </a>
          </div>
          <Separator className="my-4" />
          <div className="text-sm text-gray-600">
            <p className="font-semibold mb-2">Verification SQL Query:</p>
            <pre className="p-3 bg-gray-100 rounded text-xs overflow-x-auto">
{`-- Check recent ingestion logs for California
SELECT * FROM ingestion_log 
WHERE source_id LIKE '%cannabis%' 
   OR source_id LIKE '%state%'
   OR metadata->>'stateCode' = 'CA'
ORDER BY started_at DESC 
LIMIT 10;`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
