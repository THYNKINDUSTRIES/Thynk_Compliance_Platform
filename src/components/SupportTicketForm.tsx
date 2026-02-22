import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface SupportTicketFormProps {
  onSuccess?: (ticketNumber: string) => void;
}

export function SupportTicketForm({ onSuccess }: SupportTicketFormProps) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    priority: 'medium',
    category: 'technical'
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

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
        // Provide user-friendly error messages
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


      // Send email notification using direct fetch
      const functionUrl = 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/send-contact-email';
      const { data: { session } } = await supabase.auth.getSession();
      
      const emailResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          formType: 'support',
          name: user.email,
          email: user.email,
          subject: formData.subject,
          message: formData.description,
          ticketNumber: ticket.ticket_number
        })
      });

      if (!emailResponse.ok) {
        console.error('Email notification failed');
        // Don't throw - ticket was created successfully
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

      {status === 'success' && (
        <div className="flex flex-col gap-2 text-green-700 bg-green-50 border border-green-200 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold">Ticket submitted successfully!</span>
          </div>
          <p className="text-sm">Your ticket number is: <strong>{ticketNumber}</strong></p>
          <p className="text-xs text-green-600">We'll respond within 24 hours. Check "Your Tickets" to track status.</p>
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
