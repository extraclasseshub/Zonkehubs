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
        return <Shield className="h-6 w-6 text-[#00c9a7]" />;
      case 'cookies':
        return <Cookie className="h-6 w-6 text-[#f59e0b]" />;
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
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h3>
              <p className="text-[#cbd5e1] leading-relaxed">
                By accessing and using Zonke Hub, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">2. Service Description</h3>
              <p className="text-[#cbd5e1] leading-relaxed mb-3">
                Zonke Hub is a platform that connects service seekers with local service providers. We facilitate:
              </p>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-2 ml-4">
                <li>Discovery of local service providers</li>
                <li>Communication between users and providers</li>
                <li>Rating and review systems</li>
                <li>Profile management for service providers</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">3. User Responsibilities</h3>
              <p className="text-[#cbd5e1] leading-relaxed mb-3">Users agree to:</p>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-2 ml-4">
                <li>Provide accurate and truthful information</li>
                <li>Respect other users and maintain professional conduct</li>
                <li>Not use the platform for illegal activities</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Respect intellectual property rights</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">4. Service Provider Terms</h3>
              <p className="text-[#cbd5e1] leading-relaxed mb-3">Service providers additionally agree to:</p>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-2 ml-4">
                <li>Maintain appropriate licenses and certifications</li>
                <li>Provide services as described in their profiles</li>
                <li>Handle customer data responsibly</li>
                <li>Resolve disputes professionally</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">5. Limitation of Liability</h3>
              <p className="text-[#cbd5e1] leading-relaxed">
                Zonke Hub acts as a platform facilitator only. We are not responsible for the quality, safety, or legality 
                of services provided by third-party service providers. Users engage with service providers at their own risk.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">6. Termination</h3>
              <p className="text-[#cbd5e1] leading-relaxed">
                We reserve the right to terminate or suspend accounts that violate these terms or engage in harmful behavior 
                towards other users.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">7. Changes to Terms</h3>
              <p className="text-[#cbd5e1] leading-relaxed">
                We may update these terms from time to time. Users will be notified of significant changes via email or 
                platform notifications.
              </p>
            </section>

            <div className="bg-slate-700 rounded-lg p-4 mt-6">
              <p className="text-sm text-[#cbd5e1]">
                <strong>Last updated:</strong> December 19, 2024
              </p>
              <p className="text-sm text-[#cbd5e1] mt-2">
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
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h3>
              <p className="text-[#cbd5e1] leading-relaxed mb-3">We collect information you provide directly to us:</p>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-2 ml-4">
                <li>Account information (name, email, password)</li>
                <li>Profile information (business details, services, location)</li>
                <li>Communication data (messages, reviews, ratings)</li>
                <li>Usage information (search queries, preferences)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h3>
              <p className="text-[#cbd5e1] leading-relaxed mb-3">We use your information to:</p>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-2 ml-4">
                <li>Provide and improve our services</li>
                <li>Connect users with service providers</li>
                <li>Process communications and transactions</li>
                <li>Send important updates and notifications</li>
                <li>Ensure platform safety and security</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">3. Information Sharing</h3>
              <p className="text-[#cbd5e1] leading-relaxed mb-3">We may share your information:</p>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-2 ml-4">
                <li>With other users as part of the platform functionality</li>
                <li>With service providers to facilitate connections</li>
                <li>When required by law or to protect our rights</li>
                <li>With trusted partners who help us operate the platform</li>
              </ul>
              <p className="text-[#cbd5e1] leading-relaxed mt-3">
                We never sell your personal information to third parties.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">4. Data Security</h3>
              <p className="text-[#cbd5e1] leading-relaxed">
                We implement appropriate security measures to protect your information against unauthorized access, 
                alteration, disclosure, or destruction. This includes encryption, secure servers, and regular security audits.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">5. Your Rights</h3>
              <p className="text-[#cbd5e1] leading-relaxed mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-2 ml-4">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential communications</li>
                <li>Request a copy of your data</li>
                <li>Report privacy concerns</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">6. Location Data</h3>
              <p className="text-[#cbd5e1] leading-relaxed">
                We may collect location information to help connect you with nearby service providers. You can control 
                location sharing through your device settings and our platform preferences.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">7. Children's Privacy</h3>
              <p className="text-[#cbd5e1] leading-relaxed">
                Our service is not intended for children under 13. We do not knowingly collect personal information 
                from children under 13.
              </p>
            </section>

            <div className="bg-slate-700 rounded-lg p-4 mt-6">
              <p className="text-sm text-[#cbd5e1]">
                <strong>Last updated:</strong> December 19, 2024
              </p>
              <p className="text-sm text-[#cbd5e1] mt-2">
                For privacy questions, contact us at{' '}
                <a href="mailto:privacy@zonkehub.com" className="text-[#00c9a7] hover:text-teal-400">
                  privacy@zonkehub.com
                </a>
              </p>
            </div>
          </div>
        );

      case 'cookies':
        return (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-semibold text-white mb-3">1. What Are Cookies</h3>
              <p className="text-[#cbd5e1] leading-relaxed">
                Cookies are small text files that are stored on your device when you visit our website. They help us 
                provide you with a better experience by remembering your preferences and improving our services.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">2. Types of Cookies We Use</h3>
              
              <div className="space-y-4">
                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Essential Cookies</h4>
                  <p className="text-[#cbd5e1] text-sm">
                    Required for the website to function properly. These include authentication, security, and basic functionality.
                  </p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Functional Cookies</h4>
                  <p className="text-[#cbd5e1] text-sm">
                    Remember your preferences and settings to provide a personalized experience.
                  </p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Analytics Cookies</h4>
                  <p className="text-[#cbd5e1] text-sm">
                    Help us understand how visitors interact with our website to improve our services.
                  </p>
                </div>

                <div className="bg-slate-700 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Marketing Cookies</h4>
                  <p className="text-[#cbd5e1] text-sm">
                    Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">3. Third-Party Cookies</h3>
              <p className="text-[#cbd5e1] leading-relaxed mb-3">We may use third-party services that set cookies:</p>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-2 ml-4">
                <li>Google Analytics for website analytics</li>
                <li>Mapbox for location services</li>
                <li>Supabase for authentication and data storage</li>
                <li>Social media platforms for sharing features</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">4. Managing Cookies</h3>
              <p className="text-[#cbd5e1] leading-relaxed mb-3">You can control cookies through:</p>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-2 ml-4">
                <li>Your browser settings (delete, block, or allow cookies)</li>
                <li>Our cookie preferences center (coming soon)</li>
                <li>Opting out of third-party analytics services</li>
                <li>Using private/incognito browsing mode</li>
              </ul>
              <p className="text-[#cbd5e1] leading-relaxed mt-3">
                Note: Disabling essential cookies may affect website functionality.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">5. Cookie Retention</h3>
              <p className="text-[#cbd5e1] leading-relaxed">
                Cookies are retained for different periods depending on their purpose:
              </p>
              <ul className="list-disc list-inside text-[#cbd5e1] space-y-2 ml-4 mt-3">
                <li>Session cookies: Deleted when you close your browser</li>
                <li>Persistent cookies: Stored for up to 2 years</li>
                <li>Analytics cookies: Typically stored for 2 years</li>
                <li>Marketing cookies: Usually stored for 30-90 days</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-3">6. Updates to Cookie Policy</h3>
              <p className="text-[#cbd5e1] leading-relaxed">
                We may update this cookie policy to reflect changes in our practices or for legal reasons. 
                We'll notify you of significant changes through our website or email.
              </p>
            </section>

            <div className="bg-slate-700 rounded-lg p-4 mt-6">
              <p className="text-sm text-[#cbd5e1]">
                <strong>Last updated:</strong> December 19, 2024
              </p>
              <p className="text-sm text-[#cbd5e1] mt-2">
                For cookie-related questions, contact us at{' '}
                <a href="mailto:cookies@zonkehub.com" className="text-[#f59e0b] hover:text-yellow-400">
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
      <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
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
            <X className="h-6 w-6" />
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
              <span>Need help? Contact our support team</span>
            </div>
            <button
              onClick={onClose}
              className="bg-[#3db2ff] hover:bg-blue-500 text-white px-6 py-3 rounded-md transition-colors font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}