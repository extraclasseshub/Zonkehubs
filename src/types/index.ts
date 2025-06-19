export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'provider';
  createdAt: Date;
  profileImage?: string;
}

export interface ServiceProvider extends User {
  businessName?: string;
  businessType: 'individual' | 'business';
  serviceType: string;
  description: string;
  phone?: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  workRadius: number; // in kilometers
  workPortfolio?: string[]; // Array of image URLs
  isPublished: boolean;
  rating?: number;
  reviewCount?: number;
  totalRatingPoints?: number; // Sum of all ratings for average calculation
  availability?: {
    monday: { start: string; end: string; available: boolean };
    tuesday: { start: string; end: string; available: boolean };
    wednesday: { start: string; end: string; available: boolean };
    thursday: { start: string; end: string; available: boolean };
    friday: { start: string; end: string; available: boolean };
    saturday: { start: string; end: string; available: boolean };
    sunday: { start: string; end: string; available: boolean };
  };
  currentStatus?: 'available' | 'busy' | 'offline';
}

export interface Service {
  id: string;
  name: string;
  category: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  messageType?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface Rating {
  id: string;
  userId: string;
  providerId: string;
  rating: number; // 1-5 stars
  review?: string;
  timestamp: Date;
  userName: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email: string) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  updateUserProfile: (data: { name: string; email: string; profileImage: string }) => Promise<boolean>;
  updateProfile: (data: Partial<ServiceProvider>) => Promise<boolean>;
  getPublishedProviders: () => ServiceProvider[];
  getTopRatedProviders: () => ServiceProvider[];
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  getConversation: (userId1: string, userId2: string) => Promise<ChatMessage[]>;
  markMessagesAsRead: (senderId: string, receiverId: string) => Promise<void>;
  getUserById: (id: string) => Promise<User | ServiceProvider | undefined>;
  rateProvider: (providerId: string, rating: number, review?: string) => Promise<boolean>;
  getProviderRatings: (providerId: string) => Promise<Rating[]>;
  getUserRating: (userId: string, providerId: string) => Promise<Rating | undefined>;
  deleteRating: (ratingId: string) => Promise<boolean>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'provider';
}

export interface SearchFilters {
  keyword: string;
  location: string;
  radius: number;
  serviceType?: string;
}