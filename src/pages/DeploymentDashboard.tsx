import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import FunctionVersionList from '@/components/FunctionVersionList';
import DeploymentInstructions from '@/components/DeploymentInstructions';
import FunctionHealthMonitor from '@/components/FunctionHealthMonitor';
import { Rocket, Code, History, Activity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DeploymentDashboard() {
  const [functions, setFunctions] = useState<string[]>([]);
  const [selectedFunction, setSelectedFunction] = useState('');
  const [versions, setVersions] = useState<any[]>([]);
  const [newCode, setNewCode] = useState('');
  const [description, setDescription] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFunctions();
  }, []);

  useEffect(() => {
    if (selectedFunction) {
      loadVersions();
    }
  }, [selectedFunction]);

  const loadFunctions = async () => {
    const { data } = await supabase
      .from('edge_function_versions')
      .select('function_name')
      .order('function_name');
    
    if (data) {
      const unique = [...new Set(data.map(d => d.function_name))];
      setFunctions(unique);
      if (unique.length > 0) setSelectedFunction(unique[0]);
    }
  };

  const loadVersions = async () => {
    const { data } = await supabase
      .from('edge_function_versions')
      .select('*')
      .eq('function_name', selectedFunction)
      .order('version', { ascending: false });
    
    if (data) setVersions(data);
  };

  const saveVersion = async () => {
    const { data: user } = await supabase.auth.getUser();
    const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;

    const { error } = await supabase
      .from('edge_function_versions')
      .insert({
        function_name: selectedFunction,
        version: nextVersion,
        code: newCode,
        description,
        deployed_by: user.user?.id,
        status: 'pending'
      });

    if (!error) {
      toast({ title: 'Version saved successfully' });
      setShowInstructions(true);
      loadVersions();
    }
  };

  const confirmDeployment = async () => {
    const { error } = await supabase
      .from('edge_function_versions')
      .update({ status: 'deployed', is_active: true })
      .eq('function_name', selectedFunction)
      .eq('code', newCode);

    if (!error) {
      toast({ title: 'Deployment confirmed!' });
      setShowInstructions(false);
      setNewCode('');
      setDescription('');
      loadVersions();
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Rocket className="w-8 h-8" />
        Deployment Dashboard
      </h1>

      <Tabs defaultValue="deploy" className="space-y-6">
        <TabsList>
          <TabsTrigger value="deploy"><Code className="w-4 h-4 mr-2" />Deploy</TabsTrigger>
          <TabsTrigger value="versions"><History className="w-4 h-4 mr-2" />Versions</TabsTrigger>
          <TabsTrigger value="health"><Activity className="w-4 h-4 mr-2" />Health</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">New Deployment</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Function Name</label>
                  <Input value={selectedFunction} onChange={(e) => setSelectedFunction(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Function Code</label>
                  <Textarea 
                    value={newCode} 
                    onChange={(e) => setNewCode(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                <Button onClick={saveVersion} className="w-full">Save & Get Instructions</Button>
              </div>
            </Card>

            {showInstructions && (
              <DeploymentInstructions
                functionName={selectedFunction}
                code={newCode}
                onConfirmDeployment={confirmDeployment}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="versions">
          <FunctionVersionList
            versions={versions}
            onRollback={(id) => console.log('Rollback', id)}
            onViewCode={(id) => console.log('View', id)}
          />
        </TabsContent>

        <TabsContent value="health">
          <FunctionHealthMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
