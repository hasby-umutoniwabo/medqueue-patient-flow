-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add doctor_id column to queue_entries table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='queue_entries' AND column_name='doctor_id') THEN
        ALTER TABLE queue_entries ADD COLUMN doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_queue_entries_doctor_id ON queue_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status_doctor ON queue_entries(status, doctor_id);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available);

-- Enable RLS (Row Level Security) on doctors table
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;

-- Create policy for doctors table (allow all operations for now, you can restrict this based on your auth requirements)
CREATE POLICY "Allow all operations on doctors" ON doctors
    FOR ALL USING (true) WITH CHECK (true);

-- Insert some sample doctors for testing
INSERT INTO doctors (name, specialization, is_available) VALUES
    ('Dr. Sarah Johnson', 'General Medicine', true),
    ('Dr. Michael Chen', 'Cardiology', true),
    ('Dr. Emily Davis', 'Pediatrics', true)
ON CONFLICT DO NOTHING;
