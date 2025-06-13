import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SearchBar from '../search/SearchBar';
import SearchResults from '../search/SearchResults';
import TopRatedProviders from '../search/TopRatedProviders';
import UserMessages from '../messaging/UserMessages';
import ProviderModal from '../search/ProviderModal';
import { SearchFilters, ServiceProvider } from '../../types';
import { Search, MapPin, Filter, Users, MessageCircle, Bell, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'search' | 'messages'>('search');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    keyword: '',
    location: '',
    radius: 25,
  });
  const [searchResults, setSearchResults] = useState<ServiceProvider[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [publishedProvidersCount, setPublishedProvidersCount] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  const [chatWithProviderId, setChatWithProviderId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load published providers count
  useEffect(() => {
    const loadProvidersCount = async () => {
      try {
        console.log('📊 Loading published providers count...');
        
        const { count, error } = await supabase
          .from('service_providers')
          .select('*', { count: 'exact', head: true })
          .eq('is_published', true)
          .neq('service_type', '')
          .neq('description', '')
          .neq('address', '');
        
        if (error) {
          console.error('Error loading providers count:', error);
          setPublishedProvidersCount(0);
        } else {
          console.log('📊 Published providers count:', count);
          setPublishedProvidersCount(count || 0);
        }
      } catch (error) {
        console.error('Error loading providers count:', error);
        setPublishedProvidersCount(0);
      }
    };

    loadProvidersCount();
    
    // Set up interval to refresh count every 30 seconds to catch new providers
    const interval = setInterval(loadProvidersCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

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

  const performSearch = async (filters: SearchFilters) => {
    setSearchLoading(true);
    
    try {
      console.log('🔍 Performing search with filters:', filters);
      
      // Build query - Make sure we get ALL required fields and proper joins
      let query = supabase
        .from('service_providers')
        .select(`
          *,
          profiles!service_providers_id_fkey(email, name, profile_image)
        `)
        .eq('is_published', true);
      
      // Apply filters for complete profiles only
      query = query
        .neq('service_type', '')
        .neq('description', '')
        .neq('address', '');
      
      // Apply keyword filter if provided
      if (filters.keyword && filters.keyword.trim()) {
        const keyword = filters.keyword.trim();
        query = query.or(`service_type.ilike.%${keyword}%,business_name.ilike.%${keyword}%,description.ilike.%${keyword}%`);
      }
      
      // Apply service type filter if provided
      if (filters.serviceType && filters.serviceType.trim()) {
        query = query.eq('service_type', filters.serviceType.trim());
      }
      
      // Order by rating (highest first), then by review count (highest first), then by creation date (newest first)
      query = query
        .order('rating', { ascending: false })
        .order('review_count', { ascending: false })
        .order('created_at', { ascending: false });
      
      console.log('🔍 Executing search query...');
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Search error:', error);
        setSearchResults([]);
        return;
      }

      console.log('🔍 Raw search results:', data?.length || 0, 'providers found');
      
      if (!data || data.length === 0) {
        console.log('🔍 No providers found matching criteria');
        setSearchResults([]);
        return;
      }

      // Convert to ServiceProvider objects with proper error handling
      const providers: ServiceProvider[] = [];
      
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
            console.warn('⚠️ Skipping provider with incomplete data:', item.id, {
              hasServiceType: !!item.service_type,
              hasDescription: !!item.description,
              hasAddress: !!item.address
            });
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
          };
          
          console.log('✅ Processed provider:', {
            name: provider.name,
            serviceType: provider.serviceType,
            isPublished: provider.isPublished,
            rating: provider.rating,
            reviewCount: provider.reviewCount
          });
          
          providers.push(provider);
        } catch (error) {
          console.error('❌ Error processing provider:', item.id, error);
          continue;
        }
      }
      
      // Additional client-side sorting to ensure proper order
      const sortedProviders = providers.sort((a, b) => {
        // Primary sort: by rating (highest first)
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        
        // Secondary sort: by review count (highest first)
        if (b.reviewCount !== a.reviewCount) {
          return b.reviewCount - a.reviewCount;
        }
        
        // Tertiary sort: by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      
      console.log('🔍 Search completed and sorted:', sortedProviders.length, 'valid providers processed');
      console.log('🔍 Top 3 providers by rating:', sortedProviders.slice(0, 3).map(p => ({
        name: p.name,
        rating: p.rating,
        reviewCount: p.reviewCount,
        createdAt: p.createdAt
      })));
      
      setSearchResults(sortedProviders);
      
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = async (filters: SearchFilters) => {
    console.log('🔍 Starting search with filters:', filters);
    setSearchFilters(filters);
    setHasSearched(true);
    await performSearch(filters);
  };

  const handleRefreshResults = async () => {
    if (hasSearched) {
      console.log('🔄 Refreshing search results...');
      await performSearch(searchFilters);
    }
  };

  const handleChatStart = (providerId: string) => {
    console.log('💬 Starting chat with provider:', providerId);
    setChatWithProviderId(providerId);
    setActiveTab('messages');
  };

  const serviceTypes = ['Plumbing', 'Electrical', 'Barbering', 'Cleaning', 'Carpentry', 'Gardening'];

  return (
    <>
      <div className="min-h-screen bg-[#0d182c]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-[#cbd5e1]">Find the perfect service provider for your needs</p>
            
            {/* Provider Count */}
            <div className="mt-4 flex items-center space-x-2 text-sm">
              <Users className="h-4 w-4 text-[#3db2ff]" />
              <span className="text-[#cbd5e1]">
                {publishedProvidersCount} active service {publishedProvidersCount === 1 ? 'provider' : 'providers'} available
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-8">
            <div className="border-b border-slate-700">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('search')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'search'
                      ? 'border-[#3db2ff] text-[#3db2ff]'
                      : 'border-transparent text-[#cbd5e1] hover:text-white hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Find Services</span>
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
                      {unreadCount > 0 && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[16px] h-4 flex items-center justify-center px-1 animate-pulse border-2 border-[#0d182c]">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </div>
                      )}
                    </div>
                  <span>Messages</span>

                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'search' ? (
            <>
              {/* Quick Service Types */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">Popular Services</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {serviceTypes.map((service) => (
                    <button
                      key={service}
                      onClick={() => handleSearch({ ...searchFilters, keyword: service, serviceType: service })}
                      disabled={searchLoading}
                      className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-[#cbd5e1] hover:text-white px-4 py-3 rounded-md text-sm transition-colors flex items-center justify-center space-x-2"
                    >
                      <Search className="h-4 w-4" />
                      <span>{service}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Section */}
              <div className="mb-8">
                <SearchBar onSearch={handleSearch} loading={searchLoading} />
              </div>

              {/* Search Results or Top Rated Providers */}
              <div>
                {hasSearched ? (
                  <SearchResults 
                    results={searchResults} 
                    hasSearched={hasSearched}
                    searchFilters={searchFilters}
                    loading={searchLoading}
                    onRefresh={handleRefreshResults}
                    onChatStart={handleChatStart}
                  />
                ) : (
                  <>
                    {/* Top Rated Providers Section */}
                    <div className="mb-8">
                      <TopRatedProviders onProviderClick={setSelectedProvider} />
                    </div>

                    {/* Default State */}
                    <div className="text-center py-12">
                      <div className="bg-slate-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <Search className="h-10 w-10 text-[#3db2ff]" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">Start Your Search</h3>
                      <p className="text-[#cbd5e1] mb-6">
                        Use the search bar above or click on a popular service to find providers in your area
                      </p>
                      
                      {publishedProvidersCount === 0 ? (
                        <div className="text-sm text-[#cbd5e1] bg-slate-800 rounded-lg p-6 max-w-md mx-auto">
                          <div className="mb-4">
                            <h4 className="text-white font-semibold mb-2">🚀 Be the First Provider!</h4>
                            <p className="mb-2">No service providers have registered yet. This is a great opportunity!</p>
                          </div>
                          <div className="space-y-2 text-left">
                            <p>• <strong>Register as a Provider</strong> to be the first in your area</p>
                            <p>• <strong>Complete your profile</strong> with photos and portfolio</p>
                            <p>• <strong>Publish your services</strong> to start getting customers</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-[#cbd5e1] bg-slate-800 rounded-lg p-4 max-w-md mx-auto">
                          <p className="mb-2">💡 <strong>Tip:</strong> All providers shown are real users with verified profiles.</p>
                          <p>Search to find the perfect service provider for your needs!</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <UserMessages chatWithProviderId={chatWithProviderId} />
          )}
        </div>
      </div>

      {/* Provider Modal */}
      {selectedProvider && (
        <ProviderModal
          provider={selectedProvider}
          onClose={() => setSelectedProvider(null)}
          onStartChat={(providerId) => {
            setSelectedProvider(null);
            handleChatStart(providerId);
          }}
        />
      )}
    </>
  );
}