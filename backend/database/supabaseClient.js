// backend/database/supabaseClient.js

import { createClient } from '@supabase/supabase-js';

// Fetch environment variables
const supabaseUrl = "https://dnleokdzqrvlvivmibrr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubGVva2R6cXJ2bHZpdm1pYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwNjYzNjQsImV4cCI6MjA0NTY0MjM2NH0.Pi6QJeWgrqM2Is5cc1NUaDtc8SI1TFD3et0cg5ZiEVc";
const supabaseServiceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubGVva2R6cXJ2bHZpdm1pYnJyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDA2NjM2NCwiZXhwIjoyMDQ1NjQyMzY0fQ.T9KzmAi4m_mEoydGxkZFB_8dt_XIrYgJiwRirvG5CnY";

// Check if the environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Supabase URL, ANON KEY, or SERVICE KEY is missing in environment variables.");
  console.error("Supabase URL:", supabaseUrl || "Not defined");
  console.error("Supabase ANON KEY:", supabaseAnonKey || "Not defined");
  console.error("Supabase SERVICE KEY:", supabaseServiceKey ? "Defined" : "Not defined");
  throw new Error("Supabase URL, ANON KEY, and SERVICE KEY must be defined in environment variables.");
}

// Regular client for normal operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client only for specific admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export { supabase, supabaseAdmin };