/*
  # Fix Rating System and Triggers

  1. Ensure rating triggers work correctly
  2. Fix provider rating calculations
  3. Add proper indexes for performance
  4. Ensure data consistency
*/

-- First, let's make sure the trigger function exists and works correctly
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
    COALESCE(AVG(rating), 0),
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

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_provider_rating_on_insert ON ratings;
DROP TRIGGER IF EXISTS update_provider_rating_on_update ON ratings;
DROP TRIGGER IF EXISTS update_provider_rating_on_delete ON ratings;

-- Create the triggers
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
      COALESCE(AVG(rating), 0),
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

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ratings_provider_rating ON ratings(provider_id, rating);
CREATE INDEX IF NOT EXISTS idx_service_providers_rating_published ON service_providers(rating DESC, review_count DESC) WHERE is_published = true;

-- Verify the setup
SELECT 'Rating system setup complete' as status;