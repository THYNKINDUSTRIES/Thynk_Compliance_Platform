import { useState, useEffect } from 'react';
import { ChecklistGenerator } from '@/components/ChecklistGenerator';
import { ChecklistView } from '@/components/ChecklistView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { CheckSquare, Plus, Trash2, Library } from 'lucide-react';
import { Link } from 'react-router-dom';


export default function ComplianceChecklists() {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadChecklists();
  }, []);

  const loadChecklists = async () => {
    const { data, error } = await supabase
      .from('compliance_checklists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setChecklists(data || []);
      if (data && data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    }
  };

  const deleteChecklist = async (id: string) => {
    const { error } = await supabase.from('compliance_checklists').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Checklist removed' });
      loadChecklists();
      if (selectedId === id) setSelectedId(null);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CheckSquare className="h-8 w-8" />
          Compliance Checklists
        </h1>
        <p className="text-muted-foreground mt-2">
          Generate and track customized compliance checklists for your business
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setShowGenerator(!showGenerator)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Checklist
            </Button>
            <Link to="/templates">
              <Button variant="outline" className="w-full">
                <Library className="mr-2 h-4 w-4" />
                Templates
              </Button>
            </Link>
          </div>


          {showGenerator && (
            <ChecklistGenerator
              onChecklistCreated={() => {
                setShowGenerator(false);
                loadChecklists();
              }}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Your Checklists</CardTitle>
              <CardDescription>{checklists.length} total</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {checklists.map(cl => (
                <div
                  key={cl.id}
                  className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                    selectedId === cl.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedId(cl.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{cl.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {cl.business_type.replace('_', ' ')}
                      </p>
                      <div className="flex gap-1 mt-2">
                        {cl.states.map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {cl.completed_items} / {cl.total_items} complete
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChecklist(cl.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedId ? (
            <ChecklistView checklistId={selectedId} />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Select a checklist or create a new one</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}