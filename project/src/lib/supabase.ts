import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'food_donor' | 'recipient_org' | 'data_analyst';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  organization_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface FoodListing {
  id: string;
  donor_id: string;
  title: string;
  description: string | null;
  food_type: 'prepared' | 'fresh_produce' | 'packaged' | 'baked_goods' | 'other';
  quantity: number;
  unit: 'lbs' | 'kg' | 'servings' | 'items';
  expiry_date: string | null;
  pickup_location: string;
  status: 'available' | 'claimed' | 'completed' | 'expired';
  claimed_by: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonationRequest {
  id: string;
  listing_id: string;
  recipient_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requested_quantity: number | null;
  message: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface ImpactMetric {
  id: string;
  user_id: string;
  donation_id: string;
  food_saved_lbs: number;
  co2_saved_lbs: number | null;
  meals_provided: number | null;
  recorded_at: string;
}

export interface WasteReport {
  id: string;
  created_by: string;
  report_type: 'weekly' | 'monthly' | 'custom';
  start_date: string;
  end_date: string;
  total_donations: number;
  total_food_saved_lbs: number;
  total_co2_saved_lbs: number;
  total_meals_provided: number;
  report_data: Record<string, unknown> | null;
  created_at: string;
}
