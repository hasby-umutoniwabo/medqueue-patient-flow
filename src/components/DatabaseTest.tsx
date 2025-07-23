// Quick test component to verify database connection
import { useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const DatabaseTest = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [isAddingData, setIsAddingData] = useState(false);

  useEffect(() => {
    runTests();
  }, []);

  const runTests = async () => {
    console.log('Starting database tests...');
    
    try {
      // Test 1: Check doctors table
      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('*');
      
      console.log('Doctors test:', { doctors, error: doctorsError });
      
      // Test 2: Check patients table  
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .select('*');
        
      console.log('Patients test:', { patients, error: patientsError });
      
      // Test 3: Check queue_entries table
      const { data: queue, error: queueError } = await supabase
        .from('queue_entries')
        .select(`
          *,
          patients (full_name),
          doctors (name, specialization)
        `);
        
      console.log('Queue test:', { queue, error: queueError });
      
      setTestResults({
        doctors: { count: doctors?.length || 0, error: doctorsError },
        patients: { count: patients?.length || 0, error: patientsError },
        queue: { count: queue?.length || 0, error: queueError }
      });
      
    } catch (error) {
      console.error('Database test failed:', error);
      setTestResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
  };

  const addTestData = async () => {
    setIsAddingData(true);
    try {
      // Add doctors
      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .upsert([
          { name: 'Dr. Sarah Johnson', specialization: 'General Medicine', is_available: true },
          { name: 'Dr. Michael Chen', specialization: 'Cardiology', is_available: true },
          { name: 'Dr. Emily Davis', specialization: 'Pediatrics', is_available: true }
        ], { onConflict: 'name' })
        .select();

      console.log('Added doctors:', doctors);

      // Add patients
      const { data: patients, error: patientsError } = await supabase
        .from('patients')
        .upsert([
          { full_name: 'John Smith', phone_number: '+250788123456', date_of_birth: '1990-05-15' },
          { full_name: 'Mary Johnson', phone_number: '+250788234567', date_of_birth: '1985-08-22' },
          { full_name: 'David Wilson', phone_number: '+250788345678', date_of_birth: '1995-12-03' }
        ], { onConflict: 'phone_number' })
        .select();

      console.log('Added patients:', patients);

      if (doctors && patients && doctors.length > 0 && patients.length > 0) {
        // Add queue entries
        const { data: queueEntries, error: queueError } = await supabase
          .from('queue_entries')
          .upsert([
            {
              patient_id: patients[0].id,
              doctor_id: doctors[0].id,
              visit_reason: 'Regular checkup',
              status: 'being_served',
              queue_number: 1
            },
            {
              patient_id: patients[1].id,
              doctor_id: doctors[0].id,
              visit_reason: 'Follow-up consultation',
              status: 'waiting',
              queue_number: 2
            },
            {
              patient_id: patients[2].id,
              doctor_id: doctors[1].id,
              visit_reason: 'Heart consultation',
              status: 'waiting',
              queue_number: 1
            }
          ])
          .select();

        console.log('Added queue entries:', queueEntries);
      }

      // Refresh test results
      await runTests();
      alert('Test data added successfully!');
      
    } catch (error) {
      console.error('Error adding test data:', error);
      alert('Error adding test data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsAddingData(false);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#f0f0f0', margin: '20px', borderRadius: '8px', color: '#333' }}>
      <h3>Database Connection Test</h3>
      <div style={{ marginBottom: '10px' }}>
        <button 
          onClick={addTestData} 
          disabled={isAddingData}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: isAddingData ? 'not-allowed' : 'pointer',
            opacity: isAddingData ? 0.6 : 1
          }}
        >
          {isAddingData ? 'Adding Test Data...' : 'Add Test Data'}
        </button>
        <button 
          onClick={runTests}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            marginLeft: '10px',
            cursor: 'pointer'
          }}
        >
          Refresh Tests
        </button>
      </div>
      <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto' }}>
        {JSON.stringify(testResults, null, 2)}
      </pre>
    </div>
  );
};
