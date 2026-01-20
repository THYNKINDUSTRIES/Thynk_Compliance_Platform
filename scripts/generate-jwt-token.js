import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kruwbjaszdwzttblxqwr.supabase.co';
const supabaseAnonKey = '<your-anon-key>'; // Replace with your actual anon key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function generateJwtToken(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Error signing in:', error.message);
      return;
    }

    console.log('JWT Token:', data.session.access_token);
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Replace with valid credentials
const email = '<your-email>'; // Replace with your email
const password = '<your-password>'; // Replace with your password

generateJwtToken(email, password);