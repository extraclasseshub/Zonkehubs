/*
  # Add profile image support to profiles table

  1. Changes
    - Add `profile_image` column to `profiles` table
    - Update existing RLS policies to include the new column
  
  2. Security
    - Maintain existing RLS policies
    - Users can update their own profile image
*/

-- Add profile_image column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_image text DEFAULT '';
  END IF;
END $$;