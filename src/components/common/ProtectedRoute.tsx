import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return fallback || (
      <div className="min-h-screen bg-[#0d182c] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Restricted</h2>
          <p className="text-[#cbd5e1] mb-6">Please log in to access this content.</p>
          <button className="bg-[#3db2ff] hover:bg-blue-500 text-white px-6 py-2 rounded-md transition-colors">
            Login Required
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}