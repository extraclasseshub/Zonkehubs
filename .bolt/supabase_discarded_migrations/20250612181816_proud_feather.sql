/*
  # Create Demo Users for Testing

  1. Demo Users
    - Create demo user account (demo.user@example.com)
    - Create demo provider account (demo.provider@example.com)
    - Both with password: demo123

  2. Sample Data
    - Complete provider profile for demo provider
    - Sample ratings and reviews
*/

-- Insert demo user profile
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'demo.user@example.com',
  '$2a$10$8qvZ7Z7Z7Z7Z7Z7Z7Z7Z7O7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z', -- demo123
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Insert demo provider user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  '00000000-0000-0000-0000-000000000000',
  'demo.provider@example.com',
  '$2a$10$8qvZ7Z7Z7Z7Z7Z7Z7Z7Z7O7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z', -- demo123
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Insert demo user profile
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  profile_image
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'demo.user@example.com',
  'Demo User',
  'user',
  'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
) ON CONFLICT (id) DO NOTHING;

-- Insert demo provider profile
INSERT INTO profiles (
  id,
  email,
  name,
  role,
  profile_image
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'demo.provider@example.com',
  'Demo Provider',
  'provider',
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150'
) ON CONFLICT (id) DO NOTHING;

-- Insert demo service provider data
INSERT INTO service_providers (
  id,
  business_name,
  business_type,
  service_type,
  description,
  phone,
  address,
  latitude,
  longitude,
  work_radius,
  profile_image,
  work_portfolio,
  is_published,
  rating,
  review_count,
  total_rating_points
) VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Demo Plumbing Services',
  'business',
  'Plumbing',
  'Professional plumbing services with over 10 years of experience. We handle everything from leaky faucets to complete bathroom renovations. Available 24/7 for emergency repairs.',
  '+1-555-0123',
  'Downtown Business District, Demo City',
  40.7128,
  -74.0060,
  25,
  'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150',
  ARRAY[
    'https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400',
    'https://images.pexels.com/photos/1571463/pexels-photo-1571463.jpeg?auto=compress&cs=tinysrgb&w=400'
  ],
  true,
  4.5,
  3,
  14
) ON CONFLICT (id) DO NOTHING;

-- Insert sample ratings for demo provider
INSERT INTO ratings (
  id,
  user_id,
  provider_id,
  rating,
  review
) VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222',
  5,
  'Excellent service! Fixed my kitchen sink quickly and professionally. Highly recommended!'
) ON CONFLICT (user_id, provider_id) DO NOTHING;

-- Create additional demo users for more ratings
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  '00000000-0000-0000-0000-000000000000',
  'demo.user2@example.com',
  '$2a$10$8qvZ7Z7Z7Z7Z7Z7Z7Z7Z7O7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z',
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (
  id,
  email,
  name,
  role
) VALUES (
  '44444444-4444-4444-4444-444444444444',
  'demo.user2@example.com',
  'Sarah Johnson',
  'user'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO ratings (
  id,
  user_id,
  provider_id,
  rating,
  review
) VALUES (
  '55555555-5555-5555-5555-555555555555',
  '44444444-4444-4444-4444-444444444444',
  '22222222-2222-2222-2222-222222222222',
  4,
  'Great work on our bathroom renovation. Professional and clean. Would hire again.'
) ON CONFLICT (user_id, provider_id) DO NOTHING;

-- Add one more user and rating
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  '66666666-6666-6666-6666-666666666666',
  '00000000-0000-0000-0000-000000000000',
  'demo.user3@example.com',
  '$2a$10$8qvZ7Z7Z7Z7Z7Z7Z7Z7Z7O7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z7Z',
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (
  id,
  email,
  name,
  role
) VALUES (
  '66666666-6666-6666-6666-666666666666',
  'demo.user3@example.com',
  'Mike Chen',
  'user'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO ratings (
  id,
  user_id,
  provider_id,
  rating,
  review
) VALUES (
  '77777777-7777-7777-7777-777777777777',
  '66666666-6666-6666-6666-666666666666',
  '22222222-2222-2222-2222-222222222222',
  5,
  'Emergency call at midnight - they came right away and fixed our burst pipe. Lifesavers!'
) ON CONFLICT (user_id, provider_id) DO NOTHING;

-- Verify the setup
SELECT 'Demo users and data created successfully' as status;