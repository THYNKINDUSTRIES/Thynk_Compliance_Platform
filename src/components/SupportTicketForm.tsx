import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, Bot, Sparkles } from 'lucide-react';

interface SupportTicketFormProps {
  onSuccess?: (ticketNumber: string) => void;
}

interface AgentResponse {
  ticketNumber: string;
  triage: {
    priority: string;
    category: string;
    canAutoResolve: boolean;
    confidence: number;
    sentiment: string;
  };
}

export function SupportTicketForm({ onSuccess }: SupportTicketFormProps) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'technical'
  });
  const [loading, setLoading] = useState(false);
  const [agentProcessing, setAgentProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'agent_done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [agentResponse, setAgentResponse] = useState<AgentResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');
    setAgentResponse(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to submit a support ticket.');

      // Insert ticket with timeout protection
      const insertPromise = supabase
        .from('support_tickets')
        .insert([{
          user_id: user.id,
          ...formData
        }])
        .select()
        .limit(1);
      
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 10000)
      );

      const { data: ticketData, error: dbError } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (dbError) {
        if (dbError.code === '42P01' || dbError.message?.includes('does not exist')) {
          throw new Error('Support tickets are being set up. Please email support@thynk.guru instead.');
        }
        if (dbError.code === '42501' || dbError.message?.includes('permission')) {
          throw new Error('Please sign in to submit a support ticket.');
        }
        throw dbError;
      }
      
      const ticket = ticketData?.[0];
      const generatedNumber = ticket?.ticket_number || `TKT-${Date.now()}`;

      setTicketNumber(generatedNumber);
      setStatus('success');
      setFormData({ subject: '', description: '', priority: 'medium', category: 'technical' });
      
      if (onSuccess) onSuccess(generatedNumber);

      // ── Trigger AI Agent ──
      // The DB trigger fires the agent automatically, but we also call it
      // directly so we can show the triage result in the UI immediately.
      setAgentProcessing(true);
      try {
        const agentUrl = 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/ticket-agent';
        const { data: { session } } = await supabase.auth.getSession();
        
        const agentResp = await fetch(agentUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || ''}`
          },
          body: JSON.stringify({ ticketId: ticket.id })
        });

        if (agentResp.ok) {
          const agentData = await agentResp.json();
          if (agentData.success) {
            setAgentResponse(agentData);
            setStatus('agent_done');
          }
        }
      } catch (agentErr) {
        console.warn('Agent processing failed (ticket still created):', agentErr);
        // Non-fatal — the DB trigger may handle it anyway
      } finally {
        setAgentProcessing(false);
      }
    } catch (error: any) {
      console.error('Support ticket error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to submit ticket');
    } finally {
      setLoading(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          required
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="technical">Technical Issue</SelectItem>
              <SelectItem value="data_quality">Data Quality Issue</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="feature_request">Feature Request</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          required
          rows={6}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {status === 'success' && !agentResponse && (
        <div className="flex flex-col gap-2 text-green-700 bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">Ticket submitted successfully!</span>
          </div>
          <p className="text-sm">Your ticket number is: <strong>{ticketNumber}</strong></p>
          {agentProcessing && (
            <div className="flex items-center gap-2 mt-1 text-blue-600 bg-blue-50 p-3 rounded-md border border-blue-100">
              <Bot className="h-4 w-4 animate-pulse" />
              <span className="text-sm">AI agent is analyzing your ticket...</span>
              <Loader2 className="h-3 w-3 animate-spin ml-auto" />
            </div>
          )}
        </div>
      )}

      {(status === 'agent_done' && agentResponse) && (
        <div className="flex flex-col gap-3 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">Ticket submitted & triaged!</span>
          </div>
          <p className="text-sm text-green-800">Your ticket number is: <strong>{ticketNumber}</strong></p>
          <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">AI Agent Response</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                agentResponse.triage.canAutoResolve 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {agentResponse.triage.canAutoResolve ? '✅ Auto-resolved' : '📋 Queued for review'}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                agentResponse.triage.priority === 'urgent' || agentResponse.triage.priority === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : agentResponse.triage.priority === 'high'
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                Priority: {agentResponse.triage.priority}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                {Math.round(agentResponse.triage.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {agentResponse.triage.canAutoResolve
                ? 'Check your email for the resolution. If this doesn\'t solve your issue, our team will follow up.'
                : 'A team member has been notified and will respond within 24 hours.'}
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded">
          <XCircle className="h-5 w-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800">

        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Ticket'
        )}
      </Button>
    </form>
  );
}
