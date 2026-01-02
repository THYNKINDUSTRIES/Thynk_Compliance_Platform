import React from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Shield, Database, Cookie, Users, Lock, Mail, FileText, Eye, Trash2, Download } from 'lucide-react';

const Privacy: React.FC = () => {
  const lastUpdated = "December 19, 2025";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#794108] to-[#5a3006] text-white py-16">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
            </div>
            <p className="text-xl text-gray-200">
              Your privacy is important to us. This policy explains how we collect, use, and protect your information.
            </p>
            <p className="text-sm text-gray-300 mt-4">Last Updated: {lastUpdated}</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Table of Contents */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <nav className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <a href="#introduction" className="text-[#794108] hover:underline">1. Introduction</a>
              <a href="#data-collection" className="text-[#794108] hover:underline">2. Data Collection</a>
              <a href="#data-usage" className="text-[#794108] hover:underline">3. How We Use Your Data</a>
              <a href="#cookies" className="text-[#794108] hover:underline">4. Cookies & Tracking</a>
              <a href="#third-party" className="text-[#794108] hover:underline">5. Third-Party Services</a>
              <a href="#data-security" className="text-[#794108] hover:underline">6. Data Security</a>
              <a href="#user-rights" className="text-[#794108] hover:underline">7. Your Rights</a>
              <a href="#data-retention" className="text-[#794108] hover:underline">8. Data Retention</a>
              <a href="#children" className="text-[#794108] hover:underline">9. Children's Privacy</a>
              <a href="#changes" className="text-[#794108] hover:underline">10. Policy Changes</a>
              <a href="#contact" className="text-[#794108] hover:underline">11. Contact Us</a>
            </nav>
          </div>

          {/* Section 1: Introduction */}
          <section id="introduction" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <FileText className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">1. Introduction</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">
                Thynk Industries ("we," "our," or "us") operates the regulatory intelligence platform 
                that provides information about hemp, cannabinoid, kratom, psychedelics, and alternative 
                wellness industry regulations. This Privacy Policy explains how we collect, use, disclose, 
                and safeguard your information when you visit our website and use our services.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                By accessing or using our services, you agree to this Privacy Policy. If you do not agree 
                with the terms of this Privacy Policy, please do not access the site or use our services.
              </p>
            </div>
          </section>

          {/* Section 2: Data Collection */}
          <section id="data-collection" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <Database className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">2. Data Collection</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect information that you provide directly to us and information that is 
                automatically collected when you use our services.
              </p>
              
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Information You Provide</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, password, and organization details when you create an account</li>
                <li><strong>Profile Information:</strong> Job title, industry, and preferences you choose to provide</li>
                <li><strong>Communication Data:</strong> Information you provide when contacting our support team or submitting feedback</li>
                <li><strong>Payment Information:</strong> Billing address and payment details (processed securely through third-party payment processors)</li>
                <li><strong>User Content:</strong> Comments, saved regulations, compliance checklists, and other content you create</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Automatically Collected Information</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform</li>
                <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
                <li><strong>Location Data:</strong> General geographic location based on IP address</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Data Usage */}
          <section id="data-usage" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <Eye className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">3. How We Use Your Data</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We use the information we collect for the following purposes:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Service Delivery</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Provide and maintain our services</li>
                    <li>• Process your transactions</li>
                    <li>• Send regulatory alerts and updates</li>
                    <li>• Manage your account</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Communication</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Respond to your inquiries</li>
                    <li>• Send service announcements</li>
                    <li>• Provide customer support</li>
                    <li>• Send marketing communications (with consent)</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Improvement</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Analyze usage patterns</li>
                    <li>• Develop new features</li>
                    <li>• Improve user experience</li>
                    <li>• Conduct research and analytics</li>
                  </ul>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-2">Security & Legal</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Detect and prevent fraud</li>
                    <li>• Enforce our terms of service</li>
                    <li>• Comply with legal obligations</li>
                    <li>• Protect our rights and property</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Cookies */}
          <section id="cookies" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <Cookie className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">4. Cookies & Tracking Technologies</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to collect and track information about 
                your activity on our platform.
              </p>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Cookie Type</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Purpose</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-800">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Essential</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Required for basic site functionality and security</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Functional</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Remember your preferences and settings</td>
                      <td className="px-4 py-3 text-sm text-gray-600">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Analytics</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Understand how visitors interact with our site</td>
                      <td className="px-4 py-3 text-sm text-gray-600">2 years</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 text-sm text-gray-600">Marketing</td>
                      <td className="px-4 py-3 text-sm text-gray-600">Deliver relevant advertisements</td>
                      <td className="px-4 py-3 text-sm text-gray-600">90 days</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-gray-600 leading-relaxed mt-4">
                You can control cookies through your browser settings. Note that disabling certain 
                cookies may affect the functionality of our services.
              </p>
            </div>
          </section>

          {/* Section 5: Third-Party Services */}
          <section id="third-party" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <Users className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">5. Third-Party Services</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We may share your information with third-party service providers who assist us in 
                operating our platform:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Cloud Infrastructure:</strong> Supabase, Vercel, and Cloudflare for hosting and data storage</li>
                <li><strong>Payment Processing:</strong> Stripe for secure payment handling</li>
                <li><strong>Analytics:</strong> Google Analytics for usage analysis</li>
                <li><strong>Email Services:</strong> SendGrid for transactional and marketing emails</li>
                <li><strong>Customer Support:</strong> Intercom for help desk and chat support</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                These third parties are contractually obligated to protect your information and may 
                only use it for the specific purposes we authorize.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                We may also disclose your information when required by law, to protect our rights, 
                or in connection with a business transfer such as a merger or acquisition.
              </p>
            </div>
          </section>

          {/* Section 6: Data Security */}
          <section id="data-security" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <Lock className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">6. Data Security</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your 
                personal information:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Encryption</h4>
                  <p className="text-sm text-green-700">All data transmitted using TLS/SSL encryption. Data at rest encrypted using AES-256.</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Access Controls</h4>
                  <p className="text-sm text-blue-700">Role-based access controls and multi-factor authentication for sensitive systems.</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Monitoring</h4>
                  <p className="text-sm text-purple-700">24/7 security monitoring, regular audits, and vulnerability assessments.</p>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed mt-4">
                While we strive to protect your information, no method of transmission over the 
                Internet is 100% secure. We cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* Section 7: User Rights */}
          <section id="user-rights" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <Shield className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">7. Your Rights</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Eye className="h-5 w-5 text-[#794108] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Right to Access</h4>
                    <p className="text-sm text-gray-600">Request a copy of the personal data we hold about you.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <FileText className="h-5 w-5 text-[#794108] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Right to Rectification</h4>
                    <p className="text-sm text-gray-600">Request correction of inaccurate or incomplete data.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Trash2 className="h-5 w-5 text-[#794108] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Right to Erasure</h4>
                    <p className="text-sm text-gray-600">Request deletion of your personal data under certain circumstances.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Download className="h-5 w-5 text-[#794108] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Right to Data Portability</h4>
                    <p className="text-sm text-gray-600">Receive your data in a structured, machine-readable format.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Lock className="h-5 w-5 text-[#794108] mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-800">Right to Restrict Processing</h4>
                    <p className="text-sm text-gray-600">Request limitation of how we use your data.</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed mt-4">
                To exercise any of these rights, please contact us at privacy@thynk.guru. We will 
                respond to your request within 30 days.
              </p>
            </div>
          </section>

          {/* Section 8: Data Retention */}
          <section id="data-retention" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <Database className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">8. Data Retention</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We retain your personal information for as long as necessary to fulfill the purposes 
                outlined in this Privacy Policy, unless a longer retention period is required by law.
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Account Data:</strong> Retained while your account is active and for 2 years after deletion</li>
                <li><strong>Transaction Records:</strong> Retained for 7 years for tax and legal compliance</li>
                <li><strong>Usage Logs:</strong> Retained for 90 days for security and analytics purposes</li>
                <li><strong>Marketing Preferences:</strong> Retained until you opt out or delete your account</li>
              </ul>
            </div>
          </section>

          {/* Section 9: Children's Privacy */}
          <section id="children" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <Users className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">9. Children's Privacy</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">
                Our services are not intended for individuals under the age of 18. We do not knowingly 
                collect personal information from children. If you are a parent or guardian and believe 
                your child has provided us with personal information, please contact us immediately. 
                If we discover that we have collected personal information from a child without 
                parental consent, we will delete that information promptly.
              </p>
            </div>
          </section>

          {/* Section 10: Policy Changes */}
          <section id="changes" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <FileText className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">10. Changes to This Policy</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any 
                material changes by posting the new Privacy Policy on this page and updating the 
                "Last Updated" date. For significant changes, we will also send you an email 
                notification. We encourage you to review this Privacy Policy periodically for 
                any changes.
              </p>
            </div>
          </section>

          {/* Section 11: Contact */}
          <section id="contact" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-[#794108]/10 rounded-lg">
                <Mail className="h-6 w-6 text-[#794108]" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">11. Contact Us</h2>
            </div>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please 
                contact us:
              </p>
              <div className="bg-[#794108]/5 border border-[#794108]/20 rounded-lg p-6">
                <h4 className="font-semibold text-gray-800 mb-4">Thynk Industries - Privacy Team</h4>
                <div className="space-y-2 text-gray-600">
                  <p><strong>Email:</strong> privacy@thynk.guru</p>
                  <p><strong>General Inquiries:</strong> support@thynk.guru</p>
                  <p><strong>Website:</strong> <a href="https://www.thynk.guru" target="_blank" rel="noopener noreferrer" className="text-[#794108] hover:underline">www.thynk.guru</a></p>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  We aim to respond to all privacy-related inquiries within 5 business days.
                </p>
              </div>
            </div>
          </section>

          {/* California Privacy Rights Notice */}
          <section className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-3">California Privacy Rights (CCPA)</h3>
            <p className="text-amber-700 text-sm leading-relaxed">
              If you are a California resident, you have additional rights under the California Consumer 
              Privacy Act (CCPA), including the right to know what personal information we collect, 
              the right to delete your personal information, and the right to opt-out of the sale of 
              your personal information. We do not sell personal information. To exercise your CCPA 
              rights, please contact us at privacy@thynk.guru.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
