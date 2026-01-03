import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Bell, User, Trash2, Plus, BarChart3, Loader2, ExternalLink, MessageSquare, Send, RefreshCw } from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CommentTracker } from '@/components/CommentTracker';
import { BulkCommentSubmission } from '@/components/BulkCommentSubmission';
import { BatchSubmissionHistory } from '@/components/BatchSubmissionHistory';
import OnboardingModal from '@/components/OnboardingModal';

interface Favorite {
  id: string;
  regulation_id: string;
  title: string;
  created_at: string;
}

interface Alert {
  id: string;
  name: string;
  criteria: Record<string, unknown>;
  created_at: string;
  is_active: boolean;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, onboardingCompleted, completeOnboarding } = useAuth();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState({
    totalRegulations: 0,
    recentUpdates: 0,
    activeAlerts: 0
  });

  // Show onboarding modal if not completed
  useEffect(() => {
    if (user && !onboardingCompleted) {
      // Small delay to ensure page is rendered first
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, onboardingCompleted]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchFavorites();
      fetchAlerts();
    }
  }, [user]);

  const handleOnboardingComplete = async () => {
    setShowOnboarding(false);
    await completeOnboarding();
    toast({
      title: 'Welcome!',
      description: 'You\'re all set. Explore the dashboard to get started.'
    });
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch total regulations count
      const { count: regCount, error: regError } = await supabase
        .from('instrument')
        .select('*', { count: 'exact', head: true });
      
      if (regError) {
        console.error('[Dashboard] Error fetching regulation count:', regError);
      }
      
      // Fetch today's updates count
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount, error: todayError } = await supabase
        .from('instrument')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      if (todayError) {
        console.error('[Dashboard] Error fetching today count:', todayError);
      }

      // Fetch active alerts count for current user
      let alertCount = 0;
      if (user) {
        const { count, error: alertError } = await supabase
          .from('user_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_active', true);
        
        if (!alertError) {
          alertCount = count || 0;
        }
      }

      setStats({
        totalRegulations: regCount || 0,
        recentUpdates: todayCount || 0,
        activeAlerts: alertCount
      });

    } catch (err) {
      console.error('[Dashboard] Error fetching dashboard data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard statistics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!user) return;
    
    try {
      setFavoritesLoading(true);
      
      // Fetch user's favorites - use instrument_id (the correct column name)
      const { data, error } = await supabase
        .from('user_favorites')
        .select(`
          id,
          instrument_id,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Dashboard] Error fetching favorites:', error);
        // Don't throw - just set empty favorites
        setFavorites([]);
        return;
      }

      // Now fetch the instrument titles separately to avoid foreign key issues
      const formattedFavorites: Favorite[] = await Promise.all(
        (data || []).map(async (item) => {
          let title = `Regulation ${item.instrument_id}`;
          
          // Try to get the instrument title
          // Try to get the instrument title (may not exist; do not hard-fail)
          const { data: instrument, error: instError } = await supabase
         .from('instrument')
         .select('title')
         .eq('id', item.instrument_id)
         .maybeSingle();

       if (instError) {
        console.warn('[Dashboard] instrument title lookup failed:', instError);
}

if (instrument?.title) {
  title = instrument.title;
}

          
          return {
            id: item.id,
            regulation_id: item.instrument_id,
            title,
            created_at: item.created_at
          };
        })
      );

      setFavorites(formattedFavorites);
    } catch (err) {
      console.error('[Dashboard] Error:', err);
      setFavorites([]);
    } finally {
      setFavoritesLoading(false);
    }
  };


  const fetchAlerts = async () => {
    if (!user) return;
    
    try {
      setAlertsLoading(true);
      
      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Dashboard] Error fetching alerts:', error);
        throw error;
      }

      setAlerts(data || []);
    } catch (err) {
      console.error('[Dashboard] Error:', err);
      setAlerts([]);
    } finally {
      setAlertsLoading(false);
    }
  };

  const deleteFavorite = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.id !== id));
      toast({
        title: 'Removed',
        description: 'Regulation removed from favorites'
      });
    } catch (err) {
      console.error('[Dashboard] Error deleting favorite:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove favorite',
        variant: 'destructive'
      });
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setAlerts(alerts.filter(a => a.id !== id));
      setStats(prev => ({ ...prev, activeAlerts: Math.max(0, prev.activeAlerts - 1) }));
      toast({
        title: 'Deleted',
        description: 'Alert deleted successfully'
      });
    } catch (err) {
      console.error('[Dashboard] Error deleting alert:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete alert',
        variant: 'destructive'
      });
    }
  };

  const toggleAlertStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setAlerts(alerts.map(a => 
        a.id === id ? { ...a, is_active: !currentStatus } : a
      ));
      
      // Update active alerts count
      const newActiveCount = alerts.filter(a => 
        a.id === id ? !currentStatus : a.is_active
      ).length;
      setStats(prev => ({ ...prev, activeAlerts: newActiveCount }));

      toast({
        title: currentStatus ? 'Alert Paused' : 'Alert Activated',
        description: currentStatus ? 'You will no longer receive notifications' : 'You will now receive notifications'
      });
    } catch (err) {
      console.error('[Dashboard] Error toggling alert:', err);
      toast({
        title: 'Error',
        description: 'Failed to update alert',
        variant: 'destructive'
      });
    }
  };

  // Get user's name for onboarding
  const userName = profile?.full_name || user?.user_metadata?.full_name || undefined;

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#794108]">Dashboard</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                fetchDashboardData();
                fetchFavorites();
                fetchAlerts();
              }}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/analytics">
              <Button className="bg-[#794108] hover:bg-[#E89C5C] text-white">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-[#E5DFD6]">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-[#794108]">
                {loading ? <Loader2 className="animate-spin" /> : stats.totalRegulations.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 mt-1">Total Regulations</p>
            </CardContent>
          </Card>
          <Card className="border-[#E5DFD6]">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-[#794108]">
                {loading ? <Loader2 className="animate-spin" /> : stats.recentUpdates}
              </div>
              <p className="text-sm text-gray-600 mt-1">Today's Updates</p>
            </CardContent>
          </Card>
          <Card className="border-[#E5DFD6]">
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-[#794108]">
                {loading ? <Loader2 className="animate-spin" /> : stats.activeAlerts}
              </div>
              <p className="text-sm text-gray-600 mt-1">Active Alerts</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8">
            <TabsTrigger value="favorites"><Heart className="w-4 h-4 mr-2" />Favorites</TabsTrigger>
            <TabsTrigger value="comments"><MessageSquare className="w-4 h-4 mr-2" />Comments</TabsTrigger>
            <TabsTrigger value="bulk"><Send className="w-4 h-4 mr-2" />Bulk Submit</TabsTrigger>
            <TabsTrigger value="alerts"><Bell className="w-4 h-4 mr-2" />Alerts</TabsTrigger>
            <TabsTrigger value="profile"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
          </TabsList>


          <TabsContent value="comments">
            <CommentTracker />
          </TabsContent>

          <TabsContent value="bulk">
            <div className="space-y-6">
              <BulkCommentSubmission />
              <BatchSubmissionHistory />
            </div>
          </TabsContent>


          <TabsContent value="favorites">
            <Card>
              <CardHeader>
                <CardTitle>Saved Regulations</CardTitle>
              </CardHeader>
              <CardContent>
                {favoritesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No favorites yet. Browse regulations and click the heart icon to save them!</p>
                    <Button 
                      onClick={() => navigate('/app')}
                      className="bg-[#794108] hover:bg-[#E89C5C]"
                    >
                      Browse Regulations
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {favorites.map(fav => (
                      <div key={fav.id} className="flex justify-between items-center p-4 border border-[#E5DFD6] rounded-lg bg-white hover:shadow-md transition-shadow">
                        <div className="flex-1">
                          <p className="font-medium text-[#794108]">{fav.title}</p>
                          <p className="text-sm text-gray-500">Saved {new Date(fav.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/regulations/${fav.regulation_id}`)}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => deleteFavorite(fav.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Custom Alerts</CardTitle>
                <Link to="/alerts">
                  <Button className="bg-[#794108] hover:bg-[#E89C5C]">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Alert
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No alerts configured. Create alerts to get notified about relevant regulations!</p>
                    <Button 
                      onClick={() => navigate('/alerts')}
                      className="bg-[#794108] hover:bg-[#E89C5C]"
                    >
                      Create Your First Alert
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alerts.map(alert => (
                      <div key={alert.id} className="p-4 border border-[#E5DFD6] rounded-lg bg-white">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-[#794108]">{alert.name}</p>
                              <span className={`text-xs px-2 py-0.5 rounded ${alert.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {alert.is_active ? 'Active' : 'Paused'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">Created {new Date(alert.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => toggleAlertStatus(alert.id, alert.is_active)}
                            >
                              {alert.is_active ? 'Pause' : 'Activate'}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteAlert(alert.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => navigate('/settings')}
                    variant="outline"
                    className="justify-start"
                  >
                    Notification Settings
                  </Button>
                  <Button 
                    onClick={() => navigate('/api-monitoring')}
                    variant="outline"
                    className="justify-start"
                  >
                    API Monitoring
                  </Button>
                  <Button 
                    onClick={() => navigate('/workflows')}
                    variant="outline"
                    className="justify-start"
                  >
                    Workflow Management
                  </Button>
                  <Button 
                    onClick={() => navigate('/checklists')}
                    variant="outline"
                    className="justify-start"
                  >
                    Compliance Checklists
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />

      {/* Onboarding Modal - only shown on Dashboard for new users */}
      <OnboardingModal 
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        userName={userName}
      />
    </div>
  );
}
