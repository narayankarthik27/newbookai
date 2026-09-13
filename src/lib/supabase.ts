import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ehpfkvqiqksmppnodwdq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVocGZrdnFpcWtzbXBwbm9kd2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyOTc1NzgsImV4cCI6MjEwNDg3MzU3OH0.RXvcxsDzhKieLgbJHsxL4EbUye3uBJE4IElZLf9F-Ws';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
