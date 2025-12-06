import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface CreateAlertModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAlertModal: React.FC<CreateAlertModalProps> = ({ open, onClose, onSuccess }) => {
  const [alertName, setAlertName] = useState('');
  const [keywords, setKeywords] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Alert created successfully!');
    setAlertName('');
    setKeywords('');
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Custom Alert</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="alertName">Alert Name</Label>
            <Input id="alertName" value={alertName} onChange={(e) => setAlertName(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="keywords">Keywords (comma-separated)</Label>
            <Input id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="hemp, CBD, kratom" />
          </div>
          <Button type="submit" className="w-full bg-[#794108] hover:bg-[#E89C5C]">
            Create Alert
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
