import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut, Shield, Bell, LayoutDashboard, Clock, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const UserMenu = () => {
  const { user, profile, signOut, isAdmin, isTrialActive, isPaidUser, trialDaysRemaining } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
        <Link to="/signup">
          <Button variant="default" size="sm">
            Sign Up
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User size={16} className="text-blue-600" />
          </div>
          <span className="hidden md:inline max-w-[150px] truncate">
            {profile?.full_name || user.email?.split('@')[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-medium">{profile?.full_name || 'User'}</span>
          <span className="text-xs font-normal text-gray-500 truncate">{user.email}</span>
          <div className="flex items-center gap-2 mt-1">
            {isPaidUser ? (
              <Badge variant="default" className="text-xs">
                <CreditCard size={10} className="mr-1" />
                Pro
              </Badge>
            ) : isTrialActive ? (
              <Badge variant="secondary" className="text-xs">
                <Clock size={10} className="mr-1" />
                Trial ({trialDaysRemaining}d left)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                <Clock size={10} className="mr-1" />
                Free Plan
              </Badge>
            )}
            {isAdmin && (
              <Badge variant="default" className="text-xs">
                <Shield size={10} className="mr-1" />
                Admin
              </Badge>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/dashboard" className="cursor-pointer flex items-center">
            <LayoutDashboard size={16} className="mr-2" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer flex items-center">
            <User size={16} className="mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/notification-preferences" className="cursor-pointer flex items-center">
            <Bell size={16} className="mr-2" />
            Notifications
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer flex items-center">
            <Settings size={16} className="mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/source-management" className="cursor-pointer flex items-center">
                <Shield size={16} className="mr-2" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleSignOut} 
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <LogOut size={16} className="mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
