/*
  # Fix availability and additional details saving

  1. Database Schema Updates
    - Ensure all new columns exist with proper types
    - Fix RLS policies for proper updates
    - Add proper validation functions
    - Create indexes for performance

  2. Security
    - Enable RLS on service_providers table
    - Add policies for authenticated users to update their own profiles
    - Grant necessary permissions

  3. Validation
    - Add comprehensive validation for all new fields
    - Ensure data integrity
*/

-- Ensure all new columns exist with proper types and defaults
DO $$
BEGIN
  -- Website column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'website'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN website text;
  END IF;

  -- Social media column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'social_media'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN social_media jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Specialties column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'specialties'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN specialties text[] DEFAULT '{}';
  END IF;

  -- Years experience column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'years_experience'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN years_experience integer DEFAULT 0;
  END IF;

  -- Certifications column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN certifications text[] DEFAULT '{}';
  END IF;

  -- Availability column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'availability'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN availability jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Current status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'service_providers' AND column_name = 'current_status'
  ) THEN
    ALTER TABLE service_providers ADD COLUMN current_status text DEFAULT 'available'::text;
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_providers_website 
ON service_providers (website) WHERE website IS NOT NULL;

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

-- Enhanced availability validation function
CREATE OR REPLACE FUNCTION validate_availability(availability_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  day_name text;
  day_data jsonb;
  required_days text[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
BEGIN
  -- Allow empty object or null
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
    
    -- Check if start and end are strings (time format)
    IF NOT (jsonb_typeof(day_data -> 'start') = 'string' AND jsonb_typeof(day_data -> 'end') = 'string') THEN
      RETURN false;
    END IF;
    
    -- Validate time format (HH:MM)
    IF NOT ((day_data ->> 'start') ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' AND 
            (day_data ->> 'end') ~ '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$') THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Social media validation function
CREATE OR REPLACE FUNCTION validate_social_media(social_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  platform text;
  url text;
  valid_platforms text[] := ARRAY['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'whatsapp'];
BEGIN
  -- Allow empty object or null
  IF social_data IS NULL OR social_data = '{}'::jsonb THEN
    RETURN true;
  END IF;
  
  -- Check each platform in the social media object
  FOR platform IN SELECT jsonb_object_keys(social_data)
  LOOP
    -- Check if platform is in valid list
    IF NOT (platform = ANY(valid_platforms)) THEN
      RETURN false;
    END IF;
    
    -- Get the URL for this platform
    url := social_data ->> platform;
    
    -- Allow empty URLs
    IF url IS NULL OR url = '' THEN
      CONTINUE;
    END IF;
    
    -- Basic URL validation
    IF NOT (url ~* '^https?://.*' OR url ~* '^[a-zA-Z0-9@._+-]+$') THEN
      RETURN false;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Website URL validation function
CREATE OR REPLACE FUNCTION validate_website_url(url text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Allow empty/null URLs
  IF url IS NULL OR url = '' THEN
    RETURN true;
  END IF;
  
  -- Check if URL starts with http:// or https://
  IF url ~* '^https?://[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9].*$' THEN
    RETURN true;
  END IF;
  
  -- Allow URLs without protocol (will be prefixed with https://)
  IF url ~* '^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9].*$' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Comprehensive validation trigger function
CREATE OR REPLACE FUNCTION validate_provider_fields_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate availability if being updated
  IF NEW.availability IS NOT NULL THEN
    IF NOT validate_availability(NEW.availability) THEN
      RAISE EXCEPTION 'Invalid availability data structure. Please check the format and try again.';
    END IF;
  END IF;
  
  -- Validate website URL
  IF NEW.website IS NOT NULL THEN
    IF NOT validate_website_url(NEW.website) THEN
      RAISE EXCEPTION 'Invalid website URL format. Please enter a valid URL.';
    END IF;
  END IF;
  
  -- Validate social media structure
  IF NEW.social_media IS NOT NULL THEN
    IF NOT validate_social_media(NEW.social_media) THEN
      RAISE EXCEPTION 'Invalid social media data. Please check your social media links.';
    END IF;
  END IF;
  
  -- Validate years of experience
  IF NEW.years_experience IS NOT NULL AND NEW.years_experience < 0 THEN
    RAISE EXCEPTION 'Years of experience cannot be negative.';
  END IF;
  
  -- Validate years of experience upper limit
  IF NEW.years_experience IS NOT NULL AND NEW.years_experience > 100 THEN
    RAISE EXCEPTION 'Years of experience seems too high. Please enter a realistic value.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers and create new one
DROP TRIGGER IF EXISTS validate_availability_trigger ON service_providers;
DROP TRIGGER IF EXISTS validate_provider_fields_trigger ON service_providers;

CREATE TRIGGER validate_provider_fields_trigger
  BEFORE INSERT OR UPDATE ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION validate_provider_fields_trigger();

-- Ensure proper RLS policies
DO $$
BEGIN
  -- Drop existing policies to recreate them
  DROP POLICY IF EXISTS "Providers can update own profile" ON service_providers;
  DROP POLICY IF EXISTS "Providers can insert own profile" ON service_providers;
  DROP POLICY IF EXISTS "Anyone can read published service providers" ON service_providers;
  
  -- Create comprehensive policies
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

-- Create function to update provider profile with all fields
CREATE OR REPLACE FUNCTION update_provider_profile(
  provider_id uuid,
  profile_data jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  update_query text;
  field_name text;
  field_value text;
BEGIN
  -- Check if user owns this profile
  IF NOT EXISTS (SELECT 1 FROM service_providers WHERE id = provider_id AND id = auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. You can only update your own profile.';
  END IF;
  
  -- Build dynamic update query
  update_query := 'UPDATE service_providers SET updated_at = now()';
  
  -- Add each field from the JSON data
  FOR field_name IN SELECT jsonb_object_keys(profile_data)
  LOOP
    CASE field_name
      WHEN 'availability' THEN
        update_query := update_query || ', availability = ''' || (profile_data ->> field_name) || '''::jsonb';
      WHEN 'social_media' THEN
        update_query := update_query || ', social_media = ''' || (profile_data ->> field_name) || '''::jsonb';
      WHEN 'specialties' THEN
        update_query := update_query || ', specialties = ''' || (profile_data ->> field_name) || '''::text[]';
      WHEN 'certifications' THEN
        update_query := update_query || ', certifications = ''' || (profile_data ->> field_name) || '''::text[]';
      WHEN 'years_experience' THEN
        update_query := update_query || ', years_experience = ' || (profile_data ->> field_name)::integer;
      WHEN 'website' THEN
        update_query := update_query || ', website = ''' || (profile_data ->> field_name) || '''';
      WHEN 'current_status' THEN
        update_query := update_query || ', current_status = ''' || (profile_data ->> field_name) || '''';
      ELSE
        -- Skip unknown fields
        CONTINUE;
    END CASE;
  END LOOP;
  
  update_query := update_query || ' WHERE id = ''' || provider_id || '''';
  
  -- Execute the update
  EXECUTE update_query;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to update profile: %', SQLERRM;
END;
$$;

-- Grant permission for the update function
GRANT EXECUTE ON FUNCTION update_provider_profile(uuid, jsonb) TO authenticated;