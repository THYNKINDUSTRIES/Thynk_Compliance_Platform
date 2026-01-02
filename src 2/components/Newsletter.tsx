import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('digest_subscriptions')
        .insert([{ email, frequency }]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('This email is already subscribed.');
        } else {
          throw insertError;
        }
      } else {
        setSubscribed(true);
        setTimeout(() => {
          setSubscribed(false);
          setEmail('');
        }, 5000);
      }
    } catch (err) {
      console.error('Subscription error:', err);
      setError('Failed to subscribe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#794108] to-[#5a3006] py-12 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-serif font-bold text-white mb-4">Stay Informed</h2>
        <p className="text-[#E89C5C] mb-6">
          Get regulatory updates and compliance alerts delivered to your inbox
        </p>
        
        {subscribed ? (
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg inline-block">
            Successfully subscribed! You'll receive your first digest soon.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-3 mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={loading}
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E89C5C]"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-[#E89C5C] hover:bg-[#d88a4a] text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? 'Subscribing...' : 'Subscribe'}
              </button>
            </div>
            <div className="flex justify-center gap-4 mb-2">
              <label className="flex items-center text-white cursor-pointer">
                <input
                  type="radio"
                  value="daily"
                  checked={frequency === 'daily'}
                  onChange={(e) => setFrequency(e.target.value as 'daily')}
                  className="mr-2"
                />
                Daily Digest
              </label>
              <label className="flex items-center text-white cursor-pointer">
                <input
                  type="radio"
                  value="weekly"
                  checked={frequency === 'weekly'}
                  onChange={(e) => setFrequency(e.target.value as 'weekly')}
                  className="mr-2"
                />
                Weekly Digest
              </label>
            </div>
            {error && (
              <p className="text-red-300 text-sm mb-2">{error}</p>
            )}
          </form>
        )}
        
        <p className="text-gray-200 text-sm mt-4">
          Join 10,000+ compliance professionals. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
};
