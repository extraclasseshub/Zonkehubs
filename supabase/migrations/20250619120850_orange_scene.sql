/*
  # Fix Message Deletion and Rating System

  1. Fix message deletion to properly filter deleted messages
  2. Improve rating system to correctly identify top-rated providers
  3. Add proper conversation management
  4. Ensure data consistency
*/

-- First, let's fix the message deletion system by updating the query logic
-- The issue is that we need to properly filter messages in the application layer

-- Update the rating system to ensure proper calculation and display
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

  -- Calculate new rating statistics with explicit casting
  SELECT 
    COALESCE(ROUND(AVG(rating::numeric), 1), 0),
    COALESCE(COUNT(*)::integer, 0),
    COALESCE(SUM(rating)::integer, 0)
  INTO avg_rating, total_reviews, total_points
  FROM ratings 
  WHERE provider_id = target_provider_id;

  -- Update the provider's rating with explicit values
  UPDATE service_providers 
  SET 
    rating = avg_rating,
    review_count = total_reviews,
    total_rating_points = total_points,
    updated_at = now()
  WHERE id = target_provider_id;

  -- Log the update for debugging
  RAISE NOTICE 'Updated provider % with rating: %, reviews: %, points: %', 
    target_provider_id, avg_rating, total_reviews, total_points;

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    -- Log any errors but don't fail the transaction
    RAISE WARNING 'Error updating provider rating for %: %', target_provider_id, SQLERRM;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate triggers to ensure they work properly
DROP TRIGGER IF EXISTS update_provider_rating_on_insert ON ratings;
DROP TRIGGER IF EXISTS update_provider_rating_on_update ON ratings;
DROP TRIGGER IF EXISTS update_provider_rating_on_delete ON ratings;

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

-- Force recalculation of all provider ratings
DO $$
DECLARE
  provider_record RECORD;
  avg_rating NUMERIC;
  total_reviews INTEGER;
  total_points INTEGER;
BEGIN
  RAISE NOTICE 'Starting comprehensive rating recalculation...';
  
  FOR provider_record IN 
    SELECT DISTINCT id FROM service_providers 
  LOOP
    -- Calculate ratings for this provider with explicit casting
    SELECT 
      COALESCE(ROUND(AVG(rating::numeric), 1), 0),
      COALESCE(COUNT(*)::integer, 0),
      COALESCE(SUM(rating)::integer, 0)
    INTO avg_rating, total_reviews, total_points
    FROM ratings 
    WHERE provider_id = provider_record.id;

    -- Update the provider with explicit values
    UPDATE service_providers 
    SET 
      rating = avg_rating,
      review_count = total_reviews,
      total_rating_points = total_points,
      updated_at = now()
    WHERE id = provider_record.id;

    RAISE NOTICE 'Updated provider % with rating: %, reviews: %, points: %', 
      provider_record.id, avg_rating, total_reviews, total_points;
  END LOOP;
  
  RAISE NOTICE 'Rating recalculation completed successfully';
END $$;

-- Add function to properly clean up deleted messages from queries
CREATE OR REPLACE FUNCTION get_user_messages(user_id UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  content TEXT,
  read BOOLEAN,
  created_at TIMESTAMPTZ,
  message_type TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.read,
    m.created_at,
    m.message_type,
    m.file_url,
    m.file_name,
    m.file_size
  FROM chat_messages m
  WHERE 
    (m.sender_id = user_id OR m.receiver_id = user_id)
    AND m.deleted_for_all = false
    AND (
      (m.sender_id = user_id AND m.deleted_for_sender = false) OR
      (m.receiver_id = user_id AND m.deleted_for_receiver = false)
    )
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get conversation between two users
CREATE OR REPLACE FUNCTION get_conversation_messages(user1_id UUID, user2_id UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  content TEXT,
  read BOOLEAN,
  created_at TIMESTAMPTZ,
  message_type TEXT,
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.read,
    m.created_at,
    m.message_type,
    m.file_url,
    m.file_name,
    m.file_size
  FROM chat_messages m
  WHERE 
    ((m.sender_id = user1_id AND m.receiver_id = user2_id) OR 
     (m.sender_id = user2_id AND m.receiver_id = user1_id))
    AND m.deleted_for_all = false
    AND (
      (m.sender_id = user1_id AND m.deleted_for_sender = false) OR
      (m.receiver_id = user1_id AND m.deleted_for_receiver = false) OR
      (m.sender_id = user2_id AND m.deleted_for_sender = false) OR
      (m.receiver_id = user2_id AND m.deleted_for_receiver = false)
    )
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the rating system is working
DO $$
DECLARE
  total_ratings INTEGER;
  total_providers INTEGER;
  providers_with_ratings INTEGER;
  top_provider RECORD;
BEGIN
  SELECT COUNT(*) INTO total_ratings FROM ratings;
  SELECT COUNT(*) INTO total_providers FROM service_providers;
  SELECT COUNT(*) INTO providers_with_ratings FROM service_providers WHERE rating > 0;
  
  RAISE NOTICE 'System verification after fixes:';
  RAISE NOTICE '- Total ratings in database: %', total_ratings;
  RAISE NOTICE '- Total providers: %', total_providers;
  RAISE NOTICE '- Providers with ratings: %', providers_with_ratings;
  
  -- Get top rated provider
  SELECT id, rating, review_count INTO top_provider
  FROM service_providers 
  WHERE rating > 0 
  ORDER BY rating DESC, review_count DESC 
  LIMIT 1;
  
  IF FOUND THEN
    RAISE NOTICE '- Top rated provider: % (Rating: %, Reviews: %)', 
      top_provider.id, top_provider.rating, top_provider.review_count;
  ELSE
    RAISE NOTICE '- No rated providers found';
  END IF;
END $$;

-- Verify the setup
SELECT 'Message deletion and rating system fixes completed' as status;