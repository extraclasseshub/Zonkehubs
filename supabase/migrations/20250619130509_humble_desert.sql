/*
  # Complete Fix for Availability and Additional Details Saving

  1. Database Schema
    - Ensure all columns exist with correct types
    - Add proper validation functions
    - Create robust triggers
    - Fix RLS policies

  2. Data Integrity
    - Validate availability schedule format
    - Validate social media links
    - Validate website URLs
    - Ensure proper constraints

  3. Performance
    - Add optimized indexes
    - Efficient query patterns
*/

-- First, ensure all required columns exist with proper types
DO $$
BEGIN
  -- Website column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'website'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN website text;
    RAISE NOTICE 'Added website column';
  END IF;

  -- Social media column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'social_media'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN social_media jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added social_media column';
  ELSE
    -- Ensure proper default
    ALTER TABLE service_providers ALTER COLUMN social_media SET DEFAULT '{}'::jsonb;
  END IF;

  -- Specialties column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN specialties text[] DEFAULT ARRAY[]::text[];
    RAISE NOTICE 'Added specialties column';
  ELSE
    -- Ensure proper default
    ALTER TABLE service_providers ALTER COLUMN specialties SET DEFAULT ARRAY[]::text[];
  END IF;

  -- Years experience column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN years_experience integer DEFAULT 0;
    RAISE NOTICE 'Added years_experience column';
  ELSE
    -- Ensure proper default
    ALTER TABLE service_providers ALTER COLUMN years_experience SET DEFAULT 0;
  END IF;

  -- Certifications column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN certifications text[] DEFAULT ARRAY[]::text[];
    RAISE NOTICE 'Added certifications column';
  ELSE
    -- Ensure proper default
    ALTER TABLE service_providers ALTER COLUMN certifications SET DEFAULT ARRAY[]::text[];
  END IF;

  -- Availability column - ensure it's jsonb type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' 
    AND column_name = 'availability' 
    AND data_type != 'jsonb'
  ) THEN
    -- Drop and recreate with correct type
    ALTER TABLE service_providers DROP COLUMN availability;
    ALTER TABLE service_providers ADD COLUMN availability jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Recreated availability column with jsonb type';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'availability'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN availability jsonb DEFAULT '{}'::jsonb;
    RAISE NOTICE 'Added availability column';
  ELSE
    -- Ensure proper default
    ALTER TABLE service_providers ALTER COLUMN availability SET DEFAULT '{}'::jsonb;
  END IF;

  -- Current status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'current_status'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN current_status text DEFAULT 'available'::text;
    RAISE NOTICE 'Added current_status column';
  ELSE
    -- Ensure proper default
    ALTER TABLE service_providers ALTER COLUMN current_status SET DEFAULT 'available'::text;
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Current status constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_providers_current_status_check'
  ) THEN
    ALTER TABLE service_providers 
    ADD CONSTRAINT service_providers_current_status_check 
    CHECK (current_status = ANY (ARRAY['available'::text, 'busy'::text, 'offline'::text]));
    RAISE NOTICE 'Added current_status constraint';
  END IF;

  -- Years experience constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_providers_years_experience_check'
  ) THEN
    ALTER TABLE service_providers 
    ADD CONSTRAINT service_providers_years_experience_check 
    CHECK (years_experience >= 0 AND years_experience <= 100);
    RAISE NOTICE 'Added years_experience constraint';
  END IF;
END $$;

-- Create optimized indexes
CREATE INDEX IF NOT EXISTS idx_service_providers_website 
ON service_providers (website) WHERE website IS NOT NULL AND website != '';

CREATE INDEX IF NOT EXISTS idx_service_providers_social_media 
ON service_providers USING gin (social_media);

CREATE INDEX IF NOT EXISTS idx_service_providers_specialties 
ON service_providers USING gin (specialties);

CREATE INDEX IF NOT EXISTS idx_service_providers_years_experience 
ON service_providers (years_experience);

CREATE INDEX IF NOT EXISTS idx_service_providers_certifications 
ON service_providers USING gin (certifications);

CREATE INDEX IF NOT EXISTS idx_service_providers_availability 
ON service_providers USING gin (availability);

CREATE INDEX IF NOT EXISTS idx_service_providers_status 
ON service_providers (current_status);

-- Drop all existing validation functions and triggers to start fresh
DROP TRIGGER IF EXISTS validate_availability_trigger ON service_providers;
DROP TRIGGER IF EXISTS validate_provider_fields_trigger ON service_providers;
DROP FUNCTION IF EXISTS validate_availability_trigger() CASCADE;
DROP FUNCTION IF EXISTS validate_provider_fields_trigger() CASCADE;
DROP FUNCTION IF EXISTS validate_availability(jsonb) CASCADE;
DROP FUNCTION IF EXISTS validate_social_media(jsonb) CASCADE;
DROP FUNCTION IF EXISTS validate_website_url(text) CASCADE;

-- Create robust availability validation function
CREATE OR REPLACE FUNCTION validate_availability(availability_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  day_name text;
  day_data jsonb;
  required_days text[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  start_time text;
  end_time text;
  start_minutes integer;
  end_minutes integer;
BEGIN
  -- Allow null or empty object
  IF availability_data IS NULL OR availability_data = '{}'::jsonb THEN
    RETURN true;
  END IF;
  
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
    
    -- Check if start and end are strings
    IF NOT (jsonb_typeof(day_data -> 'start') = 'string' AND jsonb_typeof(day_data -> 'end') = 'string') THEN
      RETURN false;
    END IF;
    
    -- Get time values
    start_time := day_data ->> 'start';
    end_time := day_data ->> 'end';
    
    -- Validate time format (HH:MM)
    IF NOT (start_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' AND 
            end_time ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$') THEN
      RETURN false;
    END IF;
    
    -- If day is available, validate that end time is after start time
    IF (day_data ->> 'available')::boolean = true THEN
      -- Convert times to minutes for comparison
      start_minutes := (split_part(start_time, ':', 1)::integer * 60) + split_part(start_time, ':', 2)::integer;
      end_minutes := (split_part(end_time, ':', 1)::integer * 60) + split_part(end_time, ':', 2)::integer;
      
      IF end_minutes <= start_minutes THEN
        RETURN false;
      END IF;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Create social media validation function
CREATE OR REPLACE FUNCTION validate_social_media(social_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  platform text;
  url text;
  valid_platforms text[] := ARRAY['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'whatsapp'];
BEGIN
  -- Allow null or empty object
  IF social_data IS NULL OR social_data = '{}'::jsonb THEN
    RETURN true;
  END IF;
  
  -- Check each platform in the social media object
  FOR platform IN SELECT jsonb_object_keys(social_data)
  LOOP
    -- Check if platform is valid
    IF NOT (platform = ANY(valid_platforms)) THEN
      RETURN false;
    END IF;
    
    -- Get the URL for this platform
    url := social_data ->> platform;
    
    -- Skip empty URLs
    IF url IS NULL OR url = '' THEN
      CONTINUE;
    END IF;
    
    -- Basic URL/handle validation - allow various formats
    IF NOT (
      url ~* '^https?://.*' OR 
      url ~* '^[a-zA-Z0-9@._+-]+$' OR 
      url ~* '^\+[0-9]+$' OR
      url ~* '^@[a-zA-Z0-9._-]+$'
    ) THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Create website URL validation function
CREATE OR REPLACE FUNCTION validate_website_url(url text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Allow null or empty URLs
  IF url IS NULL OR url = '' THEN
    RETURN true;
  END IF;
  
  -- Check basic URL format - be more permissive
  IF url ~* '^https?://.*' OR 
     url ~* '^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}.*$' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Create comprehensive validation trigger function
CREATE OR REPLACE FUNCTION validate_provider_fields_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate availability
  IF NEW.availability IS NOT NULL THEN
    IF NOT validate_availability(NEW.availability) THEN
      RAISE EXCEPTION 'Invalid availability schedule. Please ensure all days have proper time format (HH:MM) and end times are after start times.';
    END IF;
  END IF;
  
  -- Validate website URL
  IF NEW.website IS NOT NULL AND NEW.website != '' THEN
    IF NOT validate_website_url(NEW.website) THEN
      RAISE EXCEPTION 'Invalid website URL. Please enter a valid URL (e.g., https://example.com or example.com).';
    END IF;
  END IF;
  
  -- Validate social media
  IF NEW.social_media IS NOT NULL THEN
    IF NOT validate_social_media(NEW.social_media) THEN
      RAISE EXCEPTION 'Invalid social media data. Please check your social media links and handles.';
    END IF;
  END IF;
  
  -- Validate years of experience
  IF NEW.years_experience IS NOT NULL THEN
    IF NEW.years_experience < 0 OR NEW.years_experience > 100 THEN
      RAISE EXCEPTION 'Years of experience must be between 0 and 100.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the validation trigger
CREATE TRIGGER validate_provider_fields_trigger
  BEFORE INSERT OR UPDATE ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION validate_provider_fields_trigger();

-- Ensure proper RLS policies exist
DO $$
BEGIN
  -- Drop existing policies to recreate them properly
  DROP POLICY IF EXISTS "Anyone can read published service providers" ON service_providers;
  DROP POLICY IF EXISTS "Providers can insert own profile" ON service_providers;
  DROP POLICY IF EXISTS "Providers can update own profile" ON service_providers;
  
  -- Create comprehensive RLS policies
  CREATE POLICY "Anyone can read published service providers" ON service_providers
    FOR SELECT TO authenticated
    USING (is_published = true OR auth.uid() = id);
    
  CREATE POLICY "Providers can insert own profile" ON service_providers
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);
    
  CREATE POLICY "Providers can update own profile" ON service_providers
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
    
  RAISE NOTICE 'RLS policies created successfully';
END $$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION validate_availability(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_social_media(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_website_url(text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_provider_fields_trigger() TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN service_providers.website IS 'Provider website URL';
COMMENT ON COLUMN service_providers.social_media IS 'Social media links in JSON format';
COMMENT ON COLUMN service_providers.specialties IS 'Array of specialties within service type';
COMMENT ON COLUMN service_providers.years_experience IS 'Years of experience in the field';
COMMENT ON COLUMN service_providers.certifications IS 'Professional certifications and qualifications';
COMMENT ON COLUMN service_providers.availability IS 'Weekly availability schedule in JSON format with days of week';
COMMENT ON COLUMN service_providers.current_status IS 'Current provider status: available, busy, or offline';

-- Update any existing NULL values to proper defaults
UPDATE service_providers 
SET 
  social_media = COALESCE(social_media, '{}'::jsonb),
  specialties = COALESCE(specialties, ARRAY[]::text[]),
  years_experience = COALESCE(years_experience, 0),
  certifications = COALESCE(certifications, ARRAY[]::text[]),
  availability = COALESCE(availability, '{}'::jsonb),
  current_status = COALESCE(current_status, 'available'::text)
WHERE 
  social_media IS NULL OR 
  specialties IS NULL OR 
  years_experience IS NULL OR 
  certifications IS NULL OR 
  availability IS NULL OR 
  current_status IS NULL;

-- Final verification
DO $$
DECLARE
  column_count integer;
  trigger_count integer;
  policy_count integer;
BEGIN
  -- Check columns
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns 
  WHERE table_name = 'service_providers' 
  AND column_name IN ('website', 'social_media', 'specialties', 'years_experience', 'certifications', 'availability', 'current_status');
  
  -- Check triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE event_object_table = 'service_providers' 
  AND trigger_name = 'validate_provider_fields_trigger';
  
  -- Check policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'service_providers';
  
  RAISE NOTICE 'VERIFICATION COMPLETE:';
  RAISE NOTICE '- Columns: % out of 7 required columns exist', column_count;
  RAISE NOTICE '- Triggers: % validation trigger(s) active', trigger_count;
  RAISE NOTICE '- Policies: % RLS policies active', policy_count;
  
  IF column_count = 7 AND trigger_count >= 1 AND policy_count >= 3 THEN
    RAISE NOTICE 'SUCCESS: All components properly configured!';
  ELSE
    RAISE NOTICE 'WARNING: Some components may be missing or misconfigured.';
  END IF;
END $$;