-- Add test data to verify the queue system
-- Run this in Supabase SQL Editor

-- First, ensure we have doctors
INSERT INTO doctors (name, specialization, is_available) VALUES
    ('Dr. Sarah Johnson', 'General Medicine', true),
    ('Dr. Michael Chen', 'Cardiology', true),
    ('Dr. Emily Davis', 'Pediatrics', true)
ON CONFLICT DO NOTHING;

-- Add some test patients
INSERT INTO patients (full_name, phone_number, date_of_birth) VALUES
    ('John Smith', '+250788123456', '1990-05-15'),
    ('Mary Johnson', '+250788234567', '1985-08-22'),
    ('David Wilson', '+250788345678', '1995-12-03'),
    ('Sarah Brown', '+250788456789', '1988-07-11'),
    ('Mike Davis', '+250788567890', '1992-03-28')
ON CONFLICT (phone_number) DO NOTHING;

-- Add test queue entries
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
    
    -- Clear existing queue entries for clean test
    DELETE FROM queue_entries;
    
    -- Add queue entries
    INSERT INTO queue_entries (patient_id, doctor_id, visit_reason, status, queue_number) VALUES
        (patient1_id, doctor1_id, 'Regular checkup', 'being_served', 1),
        (patient2_id, doctor1_id, 'Follow-up consultation', 'waiting', 2),
        (patient3_id, doctor1_id, 'Blood pressure check', 'waiting', 3),
        (patient4_id, doctor2_id, 'Heart consultation', 'waiting', 1),
        (patient5_id, doctor3_id, 'Child vaccination', 'waiting', 1);
END $$;
