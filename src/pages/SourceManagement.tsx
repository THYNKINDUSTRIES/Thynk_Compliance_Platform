import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { MOCK_REGULATIONS } from '@/data/regulations';
import { EXTENDED_REGULATIONS } from '@/data/extendedRegulations';
import { ADDITIONAL_REGULATIONS } from '@/data/moreRegulations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { PopulateURLsButton } from '@/components/PopulateURLsButton';
import { DataIngestionTester } from '@/components/DataIngestionTester';
import { PollingHealthDashboard } from '@/components/PollingHealthDashboard';
import { Database, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';




export default function SourceManagement() {
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  // Client-side migration function
  const migrateDataClientSide = async () => {
    setMigrating(true);
    setResult(null);
    
    const allRegulations = [
      ...MOCK_REGULATIONS,
      ...EXTENDED_REGULATIONS,
      ...ADDITIONAL_REGULATIONS,
    ];

    let migrated = 0;
    const errors: any[] = [];

    try {
      for (const reg of allRegulations) {
        try {
          // Get or create jurisdiction
          let { data: jurisdiction } = await supabase
            .from('jurisdiction')
            .select('id')
            .eq('name', reg.jurisdiction)
            .single();

          if (!jurisdiction) {
            const { data: newJuris, error: jurisError } = await supabase
              .from('jurisdiction')
              .insert({
                name: reg.jurisdiction,
                type: reg.jurisdiction === 'Federal' ? 'federal' : 'state',
                slug: reg.jurisdiction.toLowerCase().replace(/\s+/g, '-'),
              })
              .select('id')
              .single();

            if (jurisError) throw jurisError;
            jurisdiction = newJuris;
          }

          // Get or create authority
          let { data: authority } = await supabase
            .from('authority')
            .select('id')
            .eq('acronym', reg.authority)
            .single();

          if (!authority) {
            const { data: newAuth, error: authError } = await supabase
              .from('authority')
              .insert({
                name: reg.authority,
                acronym: reg.authority,
                jurisdiction_id: jurisdiction?.id,
              })
              .select('id')
              .single();

            if (authError) throw authError;
            authority = newAuth;
          }

          // Insert regulation
          const { error: regError } = await supabase.from('instrument').insert({
            title: reg.title,
            summary: reg.summary,
            jurisdiction_id: jurisdiction?.id,
            authority_id: authority?.id,
            status: reg.status,
            products: reg.products,
            stages: reg.stages,
            instrument_type: reg.instrumentType,
            published_at: reg.publishedAt,
            effective_at: reg.effectiveAt || null,
            citation: reg.citation,
            url: reg.url,
            impact: reg.impact,
          });

          if (regError) throw regError;
          migrated++;
        } catch (error: any) {
          errors.push({ title: reg.title, error: error.message });
        }
      }

      setResult({ migrated, errors, total: allRegulations.length });
      toast({
        title: 'Migration Complete!',
        description: `Successfully migrated ${migrated} of ${allRegulations.length} regulations`,
      });
    } catch (error: any) {
      setResult({ error: error.message });
      toast({
        title: 'Migration Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      <div className="container mx-auto py-8 px-4 mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#794108] mb-2">Data Management</h1>
            <p className="text-gray-600">Manage data ingestion, monitor polling health, and seed the database</p>
          </div>

          <Tabs defaultValue="seeding" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="seeding">Database Seeding</TabsTrigger>
              <TabsTrigger value="polling">Polling Health</TabsTrigger>
              <TabsTrigger value="testing">Testing Tools</TabsTrigger>
            </TabsList>

            <TabsContent value="seeding" className="space-y-6">


          <Card className="border-[#E5DFD6] shadow-lg mb-6">
            <CardHeader className="bg-gradient-to-r from-[#FDF8F3] to-[#F5EDE3]">
              <div className="flex items-center gap-3">
                <Database className="w-8 h-8 text-[#794108]" />
                <div>
                  <CardTitle className="text-[#794108]">Database Seeding</CardTitle>
                  <CardDescription>
                    Populate the database with sample regulations including THCa, hemp, and other product data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">What will be seeded:</h3>
                  <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
                    <li>{MOCK_REGULATIONS.length} regulations from regulations.ts</li>
                    <li>{EXTENDED_REGULATIONS.length} regulations from extendedRegulations.ts</li>
                    <li>{ADDITIONAL_REGULATIONS.length} regulations from moreRegulations.ts</li>
                    <li>Total: {MOCK_REGULATIONS.length + EXTENDED_REGULATIONS.length + ADDITIONAL_REGULATIONS.length} regulations</li>
                  </ul>
                </div>

                <Button 
                  onClick={migrateDataClientSide} 
                  disabled={migrating}
                  className="w-full bg-[#794108] hover:bg-[#E89C5C] text-white h-12 text-lg"
                >
                  {migrating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Seeding Database...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 mr-2" />
                      Seed Database Now
                    </>
                  )}
                </Button>

                {result && (
                  <div className={`mt-4 p-4 rounded-lg border ${
                    result.error 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}>
                    {result.error ? (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <p className="text-red-900 font-semibold">Migration Failed</p>
                          <p className="text-red-700 text-sm mt-1">{result.error}</p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start gap-2 mb-3">
                          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="text-green-900 font-semibold">Migration Successful!</p>
                            <p className="text-green-700 text-sm mt-1">
                              Migrated {result.migrated} of {result.total} regulations
                            </p>
                          </div>
                        </div>
                        
                        {result.errors?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-green-300">
                            <p className="text-orange-700 font-medium mb-2">
                              ⚠️ {result.errors.length} errors occurred:
                            </p>
                            <ul className="list-disc list-inside text-sm text-orange-600 space-y-1 max-h-40 overflow-y-auto">
                              {result.errors.map((err: any, idx: number) => (
                                <li key={idx} className="text-xs">
                                  {err.title}: {err.error}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#E5DFD6]">
            <CardHeader>
              <CardTitle className="text-[#794108]">Testing Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-[#794108] mb-2">1. Create an Account</h4>
                  <p>Go to the signup page and create a new account. The database trigger will automatically create your user profile.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[#794108] mb-2">2. Seed the Database</h4>
                  <p>Click the "Seed Database Now" button above to populate the database with sample regulations.</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-[#794108] mb-2">3. Test Search Functionality</h4>
                  <p className="mb-2">Navigate to the home page and try searching for:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>THCa</strong> - Should return regulations about THCa products</li>
                    <li><strong>hemp</strong> - Should return hemp-related regulations</li>
                    <li><strong>FDA</strong> - Should return FDA regulations</li>
                    <li><strong>California</strong> - Should return California regulations</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-[#794108] mb-2">4. Test Filters</h4>
                  <p>Use the filter panel on the home page to filter by products, jurisdictions, authorities, and more.</p>
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
