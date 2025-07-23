
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSmsNotifications } from "@/hooks/useSmsNotifications";
import { User, Clock, Phone, FileText, UserCheck, UserX, Stethoscope } from "lucide-react";

interface QueueEntry {
  id: string;
  queue_number: number;
  visit_reason: string;
  status: string;
  estimated_wait_time: number;
  created_at: string;
  doctor_id: string;
  patients: {
    full_name: string;
    phone_number: string;
    date_of_birth: string;
  };
  doctors: {
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

const DoctorDashboard = () => {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPatient, setCurrentPatient] = useState<QueueEntry | null>(null);
  const { toast } = useToast();
  const { sendPatientCalledSMS, sendYouAreNextSMS } = useSmsNotifications();

  useEffect(() => {
    fetchDoctors();
    fetchQueueEntries();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('queue-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => fetchQueueEntries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  // sendPositionNotifications function removed - replaced with targeted SMS logic

  const fetchQueueEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select(`
          *,
          patients (
            full_name,
            phone_number,
            date_of_birth
          ),
          doctors (
            name,
            specialization
          )
        `)
        .order('queue_number', { ascending: true });

      if (error) throw error;
      
      setQueueEntries(data || []);
      
      // Set current patient (first in_progress or first waiting)
      const inProgress = data?.find(entry => entry.status === 'in_progress');
      const nextWaiting = data?.find(entry => entry.status === 'waiting');
      setCurrentPatient(inProgress || nextWaiting || null);
      
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const callNextPatient = async () => {
    const filteredEntries = selectedDoctorId === 'all' 
      ? queueEntries 
      : queueEntries.filter(entry => entry.doctor_id === selectedDoctorId);
    
    const nextPatient = filteredEntries.find(entry => entry.status === 'waiting');
    if (!nextPatient) {
      toast({
        title: "No patients waiting",
        description: selectedDoctorId === 'all' ? "The queue is empty." : "No patients waiting for this doctor.",
      });
      return;
    }

    try {
      // First, complete any existing "in_progress" patients for this doctor
      const inProgressPatients = filteredEntries.filter(entry => entry.status === 'in_progress');
      if (inProgressPatients.length > 0) {
        const { error: completeError } = await supabase
          .from('queue_entries')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .in('id', inProgressPatients.map(p => p.id));

        if (completeError) {
          console.error('Error completing previous patients:', completeError);
          // Continue anyway, don't block the new patient call
        }
      }

      // Then call the next patient
      const { error } = await supabase
        .from('queue_entries')
        .update({ 
          status: 'in_progress',
          called_at: new Date().toISOString()
        })
        .eq('id', nextPatient.id);

      if (error) throw error;

      // Send SMS notification to the patient being called
      const calledPatientForSMS = {
        id: nextPatient.id,
        full_name: nextPatient.patients.full_name,
        phone_number: nextPatient.patients.phone_number
      };
      
      // Send SMS in background, don't block the UI
      sendPatientCalledSMS(calledPatientForSMS).catch(error => {
        console.error('Failed to send patient called SMS:', error);
      });

      // Find the NEW next patient (after calling current one) and notify them they're next
      const remainingWaitingPatients = filteredEntries.filter(entry => 
        entry.status === 'waiting' && entry.id !== nextPatient.id
      );
      
      if (remainingWaitingPatients.length > 0) {
        const newNextPatient = remainingWaitingPatients[0]; // First in waiting queue
        const nextPatientForSMS = {
          id: newNextPatient.id,
          full_name: newNextPatient.patients.full_name,
          phone_number: newNextPatient.patients.phone_number
        };
        
        // Send "You're next" SMS to the new next patient
        sendYouAreNextSMS(nextPatientForSMS).catch(error => {
          console.error('Failed to send you are next SMS:', error);
        });
      }

      // Refresh data after calling patient
      await fetchQueueEntries();

      toast({
        title: "Patient Called",
        description: `Patient ${nextPatient.queue_number} has been called.`,
      });
    } catch (error) {
      console.error('Error calling patient:', error);
      toast({
        title: "Error",
        description: "Failed to call patient. Please try again.",
        variant: "destructive",
      });
    }
  };

  const completeConsultation = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', patientId);

      if (error) throw error;

      // Refresh data after completion
      await fetchQueueEntries();

      toast({
        title: "Consultation Completed",
        description: "Patient has been marked as completed.",
      });
    } catch (error) {
      console.error('Error completing consultation:', error);
      toast({
        title: "Error",
        description: "Failed to complete consultation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const markNoShow = async (patientId: string) => {
    try {
      const { error } = await supabase
        .from('queue_entries')
        .update({ status: 'cancelled' })
        .eq('id', patientId);

      if (error) throw error;

      // Refresh data after marking no show
      await fetchQueueEntries();

      toast({
        title: "Marked as No Show",
        description: "Patient has been marked as no show.",
      });
    } catch (error) {
      console.error('Error marking no show:', error);
      toast({
        title: "Error",
        description: "Failed to mark as no show. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVisitReasonLabel = (reason: string) => {
    switch (reason) {
      case 'general_consultation': return 'General Consultation';
      case 'follow_up': return 'Follow-up';
      case 'emergency': return 'Emergency';
      case 'other': return 'Other';
      default: return reason;
    }
  };

  const completedToday = queueEntries.filter(entry => entry.status === 'completed').length;

  // Filter based on selected doctor
  const filteredQueueEntries = selectedDoctorId === 'all' 
    ? queueEntries 
    : queueEntries.filter(entry => entry.doctor_id === selectedDoctorId);
  const filteredWaitingPatients = filteredQueueEntries.filter(entry => entry.status === 'waiting');
  const filteredInProgressPatients = filteredQueueEntries.filter(entry => entry.status === 'in_progress');
  const filteredActivePatients = filteredQueueEntries.filter(entry => entry.status === 'waiting' || entry.status === 'in_progress');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Dashboard</h1>
          <p className="text-gray-600">Manage patient queue and consultations</p>
        </div>

        {/* Doctor Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <User className="h-5 w-5 text-gray-600" />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Filter by Doctor
                </label>
                <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a doctor" />
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Waiting</p>
                  <p className="text-2xl font-bold text-yellow-600">{filteredWaitingPatients.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredInProgressPatients.length}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed Today</p>
                  <p className="text-2xl font-bold text-green-600">{completedToday}</p>
                </div>
                <UserX className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Active</p>
                  <p className="text-2xl font-bold text-purple-600">{filteredActivePatients.length}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Patient & Call Next */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Patient</CardTitle>
              <CardDescription>Currently being seen</CardDescription>
            </CardHeader>
            <CardContent>
              {currentPatient ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">#{currentPatient.queue_number}</p>
                      <p className="text-lg font-medium">{currentPatient.patients.full_name}</p>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        {currentPatient.patients.phone_number}
                      </p>
                    </div>
                    <Badge className={getStatusColor(currentPatient.status)}>
                      {currentPatient.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => completeConsultation(currentPatient.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Complete
                    </Button>
                    <Button 
                      onClick={() => markNoShow(currentPatient.id)}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      No Show
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No patient currently being seen</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Queue Control</CardTitle>
              <CardDescription>Call the next patient</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="mb-4">
                  <p className="text-3xl font-bold text-blue-600">
                    {filteredWaitingPatients.length}
                  </p>
                  <p className="text-gray-600">Patients Waiting</p>
                </div>
                <Button 
                  onClick={callNextPatient}
                  disabled={filteredWaitingPatients.length === 0}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12"
                >
                  Call Next Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Queue List */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Queue</CardTitle>
            <CardDescription>Active patients waiting or in progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredActivePatients.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {selectedDoctorId === 'all' 
                    ? "No active patients in queue" 
                    : "No active patients for selected doctor"
                  }
                </p>
              ) : (
                filteredActivePatients.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-2xl font-bold text-blue-600">
                        #{entry.queue_number}
                      </div>
                      <div>
                        <p className="font-medium">{entry.patients.full_name}</p>
                        <p className="text-sm text-gray-600">{getVisitReasonLabel(entry.visit_reason)}</p>
                        <p className="text-sm text-blue-600">
                          Dr. {entry.doctors?.name || 'Unknown'} - {entry.doctors?.specialization || ''}
                        </p>
                        <p className="text-xs text-gray-500">
                          Registered: {new Date(entry.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DoctorDashboard;