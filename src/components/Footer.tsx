import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export const Footer: React.FC = () => {
  const { user } = useAuth();

  return (
    <footer className="bg-[#794108] text-gray-100 py-12 px-4" role="contentinfo">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          {/* Thynk Head Logo */}
          <img 
            src="/thynk-head.png" 
            alt="Thynk Industries logo" 
            className="h-10 w-10 mb-4 rounded object-contain"
            loading="lazy"
            width="40"
            height="40"
          />
          <p className="text-sm mb-4">
            Authoritative regulatory intelligence for the hemp, cannabinoid, kratom, psychedelics, and alternative wellness industries.
          </p>
          <div className="text-xs text-[#E89C5C]">
            © {new Date().getFullYear()} Thynk Industries
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Products</h4>
          <nav aria-label="Product links">
          <ul className="space-y-2 text-sm">
            <li><Link to="/app?product=hemp" className="hover:text-[#E89C5C] transition-colors">Hemp/CBD</Link></li>
            <li><Link to="/app?product=cannabinoids" className="hover:text-[#E89C5C] transition-colors">Cannabinoids</Link></li>
            <li><Link to="/app?product=kratom" className="hover:text-[#E89C5C] transition-colors">Kratom</Link></li>
            <li><Link to="/app?product=psychedelics" className="hover:text-[#E89C5C] transition-colors">Psychedelics</Link></li>
            <li><Link to="/app?product=nicotine" className="hover:text-[#E89C5C] transition-colors">Nicotine/Vapes</Link></li>
          </ul>
          </nav>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/app" className="hover:text-[#E89C5C] transition-colors">State Map</Link></li>
            <li><Link to="/federal" className="hover:text-[#E89C5C] transition-colors">Federal Tracker</Link></li>
            <li><Link to="/api-monitoring" className="hover:text-[#E89C5C] transition-colors">API Monitoring</Link></li>
            <li><Link to="/checklists" className="hover:text-[#E89C5C] transition-colors">Compliance Checklists</Link></li>
            <li><Link to="/templates" className="hover:text-[#E89C5C] transition-colors">Template Library</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="https://www.thynk.guru" target="_blank" rel="noopener noreferrer" className="hover:text-[#E89C5C] transition-colors">About Us</a></li>
            <li><Link to="/contact" className="hover:text-[#E89C5C] transition-colors">Contact</Link></li>
            <li><Link to="/support" className="hover:text-[#E89C5C] transition-colors">Support</Link></li>
            <li><Link to="/privacy" className="hover:text-[#E89C5C] transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-[#E89C5C] transition-colors">Terms of Service</Link></li>
            {user ? (
              <>
                <li><Link to="/settings" className="hover:text-[#E89C5C] transition-colors">Settings</Link></li>
                <li><Link to="/dashboard" className="hover:text-[#E89C5C] transition-colors">Dashboard</Link></li>
              </>
            ) : (
              <li><Link to="/login" className="hover:text-[#E89C5C] transition-colors">Sign In</Link></li>
            )}
          </ul>
        </div>


      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-[#E89C5C]/30 text-center text-xs text-gray-200">
        <p>This platform provides information only and does not constitute legal advice. Always consult with qualified legal counsel.</p>
      </div>
    </footer>
  );
};

export default Footer;
