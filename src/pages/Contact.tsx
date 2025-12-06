import { useState } from 'react';
import { ContactForm } from '@/components/ContactForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, MessageSquare, DollarSign, HelpCircle } from 'lucide-react';

export default function Contact() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get in touch with our team. We're here to help with your regulatory compliance needs.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Mail className="h-8 w-8 text-black mb-2" />
              <CardTitle>Email</CardTitle>
            </CardHeader>
            <CardContent>
              <a href="mailto:Info@Thynk.Guru" className="text-black hover:underline">
                Info@Thynk.Guru

              </a>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Phone className="h-8 w-8 text-black mb-2" />
              <CardTitle>Phone</CardTitle>
            </CardHeader>
            <CardContent>
              <a href="tel:+18009984965" className="text-black hover:underline">
                1 (800) 99-THYNK
              </a>
            </CardContent>

          </Card>
          <Card>
            <CardHeader>
              <MapPin className="h-8 w-8 text-black mb-2" />
              <CardTitle>Address</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground">123 Compliance Way<br />San Francisco, CA 94105</p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Forms */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Send us a message</CardTitle>
            <CardDescription>Choose the type of inquiry and fill out the form below</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="general">
                  <HelpCircle className="h-4 w-4 mr-2" />
                  General
                </TabsTrigger>
                <TabsTrigger value="sales">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Sales
                </TabsTrigger>
                <TabsTrigger value="pricing">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pricing
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
                  description="Interested in Thynk Compliance Platform? Let's talk about how we can help your organization."
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
      </div>
    </div>
  );
}
