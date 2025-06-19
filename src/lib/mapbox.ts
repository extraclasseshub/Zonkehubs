import mapboxgl from 'mapbox-gl';

// Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoieGFubmlldGVjaHMiLCJhIjoiY21id2RhYmRxMHlhbzJtczAzMmh5a2xjYiJ9.98IDz3AA1B8oEFsH0g2A0Q';

// Set the access token
mapboxgl.accessToken = MAPBOX_TOKEN;

export interface LocationCoordinates {
  lat: number;
  lng: number;
  address?: string;
}

export interface GeocodeResult {
  place_name: string;
  center: [number, number]; // [lng, lat]
  bbox?: [number, number, number, number];
}

// Get user's current location
export const getCurrentLocation = (): Promise<LocationCoordinates> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        try {
          // Reverse geocode to get address
          const address = await reverseGeocode(coords.lat, coords.lng);
          resolve({
            ...coords,
            address,
          });
        } catch (error) {
          // Return coordinates even if reverse geocoding fails
          resolve(coords);
        }
      },
      (error) => {
        let message = 'Unable to retrieve your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

// Geocode an address to coordinates
export const geocodeAddress = async (address: string): Promise<LocationCoordinates[]> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=5&types=place,locality,neighborhood,address`
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    return data.features.map((feature: GeocodeResult) => ({
      lat: feature.center[1],
      lng: feature.center[0],
      address: feature.place_name,
    }));
  } catch (error) {
    console.error('Geocoding error:', error);
    throw new Error('Failed to geocode address');
  }
};

// Reverse geocode coordinates to address
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=place,locality,neighborhood,address`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }

    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
    
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

// Calculate distance between two points using Haversine formula
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Filter providers by location and radius
export const filterProvidersByLocation = (
  providers: any[],
  userLocation: LocationCoordinates,
  radiusKm: number
): any[] => {
  return providers.filter(provider => {
    if (!provider.location?.lat || !provider.location?.lng) {
      return false;
    }

    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      provider.location.lat,
      provider.location.lng
    );

    return distance <= radiusKm;
  }).map(provider => ({
    ...provider,
    distance: calculateDistance(
      userLocation.lat,
      userLocation.lng,
      provider.location.lat,
      provider.location.lng
    ),
  })).sort((a, b) => a.distance - b.distance); // Sort by distance
};

export { mapboxgl };