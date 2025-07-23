-- Fix foreign key constraint issues
-- Run this in your Supabase SQL Editor

-- Step 1: Drop any existing problematic constraints
DO $$ 
BEGIN
    -- Drop the incorrect foreign key constraint if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'queue_entries_doctor_id_fkey') THEN
        ALTER TABLE queue_entries DROP CONSTRAINT queue_entries_doctor_id_fkey;
    END IF;
END $$;

-- Step 2: Clean up any problematic queue entries
DELETE FROM queue_entries 
WHERE patient_id NOT IN (SELECT id FROM patients);

-- Step 3: Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 4: Insert sample doctors
INSERT INTO doctors (name, specialization, is_available) VALUES
    ('Dr. Sarah Johnson', 'General Medicine', true),
    ('Dr. Michael Chen', 'Cardiology', true),
    ('Dr. Emily Davis', 'Pediatrics', true)
ON CONFLICT DO NOTHING;

-- Step 5: Add doctor_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_entries' AND column_name='doctor_id') THEN
        ALTER TABLE queue_entries ADD COLUMN doctor_id UUID;
    END IF;
END $$;

-- Step 6: Clear any invalid doctor_id values
UPDATE queue_entries SET doctor_id = NULL WHERE doctor_id IS NOT NULL;

-- Step 7: Set default doctor for all entries
UPDATE queue_entries 
SET doctor_id = (SELECT id FROM doctors ORDER BY created_at ASC LIMIT 1);

-- Step 8: Create indexes
CREATE INDEX IF NOT EXISTS idx_queue_entries_doctor_id ON queue_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available);

-- Step 9: Enable RLS and policies
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;
CREATE POLICY "Allow all operations on doctors" ON doctors
    FOR ALL USING (true) WITH CHECK (true);
