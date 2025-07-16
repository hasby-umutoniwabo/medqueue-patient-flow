import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, AlertCircle } from "lucide-react";

interface QueueEntry {
  id: string;
  queue_number: number;
  visit_reason: string;
  status: string;
  patients: {
    full_name: string;
  };
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
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchQueueEntries();
    fetchAnnouncements();
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Set up real-time subscriptions
    const queueChannel = supabase
      .channel('public-queue-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => fetchQueueEntries()
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
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(announcementChannel);
    };
  }, []);

  const fetchQueueEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('queue_entries')
        .select(`
          *,
          patients (
            full_name
          )
        `)
        .order('queue_number', { ascending: true });

      if (error) throw error;
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

  const currentPatient = queueEntries.find(entry => entry.status === 'in_progress');
  const waitingPatients = queueEntries.filter(entry => entry.status === 'waiting').slice(0, 5);
  const completedToday = queueEntries.filter(entry => entry.status === 'completed').length;

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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-2">MedQueue</h1>
          <p className="text-xl text-blue-100">Patient Queue Management System</p>
          <div className="text-2xl mt-4 font-mono">
            {currentTime.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Now Serving */}
          <div className="lg:col-span-2">
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center justify-center gap-2">
                    <User className="h-8 w-8 text-blue-600" />
                    Now Serving
                  </h2>
                  {currentPatient ? (
                    <div className="space-y-4">
                      <div className="text-8xl font-bold text-blue-600 mb-4">
                        #{currentPatient.queue_number}
                      </div>
                      <div className="text-2xl font-semibold text-gray-700">
                        {currentPatient.patients.full_name}
                      </div>
                      <Badge className="text-lg px-4 py-2 bg-green-100 text-green-800">
                        In Progress
                      </Badge>
                    </div>
                  ) : (
                    <div className="py-12">
                      <div className="text-6xl font-bold text-gray-400 mb-4">---</div>
                      <p className="text-xl text-gray-500">No patient currently being served</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <Card className="bg-white/90 backdrop-blur-sm border-0">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">{waitingPatients.length}</div>
                  <div className="text-sm text-gray-600">Waiting</div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 backdrop-blur-sm border-0">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">{completedToday}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 backdrop-blur-sm border-0">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">{queueEntries.length}</div>
                  <div className="text-sm text-gray-600">Total Today</div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Waiting Queue */}
          <div>
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-blue-600" />
                  Up Next
                </h3>
                <div className="space-y-3">
                  {waitingPatients.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No patients waiting</p>
                  ) : (
                    waitingPatients.map((entry, index) => (
                      <div 
                        key={entry.id} 
                        className={`p-3 rounded-lg border-2 ${
                          index === 0 ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-lg text-gray-800">
                              #{entry.queue_number}
                            </div>
                            <div className="text-sm text-gray-600">
                              {entry.patients.full_name}
                            </div>
                          </div>
                          {index === 0 && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Next
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Announcements */}
            {announcements.length > 0 && (
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl mt-6">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Announcements</h3>
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
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-blue-100">
          <p className="text-lg">Please wait for your number to be called</p>
          <p className="text-sm mt-2">Thank you for your patience</p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementScreen;
