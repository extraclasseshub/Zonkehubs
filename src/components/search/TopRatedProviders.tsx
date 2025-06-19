import React, { useState, useEffect } from 'react';
import { ServiceProvider } from '../../types';
import { Star, MapPin, User, Building, Crown, Award, Loader2, Globe, Clock } from 'lucide-react';
import RatingDisplay from '../rating/RatingDisplay';
import { supabase } from '../../lib/supabase';

interface TopRatedProvidersProps {
  onProviderClick: (provider: ServiceProvider) => void;
}

export default function TopRatedProviders({ onProviderClick }: TopRatedProvidersProps) {
  const [topProviders, setTopProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopProviders = async () => {
      try {
        console.log('🏆 Loading top rated providers with all fields...');
        
        // Get ALL published providers with complete profile data including new fields
        const { data, error } = await supabase
          .from('service_providers')
          .select(`
            *,
            profiles!service_providers_id_fkey(email, name, profile_image)
          `)
          .eq('is_published', true)
          .neq('service_type', '')
          .neq('description', '')
          .neq('address', '')
          .order('rating', { ascending: false })
          .order('review_count', { ascending: false })
          .order('created_at', { ascending: false }); // Show newest providers if no ratings

        if (error) {
          console.error('Error loading providers:', error);
          setTopProviders([]);
          return;
        }

        console.log('🏆 Raw provider data from database:', data?.length || 0, 'providers');

        if (!data || data.length === 0) {
          console.log('🏆 No published providers found');
          setTopProviders([]);
          return;
        }

        // Convert all providers with explicit type conversion including all new fields
        const allProviders: ServiceProvider[] = [];
        
        for (const item of data) {
          try {
            // Ensure we have profile data
            const profileData = item.profiles as any;
            if (!profileData) {
              console.warn('⚠️ Skipping provider with missing profile data:', item.id);
              continue;
            }

            // Ensure required fields are present
            if (!item.service_type || !item.description || !item.address) {
              console.warn('⚠️ Skipping provider with incomplete data:', item.id);
              continue;
            }

            const provider: ServiceProvider = {
              id: item.id,
              email: profileData.email,
              name: profileData.name,
              role: 'provider' as const,
              createdAt: new Date(item.created_at),
              profileImage: profileData.profile_image || '',
              businessName: item.business_name || undefined,
              businessType: item.business_type || 'individual',
              serviceType: item.service_type,
              description: item.description,
              phone: item.phone || undefined,
              website: item.website || undefined,
              socialMedia: item.social_media || {},
              specialties: item.specialties || [],
              yearsExperience: item.years_experience || 0,
              certifications: item.certifications || [],
              location: {
                address: item.address,
                lat: Number(item.latitude) || 0,
                lng: Number(item.longitude) || 0,
              },
              workRadius: Number(item.work_radius) || 10,
              workPortfolio: item.work_portfolio || [],
              isPublished: Boolean(item.is_published),
              rating: Number(item.rating) || 0,
              reviewCount: Number(item.review_count) || 0,
              totalRatingPoints: Number(item.total_rating_points) || 0,
              availability: item.availability || undefined,
              currentStatus: item.current_status || 'available',
            };
            
            console.log('✅ Processed provider with all fields:', {
              name: provider.name,
              rating: provider.rating,
              reviewCount: provider.reviewCount,
              website: provider.website,
              specialties: provider.specialties,
              availability: provider.availability,
              currentStatus: provider.currentStatus
            });
            
            allProviders.push(provider);
          } catch (error) {
            console.error('❌ Error processing provider:', item.id, error);
            continue;
          }
        }

        console.log('🏆 All converted providers with full data:', allProviders.length);

        // For top rated section, prioritize providers with ratings, but also show new providers
        let topProviders: ServiceProvider[] = [];
        
        // First, get providers with actual ratings (rating > 0 AND reviewCount > 0)
        const providersWithRatings = allProviders.filter(provider => {
          const hasValidRatings = provider.rating > 0 && provider.reviewCount > 0;
          console.log(`🏆 Provider ${provider.name}: rating=${provider.rating}, reviewCount=${provider.reviewCount}, hasValidRatings=${hasValidRatings}`);
          return hasValidRatings;
        });

        console.log('🏆 Providers with valid ratings:', providersWithRatings.length);

        if (providersWithRatings.length > 0) {
          // Sort by rating (descending), then by review count (descending)
          const sortedByRating = providersWithRatings.sort((a, b) => {
            // Primary sort: by rating (higher is better) - use small threshold for floating point comparison
            if (Math.abs(b.rating - a.rating) > 0.1) {
              return b.rating - a.rating;
            }
            // Secondary sort: by review count (more reviews is better)
            if (b.reviewCount !== a.reviewCount) {
              return b.reviewCount - a.reviewCount;
            }
            // Tertiary sort: by total rating points (higher total indicates more engagement)
            return b.totalRatingPoints - a.totalRatingPoints;
          });

          topProviders = sortedByRating.slice(0, 6);
          
          console.log('🏆 Top rated providers selected:', topProviders.map(p => ({
            name: p.name,
            rating: p.rating,
            reviewCount: p.reviewCount,
            totalRatingPoints: p.totalRatingPoints
          })));
        }

        // If we don't have enough rated providers, fill with newest providers
        if (topProviders.length < 6) {
          const remainingSlots = 6 - topProviders.length;
          const providersWithoutRatings = allProviders.filter(provider => 
            provider.rating === 0 || provider.reviewCount === 0
          );
          
          // Sort by creation date (newest first)
          const newestProviders = providersWithoutRatings
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, remainingSlots);
          
          topProviders = [...topProviders, ...newestProviders];
          
          console.log('🏆 Added newest providers to fill slots:', newestProviders.length);
        }

        console.log('🏆 Final top providers with all data:', topProviders.length);
        console.log('🏆 Top providers details:', topProviders.map(p => ({
          name: p.name,
          rating: p.rating,
          reviewCount: p.reviewCount,
          website: p.website,
          specialties: p.specialties,
          availability: p.availability,
          currentStatus: p.currentStatus
        })));
        
        setTopProviders(topProviders);
      } catch (error) {
        console.error('Error loading top providers:', error);
        setTopProviders([]);
      } finally {
        setLoading(false);
      }
    };

    loadTopProviders();
    
    // Set up interval to refresh every 30 seconds to catch new providers and ratings
    const interval = setInterval(loadTopProviders, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Helper function to get availability status
  const getAvailabilityStatus = (provider: ServiceProvider) => {
    if (!provider.availability || Object.keys(provider.availability).length === 0) {
      return null;
    }

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todaySchedule = provider.availability[today as keyof typeof provider.availability];
    
    if (todaySchedule?.available) {
      return { 
        status: `Open ${todaySchedule.start}-${todaySchedule.end}`, 
        color: 'text-green-400' 
      };
    } else {
      return { status: 'Closed today', color: 'text-red-400' };
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Loader2 className="h-8 w-8 text-[#3db2ff] animate-spin" />
          <Crown className="h-8 w-8 text-yellow-400" />
        </div>
        <p className="text-[#cbd5e1]">Loading featured providers...</p>
      </div>
    );
  }

  if (topProviders.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Crown className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Featured Providers Yet</h3>
        <p className="text-[#cbd5e1] mb-4">
          Be the first to rate service providers and help build our community!
        </p>
        <div className="text-sm text-[#cbd5e1] bg-slate-700 rounded-lg p-4">
          <p className="mb-2">💡 <strong>How to get featured providers:</strong></p>
          <div className="space-y-1 text-left">
            <p>• Service providers need to complete their profiles and publish them</p>
            <p>• Users need to rate providers after using their services</p>
            <p>• Providers with highest ratings and most reviews appear here</p>
            <p>• New providers are also featured to help them get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-3">
          <Crown className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Featured Providers</h2>
          <p className="text-[#cbd5e1]">Top rated and newest service providers</p>
        </div>
      </div>

      {/* Top Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topProviders.map((provider, index) => {
          const availabilityStatus = getAvailabilityStatus(provider);
          
          return (
            <div
              key={provider.id}
              className="bg-slate-800 rounded-lg p-6 hover:bg-slate-700 transition-all duration-300 cursor-pointer transform hover:scale-105 relative overflow-hidden"
              onClick={() => onProviderClick(provider)}
            >
              {/* Badge for top rated or new */}
              <div className="absolute top-4 right-4">
                <div className={`rounded-full p-2 ${
                  provider.rating > 0 && provider.reviewCount > 0
                    ? index === 0 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                      : index === 1 
                      ? 'bg-gradient-to-r from-gray-300 to-gray-500'
                      : index === 2
                      ? 'bg-gradient-to-r from-orange-400 to-orange-600'
                      : 'bg-gradient-to-r from-[#3db2ff] to-[#00c9a7]'
                    : 'bg-gradient-to-r from-green-400 to-green-600'
                }`}>
                  {provider.rating > 0 && provider.reviewCount > 0 ? (
                    index < 3 ? (
                      <Award className="h-4 w-4 text-white" />
                    ) : (
                      <Star className="h-4 w-4 text-white fill-current" />
                    )
                  ) : (
                    <span className="text-white text-xs font-bold">NEW</span>
                  )}
                </div>
              </div>

              {/* Provider Info */}
              <div className="flex items-start space-x-4 mb-4">
                {provider.profileImage ? (
                  <img
                    src={provider.profileImage}
                    alt={provider.businessName || provider.name}
                    className="w-16 h-16 rounded-full object-cover border-3 border-gradient-to-r from-yellow-400 to-orange-500"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center border-3 border-slate-600">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {provider.businessName || provider.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-[#cbd5e1] mb-2">
                    {provider.businessType === 'business' ? (
                      <Building className="h-4 w-4" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    <span className="capitalize">{provider.businessType}</span>
                    {provider.yearsExperience && provider.yearsExperience > 0 && (
                      <>
                        <span>•</span>
                        <span>{provider.yearsExperience}y exp</span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <span className="inline-block bg-[#3db2ff] text-white px-2 py-1 rounded-full text-xs font-medium">
                      {provider.serviceType}
                    </span>
                    {provider.specialties && provider.specialties.length > 0 && (
                      <span className="inline-block bg-slate-600 text-white px-2 py-1 rounded-full text-xs">
                        +{provider.specialties.length} specialties
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating or New Badge */}
              <div className="mb-4">
                {provider.rating > 0 && provider.reviewCount > 0 ? (
                  <RatingDisplay 
                    rating={provider.rating} 
                    reviewCount={provider.reviewCount} 
                    size="lg"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      New Provider
                    </div>
                    <span className="text-sm text-[#cbd5e1]">No reviews yet</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <p className="text-[#cbd5e1] text-sm mb-4 line-clamp-2">
                {provider.description}
              </p>

              {/* Additional Info */}
              <div className="space-y-2 mb-4">
                {/* Website */}
                {provider.website && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Globe className="h-4 w-4 text-[#3db2ff]" />
                    <span className="text-[#3db2ff] truncate">{provider.website}</span>
                  </div>
                )}

                {/* Availability Status */}
                {availabilityStatus && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className={availabilityStatus.color}>{availabilityStatus.status}</span>
                  </div>
                )}

                {/* Current Status */}
                {provider.currentStatus && (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      provider.currentStatus === 'available' 
                        ? 'bg-green-400' 
                        : provider.currentStatus === 'busy'
                        ? 'bg-yellow-400'
                        : 'bg-gray-400'
                    }`}></div>
                    <span className="text-sm text-[#cbd5e1] capitalize">{provider.currentStatus}</span>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="flex items-center space-x-2 text-sm text-[#cbd5e1]">
                <MapPin className="h-4 w-4" />
                <span>{provider.location.address}</span>
                <span>• {provider.workRadius}km radius</span>
              </div>

              {/* Portfolio Preview */}
              {provider.workPortfolio && provider.workPortfolio.length > 0 && (
                <div className="mt-4">
                  <div className="flex space-x-2 overflow-x-auto">
                    {provider.workPortfolio.slice(0, 3).map((image, imgIndex) => (
                      <img
                        key={imgIndex}
                        src={image}
                        alt={`Work ${imgIndex + 1}`}
                        className="w-12 h-12 object-cover rounded-md flex-shrink-0"
                      />
                    ))}
                    {provider.workPortfolio.length > 3 && (
                      <div className="w-12 h-12 bg-slate-700 rounded-md flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-[#cbd5e1]">+{provider.workPortfolio.length - 3}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Position Indicator */}
              <div className="absolute bottom-4 right-4">
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                  provider.rating > 0 && provider.reviewCount > 0
                    ? index === 0 
                      ? 'bg-yellow-500 text-white' 
                      : index === 1 
                      ? 'bg-gray-400 text-white'
                      : index === 2
                      ? 'bg-orange-500 text-white'
                      : 'bg-[#3db2ff] text-white'
                    : 'bg-green-500 text-white'
                }`}>
                  {provider.rating > 0 && provider.reviewCount > 0 ? `#${index + 1}` : 'NEW'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View All Link */}
      <div className="text-center">
        <p className="text-sm text-[#cbd5e1]">
          Showing {topProviders.length} featured providers • Use search to find specific services
        </p>
      </div>
    </div>
  );
}