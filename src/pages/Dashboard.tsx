import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Bell, User, Trash2, Plus, BarChart3, Loader2, ExternalLink, MessageSquare, Send } from 'lucide-react';

import { Link, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { CommentTracker } from '@/components/CommentTracker';
import { BulkCommentSubmission } from '@/components/BulkCommentSubmission';
import { BatchSubmissionHistory } from '@/components/BatchSubmissionHistory';




export default function Dashboard() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRegulations: 0,
    recentUpdates: 0,
    activeAlerts: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch some basic stats
      const { count: regCount } = await supabase
        .from('instrument')
        .select('*', { count: 'exact', head: true });
      
      const today = new Date().toISOString().split('T')[0];
      const { count: todayCount } = await supabase
        .from('instrument')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      setStats({
        totalRegulations: regCount || 0,
        recentUpdates: todayCount || 0,
        activeAlerts: 0
      });

      // Mock favorites for demo
      setFavorites([
        { id: '1', regulation_id: 'CA-2024-001', title: 'California Hemp Regulations', created_at: new Date().toISOString() },
        { id: '2', regulation_id: 'NY-2024-002', title: 'New York CBD Guidelines', created_at: new Date().toISOString() }
      ]);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteFavorite = (id: string) => {
    setFavorites(favorites.filter(f => f.id !== id));
    toast({
      title: 'Removed',
      description: 'Regulation removed from favorites'
    });
  };

  const deleteAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
    toast({
      title: 'Deleted',
      description: 'Alert deleted successfully'
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5]">
      <Header />
      <div className="container mx-auto px-4 py-8 mt-20">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-[#794108]">Dashboard</h1>
          <Link to="/analytics">
            <Button className="bg-[#794108] hover:bg-[#E89C5C] text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </Link>
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
                {stats.activeAlerts}
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
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No favorites yet. Browse regulations and click the heart icon to save them!</p>
                    <Button 
                      onClick={() => navigate('/')}
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
                          <p className="font-medium text-[#794108]">{fav.title || fav.regulation_id}</p>
                          <p className="text-sm text-gray-500">Saved {new Date(fav.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate(`/regulation/${fav.regulation_id}`)}
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
                {alerts.length === 0 ? (
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
                          <div>
                            <p className="font-medium text-[#794108]">{alert.name}</p>
                            <p className="text-sm text-gray-500">Created {new Date(alert.created_at).toLocaleDateString()}</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteAlert(alert.id)}
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
                    onClick={() => navigate('/compliance-checklists')}
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
    </div>
  );
}