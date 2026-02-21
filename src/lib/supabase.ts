import { createClient } from '@supabase/supabase-js';

// The project ID extracted from your previous link is 'mtaegjvawgbjfliuynaq'
const supabaseUrl = 'https://mtaegjvawgbjfliuynaq.supabase.co';

// IMPORTANT: Replace this with your 'anon public' key from the dashboard.
// It is a very long string starting with 'eyJhbGci...'
const supabaseAnonKey = 'sb_publishable_YOmSnZQqnl3YJ4yfmuJX8w_VNOWYFxu';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
