import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MapPin, Clock, ExternalLink, MessageSquare } from 'lucide-react';
import { AgencyContact } from '@/data/agencyContacts';

interface AgencyContactCardProps {
  contact: AgencyContact;
  onContactFormOpen?: () => void;
}

export function AgencyContactCard({ contact, onContactFormOpen }: AgencyContactCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{contact.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
          </div>
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <a href={`mailto:${contact.email}`} className="hover:underline break-all">{contact.email}</a>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <div>
              <div>{contact.address}</div>
              <div>{contact.city}, {contact.state} {contact.zip}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <span>{contact.officeHours}</span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={contact.website} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Visit Website
            </a>
          </Button>
          {contact.publicCommentUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={contact.publicCommentUrl} target="_blank" rel="noopener noreferrer">
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Public Comment
              </a>
            </Button>
          )}
          {onContactFormOpen && (
            <Button variant="default" size="sm" onClick={onContactFormOpen}>
              <Mail className="h-4 w-4 mr-2" />
              Contact Form
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
