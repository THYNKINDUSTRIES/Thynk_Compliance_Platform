import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ContactForm } from '@/components/ContactForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, MessageSquare, DollarSign, HelpCircle, Clock, Globe } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function Contact() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('general');

  // Handle URL query parameter for tab selection (e.g., /contact?tab=sales)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['general', 'sales', 'pricing'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white py-16 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get in touch with our team. We're here to help with your regulatory compliance needs.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Mail className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Email</CardTitle>
              </CardHeader>
              <CardContent>
                <a href="mailto:support@thynk.guru" className="text-blue-600 hover:underline font-medium">
                  support@thynk.guru
                </a>
                <p className="text-sm text-gray-500 mt-1">General inquiries & support</p>

              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Phone className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Phone</CardTitle>
              </CardHeader>
              <CardContent>
                <a href="tel:+18009984965" className="text-green-600 hover:underline font-medium">
                  1 (800) 99-THYNK
                </a>
                <p className="text-sm text-gray-500 mt-1">Toll-free support</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Clock className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">Mon - Fri</p>
                <p className="text-sm text-gray-500">9:00 AM - 6:00 PM EST</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Globe className="h-8 w-8 text-orange-600 mb-2" />
                <CardTitle>Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">All 50 States + DC</p>
                <p className="text-sm text-gray-500">Federal regulations</p>
              </CardContent>
            </Card>
          </div>

          {/* Office Location */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <Card className="lg:col-span-1">
              <CardHeader>
                <MapPin className="h-8 w-8 text-red-600 mb-2" />
                <CardTitle>Our Office</CardTitle>
                <CardDescription>Visit us in person</CardDescription>
              </CardHeader>
              <CardContent>
                <address className="not-italic">
                  <p className="font-medium">Thynk Industries</p>
                  <p className="text-gray-600">123 Compliance Way</p>
                  <p className="text-gray-600">Suite 400</p>
                  <p className="text-gray-600">San Francisco, CA 94105</p>
                </address>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    <strong>Note:</strong> Visits by appointment only. Please contact us to schedule.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Map */}
            <Card className="lg:col-span-2">
              <CardContent className="p-0 h-full min-h-[300px] overflow-hidden rounded-lg">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d50470.85753665892!2d-122.44793814174228!3d37.77492950735534!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80859a6d00690021%3A0x4a501367f076adff!2sSan%20Francisco%2C%20CA!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: '300px' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Thynk Industries office location in San Francisco, CA"
                />
              </CardContent>
            </Card>
          </div>

          {/* Contact Forms */}
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
              <CardDescription>Choose the type of inquiry and fill out the form below. We typically respond within 24 hours.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">General</span>
                  </TabsTrigger>
                  <TabsTrigger value="sales" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="hidden sm:inline">Sales / Demo</span>
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span className="hidden sm:inline">Pricing</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6">
                  <ContactForm
                    formType="general"
                    description="Have a question? We'd love to hear from you."
                  />
                </TabsContent>

                <TabsContent value="sales" className="mt-6">
                  <ContactForm
                    formType="sales"
                    description="Interested in a demo of Thynk Compliance Platform? Let's schedule a call to show you how we can help your organization."
                  />
                </TabsContent>

                <TabsContent value="pricing" className="mt-6">
                  <ContactForm
                    formType="pricing"
                    description="Request detailed pricing information for your organization's needs."
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Additional Help Section */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-4">Looking for something else?</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/support" className="text-blue-600 hover:underline">Visit Support Center</a>
              <span className="text-gray-300">|</span>
              <a href="/api-monitoring" className="text-blue-600 hover:underline">API Documentation</a>
              <span className="text-gray-300">|</span>
              <a href="/dashboard" className="text-blue-600 hover:underline">View Dashboard</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
