const { createClient } = require('@supabase/supabase-js');

// Fetch environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
