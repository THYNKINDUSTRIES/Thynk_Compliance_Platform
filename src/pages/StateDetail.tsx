import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StateTimeline } from '@/components/StateTimeline';
import { RequirementsDisplay } from '@/components/RequirementsDisplay';
import { ComplianceCalendar } from '@/components/ComplianceCalendar';
import { generateStatePDF } from '@/lib/pdfGenerator';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronRight, Download, Phone, Mail, Globe, MapPin, ArrowLeft } from 'lucide-react';
import { californiaDetail } from '@/data/caData';
import { texasDetail } from '@/data/txData';
import { floridaDetail } from '@/data/flData';
import { newYorkDetail } from '@/data/nyData';
import { washingtonDetail } from '@/data/waData';
import { coloradoDetail } from '@/data/coData';
import { oregonDetail } from '@/data/orData';
import { michiganDetail } from '@/data/miData';
import { arizonaDetail } from '@/data/azData';
import { pennsylvaniaDetail } from '@/data/paData';
import { illinoisDetail } from '@/data/ilData';
import { nevadaDetail } from '@/data/nvData';
import { massachusettsDetail } from '@/data/maData';
import { newJerseyDetail } from '@/data/njData';
import { virginiaDetail } from '@/data/vaData';
import { MORE_STATES } from '@/data/moreStates';
import { US_STATES } from '@/data/states';

import { useRegulations } from '@/hooks/useRegulations';
import { useJurisdictionFreshness } from '@/hooks/useJurisdictionFreshness';
import { stateAgencyContacts } from '@/data/agencyContacts';
import { AgencyContactCard } from '@/components/AgencyContactCard';
import { AgencyContactForm } from '@/components/AgencyContactForm';


const StateDetail = () => {
  const { stateSlug } = useParams<{ stateSlug: string }>();
  const navigate = useNavigate();
  const [compareState, setCompareState] = useState<string>('');
  
  // Combine all states
  const allStates = [...US_STATES, ...MORE_STATES];
  const currentState = allStates.find(s => s.slug === stateSlug);
  
  // Map state slugs to their data
  const stateDataMap: Record<string, any> = {
    'california': californiaDetail, 'texas': texasDetail, 'florida': floridaDetail,
    'new-york': newYorkDetail, 'washington': washingtonDetail, 'colorado': coloradoDetail,
    'oregon': oregonDetail, 'michigan': michiganDetail, 'arizona': arizonaDetail,
    'pennsylvania': pennsylvaniaDetail, 'illinois': illinoisDetail, 'nevada': nevadaDetail,
    'massachusetts': massachusettsDetail, 'new-jersey': newJerseyDetail, 'virginia': virginiaDetail
  };
  
  const stateData = stateDataMap[stateSlug || ''] || californiaDetail;





  // Fetch regulations for this state from Supabase
  // Note: We filter by state name, not slug, since the database stores full names
  const stateName = currentState?.name;
  const { regulations, loading } = useRegulations({ jurisdiction: stateName });
  const { freshness } = useJurisdictionFreshness();

  // Get freshness data for this state

  const stateFreshness = freshness.find(f => f.jurisdiction_slug === stateSlug);
  
  const formatLastUpdated = (dateString?: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  if (!currentState) {
    return (
      <div className="min-h-screen bg-[#FAF8F5]">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">State Not Found</h1>
            <p className="text-lg text-gray-600 mb-8">
              We couldn't find information for the state you're looking for.
            </p>
            <Button onClick={() => navigate('/')} size="lg">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-[#FAF8F5]">

      <Header />
      <div className="container mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/#states" className="hover:text-blue-600">States</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{currentState.name}</span>
        </nav>
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Map
        </Button>
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{stateData.name}</h1>
              <div className="flex items-center gap-4">
                <p className="text-gray-600">
                  Last updated: {formatLastUpdated(stateFreshness?.last_updated)}
                </p>
                {stateFreshness?.last_updated && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-medium">Live data</span>
                  </div>
                )}
              </div>
              {stateFreshness && (
                <p className="text-sm text-gray-500 mt-1">
                  {stateFreshness.total_instruments} regulations tracked
                </p>
              )}
            </div>
            <Button 
              onClick={() => generateStatePDF({ ...stateData, slug: stateSlug })} 
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download PDF
            </Button>

          </div>
          <p className="text-lg text-gray-700 mb-6">{stateData.summary}</p>


          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {Object.entries(currentState.legalStatus).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase mb-1">{key}</div>
                <Badge variant={value === 'Legal' ? 'default' : 'destructive'}>{value}</Badge>
              </div>
            ))}
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-3">Compare with Another State</h3>
            <div className="flex gap-3">
              <Select value={compareState} onValueChange={setCompareState}>
                <SelectTrigger className="w-64 bg-white"><SelectValue placeholder="Select state" /></SelectTrigger>
                <SelectContent>
                  {allStates.filter(s => s.slug !== stateSlug).map(state => (
                    <SelectItem key={state.slug} value={state.slug}>{state.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => compareState && navigate(`/states/${stateSlug}/compare/${compareState}`)}>Compare</Button>

            </div>
          </div>
        </div>
        <Tabs defaultValue="regulations" className="space-y-6">
          <TabsList className="bg-white p-1 rounded-lg shadow">
            <TabsTrigger value="regulations">Regulations ({regulations.length})</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="authorities">Authorities</TabsTrigger>
          </TabsList>
          <TabsContent value="regulations">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">State Regulations from Database</h2>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading regulations...</p>
                </div>
              ) : regulations.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">No regulations found in database for this state yet.</p>
                  <p className="text-sm text-gray-500 mt-2">Check back soon as we continuously update our database.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {regulations.map((reg) => (
                    <div key={reg.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/regulations/${reg.id}`)}>
                      <h3 className="font-semibold text-lg mb-2">{reg.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{reg.summary}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{reg.authority}</span>
                        <span>•</span>
                        <span>{reg.instrumentType}</span>
                        <span>•</span>
                        <span>Published: {reg.publishedAt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <Card className="p-6"><h2 className="text-2xl font-bold mb-6">Recent Changes</h2><StateTimeline timeline={stateData.timeline} /></Card>
          </TabsContent>
          <TabsContent value="deadlines">
            <Card className="p-6"><h2 className="text-2xl font-bold mb-6">Compliance Deadlines</h2><ComplianceCalendar deadlines={stateData.deadlines} /></Card>
          </TabsContent>
          <TabsContent value="requirements">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Regulatory Requirements</h2>
              <RequirementsDisplay 
                licensing={stateData.licensing} 
                testing={stateData.testing} 
                packaging={stateData.packaging} 
              />
            </Card>
          </TabsContent>
          <TabsContent value="authorities">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Regulatory Authorities</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {stateData.authorities.map((auth: any) => (
                  <div key={auth.acronym} className="border rounded-lg p-6 bg-white shadow-sm">
                    <h3 className="text-xl font-semibold mb-2">{auth.name} ({auth.acronym})</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{auth.phone}</span></div>
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><a href={`mailto:${auth.email}`} className="text-blue-600 hover:underline">{auth.email}</a></div>
                      <div className="flex items-center gap-2"><Globe className="w-4 h-4" /><a href={auth.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Website</a></div>
                      <div className="flex items-start gap-2"><MapPin className="w-4 h-4 mt-1" /><span>{auth.address}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default StateDetail;
