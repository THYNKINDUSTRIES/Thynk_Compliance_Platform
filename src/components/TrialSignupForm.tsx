import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CreditCard, Shield, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { initFingerprint, handleTrialSignup } from '@/lib/trialSystem';

// Available jurisdictions for trial selection
const JURISDICTIONS = [
  { code: 'CO', name: 'Colorado' },
  { code: 'AK', name: 'Alaska' },
  { code: 'OR', name: 'Oregon' },
  { code: 'CA', name: 'California' },
  { code: 'WA', name: 'Washington' },
  { code: 'NV', name: 'Nevada' },
];

export const TrialSignupForm = () => {
  const [email, setEmail] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fingerprintLoaded, setFingerprintLoaded] = useState(false);

  useEffect(() => {
    // Initialize FingerprintJS
    initFingerprint().then(() => {
      setFingerprintLoaded(true);
    }).catch(err => {
      console.error('Fingerprint init error:', err);
      setError('Failed to initialize security features. Please refresh and try again.');
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedJurisdiction) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await handleTrialSignup(email, selectedJurisdiction);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-xl text-green-800">Trial Activated!</CardTitle>
          <CardDescription>
            Welcome to THYNKFLOW. Your 3-day trial has started.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button onClick={() => window.location.href = '/app'} className="w-full">
            Enter THYNKFLOW
          </Button>
          <p className="text-sm text-gray-600">
            No charges will be made unless you choose to continue after the trial.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Preview THYNKFLOW</h1>
        <p className="text-gray-600">
          Experience how professionals stay compliant — without compromising sensitive regulatory intelligence.
        </p>
        <Badge variant="outline" className="mt-2">
          <Clock className="h-3 w-3 mr-1" />
          3-day free trial
        </Badge>
      </div>

      {/* Disclaimer */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          THYNKFLOW trial access is intentionally limited to protect proprietary compliance methodologies and ensure data integrity across the platform.
        </AlertDescription>
      </Alert>

      {/* Trial Features */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trial Access Includes:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">Platform navigation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">Limited regulatory snapshots</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">One jurisdiction only</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">Read-only summaries</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm">Time-delayed updates (24–48 hours old)</span>
          </div>
        </CardContent>
      </Card>

      {/* Signup Form */}
      <Card>
        <CardHeader>
          <CardTitle>Start Your Trial</CardTitle>
          <CardDescription>
            Trial access requires a valid payment method. No charge if canceled before the trial ends.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="jurisdiction">Select Jurisdiction</Label>
              <Select value={selectedJurisdiction} onValueChange={setSelectedJurisdiction}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your primary jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map((jurisdiction) => (
                    <SelectItem key={jurisdiction.code} value={jurisdiction.code}>
                      {jurisdiction.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stripe Elements will be mounted here */}
            <div id="payment-element" className="min-h-[200px] p-4 border rounded-lg bg-gray-50" />

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !fingerprintLoaded}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting Trial...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Start Free Trial
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500">
        By starting your trial, you agree to our Terms of Service and Privacy Policy.
      </p>
    </div>
  );
};