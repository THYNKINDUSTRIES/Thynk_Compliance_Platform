import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Loader2, Send, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Regulation {
  id: string;
  title: string;
  agency: string;
  jurisdiction: string;
  comment_deadline?: string;
  submission_url?: string;
}

export function BulkCommentSubmission() {
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [selectedRegs, setSelectedRegs] = useState<Set<string>>(new Set());
  const [batchName, setBatchName] = useState('');
  const [baseTitle, setBaseTitle] = useState('');
  const [baseBody, setBaseBody] = useState('');
  const [filterAgency, setFilterAgency] = useState('all');
  const [filterJurisdiction, setFilterJurisdiction] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRegulations();
  }, []);

  const loadRegulations = async () => {
    const { data } = await supabase
      .from('instrument')
      .select('*')
      .not('comment_deadline', 'is', null)
      .order('comment_deadline', { ascending: true })
      .limit(50);
    
    if (data) setRegulations(data);
  };

  const toggleRegulation = (id: string) => {
    const newSet = new Set(selectedRegs);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRegs(newSet);
  };

  const filteredRegulations = regulations.filter(reg => {
    if (filterAgency !== 'all' && reg.agency !== filterAgency) return false;
    if (filterJurisdiction !== 'all' && reg.jurisdiction !== filterJurisdiction) return false;
    return true;
  });

  const handleSubmit = async () => {
    if (selectedRegs.size === 0 || !baseTitle || !baseBody) {
      toast({ title: 'Error', description: 'Please select regulations and enter comment details', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setProgress(0);

    const selectedRegulations = regulations.filter(r => selectedRegs.has(r.id));
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const { data, error } = await supabase.functions.invoke('submit-batch-comments', {
        body: {
          batchName: batchName || `Batch ${new Date().toLocaleDateString()}`,
          baseTitle,
          baseBody,
          regulations: selectedRegulations.map(r => ({
            id: r.id,
            title: r.title,
            agency: r.agency,
            submissionUrl: r.submission_url
          })),
          userId: user?.id
        }
      });

      if (error) throw error;

      setResults(data);
      setProgress(100);
      toast({ title: 'Success', description: `Submitted ${data.successful} of ${data.total} comments` });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const agencies = [...new Set(regulations.map(r => r.agency))];
  const jurisdictions = [...new Set(regulations.map(r => r.jurisdiction))];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bulk Comment Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Batch name (optional)"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
          />
          <Input
            placeholder="Comment title"
            value={baseTitle}
            onChange={(e) => setBaseTitle(e.target.value)}
          />
          <Textarea
            placeholder="Comment body"
            value={baseBody}
            onChange={(e) => setBaseBody(e.target.value)}
            rows={6}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Select Regulations ({selectedRegs.size} selected)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Select value={filterAgency} onValueChange={setFilterAgency}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by agency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agencies</SelectItem>
                {agencies.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterJurisdiction} onValueChange={setFilterJurisdiction}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jurisdictions</SelectItem>
                {jurisdictions.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredRegulations.map(reg => (
              <div key={reg.id} className="flex items-start gap-3 p-3 border rounded">
                <Checkbox
                  checked={selectedRegs.has(reg.id)}
                  onCheckedChange={() => toggleRegulation(reg.id)}
                />
                <div className="flex-1">
                  <div className="font-medium">{reg.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {reg.agency} • {reg.jurisdiction}
                    {reg.comment_deadline && ` • Deadline: ${new Date(reg.comment_deadline).toLocaleDateString()}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isSubmitting && (
        <Card>
          <CardContent className="pt-6">
            <Progress value={progress} className="mb-2" />
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting comments...
            </div>
          </CardContent>
        </Card>
      )}

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Submission Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Successful: {results.successful}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Failed: {results.failed}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Total: {results.total} regulations
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || selectedRegs.size === 0}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="mr-2 h-4 w-4" />
            Submit {selectedRegs.size} Comments
          </>
        )}
      </Button>
    </div>
  );
}
