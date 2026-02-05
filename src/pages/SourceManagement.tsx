import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PopulateURLsButton } from '@/components/PopulateURLsButton';
import { DataIngestionTester } from '@/components/DataIngestionTester';
import { PollingHealthDashboard } from '@/components/PollingHealthDashboard';
import { CannabisHempPoller } from '@/components/CannabisHempPoller';
import { KratomPoller } from '@/components/KratomPoller';
import { KavaPoller } from '@/components/KavaPoller';
import { PollerTestPanel } from '@/components/PollerTestPanel';
import { Database, RefreshCw, CheckCircle, AlertCircle, Loader2, Trash2, MapPin, FlaskConical, Leaf } from 'lucide-react';

interface DatabaseStats {
  totalInstruments: number;
  totalJurisdictions: number;
  totalAuthorities: number;
  recentUpdates: number;
  stateRegulations: number;
  federalRegulations: number;
}

export default function SourceManagement() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    try {
      setLoading(true);

      // Fetch counts from Supabase
      const [instrumentsRes, jurisdictionsRes, authoritiesRes, recentRes, stateRes, federalRes] = await Promise.all([
        supabase.from('instrument').select('*', { count: 'exact', head: true }),
        supabase.from('jurisdiction').select('*', { count: 'exact', head: true }),
        supabase.from('authority').select('*', { count: 'exact', head: true }),
        supabase.from('instrument').select('*', { count: 'exact', head: true })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('instrument').select('*', { count: 'exact', head: true })
          .eq('source', 'state_regulations'),
        supabase.from('instrument').select('*', { count: 'exact', head: true })
          .eq('source', 'federal_register'),
      ]);

      setStats({
        totalInstruments: instrumentsRes.count || 0,
        totalJurisdictions: jurisdictionsRes.count || 0,
        totalAuthorities: authoritiesRes.count || 0,
        recentUpdates: recentRes.count || 0,
        stateRegulations: stateRes.count || 0,
        federalRegulations: federalRes.count || 0,
      });
    } catch (error) {
      console.error('[SourceManagement] Error fetching stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch database statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const clearTestData = async () => {
    if (!confirm('Are you sure you want to clear all test data? This action cannot be undone.')) {
      return;
    }

    try {
      setClearing(true);

      // Clear instruments (regulations)
      const { error } = await supabase
        .from('instrument')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      toast({
        title: 'Data Cleared',
        description: 'All test data has been removed from the database',
      });

      // Refresh stats
      await fetchDatabaseStats();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[SourceManagement] Error clearing data:', error);
      toast({
        title: 'Error',
        description: `Failed to clear data: ${errorMessage}`,
        variant: 'destructive',
      });
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      <div className="container mx-auto py-8 px-4 mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#794108] mb-2">Data Management</h1>
            <p className="text-gray-600">Monitor live Supabase data, polling health, and manage data ingestion</p>
          </div>

          {/* Database Stats */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <Card className="border-[#E5DFD6]">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-[#794108]">
                  {loading ? <Loader2 className="animate-spin" /> : stats?.totalInstruments.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-1">Total Regulations</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5DFD6]">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-600">
                  {loading ? <Loader2 className="animate-spin" /> : stats?.federalRegulations.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-1">Federal</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5DFD6]">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-600">
                  {loading ? <Loader2 className="animate-spin" /> : stats?.stateRegulations.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-1">State</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5DFD6]">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-[#794108]">
                  {loading ? <Loader2 className="animate-spin" /> : stats?.totalJurisdictions}
                </div>
                <p className="text-sm text-gray-600 mt-1">Jurisdictions</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5DFD6]">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-[#794108]">
                  {loading ? <Loader2 className="animate-spin" /> : stats?.totalAuthorities}
                </div>
                <p className="text-sm text-gray-600 mt-1">Authorities</p>
              </CardContent>
            </Card>
            <Card className="border-[#E5DFD6]">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-orange-600">
                  {loading ? <Loader2 className="animate-spin" /> : stats?.recentUpdates}
                </div>
                <p className="text-sm text-gray-600 mt-1">Last 24h</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="states" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="states" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                State Regulations
              </TabsTrigger>
              <TabsTrigger value="kratom" className="flex items-center gap-2">
                <Leaf className="w-4 h-4" />
                Kratom
              </TabsTrigger>
              <TabsTrigger value="kava" className="flex items-center gap-2">
                <Sprout className="w-4 h-4" />
                Kava
              </TabsTrigger>
              <TabsTrigger value="ca-test" className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                CA Poll Test
              </TabsTrigger>
              <TabsTrigger value="overview">Database Overview</TabsTrigger>
              <TabsTrigger value="polling">Polling Health</TabsTrigger>
              <TabsTrigger value="testing">Testing Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="states" className="space-y-6">
              <CannabisHempPoller />
            </TabsContent>

            <TabsContent value="kratom" className="space-y-6">
              <KratomPoller />
            </TabsContent>

            <TabsContent value="kava" className="space-y-6">
              <KavaPoller />
            </TabsContent>

            <TabsContent value="ca-test" className="space-y-6">
              <PollerTestPanel />
            </TabsContent>





            <TabsContent value="overview" className="space-y-6">
              <Card className="border-[#E5DFD6] shadow-lg">
                <CardHeader className="bg-gradient-to-r from-[#FDF8F3] to-[#F5EDE3]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Database className="w-8 h-8 text-[#794108]" />
                      <div>
                        <CardTitle className="text-[#794108]">Live Database Status</CardTitle>
                        <CardDescription>
                          Connected to Supabase - All data is fetched in real-time
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={fetchDatabaseStats}
                      disabled={loading}
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                        <div>
                          <p className="text-green-900 font-semibold">Database Connected</p>
                          <p className="text-green-700 text-sm mt-1">
                            All mock data has been removed. The application now pulls exclusively from the live Supabase database.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Data Sources:</h3>
                      <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                        <li><strong>instrument</strong> - Regulations and legal instruments</li>
                        <li><strong>jurisdiction</strong> - States and federal jurisdictions</li>
                        <li><strong>authority</strong> - Regulatory agencies and authorities</li>
                        <li><strong>user_favorites</strong> - User saved regulations</li>
                        <li><strong>user_alerts</strong> - User notification preferences</li>
                      </ul>
                    </div>

                    <div className="border-t pt-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Admin Actions</h3>
                      <Button
                        variant="destructive"
                        onClick={clearTestData}
                        disabled={clearing}
                      >
                        {clearing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Clearing...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All Test Data
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Warning: This will permanently delete all regulations from the database.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#E5DFD6]">
                <CardHeader>
                  <CardTitle className="text-[#794108]">Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-sm text-gray-700">
                    <div>
                      <h4 className="font-semibold text-[#794108] mb-2">Environment Variables Required:</h4>
                      <ul className="list-disc list-inside ml-4 space-y-1 font-mono text-xs">
                        <li>VITE_SUPABASE_URL - Supabase project URL</li>
                        <li>VITE_SUPABASE_ANON_KEY - Public anon key (for client reads)</li>
                        <li>VITE_SUPABASE_SERVICE_ROLE_KEY - Service role key (for preview mode)</li>
                        <li>VITE_PREVIEW_MODE - Set to "true" for preview authentication</li>
                      </ul>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="text-yellow-900 font-semibold">Security Note</p>
                          <p className="text-yellow-700 text-sm mt-1">
                            The service_role key should only be used in preview/development environments. 
                            In production, always use the anon key with proper RLS policies.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="polling" className="space-y-6">
              <PollingHealthDashboard />
            </TabsContent>

            <TabsContent value="testing" className="space-y-6">
              <PopulateURLsButton />
              <DataIngestionTester />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}
