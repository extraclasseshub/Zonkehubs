import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export default function ForgotPassword({ onBackToLogin }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent default form submission behavior
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await resetPassword(email);
      if (result) {
        setSuccess(true);
      } else {
        setError('Failed to send reset email. Please check your email address and try again.');
      }
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      window.scrollTo(0, 0);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-slate-800 rounded-lg p-8 shadow-xl text-center">
          <div className="bg-green-900/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">Check Your Email</h2>
          <p className="text-[#cbd5e1] mb-6">
            We've sent a password reset link to <strong>{email}</strong>. 
            Please check your email and follow the instructions to reset your password.
          </p>
          <button
            onClick={onBackToLogin}
            className="w-full bg-[#3db2ff] hover:bg-blue-500 text-white py-2 px-4 rounded-md transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-slate-800 rounded-lg p-8 shadow-xl">
        <button
          onClick={onBackToLogin}
          className="flex items-center space-x-2 text-[#cbd5e1] hover:text-white transition-colors mb-6"
          disabled={loading}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Login</span>
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 text-center">Reset Password</h2>
        
        <p className="text-[#cbd5e1] text-sm mb-6 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-600 rounded-md p-3">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-[#3db2ff] hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 px-4 rounded-md transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Sending...
              </>
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}