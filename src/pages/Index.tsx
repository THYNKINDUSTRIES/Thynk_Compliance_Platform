
import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import { toast } from '@/hooks/use-toast';

const Index: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (checkout === 'success') {
      toast({ title: 'Payment successful!', description: 'Your subscription is now active. Welcome to ThynkFlow Pro!' });
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    } else if (checkout === 'cancel') {
      toast({ title: 'Checkout cancelled', description: 'No payment was made. You can upgrade anytime from your profile.', variant: 'destructive' });
      searchParams.delete('checkout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return <AppLayout />;
};

export default Index;
