import { AppState } from 'react-native'
import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://madkczinirmderfroczy.supabase.co' 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hZGtjemluaXJtZGVyZnJvY3p5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3OTk1ODQsImV4cCI6MjA4MzM3NTU4NH0.4eJnL1dhI0UpSJjc35gghVe5cPktIxf2BGx1KDj7CYg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

