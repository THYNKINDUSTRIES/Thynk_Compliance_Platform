import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  FileText, 
  Scale, 
  Users, 
  Shield, 
  AlertTriangle, 
  XCircle, 
  Gavel,
  CheckCircle,
  Clock,
  Mail
} from 'lucide-react';

const Terms: React.FC = () => {
  const lastUpdated = "December 19, 2025";
  const effectiveDate = "December 19, 2025";

  const sections = [
    { id: 'acceptance', title: '1. Acceptance of Terms', icon: CheckCircle },
    { id: 'description', title: '2. Service Description', icon: FileText },
    { id: 'eligibility', title: '3. Eligibility', icon: Users },
    { id: 'accounts', title: '4. User Accounts', icon: Shield },
    { id: 'responsibilities', title: '5. User Responsibilities', icon: Scale },
    { id: 'prohibited', title: '6. Prohibited Conduct', icon: XCircle },
    { id: 'intellectual-property', title: '7. Intellectual Property', icon: FileText },
    { id: 'disclaimer', title: '8. Disclaimer of Warranties', icon: AlertTriangle },
    { id: 'limitation', title: '9. Limitation of Liability', icon: Shield },
    { id: 'indemnification', title: '10. Indemnification', icon: Scale },
    { id: 'termination', title: '11. Termination', icon: XCircle },
    { id: 'modifications', title: '12. Modifications to Terms', icon: Clock },
    { id: 'governing-law', title: '13. Governing Law', icon: Gavel },
    { id: 'dispute-resolution', title: '14. Dispute Resolution', icon: Scale },
    { id: 'contact', title: '15. Contact Information', icon: Mail },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col">
      <Header />
      
      <main className="flex-grow pt-20">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-[#794108] to-[#5a3006] text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-full mb-6">
              <Gavel className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
            <p className="text-xl text-white/80 mb-4">
              Please read these terms carefully before using our services
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-white/70">
              <span>Effective Date: {effectiveDate}</span>
              <span className="hidden sm:inline">•</span>
              <span>Last Updated: {lastUpdated}</span>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Table of Contents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-10">
            <h2 className="text-lg font-semibold text-[#794108] mb-4">Table of Contents</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-center gap-2 text-gray-600 hover:text-[#794108] transition-colors py-1"
                >
                  <section.icon className="h-4 w-4 text-[#E89C5C]" />
                  <span className="text-sm">{section.title}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Terms Content */}
          <div className="prose prose-lg max-w-none">
            
            {/* Section 1: Acceptance of Terms */}
            <section id="acceptance" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">1. Acceptance of Terms</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-700 mb-4">
                  By accessing or using the Thynk Industries regulatory intelligence platform ("Service"), 
                  you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these 
                  Terms, you may not access or use the Service.
                </p>
                <p className="text-gray-700 mb-4">
                  These Terms constitute a legally binding agreement between you and Thynk Industries 
                  ("Company," "we," "us," or "our") governing your use of the Service.
                </p>
                <p className="text-gray-700">
                  By using the Service, you represent that you have read, understood, and agree to be 
                  bound by these Terms. If you are using the Service on behalf of an organization, you 
                  represent that you have the authority to bind that organization to these Terms.
                </p>
              </div>
            </section>

            {/* Section 2: Service Description */}
            <section id="description" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <FileText className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">2. Service Description</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-700 mb-4">
                  Thynk Industries provides a regulatory intelligence platform that offers:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Regulatory tracking and monitoring for hemp, cannabinoid, kratom, psychedelics, and alternative wellness industries</li>
                  <li>State and federal regulation databases</li>
                  <li>Compliance checklists and templates</li>
                  <li>Alert notifications for regulatory changes</li>
                  <li>Analytical tools and dashboards</li>
                  <li>API access for enterprise users</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-amber-800 text-sm font-medium mb-2">Important Notice:</p>
                  <p className="text-amber-700 text-sm">
                    The Service provides information for educational and informational purposes only. 
                    It does not constitute legal advice. Always consult with qualified legal counsel 
                    for specific legal questions or compliance matters.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Eligibility */}
            <section id="eligibility" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <Users className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">3. Eligibility</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-700 mb-4">To use the Service, you must:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Be at least 18 years of age</li>
                  <li>Have the legal capacity to enter into a binding agreement</li>
                  <li>Not be prohibited from using the Service under applicable laws</li>
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                </ul>
              </div>
            </section>

            {/* Section 4: User Accounts */}
            <section id="accounts" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <Shield className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">4. User Accounts</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.1 Account Creation</h3>
                <p className="text-gray-700 mb-4">
                  To access certain features of the Service, you must create an account. You agree to 
                  provide accurate, current, and complete information during registration and to update 
                  such information as necessary.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.2 Account Security</h3>
                <p className="text-gray-700 mb-4">
                  You are responsible for maintaining the confidentiality of your account credentials 
                  and for all activities that occur under your account. You must immediately notify us 
                  of any unauthorized use of your account.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">4.3 Account Termination</h3>
                <p className="text-gray-700">
                  We reserve the right to suspend or terminate your account at any time for violation 
                  of these Terms or for any other reason at our sole discretion.
                </p>
              </div>
            </section>

            {/* Section 5: User Responsibilities */}
            <section id="responsibilities" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <Scale className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">5. User Responsibilities</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-700 mb-4">As a user of the Service, you agree to:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Use the Service only for lawful purposes and in accordance with these Terms</li>
                  <li>Comply with all applicable laws, regulations, and industry standards</li>
                  <li>Respect the intellectual property rights of Thynk Industries and third parties</li>
                  <li>Not attempt to gain unauthorized access to any part of the Service</li>
                  <li>Not interfere with or disrupt the Service or servers connected to the Service</li>
                  <li>Not use the Service to transmit harmful code or malware</li>
                  <li>Not use automated systems to access the Service without permission</li>
                  <li>Verify all regulatory information with official sources before relying on it</li>
                </ul>
              </div>
            </section>

            {/* Section 6: Prohibited Conduct */}
            <section id="prohibited" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <XCircle className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">6. Prohibited Conduct</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-700 mb-4">You may not:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>Copy, modify, or distribute any content from the Service without authorization</li>
                  <li>Use the Service for any illegal or unauthorized purpose</li>
                  <li>Attempt to reverse engineer or decompile any part of the Service</li>
                  <li>Remove any copyright, trademark, or other proprietary notices</li>
                  <li>Use the Service to compete with Thynk Industries</li>
                  <li>Resell, sublicense, or redistribute access to the Service</li>
                  <li>Impersonate any person or entity</li>
                  <li>Collect or harvest user data without consent</li>
                  <li>Use the Service to send spam or unsolicited communications</li>
                </ul>
              </div>
            </section>

            {/* Section 7: Intellectual Property */}
            <section id="intellectual-property" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <FileText className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">7. Intellectual Property</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7.1 Our Intellectual Property</h3>
                <p className="text-gray-700 mb-4">
                  The Service, including all content, features, and functionality, is owned by 
                  Thynk Industries and is protected by copyright, trademark, and other intellectual 
                  property laws. Our trademarks and trade dress may not be used without our prior 
                  written consent.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7.2 License to Use</h3>
                <p className="text-gray-700 mb-4">
                  Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, 
                  revocable license to access and use the Service for your internal business purposes.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">7.3 User Content</h3>
                <p className="text-gray-700">
                  You retain ownership of any content you submit to the Service. By submitting content, 
                  you grant us a worldwide, royalty-free license to use, reproduce, and display such 
                  content in connection with operating and improving the Service.
                </p>
              </div>
            </section>

            {/* Section 8: Disclaimer of Warranties */}
            <section id="disclaimer" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">8. Disclaimer of Warranties</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm font-semibold uppercase">Important Legal Notice</p>
                </div>
                <p className="text-gray-700 mb-4">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
                  EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
                  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
                <p className="text-gray-700 mb-4">
                  We do not warrant that:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2">
                  <li>The Service will be uninterrupted, secure, or error-free</li>
                  <li>The information provided is complete, accurate, or current</li>
                  <li>The Service will meet your specific requirements</li>
                  <li>Any defects in the Service will be corrected</li>
                </ul>
              </div>
            </section>

            {/* Section 9: Limitation of Liability */}
            <section id="limitation" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <Shield className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">9. Limitation of Liability</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-700 mb-4">
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, THYNK INDUSTRIES SHALL NOT BE LIABLE FOR 
                  ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING 
                  BUT NOT LIMITED TO:
                </p>
                <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                  <li>Loss of profits, revenue, or business opportunities</li>
                  <li>Loss of data or information</li>
                  <li>Business interruption</li>
                  <li>Regulatory fines or penalties</li>
                  <li>Legal fees or costs</li>
                </ul>
                <p className="text-gray-700">
                  Our total liability for any claims arising from your use of the Service shall not 
                  exceed the amount you paid to us in the twelve (12) months preceding the claim.
                </p>
              </div>
            </section>

            {/* Section 10: Indemnification */}
            <section id="indemnification" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <Scale className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">10. Indemnification</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-700">
                  You agree to indemnify, defend, and hold harmless Thynk Industries and its officers, 
                  directors, employees, agents, and affiliates from and against any claims, liabilities, 
                  damages, losses, costs, and expenses (including reasonable attorneys' fees) arising 
                  from or related to: (a) your use of the Service; (b) your violation of these Terms; 
                  (c) your violation of any rights of another party; or (d) your violation of any 
                  applicable laws or regulations.
                </p>
              </div>
            </section>

            {/* Section 11: Termination */}
            <section id="termination" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <XCircle className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">11. Termination</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">11.1 Termination by You</h3>
                <p className="text-gray-700 mb-4">
                  You may terminate your account at any time by contacting us or using the account 
                  deletion feature in your settings.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">11.2 Termination by Us</h3>
                <p className="text-gray-700 mb-4">
                  We may terminate or suspend your access to the Service immediately, without prior 
                  notice or liability, for any reason, including breach of these Terms.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">11.3 Effect of Termination</h3>
                <p className="text-gray-700">
                  Upon termination, your right to use the Service will immediately cease. All provisions 
                  of these Terms that should survive termination shall survive, including intellectual 
                  property provisions, disclaimers, and limitations of liability.
                </p>
              </div>
            </section>

            {/* Section 12: Modifications to Terms */}
            <section id="modifications" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <Clock className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">12. Modifications to Terms</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-700 mb-4">
                  We reserve the right to modify these Terms at any time. We will notify you of any 
                  material changes by posting the updated Terms on the Service and updating the 
                  "Last Updated" date.
                </p>
                <p className="text-gray-700">
                  Your continued use of the Service after any changes constitutes your acceptance of 
                  the new Terms. If you do not agree to the modified Terms, you must stop using the 
                  Service.
                </p>
              </div>
            </section>

            {/* Section 13: Governing Law */}
            <section id="governing-law" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <Gavel className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">13. Governing Law</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-700 mb-4">
                  These Terms shall be governed by and construed in accordance with the laws of the 
                  State of Delaware, United States, without regard to its conflict of law provisions.
                </p>
                <p className="text-gray-700">
                  Any legal action or proceeding arising out of or relating to these Terms shall be 
                  brought exclusively in the federal or state courts located in Delaware, and you 
                  consent to the personal jurisdiction of such courts.
                </p>
              </div>
            </section>

            {/* Section 14: Dispute Resolution */}
            <section id="dispute-resolution" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <Scale className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">14. Dispute Resolution</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">14.1 Informal Resolution</h3>
                <p className="text-gray-700 mb-4">
                  Before filing any legal claim, you agree to attempt to resolve any dispute informally 
                  by contacting us. We will attempt to resolve the dispute within 30 days.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">14.2 Arbitration</h3>
                <p className="text-gray-700 mb-4">
                  If informal resolution fails, any dispute shall be resolved by binding arbitration 
                  in accordance with the rules of the American Arbitration Association. The arbitration 
                  shall be conducted in Delaware.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">14.3 Class Action Waiver</h3>
                <p className="text-gray-700">
                  You agree that any dispute resolution proceedings will be conducted only on an 
                  individual basis and not in a class, consolidated, or representative action.
                </p>
              </div>
            </section>

            {/* Section 15: Contact Information */}
            <section id="contact" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#794108]/10 rounded-lg">
                  <Mail className="h-6 w-6 text-[#794108]" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 m-0">15. Contact Information</h2>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-700 mb-4">
                  If you have any questions about these Terms, please contact us:
                </p>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-900 mb-2">Thynk Industries</p>
                  <p className="text-gray-700">Email: legal@thynk.guru</p>
                  <p className="text-gray-700">Website: www.thynk.guru</p>
                </div>
              </div>
            </section>

            {/* Additional Provisions */}
            <section className="mb-12">
              <div className="bg-[#794108]/5 rounded-xl p-6 border border-[#794108]/20">
                <h2 className="text-xl font-bold text-[#794108] mb-4">Additional Provisions</h2>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Severability</h3>
                <p className="text-gray-700 mb-4">
                  If any provision of these Terms is found to be unenforceable, the remaining provisions 
                  will continue in full force and effect.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Entire Agreement</h3>
                <p className="text-gray-700 mb-4">
                  These Terms, together with our <Link to="/privacy" className="text-[#794108] hover:underline">Privacy Policy</Link>, 
                  constitute the entire agreement between you and Thynk Industries regarding the Service.
                </p>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Waiver</h3>
                <p className="text-gray-700">
                  Our failure to enforce any right or provision of these Terms will not be considered 
                  a waiver of such right or provision.
                </p>
              </div>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
