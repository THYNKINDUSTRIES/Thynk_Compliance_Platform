import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings as SettingsIcon, Mail, Cookie, Shield, BarChart3, Target, RefreshCw, Check, Database } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DigestTestButton from '@/components/DigestTestButton';
import DigestMonitoring from '@/components/DigestMonitoring';
import RLSTestPanel from '@/components/RLSTestPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getCookiePreferences, clearCookiePreferences, CookiePreferences } from '@/components/CookieConsent';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [cookiePrefs, setCookiePrefs] = useState<CookiePreferences | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setCookiePrefs(getCookiePreferences());
  }, []);

  const handleResetCookiePreferences = () => {
    clearCookiePreferences();
    setCookiePrefs(null);
    setResetSuccess(true);
    toast({
      title: "Cookie preferences reset",
      description: "The cookie consent banner will appear on your next page visit.",
    });
    
    // Reset the success state after 3 seconds
    setTimeout(() => {
      setResetSuccess(false);
    }, 3000);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

          {/* RLS Test Panel */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-[#794108]" />
                <div>
                  <CardTitle>Database Security (RLS)</CardTitle>
                  <CardDescription>
                    Test Row Level Security policies and data isolation
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RLSTestPanel />
            </CardContent>
          </Card>

          {/* Cookie Preferences Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Cookie className="h-6 w-6 text-[#794108]" />
                <div>
                  <CardTitle>Cookie Preferences</CardTitle>
                  <CardDescription>
                    Manage your cookie consent settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cookiePrefs ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Current Cookie Settings</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">Essential</span>
                        <Badge variant="secondary" className="ml-auto bg-green-100 text-green-800">
                          Always On
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">Analytics</span>
                        <Badge 
                          variant="secondary" 
                          className={`ml-auto ${cookiePrefs.analytics ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {cookiePrefs.analytics ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-700">Marketing</span>
                        <Badge 
                          variant="secondary" 
                          className={`ml-auto ${cookiePrefs.marketing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {cookiePrefs.marketing ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <SettingsIcon className="h-4 w-4 text-orange-600" />
                        <span className="text-sm text-gray-700">Preferences</span>
                        <Badge 
                          variant="secondary" 
                          className={`ml-auto ${cookiePrefs.preferences ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {cookiePrefs.preferences ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Consent given on: {formatDate(cookiePrefs.timestamp)}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Reset your cookie preferences to see the consent banner again.
                    </p>
                    <Button
                      onClick={handleResetCookiePreferences}
                      variant="outline"
                      className="border-[#794108] text-[#794108] hover:bg-[#794108]/5"
                      disabled={resetSuccess}
                    >
                      {resetSuccess ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Reset Complete
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset Preferences
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Cookie className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">No cookie preferences set</p>
                  <p className="text-sm text-gray-500">
                    The cookie consent banner will appear when you visit the site.
                  </p>
                </div>
              )}
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
