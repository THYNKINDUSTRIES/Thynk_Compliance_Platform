import { useState, useEffect } from 'react';
import { SupportTicketForm } from '@/components/SupportTicketForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Ticket, Clock, CheckCircle2, AlertCircle, MessageCircle, FileText, HelpCircle, Phone, Mail } from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface SupportTicket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

const faqs = [
  {
    question: "How do I track regulatory changes for my state?",
    answer: "Navigate to the Dashboard and select your state from the interactive map. You can set up alerts for specific regulations by clicking the bell icon on any regulation card. You'll receive email notifications when changes occur."
  },
  {
    question: "Can I export compliance reports?",
    answer: "Yes! From the Analytics page, click the 'Export' button in the top right corner. You can export reports in PDF, CSV, or Excel format. Premium users have access to customizable report templates."
  },
  {
    question: "How often is the regulatory data updated?",
    answer: "Our system polls federal and state regulatory sources every 4 hours. Critical updates like emergency rules are processed within 1 hour of publication. You can view the last update time on each regulation card."
  },
  {
    question: "What's included in the API access?",
    answer: "API access includes endpoints for regulations, compliance checklists, state comparisons, and real-time alerts. Rate limits depend on your subscription tier. Full documentation is available in the API Monitoring section."
  },
  {
    question: "How do I add team members to my organization?",
    answer: "Go to Settings > Team Management. Enter the email addresses of team members you want to invite. They'll receive an invitation email to join your organization with the role you specify."
  },
  {
    question: "Can I compare regulations across multiple states?",
    answer: "Yes! Use the State Comparison tool from the Dashboard. Select up to 4 states to compare side-by-side. You can filter by product category, supply chain stage, and regulation type."
  }
];

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-4 w-4" />;
      case 'in_progress': return <AlertCircle className="h-4 w-4" />;
      case 'resolved': return <CheckCircle2 className="h-4 w-4" />;
      default: return <Ticket className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white py-16 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Support Center</h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get help with your compliance platform. Submit tickets, browse FAQs, or contact our team directly.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {/* Quick Help Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <CardHeader>
                <HelpCircle className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>FAQs</CardTitle>
                <CardDescription>Find quick answers to common questions</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => document.getElementById('ticket-section')?.scrollIntoView({ behavior: 'smooth' })}>
              <CardHeader>
                <MessageCircle className="h-10 w-10 text-green-600 mb-2" />
                <CardTitle>Submit a Ticket</CardTitle>
                <CardDescription>Get personalized help from our team</CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <FileText className="h-10 w-10 text-purple-600 mb-2" />
                <CardTitle>Documentation</CardTitle>
                <CardDescription>Browse our comprehensive guides</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => window.open('/api-monitoring', '_self')}>
                  View Docs
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Options */}
          <div className="bg-gray-100 rounded-xl p-6 mb-12">
            <h2 className="text-2xl font-bold mb-4 text-center">Need Immediate Help?</h2>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="mailto:support@thynk.guru" className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors">
                <Mail className="h-5 w-5" />
                <span>support@thynk.guru</span>
              </a>
              <a href="tel:+18009984965" className="flex items-center gap-2 text-gray-700 hover:text-black transition-colors">
                <Phone className="h-5 w-5" />
                <span>1 (800) 99-THYNK</span>
              </a>
            </div>
            <p className="text-center text-sm text-gray-500 mt-3">Support hours: Monday - Friday, 9am - 6pm EST</p>
          </div>

          {/* FAQ Section */}
          <div id="faq-section" className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <Card>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-gray-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Section */}
          <div id="ticket-section" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Submit New Ticket */}
            <Card>
              <CardHeader>
                <CardTitle>Submit a Support Ticket</CardTitle>
                <CardDescription>Describe your issue and we'll get back to you within 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <SupportTicketForm onSuccess={loadTickets} />
              </CardContent>
            </Card>

            {/* Your Tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Your Tickets</CardTitle>
                <CardDescription>View and track your support requests</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="text-center py-8">
                    <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-muted-foreground">No tickets yet.</p>
                    <p className="text-sm text-gray-400">Submit one above to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-semibold">{ticket.subject}</p>
                            <p className="text-sm text-muted-foreground">{ticket.ticket_number}</p>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getStatusColor(ticket.status)}>
                              {getStatusIcon(ticket.status)}
                              <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                            </Badge>
                            <Badge className={getPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {new Date(ticket.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
