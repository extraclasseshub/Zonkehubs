/*
  # Add social media, website, and specialties fields to service providers

  1. New Fields
    - `website` (text) - Provider's website URL
    - `social_media` (jsonb) - Social media links (facebook, instagram, twitter, linkedin, etc.)
    - `specialties` (text[]) - Array of specialties within their service type
    - `years_experience` (integer) - Years of experience in the field
    - `certifications` (text[]) - Professional certifications

  2. Indexes
    - Add GIN index for social_media JSONB queries
    - Add GIN index for specialties array queries
    - Add index for years_experience

  3. Validation
    - Add validation for website URL format
    - Add validation for social media structure

  4. RLS Policies
    - Ensure all new fields are covered by existing policies
*/

-- Add new columns to service_providers table
ALTER TABLE service_providers 
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS social_media jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS years_experience integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}';

-- Create indexes for new fields
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

-- Function to validate website URL
CREATE OR REPLACE FUNCTION validate_website_url(url text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Allow empty/null URLs
  IF url IS NULL OR url = '' THEN
    RETURN true;
  END IF;
  
  -- Check if URL starts with http:// or https://
  IF url ~* '^https?://[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\..*$' THEN
    RETURN true;
  END IF;
  
  -- Allow URLs without protocol (will be prefixed with https://)
  IF url ~* '^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\..*$' THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to validate social media structure
CREATE OR REPLACE FUNCTION validate_social_media(social_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  platform text;
  url text;
  valid_platforms text[] := ARRAY['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'tiktok', 'whatsapp'];
BEGIN
  -- Allow empty object
  IF social_data = '{}'::jsonb THEN
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
    
    -- Validate URL format (basic check)
    IF url IS NOT NULL AND url != '' THEN
      IF NOT (url ~* '^https?://.*' OR url ~* '^[a-zA-Z0-9@._-]+$') THEN
        RETURN false;
      END IF;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Enhanced trigger function to validate all new fields
CREATE OR REPLACE FUNCTION validate_provider_fields_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate availability if being updated
  IF NEW.availability IS NOT NULL AND NEW.availability != COALESCE(OLD.availability, '{}'::jsonb) THEN
    IF NOT validate_availability(NEW.availability) THEN
      RAISE EXCEPTION 'Invalid availability data structure';
    END IF;
  END IF;
  
  -- Validate website URL
  IF NEW.website IS NOT NULL AND NEW.website != COALESCE(OLD.website, '') THEN
    IF NOT validate_website_url(NEW.website) THEN
      RAISE EXCEPTION 'Invalid website URL format';
    END IF;
  END IF;
  
  -- Validate social media structure
  IF NEW.social_media IS NOT NULL AND NEW.social_media != COALESCE(OLD.social_media, '{}'::jsonb) THEN
    IF NOT validate_social_media(NEW.social_media) THEN
      RAISE EXCEPTION 'Invalid social media data structure';
    END IF;
  END IF;
  
  -- Validate years of experience
  IF NEW.years_experience IS NOT NULL AND NEW.years_experience < 0 THEN
    RAISE EXCEPTION 'Years of experience cannot be negative';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS validate_availability_trigger ON service_providers;
DROP TRIGGER IF EXISTS validate_provider_fields_trigger ON service_providers;

CREATE TRIGGER validate_provider_fields_trigger
  BEFORE UPDATE ON service_providers
  FOR EACH ROW
  EXECUTE FUNCTION validate_provider_fields_trigger();

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION validate_website_url(text) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_social_media(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION validate_provider_fields_trigger() TO authenticated;

-- Add helpful comments
COMMENT ON COLUMN service_providers.website IS 'Provider website URL';
COMMENT ON COLUMN service_providers.social_media IS 'Social media links in JSON format';
COMMENT ON COLUMN service_providers.specialties IS 'Array of specialties within service type';
COMMENT ON COLUMN service_providers.years_experience IS 'Years of experience in the field';
COMMENT ON COLUMN service_providers.certifications IS 'Professional certifications and qualifications';

-- Update the existing availability validation function to be more robust
CREATE OR REPLACE FUNCTION validate_availability(availability_data jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  day_name text;
  day_data jsonb;
  required_days text[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
BEGIN
  -- Allow empty object
  IF availability_data = '{}'::jsonb THEN
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