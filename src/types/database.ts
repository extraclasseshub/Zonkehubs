export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'user' | 'provider';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role: 'user' | 'provider';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'user' | 'provider';
          created_at?: string;
          updated_at?: string;
        };
      };
      service_providers: {
        Row: {
          id: string;
          business_name: string | null;
          business_type: 'individual' | 'business';
          service_type: string;
          description: string;
          phone: string | null;
          address: string;
          latitude: number;
          longitude: number;
          work_radius: number;
          profile_image: string;
          work_portfolio: string[];
          is_published: boolean;
          rating: number;
          review_count: number;
          total_rating_points: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          business_name?: string | null;
          business_type?: 'individual' | 'business';
          service_type?: string;
          description?: string;
          phone?: string | null;
          address?: string;
          latitude?: number;
          longitude?: number;
          work_radius?: number;
          profile_image?: string;
          work_portfolio?: string[];
          is_published?: boolean;
          rating?: number;
          review_count?: number;
          total_rating_points?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          business_name?: string | null;
          business_type?: 'individual' | 'business';
          service_type?: string;
          description?: string;
          phone?: string | null;
          address?: string;
          latitude?: number;
          longitude?: number;
          work_radius?: number;
          profile_image?: string;
          work_portfolio?: string[];
          is_published?: boolean;
          rating?: number;
          review_count?: number;
          total_rating_points?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          sender_id: string;
          receiver_id: string;
          content: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          sender_id?: string;
          receiver_id?: string;
          content?: string;
          read?: boolean;
          created_at?: string;
        };
      };
      ratings: {
        Row: {
          id: string;
          user_id: string;
          provider_id: string;
          rating: number;
          review: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider_id: string;
          rating: number;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider_id?: string;
          rating?: number;
          review?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}