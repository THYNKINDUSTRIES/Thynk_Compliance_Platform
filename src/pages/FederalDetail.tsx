import { useState } from 'react';
import { ArrowLeft, Calendar, AlertCircle, FileText, Building2, Phone } from 'lucide-react';

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



export default function FederalDetail() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(federalAgencyContacts[0]);


  const filteredRegulations = selectedCategory === 'all'
    ? federalData.regulations
    : federalData.regulations.filter(reg => reg.category === selectedCategory);

  const categories = ['all', 'licensing', 'testing', 'packaging', 'compliance'];

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
                {federalData.stats.activeRegulations} Active Regulations
              </Badge>
              <Badge variant="outline" className="bg-blue-50">
                Last Updated: {new Date(federalData.lastUpdated).toLocaleDateString()}
              </Badge>
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
                    {cat}
                  </Button>
                ))}
              </div>
              <div className="grid gap-6">
                {filteredRegulations.map(regulation => (
                  <FederalRegulationCard key={regulation.id} regulation={regulation} />

                ))}
              </div>
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

