import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const [stats, setStats] = useState({
    totalRegulations: 0,
    activeJurisdictions: 0,
    openComments: 0,
    upcomingDeadlines: 0,
    federalAgencies: 12,
    productCategories: 8,
    vettedProviders: 45,
    dailyUpdates: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Get total regulations count
        const { count: regCount } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true });
        
        // Get unique jurisdictions
        const { data: jurisdictions } = await supabase
          .from('jurisdiction')
          .select('id');
        
        // Get open comment periods (federal_register instruments have comment opportunities)
        const { count: openCount } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .eq('source', 'federal_register');
        
        // Get upcoming deadlines (effective_date in future)
        const { count: deadlineCount } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .not('effective_date', 'is', null)
          .gte('effective_date', new Date().toISOString());

        // Get today's updates
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        setStats({
          totalRegulations: regCount || 0,
          activeJurisdictions: jurisdictions?.length || 0,
          openComments: openCount || 0,
          upcomingDeadlines: deadlineCount || 0,
          federalAgencies: 12,
          productCategories: 8,
          vettedProviders: 45,
          dailyUpdates: todayCount || 0
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statsDisplay = [
    { label: 'Total Regulations Tracked', value: stats.totalRegulations, color: 'bg-[#794108]' },
    { label: 'Active Jurisdictions', value: stats.activeJurisdictions, color: 'bg-[#E89C5C]' },
    { label: 'Open Comment Periods', value: stats.openComments, color: 'bg-[#794108]' },
    { label: 'Upcoming Deadlines', value: stats.upcomingDeadlines, color: 'bg-[#E89C5C]' },
    { label: 'Federal Agencies', value: stats.federalAgencies, color: 'bg-[#794108]' },
    { label: 'Product Categories', value: stats.productCategories, color: 'bg-[#E89C5C]' },
    { label: 'Vetted Providers', value: stats.vettedProviders, color: 'bg-[#794108]' },
    { label: "Today's Updates", value: `${stats.dailyUpdates}+`, color: 'bg-[#E89C5C]' },
  ];

  return (
    <div className="bg-gradient-to-br from-[#794108] to-[#5a3006] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-white mb-8 text-center">
          Live Platform Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statsDisplay.map((stat, idx) => (
            <div 
              key={idx} 
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all border border-[#E89C5C]/30 cursor-pointer"
            >
              <div className="text-3xl font-bold text-[#E89C5C] mb-1">
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                ) : (
                  typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value
                )}
              </div>
              <div className="text-sm text-gray-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};