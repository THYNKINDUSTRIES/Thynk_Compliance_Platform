import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle2, Map, Rss, Code2, Building2, ArrowRight } from "lucide-react";
import { LegalSection, OperatorsSection, HowItWorksSection } from "@/components/InformationSections";
import { PricingSection } from "@/components/PricingSection";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getAllAgencyProfiles } from "@/data/stateAgencyProfiles";

const Information = () => {
  const navigate = useNavigate();
  const agencyProfiles = getAllAgencyProfiles();

  return (
    <>
      <Header />
      <div className="min-h-screen bg-white">
      <section className="relative bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <img src="https://d64gsuwffb70l.cloudfront.net/68e42b7c18ef6418b07aa13a_1763228823568_7c94bfd5.png" alt="Thynk Industries" className="h-20 mx-auto mb-6" />
          <h1 className="text-5xl font-bold mb-4">Thynk Compliance Platform for Alternative Wellness</h1>
          <p className="text-xl mb-8 text-gray-300">Real-time regulatory intelligence for hemp, cannabinoids, kratom, psychedelics, nicotine/vapes, and more—built for legal, compliance, and operations teams who can't afford to be wrong.</p>
          <div className="flex gap-4 justify-center mb-4">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200">Book a Demo</Button>
            <Button size="lg" variant="outline" className="border-white text-black hover:bg-white/10" onClick={() => navigate('/dashboard')}>Explore the Map</Button>
          </div>
          <p className="text-sm text-gray-400">Track federal and state regulations across all 50 states + DC, by product category and supply chain stage.</p>
        </div>
      </section>

      <section className="py-12 px-4 bg-gray-50 border-b">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-semibold text-gray-600 mb-6">Built by the team behind some of the most complex hemp and cannabinoid regulations in the U.S.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-center">15+ years in hemp, cannabis, kratom, and psychedelics</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-center">Advised 47+ government agencies</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-center">100% DEA license application success rate</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-center">Hundreds of licenses issued</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-center">Over 200 seized packages returned</span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-lg shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              <span className="text-sm font-medium text-center">Over $200M in annual business growth for clients</span>
            </div>
          </div>
        </div>
      </section>


      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Regulations Change Faster Than Your Team Can Track Them</h2>
          <p className="text-lg mb-6 text-gray-700">Alternative wellness operators, law firms, and compliance teams are drowning in fragmented, fast-changing rules. Every new law, emergency rule, or enforcement action creates risk:</p>
          <ul className="space-y-3 mb-6">
            <li className="flex items-start gap-2"><span className="text-red-600 font-bold">•</span><span>Conflicting state and federal requirements</span></li>
            <li className="flex items-start gap-2"><span className="text-red-600 font-bold">•</span><span>Hours of manual research for each client or product launch</span></li>
            <li className="flex items-start gap-2"><span className="text-red-600 font-bold">•</span><span>High stakes: recalls, license loss, and enforcement actions</span></li>
          </ul>
          <p className="text-lg font-semibold text-center text-black">TCP turns this chaos into a single, searchable source of truth.</p>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">Your Single Source of Truth for Hemp, Cannabinoid, Kratom, and Psychedelic Regulations</h2>
          <p className="text-lg mb-12 text-center text-gray-700 max-w-4xl mx-auto">TCP centralizes regulatory data across 50 states + DC for hemp, cannabinoids, kratom, psychedelics, nicotine/vapes, and kava. Search by product, state, supply chain stage, and instrument type to get clear, actionable answers in seconds.</p>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow"><Map className="w-12 h-12 text-black mb-4" /><h3 className="text-xl font-bold mb-2">U.S. Regulatory Map</h3><p className="text-gray-600">Click any state to see current laws, rules, and guidance by product category and supply chain stage.</p></Card>
            <Card className="p-6 hover:shadow-lg transition-shadow"><Rss className="w-12 h-12 text-black mb-4" /><h3 className="text-xl font-bold mb-2">Regulatory Feed</h3><p className="text-gray-600">Monitor new bills, rules, and enforcement actions with filters for product type, jurisdiction, and more.</p></Card>
            <Card className="p-6 hover:shadow-lg transition-shadow"><Code2 className="w-12 h-12 text-black mb-4" /><h3 className="text-xl font-bold mb-2">API Access</h3><p className="text-gray-600">Integrate TCP data directly into your internal tools, client dashboards, or compliance workflows.</p></Card>
          </div>
        </div>
      </section>

      {/* State Agency Profiles Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              <Building2 className="w-4 h-4" />
              State Agency Profiles
            </div>
            <h2 className="text-3xl font-bold mb-4">Direct Access to State Cannabis Regulatory Agencies</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Get comprehensive information about each state's cannabis regulatory agency including contact details, 
              key personnel, enforcement actions, and regulatory timelines.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {agencyProfiles.map((profile) => (
              <Link 
                key={profile.stateCode}
                to={`/states/${profile.slug}/agency`}
                className="group bg-white border rounded-xl p-6 hover:shadow-lg hover:border-blue-300 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white font-bold text-lg">
                    {profile.stateCode}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                      {profile.stateName}
                    </h3>
                    <p className="text-sm text-gray-500 mb-2">{profile.agency.acronym}</p>
                    <p className="text-sm text-gray-600 line-clamp-2">{profile.agency.name}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-blue-600">{profile.statistics.activeLicenses?.toLocaleString() || '-'}</div>
                    <div className="text-xs text-gray-500">Active Licenses</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-red-600">{profile.statistics.enforcementActionsYTD || '-'}</div>
                    <div className="text-xs text-gray-500">Enforcement YTD</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-gray-600 mb-4">More state agency profiles coming soon. Currently covering major cannabis markets.</p>
            <Button variant="outline" onClick={() => navigate('/app')}>
              Explore All States <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <LegalSection />
      <OperatorsSection />
      <HowItWorksSection />
      <PricingSection />

      <section className="py-16 px-4 bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-gray-300">Join legal and compliance teams who trust TCP for regulatory intelligence.</p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200">Book a Demo</Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate('/dashboard')}>Start Exploring</Button>
          </div>
        </div>
      </section>

      </div>
      <Footer />
    </>
  );
};

export default Information;
