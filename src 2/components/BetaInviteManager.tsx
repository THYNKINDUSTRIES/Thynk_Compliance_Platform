import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  UserPlus, 
  Mail, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  RefreshCw,
  Send,
  Users,
  Link as LinkIcon,
  AlertTriangle
} from 'lucide-react';
import { 
  createInvite, 
  getMyInvites, 
  revokeInvite, 
  getInviteStats,
  generateInviteLink,
  BETA_CONFIG,
  type BetaInvite,
  type InviteStats
} from '@/lib/betaAccess';

export default function BetaInviteManager() {
  const { user } = useAuth();
  const [invites, setInvites] = useState<BetaInvite[]>([]);
  const [stats, setStats] = useState<InviteStats>({ total: 0, pending: 0, accepted: 0, expired: 0, revoked: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // New invite form state
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteNotes, setInviteNotes] = useState('');
  const [sending, setSending] = useState(false);
  
  // Copy link state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadInvites();
      loadStats();
    }
  }, [user]);

  const loadInvites = async () => {
    if (!user) return;
    setLoading(true);
    const result = await getMyInvites(user.id);
    if (result.error) {
      setError(result.error);
    } else {
      setInvites(result.invites);
    }
    setLoading(false);
  };

  const loadStats = async () => {
    if (!user) return;
    const result = await getInviteStats(user.id);
    if (!result.error) {
      setStats(result.stats);
    }
  };

  const handleSendInvite = async () => {
    if (!user || !inviteEmail) return;
    
    // Validate email
    if (!inviteEmail.includes('@') || !inviteEmail.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    // Check invite limit
    if (stats.total >= BETA_CONFIG.maxInvitesPerUser) {
      setError(`You have reached the maximum of ${BETA_CONFIG.maxInvitesPerUser} invites`);
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');

    const result = await createInvite(
      user.id,
      user.email || '',
      inviteEmail,
      inviteNotes || undefined
    );

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(`Invite sent to ${inviteEmail}! They will receive an email with instructions.`);
      setInviteEmail('');
      setInviteNotes('');
      setShowInviteDialog(false);
      loadInvites();
      loadStats();
    }

    setSending(false);
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!user) return;
    
    const result = await revokeInvite(inviteId, user.id);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess('Invite revoked successfully');
      loadInvites();
      loadStats();
    }
  };

  const handleCopyLink = async (inviteCode: string) => {
    const link = generateInviteLink(inviteCode);
    await navigator.clipboard.writeText(link);
    setCopiedCode(inviteCode);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" /> Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1" /> Expired</Badge>;
      case 'revoked':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const remainingInvites = BETA_CONFIG.maxInvitesPerUser - stats.total;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Sent</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Accepted</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Expired</p>
                <p className="text-2xl font-bold text-gray-600">{stats.expired}</p>
              </div>
              <XCircle className="w-8 h-8 text-gray-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="text-2xl font-bold text-blue-600">{remainingInvites}</p>
              </div>
              <UserPlus className="w-8 h-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Beta Invites
            </CardTitle>
            <CardDescription>
              Invite colleagues to join the Thynk Compliance beta. Each user can send up to {BETA_CONFIG.maxInvitesPerUser} invites.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { loadInvites(); loadStats(); }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
              <DialogTrigger asChild>
                <Button disabled={remainingInvites <= 0}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Someone to Beta</DialogTitle>
                  <DialogDescription>
                    Send a beta invite to a colleague. They'll receive an email with a unique invite code.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-email">Email Address</Label>
                    <Input
                      id="invite-email"
                      type="email"
                      placeholder="colleague@company.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invite-notes">Personal Note (optional)</Label>
                    <Textarea
                      id="invite-notes"
                      placeholder="Add a personal message to include in the invite email..."
                      value={inviteNotes}
                      onChange={(e) => setInviteNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>The invite will expire in {BETA_CONFIG.inviteExpirationDays} days.</p>
                    <p>You have {remainingInvites} invite{remainingInvites !== 1 ? 's' : ''} remaining.</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendInvite} disabled={sending || !inviteEmail}>
                    {sending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4 mr-2" />
                        Send Invite
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : invites.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>You haven't sent any invites yet.</p>
              <p className="text-sm">Click "Send Invite" to invite someone to the beta.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invited Email</TableHead>
                  <TableHead>Invite Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell className="font-medium">{invite.invited_email}</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {invite.invite_code}
                      </code>
                    </TableCell>
                    <TableCell>{getStatusBadge(invite.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(invite.created_at)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDate(invite.expires_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {invite.status === 'pending' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyLink(invite.invite_code)}
                            >
                              {copiedCode === invite.invite_code ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <LinkIcon className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevokeInvite(invite.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-blue-900">How Beta Invites Work</h3>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>• When you send an invite, the recipient receives an email with a unique invite code</li>
                <li>• They can use the link in the email or enter the code manually during signup</li>
                <li>• Invite codes bypass the email domain restriction for beta access</li>
                <li>• Invites expire after {BETA_CONFIG.inviteExpirationDays} days if not used</li>
                <li>• You can revoke pending invites at any time</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
