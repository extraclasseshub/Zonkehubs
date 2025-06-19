import React, { useState } from 'react';
import { Heart, ExternalLink, Shield, Cookie, FileText, Mail, Phone, MapPin } from 'lucide-react';
import LegalModal from './LegalModal';

export default function Footer() {
  const [showLegal, setShowLegal] = useState(false);
  const [legalType, setLegalType] = useState<'terms' | 'privacy' | 'cookies'>('terms');

  const handleLegalClick = (type: 'terms' | 'privacy' | 'cookies') => {
    setLegalType(type);
    setShowLegal(true);
  };

  return (
    <>
      <footer className="bg-[#0d182c] border-t border-slate-700 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="/logo.png" 
                  alt="Zonke Hub" 
                  className="h-[32px] w-auto"
                />
              </div>
              <p className="text-[#cbd5e1] text-sm leading-relaxed">
                Connecting communities through trusted local services. Find reliable service providers or grow your business with Zonke Hub.
              </p>
              <div className="flex items-center space-x-2 text-sm text-[#cbd5e1]">
                <Heart className="h-4 w-4 text-red-400" />
                <span>Made with care for local communities</span>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg">Quick Links</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#services" className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors text-sm flex items-center space-x-2">
                    <span>Find Services</span>
                  </a>
                </li>
                <li>
                  <a href="#providers" className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors text-sm flex items-center space-x-2">
                    <span>Become a Provider</span>
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors text-sm flex items-center space-x-2">
                    <span>How It Works</span>
                  </a>
                </li>
                <li>
                  <a href="#about" className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors text-sm flex items-center space-x-2">
                    <span>About Us</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal & Support */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg">Legal & Support</h3>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => handleLegalClick('terms')}
                    className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors text-sm flex items-center space-x-2 text-left"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Terms & Conditions</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLegalClick('privacy')}
                    className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors text-sm flex items-center space-x-2 text-left"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Privacy Policy</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleLegalClick('cookies')}
                    className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors text-sm flex items-center space-x-2 text-left"
                  >
                    <Cookie className="h-4 w-4" />
                    <span>Cookie Policy</span>
                  </button>
                </li>
                <li>
                  <a href="#help" className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors text-sm flex items-center space-x-2">
                    <span>Help Center</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-white font-semibold text-lg">Contact Us</h3>
              <ul className="space-y-3">
                <li>
                  <a 
                    href="mailto:support@zonkehub.com" 
                    className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors text-sm flex items-center space-x-2"
                  >
                    <Mail className="h-4 w-4" />
                    <span>support@zonkehub.com</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="tel:+27767362968" 
                    className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors text-sm flex items-center space-x-2"
                  >
                    <Phone className="h-4 w-4" />
                    <span>+27 76 736 2968</span>
                  </a>
                </li>
                <li>
                  <div className="text-[#cbd5e1] text-sm flex items-start space-x-2">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>123 Service Street<br />Community City, CC 12345</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-slate-700">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              {/* Copyright */}
              <div className="text-center sm:text-left">
                <p className="text-sm text-[#cbd5e1]">
                  © 2025 Zonke Hub. All rights reserved.
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Connecting communities through trusted local services
                </p>
              </div>

              {/* Social Links & Status */}
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-[#cbd5e1]">All systems operational</span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <a 
                    href="https://twitter.com/zonkehub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors"
                    aria-label="Follow us on Twitter"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <a 
                    href="https://facebook.com/zonkehub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors"
                    aria-label="Follow us on Facebook"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <a 
                    href="https://linkedin.com/company/zonkehub" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[#cbd5e1] hover:text-[#3db2ff] transition-colors"
                    aria-label="Follow us on LinkedIn"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Legal Modal */}
      {showLegal && (
        <LegalModal
          type={legalType}
          onClose={() => setShowLegal(false)}
        />
      )}
    </>
  );
}