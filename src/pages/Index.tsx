
import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AppLayout from '@/components/AppLayout';
import { toast } from '@/hooks/use-toast';

const Index: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshProfile, isPaidUser } = useAuth();
  const pollRef = useRef(false);

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success' && !pollRef.current) {
      pollRef.current = true;
      toast({ title: 'Payment successful!', description: 'Your subscription is now active. Welcome to ThynkFlow Pro!' });
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });

      // Poll refreshProfile to pick up webhook-updated subscription_status.
      // Stripe webhook may take a few seconds to fire after redirect.
      let attempts = 0;
      const poll = async () => {
        while (attempts < 6) {
          attempts++;
          await refreshProfile();
          // If profile now shows 'active' (isPaidUser), stop polling
          // Give webhook time — wait 3s between attempts
          await new Promise(r => setTimeout(r, 3000));
        }
      };
      poll();
    } else if (checkout === 'cancel') {
      toast({ title: 'Checkout cancelled', description: 'No payment was made. You can upgrade anytime from your profile.', variant: 'destructive' });
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshProfile, isPaidUser]);

  return <AppLayout />;
};

export default Index;
