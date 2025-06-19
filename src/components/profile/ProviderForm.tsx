import React, { useState, useRef, useEffect } from 'react';
import { ServiceProvider } from '../../types';
import { Loader2, MapPin, Phone, Mail, User, Building, Camera, Upload, X, Navigation, Target, Globe, Users, Award, Plus, Trash2, Check, Search } from 'lucide-react';
import { getCurrentLocation, geocodeAddress, LocationCoordinates } from '../../lib/mapbox';
import ProviderAvailability from './ProviderAvailability';
import mapboxgl from 'mapbox-gl';

interface ProviderFormProps {
  initialData?: Partial<ServiceProvider>;
  onSubmit: (data: Partial<ServiceProvider>) => Promise<void>;
  loading?: boolean;
}

export default function ProviderForm({ initialData, onSubmit, loading }: ProviderFormProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'details' | 'availability'>('basic');
  const [formData, setFormData] = useState({
    businessName: initialData?.businessName || '',
    businessType: initialData?.businessType || 'individual',
    serviceType: initialData?.serviceType || '',
    description: initialData?.description || '',
    phone: initialData?.phone || '',
    website: initialData?.website || '',
    socialMedia: initialData?.socialMedia || {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
      tiktok: '',
      whatsapp: '',
    },
    specialties: initialData?.specialties || [],
    yearsExperience: initialData?.yearsExperience || 0,
    certifications: initialData?.certifications || [],
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
  const [newSpecialty, setNewSpecialty] = useState('');
  const [newCertification, setNewCertification] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [tempMapLocation, setTempMapLocation] = useState<LocationCoordinates | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState<LocationCoordinates[]>([]);
  const [mapSearching, setMapSearching] = useState(false);
  const [showMapSearchResults, setShowMapSearchResults] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const mapSearchInputRef = useRef<HTMLInputElement>(null);
  const mapSearchResultsRef = useRef<HTMLDivElement>(null);

  const serviceTypes = [
    'Plumbing', 'Electrical', 'Barbering', 'Cleaning', 'Carpentry',
    'Gardening', 'Painting', 'Auto Repair', 'IT Support', 'Tutoring',
    'Pet Services', 'Catering', 'Photography', 'Fitness Training'
  ];

  const radiusOptions = [5, 10, 15, 20, 25, 30, 50];

  const socialPlatforms = [
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/yourpage' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourusername' },
    { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/yourusername' },
    { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourprofile' },
    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/c/yourchannel' },
    { key: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@yourusername' },
    { key: 'whatsapp', label: 'WhatsApp', placeholder: '+1234567890 or WhatsApp Business link' },
  ];

  // Initialize map when showMap becomes true
  useEffect(() => {
    if (showMap && mapContainer.current && !map.current) {
      const currentLat = formData.location.lat || 40.7128;
      const currentLng = formData.location.lng || -74.006;
      
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
      if (formData.location.lat && formData.location.lng) {
        addMarker(formData.location.lat, formData.location.lng);
        setTempMapLocation({ lat: formData.location.lat, lng: formData.location.lng });
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
        setTempMapLocation(currentLocation);
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
      setTempMapLocation(suggestion);
    }
    
    setShowSuggestions(false);
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
      
      setFormData(prev => ({
        ...prev,
        location: {
          address,
          lat: tempMapLocation.lat,
          lng: tempMapLocation.lng,
        }
      }));
      
      setShowMap(false);
      setTempMapLocation(null);
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      const address = `${tempMapLocation.lat.toFixed(4)}, ${tempMapLocation.lng.toFixed(4)}`;
      setFormData(prev => ({
        ...prev,
        location: {
          address,
          lat: tempMapLocation.lat,
          lng: tempMapLocation.lng,
        }
      }));
      setShowMap(false);
      setTempMapLocation(null);
    }
  };

  const handleMapCancel = () => {
    setShowMap(false);
    setTempMapLocation(null);
    
    // Reset marker to original location if it exists
    if (formData.location.lat && formData.location.lng && map.current) {
      addMarker(formData.location.lat, formData.location.lng);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'workRadius' || name === 'yearsExperience') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleAddSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      setFormData(prev => ({
        ...prev,
        specialties: [...prev.specialties, newSpecialty.trim()]
      }));
      setNewSpecialty('');
    }
  };

  const handleRemoveSpecialty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.filter((_, i) => i !== index)
    }));
  };

  const handleAddCertification = () => {
    if (newCertification.trim() && !formData.certifications.includes(newCertification.trim())) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, newCertification.trim()]
      }));
      setNewCertification('');
    }
  };

  const handleRemoveCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
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
    console.log('📅 Availability data received in form:', availability);
    setFormData(prev => ({
      ...prev,
      availability
    }));
    
    // Auto-save availability when it's updated
    try {
      setSubmitError(null);
      const submissionData = {
        ...formData,
        availability,
        socialMedia: Object.fromEntries(
          Object.entries(formData.socialMedia).filter(([_, value]) => value && value.trim() !== '')
        ),
        specialties: formData.specialties.filter(s => s.trim() !== ''),
        certifications: formData.certifications.filter(c => c.trim() !== ''),
      };
      
      console.log('💾 Auto-saving availability with form data:', submissionData);
      await onSubmit(submissionData);
      
      console.log('✅ Availability auto-saved successfully');
    } catch (error) {
      console.error('❌ Error auto-saving availability:', error);
      setSubmitError('Failed to save availability. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      // Clean up social media data - remove empty fields
      const cleanedSocialMedia = Object.fromEntries(
        Object.entries(formData.socialMedia).filter(([_, value]) => value && value.trim() !== '')
      );
      
      const submissionData = {
        ...formData,
        socialMedia: cleanedSocialMedia,
        specialties: formData.specialties.filter(s => s.trim() !== ''),
        certifications: formData.certifications.filter(c => c.trim() !== ''),
      };
      
      console.log('📝 Submitting form data:', submissionData);
      await onSubmit(submissionData);
      
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Form submission error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save profile. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          {initialData?.serviceType ? 'Edit Profile' : 'Complete Your Profile'}
        </h2>

        {/* Success/Error Messages */}
        {submitSuccess && (
          <div className="mb-6 flex items-center space-x-2 text-green-400 text-sm bg-green-900/20 border border-green-600 rounded-md p-3">
            <Upload className="h-4 w-4 flex-shrink-0" />
            <span>Profile saved successfully!</span>
          </div>
        )}

        {submitError && (
          <div className="mb-6 flex items-center space-x-2 text-red-400 text-sm bg-red-900/20 border border-red-600 rounded-md p-3">
            <X className="h-4 w-4 flex-shrink-0" />
            <span>{submitError}</span>
          </div>
        )}

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
                onClick={() => setActiveTab('details')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'details'
                    ? 'border-[#3db2ff] text-[#3db2ff]'
                    : 'border-transparent text-[#cbd5e1] hover:text-white hover:border-slate-500'
                }`}
              >
                Additional Details
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

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

              {/* Website */}
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                  Website
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                    placeholder="https://yourwebsite.com"
                  />
                </div>
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
                    <div className="bg-slate-700 px-4 py-3 border-b border-slate-600">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-[#cbd5e1] font-medium">Select Location on Map</p>
                          <p className="text-xs text-gray-400">Click anywhere on the map to set your location</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {tempMapLocation && (
                            <button
                              type="button"
                              onClick={handleMapSelect}
                              className="bg-[#00c9a7] hover:bg-teal-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
                            >
                              <Check className="h-4 w-4" />
                              <span>Select This Location</span>
                            </button>
                          )}
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
                    
                    {/* Map Instructions */}
                    <div className="bg-slate-800 p-3 border-t border-slate-600 text-xs text-[#cbd5e1]">
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-4 h-4 rounded-full bg-[#3db2ff] flex items-center justify-center">
                            <span className="text-white text-[10px]">i</span>
                          </div>
                        </div>
                        <div>
                          <p>• Click anywhere on the map to place a pin</p>
                          <p>• Drag the pin to adjust the exact location</p>
                          <p>• Use the search box to find specific places</p>
                          <p>• Click "Select This Location" when done</p>
                        </div>
                      </div>
                    </div>
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
                disabled={submitting || loading}
                className="flex-1 bg-[#00c9a7] hover:bg-teal-500 disabled:bg-gray-600 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                {submitting || loading ? (
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
        ) : activeTab === 'details' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Social Media Links */}
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-3">
                Social Media & Contact Links
              </label>
              <div className="space-y-4">
                {socialPlatforms.map(platform => (
                  <div key={platform.key}>
                    <label className="block text-xs font-medium text-[#cbd5e1] mb-1">
                      {platform.label}
                    </label>
                    <input
                      type="text"
                      value={formData.socialMedia[platform.key as keyof typeof formData.socialMedia] || ''}
                      onChange={(e) => handleSocialMediaChange(platform.key, e.target.value)}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                      placeholder={platform.placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Years of Experience */}
            <div>
              <label htmlFor="yearsExperience" className="block text-sm font-medium text-[#cbd5e1] mb-2">
                Years of Experience
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="yearsExperience"
                  name="yearsExperience"
                  value={formData.yearsExperience}
                  onChange={handleInputChange}
                  min="0"
                  max="50"
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Specialties */}
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-3">
                Specialties
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSpecialty())}
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                    placeholder="e.g., House wiring, Commercial electrical, Solar installation"
                  />
                  <button
                    type="button"
                    onClick={handleAddSpecialty}
                    disabled={!newSpecialty.trim()}
                    className="bg-[#3db2ff] hover:bg-blue-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {formData.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.specialties.map((specialty, index) => (
                      <div key={index} className="bg-[#3db2ff] text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                        <span>{specialty}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpecialty(index)}
                          className="hover:text-red-200 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-sm font-medium text-[#cbd5e1] mb-3">
                Certifications & Qualifications
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCertification}
                    onChange={(e) => setNewCertification(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertification())}
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                    placeholder="e.g., Licensed Electrician, OSHA Certified, Master Plumber"
                  />
                  <button
                    type="button"
                    onClick={handleAddCertification}
                    disabled={!newCertification.trim()}
                    className="bg-[#00c9a7] hover:bg-teal-500 disabled:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                
                {formData.certifications.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.certifications.map((certification, index) => (
                      <div key={index} className="bg-[#00c9a7] text-white px-3 py-1 rounded-full text-sm flex items-center space-x-2">
                        <span>{certification}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCertification(index)}
                          className="hover:text-red-200 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={submitting || loading}
                className="flex-1 bg-[#00c9a7] hover:bg-teal-500 disabled:bg-gray-600 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                {submitting || loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Details'
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <ProviderAvailability
              initialAvailability={formData.availability}
              onSave={handleAvailabilitySave}
              loading={submitting || loading}
            />
            
            <div className="flex space-x-4 pt-4">
              <button
                onClick={() => onSubmit(formData)}
                disabled={submitting || loading}
                className="flex-1 bg-[#00c9a7] hover:bg-teal-500 disabled:bg-gray-600 text-white py-3 px-4 rounded-md transition-colors flex items-center justify-center"
              >
                {submitting || loading ? (
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