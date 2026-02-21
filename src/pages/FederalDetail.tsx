import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calendar, AlertCircle, FileText, Building2, Phone, Loader2 } from 'lucide-react';

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { federalData } from '@/data/federalData';
import { FederalRegulationCard } from '@/components/FederalRegulationCard';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StateTimeline } from '@/components/StateTimeline';
import { RequirementsDisplay } from '@/components/RequirementsDisplay';
import { federalLicensing, federalTesting, federalPackaging } from '@/data/federalDataRequirements';
import { federalAgencyContacts } from '@/data/agencyContacts';
import { AgencyContactCard } from '@/components/AgencyContactCard';
import { AgencyContactForm } from '@/components/AgencyContactForm';
import { supabase } from '@/lib/supabase';



export default function FederalDetail() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(federalAgencyContacts[0]);
  const [liveRegulations, setLiveRegulations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch live federal regulations from the database
  useEffect(() => {
    async function fetchFederalRegulations() {
      try {
        setLoading(true);
        // Get the Federal jurisdiction ID
        const { data: jurisdictions } = await supabase
          .from('jurisdiction')
          .select('id')
          .eq('name', 'Federal Government')
          .limit(1);
        
        const federalJurisdictionId = jurisdictions?.[0]?.id;
        if (!federalJurisdictionId) {
          console.warn('Federal jurisdiction not found, using static data');
          setLoading(false);
          return;
        }

        // Fetch latest federal regulations
        const { data: instruments, error } = await supabase
          .from('instrument')
          .select('*')
          .eq('jurisdiction_id', federalJurisdictionId)
          .order('published_at', { ascending: false, nullsFirst: false })
          .limit(100);

        if (error) {
          console.error('Error fetching federal regulations:', error);
          setLoading(false);
          return;
        }

        if (instruments && instruments.length > 0) {
          // Map DB records to FederalRegulationCard format
          const mapped = instruments.map((inst: any) => {
            const agencies = inst.metadata?.agencies?.map((a: any) => a.name || a).join(', ') || '';
            const agency = agencies || inst.metadata?.agency || inst.source || 'Federal Agency';
            
            // Map category to display category
            let displayCategory = 'compliance';
            const cat = (inst.category || '').toLowerCase();
            const title = (inst.title || '').toLowerCase();
            if (cat === 'cannabis' || cat === 'hemp' || title.includes('cannabis') || title.includes('hemp') || title.includes('marijuana')) {
              displayCategory = 'licensing';
            } else if (cat === 'nicotine' || title.includes('tobacco') || title.includes('nicotine') || title.includes('cigarette')) {
              displayCategory = 'testing';
            } else if (cat === 'kratom' || cat === 'kava' || cat === 'psychedelics') {
              displayCategory = 'packaging';
            }

            return {
              id: inst.id,
              title: inst.title,
              category: displayCategory,
              status: inst.status || 'active',
              effectiveDate: inst.effective_date || inst.published_at?.split('T')[0] || inst.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
              description: inst.description || inst.metadata?.summary || inst.title,
              agency: agency,
              impact: inst.impact || inst.metadata?.urgency || 'medium',
              url: inst.url,
              source: inst.source,
              productCategory: inst.category,
            };
          });

          setLiveRegulations(mapped);
          // Set last updated to the most recent record
          const mostRecent = instruments[0]?.published_at || instruments[0]?.created_at;
          if (mostRecent) setLastUpdated(new Date(mostRecent).toLocaleDateString());
        }
      } catch (err) {
        console.error('Failed to fetch federal regulations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFederalRegulations();
  }, []);

  // Use live data if available, fall back to static
  const allRegulations = liveRegulations.length > 0 ? liveRegulations : federalData.regulations;

  // Extended categories including product types
  const categories = ['all', 'cannabis', 'nicotine', 'hemp', 'kratom', 'psychedelics'];

  const filteredRegulations = useMemo(() => {
    if (selectedCategory === 'all') return allRegulations;
    return allRegulations.filter((reg: any) => {
      const prodCat = (reg.productCategory || '').toLowerCase();
      const title = (reg.title || '').toLowerCase();
      const desc = (reg.description || '').toLowerCase();
      const text = `${title} ${desc}`;
      
      switch (selectedCategory) {
        case 'cannabis': return prodCat === 'cannabis' || text.includes('cannabis') || text.includes('marijuana');
        case 'nicotine': return prodCat === 'nicotine' || text.includes('tobacco') || text.includes('nicotine') || text.includes('cigarette');
        case 'hemp': return prodCat === 'hemp' || text.includes('hemp');
        case 'kratom': return prodCat === 'kratom' || text.includes('kratom');
        case 'psychedelics': return prodCat === 'psychedelics' || text.includes('psychedelic') || text.includes('psilocybin');
        default: return true;
      }
    });
  }, [allRegulations, selectedCategory]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <Link to="/app">
            <Button variant="ghost" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Map
            </Button>
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-10 w-10 text-blue-600" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{federalData.fullName}</h1>
                <p className="text-gray-600 mt-1">Federal Regulations for Cannabis, Hemp, Kratom, Nicotine & Psychedelics</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-green-50">
                {allRegulations.length} Active Federal Regulations
              </Badge>
              <Badge variant="outline" className="bg-blue-50">
                Last Updated: {lastUpdated || new Date(federalData.lastUpdated).toLocaleDateString()}
              </Badge>
              {liveRegulations.length > 0 && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                  Live Data
                </Badge>
              )}
            </div>
          </div>

          <Tabs defaultValue="regulations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">

              <TabsTrigger value="regulations">
                <FileText className="h-4 w-4 mr-2" />
                Regulations
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Calendar className="h-4 w-4 mr-2" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="requirements">
                <AlertCircle className="h-4 w-4 mr-2" />
                Requirements
              </TabsTrigger>
              <TabsTrigger value="contact">
                <Phone className="h-4 w-4 mr-2" />
                Agency Contacts
              </TabsTrigger>
            </TabsList>


            <TabsContent value="regulations" className="space-y-6">
              <div className="flex gap-2 flex-wrap mb-6">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    className="capitalize"
                  >
                    {cat === 'all' ? `All (${allRegulations.length})` : cat}
                  </Button>
                ))}
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading federal regulations...</span>
                </div>
              ) : (
                <div className="grid gap-6">
                  {filteredRegulations.length > 0 ? (
                    filteredRegulations.map((regulation: any) => (
                      <FederalRegulationCard key={regulation.id} regulation={regulation} />
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center text-gray-500">
                        No federal regulations found for this category.
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="timeline">
              <StateTimeline timeline={federalData.timeline} />
            </TabsContent>

            <TabsContent value="requirements">
              <RequirementsDisplay 
                licensing={federalLicensing}
                testing={federalTesting}
                packaging={federalPackaging}
              />
            </TabsContent>

            <TabsContent value="contact">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Federal Agency Contacts</CardTitle>
                    <CardDescription>
                      Contact federal agencies for questions about cannabis, hemp, kratom, nicotine, and psychedelics regulations.
                    </CardDescription>
                  </CardHeader>
                </Card>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {federalAgencyContacts.map(contact => (
                    <AgencyContactCard
                      key={contact.id}
                      contact={contact}
                      onContactFormOpen={() => {
                        setSelectedAgency(contact);
                        setContactFormOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

          </Tabs>
          
          <AgencyContactForm
            open={contactFormOpen}
            onOpenChange={setContactFormOpen}
            agency={selectedAgency}
          />
        </div>
      </div>
      <Footer />
    </>
  );
}

