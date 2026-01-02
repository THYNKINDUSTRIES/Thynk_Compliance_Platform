import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, Settings, Shield, BarChart3, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
  timestamp: string;
}

const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true, // Always required
  analytics: false,
  marketing: false,
  preferences: false,
  timestamp: '',
};

const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

export const getCookiePreferences = (): CookiePreferences | null => {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading cookie preferences:', e);
  }
  return null;
};

export const setCookiePreferences = (preferences: CookiePreferences): void => {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.error('Error saving cookie preferences:', e);
  }
};

export const clearCookiePreferences = (): void => {
  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch (e) {
    console.error('Error clearing cookie preferences:', e);
  }
};

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    // Check if user has already made a choice
    const existingPreferences = getCookiePreferences();
    if (!existingPreferences) {
      // Show banner after a short delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
      timestamp: new Date().toISOString(),
    };
    setCookiePreferences(allAccepted);
    setIsVisible(false);
  };

  const handleRejectNonEssential = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
      timestamp: new Date().toISOString(),
    };
    setCookiePreferences(essentialOnly);
    setIsVisible(false);
  };

  const handleSaveCustom = () => {
    const customPreferences: CookiePreferences = {
      ...preferences,
      essential: true, // Always required
      timestamp: new Date().toISOString(),
    };
    setCookiePreferences(customPreferences);
    setIsVisible(false);
  };

  const togglePreference = (key: keyof Omit<CookiePreferences, 'essential' | 'timestamp'>) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Main Banner */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="hidden sm:flex items-center justify-center w-12 h-12 bg-[#794108]/10 rounded-full flex-shrink-0">
                <Cookie className="h-6 w-6 text-[#794108]" />
              </div>
              
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  We Value Your Privacy
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. 
                  By clicking "Accept All", you consent to our use of cookies. You can customize your preferences 
                  or reject non-essential cookies. Read our{' '}
                  <Link to="/privacy" className="text-[#794108] hover:underline font-medium">
                    Privacy Policy
                  </Link>{' '}
                  for more information.
                </p>

                {/* Customize Panel */}
                {showCustomize && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Customize Cookie Preferences</h4>
                    
                    <div className="space-y-4">
                      {/* Essential Cookies */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Shield className="h-5 w-5 text-green-600" />
                          <div>
                            <Label className="font-medium text-gray-900">Essential Cookies</Label>
                            <p className="text-xs text-gray-500">Required for the website to function properly</p>
                          </div>
                        </div>
                        <Switch checked={true} disabled className="opacity-50" />
                      </div>

                      {/* Analytics Cookies */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BarChart3 className="h-5 w-5 text-blue-600" />
                          <div>
                            <Label className="font-medium text-gray-900">Analytics Cookies</Label>
                            <p className="text-xs text-gray-500">Help us understand how visitors use our site</p>
                          </div>
                        </div>
                        <Switch 
                          checked={preferences.analytics} 
                          onCheckedChange={() => togglePreference('analytics')}
                        />
                      </div>

                      {/* Marketing Cookies */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-purple-600" />
                          <div>
                            <Label className="font-medium text-gray-900">Marketing Cookies</Label>
                            <p className="text-xs text-gray-500">Used to deliver relevant advertisements</p>
                          </div>
                        </div>
                        <Switch 
                          checked={preferences.marketing} 
                          onCheckedChange={() => togglePreference('marketing')}
                        />
                      </div>

                      {/* Preference Cookies */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Settings className="h-5 w-5 text-orange-600" />
                          <div>
                            <Label className="font-medium text-gray-900">Preference Cookies</Label>
                            <p className="text-xs text-gray-500">Remember your settings and preferences</p>
                          </div>
                        </div>
                        <Switch 
                          checked={preferences.preferences} 
                          onCheckedChange={() => togglePreference('preferences')}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleAcceptAll}
                    className="bg-[#794108] hover:bg-[#5a3006] text-white"
                  >
                    Accept All
                  </Button>
                  <Button
                    onClick={handleRejectNonEssential}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50"
                  >
                    Reject Non-Essential
                  </Button>
                  {showCustomize ? (
                    <Button
                      onClick={handleSaveCustom}
                      variant="outline"
                      className="border-[#794108] text-[#794108] hover:bg-[#794108]/5"
                    >
                      Save Preferences
                    </Button>
                  ) : (
                    <Button
                      onClick={() => setShowCustomize(true)}
                      variant="ghost"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Customize
                    </Button>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleRejectNonEssential}
                className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                aria-label="Close cookie banner"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
