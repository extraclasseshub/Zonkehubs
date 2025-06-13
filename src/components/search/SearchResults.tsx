import React, { useEffect } from 'react';
import { ServiceProvider, SearchFilters } from '../../types';
import ServiceCard from './ServiceCard';
import { Search, Loader2, RefreshCw, Users } from 'lucide-react';

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
  // Debug log to see what rating data we're getting
  useEffect(() => {
    if (results.length > 0) {
      console.log('🔍 SearchResults received providers:', results.map(p => ({
        name: p.name,
        rating: p.rating,
        reviewCount: p.reviewCount,
        totalRatingPoints: p.totalRatingPoints,
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
            <div className="flex items-center space-x-4 mt-2">
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
          {/* Results Summary */}
          {(providersWithRatings.length > 0 || newProviders.length > 0) && (
            <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {providersWithRatings.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-sm text-[#cbd5e1]">
                        {providersWithRatings.length} rated provider{providersWithRatings.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {newProviders.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-[#cbd5e1]">
                        {newProviders.length} new provider{newProviders.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Results sorted by rating, then by newest
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
        </>
      )}
    </div>
  );
}