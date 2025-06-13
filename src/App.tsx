import React, { useState } from 'react';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import Homepage from './pages/Homepage';
import UserDashboard from './components/dashboard/UserDashboard';
import ProviderDashboard from './components/dashboard/ProviderDashboard';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  const handleAuthClick = () => {
    setShowAuth(true);
  };

  const handleAuthClose = () => {
    setShowAuth(false);
  };

  // Show loading screen while authentication is being determined
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d182c] flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3db2ff] mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white mb-2">Loading Zonke Hub...</h2>
            <p className="text-[#cbd5e1]">Connecting to your account</p>
            <div className="mt-4 text-xs text-gray-400">
              <p>This may take a few seconds on first load</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show dashboard immediately once user is authenticated
  if (user) {
    return (
      <div className="min-h-screen bg-[#0d182c] flex flex-col">
        <Header onAuthClick={handleAuthClick} />
        
        <div className="flex-1">
          <ProtectedRoute>
            {user.role === 'user' ? (
              <UserDashboard />
            ) : (
              <ProviderDashboard />
            )}
          </ProtectedRoute>
        </div>
        
        <Footer />
      </div>
    );
  }

  // Show homepage for non-authenticated users
  return (
    <div className="min-h-screen bg-[#0d182c] flex flex-col">
      <div className="flex-1">
        <Homepage 
          showAuth={showAuth} 
          onAuthClick={handleAuthClick}
          onAuthClose={handleAuthClose}
        />
      </div>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;