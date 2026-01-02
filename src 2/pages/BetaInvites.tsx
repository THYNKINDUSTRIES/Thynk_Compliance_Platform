import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { isBetaMode } from '@/lib/betaAccess';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ArrowLeft } from 'lucide-react';

export default function BetaInvites() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <Link 
              to="/profile" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </Link>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>Beta Invites</CardTitle>
                <CardDescription>
                  {isBetaMode() 
                    ? 'Invite colleagues and partners to join the platform'
                    : 'The platform is now publicly available'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                {isBetaMode() ? (
                  <p className="text-gray-600 mb-4">
                    As a beta user, you can invite others to join the platform. 
                    Each invite generates a unique code that bypasses the email domain restriction.
                  </p>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">
                      Great news! The platform is now open to everyone. 
                      Beta invites are no longer needed - anyone can sign up directly.
                    </p>
                    <div className="flex justify-center gap-3">
                      <Link to="/app">
                        <Button>Go to Dashboard</Button>
                      </Link>
                      <Link to="/profile">
                        <Button variant="outline">View Profile</Button>
                      </Link>
                    </div>
                  </>
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
