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
import { ChevronRight, Download, Phone, Mail, Globe, MapPin, ArrowLeft, Building2, Users, ExternalLink, AlertCircle } from 'lucide-react';
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
import { getAgencyProfile } from '@/data/stateAgencyProfiles';


const StateDetail = () => {
  const { stateSlug } = useParams<{ stateSlug: string }>();
  const navigate = useNavigate();
  const [compareState, setCompareState] = useState<string>('');
  
  // Combine all states
  const allStates = [...US_STATES, ...MORE_STATES];
  const currentState = allStates.find(s => s.slug === stateSlug);
  
  // Get agency profile if available
  const agencyProfile = getAgencyProfile(stateSlug || '');
  
  // Map state slugs to their data
  const stateDataMap: Record<string, any> = {
    'california': californiaDetail, 'texas': texasDetail, 'florida': floridaDetail,
    'new-york': newYorkDetail, 'washington': washingtonDetail, 'colorado': coloradoDetail,
    'oregon': oregonDetail, 'michigan': michiganDetail, 'arizona': arizonaDetail,
    'pennsylvania': pennsylvaniaDetail, 'illinois': illinoisDetail, 'nevada': nevadaDetail,
    'massachusetts': massachusettsDetail, 'new-jersey': newJerseyDetail, 'virginia': virginiaDetail
  };
  
  // Get state data - if not in map, create a basic structure from currentState
  const stateData = stateDataMap[stateSlug || ''] || (currentState ? {
    id: currentState.id,
    name: currentState.name,
    slug: currentState.slug,
    summary: `${currentState.name} regulatory information. This state has ${currentState.recentUpdates} recent regulatory updates and ${currentState.activeDeadlines} active compliance deadlines.`,
    lastUpdated: new Date().toISOString().split('T')[0],
    timeline: [],
    deadlines: [],
    authorities: [],
    licensing: [],
    testing: [],
    packaging: [],
    legalStatus: currentState.legalStatus
  } : null);




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

  if (!currentState || !stateData) {
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

  // Check if this state has detailed data or just basic info
  const hasDetailedData = stateDataMap[stateSlug || ''] !== undefined;

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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{currentState.name}</h1>
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
            <div className="flex gap-3">
              {agencyProfile && (
                <Button 
                  variant="outline"
                  onClick={() => navigate(`/states/${stateSlug}/agency`)} 
                  className="flex items-center gap-2"
                >
                  <Building2 className="w-4 h-4" /> Agency Profile
                </Button>
              )}
              <Button 
                onClick={() => generateStatePDF({ 
                  ...stateData, 
                  slug: stateSlug,
                  legalStatus: currentState.legalStatus 
                })} 
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download PDF
              </Button>
            </div>

          </div>
          <p className="text-lg text-gray-700 mb-6">{stateData.summary}</p>

          {/* Notice for states without detailed data */}
          {!hasDetailedData && (
            <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-800">Limited Data Available</h3>
                <p className="text-sm text-amber-700">
                  We're still building out detailed regulatory information for {currentState.name}. 
                  Check back soon for comprehensive licensing, testing, and packaging requirements.
                </p>
              </div>
            </div>
          )}

          {/* Agency Profile Quick Card */}
          {agencyProfile && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{agencyProfile.agency.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{agencyProfile.agency.acronym} • Established {agencyProfile.agency.established}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <a href={`tel:${agencyProfile.contact.phone}`} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                        <Phone className="w-4 h-4" /> {agencyProfile.contact.phone}
                      </a>
                      <a href={`mailto:${agencyProfile.contact.email}`} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                        <Mail className="w-4 h-4" /> {agencyProfile.contact.email}
                      </a>
                      <a href={agencyProfile.contact.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                        <Globe className="w-4 h-4" /> Website <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => navigate(`/states/${stateSlug}/agency`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="w-4 h-4 mr-1" /> View Full Profile
                </Button>
              </div>
              {agencyProfile.statistics.activeLicenses && (
                <div className="mt-4 pt-4 border-t border-blue-200 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{agencyProfile.statistics.activeLicenses?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Active Licenses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-600">{agencyProfile.statistics.pendingApplications?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Pending Apps</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{agencyProfile.statistics.enforcementActionsYTD}</div>
                    <div className="text-xs text-gray-500">Enforcement YTD</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{agencyProfile.statistics.inspectionsYTD?.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">Inspections YTD</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {Object.entries(currentState.legalStatus).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-xs text-gray-500 uppercase mb-1">{key}</div>
                <Badge variant={value === 'Legal' ? 'default' : value === 'Illegal' || value === 'Banned' ? 'destructive' : 'secondary'}>{value}</Badge>
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
            <TabsTrigger value="timeline">Timeline ({stateData.timeline?.length || 0})</TabsTrigger>
            <TabsTrigger value="deadlines">Deadlines ({stateData.deadlines?.length || 0})</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="authorities">Authorities ({stateData.authorities?.length || 0})</TabsTrigger>
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
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">No regulations found in database for this state yet.</p>
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
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Recent Changes</h2>
              {stateData.timeline && stateData.timeline.length > 0 ? (
                <StateTimeline timeline={stateData.timeline} />
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No timeline data available for this state yet.</p>
                </div>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="deadlines">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Compliance Deadlines</h2>
              {stateData.deadlines && stateData.deadlines.length > 0 ? (
                <ComplianceCalendar deadlines={stateData.deadlines} />
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No upcoming deadlines for this state.</p>
                </div>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="requirements">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Regulatory Requirements</h2>
              {(stateData.licensing?.length > 0 || stateData.testing?.length > 0 || stateData.packaging?.length > 0) ? (
                <RequirementsDisplay 
                  licensing={stateData.licensing || []} 
                  testing={stateData.testing || []} 
                  packaging={stateData.packaging || []} 
                />
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Detailed requirements data is being compiled for this state.</p>
                  <p className="text-sm text-gray-500 mt-2">Check back soon for licensing, testing, and packaging requirements.</p>
                </div>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="authorities">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Regulatory Authorities</h2>
              
              {/* Link to full agency profile if available */}
              {agencyProfile && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Want more details?</h3>
                    <p className="text-sm text-gray-600">View the full agency profile with key personnel, enforcement actions, and regulatory timeline.</p>
                  </div>
                  <Button onClick={() => navigate(`/states/${stateSlug}/agency`)}>
                    View Agency Profile
                  </Button>
                </div>
              )}
              
              {stateData.authorities && stateData.authorities.length > 0 ? (
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
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Regulatory authority information is being compiled for this state.</p>
                </div>
              )}
            </Card>
          </TabsContent>

        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default StateDetail;
