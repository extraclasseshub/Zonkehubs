import React, { useState } from 'react';
import { Search, MapPin, Users, CheckCircle, Star } from 'lucide-react';
import Header from '../components/common/Header';
import ChatAssistant from '../components/chat/ChatAssistant';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';
import ForgotPassword from '../components/auth/ForgotPassword';

interface HomepageProps {
  showAuth: boolean;
  onAuthClick: () => void;
  onAuthClose: () => void;
}

export default function Homepage({ showAuth, onAuthClick, onAuthClose }: HomepageProps) {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [showChatAssistant, setShowChatAssistant] = useState(false);

  const features = [
    {
      icon: Search,
      title: 'Find Local Services',
      description: 'Search for verified service providers in your area with our powerful location-based search.'
    },
    {
      icon: MapPin,
      title: 'Location-Based Matching',
      description: 'Connect with providers within your preferred radius for convenient and timely service.'
    },
    {
      icon: Users,
      title: 'Trusted Providers',
      description: 'All service providers are verified and rated by real customers for your peace of mind.'
    },
    {
      icon: CheckCircle,
      title: 'Quality Guaranteed',
      description: 'Read reviews, compare ratings, and choose the best service provider for your needs.'
    }
  ];

  const serviceTypes = [
    'Plumbing', 'Electrical', 'Barbering', 'Cleaning', 'Carpentry', 
    'Gardening', 'Painting', 'Auto Repair', 'IT Support', 'Tutoring'
  ];

  if (showAuth) {
    return (
      <div className="min-h-screen bg-[#0d182c] flex flex-col">
        <Header onAuthClick={onAuthClick} />
        <div className="flex-1 flex items-center justify-center p-4 pt-20">
          <div className="w-full max-w-md">
            <button
              onClick={onAuthClose}
              className="mb-4 text-[#cbd5e1] hover:text-white transition-colors"
            >
              ← Back to Homepage
            </button>
            
            {authMode === 'login' ? (
              <Login 
                onSwitchToRegister={() => setAuthMode('register')}
                onSwitchToForgotPassword={() => setAuthMode('forgot')}
                onClose={onAuthClose}
              />
            ) : authMode === 'register' ? (
              <Register 
                onSwitchToLogin={() => setAuthMode('login')}
                onClose={onAuthClose}
              />
            ) : (
              <ForgotPassword 
                onBackToLogin={() => setAuthMode('login')}
              />
            )}
          </div>
        </div>
        
        {/* Chat Assistant - Available even during auth */}
        <ChatAssistant 
          isOpen={showChatAssistant}
          onToggle={() => setShowChatAssistant(!showChatAssistant)}
        />
      </div>
    );
  }

  return (
    <>
      <Header onAuthClick={onAuthClick} />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 pt-32">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
            Find Local Services
            <span className="text-[#3db2ff] block">Near You</span>
          </h1>
          <p className="text-xl text-[#cbd5e1] mb-8 max-w-3xl mx-auto">
            Connect with trusted local service providers in your area. From plumbers to barbers, 
            find the perfect professional for any job.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={onAuthClick}
              className="bg-[#3db2ff] hover:bg-blue-500 text-white px-8 py-3 rounded-md text-lg font-semibold transition-colors"
            >
              Find Services
            </button>
            <button
              onClick={() => {
                setAuthMode('register');
                onAuthClick();
              }}
              className="bg-[#00c9a7] hover:bg-teal-500 text-white px-8 py-3 rounded-md text-lg font-semibold transition-colors"
            >
              Offer Services
            </button>
          </div>

          {/* Service Types Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {serviceTypes.map((service) => (
              <div
                key={service}
                className="bg-slate-800 hover:bg-slate-700 text-[#cbd5e1] px-4 py-2 rounded-md text-sm transition-colors"
              >
                {service}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Why Choose Zonke Hub?
            </h2>
            <p className="text-xl text-[#cbd5e1] max-w-2xl mx-auto">
              We make it easy to find and connect with quality service providers in your local area.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-[#3db2ff] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-[#cbd5e1]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* For Users */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#3db2ff] mb-6">For Service Seekers</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#3db2ff] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="text-white font-semibold">Create Your Account</h4>
                    <p className="text-[#cbd5e1]">Sign up as a user to access our service directory</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-[#3db2ff] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="text-white font-semibold">Search & Filter</h4>
                    <p className="text-[#cbd5e1]">Find services by type, location, and distance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-[#3db2ff] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="text-white font-semibold">Connect & Hire</h4>
                    <p className="text-[#cbd5e1]">View profiles, read reviews, and contact providers</p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Providers */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-[#00c9a7] mb-6">For Service Providers</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-[#00c9a7] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="text-white font-semibold">Register Your Business</h4>
                    <p className="text-[#cbd5e1]">Sign up as a service provider</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-[#00c9a7] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="text-white font-semibold">Complete Your Profile</h4>
                    <p className="text-[#cbd5e1]">Add your services, location, and contact details</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-[#00c9a7] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
                  <div>
                    <h4 className="text-white font-semibold">Get Found</h4>
                    <p className="text-[#cbd5e1]">Publish your profile and start receiving inquiries</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-[#cbd5e1] mb-8">
            Join thousands of users and service providers already using Zonke Hub
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                setAuthMode('register');
                onAuthClick();
              }}
              className="bg-[#3db2ff] hover:bg-blue-500 text-white px-8 py-3 rounded-md text-lg font-semibold transition-colors"
            >
              Get Started Today
            </button>
          </div>
        </div>
      </section>

      {/* Chat Assistant */}
      <ChatAssistant 
        isOpen={showChatAssistant}
        onToggle={() => setShowChatAssistant(!showChatAssistant)}
      />
    </>
  );
}