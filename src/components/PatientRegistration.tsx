// Main patient registration component - handles the entire patient journey from ID entry to queue ticket
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSmsNotifications } from "@/hooks/useSmsNotifications";
import { Calendar, User, Phone, FileText, AlertCircle, IdCard, MessageSquare, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import Navigation from "@/components/Navigation";

// Patient form data structure - everything we need to collect from patients
interface PatientFormData {
  national_id: string;
  full_name: string;
  phone_number: string;
  date_of_birth: string;
  emergency_contact: string;
  visit_reason: 'general_consultation' | 'follow_up' | 'emergency' | 'other';
  doctor_id: string;
  sms_notifications_enabled: boolean; // Most patients want notifications, so default to true
}

// Doctor info with queue status - helps patients make informed choices
interface Doctor {
  id: string;
  name: string;
  specialization: string;
  is_available: boolean;
  waiting_count?: number; // How many patients are waiting for this doctor
  current_patient?: string; // Name of patient currently being seen
}

const PatientRegistration = () => {
  // Step management - guides users through the registration flow
  const [step, setStep] = useState<'nid_entry' | 'new_patient_form' | 'doctor_selection' | 'visit_reason' | 'queue_ticket'>('nid_entry');
  
  // Patient identification and data
  const [nationalId, setNationalId] = useState('');
  const [existingPatient, setExistingPatient] = useState<any>(null); // Stores patient data if they're already registered
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  
  // Form data with sensible defaults
  const [formData, setFormData] = useState<PatientFormData>({
    national_id: '',
    full_name: '',
    phone_number: '',
    date_of_birth: '',
    emergency_contact: '',
    visit_reason: 'general_consultation', // Most common reason, so good default
    doctor_id: '',
    sms_notifications_enabled: true // Most people want to be notified
  });
  
  // UI state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  
  // Custom hooks for notifications and feedback
  const { toast } = useToast();
  const { sendWelcomeSMS } = useSmsNotifications();

  // Validation functions - keeping things user-friendly but secure
  
  const validateNationalId = (nid: string): boolean => {
    // Rwandan National ID format: 16 digits, always starts with 1
    // This is the official format used in Rwanda's national ID system
    const nidRegex = /^1\d{15}$/;
    return nidRegex.test(nid);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Rwanda phone numbers: +2507XXXXXXXX or 07XXXXXXXX (10 digits total)
    // We support both international and local formats for user convenience
    const phoneRegex = /^(\+2507|07)\d{8}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone: string): string => {
    // Convert local format (07XXXXXXXX) to international format (+2507XXXXXXXX)
    // This ensures consistency in our database and SMS sending
    if (phone.startsWith('07')) {
      return '+2507' + phone.substring(2); // Remove '07' and add '+2507'
    }
    return phone;
  };

  const displayPhoneNumber = (phone: string): string => {
    // Make phone numbers more readable: +2507XX XXX XXX
    // Easier for users to verify their numbers at a glance
    if (phone.startsWith('+2507')) {
      const digits = phone.substring(5);
      return `+2507${digits.substring(0, 2)} ${digits.substring(2, 5)} ${digits.substring(5)}`;
    }
    return phone;
  };

  useEffect(() => {
    // Load doctors when component mounts and keep the list fresh
    fetchDoctors();
    
    // Set up real-time subscription for queue updates
    // This way patients see live updates while selecting their doctor
    const channel = supabase
      .channel('queue-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'queue_entries' },
        () => {
          // Only refresh doctor queue info when patients are on the doctor selection step
          // No need to waste resources if they're not looking at this data
          if (step === 'doctor_selection') {
            fetchDoctors();
          }
        }
      )
      .subscribe();

    // Clean up subscription when component unmounts to prevent memory leaks
    return () => {
      supabase.removeChannel(channel);
    };
  }, [step]); // Re-run when step changes

  const fetchDoctors = async () => {
    try {
      // First, get all available doctors from the database
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_available', true) // Only show doctors who are currently available
        .order('name', { ascending: true }); // Alphabetical order for consistency

      if (doctorsError) throw doctorsError;

      // Now enhance each doctor's info with current queue status
      // This helps patients make informed decisions about which doctor to see
      const doctorsWithQueue = await Promise.all(
        (doctorsData || []).map(async (doctor) => {
          // Get the count of patients currently waiting for this doctor
          const { count: waitingCount } = await supabase
            .from('queue_entries')
            .select('*', { count: 'exact', head: true })
            .eq('doctor_id', doctor.id)
            .eq('status', 'waiting');

          // Find out if this doctor is currently seeing a patient
          const { data: currentPatientData } = await supabase
            .from('queue_entries')
            .select(`
              queue_number,
              patients!inner (
                full_name
              )
            `)
            .eq('doctor_id', doctor.id)
            .eq('status', 'in_progress')
            .single();

          return {
            ...doctor,
            waiting_count: waitingCount || 0,
            // Handle the case where patients might be an array or single object
            current_patient: Array.isArray(currentPatientData?.patients) 
              ? (currentPatientData.patients.length > 0 ? currentPatientData.patients[0].full_name : null)
              : (currentPatientData?.patients as any)?.full_name || null
          };
        })
      );

      setDoctors(doctorsWithQueue);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load available doctors.",
        variant: "destructive",
      });
    }
  };

  const handleNationalIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Start with a clean slate - clear any previous error messages
    setValidationErrors({});
    
    // Basic check to make sure they actually entered something
    if (!nationalId.trim()) {
      setValidationErrors({ national_id: 'National ID is required' });
      return;
    }

    // Check if the National ID follows Rwanda's format (16 digits starting with 1)
    if (!validateNationalId(nationalId)) {
      setValidationErrors({ 
        national_id: 'Invalid National ID format. Must be 16 digits starting with 1 (e.g., 1xxxxxxxxxxxxxxx)' 
      });
      toast({
        title: "Invalid National ID",
        description: "National ID must be 16 digits starting with 1",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Checking patient with National ID:', nationalId);
      
      // Let's see if this patient already exists in our system
      const { data: patient, error } = await supabase
        .from('patients')
        .select('*')
        .eq('national_id', nationalId)
        .single();

      console.log('Patient lookup result:', patient, error);

      // PGRST116 is Supabase's way of saying "record not found" - that's fine
      if (error && error.code !== 'PGRST116') {
        console.error('Patient lookup error:', error);
        throw error;
      }

      if (patient) {
        // They're already in our system! Let's welcome them back
        setExistingPatient(patient);
        setFormData(prev => ({ 
          ...prev, 
          national_id: nationalId, 
          visit_reason: 'general_consultation',
          // Fill in their existing info so validation passes smoothly
          full_name: patient.full_name,
          phone_number: patient.phone_number,
          date_of_birth: patient.date_of_birth,
          emergency_contact: patient.emergency_contact || ''
        }));
        setStep('visit_reason');
        toast({
          title: `Welcome back, ${patient.full_name}!`,
          description: "Please select your reason for visit.",
        });
      } else {
        // New patient - let's get their information
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

  const handleVisitReasonSubmit = async () => {
    setIsSubmitting(true);
    try {
      console.log('Joining queue with visit reason:', formData.visit_reason, 'and doctor:', formData.doctor_id);
      
      // First, let's figure out what their queue number will be
      // We count how many people are already waiting for this doctor
      const { count, error: countError } = await supabase
        .from('queue_entries')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting')
        .eq('doctor_id', formData.doctor_id);
      
      if (countError) {
        console.error('Error getting queue count:', countError);
        throw countError;
      }
      
      // Their position will be the next number in line
      const currentPosition = (count || 0) + 1;
      console.log('Current queue position for doctor:', currentPosition);
      
      // Make sure we have patient data ready (this should always exist at this point)
      if (!existingPatient) {
        console.error('No patient data available');
        throw new Error('Patient data not found');
      }
      
      console.log('Using patient ID:', existingPatient.id);
      
      // Now let's add them to the queue officially
      const { error: queueEntryError } = await supabase
        .from('queue_entries')
        .insert([
          {
            patient_id: existingPatient.id,
            doctor_id: formData.doctor_id,
            queue_number: currentPosition,
            visit_reason: formData.visit_reason,
            estimated_wait_time: currentPosition * 15, // Rough estimate: 15 minutes per patient
            status: 'waiting',
          },
        ]);
      
      if (queueEntryError) {
        console.error('Queue entry error:', queueEntryError);
        throw queueEntryError;
      }
      
      console.log('Successfully joined queue');
      setQueuePosition(currentPosition);
      setQueuePosition(currentPosition); // This line appears twice, might be a duplicate
      setStep('queue_ticket');
      
      // If they opted in for SMS updates, send them a welcome message
      if (formData.sms_notifications_enabled) {
        const patientForSMS = {
          id: existingPatient.id,
          full_name: existingPatient.full_name,
          phone_number: existingPatient.phone_number
        };
        
        const selectedDoctor = doctors.find(d => d.id === formData.doctor_id);
        const doctorName = selectedDoctor?.name;
        
        // Send the SMS in the background - don't make the patient wait for it
        sendWelcomeSMS(patientForSMS, currentPosition, doctorName).catch(error => {
          console.error('Failed to send welcome SMS:', error);
        });
      }
      
      // Show success message with their queue number
      toast({
        title: "Successfully Joined Queue",
        description: `Your queue number is ${String(currentPosition).padStart(3, '0')}`,
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

  const validateNewPatientForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Make sure they entered their full name - pretty important for medical records!
    if (!formData.full_name.trim()) {
      errors.full_name = 'Full name is required';
    }

    // Phone number validation - we need this for SMS notifications and emergencies
    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone_number)) {
      errors.phone_number = 'Invalid phone number format. Use 07XXXXXXXX or +2507XXXXXXXX';
    }

    // Emergency contact is optional, but if they provide one, it should be valid
    if (formData.emergency_contact && !validatePhoneNumber(formData.emergency_contact)) {
      errors.emergency_contact = 'Invalid emergency contact format. Use 07XXXXXXXX or +2507XXXXXXXX';
    }

    // Date of birth validation - we need this for medical purposes
    if (!formData.date_of_birth) {
      errors.date_of_birth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.date_of_birth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      // Sanity check - no one should be negative age or over 150 years old
      if (age < 0 || age > 150) {
        errors.date_of_birth = 'Please enter a valid date of birth';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewPatientContinue = async () => {
    // If this is an existing patient, we already have their info - just move to doctor selection
    if (existingPatient) {
      setStep('doctor_selection');
      return;
    }

    // For brand new patients, we need to validate everything they entered
    if (validateNewPatientForm()) {
      // Clean up the phone numbers to match our standard format
      const formattedData = {
        ...formData,
        phone_number: formatPhoneNumber(formData.phone_number),
        emergency_contact: formData.emergency_contact ? formatPhoneNumber(formData.emergency_contact) : ''
      };
      
      setFormData(formattedData);
      
      // Now let's save their information to the database
      setIsSubmitting(true);
      try {
        console.log('Creating new patient:', formattedData);
        
        const { data: insertData, error: patientError } = await supabase
          .from('patients')
          .insert([
            {
              national_id: formattedData.national_id,
              full_name: formattedData.full_name,
              phone_number: formattedData.phone_number,
              date_of_birth: formattedData.date_of_birth,
              emergency_contact: formattedData.emergency_contact || null,
            },
          ])
          .select('*')
          .single();
          
        console.log('Patient insert result:', insertData, patientError);
        
        if (patientError) {
          console.error('Patient creation error:', patientError);
          throw patientError;
        }
        
        // Store their data so we can use it for the queue entry later
        setExistingPatient(insertData);
        
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
    } else {
      // There were validation errors - let them know to fix them
      toast({
        title: "Validation Error",
        description: "Please fix the errors and try again",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    // When someone wants to start over, we reset everything back to the beginning
    // This is useful if they made a mistake or if they want to register a different patient
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
      doctor_id: '',
      sms_notifications_enabled: true
    });
    setValidationErrors({});
    setQueuePosition(0);
    setQueuePosition(0); // This appears to be duplicated - might want to remove one
  };

  // RENDERING SECTION
  // Each step of the registration process has its own UI
  // This makes the flow easier to manage and understand

  // Step 1: National ID Entry - where patients start their journey
  if (step === 'nid_entry') {
    return (
      <>
        <Navigation variant="minimal" />
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
                    onChange={(e) => {
                      setNationalId(e.target.value);
                      // Clear validation error when user starts typing
                      if (validationErrors.national_id) {
                        setValidationErrors(prev => ({ ...prev, national_id: '' }));
                      }
                    }}
                    className={`text-xl h-14 text-center ${validationErrors.national_id ? 'border-red-500' : ''}`}
                    placeholder="1xxxxxxxxxxxxxxx"
                    autoFocus
                    maxLength={16}
                  />
                  {validationErrors.national_id && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.national_id}</p>
                  )}
                  <p className="text-gray-500 text-sm">16 digits, starting with 1</p>
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
      </>
    );
  }

  // Step 2: New Patient Form - for first-time visitors to fill out their details
  if (step === 'new_patient_form') {
    return (
      <>
        <Navigation variant="minimal" />
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
              <form onSubmit={(e) => {
                e.preventDefault();
                handleNewPatientContinue();
              }} className="space-y-4">
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
                    onChange={(e) => {
                      setFormData({...formData, full_name: e.target.value});
                      // Clear validation error when user starts typing
                      if (validationErrors.full_name) {
                        setValidationErrors(prev => ({ ...prev, full_name: '' }));
                      }
                    }}
                    className={`h-12 ${validationErrors.full_name ? 'border-red-500' : ''}`}
                    placeholder="Enter your full name"
                  />
                  {validationErrors.full_name && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.full_name}</p>
                  )}
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
                    onChange={(e) => {
                      setFormData({...formData, phone_number: e.target.value});
                      // Clear validation error when user starts typing
                      if (validationErrors.phone_number) {
                        setValidationErrors(prev => ({ ...prev, phone_number: '' }));
                      }
                    }}
                    className={`h-12 ${validationErrors.phone_number ? 'border-red-500' : ''}`}
                    placeholder="07XXXXXXXX or +2507XXXXXXXX"
                  />
                  {validationErrors.phone_number && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.phone_number}</p>
                  )}
                  {/* <p className="text-gray-500 text-sm">Format: 07XXXXXXXX or +25007XXXXXXXX</p> */}
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
                    onChange={(e) => {
                      setFormData({...formData, date_of_birth: e.target.value});
                      // Clear validation error when user starts typing
                      if (validationErrors.date_of_birth) {
                        setValidationErrors(prev => ({ ...prev, date_of_birth: '' }));
                      }
                    }}
                    className={`h-12 ${validationErrors.date_of_birth ? 'border-red-500' : ''}`}
                  />
                  {validationErrors.date_of_birth && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.date_of_birth}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    type="tel"
                    value={formData.emergency_contact}
                    onChange={(e) => {
                      setFormData({...formData, emergency_contact: e.target.value});
                      // Clear validation error when user starts typing
                      if (validationErrors.emergency_contact) {
                        setValidationErrors(prev => ({ ...prev, emergency_contact: '' }));
                      }
                    }}
                    className={`h-12 ${validationErrors.emergency_contact ? 'border-red-500' : ''}`}
                    placeholder="07XXXXXXXX or +2507XXXXXXXX (Optional)"
                  />
                  {validationErrors.emergency_contact && (
                    <p className="text-red-500 text-sm mt-1">{validationErrors.emergency_contact}</p>
                  )}
                  {/* <p className="text-gray-500 text-sm">Optional - Format: 07XXXXXXXX or +25007XXXXXXXX</p> */}
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
                    {isSubmitting ? "Registering..." : "Continue"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    );
  }

  // Step 3: Doctor Selection - patients choose which doctor they want to see
  // Shows real-time queue information to help them make informed decisions
  if (step === 'doctor_selection') {
    return (
      <>
        <Navigation variant="minimal" />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
        <div className="max-w-md mx-auto pt-12">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">Select Doctor</CardTitle>
              <CardDescription className="text-blue-100">
                Choose your preferred doctor for consultation
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Available Doctors *
                  </Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={fetchDoctors}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                </div>
                
                {doctors.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No doctors available</p>
                    <p className="text-sm text-gray-400">Please contact staff for assistance</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {doctors.map((doctor) => (
                      <div
                        key={doctor.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          formData.doctor_id === doctor.id
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, doctor_id: doctor.id }))}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{doctor.name}</h3>
                            <p className="text-gray-600 mb-2">{doctor.specialization}</p>
                            
                            {/* Queue Status */}
                            <div className="space-y-1 text-sm">
                              {doctor.current_patient ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-green-700">
                                    Currently serving: {doctor.current_patient}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                                  <span className="text-gray-600">Available</span>
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3 text-gray-500" />
                                <span className="text-gray-600">
                                  {doctor.waiting_count || 0} patient{(doctor.waiting_count || 0) !== 1 ? 's' : ''} waiting
                                </span>
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                Est. wait: {((doctor.waiting_count || 0) + (doctor.current_patient ? 1 : 0)) * 15} minutes
                              </div>
                            </div>
                          </div>
                          
                          {formData.doctor_id === doctor.id && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center ml-4">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setStep('visit_reason')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleVisitReasonSubmit}
                    disabled={!formData.doctor_id || doctors.length === 0 || isSubmitting}
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
      </>
    );
  }

  // Step 4: Visit Reason Selection - patients specify why they're visiting today
  // This helps doctors prepare and affects queue management
  if (step === 'visit_reason') {
    const patientName = existingPatient?.full_name || formData.full_name;
    
    return (
      <>
        <Navigation variant="minimal" />
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
                    onClick={handleNewPatientContinue}
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    );
  }

  // Step 5: Queue Ticket Display - the final confirmation screen
  // Shows their queue number, estimated wait time, and next steps
  if (step === 'queue_ticket') {
    const estimatedWait = queuePosition * 15;
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const selectedDoctor = doctors.find(d => d.id === formData.doctor_id);
    
    return (
      <>
        <Navigation variant="minimal" />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-4">
          <div className="max-w-md mx-auto pt-20">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center bg-blue-600 text-white rounded-t-lg">
              <CardTitle className="text-2xl">Queue Ticket</CardTitle>
              <CardDescription className="text-blue-100">Please keep this information</CardDescription>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="text-6xl font-bold text-blue-600 mb-2">{String(queuePosition).padStart(3, '0')}</div>
                <div className="text-lg text-gray-600">Your Queue Number</div>
              </div>
              
              <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-lg mb-6">
                {selectedDoctor && (
                  <div className="flex justify-between">
                    <span>Doctor:</span>
                    <span className="font-semibold">{selectedDoctor.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Your Position:</span>
                  <span className="font-semibold">{queuePosition} in queue</span>
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
      </>
    );
  }

  return null;
};

export default PatientRegistration;