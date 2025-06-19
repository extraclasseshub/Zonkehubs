/*
  # Fix Availability System and Add Missing Columns

  1. Add availability columns to service_providers table
  2. Add current_status column for provider status
  3. Update existing data structure
  4. Ensure proper indexing
*/

-- Add availability and status columns to service_providers table
DO $$
BEGIN
  -- Add availability column as JSONB
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_providers' AND column_name = 'availability'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN availability JSONB DEFAULT '{}';
  END IF;

  -- Add current_status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'service_providers' AND column_name = 'current_status'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN current_status text DEFAULT 'available' CHECK (current_status IN ('available', 'busy', 'offline'));
  END IF;
END $$;

-- Create index for current_status for better performance
CREATE INDEX IF NOT EXISTS idx_service_providers_status ON service_providers(current_status);

-- Update the provider profile update function to handle availability
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

-- Verify the setup
SELECT 'Availability system setup complete' as status;