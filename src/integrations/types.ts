export interface Database {
  public: {
    Tables: {
      patients: {
        Row: {
          id: string;
          national_id: string;
          full_name: string;
          phone_number: string;
          date_of_birth: string;
          emergency_contact: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          national_id: string;
          full_name: string;
          phone_number: string;
          date_of_birth: string;
          emergency_contact?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          national_id?: string;
          full_name?: string;
          phone_number?: string;
          date_of_birth?: string;
          emergency_contact?: string | null;
          created_at?: string;
        };
      };
      doctors: {
        Row: {
          id: string;
          name: string;
          specialization: string;
          email: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          specialization: string;
          email: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          specialization?: string;
          email?: string;
          is_available?: boolean;
          created_at?: string;
        };
      };
      queue_entries: {
        Row: {
          id: string;
          patient_id: string;
          doctor_id: string;
          queue_number: number;
          visit_reason: string;
          estimated_wait_time: number;
          status: string;
          created_at: string;
          called_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          patient_id: string;
          doctor_id: string;
          queue_number: number;
          visit_reason: string;
          estimated_wait_time: number;
          status?: string;
          created_at?: string;
          called_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          patient_id?: string;
          doctor_id?: string;
          queue_number?: number;
          visit_reason?: string;
          estimated_wait_time?: number;
          status?: string;
          created_at?: string;
          called_at?: string | null;
          completed_at?: string | null;
        };
      };
      doctor_otps: {
        Row: {
          id: string;
          doctor_id: string;
          otp_code: string;
          created_at: string;
          expires_at: string;
          used: boolean;
        };
        Insert: {
          id?: string;
          doctor_id: string;
          otp_code: string;
          created_at?: string;
          expires_at: string;
          used?: boolean;
        };
        Update: {
          id?: string;
          doctor_id?: string;
          otp_code?: string;
          created_at?: string;
          expires_at?: string;
          used?: boolean;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
