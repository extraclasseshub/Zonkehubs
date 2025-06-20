import React from 'react';
import { X, FileText, Shield, Cookie, ExternalLink } from 'lucide-react';

interface LegalModalProps {
  type: 'terms' | 'privacy' | 'cookies';
  onClose: () => void;
}

export default function LegalModal({ type, onClose }: LegalModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'terms':
        return <FileText className="h-6 w-6 text-[#3db2ff]" />;
      case 'privacy':
        return <Shield className="h-6 w-6 text-[#3db2ff]" />;
      case 'cookies':
        return <Cookie className="h-6 w-6 text-[#3db2ff]" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'terms':
        return 'Terms & Conditions';
      case 'privacy':
        return 'Privacy Policy';
      case 'cookies':
        return 'Cookie Policy';
    }
  };

  const getContent = () => {
    switch (type) {
      case 'terms':
        return (
          <div className="space-y-6 text-[#cbd5e1]">
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h3>
              <p className="leading-relaxed mb-3">
                By accessing and using Zonke Hub, you accept and agree to be bound by the terms and provisions of this agreement. 
                If you do not agree to abide by these terms, please do not use this service.
              </p>
              <p className="leading-relaxed">
                These Terms of Service ("Terms") govern your access to and use of the Zonke Hub platform, including any content, functionality, and services offered.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">2. Service Description</h3>
              <p className="leading-relaxed mb-3">
                Zonke Hub is a platform that connects service seekers with local service providers across South Africa. We facilitate:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Discovery of verified local service providers</li>
                <li>Secure communication between users and providers</li>
                <li>Transparent rating and review systems</li>
                <li>Comprehensive profile management for service providers</li>
                <li>Location-based matching within customizable radius</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">3. User Responsibilities</h3>
              <p className="leading-relaxed mb-3">Users agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide accurate and truthful information</li>
                <li>Respect other users and maintain professional conduct</li>
                <li>Not use the platform for illegal activities</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Respect intellectual property rights</li>
                <li>Maintain the confidentiality of their account credentials</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">4. Service Provider Terms</h3>
              <p className="leading-relaxed mb-3">Service providers additionally agree to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintain appropriate licenses and certifications</li>
                <li>Provide services as described in their profiles</li>
                <li>Handle customer data responsibly</li>
                <li>Resolve disputes professionally</li>
                <li>Respond to customer inquiries in a timely manner</li>
                <li>Maintain accurate availability information</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">5. Limitation of Liability</h3>
              <p className="leading-relaxed">
                Zonke Hub acts as a platform facilitator only. We are not responsible for the quality, safety, or legality 
                of services provided by third-party service providers. Users engage with service providers at their own risk.
                Zonke Hub does not guarantee the quality or availability of any service provider listed on the platform.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">6. Termination</h3>
              <p className="leading-relaxed">
                We reserve the right to terminate or suspend accounts that violate these terms or engage in harmful behavior 
                towards other users. Users may terminate their account at any time by contacting our support team.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">7. Changes to Terms</h3>
              <p className="leading-relaxed">
                We may update these terms from time to time. Users will be notified of significant changes via email or 
                platform notifications.
              </p>
            </section>

            <div className="bg-slate-700/30 rounded-lg p-4 mt-6 border border-slate-600/50">
              <p className="text-sm">
                <strong>Last updated:</strong> December 19, 2024
              </p>
              <p className="text-sm mt-2">
                For questions about these terms, contact us at{' '}
                <a href="mailto:legal@zonkehub.com" className="text-[#3db2ff] hover:text-blue-400">
                  legal@zonkehub.com
                </a>
              </p>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6 text-[#cbd5e1]">
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h3>
              <p className="leading-relaxed mb-3">We collect information you provide directly to us:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account information (name, email, password)</li>
                <li>Profile information (business details, services, location)</li>
                <li>Communication data (messages, reviews, ratings)</li>
                <li>Usage information (search queries, preferences)</li>
                <li>Device information (browser type, IP address, device type)</li>
                <li>Location data (when permitted by your device settings)</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h3>
              <p className="leading-relaxed mb-3">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and improve our services</li>
                <li>Connect users with service providers</li>
                <li>Process communications and transactions</li>
                <li>Send important updates and notifications</li>
                <li>Ensure platform safety and security</li>
                <li>Analyze usage patterns to enhance user experience</li>
                <li>Prevent fraud and abuse of our services</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">3. Information Sharing</h3>
              <p className="leading-relaxed mb-3">We may share your information:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With other users as part of the platform functionality</li>
                <li>With service providers to facilitate connections</li>
                <li>When required by law or to protect our rights</li>
                <li>With trusted partners who help us operate the platform</li>
              </ul>
              <p className="leading-relaxed mt-3">
                We never sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">4. Data Security</h3>
              <p className="leading-relaxed">
                We implement appropriate security measures to protect your information against unauthorized access, 
                alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.
                However, no method of transmission over the Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">5. Your Rights</h3>
              <p className="leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential communications</li>
                <li>Request a copy of your data</li>
                <li>Report privacy concerns</li>
                <li>Object to certain processing of your data</li>
                <li>Withdraw consent where applicable</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">6. Location Data</h3>
              <p className="leading-relaxed">
                We may collect location information to help connect you with nearby service providers. You can control 
                location sharing through your device settings and our platform preferences.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">7. Children's Privacy</h3>
              <p className="leading-relaxed">
                Our service is not intended for children under 18. We do not knowingly collect personal information 
                from children under 18. If we become aware that we have collected personal information from a child 
                under 18, we will take steps to delete that information.
              </p>
            </section>

            <div className="bg-slate-700/30 rounded-lg p-4 mt-6 border border-slate-600/50">
              <p className="text-sm">
                <strong>Last updated:</strong> December 19, 2024
              </p>
              <p className="text-sm mt-2">
                For privacy questions, contact us at{' '}
                <a href="mailto:privacy@zonkehub.com" className="text-[#3db2ff] hover:text-blue-400">
                  privacy@zonkehub.com
                </a>
              </p>
            </div>
          </div>
        );

      case 'cookies':
        return (
          <div className="space-y-6 text-[#cbd5e1]">
            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">1. What Are Cookies</h3>
              <p className="leading-relaxed">
                Cookies are small text files that are stored on your device when you visit our website. They help us 
                provide you with a better experience by remembering your preferences and improving our services.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">2. Types of Cookies We Use</h3>
              
              <div className="space-y-4">
                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <h4 className="font-semibold text-white mb-2">Essential Cookies</h4>
                  <p className="text-sm">
                    Required for the website to function properly. These include authentication, security, and basic functionality.
                  </p>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <h4 className="font-semibold text-white mb-2">Functional Cookies</h4>
                  <p className="text-sm">
                    Remember your preferences and settings to provide a personalized experience.
                  </p>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <h4 className="font-semibold text-white mb-2">Analytics Cookies</h4>
                  <p className="text-sm">
                    Help us understand how visitors interact with our website to improve our services.
                  </p>
                </div>

                <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
                  <h4 className="font-semibold text-white mb-2">Marketing Cookies</h4>
                  <p className="text-sm">
                    Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">3. Third-Party Cookies</h3>
              <p className="leading-relaxed mb-3">We may use third-party services that set cookies:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Google Analytics for website analytics</li>
                <li>Mapbox for location services</li>
                <li>Supabase for authentication and data storage</li>
                <li>Social media platforms for sharing features</li>
                <li>Payment processors for secure transactions</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">4. Managing Cookies</h3>
              <p className="leading-relaxed mb-3">You can control cookies through:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Your browser settings (delete, block, or allow cookies)</li>
                <li>Our cookie preferences center (coming soon)</li>
                <li>Opting out of third-party analytics services</li>
                <li>Using private/incognito browsing mode</li>
              </ul>
              <p className="leading-relaxed mt-3">
                Note: Disabling essential cookies may affect website functionality.
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">5. Cookie Retention</h3>
              <p className="leading-relaxed mb-3">
                Cookies are retained for different periods depending on their purpose:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Session cookies: Deleted when you close your browser</li>
                <li>Persistent cookies: Stored for up to 2 years</li>
                <li>Analytics cookies: Typically stored for 2 years</li>
                <li>Marketing cookies: Usually stored for 30-90 days</li>
              </ul>
            </section>

            <section className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3">6. Updates to Cookie Policy</h3>
              <p className="leading-relaxed">
                We may update this cookie policy to reflect changes in our practices or for legal reasons. 
                We'll notify you of significant changes through our website or email.
              </p>
            </section>

            <div className="bg-slate-700/30 rounded-lg p-4 mt-6 border border-slate-600/50">
              <p className="text-sm">
                <strong>Last updated:</strong> December 19, 2024
              </p>
              <p className="text-sm mt-2">
                For cookie-related questions, contact us at{' '}
                <a href="mailto:cookies@zonkehub.com" className="text-[#3db2ff] hover:text-blue-400">
                  cookies@zonkehub.com
                </a>
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0d182c] rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-slate-900">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {getContent()}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 bg-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-[#cbd5e1]">
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Need help? Contact our support team</span>
              <span className="sm:hidden">Contact support</span>
            </div>
            <button
              onClick={onClose}
              className="bg-[#3db2ff] hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}