import React, { useEffect } from 'react';
import { ServiceProvider, SearchFilters } from '../../types';
import ServiceCard from './ServiceCard';
import { Search, Loader2, RefreshCw, Users, Clock, Globe, Award } from 'lucide-react';

interface SearchResultsProps {
  results: ServiceProvider[];
  hasSearched: boolean;
  searchFilters: SearchFilters;
  loading?: boolean;
  onRefresh?: () => void;
  onChatStart?: (providerId: string) => void; // Add chat start callback
}

export default function SearchResults({ 
  results, 
  hasSearched, 
  searchFilters, 
  loading, 
  onRefresh, 
  onChatStart 
}: SearchResultsProps) {
  // Debug log to see what data we're getting with all fields
  useEffect(() => {
    if (results.length > 0) {
      console.log('🔍 SearchResults received providers with all data:', results.map(p => ({
        name: p.name,
        rating: p.rating,
        reviewCount: p.reviewCount,
        website: p.website,
        socialMedia: p.socialMedia,
        specialties: p.specialties,
        yearsExperience: p.yearsExperience,
        certifications: p.certifications,
        availability: p.availability,
        currentStatus: p.currentStatus,
        isPublished: p.isPublished
      })));
    }
  }, [results]);

  if (!hasSearched) {
    return null;
  }

  // Count providers with and without ratings
  const providersWithRatings = results.filter(p => p.rating > 0 && p.reviewCount > 0);
  const newProviders = results.filter(p => (!p.rating || p.rating === 0) && (!p.reviewCount || p.reviewCount === 0));
  
  // Count providers with additional details
  const providersWithWebsite = results.filter(p => p.website && p.website.trim() !== '');
  const providersWithSpecialties = results.filter(p => p.specialties && p.specialties.length > 0);
  const providersWithAvailability = results.filter(p => p.availability && Object.keys(p.availability).length > 0);
  const providersWithExperience = results.filter(p => p.yearsExperience && p.yearsExperience > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Search Results
            {searchFilters.keyword && (
              <span className="text-[#3db2ff] ml-2">for "{searchFilters.keyword}"</span>
            )}
          </h2>
          {!loading && results.length > 0 && (
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <div className="flex items-center space-x-2 text-sm text-[#cbd5e1]">
                <Users className="h-4 w-4" />
                <span>{results.length} {results.length === 1 ? 'provider' : 'providers'} found</span>
              </div>
              {providersWithRatings.length > 0 && (
                <span className="text-sm text-yellow-400">
                  {providersWithRatings.length} rated
                </span>
              )}
              {newProviders.length > 0 && (
                <span className="text-sm text-green-400">
                  {newProviders.length} new
                </span>
              )}
              {providersWithWebsite.length > 0 && (
                <div className="flex items-center space-x-1 text-sm text-[#3db2ff]">
                  <Globe className="h-3 w-3" />
                  <span>{providersWithWebsite.length} with websites</span>
                </div>
              )}
              {providersWithAvailability.length > 0 && (
                <div className="flex items-center space-x-1 text-sm text-[#00c9a7]">
                  <Clock className="h-3 w-3" />
                  <span>{providersWithAvailability.length} with hours</span>
                </div>
              )}
              {providersWithExperience.length > 0 && (
                <div className="flex items-center space-x-1 text-sm text-purple-400">
                  <Award className="h-3 w-3" />
                  <span>{providersWithExperience.length} with experience listed</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <p className="text-[#cbd5e1]">
            {loading ? (
              <span className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </span>
            ) : (
              `${results.length} ${results.length === 1 ? 'provider' : 'providers'} found`
            )}
          </p>
          {onRefresh && !loading && (
            <button
              onClick={onRefresh}
              className="flex items-center space-x-1 text-[#3db2ff] hover:text-blue-400 transition-colors text-sm"
              title="Refresh results"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="bg-slate-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-10 w-10 text-[#3db2ff] animate-spin" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Searching providers...</h3>
          <p className="text-[#cbd5e1]">Please wait while we find the best matches for you</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-slate-800 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <Search className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
          <p className="text-[#cbd5e1] mb-4">
            Try adjusting your search criteria or expanding your search radius
          </p>
          <div className="space-y-2 text-sm text-[#cbd5e1] bg-slate-800 rounded-lg p-4 max-w-md mx-auto">
            <p className="font-medium mb-2">💡 Search tips:</p>
            <p>• Try different keywords or service types</p>
            <p>• Increase your search radius</p>
            <p>• Check your location spelling</p>
            <p>• Browse all services by leaving search empty</p>
          </div>
        </div>
      ) : (
        <>
          {/* Enhanced Results Summary */}
          {(providersWithRatings.length > 0 || newProviders.length > 0 || providersWithWebsite.length > 0 || providersWithAvailability.length > 0) && (
            <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {providersWithRatings.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm text-[#cbd5e1]">
                      {providersWithRatings.length} rated
                    </span>
                  </div>
                )}
                {newProviders.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm text-[#cbd5e1]">
                      {newProviders.length} new
                    </span>
                  </div>
                )}
                {providersWithWebsite.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Globe className="h-3 w-3 text-[#3db2ff]" />
                    <span className="text-sm text-[#cbd5e1]">
                      {providersWithWebsite.length} with websites
                    </span>
                  </div>
                )}
                {providersWithAvailability.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-3 w-3 text-[#00c9a7]" />
                    <span className="text-sm text-[#cbd5e1]">
                      {providersWithAvailability.length} with hours
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-600">
                <p className="text-xs text-gray-400">
                  Results sorted by rating, then by newest • All providers shown have complete profiles with verified information
                </p>
              </div>
            </div>
          )}

          {/* Provider Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((provider) => (
              <ServiceCard 
                key={`${provider.id}-${Date.now()}`} 
                provider={provider}
                onChatStart={onChatStart}
              />
            ))}
          </div>

          {/* Additional Info Footer */}
          {results.length > 0 && (
            <div className="mt-8 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="text-center">
                <h4 className="text-white font-medium mb-2">What you can see for each provider:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-[#cbd5e1]">
                  <div>✓ Ratings & Reviews</div>
                  <div>✓ Business Hours</div>
                  <div>✓ Website Links</div>
                  <div>✓ Specialties</div>
                  <div>✓ Experience Level</div>
                  <div>✓ Certifications</div>
                  <div>✓ Work Portfolio</div>
                  <div>✓ Contact Info</div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  All provider information is verified and up-to-date. Click "View" to see complete profiles.
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}