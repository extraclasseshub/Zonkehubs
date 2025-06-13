import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0d182c] border-t border-slate-700 py-6 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
  <img 
    src="/logo.png" 
    alt="Zonke Hub" 
    className="h-[24px] w-auto"
  />
</div>

          
          {/* Copyright */}
          <div className="text-center sm:text-right">
            <p className="text-sm text-[#cbd5e1]">
              © 2025 Zonke Hub. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Connecting communities through trusted local services
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}