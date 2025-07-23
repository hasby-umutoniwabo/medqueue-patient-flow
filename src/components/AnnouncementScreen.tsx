import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, User, AlertCircle, Users, RefreshCw, Filter } from "lucide-react";
import Navigation from "@/components/Navigation";

interface QueueEntry {
  id: string;
  queue_number: number;
  visit_reason: string;
  status: string;
  doctor_id: string;
  created_at: string;
  patients: {
    full_name: string;
  };
  doctors?: {
    id: string;
    name: string;
    specialization: string;
  };
}

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  is_available: boolean;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  priority: number;
  created_at: string;
}

const AnnouncementScreen = () => {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('all');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    fetchQueueEntries();
    fetchDoctors();
    fetchAnnouncements();

    // Set up time updates
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Set up periodic data refresh
    const dataInterval = setInterval(() => {
      fetchQueueEntries();
      fetchDoctors();
      setLastUpdated(new Date());
    }, 30000);

    // Set up real-time subscriptions
    const queueChannel = supabase
      .channel('public-queue-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => {
          fetchQueueEntries();
          setLastUpdated(new Date());
        }
      )
      .subscribe();

    const doctorChannel = supabase
      .channel('public-doctor-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'doctors' },
        () => {
          fetchDoctors();
          setLastUpdated(new Date());
        }
      )
      .subscribe();

    const announcementChannel = supabase
      .channel('public-announcements')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'announcements' },
        () => fetchAnnouncements()
      )
      .subscribe();

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(doctorChannel);
      supabase.removeChannel(announcementChannel);
    };
  }, []);

  // Refresh data function
  const initializeSampleData = async () => {
    try {
      console.log('Starting sample data initialization...');
      
      // First, add sample doctors
      const { data: addedDoctors, error: doctorError } = await supabase
        .from('doctors')
        .upsert([
          { name: 'Dr. Sarah Johnson', specialization: 'General Medicine', is_available: true },
          { name: 'Dr. Michael Chen', specialization: 'Cardiology', is_available: true },
          { name: 'Dr. Emily Davis', specialization: 'Pediatrics', is_available: true }
        ], { onConflict: 'name' })
        .select();

      if (doctorError) {
        console.error('Error adding doctors:', doctorError);
        return;
      }
      
      console.log('Doctors added:', addedDoctors);

      // Add sample patients with national_id (required field)
      const { data: addedPatients, error: patientError } = await supabase
        .from('patients')
        .upsert([
          { 
            full_name: 'John Smith', 
            phone_number: '+250788123456', 
            date_of_birth: '1990-05-15',
            national_id: '1199050123456'
          },
          { 
            full_name: 'Mary Johnson', 
            phone_number: '+250788234567', 
            date_of_birth: '1985-08-22',
            national_id: '1198508223456'
          },
          { 
            full_name: 'David Wilson', 
            phone_number: '+250788345678', 
            date_of_birth: '1995-12-03',
            national_id: '1199512034567'
          },
          { 
            full_name: 'Sarah Brown', 
            phone_number: '+250788456789', 
            date_of_birth: '1988-07-11',
            national_id: '1198807114567'
          }
        ], { onConflict: 'phone_number' })
        .select();

      if (patientError) {
        console.error('Error adding patients:', patientError);
        return;
      }
      
      console.log('Patients added:', addedPatients);

      if (addedDoctors && addedDoctors.length > 0 && addedPatients && addedPatients.length > 0) {
        // Add sample queue entries
        const { data: addedQueueEntries, error: queueError } = await supabase
          .from('queue_entries')
          .upsert([
            {
              patient_id: addedPatients[0].id,
              doctor_id: addedDoctors[0].id,
              visit_reason: 'Regular checkup',
              status: 'in_progress',
              queue_number: 1
            },
            {
              patient_id: addedPatients[1].id,
              doctor_id: addedDoctors[0].id,
              visit_reason: 'Follow-up consultation',
              status: 'waiting',
              queue_number: 2
            },
            {
              patient_id: addedPatients[2].id,
              doctor_id: addedDoctors[1].id,
              visit_reason: 'Heart consultation',
              status: 'waiting',
              queue_number: 1
            },
            {
              patient_id: addedPatients[3].id,
              doctor_id: addedDoctors[2].id,
              visit_reason: 'Child vaccination',
              status: 'waiting',
              queue_number: 1
            }
          ])
          .select();

        if (queueError) {
          console.error('Error adding queue entries:', queueError);
          return;
        }
        
        console.log('Queue entries added:', addedQueueEntries);
      }

      // Refresh data
      console.log('Refreshing data after initialization...');
      await fetchDoctors();
      await fetchQueueEntries();
      
      console.log('Sample data initialization completed successfully!');
    } catch (error) {
      console.error('Error initializing sample data:', error);
    }
  };  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name');

      if (error) throw error;
      
      if (!data || data.length === 0) {
        // Initialize with sample data if no doctors exist
        console.log('No doctors found, initializing sample data...');
        await initializeSampleData();
        return; // initializeSampleData will call fetchDoctors again
      }
      
      console.log('Doctors loaded:', data);
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const fetchQueueEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select(`
          *,
          patients (
            full_name
          ),
          doctors (
            id,
            name,
            specialization
          )
        `)
        .order('queue_number', { ascending: true });

      if (error) throw error;
      console.log('Queue entries loaded:', data);
      console.log('Queue entries by status:', {
        waiting: data?.filter(e => e.status === 'waiting').length || 0,
        in_progress: data?.filter(e => e.status === 'in_progress').length || 0,
        completed: data?.filter(e => e.status === 'completed').length || 0,
        cancelled: data?.filter(e => e.status === 'cancelled').length || 0
      });
      setQueueEntries(data || []);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  // Filter queue entries based on selected doctor
  const filteredQueueEntries = selectedDoctor === 'all' 
    ? queueEntries 
    : queueEntries.filter(entry => entry.doctor_id === selectedDoctor);

  const currentPatient = filteredQueueEntries.find(entry => entry.status === 'in_progress');
  const waitingPatients = filteredQueueEntries.filter(entry => entry.status === 'waiting').slice(0, 8);
  
  // Calculate statistics - for the display, show totals for selected doctor or all
  // Filter by today's date for completed entries
  const today = new Date().toISOString().split('T')[0];
  const completedToday = filteredQueueEntries.filter(entry => 
    entry.status === 'completed' && 
    entry.created_at?.startsWith(today)
  ).length;
  const totalWaiting = filteredQueueEntries.filter(entry => entry.status === 'waiting').length;
  const totalToday = filteredQueueEntries.filter(entry => 
    entry.created_at?.startsWith(today)
  ).length;

  const refreshData = async () => {
    await Promise.all([fetchQueueEntries(), fetchDoctors()]);
    setLastUpdated(new Date());
  };

  const getSelectedDoctorInfo = () => {
    if (selectedDoctor === 'all') return null;
    return doctors.find(doc => doc.id === selectedDoctor);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityIcon = (priority: number) => {
    return priority === 3 ? <AlertCircle className="h-4 w-4" /> : null;
  };

  return (
    <>
      <Navigation variant="floating" />
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mx-auto max-w-4xl border border-white/20">
            <h1 className="text-6xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              MedQueue
            </h1>
            <p className="text-2xl text-blue-100 mb-4">Patient Queue Management System</p>
            <div className="text-3xl font-mono text-white mb-2">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-2xl font-mono text-blue-100 mb-2">
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-sm text-blue-200 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Doctor Selection and Controls */}
        <div className="mb-6">
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <Filter className="h-5 w-5 text-gray-600" />
                  <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select doctor to view queue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Doctors</SelectItem>
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getSelectedDoctorInfo() && (
                    <div className="flex items-center gap-2">
                      <Badge className={getSelectedDoctorInfo()?.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {getSelectedDoctorInfo()?.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={refreshData}
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Update Display
                  </Button>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    Auto-refreshes every 30 seconds
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Now Serving */}
          <div className="lg:col-span-2">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-2">
                    <User className="h-8 w-8 text-blue-600" />
                    {selectedDoctor === 'all' ? 'Currently Being Served' : `${getSelectedDoctorInfo()?.name || 'Doctor'} - Currently Serving`}
                  </h2>
                  {currentPatient ? (
                    <div className="space-y-4">
                      <div className="text-8xl font-bold text-blue-600 mb-4">
                        #{currentPatient.queue_number}
                      </div>
                      <div className="text-2xl font-semibold text-gray-700">
                        {currentPatient.patients.full_name}
                      </div>
                      <div className="text-lg text-blue-600 mb-2">
                        Dr. {currentPatient.doctors?.name || 'Unknown'} - {currentPatient.doctors?.specialization || ''}
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        Reason: {currentPatient.visit_reason}
                      </div>
                      <Badge className="text-lg px-4 py-2 bg-green-100 text-green-800">
                        In Progress
                      </Badge>
                    </div>
                  ) : (
                    <div className="py-12">
                      <div className="text-6xl font-bold text-gray-400 mb-4">---</div>
                      <p className="text-xl text-gray-500">
                        {selectedDoctor === 'all' 
                          ? 'No patient currently being seen' 
                          : `${getSelectedDoctorInfo()?.name || 'Doctor'} is ready for next patient`
                        }
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Patient Queue Statistics */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{totalWaiting}</div>
                  <div className="text-sm text-gray-600">Patients Waiting</div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 backdrop-blur-sm border-0">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{completedToday}</div>
                  <div className="text-sm text-gray-600">Seen Today</div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 backdrop-blur-sm border-0">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{totalToday}</div>
                  <div className="text-sm text-gray-600">Total Visits {selectedDoctor === 'all' ? 'Today' : 'for Doctor'}</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Next Patients in Queue */}
          <div>
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                  {selectedDoctor === 'all' ? 'Next Patients' : `Queue for ${getSelectedDoctorInfo()?.name || 'Doctor'}`}
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {waitingPatients.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      {selectedDoctor === 'all' ? 'No patients currently waiting' : `No patients waiting for ${getSelectedDoctorInfo()?.name || 'this doctor'}`}
                    </p>
                  ) : (
                    waitingPatients.map((entry, index) => (
                      <div 
                        key={entry.id} 
                        className={`p-3 rounded-lg border-2 transition-all ${
                          index === 0 ? 'border-blue-300 bg-blue-50 shadow-md' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-bold text-lg text-gray-800">
                                #{entry.queue_number}
                              </div>
                              {index === 0 && (
                                <Badge className="bg-blue-100 text-blue-800 text-xs">
                                  Next
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm font-medium text-gray-700">
                              {entry.patients.full_name}
                            </div>
                            <div className="text-xs text-blue-600 mb-1">
                              Dr. {entry.doctors?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {entry.visit_reason}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              Estimated wait: {(index + 1) * 15} minutes
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-600">
                              {index + 1}
                            </div>
                            <div className="text-xs text-gray-500">
                              position in queue
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Queue Summary */}
                {waitingPatients.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-800 text-center">
                      <Users className="h-4 w-4 inline mr-1" />
                      {waitingPatients.length} patient{waitingPatients.length !== 1 ? 's' : ''} waiting
                      {selectedDoctor !== 'all' && (
                        <span className="block text-xs mt-1">
                          Avg. wait time: {Math.round((waitingPatients.length * 15) / 2)} minutes
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Announcements */}
            {announcements.length > 0 && (
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl mt-6">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Announcements
                  </h3>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {announcements.map((announcement) => (
                      <div 
                        key={announcement.id} 
                        className={`p-3 rounded-lg border ${getPriorityColor(announcement.priority)}`}
                      >
                        <div className="flex items-start gap-2">
                          {getPriorityIcon(announcement.priority)}
                          <div>
                            <div className="font-semibold text-sm">{announcement.title}</div>
                            <div className="text-xs mt-1">{announcement.message}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(announcement.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Real-time Status */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl mt-6">
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 text-green-600 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Live Updates</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Auto-refreshing every 30 seconds
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Patient Instructions */}
        <div className="text-center mt-8 text-blue-100">
          <p className="text-xl font-semibold">Please listen for your queue number to be called</p>
          <p className="text-lg mt-2">When your number is called, please proceed to the consultation room</p>
          <p className="text-sm mt-4 text-blue-200">Thank you for your patience • This display updates automatically</p>
          {selectedDoctor !== 'all' && getSelectedDoctorInfo() && (
            <p className="text-sm mt-2 text-blue-200">
              Currently viewing: Dr. {getSelectedDoctorInfo()?.name} - {getSelectedDoctorInfo()?.specialization}
            </p>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AnnouncementScreen;
