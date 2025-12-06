import { createClient } from '@supabase/supabase-js';


// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://kruwbjaszdwzttblxqwr.supabase.co';
const supabaseKey = 'sb_publishable_epMbsnHiWniQUQlHXk6QSg_zDgzs08E';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };