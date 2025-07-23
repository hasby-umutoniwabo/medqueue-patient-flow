-- Nuclear option - completely fresh start
-- WARNING: This will delete all existing queue entries!
-- Only use this if you're okay with losing current queue data

-- Step 1: Clear all queue entries (nuclear option)
TRUNCATE TABLE queue_entries;

-- Step 2: Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Step 3: Insert sample doctors
INSERT INTO doctors (name, specialization, is_available) VALUES
    ('Dr. Sarah Johnson', 'General Medicine', true),
    ('Dr. Michael Chen', 'Cardiology', true),
    ('Dr. Emily Davis', 'Pediatrics', true)
ON CONFLICT DO NOTHING;

-- Step 4: Add doctor_id column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_entries' AND column_name='doctor_id') THEN
        ALTER TABLE queue_entries ADD COLUMN doctor_id UUID;
    END IF;
END $$;

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_queue_entries_doctor_id ON queue_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available);

-- Step 6: Enable RLS and policies
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;
CREATE POLICY "Allow all operations on doctors" ON doctors
    FOR ALL USING (true) WITH CHECK (true);
