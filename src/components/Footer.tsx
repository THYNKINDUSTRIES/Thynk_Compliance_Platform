import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#794108] text-gray-100 py-12 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <img 
            src="https://d64gsuwffb70l.cloudfront.net/68f945cb086e2661e0d9d180_1761192248656_591339cc.webp"
            alt="Thynk Industries" 
            className="h-10 mb-4 brightness-0 invert"
          />
          <p className="text-sm mb-4">
            Authoritative regulatory intelligence for the hemp, cannabinoid, and alternative wellness industries.
          </p>
          <div className="text-xs text-[#E89C5C]">
            © 2025 Thynk Industries
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Products</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Hemp/CBD</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Cannabinoids</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Kratom</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Psychedelics</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Nicotine/Vapes</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Resources</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">State Map</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Federal Tracker</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">API Documentation</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Compliance Guides</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Provider Directory</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="https://www.thynk.guru" className="hover:text-[#E89C5C] transition-colors">About Us</a></li>
            <li><a href="/contact" className="hover:text-[#E89C5C] transition-colors">Contact</a></li>
            <li><a href="/support" className="hover:text-[#E89C5C] transition-colors">Support</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Privacy Policy</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Terms of Service</a></li>
            <li><a href="#" className="hover:text-[#E89C5C] transition-colors">Advertise</a></li>
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
