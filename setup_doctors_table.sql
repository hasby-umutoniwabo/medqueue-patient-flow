-- This SQL script should be run in your Supabase SQL Editor to set up the doctors table

-- 1. Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Insert sample doctors first (before foreign key constraint)
INSERT INTO doctors (name, specialization, is_available) VALUES
    ('Dr. Sarah Johnson', 'General Medicine', true),
    ('Dr. Michael Chen', 'Cardiology', true),
    ('Dr. Emily Davis', 'Pediatrics', true)
ON CONFLICT DO NOTHING;

-- 3. Add doctor_id column to queue_entries table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_entries' AND column_name='doctor_id') THEN
        -- Add column without foreign key constraint first
        ALTER TABLE queue_entries ADD COLUMN doctor_id UUID;
        
        -- Update existing queue entries to have the first doctor
        UPDATE queue_entries 
        SET doctor_id = (SELECT id FROM doctors ORDER BY created_at ASC LIMIT 1)
        WHERE doctor_id IS NULL;
        
        -- Now add the foreign key constraint
        ALTER TABLE queue_entries 
        ADD CONSTRAINT queue_entries_doctor_id_fkey 
        FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_queue_entries_doctor_id ON queue_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status_doctor ON queue_entries(status, doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available);

-- 5. Enable RLS (Row Level Security) on doctors table
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- 6. Create policy for doctors table (allow all operations)
DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;
CREATE POLICY "Allow all operations on doctors" ON doctors
    FOR ALL USING (true) WITH CHECK (true);
