import { useState } from 'react';
import { smsService } from '@/services/smsService';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  full_name: string;
  phone_number: string;
}

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

export const useSmsNotifications = (): SMSHookReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const isSMSEnabled = smsService.isConfigured();

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