import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Ticket, Clock, CheckCircle2, AlertCircle, Bot, MessageCircle,
  RefreshCw, ChevronDown, ChevronUp, Send, XCircle, Sparkles, Users, BarChart3
} from 'lucide-react';

interface TicketFull {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  resolution: string | null;
  metadata: any;
  agent_response: string | null;
  agent_resolved: boolean;
  agent_confidence: number | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

interface TicketComment {
  id: string;
  ticket_id: string;
  user_id: string | null;
  comment: string;
  is_internal: boolean;
  created_at: string;
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';
type PriorityFilter = 'all' | 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export default function AdminTickets() {
  const [tickets, setTickets] = useState<TicketFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketFull | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);
  const [commenting, setCommenting] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') query = query.eq('status', statusFilter);
      if (priorityFilter !== 'all') query = query.eq('priority', priorityFilter);

      const { data, error } = await query;
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter]);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  const loadComments = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_comments')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setComments(data || []);
  };

  const toggleExpand = (ticket: TicketFull) => {
    if (expandedTicket === ticket.id) {
      setExpandedTicket(null);
      setSelectedTicket(null);
    } else {
      setExpandedTicket(ticket.id);
      setSelectedTicket(ticket);
      loadComments(ticket.id);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    await supabase.from('support_tickets').update({ status }).eq('id', ticketId);
    loadTickets();
  };

  const postComment = async (ticketId: string, isInternal: boolean) => {
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('ticket_comments').insert({
        ticket_id: ticketId,
        user_id: user?.id || null,
        comment: newComment,
        is_internal: isInternal,
      });
      setNewComment('');
      loadComments(ticketId);
    } finally {
      setCommenting(false);
    }
  };

  // ── Stats ──
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    autoResolved: tickets.filter(t => t.agent_resolved).length,
    urgent: tickets.filter(t => ['urgent', 'critical'].includes(t.priority)).length,
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800 border-blue-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      resolved: 'bg-green-100 text-green-800 border-green-200',
      closed: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
      critical: 'bg-red-200 text-red-900 font-bold',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <Clock className="h-3.5 w-3.5" />;
      case 'in_progress': return <AlertCircle className="h-3.5 w-3.5" />;
      case 'resolved': return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'closed': return <XCircle className="h-3.5 w-3.5" />;
      default: return <Ticket className="h-3.5 w-3.5" />;
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white py-12 px-4">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <Ticket className="h-8 w-8" />
              <h1 className="text-3xl font-bold">Support Ticket Dashboard</h1>
            </div>
            <p className="text-gray-400">AI-triaged support tickets with automated resolution</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, icon: BarChart3, color: 'text-gray-600' },
              { label: 'Open', value: stats.open, icon: Clock, color: 'text-blue-600' },
              { label: 'In Progress', value: stats.inProgress, icon: AlertCircle, color: 'text-yellow-600' },
              { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-green-600' },
              { label: 'AI Resolved', value: stats.autoResolved, icon: Bot, color: 'text-purple-600' },
              { label: 'Urgent', value: stats.urgent, icon: AlertCircle, color: 'text-red-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                    <Icon className={`h-5 w-5 ${color} opacity-50`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Priority:</span>
              <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as PriorityFilter)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={loadTickets} className="ml-auto">
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>

          {/* Ticket List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          ) : tickets.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Ticket className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-muted-foreground">No tickets match the current filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const isExpanded = expandedTicket === ticket.id;
                const triage = ticket.metadata?.ai_triage;

                return (
                  <Card key={ticket.id} className={`transition-all ${isExpanded ? 'ring-2 ring-blue-200' : ''}`}>
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      onClick={() => toggleExpand(ticket)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-mono text-muted-foreground">{ticket.ticket_number}</span>
                            {ticket.agent_resolved && (
                              <span className="flex items-center gap-1 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                                <Bot className="h-3 w-3" /> AI Resolved
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold truncate">{ticket.subject}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{ticket.description}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <Badge className={`${getStatusColor(ticket.status)} border`}>
                            {getStatusIcon(ticket.status)}
                            <span className="ml-1">{ticket.status.replace('_', ' ')}</span>
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                          {triage?.sentiment && triage.sentiment !== 'neutral' && (
                            <Badge variant="outline" className="text-xs">
                              {triage.sentiment === 'frustrated' && '😤'}
                              {triage.sentiment === 'angry' && '😡'}
                              {triage.sentiment === 'confused' && '🤔'}
                              {triage.sentiment === 'positive' && '😊'}
                              {' '}{triage.sentiment}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail panel */}
                    {isExpanded && (
                      <div className="border-t px-4 pb-4 pt-3 bg-gray-50/50 dark:bg-gray-800/30">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Left: Description & AI Triage */}
                          <div className="lg:col-span-2 space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-1">Description</h4>
                              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                            </div>

                            {triage && (
                              <div className="bg-purple-50 dark:bg-purple-950/30 rounded-lg p-3 border border-purple-100">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="h-4 w-4 text-purple-600" />
                                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">AI Triage</span>
                                  {triage.confidence && (
                                    <span className="text-xs text-purple-500 ml-auto">{Math.round(triage.confidence * 100)}% confidence</span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{triage.summary}</p>
                                {triage.tags?.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {triage.tags.map((tag: string) => (
                                      <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{tag}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Comments */}
                            <div>
                              <h4 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                                <MessageCircle className="h-4 w-4" /> Comments ({comments.length})
                              </h4>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {comments.map((c) => (
                                  <div
                                    key={c.id}
                                    className={`p-3 rounded-lg text-sm ${
                                      c.is_internal
                                        ? 'bg-amber-50 border border-amber-200 dark:bg-amber-950/30'
                                        : c.user_id === null
                                        ? 'bg-purple-50 border border-purple-200 dark:bg-purple-950/30'
                                        : 'bg-white border dark:bg-gray-800'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      {c.user_id === null && <Bot className="h-3 w-3 text-purple-600" />}
                                      <span className="text-xs font-semibold text-muted-foreground">
                                        {c.user_id === null ? 'AI Agent' : 'Team'}
                                        {c.is_internal && ' (Internal)'}
                                      </span>
                                      <span className="text-xs text-muted-foreground ml-auto">
                                        {new Date(c.created_at).toLocaleString('en-US', {
                                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                    <p className="whitespace-pre-wrap">{c.comment}</p>
                                  </div>
                                ))}
                                {comments.length === 0 && (
                                  <p className="text-sm text-muted-foreground text-center py-4">No comments yet.</p>
                                )}
                              </div>

                              {/* New comment */}
                              <div className="mt-3 space-y-2">
                                <Textarea
                                  placeholder="Write a response..."
                                  value={newComment}
                                  onChange={(e) => setNewComment(e.target.value)}
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => postComment(ticket.id, false)}
                                    disabled={!newComment.trim() || commenting}
                                  >
                                    <Send className="h-3.5 w-3.5 mr-1" /> Reply to User
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => postComment(ticket.id, true)}
                                    disabled={!newComment.trim() || commenting}
                                  >
                                    Internal Note
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right: Actions sidebar */}
                          <div className="space-y-4">
                            <Card>
                              <CardHeader className="p-3 pb-2">
                                <CardTitle className="text-sm">Actions</CardTitle>
                              </CardHeader>
                              <CardContent className="p-3 pt-0 space-y-3">
                                <div>
                                  <span className="text-xs text-muted-foreground">Update Status</span>
                                  <div className="grid grid-cols-2 gap-1 mt-1">
                                    {['open', 'in_progress', 'resolved', 'closed'].map((s) => (
                                      <Button
                                        key={s}
                                        size="sm"
                                        variant={ticket.status === s ? 'default' : 'outline'}
                                        className="text-xs h-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateTicketStatus(ticket.id, s);
                                        }}
                                      >
                                        {s.replace('_', ' ')}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                                <div className="text-xs space-y-1 text-muted-foreground">
                                  <p><strong>Category:</strong> {ticket.category}</p>
                                  <p><strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
                                  <p><strong>Updated:</strong> {new Date(ticket.updated_at).toLocaleString()}</p>
                                  {ticket.agent_confidence !== null && (
                                    <p><strong>AI Confidence:</strong> {Math.round((ticket.agent_confidence || 0) * 100)}%</p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>

                            {ticket.resolution && (
                              <Card>
                                <CardHeader className="p-3 pb-2">
                                  <CardTitle className="text-sm flex items-center gap-1">
                                    <Bot className="h-4 w-4 text-purple-600" /> Resolution
                                  </CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 pt-0">
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{ticket.resolution}</p>
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
