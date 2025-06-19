import React, { useState, useEffect } from 'react';
import { ServiceProvider } from '../../types';
import { MapPin, Phone, Mail, Star, User, Building, MessageCircle, Eye, Globe, Clock, Award, Calendar } from 'lucide-react';
import ChatModal from '../chat/ChatModal';
import ProviderModal from './ProviderModal';
import RatingDisplay from '../rating/RatingDisplay';

interface ServiceCardProps {
  provider: ServiceProvider;
  onChatStart?: (providerId: string) => void; // Add callback for chat start
}

export default function ServiceCard({ provider, onChatStart }: ServiceCardProps) {
  const [showChat, setShowChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Debug log to see what data this card receives
  useEffect(() => {
    console.log('🃏 ServiceCard received provider with all data:', {
      name: provider.name,
      rating: provider.rating,
      reviewCount: provider.reviewCount,
      website: provider.website,
      socialMedia: provider.socialMedia,
      specialties: provider.specialties,
      yearsExperience: provider.yearsExperience,
      certifications: provider.certifications,
      availability: provider.availability,
      currentStatus: provider.currentStatus
    });
  }, [provider]);

  const handleModalClose = () => {
    setShowProfile(false);
  };

  const handleChatClose = () => {
    setShowChat(false);
  };

  const handleStartChatFromModal = (providerId: string) => {
    console.log('💬 Starting chat from modal for provider:', providerId);
    setShowProfile(false); // Close the modal
    if (onChatStart) {
      onChatStart(providerId); // Notify parent component
    } else {
      setShowChat(true); // Fallback to direct chat modal
    }
  };

  const handleDirectChat = () => {
    console.log('💬 Starting direct chat with provider:', provider.id);
    if (onChatStart) {
      onChatStart(provider.id); // Notify parent component
    } else {
      setShowChat(true); // Fallback to direct chat modal
    }
  };

  // Helper function to get availability status
  const getAvailabilityStatus = () => {
    if (!provider.availability || Object.keys(provider.availability).length === 0) {
      return { status: 'Not set', color: 'text-gray-400' };
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
    const todaySchedule = provider.availability[today as keyof typeof provider.availability];
    
    if (todaySchedule?.available) {
      return { 
        status: `Open today ${todaySchedule.start} - ${todaySchedule.end}`, 
        color: 'text-green-400' 
      };
    } else {
      return { status: 'Closed today', color: 'text-red-400' };
    }
  };

  const availabilityStatus = getAvailabilityStatus();

  return (
    <>
      <div className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-colors border border-slate-700">
        {/* Header with Profile Image */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 flex-1">
            {provider.profileImage ? (
              <img
                src={provider.profileImage}
                alt={provider.businessName || provider.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-[#3db2ff]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                <User className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {provider.businessName || provider.name}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-[#cbd5e1]">
                {provider.businessType === 'business' ? (
                  <Building className="h-4 w-4" />
                ) : (
                  <User className="h-4 w-4" />
                )}
                <span className="capitalize">{provider.businessType}</span>
                {provider.yearsExperience && provider.yearsExperience > 0 && (
                  <>
                    <span>•</span>
                    <span>{provider.yearsExperience} years exp.</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Status Badges */}
          <div className="flex flex-col items-end space-y-1">
            {/* Current Status */}
            {provider.currentStatus && (
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                provider.currentStatus === 'available' 
                  ? 'bg-green-500 text-white' 
                  : provider.currentStatus === 'busy'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-500 text-white'
              }`}>
                {provider.currentStatus}
              </div>
            )}
            
            {/* New Provider Badge */}
            {(!provider.rating || provider.rating === 0) && (!provider.reviewCount || provider.reviewCount === 0) && (
              <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                New
              </div>
            )}
          </div>
        </div>

        {/* Service Type and Specialties */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            <span className="inline-block bg-[#3db2ff] text-white px-3 py-1 rounded-full text-sm font-medium">
              {provider.serviceType}
            </span>
            {provider.specialties && provider.specialties.length > 0 && (
              provider.specialties.slice(0, 2).map((specialty, index) => (
                <span key={index} className="inline-block bg-slate-600 text-white px-2 py-1 rounded-full text-xs">
                  {specialty}
                </span>
              ))
            )}
            {provider.specialties && provider.specialties.length > 2 && (
              <span className="inline-block bg-slate-600 text-white px-2 py-1 rounded-full text-xs">
                +{provider.specialties.length - 2} more
              </span>
            )}
          </div>
        </div>

        {/* Rating Display */}
        <div className="mb-3">
          <RatingDisplay 
            rating={provider.rating || 0} 
            reviewCount={provider.reviewCount || 0} 
            size="md"
          />
        </div>

        {/* Description */}
        <p className="text-[#cbd5e1] text-sm mb-4 line-clamp-3">
          {provider.description}
        </p>

        {/* Availability Status */}
        {provider.availability && Object.keys(provider.availability).length > 0 && (
          <div className="mb-3 flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className={`text-sm ${availabilityStatus.color}`}>
              {availabilityStatus.status}
            </span>
          </div>
        )}

        {/* Website Link */}
        {provider.website && (
          <div className="mb-3 flex items-center space-x-2">
            <Globe className="h-4 w-4 text-gray-400" />
            <a 
              href={provider.website.startsWith('http') ? provider.website : `https://${provider.website}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="text-[#3db2ff] hover:text-blue-400 text-sm truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {provider.website}
            </a>
          </div>
        )}

        {/* Certifications */}
        {provider.certifications && provider.certifications.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center space-x-2 mb-1">
              <Award className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-[#cbd5e1]">Certified:</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {provider.certifications.slice(0, 2).map((cert, index) => (
                <span key={index} className="bg-[#00c9a7] text-white px-2 py-1 rounded-full text-xs">
                  {cert}
                </span>
              ))}
              {provider.certifications.length > 2 && (
                <span className="bg-[#00c9a7] text-white px-2 py-1 rounded-full text-xs">
                  +{provider.certifications.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Portfolio Preview */}
        {provider.workPortfolio && provider.workPortfolio.length > 0 && (
          <div className="mb-4">
            <div className="flex space-x-2 overflow-x-auto">
              {provider.workPortfolio.slice(0, 3).map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Work ${index + 1}`}
                  className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                />
              ))}
              {provider.workPortfolio.length > 3 && (
                <div className="w-16 h-16 bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-[#cbd5e1]">+{provider.workPortfolio.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Location and Radius */}
        <div className="flex items-center space-x-2 text-sm text-[#cbd5e1] mb-4">
          <MapPin className="h-4 w-4" />
          <span className="truncate">{provider.location.address}</span>
          <span>• {provider.workRadius}km radius</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center justify-center space-x-1 bg-slate-700 hover:bg-slate-600 text-[#cbd5e1] hover:text-white px-3 py-2 rounded-md transition-colors text-sm"
          >
            <Eye className="h-4 w-4" />
            <span>View</span>
          </button>
          
          <button
            onClick={handleDirectChat}
            className="flex items-center justify-center space-x-1 bg-[#3db2ff] hover:bg-blue-500 text-white px-3 py-2 rounded-md transition-colors text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Chat</span>
          </button>
          
          {provider.phone ? (
            <a
              href={`tel:${provider.phone}`}
              className="flex items-center justify-center space-x-1 bg-[#00c9a7] hover:bg-teal-500 text-white px-3 py-2 rounded-md transition-colors text-sm"
            >
              <Phone className="h-4 w-4" />
              <span>Call</span>
            </a>
          ) : (
            <a
              href={`mailto:${provider.email}`}
              className="flex items-center justify-center space-x-1 bg-[#00c9a7] hover:bg-teal-500 text-white px-3 py-2 rounded-md transition-colors text-sm"
            >
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </a>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      {showChat && (
        <ChatModal
          provider={provider}
          onClose={handleChatClose}
        />
      )}

      {/* Provider Profile Modal */}
      {showProfile && (
        <ProviderModal
          provider={provider}
          onClose={handleModalClose}
          onStartChat={handleStartChatFromModal}
        />
      )}
    </>
  );
}