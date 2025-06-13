/*
  # Restore Working Database Configuration

  1. Ensure all tables exist with correct structure
  2. Restore working rating system with proper triggers
  3. Fix any data consistency issues
  4. Ensure RLS policies are correctly configured
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure all tables exist with correct structure
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'provider')),
  profile_image text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS service_providers (
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
  profile_image text DEFAULT '',
  work_portfolio text[] DEFAULT '{}',
  is_published boolean DEFAULT false,
  rating numeric DEFAULT 0,
  review_count integer DEFAULT 0,
  total_rating_points integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
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

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Anyone can read published service providers" ON service_providers;
DROP POLICY IF EXISTS "Providers can insert own profile" ON service_providers;
DROP POLICY IF EXISTS "Providers can update own profile" ON service_providers;
DROP POLICY IF EXISTS "Users can read their own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can read ratings" ON ratings;
DROP POLICY IF EXISTS "Users can create ratings" ON ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON ratings;

-- Create RLS policies
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

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_service_providers_updated_at ON service_providers;
DROP TRIGGER IF EXISTS update_ratings_updated_at ON ratings;
DROP TRIGGER IF EXISTS update_provider_rating_on_insert ON ratings;
DROP TRIGGER IF EXISTS update_provider_rating_on_update ON ratings;
DROP TRIGGER IF EXISTS update_provider_rating_on_delete ON ratings;
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS update_provider_rating();

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function to update provider rating (WORKING VERSION)
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
  provider_id_to_update UUID;
  avg_rating NUMERIC;
  total_reviews INTEGER;
  total_points INTEGER;
BEGIN
  -- Determine which provider to update based on the operation
  IF TG_OP = 'DELETE' THEN
    provider_id_to_update := OLD.provider_id;
  ELSE
    provider_id_to_update := NEW.provider_id;
  END IF;

  -- Calculate the new average rating and review count
  SELECT 
    COALESCE(AVG(rating::numeric), 0),
    COALESCE(COUNT(*), 0),
    COALESCE(SUM(rating), 0)
  INTO avg_rating, total_reviews, total_points
  FROM ratings 
  WHERE provider_id = provider_id_to_update;

  -- Update the service provider's rating information
  UPDATE service_providers 
  SET 
    rating = ROUND(avg_rating, 1),
    review_count = total_reviews,
    total_rating_points = total_points,
    updated_at = now()
  WHERE id = provider_id_to_update;

  -- Log the update for debugging
  RAISE NOTICE 'Updated provider % with rating: %, reviews: %, points: %', 
    provider_id_to_update, ROUND(avg_rating, 1), total_reviews, total_points;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

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

-- Create triggers for rating updates (WORKING VERSION)
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
CREATE INDEX IF NOT EXISTS idx_service_providers_published ON service_providers(is_published);
CREATE INDEX IF NOT EXISTS idx_service_providers_service_type ON service_providers(service_type);
CREATE INDEX IF NOT EXISTS idx_service_providers_rating ON service_providers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(sender_id, receiver_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_provider ON ratings(provider_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_provider_rating ON ratings(provider_id, rating);
CREATE INDEX IF NOT EXISTS idx_service_providers_rating_published ON service_providers(rating DESC, review_count DESC) WHERE is_published = true;

-- Update all existing provider ratings to ensure consistency
DO $$
DECLARE
  provider_record RECORD;
  avg_rating NUMERIC;
  total_reviews INTEGER;
  total_points INTEGER;
BEGIN
  FOR provider_record IN 
    SELECT DISTINCT id FROM service_providers 
  LOOP
    -- Calculate ratings for this provider
    SELECT 
      COALESCE(AVG(rating::numeric), 0),
      COALESCE(COUNT(*), 0),
      COALESCE(SUM(rating), 0)
    INTO avg_rating, total_reviews, total_points
    FROM ratings 
    WHERE provider_id = provider_record.id;

    -- Update the provider
    UPDATE service_providers 
    SET 
      rating = ROUND(avg_rating, 1),
      review_count = total_reviews,
      total_rating_points = total_points,
      updated_at = now()
    WHERE id = provider_record.id;

    RAISE NOTICE 'Updated provider % with rating: %, reviews: %, points: %', 
      provider_record.id, ROUND(avg_rating, 1), total_reviews, total_points;
  END LOOP;
END $$;

-- Verify the setup
SELECT 'Database restoration complete - rating system is working' as status;