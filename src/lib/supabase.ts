import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Supabase Environment Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlFormat: supabaseUrl?.includes('supabase.co') ? 'Valid' : 'Invalid',
  keyLength: supabaseAnonKey?.length || 0
});

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  const isConfigured = !!(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'your_supabase_project_url' && 
    supabaseAnonKey !== 'your_supabase_anon_key' &&
    supabaseUrl.includes('supabase.co') &&
    supabaseUrl.startsWith('https://') &&
    supabaseAnonKey.length > 50
  );
  
  console.log('🔧 Supabase Configuration Status:', isConfigured ? '✅ Valid' : '❌ Invalid');
  return isConfigured;
};

// Helper function to clear stale authentication data
const clearStaleAuthData = () => {
  try {
    // Clear all Supabase-related items from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log('🧹 Cleared stale auth data:', key);
    });
    
    if (keysToRemove.length > 0) {
      console.log('✅ Cleared all stale authentication data');
    }
  } catch (error) {
    console.error('❌ Error clearing stale auth data:', error);
  }
};

// Create the Supabase client with enhanced error handling
export const supabase = isSupabaseConfigured() 
  ? createClient<Database>(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
        storage: window.localStorage,
        storageKey: 'supabase.auth.token'
      },
      global: {
        headers: {
          'x-client-info': 'zonke-hub@1.0.0',
          'apikey': supabaseAnonKey!
        }
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : null as any;

// Enhanced connection test with faster timeouts
export const testSupabaseConnection = async (): Promise<boolean> => {
  try {
    if (!isSupabaseConfigured() || !supabase) {
      console.log('❌ Supabase not configured properly');
      return false;
    }
    
    console.log('🔄 Testing Supabase connection...');
    
    // Single attempt with shorter timeout for faster loading
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 5000)
    );
    
    const connectionPromise = supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    const { data, error } = await Promise.race([
      connectionPromise,
      timeoutPromise
    ]);
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      
      if (error.message.includes('JWT')) {
        console.error('❌ Authentication token issue - check your anon key');
      }
      if (error.message.includes('permission')) {
        console.error('❌ Permission denied - check your RLS policies');
      }
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.error('❌ Database table does not exist - check your migrations');
      }
      
      return false;
    }
    
    console.log('✅ Supabase connection test passed');
    return true;
    
  } catch (fetchError: any) {
    console.error('❌ Connection test failed:', fetchError.message);
    
    if (fetchError.message === 'Connection timeout') {
      console.error('❌ Supabase connection timeout (5s)');
    } else if (fetchError.message.includes('Failed to fetch')) {
      console.error('❌ Network error - check your internet connection and Supabase URL');
    }
    
    return false;
  }
};

// Initialize Supabase with error handling
if (isSupabaseConfigured() && supabase) {
  // Set up auth state change listener to handle token errors
  supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state changed:', event, session ? 'Session exists' : 'No session');
    
    if (event === 'TOKEN_REFRESHED') {
      console.log('✅ Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
      console.log('👋 User signed out');
      clearStaleAuthData();
    }
  });

  // Test connection and handle initial auth errors
  testSupabaseConnection().then(success => {
    if (success) {
      console.log('🚀 Supabase client initialized successfully');
    } else {
      console.error('🚨 Supabase client initialization failed - check your configuration and network connection');
    }
  }).catch(async (error) => {
    console.error('🚨 Supabase initialization error:', error);
    
    // Check if it's a refresh token error
    if (error.message?.includes('refresh_token_not_found') || 
        error.message?.includes('Invalid Refresh Token')) {
      console.log('🧹 Detected stale refresh token, clearing auth data...');
      clearStaleAuthData();
      
      // Sign out to clear any remaining session state
      try {
        await supabase.auth.signOut();
        console.log('✅ Successfully cleared authentication state');
        
        // Reload the page to start fresh
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (signOutError) {
        console.error('❌ Error during sign out:', signOutError);
      }
    }
  });

  // Listen for unhandled auth errors
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error?.message?.includes('refresh_token_not_found') || 
        error?.message?.includes('Invalid Refresh Token') ||
        error?.message?.includes('Failed to fetch')) {
      console.log('🧹 Caught unhandled error, clearing auth data...', error.message);
      event.preventDefault(); // Prevent the error from being logged to console
      clearStaleAuthData();
      
      // Sign out and reload
      supabase.auth.signOut().then(() => {
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      });
    }
  });

} else {
  console.warn('⚠️ Supabase not configured - running in demo mode');
}

// Export helper function for manual auth cleanup
export const clearAuthData = clearStaleAuthData;