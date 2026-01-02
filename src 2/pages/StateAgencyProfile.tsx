import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronRight, 
  ArrowLeft, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Clock, 
  Building2,
  Users,
  FileCheck,
  Shield,
  Scale,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Twitter,
  Facebook,
  Linkedin,
  Instagram,
  Youtube,
  DollarSign,
  TrendingUp,
  FileText,
  Gavel,
  History,
  Megaphone,
  FlaskConical,
  ScanLine,
  Leaf,
  ShieldAlert,
  Truck,
  Handshake,
  Sprout
} from 'lucide-react';
import { getAgencyProfile, getAllAgencyProfiles, StateAgencyProfile, EnforcementAction, RegulatoryTimelineEvent, KeyPersonnel, RegulatoryFocusArea } from '@/data/stateAgencyProfiles';
import { US_STATES } from '@/data/states';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  FileCheck,
  Shield,
  Scale,
  Users,
  ScanLine,
  FlaskConical,
  Leaf,
  Megaphone,
  ShieldAlert,
  Truck,
  Handshake,
  Sprout,
  Building: Building2,
};

const StateAgencyProfile = () => {
  const { stateSlug } = useParams<{ stateSlug: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const profile = getAgencyProfile(stateSlug || '');
  const allProfiles = getAllAgencyProfiles();
  const stateInfo = US_STATES.find(s => s.slug === stateSlug);

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-amber-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Agency Profile Not Found</h1>
            <p className="text-lg text-gray-600 mb-8">
              We don't have detailed agency profile information for this state yet. 
              Check back soon as we continue to expand our coverage.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate(-1)} variant="outline" size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
              </Button>
              <Button onClick={() => navigate(`/states/${stateSlug}`)} size="lg">
                View State Regulations
              </Button>
            </div>
            
            <div className="mt-12">
              <h2 className="text-xl font-semibold mb-4">Available Agency Profiles</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {allProfiles.map(p => (
                  <Link 
                    key={p.stateCode} 
                    to={`/states/${p.slug}/agency`}
                    className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-left"
                  >
                    <div className="font-medium text-gray-900">{p.stateName}</div>
                    <div className="text-sm text-gray-500">{p.agency.acronym}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getEnforcementTypeBadge = (type: EnforcementAction['type']) => {
    const variants: Record<string, { color: string; label: string }> = {
      fine: { color: 'bg-amber-100 text-amber-800', label: 'Fine' },
      license_suspension: { color: 'bg-orange-100 text-orange-800', label: 'Suspension' },
      license_revocation: { color: 'bg-red-100 text-red-800', label: 'Revocation' },
      warning: { color: 'bg-blue-100 text-blue-800', label: 'Warning' },
      cease_desist: { color: 'bg-purple-100 text-purple-800', label: 'Cease & Desist' },
      criminal_referral: { color: 'bg-red-100 text-red-800', label: 'Criminal Referral' },
    };
    const variant = variants[type] || { color: 'bg-gray-100 text-gray-800', label: type };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${variant.color}`}>{variant.label}</span>;
  };

  const getTimelineTypeBadge = (type: RegulatoryTimelineEvent['type']) => {
    const variants: Record<string, { color: string; label: string }> = {
      law_enacted: { color: 'bg-green-100 text-green-800', label: 'Law Enacted' },
      rule_adopted: { color: 'bg-blue-100 text-blue-800', label: 'Rule Adopted' },
      rule_proposed: { color: 'bg-yellow-100 text-yellow-800', label: 'Proposed Rule' },
      guidance_issued: { color: 'bg-purple-100 text-purple-800', label: 'Guidance' },
      program_launched: { color: 'bg-emerald-100 text-emerald-800', label: 'Program Launch' },
      amendment: { color: 'bg-indigo-100 text-indigo-800', label: 'Amendment' },
      emergency_rule: { color: 'bg-red-100 text-red-800', label: 'Emergency Rule' },
    };
    const variant = variants[type] || { color: 'bg-gray-100 text-gray-800', label: type };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${variant.color}`}>{variant.label}</span>;
  };

  const getImpactBadge = (impact: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-amber-100 text-amber-800',
      low: 'bg-green-100 text-green-800',
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[impact]}`}>{impact.toUpperCase()}</span>;
  };

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    const colors = {
      high: 'border-red-500 bg-red-50',
      medium: 'border-amber-500 bg-amber-50',
      low: 'border-green-500 bg-green-50',
    };
    return colors[priority];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600">
          <Link to="/" className="hover:text-blue-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to={`/states/${stateSlug}`} className="hover:text-blue-600">{profile.stateName}</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">Agency Profile</span>
        </nav>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/states/${stateSlug}`)} 
            className="mb-6 text-white/80 hover:text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to {profile.stateName} Regulations
          </Button>
          
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-1">{profile.stateCode}</Badge>
                  <h1 className="text-3xl lg:text-4xl font-bold">{profile.agency.name}</h1>
                </div>
              </div>
              <p className="text-lg text-blue-100 mb-4 max-w-3xl">{profile.agency.description}</p>
              {profile.agency.mission && (
                <div className="bg-white/10 rounded-lg p-4 max-w-3xl">
                  <h3 className="font-semibold mb-1 text-blue-100">Mission</h3>
                  <p className="text-white/90">{profile.agency.mission}</p>
                </div>
              )}
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 min-w-[280px]">
              <h3 className="font-semibold mb-4 text-lg">Quick Stats</h3>
              <div className="space-y-3">
                {profile.statistics.activeLicenses && (
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Active Licenses</span>
                    <span className="font-bold text-xl">{profile.statistics.activeLicenses.toLocaleString()}</span>
                  </div>
                )}
                {profile.statistics.pendingApplications && (
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Pending Applications</span>
                    <span className="font-bold text-xl">{profile.statistics.pendingApplications.toLocaleString()}</span>
                  </div>
                )}
                {profile.statistics.enforcementActionsYTD && (
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Enforcement Actions (YTD)</span>
                    <span className="font-bold text-xl">{profile.statistics.enforcementActionsYTD}</span>
                  </div>
                )}
                {profile.statistics.totalFinesYTD && (
                  <div className="flex justify-between items-center">
                    <span className="text-blue-100">Total Fines (YTD)</span>
                    <span className="font-bold text-xl">{formatCurrency(profile.statistics.totalFinesYTD)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white p-1 rounded-lg shadow-sm flex-wrap h-auto">
            <TabsTrigger value="overview" className="gap-2">
              <Building2 className="w-4 h-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="personnel" className="gap-2">
              <Users className="w-4 h-4" /> Key Personnel
            </TabsTrigger>
            <TabsTrigger value="focus-areas" className="gap-2">
              <FileCheck className="w-4 h-4" /> Focus Areas
            </TabsTrigger>
            <TabsTrigger value="enforcement" className="gap-2">
              <Gavel className="w-4 h-4" /> Enforcement
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <History className="w-4 h-4" /> Timeline
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Contact Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-600" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium">Address</div>
                          <div className="text-gray-600">
                            {profile.contact.address}<br />
                            {profile.contact.city}, {profile.contact.state} {profile.contact.zip}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium">Phone</div>
                          <a href={`tel:${profile.contact.phone}`} className="text-blue-600 hover:underline">
                            {profile.contact.phone}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium">Office Hours</div>
                          <div className="text-gray-600">{profile.contact.officeHours}</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium">General Inquiries</div>
                          <a href={`mailto:${profile.contact.email}`} className="text-blue-600 hover:underline">
                            {profile.contact.email}
                          </a>
                        </div>
                      </div>
                      {profile.contact.licensingEmail && (
                        <div className="flex items-start gap-3">
                          <FileCheck className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium">Licensing</div>
                            <a href={`mailto:${profile.contact.licensingEmail}`} className="text-blue-600 hover:underline">
                              {profile.contact.licensingEmail}
                            </a>
                          </div>
                        </div>
                      )}
                      {profile.contact.complianceEmail && (
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="font-medium">Compliance</div>
                            <a href={`mailto:${profile.contact.complianceEmail}`} className="text-blue-600 hover:underline">
                              {profile.contact.complianceEmail}
                            </a>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3">
                        <Globe className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <div className="font-medium">Website</div>
                          <a 
                            href={profile.contact.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {profile.contact.website.replace('https://', '')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Media */}
                  {profile.socialMedia && Object.keys(profile.socialMedia).length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-3">Social Media</h4>
                        <div className="flex gap-3">
                          {profile.socialMedia.twitter && (
                            <a 
                              href={profile.socialMedia.twitter} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Twitter className="w-5 h-5 text-gray-600" />
                            </a>
                          )}
                          {profile.socialMedia.facebook && (
                            <a 
                              href={profile.socialMedia.facebook} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Facebook className="w-5 h-5 text-gray-600" />
                            </a>
                          )}
                          {profile.socialMedia.linkedin && (
                            <a 
                              href={profile.socialMedia.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Linkedin className="w-5 h-5 text-gray-600" />
                            </a>
                          )}
                          {profile.socialMedia.instagram && (
                            <a 
                              href={profile.socialMedia.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Instagram className="w-5 h-5 text-gray-600" />
                            </a>
                          )}
                          {profile.socialMedia.youtube && (
                            <a 
                              href={profile.socialMedia.youtube} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="p-2 bg-gray-100 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Youtube className="w-5 h-5 text-gray-600" />
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-blue-600" />
                    Quick Links
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {profile.quickLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors group"
                      >
                        <span className="font-medium text-gray-700 group-hover:text-blue-700">{link.label}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* License Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  License Types
                </CardTitle>
                <CardDescription>
                  Available cannabis business license categories in {profile.stateName}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.licenseTypes.map((type, index) => (
                    <Badge key={index} variant="outline" className="px-3 py-1">
                      {type}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Agency Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Agency Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Acronym</div>
                    <div className="font-semibold text-lg">{profile.agency.acronym}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Established</div>
                    <div className="font-semibold text-lg">{profile.agency.established}</div>
                  </div>
                  {profile.agency.parentDepartment && (
                    <div>
                      <div className="text-sm text-gray-500 mb-1">Parent Department</div>
                      <div className="font-semibold">{profile.agency.parentDepartment}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Key Personnel Tab */}
          <TabsContent value="personnel" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Key Personnel
                </CardTitle>
                <CardDescription>
                  Leadership and key contacts at {profile.agency.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.keyPersonnel.map((person, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold mb-4">
                        {person.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <h3 className="font-semibold text-lg">{person.name}</h3>
                      <p className="text-blue-600 font-medium mb-2">{person.title}</p>
                      {person.bio && (
                        <p className="text-sm text-gray-600 mb-3">{person.bio}</p>
                      )}
                      <div className="space-y-1">
                        {person.email && (
                          <a 
                            href={`mailto:${person.email}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                          >
                            <Mail className="w-4 h-4" />
                            {person.email}
                          </a>
                        )}
                        {person.phone && (
                          <a 
                            href={`tel:${person.phone}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                          >
                            <Phone className="w-4 h-4" />
                            {person.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Focus Areas Tab */}
          <TabsContent value="focus-areas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Regulatory Focus Areas
                </CardTitle>
                <CardDescription>
                  Current priorities and areas of regulatory emphasis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.regulatoryFocusAreas.map((area, index) => {
                    const IconComponent = iconMap[area.icon] || FileCheck;
                    return (
                      <div 
                        key={index} 
                        className={`border-l-4 rounded-lg p-5 ${getPriorityBadge(area.priority)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold">{area.name}</h3>
                              <Badge variant="outline" className="text-xs capitalize">{area.priority}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{area.description}</p>
                            {area.recentActivity && (
                              <div className="text-xs bg-white/80 rounded p-2 text-gray-700">
                                <span className="font-medium">Recent:</span> {area.recentActivity}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enforcement Tab */}
          <TabsContent value="enforcement" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-blue-600" />
                  Recent Enforcement Actions
                </CardTitle>
                <CardDescription>
                  Recent regulatory enforcement actions and outcomes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {profile.enforcementActions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No recent enforcement actions to display.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile.enforcementActions.map((action) => (
                      <div key={action.id} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              {getEnforcementTypeBadge(action.type)}
                              {action.licenseeType && (
                                <Badge variant="outline">{action.licenseeType}</Badge>
                              )}
                            </div>
                            <h3 className="font-semibold text-lg">{action.title}</h3>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">{formatDate(action.date)}</div>
                            {action.amount && (
                              <div className="font-bold text-lg text-red-600">{formatCurrency(action.amount)}</div>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{action.description}</p>
                        {action.resolution && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <span className="font-medium text-gray-700">Resolution: </span>
                            <span className="text-gray-600">{action.resolution}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enforcement Statistics */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{profile.statistics.enforcementActionsYTD || 0}</div>
                      <div className="text-sm text-gray-500">Actions YTD</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(profile.statistics.totalFinesYTD || 0)}</div>
                      <div className="text-sm text-gray-500">Fines YTD</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Shield className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{profile.statistics.inspectionsYTD || 0}</div>
                      <div className="text-sm text-gray-500">Inspections YTD</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <FileCheck className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{profile.statistics.activeLicenses?.toLocaleString() || 0}</div>
                      <div className="text-sm text-gray-500">Active Licenses</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" />
                  Regulatory Timeline
                </CardTitle>
                <CardDescription>
                  History of significant regulatory changes and milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
                  
                  <div className="space-y-6">
                    {profile.regulatoryTimeline.map((event, index) => (
                      <div key={event.id} className="relative pl-12">
                        {/* Timeline dot */}
                        <div className={`absolute left-2 w-5 h-5 rounded-full border-4 border-white shadow ${
                          event.impact === 'high' ? 'bg-blue-600' : 
                          event.impact === 'medium' ? 'bg-amber-500' : 'bg-gray-400'
                        }`} />
                        
                        <div className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow">
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2">
                              {getTimelineTypeBadge(event.type)}
                              {getImpactBadge(event.impact)}
                            </div>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium">{formatDate(event.date)}</span>
                            </div>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{event.title}</h3>
                          <p className="text-gray-600">{event.description}</p>
                          {event.documentUrl && (
                            <a 
                              href={event.documentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 mt-3 text-blue-600 hover:underline text-sm"
                            >
                              View Document <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Other State Agencies */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Other State Agency Profiles</CardTitle>
            <CardDescription>Explore cannabis regulatory agencies in other states</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {allProfiles.filter(p => p.stateCode !== profile.stateCode).map(p => (
                <Link
                  key={p.stateCode}
                  to={`/states/${p.slug}/agency`}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-blue-50 hover:shadow-sm transition-all text-center"
                >
                  <div className="font-semibold text-gray-900">{p.stateCode}</div>
                  <div className="text-xs text-gray-500">{p.agency.acronym}</div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default StateAgencyProfile;
