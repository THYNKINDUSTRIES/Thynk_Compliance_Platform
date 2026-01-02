import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PricingSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-center">Plans for Teams of All Sizes</h2>
        <p className="text-lg mb-12 text-center text-gray-700 max-w-3xl mx-auto">
          Start with a single seat or roll out TCP across your entire legal, compliance, or operations team. Enterprise options available for platforms and multi-state operators.
        </p>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-2">Professional</h3>
            <p className="text-gray-600 mb-6">Ideal for solo attorneys and compliance leads</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2"><Check className="w-5 h-5 text-black mt-0.5" /><span>1 user</span></li>
              <li className="flex items-start gap-2"><Check className="w-5 h-5 text-black mt-0.5" /><span>Full access to map and regulatory feed</span></li>
              <li className="flex items-start gap-2"><Check className="w-5 h-5 text-black mt-0.5" /><span>Email alerts for selected states</span></li>
            </ul>
            <Button onClick={() => navigate('/contact')} className="w-full bg-black hover:bg-gray-800">Request Pricing</Button>
          </Card>
          <Card className="p-8 border-2 border-black">
            <h3 className="text-2xl font-bold mb-2">Team</h3>
            <p className="text-gray-600 mb-6">Ideal for law firms and in-house teams</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2"><Check className="w-5 h-5 text-black mt-0.5" /><span>3–10 users</span></li>
              <li className="flex items-start gap-2"><Check className="w-5 h-5 text-black mt-0.5" /><span>Shared saved searches and alerts</span></li>
              <li className="flex items-start gap-2"><Check className="w-5 h-5 text-black mt-0.5" /><span>Priority support</span></li>
            </ul>
            <Button onClick={() => navigate('/contact')} className="w-full bg-black hover:bg-gray-800">Talk to Sales</Button>
          </Card>
          <Card className="p-8">
            <h3 className="text-2xl font-bold mb-2">Enterprise & API</h3>
            <p className="text-gray-600 mb-6">For platforms and multi-state operators</p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-2"><Check className="w-5 h-5 text-black mt-0.5" /><span>Unlimited users</span></li>
              <li className="flex items-start gap-2"><Check className="w-5 h-5 text-black mt-0.5" /><span>API access</span></li>
              <li className="flex items-start gap-2"><Check className="w-5 h-5 text-black mt-0.5" /><span>Custom integrations</span></li>
            </ul>
            <Button onClick={() => navigate('/contact')} className="w-full bg-black hover:bg-gray-800">Contact Us</Button>
          </Card>
        </div>
      </div>
    </section>
  );
};
