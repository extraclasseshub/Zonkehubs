import React, { useState, useEffect } from 'react';
import { ServiceProvider, Rating } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { X, MapPin, Phone, Mail, Star, User, Building, MessageCircle, Loader2 } from 'lucide-react';
import RatingModal from '../rating/RatingModal';
import RatingDisplay from '../rating/RatingDisplay';
import ReviewsList from '../rating/ReviewsList';
import { supabase } from '../../lib/supabase';

interface ProviderModalProps {
  provider: ServiceProvider;
  onClose: () => void;
  onStartChat: (providerId: string) => void;
}

export default function ProviderModal({ provider: initialProvider, onClose, onStartChat }: ProviderModalProps) {
  const { user, getProviderRatings, getUserRating } = useAuth();
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'about' | 'reviews'>('about');
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [userRating, setUserRating] = useState<Rating | undefined>();
  const [provider, setProvider] = useState(initialProvider);
  const [loading, setLoading] = useState(false);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  
  const canRate = user && user.role === 'user';

  // Refresh provider data to get latest ratings
  useEffect(() => {
    const refreshProviderData = async () => {
      try {
        console.log('🔄 Refreshing provider data for modal...');
        
        const { data, error } = await supabase
          .from('service_providers')
          .select(`
            *,
            profiles!service_providers_id_fkey(email, name, profile_image)
          `)
          .eq('id', initialProvider.id)
          .single();

        if (!error && data) {
          const profileData = data.profiles as any;
          
          const updatedProvider: ServiceProvider = {
            id: data.id,
            email: profileData.email,
            name: profileData.name,
            role: 'provider' as const,
            createdAt: new Date(data.created_at),
            profileImage: profileData.profile_image || '',
            businessName: data.business_name || undefined,
            businessType: data.business_type || 'individual',
            serviceType: data.service_type || '',
            description: data.description || '',
            phone: data.phone || undefined,
            location: {
              address: data.address || '',
              lat: Number(data.latitude) || 0,
              lng: Number(data.longitude) || 0,
            },
            workRadius: Number(data.work_radius) || 10,
            workPortfolio: data.work_portfolio || [],
            isPublished: Boolean(data.is_published),
            rating: Number(data.rating) || 0,
            reviewCount: Number(data.review_count) || 0,
            totalRatingPoints: Number(data.total_rating_points) || 0,
          };
          
          console.log('🔄 Updated provider data:', {
            name: updatedProvider.name,
            rating: updatedProvider.rating,
            reviewCount: updatedProvider.reviewCount
          });
          
          setProvider(updatedProvider);
        }
      } catch (error) {
        console.error('Error refreshing provider data:', error);
      }
    };

    refreshProviderData();
  }, [initialProvider.id]);

  // Load ratings with enhanced error handling
  const loadRatings = async () => {
    setRatingsLoading(true);
    try {
      console.log('📊 Loading ratings for provider:', provider.id);
      
      // Direct query to get ratings with user names
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('ratings')
        .select(`
          id,
          user_id,
          provider_id,
          rating,
          review,
          created_at,
          updated_at,
          profiles!ratings_user_id_fkey(name)
        `)
        .eq('provider_id', provider.id)
        .order('created_at', { ascending: false });

      if (ratingsError) {
        console.error('❌ Error fetching ratings:', ratingsError);
        setRatings([]);
        return;
      }

      console.log('📊 Raw ratings data:', ratingsData);

      if (!ratingsData || ratingsData.length === 0) {
        console.log('📊 No ratings found for provider');
        setRatings([]);
      } else {
        // Convert to Rating objects
        const formattedRatings: Rating[] = ratingsData.map(rating => ({
          id: rating.id,
          userId: rating.user_id,
          providerId: rating.provider_id,
          rating: rating.rating,
          review: rating.review || '',
          timestamp: new Date(rating.created_at),
          userName: (rating.profiles as any)?.name || 'Anonymous User',
        }));

        console.log('📊 Formatted ratings:', formattedRatings.length, 'reviews');
        setRatings(formattedRatings);
      }
      
      // Load user's existing rating if logged in
      if (user && canRate) {
        const { data: userRatingData, error: userRatingError } = await supabase
          .from('ratings')
          .select(`
            id,
            user_id,
            provider_id,
            rating,
            review,
            created_at,
            updated_at,
            profiles!ratings_user_id_fkey(name)
          `)
          .eq('user_id', user.id)
          .eq('provider_id', provider.id)
          .single();

        if (!userRatingError && userRatingData) {
          const existingRating: Rating = {
            id: userRatingData.id,
            userId: userRatingData.user_id,
            providerId: userRatingData.provider_id,
            rating: userRatingData.rating,
            review: userRatingData.review || '',
            timestamp: new Date(userRatingData.created_at),
            userName: (userRatingData.profiles as any)?.name || user.name,
          };
          
          console.log('📊 User existing rating:', existingRating);
          setUserRating(existingRating);
        } else {
          console.log('📊 No existing rating from user');
          setUserRating(undefined);
        }
      }
    } catch (error) {
      console.error('❌ Error loading ratings:', error);
      setRatings([]);
    } finally {
      setRatingsLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
  }, [provider.id, user, canRate]);

  const handleRatingSubmitted = async () => {
    console.log('⭐ Rating submitted, refreshing data...');
    
    // Close the rating modal
    setShowRatingModal(false);
    // Switch to reviews tab to show the new rating
    setActiveTab('reviews');
    
    // Reload ratings and provider data
    await loadRatings();

    // Refresh provider data to get updated rating
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          profiles!service_providers_id_fkey(email, name, profile_image)
        `)
        .eq('id', provider.id)
        .single();

      if (!error && data) {
        const profileData = data.profiles as any;
        
        const updatedProvider: ServiceProvider = {
          id: data.id,
          email: profileData.email,
          name: profileData.name,
          role: 'provider' as const,
          createdAt: new Date(data.created_at),
          profileImage: profileData.profile_image || '',
          businessName: data.business_name || undefined,
          businessType: data.business_type || 'individual',
          serviceType: data.service_type || '',
          description: data.description || '',
          phone: data.phone || undefined,
          location: {
            address: data.address || '',
            lat: Number(data.latitude) || 0,
            lng: Number(data.longitude) || 0,
          },
          workRadius: Number(data.work_radius) || 10,
          workPortfolio: data.work_portfolio || [],
          isPublished: Boolean(data.is_published),
          rating: Number(data.rating) || 0,
          reviewCount: Number(data.review_count) || 0,
          totalRatingPoints: Number(data.total_rating_points) || 0,
        };
        
        console.log('⭐ Provider data after rating:', {
          name: updatedProvider.name,
          rating: updatedProvider.rating,
          reviewCount: updatedProvider.reviewCount
        });
        
        setProvider(updatedProvider);
      }
    } catch (error) {
      console.error('Error refreshing data after rating:', error);
    }
  };

  const handleRatingDeleted = async () => {
    console.log('🗑️ Rating deleted, refreshing data...');
    await loadRatings();
    
    // Refresh provider data to get updated rating
    try {
      const { data, error } = await supabase
        .from('service_providers')
        .select(`
          *,
          profiles!service_providers_id_fkey(email, name, profile_image)
        `)
        .eq('id', provider.id)
        .single();

      if (!error && data) {
        const profileData = data.profiles as any;
        
        const updatedProvider: ServiceProvider = {
          id: data.id,
          email: profileData.email,
          name: profileData.name,
          role: 'provider' as const,
          createdAt: new Date(data.created_at),
          profileImage: profileData.profile_image || '',
          businessName: data.business_name || undefined,
          businessType: data.business_type || 'individual',
          serviceType: data.service_type || '',
          description: data.description || '',
          phone: data.phone || undefined,
          location: {
            address: data.address || '',
            lat: Number(data.latitude) || 0,
            lng: Number(data.longitude) || 0,
          },
          workRadius: Number(data.work_radius) || 10,
          workPortfolio: data.work_portfolio || [],
          isPublished: Boolean(data.is_published),
          rating: Number(data.rating) || 0,
          reviewCount: Number(data.review_count) || 0,
          totalRatingPoints: Number(data.total_rating_points) || 0,
        };
        
        console.log('🗑️ Provider data after rating deletion:', {
          name: updatedProvider.name,
          rating: updatedProvider.rating,
          reviewCount: updatedProvider.reviewCount
        });
        
        setProvider(updatedProvider);
      }
    } catch (error) {
      console.error('Error refreshing data after rating deletion:', error);
    }
  };

  const handleStartChat = () => {
    console.log('💬 Starting chat with provider:', provider.id);
    onStartChat(provider.id);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50">
        <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-slate-800 border-b border-slate-700 z-10">
            <div className="flex items-center justify-between p-4 sm:p-6">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                {provider.profileImage ? (
                  <img
                    src={provider.profileImage}
                    alt={provider.businessName || provider.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#3db2ff] flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600 flex-shrink-0">
                    <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-white truncate">
                    {provider.businessName || provider.name}
                  </h2>
                  <div className="flex items-center space-x-2 text-[#cbd5e1] text-sm">
                    {provider.businessType === 'business' ? (
                      <Building className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    ) : (
                      <User className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    )}
                    <span className="capitalize truncate">{provider.businessType}</span>
                  </div>
                  <div className="mt-1 sm:mt-2">
                    <RatingDisplay 
                      rating={provider.rating} 
                      reviewCount={provider.reviewCount} 
                      size="md"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700 flex-shrink-0"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-700">
              <nav className="flex px-4 sm:px-6">
                <button
                  onClick={() => setActiveTab('about')}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition-colors flex-1 text-center ${
                    activeTab === 'about'
                      ? 'border-[#3db2ff] text-[#3db2ff]'
                      : 'border-transparent text-[#cbd5e1] hover:text-white hover:border-slate-500'
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm transition-colors flex-1 text-center ${
                    activeTab === 'reviews'
                      ? 'border-[#3db2ff] text-[#3db2ff]'
                      : 'border-transparent text-[#cbd5e1] hover:text-white hover:border-slate-500'
                  }`}
                >
                  Reviews ({ratings.length})
                </button>
              </nav>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {activeTab === 'about' ? (
              <>
                {/* Service Type */}
                <div>
                  <span className="inline-block bg-[#3db2ff] text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-sm font-medium">
                    {provider.serviceType}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">About</h3>
                  <p className="text-[#cbd5e1] leading-relaxed text-sm sm:text-base">{provider.description}</p>
                </div>

                {/* Work Portfolio */}
                {provider.workPortfolio && provider.workPortfolio.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Work Portfolio</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {provider.workPortfolio.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Work ${index + 1}`}
                          className="w-full h-24 sm:h-32 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                      <span className="text-[#cbd5e1] text-sm sm:text-base break-all">{provider.email}</span>
                    </div>
                    {provider.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-[#cbd5e1] text-sm sm:text-base">{provider.phone}</span>
                      </div>
                    )}
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[#cbd5e1] text-sm sm:text-base">
                        {provider.location.address} • {provider.workRadius}km radius
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Customer Reviews</h3>
                    {provider.rating > 0 && provider.reviewCount > 0 ? (
                      <div className="flex items-center space-x-4">
                        <RatingDisplay 
                          rating={provider.rating} 
                          reviewCount={provider.reviewCount} 
                          size="lg"
                        />
                      </div>
                    ) : (
                      <p className="text-[#cbd5e1] text-sm">This provider hasn't received any reviews yet.</p>
                    )}
                  </div>
                  {canRate && (
                    <button
                      onClick={() => setShowRatingModal(true)}
                      className="bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] hover:from-[#2563eb] hover:to-[#059669] text-white px-4 py-2 rounded-md transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
                    >
                      <Star className="h-4 w-4" />
                      <span>{userRating ? 'Update Rating' : 'Rate Provider'}</span>
                    </button>
                  )}
                </div>
                
                {ratingsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 text-[#3db2ff] mx-auto mb-4 animate-spin" />
                    <p className="text-[#cbd5e1]">Loading reviews...</p>
                  </div>
                ) : (
                  <ReviewsList 
                    ratings={ratings} 
                    onRatingDeleted={handleRatingDeleted}
                  />
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <button
                onClick={handleStartChat}
                className="flex items-center justify-center space-x-2 bg-[#3db2ff] hover:bg-blue-500 text-white px-4 sm:px-6 py-3 rounded-md transition-colors text-sm sm:text-base"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Start Chat</span>
              </button>
              
              {provider.phone && (
                <a
                  href={`tel:${provider.phone}`}
                  className="flex items-center justify-center space-x-2 bg-[#00c9a7] hover:bg-teal-500 text-white px-4 sm:px-6 py-3 rounded-md transition-colors text-sm sm:text-base"
                >
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span>Call Now</span>
                </a>
              )}
              
              <a
                href={`mailto:${provider.email}`}
                className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 sm:px-6 py-3 rounded-md transition-colors text-sm sm:text-base"
              >
                <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Email</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && (
        <RatingModal
          provider={provider}
          onClose={() => setShowRatingModal(false)}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </>
  );
}