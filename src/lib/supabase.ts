import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = "https://mtaegjvawgbjfliuynaq.supabase.co";

const supabaseAnonKey = "sb_publishable_YOmSnZQqnl3YJ4yfmuJX8w_VNOWYFxu";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
