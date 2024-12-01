const { createClient } = require('@supabase/supabase-js');

// Fetch environment variables
const supabaseUrl = "https://dnleokdzqrvlvivmibrr.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRubGVva2R6cXJ2bHZpdm1pYnJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzAwNjYzNjQsImV4cCI6MjA0NTY0MjM2NH0.Pi6QJeWgrqM2Is5cc1NUaDtc8SI1TFD3et0cg5ZiEVc"

// Check if the environment variables are loaded
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or ANON KEY is missing in environment variables.");
  console.error("Supabase URL:", supabaseUrl || "Not defined");
  console.error("Supabase ANON KEY:", supabaseAnonKey || "Not defined");
  throw new Error("Supabase URL and ANON KEY must be defined in environment variables.");
}

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };
