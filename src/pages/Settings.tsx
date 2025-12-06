import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Mail } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DigestTestButton from '@/components/DigestTestButton';
import DigestMonitoring from '@/components/DigestMonitoring';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function Settings() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      <div className="container mx-auto py-8 px-4 max-w-4xl mt-20">
        <h1 className="text-3xl font-bold mb-8 text-[#794108]">Settings</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <SettingsIcon className="h-6 w-6 text-[#794108]" />
                <div>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>
                    Configure your application preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Settings are managed at the system level.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-[#794108]" />
                <div>
                  <CardTitle>Email Digest System</CardTitle>
                  <CardDescription>
                    Manage and monitor automated digest emails
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="test" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="test">Test Digest</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>
                
                <TabsContent value="test" className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Manually trigger digest emails for testing. This will send emails to all active 
                    subscribers with matching regulations from the selected time period.
                  </p>
                  <DigestTestButton />
                </TabsContent>
                
                <TabsContent value="monitoring">
                  <DigestMonitoring />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

        </div>
      </div>
      <Footer />
    </div>
  );
}
