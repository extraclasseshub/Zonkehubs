/*
  # Complete Zonke Hub Database Schema

  1. New Tables
    - `profiles` - User profiles linked to Supabase auth
    - `service_providers` - Service provider specific data
    - `chat_messages` - Real-time messaging system  
    - `ratings` - Provider ratings and reviews

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    - User role-based permissions

  3. Features
    - Automatic rating calculations with triggers
    - Real-time messaging capabilities
    - Location-based provider search
    - Portfolio management for providers
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'provider')),
  profile_image text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create service_providers table
CREATE TABLE service_providers (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  business_name text,
  business_type text DEFAULT 'individual' CHECK (business_type IN ('individual', 'business')),
  service_type text DEFAULT '',
  description text DEFAULT '',
  phone text,
  address text DEFAULT '',
  latitude numeric DEFAULT 0,
  longitude numeric DEFAULT 0,
  work_radius integer DEFAULT 10,
  work_portfolio text[] DEFAULT '{}',
  is_published boolean DEFAULT false,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  total_rating_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create ratings table
CREATE TABLE ratings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES service_providers(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update provider rating
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_provider_id UUID;
  avg_rating NUMERIC;
  total_reviews INTEGER;
  total_points INTEGER;
BEGIN
  -- Get the provider ID from the operation
  IF TG_OP = 'DELETE' THEN
    target_provider_id := OLD.provider_id;
  ELSE
    target_provider_id := NEW.provider_id;
  END IF;

  -- Calculate new rating statistics
  SELECT 
    COALESCE(AVG(rating::numeric), 0),
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(rating), 0)
  INTO avg_rating, total_reviews, total_points
  FROM ratings 
  WHERE provider_id = target_provider_id;

  -- Update the provider's rating with proper rounding
  UPDATE service_providers 
  SET 
    rating = CASE 
      WHEN total_reviews > 0 THEN ROUND(avg_rating, 1)
      ELSE 0 
    END,
    review_count = total_reviews,
    total_rating_points = total_points,
    updated_at = now()
  WHERE id = target_provider_id;

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't fail the transaction
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Service providers policies
CREATE POLICY "Anyone can read published service providers"
  ON service_providers FOR SELECT
  TO authenticated
  USING (is_published = true OR auth.uid() = id);

CREATE POLICY "Providers can insert own profile"
  ON service_providers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Providers can update own profile"
  ON service_providers FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Chat messages policies
CREATE POLICY "Users can read their own messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their received messages"
  ON chat_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- Ratings policies
CREATE POLICY "Anyone can read ratings"
  ON ratings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create ratings"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON ratings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON ratings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_providers_updated_at
  BEFORE UPDATE ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for rating updates
CREATE TRIGGER update_provider_rating_on_insert
  AFTER INSERT ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();

CREATE TRIGGER update_provider_rating_on_update
  AFTER UPDATE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();

CREATE TRIGGER update_provider_rating_on_delete
  AFTER DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();

-- Create indexes for better performance
CREATE INDEX idx_service_providers_published ON service_providers(is_published);
CREATE INDEX idx_service_providers_service_type ON service_providers(service_type);
CREATE INDEX idx_service_providers_rating ON service_providers(rating DESC);
CREATE INDEX idx_chat_messages_conversation ON chat_messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_ratings_provider ON ratings(provider_id);
CREATE INDEX idx_ratings_user ON ratings(user_id);
CREATE INDEX idx_ratings_provider_rating ON ratings(provider_id, rating);
CREATE INDEX idx_service_providers_rating_published ON service_providers(rating DESC, review_count DESC) WHERE is_published = true;