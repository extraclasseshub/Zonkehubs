import React, { useState } from 'react';
import { Search, MapPin, Users, CheckCircle, Star, ArrowRight, Sparkles, Zap, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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
  const { user } = useAuth();
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

  const handleServiceClick = (service: string) => {
    if (user) {
      // User is logged in, they'll be redirected to dashboard automatically
      // The App component handles this redirect
      return;
    } else {
      // User is not logged in, show auth modal
      onAuthClick();
    }
  };

  const handleLogoClick = () => {
    if (showAuth) {
      onAuthClose();
    }
    // If already on homepage, scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stats = [
    { number: '10K+', label: 'Happy Customers' },
    { number: '500+', label: 'Service Providers' },
    { number: '50+', label: 'Service Categories' },
    { number: '4.9', label: 'Average Rating' }
  ];

  if (showAuth) {
    return (
      <div className="min-h-screen bg-[#0d182c] flex flex-col">
        <Header onAuthClick={onAuthClick} onLogoClick={handleLogoClick} />
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
      <Header onAuthClick={onAuthClick} onLogoClick={handleLogoClick} />
      
      {/* Modern Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Animated World Map Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1c] via-[#1a2332] to-[#0d1421]">
            {/* World Map SVG Pattern */}
            <div 
              className="absolute inset-0 opacity-20 animate-map-drift"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 600'%3E%3Cpath d='M200 100 L250 80 L300 120 L350 90 L400 110 L450 85 L500 105 L550 95 L600 115 L650 100 L700 125 L750 110 L800 130 L850 115 L900 135 L950 120 L1000 140 L1050 125 L1100 145' stroke='%233db2ff' stroke-width='2' fill='none' opacity='0.6'/%3E%3Cpath d='M150 200 L200 180 L250 220 L300 190 L350 210 L400 185 L450 205 L500 195 L550 215 L600 200 L650 225 L700 210 L750 230 L800 215 L850 235 L900 220 L950 240 L1000 225 L1050 245' stroke='%2300c9a7' stroke-width='2' fill='none' opacity='0.5'/%3E%3Cpath d='M100 300 L150 280 L200 320 L250 290 L300 310 L350 285 L400 305 L450 295 L500 315 L550 300 L600 325 L650 310 L700 330 L750 315 L800 335 L850 320 L900 340 L950 325 L1000 345 L1050 330 L1100 350' stroke='%2387ceeb' stroke-width='2' fill='none' opacity='0.4'/%3E%3Cpath d='M50 400 L100 380 L150 420 L200 390 L250 410 L300 385 L350 405 L400 395 L450 415 L500 400 L550 425 L600 410 L650 430 L700 415 L750 435 L800 420 L850 440 L900 425 L950 445 L1000 430 L1050 450 L1100 435' stroke='%236366f1' stroke-width='2' fill='none' opacity='0.3'/%3E%3C/svg%3E")`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center'
              }}
            />
            
            {/* Animated Connection Lines */}
            <div className="absolute inset-0">
              {/* Horizontal flowing lines */}
              <div className="absolute top-1/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#3db2ff]/60 to-transparent animate-flow-horizontal"></div>
              <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00c9a7]/60 to-transparent animate-flow-horizontal-delayed"></div>
              <div className="absolute top-3/4 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#87ceeb]/60 to-transparent animate-flow-horizontal-slow"></div>
              
              {/* Vertical flowing lines */}
              <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#3db2ff]/40 to-transparent animate-flow-vertical"></div>
              <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-[#00c9a7]/40 to-transparent animate-flow-vertical-delayed"></div>
              <div className="absolute top-0 left-3/4 w-px h-full bg-gradient-to-b from-transparent via-[#87ceeb]/40 to-transparent animate-flow-vertical-slow"></div>
            </div>
            
            {/* Animated Location Pins */}
            <div className="absolute inset-0">
              <div className="absolute top-1/4 left-1/5 w-3 h-3 bg-[#3db2ff] rounded-full animate-pulse-glow shadow-lg shadow-[#3db2ff]/50"></div>
              <div className="absolute top-1/3 left-2/3 w-2 h-2 bg-[#00c9a7] rounded-full animate-pulse-glow-delayed shadow-lg shadow-[#00c9a7]/50"></div>
              <div className="absolute top-2/3 left-1/3 w-2.5 h-2.5 bg-[#87ceeb] rounded-full animate-pulse-glow-slow shadow-lg shadow-[#87ceeb]/50"></div>
              <div className="absolute top-1/2 left-4/5 w-2 h-2 bg-[#6366f1] rounded-full animate-pulse-glow shadow-lg shadow-[#6366f1]/50"></div>
              <div className="absolute top-3/4 left-1/6 w-3 h-3 bg-[#f59e0b] rounded-full animate-pulse-glow-delayed shadow-lg shadow-[#f59e0b]/50"></div>
              <div className="absolute top-1/5 left-3/4 w-2 h-2 bg-[#ef4444] rounded-full animate-pulse-glow-slow shadow-lg shadow-[#ef4444]/50"></div>
            </div>
            
            {/* Floating Data Particles */}
            <div className="absolute inset-0">
              <div className="absolute top-20 left-20 w-1 h-1 bg-[#3db2ff] rounded-full animate-float-particle opacity-80"></div>
              <div className="absolute top-40 right-32 w-1 h-1 bg-[#00c9a7] rounded-full animate-float-particle-delayed opacity-70"></div>
              <div className="absolute bottom-32 left-1/3 w-1 h-1 bg-[#87ceeb] rounded-full animate-float-particle-slow opacity-60"></div>
              <div className="absolute top-60 left-2/3 w-1 h-1 bg-[#6366f1] rounded-full animate-float-particle opacity-75"></div>
              <div className="absolute bottom-40 right-20 w-1 h-1 bg-[#f59e0b] rounded-full animate-float-particle-delayed opacity-65"></div>
              <div className="absolute top-1/3 left-1/5 w-1 h-1 bg-[#ef4444] rounded-full animate-float-particle-slow opacity-70"></div>
            </div>
            
            {/* Network Grid Overlay */}
            <div 
              className="absolute inset-0 opacity-10 animate-grid-pulse"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='none' stroke='%233db2ff' stroke-width='1'%3E%3Cpath d='M0 0L100 100M100 0L0 100'/%3E%3Ccircle cx='50' cy='50' r='30'/%3E%3Ccircle cx='50' cy='50' r='20'/%3E%3Ccircle cx='50' cy='50' r='10'/%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '100px 100px'
              }}
            />
            
            {/* Gradient Overlay for Text Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0d182c]/30 via-transparent to-[#0d182c]/50"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#3db2ff]/10 to-[#00c9a7]/10 border border-[#3db2ff]/20 rounded-full px-6 py-2 mb-8 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-[#3db2ff]" />
            <span className="text-sm font-medium text-[#3db2ff]">Trusted by thousands of South Africans</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Find Local
            <span className="block bg-gradient-to-r from-[#3db2ff] via-[#00c9a7] to-[#3db2ff] bg-clip-text text-transparent animate-gradient-x">
              Services
            </span>
            <span className="block text-4xl sm:text-5xl lg:text-6xl mt-2">Near You</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-[#cbd5e1] mb-12 max-w-4xl mx-auto leading-relaxed">
            Connect with <span className="text-[#00c9a7] font-semibold">trusted local professionals</span> in your area. 
            From plumbers to barbers, find the perfect service provider for any job.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <button
              onClick={onAuthClick}
              className="group relative bg-gradient-to-r from-[#3db2ff] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#3db2ff]/25"
            >
              <span className="flex items-center justify-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Find Services</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
            
            <button
              onClick={() => {
                setAuthMode('register');
                onAuthClick();
              }}
              className="group relative bg-gradient-to-r from-[#00c9a7] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#00c9a7]/25"
            >
              <span className="flex items-center justify-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Offer Services</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-[#cbd5e1] text-sm sm:text-base">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Service Types Grid */}
          <div className="max-w-5xl mx-auto">
            <h3 className="text-2xl font-semibold text-white mb-8">Popular Services</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {serviceTypes.map((service, index) => (
                <div
                  key={service}
                  onClick={() => handleServiceClick(service)}
                  className="group bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#3db2ff]/50 text-[#cbd5e1] hover:text-white px-4 py-3 rounded-xl text-sm transition-all duration-300 hover:bg-white/10 hover:scale-105 cursor-pointer"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="font-medium">{service}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-[#cbd5e1]">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-[#00c9a7]" />
              <span className="text-sm">Verified Providers</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-400 fill-current" />
              <span className="text-sm">Rated & Reviewed</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-[#3db2ff]" />
              <span className="text-sm">Quality Guaranteed</span>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50 backdrop-blur-sm">
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
              <div key={index} className="group text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-[#3db2ff]/50 transition-all duration-300 hover:bg-white/10">
                <div className="bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
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
                  <div className="bg-gradient-to-r from-[#3db2ff] to-[#2563eb] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="text-white font-semibold">Create Your Account</h4>
                    <p className="text-[#cbd5e1]">Sign up as a user to access our service directory</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-[#3db2ff] to-[#2563eb] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="text-white font-semibold">Search & Filter</h4>
                    <p className="text-[#cbd5e1]">Find services by type, location, and distance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-[#3db2ff] to-[#2563eb] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
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
                  <div className="bg-gradient-to-r from-[#00c9a7] to-[#059669] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">1</div>
                  <div>
                    <h4 className="text-white font-semibold">Register Your Business</h4>
                    <p className="text-[#cbd5e1]">Sign up as a service provider</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-[#00c9a7] to-[#059669] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">2</div>
                  <div>
                    <h4 className="text-white font-semibold">Complete Your Profile</h4>
                    <p className="text-[#cbd5e1]">Add your services, location, and contact details</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-gradient-to-r from-[#00c9a7] to-[#059669] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">3</div>
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900">
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
              className="group bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] hover:from-[#2563eb] hover:to-[#059669] text-white px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
            >
              <span className="flex items-center justify-center space-x-2">
                <span>Get Started Today</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Chat Assistant */}
      <ChatAssistant 
        isOpen={showChatAssistant}
        onToggle={() => setShowChatAssistant(!showChatAssistant)}
      />

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        
        @keyframes spin-slow {
          from {
            transform: translate(-50%, -50%) rotate(0deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(360deg);
          }
        }
        
        @keyframes reverse-spin {
          from {
            transform: translate(-50%, -50%) rotate(360deg);
          }
          to {
            transform: translate(-50%, -50%) rotate(0deg);
          }
        }
        
        @keyframes earth-rotation {
          from {
            background-position: 0% 50%;
          }
          to {
            background-position: 100% 50%;
          }
        }
        
        @keyframes map-drift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 50% 100%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        @keyframes flow-horizontal {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes flow-vertical {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0;
          }
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.7;
          }
        }
        
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
            opacity: 0.8;
          }
          33% {
            transform: translateY(-20px) translateX(10px);
            opacity: 1;
          }
          66% {
            transform: translateY(10px) translateX(-5px);
            opacity: 0.6;
          }
        }
        
        @keyframes grid-pulse {
          0%, 100% {
            opacity: 0.1;
          }
          50% {
            opacity: 0.3;
          }
        }
        
        .animate-map-drift {
          animation: map-drift 60s ease-in-out infinite;
        }
        
        .animate-flow-horizontal {
          animation: flow-horizontal 8s linear infinite;
        }
        
        .animate-flow-horizontal-delayed {
          animation: flow-horizontal 10s linear infinite;
          animation-delay: 2s;
        }
        
        .animate-flow-horizontal-slow {
          animation: flow-horizontal 12s linear infinite;
          animation-delay: 4s;
        }
        
        .animate-flow-vertical {
          animation: flow-vertical 6s linear infinite;
        }
        
        .animate-flow-vertical-delayed {
          animation: flow-vertical 8s linear infinite;
          animation-delay: 1s;
        }
        
        .animate-flow-vertical-slow {
          animation: flow-vertical 10s linear infinite;
          animation-delay: 3s;
        }
        
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        
        .animate-pulse-glow-delayed {
          animation: pulse-glow 4s ease-in-out infinite;
          animation-delay: 1s;
        }
        
        .animate-pulse-glow-slow {
          animation: pulse-glow 5s ease-in-out infinite;
          animation-delay: 2s;
        }
        
        .animate-float-particle {
          animation: float-particle 8s ease-in-out infinite;
        }
        
        .animate-float-particle-delayed {
          animation: float-particle 10s ease-in-out infinite;
          animation-delay: 2s;
        }
        
        .animate-float-particle-slow {
          animation: float-particle 12s ease-in-out infinite;
          animation-delay: 4s;
        }
        
        .animate-grid-pulse {
          animation: grid-pulse 6s ease-in-out infinite;
        }
        
        .animate-float-particle-ultra {
          animation: float-particle 14s ease-in-out infinite;
          animation-delay: 5s;
        }
        
        .animate-float-particle-mega {
          animation: float-particle 9s ease-in-out infinite;
          animation-delay: 6s;
        }
      `}</style>
    </>
  );
}