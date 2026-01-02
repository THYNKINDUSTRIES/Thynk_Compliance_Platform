import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AgencyContact } from '@/data/agencyContacts';
import { useToast } from '@/hooks/use-toast';

interface AgencyContactFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agency: AgencyContact;
}

export function AgencyContactForm({ open, onOpenChange, agency }: AgencyContactFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Message Sent',
      description: `Your inquiry has been sent to ${agency.name}. They will respond within 2-3 business days.`
    });
    onOpenChange(false);
    setFormData({ name: '', email: '', phone: '', subject: '', message: '', inquiryType: 'general' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact {agency.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" required value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" required value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inquiryType">Inquiry Type</Label>
            <Select value={formData.inquiryType} onValueChange={(v) => setFormData({...formData, inquiryType: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Inquiry</SelectItem>
                <SelectItem value="licensing">Licensing Question</SelectItem>
                <SelectItem value="compliance">Compliance Issue</SelectItem>
                <SelectItem value="comment">Public Comment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input id="subject" required value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea id="message" required rows={6} value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})} />
          </div>
          <Button type="submit" className="w-full">Send Message</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
