import React, { useState, useRef, useEffect } from 'react';
import { ServiceProvider } from '../../types';
import { Loader2, MapPin, Phone, Mail, User, Building, Camera, Upload, X, Navigation, Target } from 'lucide-react';
import { getCurrentLocation, geocodeAddress, LocationCoordinates } from '../../lib/mapbox';
import ProviderAvailability from './ProviderAvailability';
import mapboxgl from 'mapbox-gl';

interface ProviderFormProps {
  initialData?: Partial<ServiceProvider>;
  onSubmit: (data: Partial<ServiceProvider>) => Promise<void>;
  loading?: boolean;
}

export default function ProviderForm({ initialData, onSubmit, loading }: ProviderFormProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'availability'>('basic');
  const [formData, setFormData] = useState({
    businessName: initialData?.businessName || '',
    businessType: initialData?.businessType || 'individual',
    serviceType: initialData?.serviceType || '',
    description: initialData?.description || '',
    phone: initialData?.phone || '',
    location: {
      address: initialData?.location?.address || '',
      lat: initialData?.location?.lat || 0,
      lng: initialData?.location?.lng || 0,
    },
    workRadius: initialData?.workRadius || 10,
    profileImage: initialData?.profileImage || '',
    workPortfolio: initialData?.workPortfolio || [],
    availability: initialData?.availability || undefined,
    currentStatus: initialData?.currentStatus || 'available',
  });

  const [showMap, setShowMap] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationCoordinates[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const serviceTypes = [
    'Plumbing', 'Electrical', 'Barbering', 'Cleaning', 'Carpentry',
    'Gardening', 'Painting', 'Auto Repair', 'IT Support', 'Tutoring',
    'Pet Services', 'Catering', 'Photography', 'Fitness Training'
  ];

  const radiusOptions = [5, 10, 15, 20, 25, 30, 50];

  // Initialize map when showMap becomes true
  useEffect(() => {
    if (showMap && mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [formData.location.lng || -74.006, formData.location.lat || 40.7128], // Default to NYC
        zoom: 13
      });

      map.current.addControl(new mapboxgl.NavigationControl());

      // Add click handler to set location
      map.current.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        updateLocationFromCoords(lat, lng);
      });

      // Set initial marker if location exists
      if (formData.location.lat && formData.location.lng) {
        addMarker(formData.location.lat, formData.location.lng);
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker
    marker.current = new mapboxgl.Marker({ color: '#3db2ff' })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Center map on marker
    map.current.flyTo({ center: [lng, lat], zoom: 15 });
  };

  const updateLocationFromCoords = async (lat: number, lng: number) => {
    try {
      // Reverse geocode to get address
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=pk.eyJ1IjoieGFubmlldGVjaHMiLCJhIjoiY21id2RhYmRxMHlhbzJtczAzMmh5a2xjYiJ9.98IDz3AA1B8oEFsH0g2A0Q&types=place,locality,neighborhood,address`
      );
      const data = await response.json();
      
      const address = data.features?.[0]?.place_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      
      setFormData(prev => ({
        ...prev,
        location: { address, lat, lng }
      }));

      // Auto-hide map after location selection
      setShowMap(false);

      addMarker(lat, lng);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      setFormData(prev => ({
        ...prev,
        location: { 
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, 
          lat, 
          lng 
        }
      }));
      
      // Auto-hide map after location selection
      setShowMap(false);
      
      addMarker(lat, lng);
    }
  };

  const handleGetCurrentLocation = async () => {
    setGettingLocation(true);
    try {
      const currentLocation = await getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        location: {
          address: currentLocation.address || `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}`,
          lat: currentLocation.lat,
          lng: currentLocation.lng,
        }
      }));
      
      if (map.current) {
        addMarker(currentLocation.lat, currentLocation.lng);
      }
      
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error getting current location:', error);
      alert('Could not get your current location. Please enter your address manually or use the map.');
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
    setFormData(prev => ({
      ...prev,
      location: { ...prev.location, address: value }
    }));
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      handleLocationSearch(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSuggestionClick = (suggestion: LocationCoordinates) => {
    setFormData(prev => ({
      ...prev,
      location: {
        address: suggestion.address || `${suggestion.lat.toFixed(4)}, ${suggestion.lng.toFixed(4)}`,
        lat: suggestion.lat,
        lng: suggestion.lng,
      }
    }));
    
    if (map.current) {
      addMarker(suggestion.lat, suggestion.lng);
    }
    
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'workRadius') {
      setFormData(prev => ({
        ...prev,
        workRadius: parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          profileImage: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          workPortfolio: [...(prev.workPortfolio || []), event.target?.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePortfolioImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      workPortfolio: prev.workPortfolio?.filter((_, i) => i !== index) || []
    }));
  };

  const handleAvailabilitySave = async (availability: any) => {
    setFormData(prev => ({
      ...prev,
      availability
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          {initialData?.serviceType ? 'Edit Profile' : 'Complete Your Profile'}
        </h2>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-slate-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('basic')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'basic'
                    ? 'border-[#3db2ff] text-[#3db2ff]'
                    : 'border-transparent text-[#cbd5e1] hover:text-white hover:border-slate-500'
                }`}
              >
                Basic Information
              </button>
              <button
                onClick={() => setActiveTab('availability')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'availability'
                    ? 'border-[#3db2ff] text-[#3db2ff]'
                    : 'border-transparent text-[#cbd5e1] hover:text-white hover:border-slate-500'
                }`}
              >
                Availability & Status
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'basic' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Image */}
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-3">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {formData.profileImage ? (
                    <img
                      src={formData.profileImage}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#3db2ff]"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                      <Camera className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-[#3db2ff] rounded-full p-2 cursor-pointer hover:bg-blue-500 transition-colors">
                    <Camera className="h-4 w-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <p className="text-sm text-[#cbd5e1]">Upload a professional profile picture</p>
                  <p className="text-xs text-gray-400">JPG, PNG or GIF (max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-3">
                Current Status
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'available', label: 'Available', color: 'bg-[#00c9a7]' },
                  { value: 'busy', label: 'Busy', color: 'bg-[#f59e0b]' },
                  { value: 'offline', label: 'Offline', color: 'bg-gray-500' }
                ].map(status => (
                  <label key={status.value} className={`cursor-pointer rounded-md p-3 border-2 transition-colors ${
                    formData.currentStatus === status.value 
                      ? `border-white ${status.color}/20` 
                      : 'border-slate-600 hover:border-slate-500'
                  }`}>
                    <input
                      type="radio"
                      name="currentStatus"
                      value={status.value}
                      checked={formData.currentStatus === status.value}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                      <div className="text-white font-medium">{status.label}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-3">
                Business Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`cursor-pointer rounded-md p-3 border-2 transition-colors ${
                  formData.businessType === 'individual' 
                    ? 'border-[#3db2ff] bg-[#3db2ff]/10' 
                    : 'border-slate-600 hover:border-slate-500'
                }`}>
                  <input
                    type="radio"
                    name="businessType"
                    value="individual"
                    checked={formData.businessType === 'individual'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-[#3db2ff]" />
                    <div>
                      <div className="text-white font-medium">Individual</div>
                      <div className="text-xs text-[#cbd5e1]">Solo provider</div>
                    </div>
                  </div>
                </label>

                <label className={`cursor-pointer rounded-md p-3 border-2 transition-colors ${
                  formData.businessType === 'business' 
                    ? 'border-[#00c9a7] bg-[#00c9a7]/10' 
                    : 'border-slate-600 hover:border-slate-500'
                }`}>
                  <input
                    type="radio"
                    name="businessType"
                    value="business"
                    checked={formData.businessType === 'business'}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-2">
                    <Building className="h-5 w-5 text-[#00c9a7]" />
                    <div>
                      <div className="text-white font-medium">Business</div>
                      <div className="text-xs text-[#cbd5e1]">Company/Team</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                {formData.businessType === 'business' ? 'Business Name' : 'Display Name'}
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                placeholder={formData.businessType === 'business' ? 'Your business name' : 'How you want to be known'}
              />
            </div>

            {/* Service Type */}
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Service Type *
              </label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                required
              >
                <option value="">Select a service type</option>
                {serviceTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Service Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                placeholder="Describe your services, experience, and what makes you special..."
                required
              />
            </div>

            {/* Work Portfolio */}
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-3">
                Work Portfolio
              </label>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-[#cbd5e1] mb-2">Upload photos of your work</p>
                  <p className="text-xs text-gray-400 mb-4">Show potential clients examples of your quality work</p>
                  <label className="bg-[#3db2ff] hover:bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer transition-colors">
                    Choose Images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePortfolioUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Portfolio Images Grid */}
                {formData.workPortfolio && formData.workPortfolio.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.workPortfolio.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Work ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removePortfolioImage(index)}
                          className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                  placeholder="+1-555-0123"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Service Location *
              </label>
              
              <div className="space-y-4">
                {/* Address Input */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <input
                    ref={locationInputRef}
                    type="text"
                    value={formData.location.address}
                    onChange={handleLocationChange}
                    onFocus={() => formData.location.address.length >= 3 && setShowSuggestions(true)}
                    className="w-full pl-10 pr-20 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                    placeholder="Enter your service area or address"
                    required
                  />
                  
                  {/* Location Actions */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={handleGetCurrentLocation}
                      disabled={gettingLocation}
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
                      className="p-1 text-[#00c9a7] hover:text-teal-400 transition-colors"
                      title="Use map to select location"
                    >
                      <Navigation className="h-4 w-4" />
                    </button>
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
                </div>

                {/* Map */}
                {showMap && (
                  <div className="border border-slate-600 rounded-lg overflow-hidden">
                    <div className="bg-slate-700 px-4 py-2 border-b border-slate-600">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[#cbd5e1]">Click on the map to set your location</p>
                        <button
                          type="button"
                          onClick={() => setShowMap(false)}
                          className="text-gray-400 hover:text-white transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div ref={mapContainer} className="h-64 w-full" />
                  </div>
                )}

                {/* Current Location Display */}
                {formData.location.lat && formData.location.lng && (
                  <div className="bg-slate-700 rounded-lg p-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">Location set:</span>
                      <span className="text-[#cbd5e1]">
                        {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Work Radius */}
            <div>
              <label htmlFor="workRadius" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Service Radius (km)
              </label>
              <select
                id="workRadius"
                name="workRadius"
                value={formData.workRadius}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
              >
                {radiusOptions.map(radius => (
                  <option key={radius} value={radius}>
                    {radius}km {radius >= 30 ? '(Wide area)' : radius >= 20 ? '(Large area)' : '(Local area)'}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#00c9a7] hover:bg-teal-500 disabled:bg-gray-600 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <ProviderAvailability
              initialAvailability={formData.availability}
              onSave={handleAvailabilitySave}
              loading={loading}
            />
            
            <div className="flex space-x-4 pt-4">
              <button
                onClick={() => onSubmit(formData)}
                disabled={loading}
                className="flex-1 bg-[#00c9a7] hover:bg-teal-500 disabled:bg-gray-600 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save All Changes'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}