import { useState } from 'react';
import { smsService } from '@/services/smsService';
import { useToast } from '@/hooks/use-toast';

// Patient data structure for SMS notifications
interface Patient {
  id: string;
  full_name: string;
  phone_number: string;
}

// All the SMS notification functions this hook provides
// Covers the complete patient journey from registration to completion
interface SMSHookReturn {
  sendWelcomeSMS: (patient: Patient, queuePosition: number, doctorName?: string) => Promise<boolean>;
  sendPatientCalledSMS: (patient: Patient) => Promise<boolean>;
  sendPositionUpdateSMS: (patient: Patient, position: number) => Promise<boolean>;
  sendYouAreNextSMS: (patient: Patient) => Promise<boolean>;
  sendTop5SMS: (patient: Patient) => Promise<boolean>;
  sendTop3SMS: (patient: Patient) => Promise<boolean>;
  sendTop2SMS: (patient: Patient) => Promise<boolean>;
  sendNoShowSMS: (patient: Patient) => Promise<boolean>;
  isLoading: boolean;
  isSMSEnabled: boolean;
}

// Custom hook that handles all SMS notifications for the medical queue system
// Provides consistent error handling and user feedback across all SMS types
export const useSmsNotifications = (): SMSHookReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if SMS service is properly configured before trying to send
  const isSMSEnabled = smsService.isConfigured();

  // Welcome SMS - sent when patient first joins the queue
  // Includes their queue number and doctor info to set expectations
  const sendWelcomeSMS = async (patient: Patient, queuePosition: number, doctorName?: string): Promise<boolean> => {
    if (!isSMSEnabled) {
      console.warn('SMS service not configured');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await smsService.sendWelcomeMessage(patient, queuePosition, doctorName);
      
      if (result.success) {
        toast({
          title: "Welcome SMS Sent",
          description: `SMS sent to ${patient.full_name}`,
        });
        return true;
      } else {
        console.error('Failed to send welcome SMS:', result.error);
        toast({
          title: "SMS Failed",
          description: result.error || "Failed to send welcome SMS",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Welcome SMS error:', error);
      toast({
        title: "SMS Error",
        description: "An error occurred while sending SMS",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Patient called SMS - urgent notification that it's their turn to see the doctor
  // This is the most important SMS as it tells them to come to the consultation room
  const sendPatientCalledSMS = async (patient: Patient): Promise<boolean> => {
    if (!isSMSEnabled) {
      console.warn('SMS service not configured');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await smsService.sendPatientCalledMessage(patient);
      
      if (result.success) {
        toast({
          title: "Patient Notified",
          description: `SMS sent to ${patient.full_name}`,
        });
        return true;
      } else {
        console.error('Failed to send patient called SMS:', result.error);
        toast({
          title: "SMS Failed",
          description: result.error || "Failed to notify patient",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Patient called SMS error:', error);
      toast({
        title: "SMS Error",
        description: "An error occurred while notifying patient",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Position update SMS - keeps patients informed about their place in line
  // Only sends for positions 1-5 to avoid spamming patients who are far back
  const sendPositionUpdateSMS = async (patient: Patient, position: number): Promise<boolean> => {
    if (!isSMSEnabled) {
      console.warn('SMS service not configured');
      return false;
    }

    // Only send position updates for positions 0-5 (matching pindo.js logic)
    if (position > 5) {
      return true; // Success but no SMS needed
    }

    setIsLoading(true);
    try {
      const result = await smsService.sendPositionUpdate(patient, position);
      
      if (result.success) {
        if (result.message?.includes('No notification needed')) {
          return true; // Success but no SMS needed for this position
        }
        
        toast({
          title: "Position Update Sent",
          description: `SMS sent to ${patient.full_name}`,
        });
        return true;
      } else {
        console.error('Failed to send position update SMS:', result.error);
        toast({
          title: "SMS Failed",
          description: result.error || "Failed to send position update",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Position update SMS error:', error);
      toast({
        title: "SMS Error",
        description: "An error occurred while sending position update",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // "You are next" SMS - sent to the patient who will be called after the current one
  // Helps them prepare and stay nearby so they don't miss their turn
  const sendYouAreNextSMS = async (patient: Patient): Promise<boolean> => {
    if (!isSMSEnabled) {
      console.warn('SMS service not configured');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await smsService.sendYouAreNextMessage(patient);
      
      if (result.success) {
        toast({
          title: "Next Patient Notified",
          description: `SMS sent to ${patient.full_name}`,
        });
        return true;
      } else {
        console.error('Failed to send you are next SMS:', result.error);
        toast({
          title: "SMS Failed",
          description: result.error || "Failed to notify next patient",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('You are next SMS error:', error);
      toast({
        title: "SMS Error",
        description: "An error occurred while notifying next patient",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Top 5 position SMS - notifies patients they're in the top 5
  // Lets them know they should start getting ready but don't need to rush yet
  const sendTop5SMS = async (patient: Patient): Promise<boolean> => {
    if (!isSMSEnabled) {
      console.warn('SMS service not configured');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await smsService.sendTop5Message(patient);
      
      if (result.success) {
        toast({
          title: "Top 5 Notification Sent",
          description: `SMS sent to ${patient.full_name}`,
        });
        return true;
      } else {
        console.error('Failed to send top 5 SMS:', result.error);
        toast({
          title: "SMS Failed",
          description: result.error || "Failed to send top 5 notification",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Top 5 SMS error:', error);
      toast({
        title: "SMS Error",
        description: "An error occurred while sending top 5 notification",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Top 3 position SMS - more urgent notification that they're very close
  // Time to head back to the waiting area if they stepped out
  const sendTop3SMS = async (patient: Patient): Promise<boolean> => {
    if (!isSMSEnabled) {
      console.warn('SMS service not configured');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await smsService.sendTop3Message(patient);
      
      if (result.success) {
        toast({
          title: "Top 3 Notification Sent",
          description: `SMS sent to ${patient.full_name}`,
        });
        return true;
      } else {
        console.error('Failed to send top 3 SMS:', result.error);
        toast({
          title: "SMS Failed",
          description: result.error || "Failed to send top 3 notification",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Top 3 SMS error:', error);
      toast({
        title: "SMS Error",
        description: "An error occurred while sending top 3 notification",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Top 2 position SMS - very urgent, they're second in line
  // Should be ready and present in the waiting area
  const sendTop2SMS = async (patient: Patient): Promise<boolean> => {
    if (!isSMSEnabled) {
      console.warn('SMS service not configured');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await smsService.sendTop2Message(patient);
      
      if (result.success) {
        toast({
          title: "Top 2 Notification Sent",
          description: `SMS sent to ${patient.full_name}`,
        });
        return true;
      } else {
        console.error('Failed to send top 2 SMS:', result.error);
        toast({
          title: "SMS Failed",
          description: result.error || "Failed to send top 2 notification",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Top 2 SMS error:', error);
      toast({
        title: "SMS Error",
        description: "An error occurred while sending top 2 notification",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // No-show SMS - sent when a patient doesn't respond to being called
  // Informs them they missed their turn and need to re-register if they still want to be seen
  const sendNoShowSMS = async (patient: Patient): Promise<boolean> => {
    if (!isSMSEnabled) {
      console.warn('SMS service not configured');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await smsService.sendNoShowMessage(patient);
      
      if (result.success) {
        toast({
          title: "No-Show Notification Sent",
          description: `SMS sent to ${patient.full_name}`,
        });
        return true;
      } else {
        console.error('Failed to send no-show SMS:', result.error);
        toast({
          title: "SMS Failed",
          description: result.error || "Failed to send no-show notification",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('No-show SMS error:', error);
      toast({
        title: "SMS Error",
        description: "An error occurred while sending no-show notification",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Return all SMS functions and status indicators
  // These can be used throughout the app to send notifications at the right times
  return {
    sendWelcomeSMS,
    sendPatientCalledSMS,
    sendPositionUpdateSMS,
    sendYouAreNextSMS,
    sendTop5SMS,
    sendTop3SMS,
    sendTop2SMS,
    sendNoShowSMS,
    isLoading,
    isSMSEnabled
  };
};