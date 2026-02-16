/*
  # Mobile Mechanic Platform Schema

  ## Overview
  Creates the complete database schema for a mobile mechanic booking platform connecting
  vehicle owners with certified mechanics.

  ## Tables Created

  1. **profiles**
     - `id` (uuid, references auth.users)
     - `email` (text)
     - `full_name` (text)
     - `phone` (text)
     - `user_type` (text: 'customer' or 'mechanic')
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  2. **mechanics**
     - `id` (uuid, primary key)
     - `user_id` (uuid, references profiles)
     - `business_name` (text)
     - `certifications` (text array)
     - `years_experience` (integer)
     - `service_radius` (integer, in kilometers)
     - `rating` (numeric)
     - `total_jobs` (integer)
     - `is_available` (boolean)
     - `current_latitude` (numeric)
     - `current_longitude` (numeric)
     - `created_at` (timestamptz)

  3. **services**
     - `id` (uuid, primary key)
     - `name` (text)
     - `description` (text)
     - `category` (text: 'repair', 'maintenance', 'inspection', 'emergency')
     - `base_price` (numeric)
     - `estimated_duration` (integer, in minutes)
     - `created_at` (timestamptz)

  4. **bookings**
     - `id` (uuid, primary key)
     - `customer_id` (uuid, references profiles)
     - `mechanic_id` (uuid, references mechanics)
     - `service_id` (uuid, references services)
     - `status` (text: 'pending', 'accepted', 'in_progress', 'completed', 'cancelled')
     - `vehicle_make` (text)
     - `vehicle_model` (text)
     - `vehicle_year` (integer)
     - `location_address` (text)
     - `location_latitude` (numeric)
     - `location_longitude` (numeric)
     - `scheduled_time` (timestamptz)
     - `total_price` (numeric)
     - `notes` (text)
     - `created_at` (timestamptz)
     - `updated_at` (timestamptz)

  5. **reviews**
     - `id` (uuid, primary key)
     - `booking_id` (uuid, references bookings)
     - `customer_id` (uuid, references profiles)
     - `mechanic_id` (uuid, references mechanics)
     - `rating` (integer, 1-5)
     - `comment` (text)
     - `created_at` (timestamptz)

  ## Security

  - RLS enabled on all tables
  - Customers can view their own profile and bookings
  - Mechanics can view their profile and assigned bookings
  - All users can view services and mechanic profiles
  - Only authenticated users can create bookings
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  phone text,
  user_type text NOT NULL DEFAULT 'customer',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_user_type CHECK (user_type IN ('customer', 'mechanic'))
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create mechanics table
CREATE TABLE IF NOT EXISTS mechanics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  business_name text NOT NULL,
  certifications text[] DEFAULT '{}',
  years_experience integer DEFAULT 0,
  service_radius integer DEFAULT 10,
  rating numeric DEFAULT 0,
  total_jobs integer DEFAULT 0,
  is_available boolean DEFAULT true,
  current_latitude numeric,
  current_longitude numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mechanics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view mechanics"
  ON mechanics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Mechanics can update own profile"
  ON mechanics FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Mechanics can insert own profile"
  ON mechanics FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'maintenance',
  base_price numeric NOT NULL,
  estimated_duration integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('repair', 'maintenance', 'inspection', 'emergency'))
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view services"
  ON services FOR SELECT
  TO authenticated
  USING (true);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mechanic_id uuid REFERENCES mechanics(id) ON DELETE SET NULL,
  service_id uuid REFERENCES services(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  vehicle_make text NOT NULL,
  vehicle_model text NOT NULL,
  vehicle_year integer NOT NULL,
  location_address text NOT NULL,
  location_latitude numeric NOT NULL,
  location_longitude numeric NOT NULL,
  scheduled_time timestamptz NOT NULL,
  total_price numeric NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled'))
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

CREATE POLICY "Mechanics can view assigned bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    mechanic_id IN (
      SELECT id FROM mechanics WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Customers can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Mechanics can update assigned bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    mechanic_id IN (
      SELECT id FROM mechanics WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    mechanic_id IN (
      SELECT id FROM mechanics WHERE user_id = auth.uid()
    )
  );

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mechanic_id uuid REFERENCES mechanics(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL,
  comment text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Customers can create reviews for their bookings"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (customer_id = auth.uid());

-- Insert sample services
INSERT INTO services (name, description, category, base_price, estimated_duration) VALUES
  ('Oil Change', 'Complete oil and filter change service', 'maintenance', 49.99, 30),
  ('Brake Inspection', 'Comprehensive brake system inspection', 'inspection', 39.99, 45),
  ('Battery Replacement', 'Battery testing and replacement', 'repair', 129.99, 30),
  ('Tire Rotation', 'Four-wheel tire rotation and balance', 'maintenance', 59.99, 45),
  ('Engine Diagnostic', 'Full engine diagnostic scan', 'inspection', 89.99, 60),
  ('Flat Tire Repair', 'Emergency flat tire repair or replacement', 'emergency', 79.99, 30),
  ('Jump Start', 'Emergency jump start service', 'emergency', 39.99, 15),
  ('Brake Pad Replacement', 'Replace worn brake pads', 'repair', 199.99, 90)
ON CONFLICT DO NOTHING;