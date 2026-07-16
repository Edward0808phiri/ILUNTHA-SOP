import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');

export const supabase = createClient(url, key);

// These start as env-var fallbacks and are overwritten after login
// so every component that imports them gets the logged-in business automatically
export let BUSINESS_ID = (import.meta.env.VITE_BUSINESS_ID as string) ?? '';
export let COMPANY_ID  = (import.meta.env.VITE_COMPANY_ID  as string) ?? '';

export function setActiveIds(businessId: string, companyId: string) {
  BUSINESS_ID = businessId;
  COMPANY_ID  = companyId;
}
