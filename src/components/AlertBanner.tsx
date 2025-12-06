import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AlertBanner() {
  return (
    <div className="bg-gradient-to-r from-[#794108] to-[#5a3006] text-white py-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <Bell className="w-16 h-16 mx-auto mb-6 animate-pulse text-[#E89C5C]" />
        <h2 className="text-4xl font-serif font-bold mb-4">Never Miss a Critical Update</h2>
        <p className="text-xl mb-8 text-gray-100">
          Get personalized email alerts for new regulations matching your criteria. 
          Choose immediate alerts or daily/weekly digests.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/alerts">
            <Button size="lg" className="text-lg px-8 bg-[#E89C5C] hover:bg-[#d88a4a] text-white">
              Set Up Alerts
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 hover:bg-white/20 border-[#E89C5C] text-white">
            Learn More
          </Button>
        </div>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-bold text-lg mb-2 text-[#E89C5C]">📍 By Jurisdiction</div>
            <p className="text-gray-100">Track specific states or federal regulations</p>
          </div>
          <div>
            <div className="font-bold text-lg mb-2 text-[#E89C5C]">🏷️ By Category</div>
            <p className="text-gray-100">Filter by product types and industries</p>
          </div>
          <div>
            <div className="font-bold text-lg mb-2 text-[#E89C5C]">🔍 By Keywords</div>
            <p className="text-gray-100">Custom alerts for specific terms</p>
          </div>
        </div>
      </div>
    </div>
  );
}
