/*
  # Food Waste Tracking Platform Database Schema

  ## Overview
  Complete database schema for a food waste reduction platform with role-based access control
  and comprehensive tracking capabilities.

  ## New Tables

  ### 1. `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `email` (text, not null)
  - `full_name` (text)
  - `role` (text, not null) - 'admin', 'food_donor', 'recipient_org', 'data_analyst'
  - `organization_name` (text)
  - `phone` (text)
  - `address` (text)
  - `city` (text)
  - `state` (text)
  - `zip_code` (text)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `food_listings`
  - `id` (uuid, primary key)
  - `donor_id` (uuid, references profiles)
  - `title` (text, not null)
  - `description` (text)
  - `food_type` (text, not null) - 'prepared', 'fresh_produce', 'packaged', 'baked_goods', 'other'
  - `quantity` (numeric, not null)
  - `unit` (text, not null) - 'lbs', 'kg', 'servings', 'items'
  - `expiry_date` (date)
  - `pickup_location` (text, not null)
  - `status` (text, not null) - 'available', 'claimed', 'completed', 'expired'
  - `claimed_by` (uuid, references profiles)
  - `claimed_at` (timestamptz)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. `donation_requests`
  - `id` (uuid, primary key)
  - `listing_id` (uuid, references food_listings)
  - `recipient_id` (uuid, references profiles)
  - `status` (text, not null) - 'pending', 'approved', 'rejected', 'completed'
  - `requested_quantity` (numeric)
  - `message` (text)
  - `approved_at` (timestamptz)
  - `created_at` (timestamptz)

  ### 4. `impact_metrics`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `donation_id` (uuid, references food_listings)
  - `food_saved_lbs` (numeric, not null)
  - `co2_saved_lbs` (numeric) - calculated based on food weight
  - `meals_provided` (integer) - estimated meals from food
  - `recorded_at` (timestamptz)

  ### 5. `waste_reports`
  - `id` (uuid, primary key)
  - `created_by` (uuid, references profiles)
  - `report_type` (text, not null) - 'weekly', 'monthly', 'custom'
  - `start_date` (date, not null)
  - `end_date` (date, not null)
  - `total_donations` (integer)
  - `total_food_saved_lbs` (numeric)
  - `total_co2_saved_lbs` (numeric)
  - `total_meals_provided` (integer)
  - `report_data` (jsonb) - detailed breakdown
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Role-based access policies for each user type
  - Users can only access data appropriate to their role
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('admin', 'food_donor', 'recipient_org', 'data_analyst')),
  organization_name text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create food listings table
CREATE TABLE IF NOT EXISTS food_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  food_type text NOT NULL CHECK (food_type IN ('prepared', 'fresh_produce', 'packaged', 'baked_goods', 'other')),
  quantity numeric NOT NULL CHECK (quantity > 0),
  unit text NOT NULL CHECK (unit IN ('lbs', 'kg', 'servings', 'items')),
  expiry_date date,
  pickup_location text NOT NULL,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'claimed', 'completed', 'expired')),
  claimed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create donation requests table
CREATE TABLE IF NOT EXISTS donation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES food_listings(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  requested_quantity numeric,
  message text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create impact metrics table
CREATE TABLE IF NOT EXISTS impact_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  donation_id uuid REFERENCES food_listings(id) ON DELETE CASCADE NOT NULL,
  food_saved_lbs numeric NOT NULL CHECK (food_saved_lbs >= 0),
  co2_saved_lbs numeric CHECK (co2_saved_lbs >= 0),
  meals_provided integer CHECK (meals_provided >= 0),
  recorded_at timestamptz DEFAULT now()
);

-- Create waste reports table
CREATE TABLE IF NOT EXISTS waste_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('weekly', 'monthly', 'custom')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  total_donations integer DEFAULT 0,
  total_food_saved_lbs numeric DEFAULT 0,
  total_co2_saved_lbs numeric DEFAULT 0,
  total_meals_provided integer DEFAULT 0,
  report_data jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE impact_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Food listings policies
CREATE POLICY "Anyone can view available food listings"
  ON food_listings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Donors can create listings"
  ON food_listings FOR INSERT
  TO authenticated
  WITH CHECK (
    donor_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('food_donor', 'admin'))
  );

CREATE POLICY "Donors can update own listings"
  ON food_listings FOR UPDATE
  TO authenticated
  USING (donor_id = auth.uid())
  WITH CHECK (donor_id = auth.uid());

CREATE POLICY "Donors can delete own listings"
  ON food_listings FOR DELETE
  TO authenticated
  USING (donor_id = auth.uid());

-- Donation requests policies
CREATE POLICY "Users can view relevant donation requests"
  ON donation_requests FOR SELECT
  TO authenticated
  USING (
    recipient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM food_listings WHERE id = listing_id AND donor_id = auth.uid())
  );

CREATE POLICY "Recipients can create donation requests"
  ON donation_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    recipient_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('recipient_org', 'admin'))
  );

CREATE POLICY "Recipients can update own requests"
  ON donation_requests FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid())
  WITH CHECK (recipient_id = auth.uid());

-- Impact metrics policies
CREATE POLICY "Users can view all impact metrics"
  ON impact_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create impact metrics for own donations"
  ON impact_metrics FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM food_listings 
      WHERE id = donation_id AND (donor_id = auth.uid() OR claimed_by = auth.uid())
    )
  );

-- Waste reports policies
CREATE POLICY "All authenticated users can view reports"
  ON waste_reports FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Data analysts and admins can create reports"
  ON waste_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('data_analyst', 'admin'))
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_listings_donor ON food_listings(donor_id);
CREATE INDEX IF NOT EXISTS idx_food_listings_status ON food_listings(status);
CREATE INDEX IF NOT EXISTS idx_food_listings_created ON food_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_requests_listing ON donation_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_donation_requests_recipient ON donation_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_impact_metrics_user ON impact_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_impact_metrics_donation ON impact_metrics(donation_id);
CREATE INDEX IF NOT EXISTS idx_waste_reports_created_by ON waste_reports(created_by);