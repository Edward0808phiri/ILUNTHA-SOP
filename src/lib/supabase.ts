import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(url, key);

export const BUSINESS_ID = import.meta.env.VITE_BUSINESS_ID as string;
export const COMPANY_ID = import.meta.env.VITE_COMPANY_ID as string;
