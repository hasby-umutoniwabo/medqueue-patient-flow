-- Complete database setup for MedQueue Patient Flow System
-- Run this in your Supabase SQL Editor

-- Create patients table if it doesn't exist
CREATE TABLE IF NOT EXISTS patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    national_id VARCHAR(20) NOT NULL,
    date_of_birth DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create doctors table if it doesn't exist
CREATE TABLE IF NOT EXISTS doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create queue_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS queue_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    visit_reason TEXT NOT NULL,
    queue_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create announcements table if it doesn't exist
CREATE TABLE IF NOT EXISTS announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority INTEGER DEFAULT 1 CHECK (priority IN (1, 2, 3)),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_queue_entries_patient_id ON queue_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_doctor_id ON queue_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status_doctor ON queue_entries(status, doctor_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_number ON queue_entries(queue_number);
CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number);
CREATE INDEX IF NOT EXISTS idx_patients_national_id ON patients(national_id);

-- Enable RLS (Row Level Security) on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables (allow all operations for now)
DROP POLICY IF EXISTS "Allow all operations on patients" ON patients;
CREATE POLICY "Allow all operations on patients" ON patients
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;
CREATE POLICY "Allow all operations on doctors" ON doctors
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on queue_entries" ON queue_entries;
CREATE POLICY "Allow all operations on queue_entries" ON queue_entries
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on announcements" ON announcements;
CREATE POLICY "Allow all operations on announcements" ON announcements
    FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data
-- Insert doctors
INSERT INTO doctors (name, specialization, is_available) VALUES
    ('Dr. Sarah Johnson', 'General Medicine', true),
    ('Dr. Michael Chen', 'Cardiology', true),
    ('Dr. Emily Davis', 'Pediatrics', true)
ON CONFLICT (name) DO NOTHING;

-- Insert patients with national_id
INSERT INTO patients (full_name, phone_number, national_id, date_of_birth) VALUES
    ('John Smith', '+250788123456', '1199050123456', '1990-05-15'),
    ('Mary Johnson', '+250788234567', '1198508223456', '1985-08-22'),
    ('David Wilson', '+250788345678', '1199512034567', '1995-12-03'),
    ('Sarah Brown', '+250788456789', '1198807114567', '1988-07-11'),
    ('Mike Davis', '+250788567890', '1199203284567', '1992-03-28')
ON CONFLICT (phone_number) DO NOTHING;

-- Insert queue entries
DO $$
DECLARE
    doctor1_id UUID;
    doctor2_id UUID;
    doctor3_id UUID;
    patient1_id UUID;
    patient2_id UUID;
    patient3_id UUID;
    patient4_id UUID;
    patient5_id UUID;
BEGIN
    -- Get doctor IDs
    SELECT id INTO doctor1_id FROM doctors WHERE name = 'Dr. Sarah Johnson' LIMIT 1;
    SELECT id INTO doctor2_id FROM doctors WHERE name = 'Dr. Michael Chen' LIMIT 1;
    SELECT id INTO doctor3_id FROM doctors WHERE name = 'Dr. Emily Davis' LIMIT 1;
    
    -- Get patient IDs
    SELECT id INTO patient1_id FROM patients WHERE full_name = 'John Smith' LIMIT 1;
    SELECT id INTO patient2_id FROM patients WHERE full_name = 'Mary Johnson' LIMIT 1;
    SELECT id INTO patient3_id FROM patients WHERE full_name = 'David Wilson' LIMIT 1;
    SELECT id INTO patient4_id FROM patients WHERE full_name = 'Sarah Brown' LIMIT 1;
    SELECT id INTO patient5_id FROM patients WHERE full_name = 'Mike Davis' LIMIT 1;
    
    -- Only add queue entries if we found the required IDs
    IF doctor1_id IS NOT NULL AND doctor2_id IS NOT NULL AND doctor3_id IS NOT NULL AND
       patient1_id IS NOT NULL AND patient2_id IS NOT NULL AND patient3_id IS NOT NULL AND
       patient4_id IS NOT NULL AND patient5_id IS NOT NULL THEN
        
        -- Clear existing queue entries for clean test
        DELETE FROM queue_entries;
        
        -- Add queue entries
        INSERT INTO queue_entries (patient_id, doctor_id, visit_reason, status, queue_number) VALUES
            (patient1_id, doctor1_id, 'Regular checkup', 'in_progress', 1),
            (patient2_id, doctor1_id, 'Follow-up consultation', 'waiting', 2),
            (patient3_id, doctor2_id, 'Heart consultation', 'waiting', 1),
            (patient4_id, doctor3_id, 'Child vaccination', 'waiting', 1),
            (patient5_id, doctor1_id, 'General consultation', 'waiting', 3);
    END IF;
END $$;

-- Insert a sample announcement
INSERT INTO announcements (title, message, priority, is_active) VALUES
    ('Welcome to MedQueue', 'Our patient queue management system is now live. Please check the display for your queue status.', 2, true);
