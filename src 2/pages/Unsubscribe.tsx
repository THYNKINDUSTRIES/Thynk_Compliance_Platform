import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');
  const type = searchParams.get('type');
  const userId = searchParams.get('user');

  useEffect(() => {
    const unsubscribe = async () => {
      if (!token && !userId) {
        setStatus('error');
        setMessage('Invalid unsubscribe link.');
        return;
      }

      try {
        if (type === 'comment_reminders' && userId) {
          // Unsubscribe from comment reminders
          const { error } = await supabase
            .from('user_profiles')
            .update({ comment_reminders_enabled: false })
            .eq('id', userId);

          if (error) throw error;
          setMessage('You have been successfully unsubscribed from comment deadline reminders.');
        } else if (token) {
          // Unsubscribe from digest emails
          const { error } = await supabase
            .from('digest_subscriptions')
            .update({ is_active: false })
            .eq('unsubscribe_token', token);

          if (error) throw error;
          setMessage('You have been successfully unsubscribed from our digest emails.');
        } else {
          throw new Error('Invalid unsubscribe parameters');
        }

        setStatus('success');
      } catch (err) {
        console.error('Unsubscribe error:', err);
        setStatus('error');
        setMessage('Failed to unsubscribe. Please try again or contact support.');
      }
    };

    unsubscribe();
  }, [token, type, userId]);


  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#794108] mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing...</h1>
            <p className="text-gray-600">Please wait while we unsubscribe you.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribed Successfully</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/">
              <Button className="bg-[#794108] hover:bg-[#5a3006]">
                Return to Home
              </Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unsubscribe Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/">
              <Button className="bg-[#794108] hover:bg-[#5a3006]">
                Return to Home
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
