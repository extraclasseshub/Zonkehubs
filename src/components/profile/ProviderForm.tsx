import React, { useState } from 'react';
import { ServiceProvider } from '../../types';
import { Loader2, MapPin, Phone, Mail, User, Building, Camera, Upload, X } from 'lucide-react';

interface ProviderFormProps {
  initialData?: Partial<ServiceProvider>;
  onSubmit: (data: Partial<ServiceProvider>) => Promise<void>;
  loading?: boolean;
}

export default function ProviderForm({ initialData, onSubmit, loading }: ProviderFormProps) {
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
  });

  const serviceTypes = [
    'Plumbing', 'Electrical', 'Barbering', 'Cleaning', 'Carpentry',
    'Gardening', 'Painting', 'Auto Repair', 'IT Support', 'Tutoring',
    'Pet Services', 'Catering', 'Photography', 'Fitness Training'
  ];

  const radiusOptions = [5, 10, 15, 20, 25, 30, 50];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'address') {
      setFormData(prev => ({
        ...prev,
        location: { ...prev.location, address: value }
      }));
    } else if (name === 'workRadius') {
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
            <label htmlFor="address" className="block text-sm font-medium text-[#cbd5e1] mb-2">
              Service Location *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="address"
                name="address"
                value={formData.location.address}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:border-[#3db2ff] focus:ring-1 focus:ring-[#3db2ff] focus:outline-none"
                placeholder="Enter your service area or address"
                required
              />
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
      </div>
    </div>
  );
}