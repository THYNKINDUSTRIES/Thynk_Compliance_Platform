import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const STATES = ['CA', 'CO', 'IL', 'MA', 'MI', 'NJ', 'NV', 'NY', 'OR', 'PA', 'WA', 'AZ', 'FL', 'TX', 'VA'];

export function ChecklistGenerator({ onChecklistCreated }: { onChecklistCreated: () => void }) {
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [includeFederal, setIncludeFederal] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const toggleState = (state: string) => {
    setSelectedStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const handleGenerate = async () => {
    if (!name || !businessType || selectedStates.length === 0) {
      toast({ title: 'Missing Information', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Allow generation without authentication for demo purposes
      const userId = user?.id || 'demo-user';

      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-compliance-checklist', {
        body: { businessType, states: selectedStates, includeFederal, name, userId }
      });


      if (aiError) throw aiError;

      const { data: checklistData, error: clError } = await supabase
        .from('compliance_checklists')
        .insert({
          user_id: userId,
          name,
          business_type: businessType,
          states: selectedStates,
          include_federal: includeFederal,
          total_items: aiData.items.length
        })
        .select()
        .limit(1);


      if (clError) throw clError;
      
      const checklist = checklistData?.[0];
      if (!checklist) throw new Error('Failed to create checklist');


      const items = aiData.items.map((item: any, idx: number) => ({
        checklist_id: checklist.id,
        title: item.title,
        description: item.description,
        category: item.category,
        jurisdiction: item.jurisdiction,
        agency: item.agency,
        priority: item.priority,
        regulation_reference: item.regulation_reference,
        order_index: idx
      }));

      const { error: itemsError } = await supabase.from('checklist_items').insert(items);
      if (itemsError) throw itemsError;

      toast({ title: 'Checklist Created', description: `Generated ${aiData.items.length} compliance items` });
      onChecklistCreated();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Generate Compliance Checklist
        </CardTitle>
        <CardDescription>Create a customized checklist based on your business</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="checklist-name">Checklist Name</Label>
          <Input 
            id="checklist-name"
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Q1 2024 Compliance" 
          />
        </div>
        <div>
          <Label htmlFor="business-type">Business Type</Label>
          <Select value={businessType} onValueChange={setBusinessType}>
            <SelectTrigger id="business-type">
              <SelectValue placeholder="Select business type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cultivator">Cultivator</SelectItem>
              <SelectItem value="manufacturer">Manufacturer</SelectItem>
              <SelectItem value="retailer">Retailer</SelectItem>
              <SelectItem value="testing_lab">Testing Lab</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label id="operating-states-label">Operating States</Label>
          <div className="grid grid-cols-5 gap-2 mt-2" role="group" aria-labelledby="operating-states-label">
            {STATES.map(state => (
              <div key={state} className="flex items-center space-x-2">
                <Checkbox 
                  id={`state-${state}`}
                  checked={selectedStates.includes(state)} 
                  onCheckedChange={() => toggleState(state)} 
                />
                <Label htmlFor={`state-${state}`} className="text-sm cursor-pointer">{state}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="include-federal"
            checked={includeFederal} 
            onCheckedChange={(checked) => setIncludeFederal(!!checked)} 
          />
          <Label htmlFor="include-federal" className="cursor-pointer">Include Federal Requirements</Label>
        </div>
        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : 'Generate Checklist'}
        </Button>
      </CardContent>
    </Card>
  );
}
