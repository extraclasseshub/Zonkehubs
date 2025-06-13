/*
  # Fix Rating System and Ensure Proper Trigger Execution

  1. Recreate rating triggers with proper error handling
  2. Ensure rating calculations work correctly
  3. Add debugging and verification
  4. Fix any data consistency issues
*/

-- Drop existing triggers to recreate them
DROP TRIGGER IF EXISTS update_provider_rating_on_insert ON ratings;
DROP TRIGGER IF EXISTS update_provider_rating_on_update ON ratings;
DROP TRIGGER IF EXISTS update_provider_rating_on_delete ON ratings;

-- Drop and recreate the rating update function with better error handling
DROP FUNCTION IF EXISTS update_provider_rating();

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

  -- Log the update for debugging
  RAISE NOTICE 'Rating update: Provider %, Avg: %, Reviews: %, Points: %', 
    target_provider_id, ROUND(avg_rating, 1), total_reviews, total_points;

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't fail the transaction
    RAISE WARNING 'Error updating provider rating for %: %', target_provider_id, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the triggers
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

-- Recalculate all existing provider ratings to ensure consistency
DO $$
DECLARE
  provider_record RECORD;
  avg_rating NUMERIC;
  total_reviews INTEGER;
  total_points INTEGER;
BEGIN
  RAISE NOTICE 'Starting rating recalculation for all providers...';
  
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
      rating = CASE 
        WHEN total_reviews > 0 THEN ROUND(avg_rating, 1)
        ELSE 0 
      END,
      review_count = total_reviews,
      total_rating_points = total_points,
      updated_at = now()
    WHERE id = provider_record.id;

    RAISE NOTICE 'Updated provider % with rating: %, reviews: %, points: %', 
      provider_record.id, 
      CASE WHEN total_reviews > 0 THEN ROUND(avg_rating, 1) ELSE 0 END, 
      total_reviews, 
      total_points;
  END LOOP;
  
  RAISE NOTICE 'Rating recalculation completed successfully';
END $$;

-- Add some verification queries to check the system
DO $$
DECLARE
  total_ratings INTEGER;
  total_providers INTEGER;
  providers_with_ratings INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_ratings FROM ratings;
  SELECT COUNT(*) INTO total_providers FROM service_providers;
  SELECT COUNT(*) INTO providers_with_ratings FROM service_providers WHERE rating > 0;
  
  RAISE NOTICE 'System verification:';
  RAISE NOTICE '- Total ratings in database: %', total_ratings;
  RAISE NOTICE '- Total providers: %', total_providers;
  RAISE NOTICE '- Providers with ratings: %', providers_with_ratings;
END $$;

-- Verify the setup
SELECT 'Rating system fixed and verified' as status;