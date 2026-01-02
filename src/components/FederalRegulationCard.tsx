import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, AlertTriangle, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PublicCommentEditor } from './PublicCommentEditor';

interface FederalRegulation {
  id: string;
  title: string;
  category: string;
  status: string;
  effectiveDate: string;
  description: string;
  agency: string;
  impact: string;
}

interface Props {
  regulation: FederalRegulation;
}

export const FederalRegulationCard = ({ regulation }: Props) => {
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  
  const impactColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300'
  };

  const categoryColors = {
    licensing: 'bg-blue-100 text-blue-800',
    testing: 'bg-purple-100 text-purple-800',
    packaging: 'bg-orange-100 text-orange-800',
    compliance: 'bg-teal-100 text-teal-800'
  };

  // Calculate comment period end (30 days from effective date for demo)
  const commentPeriodEnd = new Date(regulation.effectiveDate);
  commentPeriodEnd.setDate(commentPeriodEnd.getDate() - 30);


  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl mb-2">{regulation.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4" />
                {regulation.agency}
              </CardDescription>
            </div>
            <Badge className={impactColors[regulation.impact as keyof typeof impactColors]}>
              {regulation.impact.toUpperCase()} Impact
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">{regulation.description}</p>
          <div className="flex items-center justify-between mb-4">
            <Badge className={categoryColors[regulation.category as keyof typeof categoryColors]}>
              {regulation.category}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4" />
              <span>Effective: {new Date(regulation.effectiveDate).toLocaleDateString()}</span>
            </div>
          </div>
          <Button 
            onClick={() => setCommentDialogOpen(true)} 
            variant="outline" 
            className="w-full"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Submit Public Comment
          </Button>
        </CardContent>
      </Card>
      
      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit Public Comment</DialogTitle>
          </DialogHeader>
          <PublicCommentEditor
            regulationId={regulation.id}
            regulationTitle={regulation.title}
            regulationType="federal"
            agencyName={regulation.agency}
            commentPeriodEnd={commentPeriodEnd.toISOString().split('T')[0]}
            submissionUrl={`https://www.regulations.gov/`}
            regulationText={regulation.description}
            onSave={() => setCommentDialogOpen(false)}
          />

        </DialogContent>
      </Dialog>
    </>

  );
};
