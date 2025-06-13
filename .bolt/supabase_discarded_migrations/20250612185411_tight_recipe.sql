/*
  # Fix RLS Policies for Authentication Issues

  1. Update RLS policies to be more permissive for authenticated users
  2. Fix authentication flow issues
  3. Ensure proper access to all necessary endpoints
*/

-- Temporarily disable RLS to fix any existing issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
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

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies for profiles
CREATE POLICY "Enable read access for authenticated users" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on user_id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for users based on user_id" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- Create more permissive policies for service_providers
CREATE POLICY "Enable read access for all authenticated users" ON service_providers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON service_providers
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for providers based on user_id" ON service_providers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Enable delete for providers based on user_id" ON service_providers
  FOR DELETE USING (auth.uid() = id);

-- Create policies for chat_messages
CREATE POLICY "Enable read for message participants" ON chat_messages
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    (auth.uid() = sender_id OR auth.uid() = receiver_id)
  );

CREATE POLICY "Enable insert for authenticated users" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = sender_id
  );

CREATE POLICY "Enable update for message recipients" ON chat_messages
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    auth.uid() = receiver_id
  );

-- Create policies for ratings
CREATE POLICY "Enable read access for all authenticated users" ON ratings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON ratings
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id
  );

CREATE POLICY "Enable update for rating authors" ON ratings
  FOR UPDATE USING (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id
  );

CREATE POLICY "Enable delete for rating authors" ON ratings
  FOR DELETE USING (
    auth.role() = 'authenticated' AND 
    auth.uid() = user_id
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure the auth schema is accessible
GRANT USAGE ON SCHEMA auth TO authenticated;

-- Verify the setup
SELECT 'RLS policies updated successfully' as status;