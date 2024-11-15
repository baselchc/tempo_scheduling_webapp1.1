const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dnleokdzqrvlvivmibrr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubGVva2R6cXJ2bHZpdm1pYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwNjYzNjQsImV4cCI6MjA0NTY0MjM2NH0.Pi6QJeWgrqM2Is5cc1NUaDtc8SI1TFD3et0cg5ZiEVc";

// Check if the environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or ANON KEY is missing in environment variables.");
  console.error("Supabase URL:", supabaseUrl);
  console.error("Supabase ANON KEY:", supabaseAnonKey);
  console.log("Supabase URL from .env:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Supabase ANON KEY from .env:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  throw new Error("Supabase URL and ANON KEY must be defined in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };
