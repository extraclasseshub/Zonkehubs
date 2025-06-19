import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Filter, Loader2, Navigation, X, Target, Check, Globe } from 'lucide-react';
import { SearchFilters } from '../../types';
import { getCurrentLocation, geocodeAddress, LocationCoordinates } from '../../lib/mapbox';
import mapboxgl from 'mapbox-gl';

interface LocationSearchBarProps {
  onSearch: (filters: SearchFilters & { userLocation?: LocationCoordinates }) => void;
  loading?: boolean;
}

export default function LocationSearchBar({ onSearch, loading }: LocationSearchBarProps) {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [radius, setRadius] = useState(25);
  const [showFilters, setShowFilters] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationCoordinates[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [tempMapLocation, setTempMapLocation] = useState<LocationCoordinates | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState<LocationCoordinates[]>([]);
  const [mapSearching, setMapSearching] = useState(false);
  const [showMapSearchResults, setShowMapSearchResults] = useState(false);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const mapSearchInputRef = useRef<HTMLInputElement>(null);
  const mapSearchResultsRef = useRef<HTMLDivElement>(null);

  const radiusOptions = [5, 10, 15, 20, 25, 30, 50];

  // Initialize map when showMap becomes true
  useEffect(() => {
    if (showMap && mapContainer.current && !map.current) {
      const currentLat = userLocation?.lat || 40.7128;
      const currentLng = userLocation?.lng || -74.006;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [currentLng, currentLat],
        zoom: 13
      });

      map.current.addControl(new mapboxgl.NavigationControl());

      // Add click handler to set temporary location
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        setTempMapLocation({ lat, lng });
        addMarker(lat, lng);
      });

      // Set initial marker if location exists
      if (userLocation) {
        addMarker(userLocation.lat, userLocation.lng);
        setTempMapLocation(userLocation);
      }
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [showMap]);

  // Handle clicking outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !locationInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }

      if (
        mapSearchResultsRef.current &&
        !mapSearchResultsRef.current.contains(event.target as Node) &&
        !mapSearchInputRef.current?.contains(event.target as Node)
      ) {
        setShowMapSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get current location on component mount
  useEffect(() => {
    const getInitialLocation = async () => {
      try {
        const currentLocation = await getCurrentLocation();
        setUserLocation(currentLocation);
        if (currentLocation.address) {
          setLocation(currentLocation.address);
        }
      } catch (error) {
        console.log('Could not get initial location:', error);
      }
    };

    getInitialLocation();
  }, []);

  const addMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker
    marker.current = new mapboxgl.Marker({ 
      color: '#3db2ff',
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Add drag end event to update location
    marker.current.on('dragend', () => {
      const lngLat = marker.current?.getLngLat();
      if (lngLat) {
        setTempMapLocation({ lat: lngLat.lat, lng: lngLat.lng });
      }
    });

    // Center map on marker
    map.current.flyTo({ center: [lng, lat], zoom: 15 });
  };

  const handleMapSearch = async () => {
    if (!mapSearchQuery.trim() || mapSearchQuery.length < 3) return;
    
    setMapSearching(true);
    try {
      const results = await geocodeAddress(mapSearchQuery);
      setMapSearchResults(results.slice(0, 5));
      setShowMapSearchResults(true);
    } catch (error) {
      console.error('Map search error:', error);
    } finally {
      setMapSearching(false);
    }
  };

  const handleMapSearchResultClick = (result: LocationCoordinates) => {
    if (!map.current) return;
    
    setTempMapLocation(result);
    addMarker(result.lat, result.lng);
    setShowMapSearchResults(false);
    setMapSearchQuery('');
  };

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    setLocationError('');

    try {
      const currentLocation = await getCurrentLocation();
      setUserLocation(currentLocation);
      setLocation(currentLocation.address || `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`);
      setShowSuggestions(false);
      
      if (map.current) {
        addMarker(currentLocation.lat, currentLocation.lng);
        setTempMapLocation(currentLocation);
      }
    } catch (error) {
      setLocationError(error instanceof Error ? error.message : 'Failed to get location');
    } finally {
      setGettingLocation(false);
    }
  };

  const handleLocationSearch = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const suggestions = await geocodeAddress(query);
      setLocationSuggestions(suggestions.slice(0, 5));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Location search error:', error);
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocation(value);
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      handleLocationSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSuggestionClick = (suggestion: LocationCoordinates) => {
    setLocation(suggestion.address || `${suggestion.lat.toFixed(4)}, ${suggestion.lng.toFixed(4)}`);
    setUserLocation(suggestion);
    setShowSuggestions(false);
    
    if (map.current) {
      addMarker(suggestion.lat, suggestion.lng);
      setTempMapLocation(suggestion);
    }
  };

  const handleMapSelect = async () => {
    if (!tempMapLocation) return;

    try {
      // Reverse geocode the temporary location
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${tempMapLocation.lng},${tempMapLocation.lat}.json?access_token=pk.eyJ1IjoieGFubmlldGVjaHMiLCJhIjoiY21id2RhYmRxMHlhbzJtczAzMmh5a2xjYiJ9.98IDz3AA1B8oEFsH0g2A0Q&types=place,locality,neighborhood,address`
      );
      const data = await response.json();
      
      const address = data.features?.[0]?.place_name || `${tempMapLocation.lat.toFixed(4)}, ${tempMapLocation.lng.toFixed(4)}`;
      
      const newLocation = { 
        address, 
        lat: tempMapLocation.lat, 
        lng: tempMapLocation.lng 
      };
      
      setLocation(address);
      setUserLocation(newLocation);
      setShowMap(false);
      setTempMapLocation(null);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      const address = `${tempMapLocation.lat.toFixed(4)}, ${tempMapLocation.lng.toFixed(4)}`;
      const newLocation = { 
        address, 
        lat: tempMapLocation.lat, 
        lng: tempMapLocation.lng 
      };
      setLocation(address);
      setUserLocation(newLocation);
      setShowMap(false);
      setTempMapLocation(null);
    }
  };

  const handleMapCancel = () => {
    setShowMap(false);
    setTempMapLocation(null);
    
    // Reset marker to original location if it exists
    if (userLocation && map.current) {
      addMarker(userLocation.lat, userLocation.lng);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    onSearch({ 
      keyword, 
      location, 
      radius,
      userLocation: userLocation || undefined
    });
  };

  const clearLocation = () => {
    setLocation('');
    setUserLocation(null);
    setTempMapLocation(null);
    setShowSuggestions(false);
    setLocationError('');
    if (marker.current) {
      marker.current.remove();
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Keyword Search */}
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-[#cbd5e1] mb-2">
              What service do you need?
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., plumber, barber, electrician"
              />
            </div>
          </div>

          {/* Location Search */}
          <div className="relative">
            <label htmlFor="location" className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <input
                ref={locationInputRef}
                type="text"
                id="location"
                value={location}
                onChange={handleLocationChange}
                onFocus={() => location.length >= 3 && setShowSuggestions(true)}
                disabled={loading || gettingLocation}
                className="w-full pl-10 pr-24 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter location or use current"
              />
              
              {/* Location Actions */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                {location && (
                  <button
                    type="button"
                    onClick={clearLocation}
                    disabled={loading || gettingLocation}
                    className="p-1 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    title="Clear location"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={loading || gettingLocation}
                  className="p-1 text-[#3db2ff] hover:text-blue-400 transition-colors disabled:opacity-50"
                  title="Use current location"
                >
                  {gettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Target className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowMap(!showMap)}
                  disabled={loading}
                  className="p-1 text-[#00c9a7] hover:text-teal-400 transition-colors disabled:opacity-50"
                  title="Use map to select location"
                >
                  <Navigation className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Location Suggestions */}
            {showSuggestions && locationSuggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto"
              >
                {locationSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-600 transition-colors border-b border-slate-600 last:border-b-0"
                  >
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-[#3db2ff] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{suggestion.address}</p>
                        <p className="text-gray-400 text-xs">
                          {suggestion.lat.toFixed(4)}, {suggestion.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Location Error */}
            {locationError && (
              <p className="text-red-400 text-xs mt-1">{locationError}</p>
            )}

            {/* Current Location Indicator */}
            {userLocation && (
              <div className="flex items-center space-x-2 mt-2">
                <Navigation className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">Using your location</span>
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        {showMap && (
          <div className="border border-slate-600 rounded-lg overflow-hidden">
            <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#cbd5e1] font-medium">Select Location on Map</p>
                  <p className="text-xs text-gray-400">Click anywhere on the map to set your search location</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleMapCancel}
                    className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-slate-600"
                    title="Cancel map selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {tempMapLocation && (
                <div className="mt-2 text-xs text-green-400">
                  Selected: {tempMapLocation.lat.toFixed(4)}, {tempMapLocation.lng.toFixed(4)}
                </div>
              )}
            </div>
            
            {/* Map Search Bar */}
            <div className="bg-slate-800 p-3 border-b border-slate-600">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    ref={mapSearchInputRef}
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => setMapSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleMapSearch())}
                    placeholder="Search for a location on the map"
                    className="w-full pl-9 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none text-sm"
                  />
                  {mapSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setMapSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleMapSearch}
                  disabled={mapSearching || mapSearchQuery.length < 3}
                  className="bg-[#3db2ff] hover:bg-blue-500 disabled:bg-gray-600 text-white px-3 py-2 rounded-md transition-colors flex items-center space-x-1"
                >
                  {mapSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span>Search</span>
                </button>
              </div>
              
              {/* Map Search Results */}
              {showMapSearchResults && mapSearchResults.length > 0 && (
                <div
                  ref={mapSearchResultsRef}
                  className="mt-2 bg-slate-700 border border-slate-600 rounded-md shadow-lg max-h-40 overflow-y-auto"
                >
                  {mapSearchResults.map((result, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleMapSearchResultClick(result)}
                      className="w-full text-left px-3 py-2 hover:bg-slate-600 transition-colors border-b border-slate-600 last:border-b-0"
                    >
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-[#3db2ff] mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm truncate">{result.address}</p>
                          <p className="text-gray-400 text-xs">
                            {result.lat.toFixed(4)}, {result.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div ref={mapContainer} className="h-64 w-full" />
            
            {/* Map Instructions and Select Button */}
            <div className="bg-slate-800 p-3 border-t border-slate-600">
              {/* Select Button */}
              {tempMapLocation && (
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={handleMapSelect}
                    className="w-full bg-[#00c9a7] hover:bg-teal-500 text-white px-4 py-3 rounded-md font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <Check className="h-5 w-5" />
                    <span>Select This Location</span>
                  </button>
                </div>
              )}
              
              {/* Instructions */}
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-4 h-4 rounded-full bg-[#3db2ff] flex items-center justify-center">
                    <span className="text-white text-[10px]">i</span>
                  </div>
                </div>
                <div className="text-xs text-[#cbd5e1]">
                  <p>• Click anywhere on the map to place a pin</p>
                  <p>• Drag the pin to adjust the exact location</p>
                  <p>• Use the search box to find specific places</p>
                  <p>• Click the green button below when done</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Toggle */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            disabled={loading}
            className="flex items-center space-x-2 text-[#cbd5e1] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Filter className="h-4 w-4" />
            <span>Search Radius</span>
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="bg-[#3db2ff] hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-md transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                <span>Search</span>
              </>
            )}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="border-t border-slate-600 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Search Radius
                </label>
                <select
                  id="radius"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {radiusOptions.map(r => (
                    <option key={r} value={r}>
                      {r}km {r <= 10 ? '(Local)' : r <= 25 ? '(City)' : '(Regional)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}