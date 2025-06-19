/*
  # Add availability and current_status columns to service_providers

  1. New Columns
    - `availability` (jsonb) - Weekly availability schedule with days of week
    - `current_status` (text) - Current provider status: available, busy, or offline

  2. Indexes
    - GIN index on availability for efficient JSON queries
    - B-tree index on current_status for filtering

  3. Validation
    - Check constraint for current_status values
    - Function to validate availability JSON structure
    - Trigger to validate availability data before updates

  4. Security
    - Updated RLS policies to allow availability updates
    - Proper permissions for validation functions
*/

-- Ensure availability column exists with proper type
DO $$
BEGIN
  -- Check if availability column exists and has correct type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' 
    AND column_name = 'availability' 
    AND data_type = 'jsonb'
  ) THEN
    -- Add or modify availability column
    ALTER TABLE service_providers 
    ADD COLUMN IF NOT EXISTS availability jsonb DEFAULT '{}'::jsonb;
    
    -- If column exists but wrong type, change it
    ALTER TABLE service_providers 
    ALTER COLUMN availability TYPE jsonb USING availability::jsonb;
  END IF;
END $$;

-- Ensure current_status column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' 
    AND column_name = 'current_status'
  ) THEN
    ALTER TABLE service_providers 
    ADD COLUMN current_status text DEFAULT 'available'::text;
  END IF;
END $$;

-- Add constraint for current_status if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_providers_current_status_check'
  ) THEN
    ALTER TABLE service_providers 
    ADD CONSTRAINT service_providers_current_status_check 
    CHECK (current_status = ANY (ARRAY['available'::text, 'busy'::text, 'offline'::text]));
  END IF;
END $$;

-- Create index for availability queries
CREATE INDEX IF NOT EXISTS idx_service_providers_availability 
ON service_providers USING gin (availability);

-- Create index for current_status
CREATE INDEX IF NOT EXISTS idx_service_providers_current_status 
ON service_providers (current_status);

-- Function to validate availability JSON structure
CREATE OR REPLACE FUNCTION validate_availability(availability_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  day_name text;
  day_data jsonb;
  required_days text[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
BEGIN
  -- Check if all required days are present
  FOREACH day_name IN ARRAY required_days
  LOOP
    IF NOT (availability_data ? day_name) THEN
      RETURN false;
    END IF;
    
    day_data := availability_data -> day_name;
    
    -- Check if day has required fields
    IF NOT (day_data ? 'available' AND day_data ? 'start' AND day_data ? 'end') THEN
      RETURN false;
    END IF;
    
    -- Check if available is boolean
    IF NOT (jsonb_typeof(day_data -> 'available') = 'boolean') THEN
      RETURN false;
    END IF;
    
    -- Check if start and end are strings (time format)
    IF NOT (jsonb_typeof(day_data -> 'start') = 'string' AND jsonb_typeof(day_data -> 'end') = 'string') THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Trigger function to validate availability before update
CREATE OR REPLACE FUNCTION validate_availability_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only validate if availability is being updated and is not null
  IF NEW.availability IS NOT NULL AND NEW.availability != OLD.availability THEN
    IF NOT validate_availability(NEW.availability) THEN
      RAISE EXCEPTION 'Invalid availability data structure';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for availability validation
DROP TRIGGER IF EXISTS validate_availability_trigger ON service_providers;
CREATE TRIGGER validate_availability_trigger
  BEFORE UPDATE ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION validate_availability_trigger();

-- Ensure RLS policies allow availability updates
DO $$
BEGIN
  -- Check if the update policy exists and allows availability updates
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_providers' 
    AND policyname = 'Providers can update own profile'
  ) THEN
    -- Policy exists, ensure it allows all updates
    DROP POLICY IF EXISTS "Providers can update own profile" ON service_providers;
  END IF;
  
  -- Create comprehensive update policy using correct auth function
  CREATE POLICY "Providers can update own profile" ON service_providers
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_availability(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_availability_trigger() TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN service_providers.availability IS 'Weekly availability schedule in JSON format with days of week';
COMMENT ON COLUMN service_providers.current_status IS 'Current provider status: available, busy, or offline';