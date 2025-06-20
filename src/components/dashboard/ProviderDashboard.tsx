import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ProviderForm from '../profile/ProviderForm';
import EnhancedMessaging from '../messaging/EnhancedMessaging';
import AICoach from '../coaching/AICoach';
import { ServiceProvider } from '../../types';
import { User, MapPin, Phone, Mail, Eye, EyeOff, Edit, CheckCircle, XCircle, Camera, MessageCircle, Settings, BarChart3, Bell, X, Loader2, Globe, Users, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function ProviderDashboard() {
  const { user, updateProfile } = useAuth();
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'messages' | 'profile' | 'coach'>('overview');
  const [updating, setUpdating] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [providerData, setProviderData] = useState<ServiceProvider | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const provider = (providerData || user) as ServiceProvider;
  const isProfileComplete = provider && 
    provider.serviceType && 
    provider.description && 
    provider.location.address &&
    provider.profileImage;

  // Refresh provider data to get latest ratings and all fields
  useEffect(() => {
    const refreshProviderData = async () => {
      if (!user || user.role !== 'provider') return;

      try {
        const { data, error } = await supabase
          .from('service_providers')
          .select(`
            *,
            profiles!service_providers_id_fkey(email, name, profile_image)
          `)
          .eq('id', user.id)
          .maybeSingle();

        if (!error && data) {
          const updatedProvider: ServiceProvider = {
            id: data.id,
            email: (data.profiles as any).email,
            name: (data.profiles as any).name,
            role: 'provider' as const,
            createdAt: new Date(data.created_at),
            profileImage: (data.profiles as any).profile_image || '',
            businessName: data.business_name || undefined,
            businessType: data.business_type,
            serviceType: data.service_type,
            description: data.description,
            phone: data.phone || undefined,
            website: data.website || undefined,
            socialMedia: data.social_media || {},
            specialties: data.specialties || [],
            yearsExperience: data.years_experience || 0,
            certifications: data.certifications || [],
            location: {
              address: data.address,
              lat: data.latitude,
              lng: data.longitude,
            },
            workRadius: data.work_radius,
            workPortfolio: data.work_portfolio,
            isPublished: data.is_published,
            rating: data.rating || 0,
            reviewCount: data.review_count || 0,
            totalRatingPoints: data.total_rating_points || 0,
            availability: data.availability || undefined,
            currentStatus: data.current_status || 'available',
          };
          
          console.log('🔄 Provider dashboard refreshed data with all fields:', {
            name: updatedProvider.name,
            rating: updatedProvider.rating,
            reviewCount: updatedProvider.reviewCount,
            website: updatedProvider.website,
            socialMedia: updatedProvider.socialMedia,
            specialties: updatedProvider.specialties,
            availability: updatedProvider.availability
          });
          
          setProviderData(updatedProvider);
        }
      } catch (error) {
        console.error('Error refreshing provider data:', error);
      }
    };

    refreshProviderData();
    
    // Set up interval to refresh data every 30 seconds
    const interval = setInterval(refreshProviderData, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Load unread message count
  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!user) return;

      try {
        const { count, error } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', user.id)
          .eq('read', false);

        if (!error) {
          setUnreadCount(count || 0);
        }
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    loadUnreadCount();
    
    // Set up interval to refresh unread count every 10 seconds
    const interval = setInterval(loadUnreadCount, 10000);
    
    return () => clearInterval(interval);
  }, [user]);

  // Show notification banner when there are unread messages
  useEffect(() => {
    if (unreadCount > 0 && activeTab !== 'messages') {
      setShowNotificationBanner(true);
    } else {
      setShowNotificationBanner(false);
    }
  }, [unreadCount, activeTab]);

  const handleProfileUpdate = async (data: Partial<ServiceProvider>) => {
    setUpdating(true);
    setUpdateError(null);
    setUpdateSuccess(false);
    
    try {
      console.log('🔄 Starting comprehensive profile update...', data);
      const success = await updateProfile(data);
      
      if (success) {
        console.log('✅ Profile update successful');
        setUpdateSuccess(true);
        setShowEditForm(false);
        
        // Refresh provider data immediately to show updated information
        setTimeout(async () => {
          try {
            const { data: refreshedData, error } = await supabase
              .from('service_providers')
              .select(`
                *,
                profiles!service_providers_id_fkey(email, name, profile_image)
              `)
              .eq('id', user!.id)
              .maybeSingle();

            if (!error && refreshedData) {
              const updatedProvider: ServiceProvider = {
                id: refreshedData.id,
                email: (refreshedData.profiles as any).email,
                name: (refreshedData.profiles as any).name,
                role: 'provider' as const,
                createdAt: new Date(refreshedData.created_at),
                profileImage: (refreshedData.profiles as any).profile_image || '',
                businessName: refreshedData.business_name || undefined,
                businessType: refreshedData.business_type,
                serviceType: refreshedData.service_type,
                description: refreshedData.description,
                phone: refreshedData.phone || undefined,
                website: refreshedData.website || undefined,
                socialMedia: refreshedData.social_media || {},
                specialties: refreshedData.specialties || [],
                yearsExperience: refreshedData.years_experience || 0,
                certifications: refreshedData.certifications || [],
                location: {
                  address: refreshedData.address,
                  lat: refreshedData.latitude,
                  lng: refreshedData.longitude,
                },
                workRadius: refreshedData.work_radius,
                workPortfolio: refreshedData.work_portfolio,
                isPublished: refreshedData.is_published,
                rating: refreshedData.rating || 0,
                reviewCount: refreshedData.review_count || 0,
                totalRatingPoints: refreshedData.total_rating_points || 0,
                availability: refreshedData.availability || undefined,
                currentStatus: refreshedData.current_status || 'available',
              };
              
              console.log('🔄 Updated provider data after save:', {
                name: updatedProvider.name,
                website: updatedProvider.website,
                socialMedia: updatedProvider.socialMedia,
                specialties: updatedProvider.specialties,
                availability: updatedProvider.availability
              });
              
              setProviderData(updatedProvider);
            }
          } catch (error) {
            console.error('Error refreshing data after update:', error);
          }
        }, 500);
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          setUpdateSuccess(false);
        }, 3000);
      } else {
        console.error('❌ Profile update failed');
        setUpdateError('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('❌ Profile update error:', error);
      setUpdateError('An error occurred while updating your profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const togglePublishStatus = async () => {
    if (!isProfileComplete) {
      setUpdateError('Please complete all required fields and add a profile picture before publishing.');
      return;
    }
    
    console.log('🔄 Toggling publish status from', provider.isPublished, 'to', !provider.isPublished);
    await handleProfileUpdate({ isPublished: !provider.isPublished });
  };

  if (showEditForm) {
    return (
      <div className="min-h-screen bg-[#0d182c] py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setShowEditForm(false)}
            className="mb-6 text-[#cbd5e1] hover:text-white transition-colors"
            disabled={updating}
          >
            ← Back to Dashboard
          </button>
          
          {updating && (
            <div className="mb-6 bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                <div>
                  <p className="text-blue-400 font-medium">Updating Profile...</p>
                  <p className="text-blue-300 text-sm">Please wait while we save your changes.</p>
                </div>
              </div>
            </div>
          )}
          
          <ProviderForm
            initialData={provider}
            onSubmit={handleProfileUpdate}
            loading={updating}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d182c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {updateSuccess && (
          <div className="mb-6 bg-green-900/20 border border-green-600 rounded-lg p-4 animate-pulse">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-green-400 font-medium">Profile Updated Successfully!</p>
                <p className="text-green-300 text-sm">Your changes have been saved and are now visible to users.</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {updateError && (
          <div className="mb-6 bg-red-900/20 border border-red-600 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <XCircle className="h-5 w-5 text-red-400" />
                <div>
                  <p className="text-red-400 font-medium">Update Failed</p>
                  <p className="text-red-300 text-sm">{updateError}</p>
                </div>
              </div>
              <button
                onClick={() => setUpdateError(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Notification Banner */}
        {showNotificationBanner && (
          <div className="mb-6 bg-gradient-to-r from-[#3db2ff] to-[#00c9a7] rounded-lg p-4 shadow-lg animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white rounded-full p-2">
                  <Bell className="h-5 w-5 text-[#3db2ff]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">
                    {unreadCount === 1 ? 'New Message!' : `${unreadCount} New Messages!`}
                  </h3>
                  <p className="text-white/90 text-sm">
                    You have unread messages from customers. Click to view and respond.
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab('messages')}
                  className="bg-white text-[#3db2ff] px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                  View Messages
                </button>
                <button
                  onClick={() => setShowNotificationBanner(false)}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Provider Dashboard
          </h1>
          <p className="text-[#cbd5e1]">Manage your service profile and customer communications</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-slate-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'overview'
                    ? 'border-[#3db2ff] text-[#3db2ff]'
                    : 'border-transparent text-[#cbd5e1] hover:text-white hover:border-slate-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Overview</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('messages')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors relative ${
                  activeTab === 'messages'
                    ? 'border-[#3db2ff] text-[#3db2ff]'
                    : 'border-transparent text-[#cbd5e1] hover:text-white hover:border-slate-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <MessageCircle className="h-4 w-4" />
                   
                  </div>
                  <span>Messages</span>
                  {unreadCount > 0 && (
                    <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                      {unreadCount}
                    </div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('coach')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'coach'
                    ? 'border-[#3db2ff] text-[#3db2ff]'
                    : 'border-transparent text-[#cbd5e1] hover:text-white hover:border-slate-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Award className="h-4 w-4" />
                  <span>AI Coach</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-[#3db2ff] text-[#3db2ff]'
                    : 'border-transparent text-[#cbd5e1] hover:text-white hover:border-slate-500'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Profile Settings</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Profile Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckCircle className={`h-6 w-6 ${isProfileComplete ? 'text-[#00c9a7]' : 'text-gray-400'}`} />
                  <h3 className="text-lg font-semibold text-white">Profile Status</h3>
                </div>
                <p className={`text-sm ${isProfileComplete ? 'text-[#00c9a7]' : 'text-yellow-400'}`}>
                  {isProfileComplete ? 'Complete' : 'Incomplete - please fill all required fields and add profile picture'}
                </p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                  {provider?.isPublished ? (
                    <Eye className="h-6 w-6 text-[#00c9a7]" />
                  ) : (
                    <EyeOff className="h-6 w-6 text-gray-400" />
                  )}
                  <h3 className="text-lg font-semibold text-white">Visibility</h3>
                </div>
                <p className={`text-sm ${provider?.isPublished ? 'text-[#00c9a7]' : 'text-gray-400'}`}>
                  {provider?.isPublished ? 'Published - visible to users' : 'Not published - hidden from search'}
                </p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-2">
                  <User className="h-6 w-6 text-[#3db2ff]" />
                  <h3 className="text-lg font-semibold text-white">Account Type</h3>
                </div>
                <p className="text-sm text-[#cbd5e1] capitalize">
                  {provider?.businessType || 'Individual'} Provider
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-[#3db2ff] mb-2">
                  {provider?.rating?.toFixed(1) || '0.0'}
                </div>
                <p className="text-[#cbd5e1]">Average Rating</p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-[#00c9a7] mb-2">
                  {provider?.reviewCount || 0}
                </div>
                <p className="text-[#cbd5e1]">Total Reviews</p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {provider?.workRadius || 0}km
                </div>
                <p className="text-[#cbd5e1]">Service Radius</p>
              </div>

              <div className="bg-slate-800 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  {provider?.workPortfolio?.length || 0}
                </div>
                <p className="text-[#cbd5e1]">Portfolio Images</p>
              </div>
            </div>

            {/* Profile Preview */}
            <div className="bg-slate-800 rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-white">Profile Preview</h2>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="flex items-center justify-center space-x-2 bg-[#3db2ff] hover:bg-blue-500 text-white px-4 py-2 rounded-md transition-colors"
                    disabled={updating}
                  >
                    <Edit className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                  {isProfileComplete && (
                    <button
                      onClick={togglePublishStatus}
                      disabled={updating}
                      className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm ${
                        provider?.isPublished
                          ? 'bg-red-600 hover:bg-red-500 text-white'
                          : 'bg-[#00c9a7] hover:bg-teal-500 text-white'
                      }`}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="hidden sm:inline">Updating...</span>
                        </>
                      ) : provider?.isPublished ? (
                        <>
                          <EyeOff className="h-4 w-4" />
                          <span className="hidden sm:inline">Unpublish</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4" />
                          <span className="hidden sm:inline">Publish</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {/* Profile Image */}
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                      Profile Picture
                    </label>
                    {provider?.profileImage ? (
                      <img
                        src={provider.profileImage}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-2 border-[#3db2ff]"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                        <Camera className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                      {provider?.businessType === 'business' ? 'Business Name' : 'Name'}
                    </label>
                    <p className="text-white">
                      {provider?.businessName || provider?.name || 'Not set'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                      Service Type
                    </label>
                    <p className="text-white">{provider?.serviceType || 'Not set'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                      Description
                    </label>
                    <p className="text-white">{provider?.description || 'Not set'}</p>
                  </div>

                  {/* Additional Details */}
                  {provider?.specialties && provider.specialties.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                        Specialties
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {provider.specialties.map((specialty, index) => (
                          <span key={index} className="bg-[#3db2ff] text-white px-2 py-1 rounded-full text-xs">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {provider?.yearsExperience && provider.yearsExperience > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                        Experience
                      </label>
                      <p className="text-white">{provider.yearsExperience} years</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                      Contact Information
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-white">{provider?.email}</span>
                      </div>
                      {provider?.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{provider.phone}</span>
                        </div>
                      )}
                      {provider?.website && (
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <a href={provider.website} target="_blank" rel="noopener noreferrer" className="text-[#3db2ff] hover:text-blue-400">
                            {provider.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                      Service Area
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-white">{provider?.location?.address || 'Not set'}</span>
                      </div>
                      {provider?.workRadius && (
                        <p className="text-sm text-[#cbd5e1] ml-6">
                          Serving within {provider.workRadius}km radius
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Social Media */}
                  {provider?.socialMedia && Object.keys(provider.socialMedia).length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                        Social Media
                      </label>
                      <div className="space-y-1">
                        {Object.entries(provider.socialMedia).map(([platform, url]) => (
                          url && (
                            <div key={platform} className="flex items-center space-x-2">
                              <span className="text-xs text-gray-400 capitalize w-16">{platform}:</span>
                              <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#3db2ff] hover:text-blue-400 text-sm truncate">
                                {url}
                              </a>
                            </div>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {provider?.certifications && provider.certifications.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-1">
                        Certifications
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {provider.certifications.map((cert, index) => (
                          <span key={index} className="bg-[#00c9a7] text-white px-2 py-1 rounded-full text-xs">
                            {cert}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Work Portfolio */}
                  {provider?.workPortfolio && provider.workPortfolio.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                        Work Portfolio ({provider.workPortfolio.length} images)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {provider.workPortfolio.slice(0, 6).map((image, index) => (
                          <img
                            key={index}
                            src={image}
                            alt={`Work ${index + 1}`}
                            className="w-full h-16 object-cover rounded-md"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isProfileComplete && (
                <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded-md">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-5 w-5 text-yellow-400" />
                    <p className="text-yellow-400 font-medium">Profile Incomplete</p>
                  </div>
                  <p className="text-yellow-300 text-sm mt-1">
                    Please complete all required fields and add a profile picture to publish your profile and be visible to users.
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'messages' && (
          <div className="h-[600px]">
            <EnhancedMessaging />
          </div>
        )}

        {activeTab === 'coach' && (
          <div className="max-w-4xl mx-auto">
            <AICoach provider={provider} />
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-slate-800 rounded-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">Profile Settings</h2>
              <p className="text-[#cbd5e1]">Update your service information, portfolio, and availability</p>
            </div>
            
            {updating && (
              <div className="mb-6 bg-blue-900/20 border border-blue-600 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                  <div>
                    <p className="text-blue-400 font-medium">Updating Profile...</p>
                    <p className="text-blue-300 text-sm">Please wait while we save your changes.</p>
                  </div>
                </div>
              </div>
            )}
            
            <ProviderForm
              initialData={provider}
              onSubmit={handleProfileUpdate}
              loading={updating}
            />
          </div>
        )}
      </div>
    </div>
  );
}