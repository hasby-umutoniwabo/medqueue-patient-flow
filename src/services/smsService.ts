// Holds the main settings for sending SMS messages
interface PindoConfig {
  token: string;
  sender: string;
  apiUrl: string;
}


// Describes the result of trying to send an SMS
interface SMSResponse {
  success: boolean;
  message?: string;
  error?: string;
}


// Basic info about a patient
interface Patient {
  id: string;
  full_name: string;
  phone_number: string;
}


// Handles sending SMS notifications to patients
class SMSService {
  private config: PindoConfig;

  constructor() {
    // Set up the SMS service with the needed credentials and sender info
    this.config = {
      token: 'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE4NDY4NDM2OTcsImlhdCI6MTc1MjE0OTI5NywiaWQiOiJ1c2VyXzAxSlpUM1I2V0g3MFE3TjNSSDg4RTNHQjcwIiwicmV2b2tlZF90b2tlbl9jb3VudCI6MH0.sq-7ppJvklc_bO7ztrq0_1iPYLYWyL9g4zrbnj8AC2G5dm7UQrx2veDzQYhob8jDe24LT5oQbFj55EYm9kjLHw',
      sender: 'PindoTest',
      apiUrl: 'https://api.pindo.io/v1/sms'
    };
  }

  // Makes sure the phone number is in the right format for sending SMS
  validatePhone(phone: string): string | null {
    const cleaned = phone.replace(/\D/g, '');
    if (/^2507\d{8}$/.test(cleaned)) return cleaned;       // 2507xxxxxxxx
    if (/^07\d{8}$/.test(cleaned)) return `25${cleaned}`; // 07xxxxxxxx → 2507xxxxxxxx
    if (/^7\d{8}$/.test(cleaned)) return `250${cleaned}`;  // 7xxxxxxxxx → 2507xxxxxxxx
    return null;
  }

  // Actually sends the SMS message to the patient
  async sendSMS(phone: string, message: string): Promise<SMSResponse> {
    if (!this.config.token || !this.config.sender || !this.config.apiUrl) {
      console.error('SMS service not configured properly');
      return { success: false, error: 'SMS service not configured' };
    }

    const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
    
    try {
      const response = await fetch(`${this.config.apiUrl}/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: formattedPhone,
          text: message,
          sender: this.config.sender
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log(`✓ SMS sent to ${formattedPhone}: "${message}"`);
        return { success: true, message: 'SMS sent successfully' };
      } else {
        console.error(`✗ Failed to send SMS to ${formattedPhone}:`, result.message || result.error);
        return { success: false, error: result.message || result.error || 'Failed to send SMS' };
      }
    } catch (error) {
      console.error(`✗ SMS service error for ${formattedPhone}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Creates the first message a patient gets when joining the queue
  generateWelcomeMessage(patientName: string, queuePosition: number, doctorName?: string): string {
    const doctorInfo = doctorName ? ` with ${doctorName}` : '';
    
    if (queuePosition <= 5) {
      return `Dear ${patientName}, You're in the Hospital Digital Queue${doctorInfo}. Your number is ${queuePosition}. Please stay nearby, you are among the next 5 to be served.`;
    } else {
      return `Dear ${patientName}, You're in the Hospital Digital Queue${doctorInfo}. Your number is ${queuePosition}. You will receive notifications once you are in the top 5 people next.`;
    }
  }

  // Creates a message based on where the patient is in the queue
  generatePositionMessage(patientName: string, position: number): string | null {
    if (position === 0) {
      return `Dear ${patientName}, please proceed to the medical room. It's your turn.`;
    } else if (position === 1) {
      return `Dear ${patientName}, ${position} person is ahead of you. You're next, Be on Standby.`;
    } else if (position <= 4 && position >= 2) {
      return `Dear ${patientName}, ${position} people are ahead of you. Stay nearby.`;
    } else if (position === 5) {
      return `Dear ${patientName}, 4 people are ahead. We'll call you soon.`;
    }
    return null; // No notification for positions >5
  }

  // Sends the welcome SMS to a new patient in the queue
  async sendWelcomeMessage(patient: Patient, queuePosition: number, doctorName?: string): Promise<SMSResponse> {
    const validatedPhone = this.validatePhone(patient.phone_number);
    if (!validatedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const message = this.generateWelcomeMessage(patient.full_name, queuePosition, doctorName);
    return this.sendSMS(validatedPhone, message);
  }

  // Sends an update to the patient about their current position in the queue
  async sendPositionUpdate(patient: Patient, position: number): Promise<SMSResponse> {
    const validatedPhone = this.validatePhone(patient.phone_number);
    if (!validatedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const message = this.generatePositionMessage(patient.full_name, position);
    if (!message) {
      return { success: true, message: 'No notification needed for this position' };
    }

    return this.sendSMS(validatedPhone, message);
  }

  // Notifies the patient that it's their turn to see the doctor
  async sendPatientCalledMessage(patient: Patient): Promise<SMSResponse> {
    const validatedPhone = this.validatePhone(patient.phone_number);
    if (!validatedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const message = `Dear ${patient.full_name}, please proceed to the medical room. It's your turn.`;
    return this.sendSMS(validatedPhone, message);
  }

  // Lets the patient know they are next in line
  async sendYouAreNextMessage(patient: Patient): Promise<SMSResponse> {
    const validatedPhone = this.validatePhone(patient.phone_number);
    if (!validatedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const message = `Dear ${patient.full_name}, you're next in line. Please be ready to enter the medical room when called.`;
    return this.sendSMS(validatedPhone, message);
  }

  // Tells the patient they are now in the top 5 in the queue
  async sendTop5Message(patient: Patient): Promise<SMSResponse> {
    const validatedPhone = this.validatePhone(patient.phone_number);
    if (!validatedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const message = `Dear ${patient.full_name}, you're now among the top 5 patients. Please stay nearby and be ready to be called soon.`;
    return this.sendSMS(validatedPhone, message);
  }

  // Tells the patient they are now in the top 3 in the queue
  async sendTop3Message(patient: Patient): Promise<SMSResponse> {
    const validatedPhone = this.validatePhone(patient.phone_number);
    if (!validatedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const message = `Dear ${patient.full_name}, you're now in the top 3! Please prepare and stay very close to the medical area.`;
    return this.sendSMS(validatedPhone, message);
  }

  // Tells the patient they are now 2nd in line
  async sendTop2Message(patient: Patient): Promise<SMSResponse> {
    const validatedPhone = this.validatePhone(patient.phone_number);
    if (!validatedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const message = `Dear ${patient.full_name}, you're 2nd in line. Please be ready as you'll be called very soon.`;
    return this.sendSMS(validatedPhone, message);
  }

  // Notifies the patient if they missed their turn
  async sendNoShowMessage(patient: Patient): Promise<SMSResponse> {
    const validatedPhone = this.validatePhone(patient.phone_number);
    if (!validatedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    const message = `Dear ${patient.full_name}, it's been more than 5 minutes since you were called. We've moved to the next patient and you're marked as no-show. Please visit reception to reschedule.`;
    return this.sendSMS(validatedPhone, message);
  }

  // Checks if the SMS service is ready to use
  isConfigured(): boolean {
    return !!(this.config.token && this.config.sender && this.config.apiUrl);
  }
}


// Export a ready-to-use SMS service instance
export const smsService = new SMSService();
export default smsService;