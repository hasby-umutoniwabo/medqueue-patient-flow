import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSmsNotifications } from "@/hooks/useSmsNotifications";
import { Calendar, User, Phone, FileText, AlertCircle, IdCard, MessageSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface PatientFormData {
  national_id: string;
  full_name: string;
  phone_number: string;
  date_of_birth: string;
  emergency_contact: string;
  visit_reason: 'general_consultation' | 'follow_up' | 'emergency' | 'other';
  sms_notifications_enabled: boolean;
}

const PatientRegistration = () => {
  const [step, setStep] = useState<'nid_entry' | 'new_patient_form' | 'visit_reason' | 'queue_ticket'>('nid_entry');
  const [nationalId, setNationalId] = useState('');
  const [existingPatient, setExistingPatient] = useState<any>(null);
  const [formData, setFormData] = useState<PatientFormData>({
    national_id: '',
    full_name: '',
    phone_number: '',
    date_of_birth: '',
    emergency_contact: '',
    visit_reason: 'general_consultation',
    sms_notifications_enabled: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueNumber, setQueueNumber] = useState<number | null>(null);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const { toast } = useToast();
  const { sendWelcomeSMS } = useSmsNotifications();

  const handleNationalIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationalId.trim()) return;

    setIsSubmitting(true);
    try {
      console.log('Checking patient with National ID:', nationalId);
      
      // Check if patient exists
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('national_id', nationalId)
        .single();

      console.log('Patient lookup result:', patient, error);

      if (error && error.code !== 'PGRST116') {
        console.error('Patient lookup error:', error);
        throw error;
      }

      if (patient) {
        // Existing patient - go directly to visit reason
        setExistingPatient(patient);
        setFormData(prev => ({ ...prev, national_id: nationalId, visit_reason: 'general_consultation' }));
        setStep('visit_reason');
        toast({
          title: `Welcome back, ${patient.full_name}!`,
          description: "Please select your reason for visit.",
        });
      } else {
        // New patient - go to registration form
        setFormData(prev => ({ ...prev, national_id: nationalId }));
        setStep('new_patient_form');
      }
    } catch (error) {
      console.error('Error checking patient:', error);
      toast({
        title: "Error",
        description: "Failed to check patient information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      console.log('Creating new patient:', formData);
      // Create new patient
      const { data: insertData, error: patientError } = await supabase
        .from('patients')
        .insert([
          {
            national_id: formData.national_id,
            full_name: formData.full_name,
            phone_number: formData.phone_number,
            date_of_birth: formData.date_of_birth,
            emergency_contact: formData.emergency_contact || null,
          },
        ])
        .select('*')
        .single();
      console.log('Patient insert result:', insertData, patientError);
      if (patientError) {
        console.error('Patient creation error:', patientError);
        throw patientError;
      }
      toast({
        title: "Registration Successful",
        description: "Your information has been saved. Please select your reason for visit.",
      });
      setStep('visit_reason');
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "Please try again or contact staff for assistance.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVisitReasonSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('Joining queue with visit reason:', formData.visit_reason);
      // Get current queue position
      const { count, error: countError } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting');
      if (countError) {
        console.error('Error getting queue count:', countError);
        throw countError;
      }
      const currentPosition = (count || 0) + 1;
      console.log('Current queue position:', currentPosition);
      // Generate queue number using the database function
      let queueData = null;
      let queueError = null;
      try {
        const rpcResult = await supabase.rpc('generate_queue_number');
        queueData = rpcResult.data;
        queueError = rpcResult.error;
      } catch (e) {
        queueError = e;
      }
      if (queueError) {
        console.error('Error generating queue number:', queueError);
        throw queueError;
      }
      console.log('Generated queue number:', queueData);
      // Get patient ID
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('national_id', formData.national_id)
        .single();
      if (patientError || !patient) {
        console.error('Patient not found:', patientError);
        throw new Error('Patient not found');
      }
      console.log('Found patient ID:', patient.id);
      // Add to queue
      const { error: queueEntryError } = await supabase
        .from('queue_entries')
        .insert([
          {
            patient_id: patient.id,
            queue_number: queueData,
            visit_reason: formData.visit_reason,
            estimated_wait_time: currentPosition * 15, // 15 minutes per patient
            status: 'waiting',
          },
        ]);
      if (queueEntryError) {
        console.error('Queue entry error:', queueEntryError);
        throw queueEntryError;
      }
      console.log('Successfully joined queue');
      setQueueNumber(queueData);
      setQueuePosition(currentPosition);
      setStep('queue_ticket');
      
      // Send welcome SMS if notifications are enabled
      if (formData.sms_notifications_enabled) {
        const patientForSMS = {
          id: patient.id,
          full_name: existingPatient?.full_name || formData.full_name,
          phone_number: existingPatient?.phone_number || formData.phone_number
        };
        
        // Send SMS in background, don't block the UI
        sendWelcomeSMS(patientForSMS, queueData).catch(error => {
          console.error('Failed to send welcome SMS:', error);
        });
      }
      
      toast({
        title: "Successfully Joined Queue",
        description: `Your queue number is ${String(queueData).padStart(3, '0')}`,
      });
    } catch (error) {
      console.error('Queue joining error:', error);
      toast({
        title: "Failed to Join Queue",
        description: error instanceof Error ? error.message : "Please try again or contact staff for assistance.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('nid_entry');
    setNationalId('');
    setExistingPatient(null);
    setFormData({
      national_id: '',
      full_name: '',
      phone_number: '',
      date_of_birth: '',
      emergency_contact: '',
      visit_reason: 'general_consultation',
      sms_notifications_enabled: true
    });
    setQueueNumber(null);
    setQueuePosition(0);
  };

  // National ID Entry Step
  if (step === 'nid_entry') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl flex items-center justify-center gap-2">
                <IdCard className="h-6 w-6" />
                Patient Check-in
              </CardTitle>
              <CardDescription className="text-blue-100">
                Enter your National ID to begin
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleNationalIdSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="national_id" className="text-lg">National ID Number</Label>
                  <Input
                    id="national_id"
                    type="text"
                    required
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    className="text-xl h-14 text-center"
                    placeholder="Enter your National ID"
                    autoFocus
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !nationalId.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12"
                >
                  {isSubmitting ? "Checking..." : "Continue"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // New Patient Registration Form
  if (step === 'new_patient_form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-md mx-auto pt-8">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">New Patient Registration</CardTitle>
              <CardDescription className="text-blue-100">
                Please fill in your information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleNewPatientSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Date of Birth *
                  </Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    required
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    type="tel"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                    className="h-12"
                    placeholder="Optional"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="sms_notifications"
                    checked={formData.sms_notifications_enabled}
                    onCheckedChange={(checked) => 
                      setFormData({...formData, sms_notifications_enabled: !!checked})
                    }
                  />
                  <Label htmlFor="sms_notifications" className="flex items-center gap-2 text-sm">
                    <MessageSquare className="h-4 w-4" />
                    Send me SMS notifications about my queue position
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('nid_entry')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? "Saving..." : "Continue"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Visit Reason Selection
  if (step === 'visit_reason') {
    const patientName = existingPatient?.full_name || formData.full_name;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-md mx-auto pt-12">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">
                {existingPatient ? `Welcome back, ${patientName}!` : `Welcome, ${patientName}!`}
              </CardTitle>
              <CardDescription className="text-blue-100">
                Please select your reason for visit
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Reason for Visit *
                  </Label>
                  <Select
                    value={formData.visit_reason}
                    onValueChange={(value: any) => setFormData({...formData, visit_reason: value})}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_consultation">General Consultation</SelectItem>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="emergency">
                        <span className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-500" />
                          Emergency
                        </span>
                      </SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => existingPatient ? setStep('nid_entry') : setStep('new_patient_form')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleVisitReasonSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? "Joining Queue..." : "Join Queue"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Queue Ticket Display
  if (step === 'queue_ticket') {
    const estimatedWait = queuePosition * 15;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-md mx-auto pt-20">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">Queue Ticket</CardTitle>
              <CardDescription className="text-blue-100">Please keep this information</CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="text-6xl font-bold text-blue-600 mb-2">{String(queueNumber).padStart(3, '0')}</div>
                <div className="text-lg text-gray-600">Your Queue Number</div>
              </div>
              
              <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg mb-6">
                <div className="flex justify-between">
                  <span>Your Position:</span>
                  <span className="font-semibold">{queuePosition} of {queuePosition}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Wait:</span>
                  <span className="font-semibold">{estimatedWait} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span>Current Time:</span>
                  <span className="font-semibold">{currentTime}</span>
                </div>
              </div>
              
              <div className="text-center text-gray-600 mb-6">
                <p className="mb-2">Please wait for your number to be called</p>
                <p className="text-sm">Thank you for your patience</p>
              </div>
              
              <Button onClick={resetForm} className="w-full bg-blue-600 hover:bg-blue-700">
                Register Another Patient
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default PatientRegistration;