import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, ServiceProvider, AuthContextType, RegisterData, ChatMessage, Rating } from '../types';
import { supabase, isSupabaseConfigured, testSupabaseConnection, clearAuthData } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    console.log('🔄 AuthProvider initializing...');
    
    // Check if Supabase is configured first
    if (!isSupabaseConfigured()) {
      console.error('❌ Supabase is not properly configured');
      setLoading(false);
      return;
    }

    let mounted = true;

    // Get initial session with faster timeout
    const initializeAuth = async () => {
      try {
        console.log('🔄 Getting initial session...');
        
        // Faster connection test with shorter timeout
        const connectionPromise = testSupabaseConnection();
        const timeoutPromise = new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 3000)
        );
        
        const isConnected = await Promise.race([connectionPromise, timeoutPromise]).catch(() => false);
        
        if (!isConnected) {
          console.error('❌ Cannot connect to Supabase - skipping session initialization');
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        // Get session with timeout
        const sessionPromise = supabase.auth.getSession();
        const sessionTimeoutPromise = new Promise<any>((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 5000)
        );

        const { data: { session }, error } = await Promise.race([sessionPromise, sessionTimeoutPromise]);
        
        if (error) {
          console.error('❌ Session error:', error);
          
          // Check for refresh token errors specifically
          if (error.message?.includes('refresh_token_not_found') || 
              error.message?.includes('Invalid Refresh Token')) {
            console.log('🧹 Detected stale refresh token, clearing auth data and reloading...');
            
            // Clear stale authentication data
            clearAuthData();
            
            // Sign out to clear any remaining session state
            try {
              await supabase.auth.signOut();
              console.log('✅ Successfully cleared authentication state');
            } catch (signOutError) {
              console.error('❌ Error during sign out:', signOutError);
            }
            
            // Reload the page to start fresh
            setTimeout(() => {
              window.location.reload();
            }, 500);
            return;
          }
          
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          console.log('✅ Found existing session for:', session.user.email);
          setSupabaseUser(session.user);
          // Load profile in background, don't wait for it
          loadUserProfile(session.user.id).catch(console.error);
        } else {
          console.log('ℹ️ No existing session found');
        }
        
        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error getting session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state changed:', event, session?.user?.email);
      
      try {
        if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out');
          setSupabaseUser(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ User authenticated:', session.user.email);
          setSupabaseUser(session.user);
          // Load profile in background
          loadUserProfile(session.user.id).catch(console.error);
        } else {
          setSupabaseUser(null);
          setUser(null);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('❌ Error in auth state change:', error);
        setLoading(false);
      }
    });

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('📋 Loading profile for user:', userId);
      
      if (!isSupabaseConfigured() || !supabase) {
        console.error('❌ Supabase not configured');
        return;
      }

      // Load profile with single attempt and shorter timeout
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 8000)
      );

      const { data: profileData, error: profileError } = await Promise.race([profilePromise, timeoutPromise]) as any;
      
      if (profileError) {
        console.error('❌ Failed to load profile:', profileError);
        return;
      }

      if (!profileData) {
        console.error('❌ No profile found for user:', userId);
        return;
      }

      console.log('✅ Profile loaded:', profileData.name, 'Role:', profileData.role);

      if (profileData.role === 'provider') {
        // Load provider-specific data with timeout
        const providerPromise = supabase
          .from('service_providers')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        const providerTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Provider data load timeout')), 5000)
        );

        const { data: providerData, error: providerError } = await Promise.race([providerPromise, providerTimeoutPromise]).catch(() => ({ data: null, error: null })) as any;

        // Create service provider profile (with or without extended data)
        const serviceProvider: ServiceProvider = {
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          role: profileData.role,
          createdAt: new Date(profileData.created_at),
          profileImage: profileData.profile_image || '',
          businessName: providerData?.business_name || undefined,
          businessType: providerData?.business_type || 'individual',
          serviceType: providerData?.service_type || '',
          description: providerData?.description || '',
          phone: providerData?.phone || undefined,
          website: providerData?.website || undefined,
          socialMedia: providerData?.social_media || {},
          specialties: providerData?.specialties || [],
          yearsExperience: providerData?.years_experience || 0,
          certifications: providerData?.certifications || [],
          location: {
            address: providerData?.address || '',
            lat: providerData?.latitude || 0,
            lng: providerData?.longitude || 0,
          },
          workRadius: providerData?.work_radius || 10,
          workPortfolio: providerData?.work_portfolio || [],
          isPublished: providerData?.is_published || false,
          rating: providerData?.rating || 0,
          reviewCount: providerData?.review_count || 0,
          totalRatingPoints: providerData?.total_rating_points || 0,
          availability: providerData?.availability || undefined,
          currentStatus: providerData?.current_status || 'available',
        };

        if (providerError) {
          console.warn('⚠️ Provider profile loaded with basic data only (extended data failed to load)');
        } else {
          console.log('✅ Full provider profile loaded:', serviceProvider.name);
        }
        
        setUser(serviceProvider);
      } else {
        const regularUser: User = {
          id: profileData.id,
          email: profileData.email,
          name: profileData.name,
          role: profileData.role,
          createdAt: new Date(profileData.created_at),
          profileImage: profileData.profile_image || '',
        };

        console.log('✅ User profile loaded:', regularUser.name);
        setUser(regularUser);
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      // Don't throw the error, just log it and continue
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('🔐 Attempting login for:', email);

      if (!isSupabaseConfigured() || !supabase) {
        console.error('❌ Supabase not configured');
        return false;
      }

      // Test connection first with shorter timeout
      const connectionPromise = testSupabaseConnection();
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      );
      
      const isConnected = await Promise.race([connectionPromise, timeoutPromise]).catch(() => false);
      if (!isConnected) {
        console.error('❌ Cannot connect to Supabase');
        return false;
      }
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('❌ Login error:', error.message);
        return false;
      }

      if (!data.user) {
        console.error('❌ No user returned from login');
        return false;
      }

      console.log('✅ Login successful for:', data.user.email);
      return true;
    } catch (error) {
      console.error('❌ Login error:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      console.log('📝 Attempting registration for:', userData.email);

      if (!isSupabaseConfigured() || !supabase) {
        console.error('❌ Supabase not configured');
        return false;
      }

      // Test connection first with shorter timeout
      const connectionPromise = testSupabaseConnection();
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      );
      
      const isConnected = await Promise.race([connectionPromise, timeoutPromise]).catch(() => false);
      if (!isConnected) {
        console.error('❌ Cannot connect to Supabase');
        return false;
      }
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
      });

      if (error) {
        console.error('❌ Registration error:', error.message);
        return false;
      }

      if (!data.user) {
        console.error('❌ No user returned from registration');
        return false;
      }

      console.log('✅ User created:', data.user.email);

      // Wait for user to be fully created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create profile
      console.log('📝 Creating profile...');
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: userData.email.trim().toLowerCase(),
          name: userData.name.trim(),
          role: userData.role,
        });

      if (profileError) {
        console.error('❌ Profile creation error:', profileError);
        return false;
      }

      console.log('✅ Profile created');

      // If provider, create service provider record
      if (userData.role === 'provider') {
        console.log('📝 Creating provider profile...');
        const { error: providerError } = await supabase
          .from('service_providers')
          .insert({
            id: data.user.id,
          });

        if (providerError) {
          console.error('❌ Provider profile creation error:', providerError);
          return false;
        }

        console.log('✅ Provider profile created');
      }

      console.log('✅ Registration completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Registration error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error('❌ Logout error:', error);
        } else {
          console.log('✅ Successfully logged out');
        }
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Always clear client-side state regardless of server response
      setUser(null);
      setSupabaseUser(null);
      console.log('✅ Client-side state cleared');
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      console.log('🔄 Sending password reset email to:', email);

      if (!isSupabaseConfigured() || !supabase) {
        console.error('❌ Supabase not configured');
        return false;
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('❌ Password reset error:', error.message);
        return false;
      }

      console.log('✅ Password reset email sent successfully');
      return true;
    } catch (error) {
      console.error('❌ Password reset error:', error);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      console.log('🔄 Changing password...');

      if (!isSupabaseConfigured() || !supabase) {
        console.error('❌ Supabase not configured');
        return false;
      }

      if (!user?.email) {
        console.error('❌ User email not found');
        return false;
      }

      // Verify current password
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        console.error('❌ Current password verification failed:', verifyError.message);
        return false;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('❌ Password update error:', error.message);
        return false;
      }

      console.log('✅ Password changed successfully');
      return true;
    } catch (error) {
      console.error('❌ Password change error:', error);
      return false;
    }
  };

  const updateUserProfile = async (data: { name: string; email: string; profileImage: string }): Promise<boolean> => {
    if (!user) {
      console.error('❌ Update failed: User not authenticated');
      return false;
    }

    try {
      console.log('📝 Updating user profile...');

      if (!isSupabaseConfigured() || !supabase) {
        console.error('❌ Supabase not configured');
        return false;
      }
      
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          profile_image: data.profileImage,
        })
        .eq('id', user.id);

      if (error) {
        console.error('❌ Profile update error:', error);
        return false;
      }

      console.log('✅ Profile updated successfully');
      await loadUserProfile(user.id);
      return true;
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return false;
    }
  };

  const updateProfile = async (data: Partial<ServiceProvider>): Promise<boolean> => {
    if (!user || user.role !== 'provider') {
      console.error('❌ Update failed: User not authenticated or not a provider');
      return false;
    }

    try {
      console.log('📝 Updating provider profile with comprehensive data:', data);

      if (!isSupabaseConfigured() || !supabase) {
        console.error('❌ Supabase not configured');
        return false;
      }
      
      // Prepare updates for both tables
      const profileUpdates: any = {};
      const providerUpdates: any = {};
      
      // Profile table updates (name and profile image)
      if (data.name !== undefined) profileUpdates.name = data.name;
      if (data.profileImage !== undefined) profileUpdates.profile_image = data.profileImage;
      
      // Service provider table updates - include ALL new fields
      if (data.businessName !== undefined) providerUpdates.business_name = data.businessName;
      if (data.businessType !== undefined) providerUpdates.business_type = data.businessType;
      if (data.serviceType !== undefined) providerUpdates.service_type = data.serviceType;
      if (data.description !== undefined) providerUpdates.description = data.description;
      if (data.phone !== undefined) providerUpdates.phone = data.phone;
      if (data.website !== undefined) {
        console.log('💾 Updating website:', data.website);
        providerUpdates.website = data.website;
      }
      if (data.socialMedia !== undefined) {
        console.log('💾 Updating social media:', data.socialMedia);
        providerUpdates.social_media = data.socialMedia;
      }
      if (data.specialties !== undefined) {
        console.log('💾 Updating specialties:', data.specialties);
        providerUpdates.specialties = data.specialties;
      }
      if (data.yearsExperience !== undefined) {
        console.log('💾 Updating years experience:', data.yearsExperience);
        providerUpdates.years_experience = data.yearsExperience;
      }
      if (data.certifications !== undefined) {
        console.log('💾 Updating certifications:', data.certifications);
        providerUpdates.certifications = data.certifications;
      }
      if (data.location?.address !== undefined) providerUpdates.address = data.location.address;
      if (data.location?.lat !== undefined) providerUpdates.latitude = data.location.lat;
      if (data.location?.lng !== undefined) providerUpdates.longitude = data.location.lng;
      if (data.workRadius !== undefined) providerUpdates.work_radius = data.workRadius;
      if (data.workPortfolio !== undefined) providerUpdates.work_portfolio = data.workPortfolio;
      if (data.isPublished !== undefined) providerUpdates.is_published = data.isPublished;
      if (data.availability !== undefined) {
        console.log('💾 Updating availability:', data.availability);
        providerUpdates.availability = data.availability;
      }
      if (data.currentStatus !== undefined) {
        console.log('💾 Updating current status:', data.currentStatus);
        providerUpdates.current_status = data.currentStatus;
      }
      
      // Update profiles table if there are profile updates
      if (Object.keys(profileUpdates).length > 0) {
        console.log('📝 Updating profiles table:', profileUpdates);
        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', user.id);

        if (profileError) {
          console.error('❌ Profile table update error:', profileError);
          return false;
        }
        console.log('✅ Profiles table updated successfully');
      }
      
      // Update service_providers table if there are provider updates
      if (Object.keys(providerUpdates).length > 0) {
        console.log('📝 Updating service_providers table with all fields:', providerUpdates);
        
        // Add updated_at timestamp to ensure change tracking
        providerUpdates.updated_at = new Date().toISOString();
        
        const { error: providerError } = await supabase
          .from('service_providers')
          .update(providerUpdates)
          .eq('id', user.id);

        if (providerError) {
          console.error('❌ Service providers table update error:', providerError);
          console.error('❌ Error details:', providerError.message, providerError.details, providerError.hint);
          return false;
        }
        console.log('✅ Service providers table updated successfully with all fields');
      }

      console.log('✅ Profile updated successfully - reloading user data');
      
      // Force reload user profile to get updated data
      await loadUserProfile(user.id);
      return true;
    } catch (error) {
      console.error('❌ Profile update error:', error);
      return false;
    }
  };

  // Placeholder functions for features
  const getPublishedProviders = (): ServiceProvider[] => [];
  const getTopRatedProviders = (): ServiceProvider[] => [];

  const sendMessage = async (receiverId: string, content: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');
    if (!isSupabaseConfigured() || !supabase) throw new Error('Database not configured');

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content: content.trim(),
      });

    if (error) {
      console.error('Error sending message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  };

  const getConversation = async (userId1: string, userId2: string): Promise<ChatMessage[]> => {
    try {
      if (!isSupabaseConfigured() || !supabase || !user) return [];

      // Use the enhanced database function for proper message filtering
      const { data, error } = await supabase.rpc('get_conversation_messages', {
        user1_id: userId1,
        user2_id: userId2
      });

      if (error) {
        console.error('Error fetching conversation:', error);
        return [];
      }

      return data.map((msg: any) => ({
        id: msg.id,
        senderId: msg.sender_id,
        receiverId: msg.receiver_id,
        content: msg.content,
        timestamp: new Date(msg.created_at),
        read: msg.read,
        messageType: msg.message_type || 'text',
        fileUrl: msg.file_url,
        fileName: msg.file_name,
        fileSize: msg.file_size,
      }));
    } catch (error) {
      console.error('Error fetching conversation:', error);
      return [];
    }
  };

  const markMessagesAsRead = async (senderId: string, receiverId: string): Promise<void> => {
    try {
      if (!isSupabaseConfigured() || !supabase) return;

      const { error } = await supabase
        .from('chat_messages')
        .update({ read: true })
        .eq('sender_id', senderId)
        .eq('receiver_id', receiverId)
        .eq('deleted_for_all', false);

      if (error) {
        console.error('Error marking messages as read:', error);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const deleteConversation = async (otherUserId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      if (!isSupabaseConfigured() || !supabase) return false;

      console.log('🗑️ Deleting conversation with user:', otherUserId);

      // Mark all messages in this conversation as deleted for current user
      const { error } = await supabase
        .from('chat_messages')
        .update({
          deleted_for_sender: true
        })
        .eq('sender_id', user.id)
        .eq('receiver_id', otherUserId);

      if (error) {
        console.error('Error deleting sent messages:', error);
      }

      // Mark all received messages as deleted for current user
      const { error: error2 } = await supabase
        .from('chat_messages')
        .update({
          deleted_for_receiver: true
        })
        .eq('sender_id', otherUserId)
        .eq('receiver_id', user.id);

      if (error2) {
        console.error('Error deleting received messages:', error2);
      }

      // Clean up any fully deleted messages
      await supabase.rpc('cleanup_fully_deleted_messages');

      console.log('✅ Conversation deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return false;
    }
  };

  const deleteMessage = async (messageId: string, deleteType: 'delete-for-me' | 'delete-for-all'): Promise<boolean> => {
    if (!user) return false;
    
    try {
      if (!isSupabaseConfigured() || !supabase) return false;

      console.log('🗑️ Deleting message:', messageId, 'Type:', deleteType);

      // Get the message first to check ownership
      const { data: message, error: fetchError } = await supabase
        .from('chat_messages')
        .select('sender_id, receiver_id')
        .eq('id', messageId)
        .single();

      if (fetchError || !message) {
        console.error('Error fetching message:', fetchError);
        return false;
      }

      if (deleteType === 'delete-for-all') {
        // Only sender can delete for all
        if (message.sender_id !== user.id) {
          console.error('Only sender can delete message for all');
          return false;
        }

        const { error } = await supabase
          .from('chat_messages')
          .update({ deleted_for_all: true })
          .eq('id', messageId)
          .eq('sender_id', user.id);

        if (error) {
          console.error('Error deleting message for all:', error);
          return false;
        }
      } else {
        // Delete for current user only
        const updateField = message.sender_id === user.id ? 'deleted_for_sender' : 'deleted_for_receiver';
        
        const { error } = await supabase
          .from('chat_messages')
          .update({ [updateField]: true })
          .eq('id', messageId);

        if (error) {
          console.error('Error deleting message for user:', error);
          return false;
        }
      }

      console.log('✅ Message deletion successful');
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  };

  const getUserById = async (id: string): Promise<User | ServiceProvider | undefined> => {
    try {
      if (!isSupabaseConfigured() || !supabase) return undefined;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !profile) return undefined;

      if (profile.role === 'provider') {
        const { data: providerData } = await supabase
          .from('service_providers')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (providerData) {
          return {
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role,
            createdAt: new Date(profile.created_at),
            profileImage: profile.profile_image || '',
            businessName: providerData.business_name || undefined,
            businessType: providerData.business_type,
            serviceType: providerData.service_type,
            description: providerData.description,
            phone: providerData.phone || undefined,
            website: providerData.website || undefined,
            socialMedia: providerData.social_media || {},
            specialties: providerData.specialties || [],
            yearsExperience: providerData.years_experience || 0,
            certifications: providerData.certifications || [],
            location: {
              address: providerData.address,
              lat: providerData.latitude,
              lng: providerData.longitude,
            },
            workRadius: providerData.work_radius,
            workPortfolio: providerData.work_portfolio,
            isPublished: providerData.is_published,
            rating: providerData.rating,
            reviewCount: providerData.review_count,
            totalRatingPoints: providerData.total_rating_points,
            availability: providerData.availability,
            currentStatus: providerData.current_status,
          } as ServiceProvider;
        }
      }

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        createdAt: new Date(profile.created_at),
        profileImage: profile.profile_image || '',
      };
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      return undefined;
    }
  };

  const rateProvider = async (providerId: string, rating: number, review?: string): Promise<boolean> => {
    if (!user || user.role !== 'user') {
      console.error('❌ Rating failed: User not logged in or not a user');
      return false;
    }
    if (rating < 1 || rating > 5) {
      console.error('❌ Rating failed: Invalid rating value');
      return false;
    }

    try {
      console.log('⭐ Submitting rating:', { providerId, rating, review, userId: user.id });

      if (!isSupabaseConfigured() || !supabase) {
        console.error('❌ Supabase not configured');
        return false;
      }
      
      // Use upsert to handle both insert and update cases
      const { data, error } = await supabase
        .from('ratings')
        .upsert({
          user_id: user.id,
          provider_id: providerId,
          rating,
          review: review?.trim() || null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,provider_id'
        })
        .select();

      if (error) {
        console.error('❌ Error rating provider:', error);
        return false;
      }

      console.log('✅ Rating saved successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Error rating provider:', error);
      return false;
    }
  };

  const getProviderRatings = async (providerId: string): Promise<Rating[]> => {
    try {
      if (!isSupabaseConfigured() || !supabase) return [];

      console.log('📊 Fetching ratings for provider:', providerId);

      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          profiles!ratings_user_id_fkey(name)
        `)
        .eq('provider_id', providerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ratings:', error);
        return [];
      }

      console.log('📊 Found ratings:', data?.length || 0);

      return data.map(rating => ({
        id: rating.id,
        userId: rating.user_id,
        providerId: rating.provider_id,
        rating: rating.rating,
        review: rating.review,
        timestamp: new Date(rating.created_at),
        userName: (rating.profiles as any)?.name || 'Anonymous',
      }));
    } catch (error) {
      console.error('Error fetching ratings:', error);
      return [];
    }
  };

  const getUserRating = async (userId: string, providerId: string): Promise<Rating | undefined> => {
    try {
      if (!isSupabaseConfigured() || !supabase) return undefined;

      console.log('📊 Fetching user rating:', { userId, providerId });

      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          profiles!ratings_user_id_fkey(name)
        `)
        .eq('user_id', userId)
        .eq('provider_id', providerId)
        .maybeSingle();

      if (error || !data) {
        console.log('📊 No existing rating found');
        return undefined;
      }

      console.log('📊 Found existing rating:', data.rating);

      return {
        id: data.id,
        userId: data.user_id,
        providerId: data.provider_id,
        rating: data.rating,
        review: data.review,
        timestamp: new Date(data.created_at),
        userName: (data.profiles as any)?.name || 'Anonymous',
      };
    } catch (error) {
      console.error('Error fetching user rating:', error);
      return undefined;
    }
  };

  const deleteRating = async (ratingId: string): Promise<boolean> => {
    if (!user) {
      console.error('❌ Delete rating failed: User not authenticated');
      return false;
    }

    try {
      console.log('🗑️ Deleting rating:', ratingId);

      if (!isSupabaseConfigured() || !supabase) {
        console.error('❌ Supabase not configured');
        return false;
      }

      // First get the rating to check ownership and get provider ID
      const { data: ratingData, error: fetchError } = await supabase
        .from('ratings')
        .select('user_id, provider_id')
        .eq('id', ratingId)
        .single();

      if (fetchError || !ratingData) {
        console.error('❌ Error fetching rating for deletion:', fetchError);
        return false;
      }

      // Check if user owns this rating
      if (ratingData.user_id !== user.id) {
        console.error('❌ User does not own this rating');
        return false;
      }

      // Delete the rating
      const { error: deleteError } = await supabase
        .from('ratings')
        .delete()
        .eq('id', ratingId)
        .eq('user_id', user.id); // Extra security check

      if (deleteError) {
        console.error('❌ Error deleting rating:', deleteError);
        return false;
      }

      console.log('✅ Rating deleted successfully');

      // The trigger will automatically update the provider's rating statistics
      return true;
    } catch (error) {
      console.error('❌ Error deleting rating:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      login, 
      register, 
      logout,
      resetPassword,
      changePassword,
      updateUserProfile,
      updateProfile,
      getPublishedProviders,
      getTopRatedProviders,
      sendMessage,
      getConversation,
      markMessagesAsRead,
      deleteConversation,
      deleteMessage,
      getUserById,
      rateProvider,
      getProviderRatings,
      getUserRating,
      deleteRating,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}