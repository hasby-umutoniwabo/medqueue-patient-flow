import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, Shield } from "lucide-react";

interface DoctorLoginProps {
  onLoginSuccess: () => void;
}

const DoctorLogin = ({ onLoginSuccess }: DoctorLoginProps) => {
  const [step, setStep] = useState<'contact' | 'otp'>('contact');
  const [contactInfo, setContactInfo] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpId, setOtpId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactInfo.trim()) return;

    setIsSubmitting(true);
    try {
      console.log('Sending OTP for:', contactInfo);
      let otpId = '';
      // Try to call the send_otp function
      const { data, error } = await supabase.rpc('send_otp', {
        contact_info: contactInfo
      });
      if (!error && data) {
        otpId = data;
      } else {
        // Fallback: Insert OTP directly for dev
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min expiry
        const { data: insertData, error: insertError } = await supabase
          .from('doctor_otps')
          .insert([
            {
              otp_code: '10001',
              phone_or_email: contactInfo,
              expires_at: expiresAt,
              used: false,
            },
          ])
          .select('id')
          .single();
        if (insertError || !insertData) {
          throw insertError || new Error('Failed to insert dev OTP');
        }
        otpId = insertData.id;
      }
      setOtpId(otpId);
      setStep('otp');
      toast({
        title: "OTP Sent",
        description: "Development Mode: Use OTP code 10001",
      });
    } catch (error) {
      console.error('Error sending OTP:', error);
      toast({
        title: "Error",
        description: "Failed to send OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setIsSubmitting(true);
    try {
      console.log('Verifying OTP:', otpCode, 'for ID:', otpId);
      // Check if OTP is valid
      const { data: otpRecord, error: otpError } = await supabase
        .from('doctor_otps')
        .select('*')
        .eq('id', otpId)
        .eq('otp_code', otpCode)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();
      console.log('OTP verification result:', otpRecord, otpError);
      if (otpError || !otpRecord) {
        throw new Error('Invalid or expired OTP');
      }
      // Mark OTP as used
      const { error: updateError } = await supabase
        .from('doctor_otps')
        .update({ used: true })
        .eq('id', otpId);
      if (updateError) {
        console.error('Error updating OTP:', updateError);
      }
      // Check if doctor exists in doctors table - use OR condition properly
      const { data: doctors, error: doctorError } = await supabase
        .from('doctors')
        .select('*')
        .or(`name.eq.${contactInfo},email.eq.${contactInfo}`);
      console.log('Doctor lookup result:', doctors, doctorError, 'ContactInfo:', contactInfo);
      if (doctorError || !doctors || doctors.length === 0) {
        throw new Error('Doctor not found in system');
      }
      const doctor = doctors[0];
      toast({
        title: "Login Successful",
        description: `Welcome, ${doctor.name}!`,
      });
      // Store doctor info in localStorage for session management
      localStorage.setItem('medqueue_doctor', JSON.stringify(doctor));
      onLoginSuccess();
    } catch (error) {
      console.error('Error verifying OTP:', error);
      toast({
        title: "Authentication Failed",
        description: error instanceof Error ? error.message : "Invalid OTP or doctor not found. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep('contact');
    setContactInfo('');
    setOtpCode('');
    setOtpId('');
  };

  // Contact Information Entry
  if (step === 'contact') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center bg-slate-800 text-white rounded-t-lg">
            <CardTitle className="text-2xl flex items-center justify-center gap-2">
              <Shield className="h-6 w-6" />
              Doctor Login
            </CardTitle>
            <CardDescription className="text-slate-200">
              Enter your name or email address
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Test Accounts:</strong><br/>
                Phone: +1234567890, +1234567891, +1234567892<br/>
                Email: sarah.johnson@clinic.com, michael.chen@clinic.com, emily.davis@clinic.com
              </p>
            </div> */}
            
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_info" className="text-lg">Doctor Name or Email</Label>
                <Input
                  id="contact_info"
                  type="text"
                  required
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  className="h-12 text-lg"
                  placeholder="Enter your name or email"
                  autoFocus
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={isSubmitting || !contactInfo.trim()}
                className="w-full bg-slate-800 hover:bg-slate-900 h-12 text-lg"
              >
                {isSubmitting ? "Sending OTP..." : "Send OTP"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // OTP Verification
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardHeader className="text-center bg-slate-800 text-white rounded-t-lg">
            <CardTitle className="text-2xl">Enter OTP</CardTitle>
            <CardDescription className="text-slate-200">
              Check your phone/email for the verification code
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Development Mode:</strong> Use OTP code <strong>10001</strong>
              </p>
            </div>
            
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp_code" className="text-lg">OTP Code</Label>
                <Input
                  id="otp_code"
                  type="text"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="h-12 text-lg text-center"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  autoFocus
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !otpCode.trim()}
                  className="flex-1 bg-slate-800 hover:bg-slate-900"
                >
                  {isSubmitting ? "Verifying..." : "Login"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default DoctorLogin;
