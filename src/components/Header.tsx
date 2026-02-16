import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NotificationCenter } from '@/components/NotificationCenter';
import { UserMenu } from '@/components/UserMenu';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Phone, Menu, X } from 'lucide-react';


export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-50" role="banner">
      {/* Black Top Banner */}
      <div className="bg-black text-white py-2">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <a href="mailto:support@thynk.guru" className="flex items-center gap-2 hover:text-gray-300 transition-colors" aria-label="Email support at support@thynk.guru">
              <Mail className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">support@thynk.guru</span>


            </a>
            <a href="tel:+18009984965" className="flex items-center gap-2 hover:text-gray-300 transition-colors" aria-label="Call us at 1-800-99-THYNK">
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span className="hidden sm:inline">1 (800) 99-THYNK</span>
            </a>

          </div>
          <div className="flex items-center gap-4">
            <Link to="/support" className="hover:text-gray-300 transition-colors">Support</Link>
            <Link to="/contact" className="hover:text-gray-300 transition-colors">Contact</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Top Left */}
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" aria-label="Thynk Compliance - Home">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg p-2">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-white font-bold text-xl leading-tight">Thynk Compliance</span>
                <span className="text-gray-300 text-sm">Regulatory Intelligence Platform</span>
              </div>
            </Link>



            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6" aria-label="Main navigation">
              <Link to="/" className="text-white hover:text-gray-300 transition-colors font-medium">Home</Link>
              <Link to="/app" className="text-white hover:text-gray-300 transition-colors font-medium">Platform</Link>
              <Link to="/dashboard" className="text-white hover:text-gray-300 transition-colors font-medium">Dashboard</Link>
              <Link to="/legislature-bills" className="text-white hover:text-gray-300 transition-colors font-medium">Bills</Link>
              <Link to="/analytics" className="text-white hover:text-gray-300 transition-colors font-medium">Analytics</Link>
              <Link to="/forecasting" className="text-white hover:text-gray-300 transition-colors font-medium">AI Forecasting</Link>
              <Link to="/workflows" className="text-white hover:text-gray-300 transition-colors font-medium">Workflows</Link>
              {isAdmin && (
                <>
                  <Link to="/api-monitoring" className="text-white hover:text-gray-300 transition-colors font-medium">API</Link>
                  <Link to="/deployment" className="text-white hover:text-gray-300 transition-colors font-medium">Deploy</Link>
                </>
              )}
              <Link to="/checklists" className="text-white hover:text-gray-300 transition-colors font-medium">Checklists</Link>
              {user && <NotificationCenter />}
              <UserMenu />

            </nav>


            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="lg:hidden mt-4 flex flex-col gap-3 pb-4 border-t border-gray-700 pt-4" aria-label="Mobile navigation">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Home</Link>
              <Link to="/app" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Platform</Link>
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Dashboard</Link>
              <Link to="/legislature-bills" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Bills</Link>
              <Link to="/analytics" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Analytics</Link>
              <Link to="/forecasting" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">AI Forecasting</Link>
              <Link to="/workflows" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Workflows</Link>
              {isAdmin && (
                <>
                  <Link to="/api-monitoring" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">API</Link>
                  <Link to="/deployment" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Deploy</Link>
                </>
              )}
              <Link to="/templates" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Templates</Link>
              <Link to="/checklists" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Checklists</Link>
              <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Contact</Link>
              <Link to="/support" onClick={() => setMobileMenuOpen(false)} className="text-white hover:text-gray-300 transition-colors font-medium">Support</Link>
              {!user && (
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="bg-white text-black hover:bg-gray-200 px-6 py-2 rounded-lg transition-colors font-medium text-center block">
                  Sign In
                </Link>
              )}
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
