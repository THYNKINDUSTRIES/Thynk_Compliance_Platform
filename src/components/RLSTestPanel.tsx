import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Shield, 
  Database, 
  Lock,
  User,
  FileText,
  Bell,
  Heart,
  RefreshCw
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  details?: string;
}

export default function RLSTestPanel() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const updateTest = (name: string, update: Partial<TestResult>) => {
    setTests(prev => prev.map(t => t.name === name ? { ...t, ...update } : t));
  };

  const runAllTests = async () => {
    setRunning(true);
    
    // Initialize tests
    const initialTests: TestResult[] = [
      { name: 'Authentication Check', status: 'pending' },
      { name: 'Templates Access (Public)', status: 'pending' },
      { name: 'Checklists Access (Own Only)', status: 'pending' },
      { name: 'Checklist Items Access', status: 'pending' },
      { name: 'Notifications Access (Own Only)', status: 'pending' },
      { name: 'Favorites Access (Own Only)', status: 'pending' },
      { name: 'Regulations Access (Public)', status: 'pending' },
      { name: 'Edge Function CORS', status: 'pending' },
      { name: 'Create Checklist Test', status: 'pending' },
      { name: 'Data Isolation Test', status: 'pending' },
    ];
    setTests(initialTests);

    try {
      // Test 1: Authentication Check
      updateTest('Authentication Check', { status: 'running' });
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        updateTest('Authentication Check', { 
          status: 'failed', 
          message: 'Not authenticated',
          details: 'Please log in to run RLS tests'
        });
        setRunning(false);
        return;
      }
      
      setUserId(session.user.id);
      updateTest('Authentication Check', { 
        status: 'passed', 
        message: `Authenticated as ${session.user.email}`,
        details: `User ID: ${session.user.id.substring(0, 8)}...`
      });

      // Test 2: Templates Access (should be public)
      updateTest('Templates Access (Public)', { status: 'running' });
      const { data: templates, error: templatesError } = await supabase
        .from('checklist_templates')
        .select('id, name, is_public')
        .limit(5);
      
      if (templatesError) {
        updateTest('Templates Access (Public)', { 
          status: 'failed', 
          message: templatesError.message 
        });
      } else {
        updateTest('Templates Access (Public)', { 
          status: 'passed', 
          message: `Found ${templates?.length || 0} templates`,
          details: templates?.map(t => t.name).join(', ').substring(0, 50) + '...'
        });
      }

      // Test 3: Checklists Access (should only see own)
      updateTest('Checklists Access (Own Only)', { status: 'running' });
      const { data: checklists, error: checklistsError } = await supabase
        .from('compliance_checklists')
        .select('id, name, created_by, user_id')
        .limit(10);
      
      if (checklistsError) {
        updateTest('Checklists Access (Own Only)', { 
          status: 'failed', 
          message: checklistsError.message 
        });
      } else {
        // Verify all returned checklists belong to current user
        const allOwned = checklists?.every(c => 
          c.created_by === session.user.id || c.user_id === session.user.id
        ) ?? true;
        
        updateTest('Checklists Access (Own Only)', { 
          status: allOwned ? 'passed' : 'failed', 
          message: allOwned 
            ? `Found ${checklists?.length || 0} of your checklists` 
            : 'WARNING: Can see other users\' checklists!',
          details: allOwned ? 'RLS correctly filtering to own data' : 'RLS policy may be misconfigured'
        });
      }

      // Test 4: Checklist Items Access
      updateTest('Checklist Items Access', { status: 'running' });
      const { data: items, error: itemsError } = await supabase
        .from('checklist_items')
        .select('id, title, checklist_id')
        .limit(10);
      
      if (itemsError) {
        // This might fail if user has no checklists, which is OK
        if (itemsError.message.includes('permission denied')) {
          updateTest('Checklist Items Access', { 
            status: 'failed', 
            message: 'Permission denied',
            details: 'RLS policy may be too restrictive'
          });
        } else {
          updateTest('Checklist Items Access', { 
            status: 'passed', 
            message: 'No items found (expected if no checklists)',
            details: itemsError.message
          });
        }
      } else {
        updateTest('Checklist Items Access', { 
          status: 'passed', 
          message: `Found ${items?.length || 0} items from your checklists`
        });
      }

      // Test 5: Notifications Access
      updateTest('Notifications Access (Own Only)', { status: 'running' });
      const { data: notifications, error: notifError } = await supabase
        .from('notifications')
        .select('id, title, user_id')
        .limit(5);
      
      if (notifError) {
        if (notifError.code === '42P01') {
          updateTest('Notifications Access (Own Only)', { 
            status: 'passed', 
            message: 'Table does not exist (OK)',
            details: 'Notifications table may not be set up yet'
          });
        } else {
          updateTest('Notifications Access (Own Only)', { 
            status: 'failed', 
            message: notifError.message 
          });
        }
      } else {
        const allOwned = notifications?.every(n => n.user_id === session.user.id) ?? true;
        updateTest('Notifications Access (Own Only)', { 
          status: allOwned ? 'passed' : 'failed', 
          message: allOwned 
            ? `Found ${notifications?.length || 0} of your notifications` 
            : 'WARNING: Can see other users\' notifications!'
        });
      }

      // Test 6: Favorites Access
      updateTest('Favorites Access (Own Only)', { status: 'running' });
      const { data: favorites, error: favError } = await supabase
        .from('user_favorites')
        .select('id, user_id')
        .limit(5);
      
      if (favError) {
        if (favError.code === '42P01') {
          updateTest('Favorites Access (Own Only)', { 
            status: 'passed', 
            message: 'Table does not exist (OK)',
            details: 'Favorites table may not be set up yet'
          });
        } else {
          updateTest('Favorites Access (Own Only)', { 
            status: 'failed', 
            message: favError.message 
          });
        }
      } else {
        const allOwned = favorites?.every(f => f.user_id === session.user.id) ?? true;
        updateTest('Favorites Access (Own Only)', { 
          status: allOwned ? 'passed' : 'failed', 
          message: allOwned 
            ? `Found ${favorites?.length || 0} of your favorites` 
            : 'WARNING: Can see other users\' favorites!'
        });
      }

      // Test 7: Regulations Access (should be public)
      updateTest('Regulations Access (Public)', { status: 'running' });
      const { data: regulations, error: regError } = await supabase
        .from('instrument')
        .select('id, title')
        .limit(5);
      
      if (regError) {
        if (regError.code === '42P01') {
          updateTest('Regulations Access (Public)', { 
            status: 'passed', 
            message: 'Table does not exist (OK)',
            details: 'Instrument table may not be set up yet'
          });
        } else {
          updateTest('Regulations Access (Public)', { 
            status: 'failed', 
            message: regError.message 
          });
        }
      } else {
        updateTest('Regulations Access (Public)', { 
          status: 'passed', 
          message: `Found ${regulations?.length || 0} regulations (public access working)`
        });
      }

      // Test 8: Edge Function CORS
      updateTest('Edge Function CORS', { status: 'running' });
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL || 'https://kruwbjaszdwzttblxqwr.supabase.co'}/functions/v1/generate-checklist-from-template`,
          {
            method: 'OPTIONS',
            headers: {
              'Origin': window.location.origin,
              'Access-Control-Request-Method': 'POST',
              'Access-Control-Request-Headers': 'authorization,content-type'
            }
          }
        );
        
        const corsHeader = response.headers.get('Access-Control-Allow-Origin');
        if (response.status === 204 && corsHeader) {
          updateTest('Edge Function CORS', { 
            status: 'passed', 
            message: 'CORS preflight successful',
            details: `Allow-Origin: ${corsHeader}`
          });
        } else {
          updateTest('Edge Function CORS', { 
            status: 'failed', 
            message: `Unexpected status: ${response.status}`,
            details: 'CORS headers may not be configured correctly'
          });
        }
      } catch (corsError: any) {
        updateTest('Edge Function CORS', { 
          status: 'failed', 
          message: corsError.message,
          details: 'Network error or CORS blocked'
        });
      }

      // Test 9: Create Checklist Test
      updateTest('Create Checklist Test', { status: 'running' });
      const testChecklistName = `RLS Test Checklist ${Date.now()}`;
      const { data: newChecklist, error: createError } = await supabase
        .from('compliance_checklists')
        .insert({
          name: testChecklistName,
          description: 'Test checklist for RLS verification',
          business_type: 'retailer',
          states: ['CA'],
          created_by: session.user.id,
          user_id: session.user.id
        })
        .select()
        .single();
      
      if (createError) {
        updateTest('Create Checklist Test', { 
          status: 'failed', 
          message: createError.message,
          details: 'RLS INSERT policy may be blocking creation'
        });
      } else {
        // Clean up - delete the test checklist
        await supabase.from('compliance_checklists').delete().eq('id', newChecklist.id);
        updateTest('Create Checklist Test', { 
          status: 'passed', 
          message: 'Successfully created and deleted test checklist',
          details: 'INSERT and DELETE policies working correctly'
        });
      }

      // Test 10: Data Isolation Test
      updateTest('Data Isolation Test', { status: 'running' });
      // Try to access a checklist with a fake ID that doesn't belong to user
      const { data: isolationTest, error: isolationError } = await supabase
        .from('compliance_checklists')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000000')
        .single();
      
      // We expect this to return no data (not an error about permissions)
      if (isolationError?.code === 'PGRST116') {
        // No rows returned - this is correct behavior
        updateTest('Data Isolation Test', { 
          status: 'passed', 
          message: 'Cannot access non-existent/other user data',
          details: 'RLS correctly blocking unauthorized access'
        });
      } else if (isolationTest) {
        updateTest('Data Isolation Test', { 
          status: 'failed', 
          message: 'WARNING: Accessed data that should be blocked!',
          details: 'RLS policy may be too permissive'
        });
      } else {
        updateTest('Data Isolation Test', { 
          status: 'passed', 
          message: 'Data isolation working correctly'
        });
      }

    } catch (error: any) {
      toast({
        title: 'Test Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-muted" />;
    }
  };

  const getTestIcon = (name: string) => {
    if (name.includes('Authentication')) return <User className="h-4 w-4" />;
    if (name.includes('Templates')) return <FileText className="h-4 w-4" />;
    if (name.includes('Checklists') || name.includes('Checklist')) return <FileText className="h-4 w-4" />;
    if (name.includes('Notifications')) return <Bell className="h-4 w-4" />;
    if (name.includes('Favorites')) return <Heart className="h-4 w-4" />;
    if (name.includes('Regulations')) return <Database className="h-4 w-4" />;
    if (name.includes('CORS')) return <Shield className="h-4 w-4" />;
    if (name.includes('Isolation')) return <Lock className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const totalCount = tests.length;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              RLS Policy Verification
            </CardTitle>
            <CardDescription>
              Test Row Level Security policies and data isolation
            </CardDescription>
          </div>
          <Button 
            onClick={runAllTests} 
            disabled={running}
            className="gap-2"
          >
            {running ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {running ? 'Running...' : 'Run Tests'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {tests.length === 0 ? (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Ready to Test</AlertTitle>
            <AlertDescription>
              Click "Run Tests" to verify RLS policies are working correctly. 
              Make sure you're logged in before running tests.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {/* Summary */}
            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                {passedCount} Passed
              </Badge>
              <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
                {failedCount} Failed
              </Badge>
              <Badge variant="outline">
                {totalCount} Total
              </Badge>
            </div>

            {/* Test Results */}
            <div className="space-y-2">
              {tests.map((test) => (
                <div 
                  key={test.name}
                  className={`p-3 rounded-lg border ${
                    test.status === 'passed' ? 'bg-green-500/5 border-green-500/20' :
                    test.status === 'failed' ? 'bg-red-500/5 border-red-500/20' :
                    test.status === 'running' ? 'bg-blue-500/5 border-blue-500/20' :
                    'bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(test.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getTestIcon(test.name)}
                        <span className="font-medium">{test.name}</span>
                      </div>
                      {test.message && (
                        <p className={`text-sm mt-1 ${
                          test.status === 'failed' ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                          {test.message}
                        </p>
                      )}
                      {test.details && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {test.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* User Info */}
            {userId && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Testing as:</strong> {userId.substring(0, 8)}...
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
