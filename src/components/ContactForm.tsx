import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ContactFormProps {
  formType: 'sales' | 'pricing' | 'general';
  title?: string;
  description?: string;
  onSuccess?: () => void;
}

export function ContactForm({ formType, title, description, onSuccess }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      // Insert into database
      const { error: dbError } = await supabase
        .from('contact_submissions')
        .insert([{
          form_type: formType,
          ...formData
        }]);

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to save submission');
      }

      // Send email notification using direct fetch
      const functionUrl = 'https://kruwbjaszdwzttblxqwr.supabase.co/functions/v1/send-contact-email';
      const { data: { session } } = await supabase.auth.getSession();
      
      const emailResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || 'anonymous'}`
        },
        body: JSON.stringify({ formType, ...formData })
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        console.error('Email error:', errorData);
        // Don't throw - form was saved, email is secondary
      }

      setStatus('success');
      setFormData({ name: '', email: '', company: '', phone: '', subject: '', message: '' });
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error('Form submission error:', error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">

      {title && <h3 className="text-2xl font-bold mb-2">{title}</h3>}
      {description && <p className="text-muted-foreground mb-6">{description}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        {formType === 'general' && (
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>
        )}

        <div>
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            required
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          />
        </div>

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded">
            <CheckCircle className="h-5 w-5" />
            <span>Thank you! We'll get back to you soon.</span>
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
            'Submit'
          )}
        </Button>
      </form>
    </div>
  );
}
