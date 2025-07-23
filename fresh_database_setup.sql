-- Simple database setup for MedQueue Patient Flow System
-- Run this in your Supabase SQL Editor

-- First, let's check and create tables one by one

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS doctor_otps CASCADE;
DROP TABLE IF EXISTS queue_entries CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;

-- Create doctors table
CREATE TABLE doctors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    specialization VARCHAR(255) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create patients table
CREATE TABLE patients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    national_id VARCHAR(20) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    emergency_contact VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create queue_entries table
CREATE TABLE queue_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
    visit_reason TEXT NOT NULL,
    queue_number INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    estimated_wait_time INTEGER DEFAULT 15,
    called_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create announcements table
CREATE TABLE announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    priority INTEGER DEFAULT 1 CHECK (priority IN (1, 2, 3)),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create doctor_otps table for authentication
CREATE TABLE doctor_otps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    otp_code VARCHAR(10) NOT NULL,
    phone_or_email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_queue_entries_patient_id ON queue_entries(patient_id);
CREATE INDEX idx_queue_entries_doctor_id ON queue_entries(doctor_id);
CREATE INDEX idx_queue_entries_status ON queue_entries(status);
CREATE INDEX idx_queue_entries_status_doctor ON queue_entries(status, doctor_id);
CREATE INDEX idx_queue_entries_queue_number ON queue_entries(queue_number);
CREATE INDEX idx_queue_entries_estimated_wait ON queue_entries(estimated_wait_time);
CREATE INDEX idx_doctors_available ON doctors(is_available);
CREATE INDEX idx_patients_phone ON patients(phone_number);
CREATE INDEX idx_patients_national_id ON patients(national_id);

-- Enable RLS (Row Level Security) on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_otps ENABLE ROW LEVEL SECURITY;

-- Create policies for all tables (allow all operations for now)
CREATE POLICY "Allow all operations on patients" ON patients
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on doctors" ON doctors
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on queue_entries" ON queue_entries
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on announcements" ON announcements
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on doctor_otps" ON doctor_otps
    FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data
-- Insert doctors with Rwandan names
INSERT INTO doctors (name, email, specialization, is_available) VALUES
    ('Dr. Jean-Baptiste Nzeyimana', 'jb.nzeyimana@medqueue.rw', 'General Medicine', true),
    ('Dr. Marie-Claire Uwimana', 'mc.uwimana@medqueue.rw', 'Cardiology', true),
    ('Dr. Emmanuel Muhire', 'e.muhire@medqueue.rw', 'Pediatrics', true),
    ('Dr. Diane Mukamana', 'd.mukamana@medqueue.rw', 'Internal Medicine', true),
    ('Dr. Paul Nkurunziza', 'p.nkurunziza@medqueue.rw', 'Surgery', true);

-- Insert patients with national_id
INSERT INTO patients (full_name, phone_number, national_id, date_of_birth) VALUES
    ('John Smith', '+250788123456', '1199050123456', '1990-05-15'),
    ('Mary Johnson', '+250788234567', '1198508223456', '1985-08-22'),
    ('David Wilson', '+250788345678', '1199512034567', '1995-12-03'),
    ('Sarah Brown', '+250788456789', '1198807114567', '1988-07-11'),
    ('Mike Davis', '+250788567890', '1199203284567', '1992-03-28');

-- Insert queue entries using a stored procedure approach
DO $$
DECLARE
    doctor1_id UUID;
    doctor2_id UUID;
    doctor3_id UUID;
    doctor4_id UUID;
    doctor5_id UUID;
    patient1_id UUID;
    patient2_id UUID;
    patient3_id UUID;
    patient4_id UUID;
    patient5_id UUID;
BEGIN
    -- Get doctor IDs
    SELECT id INTO doctor1_id FROM doctors WHERE name = 'Dr. Jean-Baptiste Nzeyimana';
    SELECT id INTO doctor2_id FROM doctors WHERE name = 'Dr. Marie-Claire Uwimana';
    SELECT id INTO doctor3_id FROM doctors WHERE name = 'Dr. Emmanuel Muhire';
    SELECT id INTO doctor4_id FROM doctors WHERE name = 'Dr. Diane Mukamana';
    SELECT id INTO doctor5_id FROM doctors WHERE name = 'Dr. Paul Nkurunziza';
    
    -- Get patient IDs
    SELECT id INTO patient1_id FROM patients WHERE full_name = 'John Smith';
    SELECT id INTO patient2_id FROM patients WHERE full_name = 'Mary Johnson';
    SELECT id INTO patient3_id FROM patients WHERE full_name = 'David Wilson';
    SELECT id INTO patient4_id FROM patients WHERE full_name = 'Sarah Brown';
    SELECT id INTO patient5_id FROM patients WHERE full_name = 'Mike Davis';
    
    -- Add queue entries
    INSERT INTO queue_entries (patient_id, doctor_id, visit_reason, status, queue_number, estimated_wait_time) VALUES
        (patient1_id, doctor1_id, 'Regular checkup', 'in_progress', 1, 0),
        (patient2_id, doctor1_id, 'Follow-up consultation', 'waiting', 2, 15),
        (patient3_id, doctor2_id, 'Heart consultation', 'waiting', 1, 15),
        (patient4_id, doctor3_id, 'Child vaccination', 'waiting', 1, 15),
        (patient5_id, doctor4_id, 'General consultation', 'waiting', 1, 15);
END $$;

-- Insert a sample announcement
INSERT INTO announcements (title, message, priority, is_active) VALUES
    ('Welcome to MedQueue', 'Our patient queue management system is now live. Please check the display for your queue status.', 2, true);
