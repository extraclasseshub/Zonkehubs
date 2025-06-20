import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User, Settings, MessageCircle, Bell, Menu, X, Loader2 } from 'lucide-react';
import UserSettings from '../profile/UserSettings';

interface HeaderProps {
  onAuthClick: () => void;
  onLogoClick?: () => void;
}

export default function Header({ onAuthClick, onLogoClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Get unread message count for notification badge
  const getUnreadMessageCount = () => {
    // This will be implemented with real-time Supabase subscriptions
    return 0;
  };

  const unreadCount = getUnreadMessageCount();

  const handleLogout = async () => {
    setLoggingOut(true);
    setMobileMenuOpen(false);
    
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Keep loading state for a moment to prevent flicker
      setTimeout(() => {
        setLoggingOut(false);
      }, 1000);
    }
  };

  return (
    <>
      <header className="bg-[#0d182c] border-b border-slate-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Zonke Hub" 
                  className="h-[24px] w-auto"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  {/* Notification Bell for All Users */}
                  {unreadCount > 0 && (
                    <div className="relative">
                      <div className="relative p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer">
                        <Bell className="h-5 w-5 text-[#3db2ff]" />
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 animate-pulse border-2 border-[#0d182c]">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* User Profile */}
                  <div className="flex items-center space-x-3">
                    {(user as any)?.profileImage ? (
                      <img
                        src={(user as any).profileImage}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-[#3db2ff]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-[#cbd5e1]">
                      <span className="text-sm font-medium">{user.name}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.role === 'provider' 
                          ? 'bg-[#00c9a7] text-white' 
                          : 'bg-[#3db2ff] text-white'
                      }`}>
                        {user.role === 'provider' ? 'Provider' : 'User'}
                      </span>
                    </div>
                  </div>

                  {/* Settings Button */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="flex items-center space-x-1 text-[#cbd5e1] hover:text-white transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>

                  <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex items-center space-x-1 text-[#cbd5e1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loggingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Logging out...</span>
                      </>
                    ) : (
                      <>
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <button
                  onClick={onAuthClick}
                  className="bg-[#3db2ff] hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Login / Register
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#cbd5e1] hover:text-white transition-colors p-2"
                disabled={loggingOut}
              >
                {mobileMenuOpen ? (
              <button
                onClick={onLogoClick}
                className="focus:outline-none focus:ring-2 focus:ring-[#3db2ff] rounded-md p-1 transition-all hover:scale-105"
              >
                <img 
                  src="/logo.png" 
                  alt="Zonke Hub" 
                  className="h-[24px] w-auto"
                />
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-slate-700 bg-[#0d182c]">
              <div className="px-2 pt-2 pb-3 space-y-1">
                {user ? (
                  <>
                    {/* User Info */}
                    <div className="flex items-center space-x-3 px-3 py-2 text-[#cbd5e1]">
                      {(user as any)?.profileImage ? (
                        <img
                          src={(user as any).profileImage}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-[#3db2ff]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-[#cbd5e1]">
                          {user.role === 'provider' ? 'Service Provider' : 'Customer'}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.role === 'provider' 
                          ? 'bg-[#00c9a7] text-white' 
                          : 'bg-[#3db2ff] text-white'
                      }`}>
                        {user.role === 'provider' ? 'Provider' : 'User'}
                      </span>
                    </div>

                    {/* Notifications */}
                    {unreadCount > 0 && (
                      <div className="flex items-center space-x-3 px-3 py-2 bg-slate-800 rounded-md mx-2">
                        <Bell className="h-5 w-5 text-[#3db2ff] animate-pulse" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">
                            {unreadCount} New Message{unreadCount > 1 ? 's' : ''}
                          </p>
                          <p className="text-xs text-[#cbd5e1]">
                            You have unread messages
                          </p>
                        </div>
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                          {unreadCount}
                        </div>
                      </div>
                    )}

                    {/* Settings */}
                    <button
                      onClick={() => {
                        setShowSettings(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center space-x-3 px-3 py-2 text-[#cbd5e1] hover:text-white hover:bg-slate-800 rounded-md transition-colors w-full text-left"
                    >
                      <Settings className="h-5 w-5" />
                      <span>Settings</span>
                    </button>

                    {/* Logout */}
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex items-center space-x-3 px-3 py-2 text-[#cbd5e1] hover:text-white hover:bg-slate-800 rounded-md transition-colors w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loggingOut ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Logging out...</span>
                        </>
                      ) : (
                        <>
                          <LogOut className="h-5 w-5" />
                          <span>Logout</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      onAuthClick();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 bg-[#3db2ff] hover:bg-blue-500 text-white rounded-md transition-colors"
                  >
                    Login / Register
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* User Settings Modal */}
      {showSettings && (
        <UserSettings onClose={() => setShowSettings(false)} />
      )}
    </>
  );
}