import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, TrendingUp, Database, Clock, Activity } from 'lucide-react';
import { Card } from './ui/card';

export const EnhancedStatsSection: React.FC = () => {
  const [stats, setStats] = useState({
    totalRegulations: 0,
    activeJurisdictions: 0,
    openComments: 0,
    upcomingDeadlines: 0,
    federalDocuments: 0,
    stateDocuments: 0,
    todayUpdates: 0,
    weekUpdates: 0,
    apiCallsToday: 0,
    lastPollerRun: null as string | null,
    avgResponseTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Total regulations
        const { count: regCount } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true });
        
        // Jurisdictions
        const { data: jurisdictions } = await supabase
          .from('jurisdiction')
          .select('id');
        
        // Open comments
        const { count: openCount } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'open');
        
        // Upcoming deadlines
        const { count: deadlineCount } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .gte('effective_at', new Date().toISOString());

        // Federal vs State breakdown
        const { count: federalCount } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .eq('jurisdiction_id', '00000000-0000-0000-0000-000000000001');

        const stateCount = (regCount || 0) - (federalCount || 0);

        // Today's updates
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', today);

        // Week's updates
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const { count: weekCount } = await supabase
          .from('instrument')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', weekAgo.toISOString());

        // API metrics
        const { count: apiCount } = await supabase
          .from('api_metrics')
          .select('*', { count: 'exact', head: true })
          .gte('timestamp', today);

        // Last poller run
        const { data: lastJob } = await supabase
          .from('job_execution_log')
          .select('completed_at, execution_time_ms')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();

        setStats({
          totalRegulations: regCount || 0,
          activeJurisdictions: jurisdictions?.length || 0,
          openComments: openCount || 0,
          upcomingDeadlines: deadlineCount || 0,
          federalDocuments: federalCount || 0,
          stateDocuments: stateCount,
          todayUpdates: todayCount || 0,
          weekUpdates: weekCount || 0,
          apiCallsToday: apiCount || 0,
          lastPollerRun: lastJob?.completed_at || null,
          avgResponseTime: lastJob?.execution_time_ms || 0
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#794108] to-[#5a3006] py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-serif font-bold text-white mb-8 text-center">
          Live Platform Statistics
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Database className="w-6 h-6" />}
            value={stats.totalRegulations}
            label="Total Regulations"
            loading={loading}
          />
          <StatCard
            icon={<Activity className="w-6 h-6" />}
            value={stats.activeJurisdictions}
            label="Active Jurisdictions"
            loading={loading}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            value={stats.openComments}
            label="Open Comments"
            loading={loading}
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            value={stats.upcomingDeadlines}
            label="Upcoming Deadlines"
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            value={stats.federalDocuments}
            label="Federal Documents"
            loading={loading}
            small
          />
          <StatCard
            value={stats.stateDocuments}
            label="State Documents"
            loading={loading}
            small
          />
          <StatCard
            value={stats.todayUpdates}
            label="Today's Updates"
            loading={loading}
            small
          />
          <StatCard
            value={stats.weekUpdates}
            label="This Week"
            loading={loading}
            small
          />
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon?: React.ReactNode;
  value: number;
  label: string;
  loading: boolean;
  small?: boolean;
}> = ({ icon, value, label, loading, small }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center hover:bg-white/20 transition-all border border-[#E89C5C]/30">
    {icon && <div className="text-[#E89C5C] mb-2 flex justify-center">{icon}</div>}
    <div className={`${small ? 'text-2xl' : 'text-3xl'} font-bold text-[#E89C5C] mb-1`}>
      {loading ? <Loader2 className="animate-spin mx-auto w-6 h-6" /> : value.toLocaleString()}
    </div>
    <div className="text-sm text-gray-100">{label}</div>
  </div>
);