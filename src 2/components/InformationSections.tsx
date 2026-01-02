import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Building2, TrendingUp } from "lucide-react";

export const LegalSection = () => (
  <section className="py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-center">Designed for Legal and Compliance Professionals</h2>
      <p className="text-lg mb-8 text-center text-gray-700 max-w-3xl mx-auto">
        TCP gives law firms, in-house counsel, and compliance officers a practical, daily-use tool for managing regulatory risk in emerging markets.
      </p>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6"><p className="text-gray-700">Quickly answer client questions on multi-state legality by product and supply chain stage</p></Card>
        <Card className="p-6"><p className="text-gray-700">Monitor new developments without tracking 50+ newsletters, blogs, and agency sites</p></Card>
        <Card className="p-6"><p className="text-gray-700">Export insights to support client memos, risk assessments, and internal briefings</p></Card>
      </div>
      <div className="text-center">
        <Button size="lg" className="bg-black hover:bg-gray-800">Book a 20-minute demo <ArrowRight className="ml-2 w-4 h-4" /></Button>
      </div>
    </div>
  </section>
);

export const OperatorsSection = () => (
  <section className="py-16 px-4 bg-gray-50">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-4 text-center">Clarity for Operators, Brands, and Investors</h2>
      <p className="text-lg mb-12 text-center text-gray-700 max-w-3xl mx-auto">
        Whether you're launching a new product, expanding into new states, or evaluating an investment, TCP gives you the regulatory clarity you need to move with confidence.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
        <Card className="p-8">
          <Building2 className="w-10 h-10 text-black mb-4" />
          <h3 className="text-xl font-bold mb-4">For Operators & Brands</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2"><span className="text-black">•</span><span>Validate product concepts before launch</span></li>
            <li className="flex items-start gap-2"><span className="text-black">•</span><span>Plan multi-state expansion with clear regulatory maps</span></li>
            <li className="flex items-start gap-2"><span className="text-black">•</span><span>Reduce the risk of recalls and enforcement actions</span></li>
          </ul>
        </Card>
        <Card className="p-8">
          <TrendingUp className="w-10 h-10 text-black mb-4" />
          <h3 className="text-xl font-bold mb-4">For Investors & M&A Teams</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-2"><span className="text-black">•</span><span>Assess regulatory risk in deals and portfolios</span></li>
            <li className="flex items-start gap-2"><span className="text-black">•</span><span>Standardize compliance checks across targets</span></li>
            <li className="flex items-start gap-2"><span className="text-black">•</span><span>Support diligence with structured, documented regulatory data</span></li>
          </ul>
        </Card>
      </div>
    </div>
  </section>
);

export const HowItWorksSection = () => (
  <section className="py-16 px-4">
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold mb-12 text-center">How TCP Works</h2>
      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
          <h3 className="text-xl font-bold mb-3">Choose your product category</h3>
          <p className="text-gray-600">Hemp/CBD, THCa, Delta-8, Delta-9, Kratom, Psychedelics, Nicotine/Vapes, Kava.</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
          <h3 className="text-xl font-bold mb-3">Select your states and filters</h3>
          <p className="text-gray-600">View statutes, rules, guidance, and enforcement actions across 50 states + DC.</p>
        </div>
        <div className="text-center">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
          <h3 className="text-xl font-bold mb-3">Review, export, and act</h3>
          <p className="text-gray-600">Use TCP insights to guide product launches, client advice, and compliance decisions.</p>
        </div>
      </div>
    </div>
  </section>
);

